import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:productivity_mobile/models/five_s_model.dart';
import 'package:productivity_mobile/providers/auth_provider.dart';
import 'package:productivity_mobile/providers/five_s_provider.dart';
import 'package:productivity_mobile/providers/idea_provider.dart';
import 'package:productivity_mobile/providers/inbox_provider.dart';
import 'package:productivity_mobile/providers/task_provider.dart';
import 'package:productivity_mobile/providers/work_log_provider.dart';
import 'package:productivity_mobile/screens/home_screen.dart';
import 'package:productivity_mobile/services/outbox.dart';

import 'support/fake_api.dart';

/// A server that is out of reach until `online` is set.
class Network {
  bool online = false;
  final sent = <String>[];

  ResponseBody reply(RequestOptions request) {
    if (!online) {
      throw DioException.connectionError(
          requestOptions: request, reason: 'offline');
    }
    if (request.method != 'GET') sent.add('${request.method} ${request.path}');
    if (request.path == '/refused') {
      return jsonReply({'success': false, 'errorCode': 'NOT_FOUND'},
          status: 404);
    }
    if (request.method == 'GET') return jsonReply(envelope([]));
    return jsonReply(envelope({'id': 'server-id'}), status: 201);
  }
}

final _template = AuditTemplate.fromJson({
  'id': 't1',
  'title': 'Daily 5S',
  'questions': [
    {'id': 'q1', 'text': 'Floor clear', 'type': 'yes_no'},
  ],
});

final _zone =
    FiveSZone.fromJson({'id': 'z1', 'code': 'A1', 'name': 'Tool wall'});

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
      'keeps an audit walked with no signal, and sends it when the signal is back',
      () async {
    final network = Network();
    final (api, _, _) = await makeApi(network.reply);
    final outbox = Outbox(api);
    final fiveS = FiveSProvider(api, outbox: outbox);

    final recorded = await fiveS
        .submit(zone: _zone, template: _template, answers: {'q1': 'yes'});

    expect(recorded?.score, 100);
    expect(fiveS.lastKept, isTrue);
    expect(fiveS.error, isNull);
    expect(outbox.pending.single.path, '/audit-runs');

    network.online = true;
    expect(await outbox.flush(), 1);
    expect(outbox.pending, isEmpty);
    expect(network.sent, ['POST /audit-runs']);
  });

  test('survives the app being closed', () async {
    final network = Network();
    final (api, _, _) = await makeApi(network.reply);
    await Outbox(api).keep(
        method: 'POST',
        path: '/audit-runs',
        kind: 'audit',
        data: {'score': 80});

    final reopened = Outbox(api);
    await reopened.restore();

    expect(reopened.pending.single.data, {'score': 80});
  });

  test(
      'sends in the order the changes were made, and stops while still offline',
      () async {
    final network = Network();
    final (api, _, _) = await makeApi(network.reply);
    final outbox = Outbox(api);
    await outbox.keep(method: 'POST', path: '/first', kind: 'audit');
    await outbox.keep(method: 'PATCH', path: '/second', kind: 'task');

    expect(await outbox.flush(), 0);
    expect(outbox.pending, hasLength(2));

    network.online = true;
    await outbox.flush();
    expect(network.sent, ['POST /first', 'PATCH /second']);
  });

  test('drops a change the server refuses, and says so once', () async {
    final network = Network()..online = true;
    final (api, _, _) = await makeApi(network.reply);
    final outbox = Outbox(api);
    await outbox.keep(method: 'POST', path: '/refused', kind: 'redTag');
    await outbox.keep(method: 'POST', path: '/after', kind: 'redTag');

    await outbox.flush();

    expect(outbox.pending, isEmpty);
    expect(outbox.refused, 1);
    expect(network.sent, ['POST /refused', 'POST /after']);
  });

  test('keeps a day written up offline on today’s list, hours counted',
      () async {
    final network = Network();
    final (api, _, _) = await makeApi(network.reply);
    final outbox = Outbox(api);
    final logs = WorkLogProvider(api,
        outbox: outbox, clock: () => DateTime(2026, 9, 28, 17));

    expect(await logs.submit(summary: 'Cleared the dock', hours: 2), isTrue);

    expect(logs.lastKept, isTrue);
    expect(logs.hoursToday, 2);
    expect(outbox.pending.single.path, '/work-logs/daily');
  });

  test('project and task links survive an offline write, restart and replay',
      () async {
    final network = Network();
    final (api, adapter, _) = await makeApi(network.reply);
    final outbox = Outbox(api);
    final logs = WorkLogProvider(api,
        outbox: outbox, clock: () => DateTime(2026, 9, 28, 17));
    const payload = {
      'summary': 'Cleared the dock',
      'hours': 2.5,
      'logDate': '2026-09-28',
      'projectId': 'p1',
      'taskId': 't1',
      'blockers': 'Waiting for labels',
      'nextSteps': 'Mark the shelves',
    };

    expect(
        await logs.submit(
          summary: 'Cleared the dock',
          hours: 2.5,
          projectId: 'p1',
          taskId: 't1',
          blockers: 'Waiting for labels',
          nextSteps: 'Mark the shelves',
        ),
        isTrue);
    expect(logs.today.single.projectId, 'p1');
    expect(logs.today.single.taskId, 't1');
    expect(logs.today.single.nextSteps, 'Mark the shelves');
    expect(outbox.pending.single.data, payload);

    final reopened = Outbox(api);
    await reopened.restore();
    expect(reopened.pending.single.data, payload);
    network.online = true;
    expect(await reopened.flush(), 1);
    expect(reopened.pending, isEmpty);
    final sent = adapter.requests
        .lastWhere((request) => request.path == '/work-logs/daily');
    expect(sent.data, payload);
  });

  test(
      'a write-up whose answer timed out is kept, and sent again under the same key',
      () async {
    // The server may have saved it before the answer was lost; the key is
    // what keeps the retry from saving the day twice.
    var timedOut = true;
    final (api, adapter, _) = await makeApi((request) {
      if (request.method == 'GET') return jsonReply(envelope([]));
      if (timedOut) {
        throw DioException(
            requestOptions: request, type: DioExceptionType.receiveTimeout);
      }
      return jsonReply(envelope({'workLog': {'id': 'saved'}}), status: 201);
    });
    final outbox = Outbox(api);
    final logs = WorkLogProvider(api,
        outbox: outbox, clock: () => DateTime(2026, 9, 28, 17));

    expect(await logs.submit(summary: 'Cleared the dock', hours: 2), isTrue);
    expect(logs.lastKept, isTrue);
    final first = adapter.requests
        .lastWhere((request) => request.path == '/work-logs/daily');
    final key = first.headers['Idempotency-Key'] as String;
    expect(key, matches(RegExp(r'^[A-Za-z0-9_.:-]{8,100}$')));
    expect(outbox.pending.single.key, key);

    // Kept across a restart with its key.
    final reopened = Outbox(api);
    await reopened.restore();
    timedOut = false;
    expect(await reopened.flush(), 1);
    final retry = adapter.requests
        .lastWhere((request) => request.path == '/work-logs/daily');
    expect(retry.headers['Idempotency-Key'], key);
  });

  // The line drops after the request went out. Dio calls that a connection
  // error, the same as no signal at all, so the phone cannot know whether the
  // server has it. Kept under the key it was first sent with, the copy sent
  // later is the same write to the server; under a new key it was saved
  // twice (network_drop_live_test.dart shows both on a real server).
  test('an idea, an audit and a red tag whose answers were lost keep the key they were first sent with',
      () async {
    var dropped = true;
    final (api, adapter, _) = await makeApi((request) {
      if (request.method == 'GET') return jsonReply(envelope([]));
      if (dropped) {
        throw DioException.connectionError(
            requestOptions: request,
            reason: 'Connection closed before full header was received');
      }
      return jsonReply(envelope({'id': 'saved'}), status: 201);
    });
    final outbox = Outbox(api);
    final fiveS = FiveSProvider(api, outbox: outbox);
    final plan = FiveSPlan.fromJson({'id': 'p1', 'name': 'Floor', 'zones': []});
    List<Object?> keysOf(Iterable<RequestOptions> requests) => [
          for (final request in requests.where((request) => request.method == 'POST'))
            request.headers['Idempotency-Key']
        ];

    await IdeaProvider(api, outbox: outbox).submit(title: 'Label the shelves');
    await fiveS.submit(zone: _zone, template: _template, answers: {'q1': 'yes'});
    await fiveS.addRedTag(plan, _zone, title: 'Broken pallet');

    final firstKeys = keysOf(adapter.requests);
    expect(firstKeys, hasLength(3));
    expect(firstKeys, everyElement(isA<String>()));
    expect(firstKeys.toSet(), hasLength(3), reason: 'one key per change');
    expect(outbox.pending.map((item) => item.key), firstKeys);

    dropped = false;
    final sentBefore = adapter.requests.length;
    expect(await outbox.flush(), 3);
    expect(keysOf(adapter.requests.skip(sentBefore)), firstKeys);
  });

  test('keeps a change whose first copy is still being saved', () async {
    var inProgress = true;
    final (api, _, _) = await makeApi((request) {
      if (inProgress) {
        return jsonReply(
            {'success': false, 'errorCode': 'REQUEST_IN_PROGRESS'},
            status: 409);
      }
      return jsonReply(envelope({'id': 'saved'}), status: 201);
    });
    final outbox = Outbox(api);
    await outbox.keep(method: 'POST', path: '/ideas', kind: 'idea');

    expect(await outbox.flush(), 0);
    expect(outbox.pending, hasLength(1));
    expect(outbox.refused, 0);

    inProgress = false;
    expect(await outbox.flush(), 1);
    expect(outbox.pending, isEmpty);
  });

  test('every kept change carries a key of its own', () async {
    final network = Network();
    final (api, _, _) = await makeApi(network.reply);
    final outbox = Outbox(api);
    await outbox.keep(method: 'POST', path: '/ideas', kind: 'idea');
    await outbox.keep(method: 'POST', path: '/ideas', kind: 'idea');

    expect(outbox.pending[0].key, isNot(outbox.pending[1].key));
  });

  // A phone handed between shifts: what one person did offline must reach the
  // server as theirs, never under the next person's session.
  test('a change kept on a shared phone waits for the person who made it',
      () async {
    final network = Network();
    final (api, _, _) = await makeApi(network.reply);
    final outbox = Outbox(api);
    await outbox.signedIn('day-shift');
    await outbox.keep(method: 'POST', path: '/audit-runs', kind: 'audit');

    await outbox.signedIn('night-shift');
    network.online = true;

    expect(await outbox.flush(), 0);
    expect(network.sent, isEmpty);
    expect(outbox.ownPending, isEmpty);
    expect(outbox.pending.single.owner, 'day-shift');

    expect(await outbox.signedIn('day-shift'), 1);
    expect(network.sent, ['POST /audit-runs']);
    expect(outbox.pending, isEmpty);
  });

  test('sends one person’s changes without touching another’s, in order',
      () async {
    final network = Network()..online = true;
    final (api, _, _) = await makeApi(network.reply);
    final outbox = Outbox(api);
    await outbox.signedIn('a');
    await outbox.keep(method: 'POST', path: '/a-first', kind: 'audit');
    await outbox.signedIn('b');
    await outbox.keep(method: 'POST', path: '/b-only', kind: 'idea');
    await outbox.signedIn('a');

    expect(network.sent, ['POST /a-first']);
    expect(outbox.pending.single.path, '/b-only');
  });

  test('remembers whose a change is across the app being closed', () async {
    final network = Network();
    final (api, _, _) = await makeApi(network.reply);
    final outbox = Outbox(api);
    await outbox.signedIn('u1');
    await outbox.keep(method: 'POST', path: '/ideas', kind: 'idea');

    final reopened = Outbox(api);
    await reopened.restore();

    expect(reopened.pending.single.owner, 'u1');
  });

  // Phones updated with changes still waiting hold them without an owner.
  // Those go with whoever signs in, as they did before owners were recorded.
  test('a change kept before owners were recorded still goes out', () async {
    final network = Network()..online = true;
    final (api, _, _) = await makeApi(network.reply);
    SharedPreferences.setMockInitialValues({
      'outbox': json.encode([
        {
          'id': 'old',
          'method': 'POST',
          'path': '/audit-runs',
          'kind': 'audit',
          'createdAt': '2026-10-01T08:00:00.000Z',
          'key': 'old-key',
        }
      ]),
    });
    final outbox = Outbox(api);
    await outbox.restore();

    expect(outbox.pending.single.owner, isNull);
    expect(await outbox.signedIn('anyone'), 1);
    expect(network.sent, ['POST /audit-runs']);
  });

  test('signing in stamps what is kept with that person', () async {
    final network = Network();
    final (api, _, _) = await makeApi(network.reply);
    final outbox = Outbox(api);
    final auth = AuthProvider(apiService: api, outbox: outbox);
    await auth.fromJson({
      'user': {'id': 'u7', 'email': 'op@example.com', 'fullName': 'Operator'},
      'isAuthenticated': true
    });

    await outbox.keep(method: 'POST', path: '/ideas', kind: 'idea');

    expect(outbox.pending.single.owner, 'u7');
  });

  test('without an outbox, an offline change fails as before', () async {
    final network = Network();
    final (api, _, _) = await makeApi(network.reply);
    final fiveS = FiveSProvider(api);

    expect(
        await fiveS
            .submit(zone: _zone, template: _template, answers: {'q1': 'yes'}),
        isNull);
    expect(fiveS.error, isNotNull);
  });

  testWidgets('says what is waiting on every tab, and sends it on request',
      (tester) async {
    final network = Network();
    final (api, _, _) = await makeApi(network.reply);
    final outbox = Outbox(api);
    await tester.runAsync(
        () => outbox.keep(method: 'POST', path: '/audit-runs', kind: 'audit'));
    final auth = AuthProvider(apiService: api);
    await auth.fromJson({
      'user': {'id': 'u1', 'email': 'op@example.com', 'fullName': 'Operator'},
      'isAuthenticated': true
    });

    await tester.pumpWidget(MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: outbox),
        ChangeNotifierProvider.value(value: auth),
        ChangeNotifierProvider.value(value: TaskProvider(api, outbox: outbox)),
        ChangeNotifierProvider.value(
            value: WorkLogProvider(api, outbox: outbox)),
        ChangeNotifierProvider.value(value: InboxProvider(api)),
        ChangeNotifierProvider.value(value: IdeaProvider(api)),
        ChangeNotifierProvider.value(value: FiveSProvider(api, outbox: outbox)),
      ],
      child: const MaterialApp(
        locale: Locale('en'),
        supportedLocales: [Locale('en'), Locale('mn')],
        localizationsDelegates: testDelegates,
        home: HomeScreen(),
      ),
    ));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('outbox-banner')), findsOneWidget);
    expect(find.text('1 kept on this phone, sent when the network is back.'),
        findsOneWidget);

    network.online = true;
    await tester.tap(find.text('Send now'));
    await settleUntil(tester, () => network.sent.contains('POST /audit-runs'));

    expect(network.sent, contains('POST /audit-runs'));
    expect(find.byKey(const Key('outbox-banner')), findsNothing);
  });
}
