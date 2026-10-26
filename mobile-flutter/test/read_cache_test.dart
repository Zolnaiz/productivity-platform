import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:productivity_mobile/providers/auth_provider.dart';
import 'package:productivity_mobile/providers/five_s_provider.dart';
import 'package:productivity_mobile/providers/idea_provider.dart';
import 'package:productivity_mobile/providers/inbox_provider.dart';
import 'package:productivity_mobile/providers/task_provider.dart';
import 'package:productivity_mobile/providers/work_log_provider.dart';
import 'package:productivity_mobile/screens/home_screen.dart';
import 'package:productivity_mobile/services/read_cache.dart';

import 'support/fake_api.dart';

/// A server that answers GETs with `lists` until it goes out of reach, or
/// until it starts refusing with `status`.
class Server {
  bool online = true;
  int? status;
  final lists = <String, List<Object>>{};

  ResponseBody reply(RequestOptions request) {
    if (!online) {
      throw DioException.connectionError(requestOptions: request, reason: 'offline');
    }
    if (status != null) {
      return jsonReply({'success': false, 'errorCode': 'AUTH_SESSION_EXPIRED'}, status: status!);
    }
    return jsonReply(envelope(lists[request.path] ?? []));
  }
}

Map<String, Object> task(String id, String assignee) =>
    {'id': id, 'title': 'Task $id', 'status': 'todo', 'priority': 'medium', 'assigneeId': assignee};

void main() {
  test('keeps what was read, with when, and forgets it when cleared', () async {
    await makeApi((request) => jsonReply(envelope([])));
    final cache = ReadCache();
    final at = DateTime.utc(2026, 10, 25, 3, 20);
    await cache.put('ideas', [
      {'id': 'i1'}
    ], at: at);

    final kept = await cache.get('ideas');
    expect(kept!.data, [
      {'id': 'i1'}
    ]);
    expect(kept.savedAt, at.toLocal());

    await cache.clear();
    expect(await cache.get('ideas'), isNull);
  });

  test('shows the tasks it kept when the phone is offline, and says since when', () async {
    final server = Server()..lists['/tasks'] = [task('t1', 'u1'), task('t2', 'someone-else')];
    final (api, _, _) = await makeApi(server.reply);
    final tasks = TaskProvider(api, cache: ReadCache());

    await tasks.load(assigneeId: 'u1');
    expect(tasks.tasks.map((t) => t.id), ['t1']);
    expect(tasks.offlineSince, isNull);

    server.online = false;
    await tasks.load(assigneeId: 'u1');
    expect(tasks.error, isNull);
    expect(tasks.tasks.map((t) => t.id), ['t1']);
    expect(tasks.offlineSince, isNotNull);
  });

  test('keeps only the person’s own tasks on a phone that may be shared', () async {
    final server = Server()..lists['/tasks'] = [task('t1', 'u1'), task('t2', 'someone-else')];
    final (api, _, _) = await makeApi(server.reply);
    final cache = ReadCache();
    await TaskProvider(api, cache: cache).load(assigneeId: 'u1');

    final kept = await cache.get('tasks');
    expect(kept!.data.map((t) => (t as Map)['id']), ['t1']);
  });

  test('offline with nothing kept fails as before', () async {
    final server = Server()..online = false;
    final (api, _, _) = await makeApi(server.reply);
    final ideas = IdeaProvider(api, cache: ReadCache());

    await ideas.load();
    expect(ideas.error, isA<DioException>());
    expect(ideas.ideas, isEmpty);
  });

  test('a refusal is not covered up with old data', () async {
    final server = Server()..lists['/notifications'] = [
      {'id': 'n1', 'title': 'Hello', 'message': 'Hi', 'read': false}
    ];
    final (api, _, _) = await makeApi(server.reply);
    final inbox = InboxProvider(api, cache: ReadCache());
    await inbox.load();
    expect(inbox.items, hasLength(1));

    server.status = 401;
    await inbox.load();
    expect(inbox.sessionExpired, isTrue);
    expect(inbox.offlineSince, isNull);
  });

  test('the areas and checklists can still be found offline', () async {
    final server = Server()
      ..lists['/five-s-layouts'] = [
        {
          'id': 'p1',
          'name': 'Main floor',
          'zones': [
            {'id': 'z1', 'code': 'A01', 'name': 'Reception'}
          ]
        }
      ]
      ..lists['/audit-templates'] = [
        {'id': 't1', 'title': 'Daily 5S', 'category': '5s', 'isActive': true, 'questions': []}
      ];
    final (api, _, _) = await makeApi(server.reply);
    final fiveS = FiveSProvider(api, cache: ReadCache());
    await fiveS.load();
    expect(fiveS.plans, hasLength(1));

    server.online = false;
    await fiveS.load();
    expect(fiveS.error, isNull);
    expect(fiveS.find('p1', 'z1'), isNotNull);
    expect(fiveS.templates.map((t) => t.id), ['t1']);
    expect(fiveS.offlineSince, isNotNull);
  });

  test('an ended session takes the kept lists with it', () async {
    final (api, _, _) = await makeApi(Server().reply);
    final cache = ReadCache();
    await cache.put('tasks', [task('t1', 'u1')]);

    await AuthProvider(apiService: api, readCache: cache).expireSession();
    expect(await cache.get('tasks'), isNull);
  });

  testWidgets('says on every tab that what it shows was read earlier', (tester) async {
    final server = Server()..lists['/tasks'] = [task('t1', 'u1')];
    final (api, _, _) = await makeApi(server.reply);
    final cache = ReadCache();
    final auth = AuthProvider(apiService: api, readCache: cache);
    await auth.fromJson({
      'user': {'id': 'u1', 'email': 'op@example.com', 'fullName': 'Operator'},
      'isAuthenticated': true
    });
    final tasks = TaskProvider(api, cache: cache);
    await tester.runAsync(() => tasks.load(assigneeId: 'u1'));
    server.online = false;

    await tester.pumpWidget(MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: auth),
        ChangeNotifierProvider.value(value: tasks),
        ChangeNotifierProvider.value(value: WorkLogProvider(api, cache: cache)),
        ChangeNotifierProvider.value(value: InboxProvider(api, cache: cache)),
        ChangeNotifierProvider.value(value: IdeaProvider(api, cache: cache)),
        ChangeNotifierProvider.value(value: FiveSProvider(api, cache: cache)),
      ],
      child: const MaterialApp(
        locale: Locale('en'),
        supportedLocales: [Locale('en'), Locale('mn')],
        localizationsDelegates: testDelegates,
        home: HomeScreen(),
      ),
    ));
    await tester.runAsync(() => tasks.load(assigneeId: 'u1'));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('offline-banner')), findsOneWidget);
    expect(find.textContaining('Offline. Showing what was read today'), findsOneWidget);
    // The home screen opens on Today; the kept list is what the Tasks tab shows.
    expect(tasks.tasks.map((t) => t.id), ['t1']);
  });
}
