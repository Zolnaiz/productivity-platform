import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
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
    await tester
        .runAsync(() => Future<void>.delayed(const Duration(milliseconds: 50)));
    await tester.pumpAndSettle();

    expect(network.sent, contains('POST /audit-runs'));
    expect(find.byKey(const Key('outbox-banner')), findsNothing);
  });
}
