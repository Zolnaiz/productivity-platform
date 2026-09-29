import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:productivity_mobile/models/task_model.dart';
import 'package:productivity_mobile/models/work_log_model.dart';
import 'package:productivity_mobile/providers/auth_provider.dart';
import 'package:productivity_mobile/providers/task_provider.dart';
import 'package:productivity_mobile/providers/work_log_provider.dart';
import 'package:productivity_mobile/screens/work_log_screen.dart';
import 'package:productivity_mobile/services/api_service.dart';

import 'support/fake_api.dart';

final _now = DateTime(2026, 9, 25, 9, 30);

Future<void> _pump(WidgetTester tester, ApiService api,
    {Locale locale = const Locale('en')}) async {
  final auth = AuthProvider(apiService: api);
  await auth.fromJson({
    'user': {
      'id': 'u1',
      'email': 'operator@example.com',
      'fullName': 'Operator'
    },
    'isAuthenticated': true,
  });
  await tester.pumpWidget(MultiProvider(
    providers: [
      ChangeNotifierProvider.value(value: TaskProvider(api)),
      ChangeNotifierProvider.value(
          value: WorkLogProvider(api, clock: () => _now)),
      ChangeNotifierProvider.value(value: auth),
    ],
    child: MaterialApp(
      locale: locale,
      supportedLocales: const [Locale('en'), Locale('mn')],
      localizationsDelegates: testDelegates,
      home: const WorkLogScreen(),
    ),
  ));
  await tester.pumpAndSettle();
}

const _projects = [
  {'id': 'p1', 'name': 'Workshop'},
  {'id': 'p2', 'name': 'Warehouse'},
];

const _tasks = [
  {
    'id': 't1',
    'title': 'Sorted the tools',
    'status': 'done',
    'assigneeId': 'u1',
    'projectId': 'p1'
  },
  {
    'id': 't2',
    'title': 'Clear the dock',
    'status': 'todo',
    'assigneeId': 'u1',
    'projectId': 'p2'
  },
  {'id': 't3', 'title': 'General work', 'status': 'todo', 'assigneeId': 'u1'},
  {
    'id': 't4',
    'title': 'Someone else’s task',
    'status': 'todo',
    'assigneeId': 'u2',
    'projectId': 'p1'
  },
];

Future<void> _select(WidgetTester tester, String key, String label) async {
  final field = find.byKey(Key(key));
  await tester.ensureVisible(field);
  await tester.pumpAndSettle();
  await tester.tap(field);
  await tester.pumpAndSettle();
  await tester.tap(find.text(label).last);
  await tester.pumpAndSettle();
}

Future<void> _save(WidgetTester tester) async {
  final button = find.byKey(const Key('log-save'));
  await tester.ensureVisible(button);
  await tester.pumpAndSettle();
  await tester.tap(button);
  await tester.pumpAndSettle();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('reads the day as the phone sees it, not as UTC does', () {
    // 07:30 in Ulaanbaatar is still yesterday in UTC.
    expect(localDay(DateTime(2026, 9, 25, 7, 30)), '2026-09-25');
  });

  test('reads hours that arrive as strings, as numeric columns do', () {
    expect(
        WorkLog.fromJson({
          'id': 'l1',
          'summary': 'x',
          'logDate': '2026-09-25',
          'hours': '2.50'
        }).hours,
        2.5);
  });

  test('task status updates and work log parsing preserve the project linkage',
      () {
    final task = Task.fromJson(_tasks.first);
    expect(task.projectId, 'p1');
    expect(task.copyWith(status: 'in_progress').toJson()['projectId'], 'p1');
    expect(
        WorkLog.fromJson({
          'id': 'l1',
          'summary': 'Done',
          'logDate': '2026-09-25',
          'projectId': 'p1',
          'taskId': 't1',
        }).projectId,
        'p1');
  });

  testWidgets('shows only today’s entries and adds up their hours',
      (tester) async {
    final (api, _, _) = await makeApi((request) {
      if (request.path == '/work-logs') {
        return jsonReply(envelope([
          {
            'id': 'a',
            'summary': 'Sorted the tool wall',
            'logDate': '2026-09-25',
            'hours': '2.5'
          },
          {
            'id': 'b',
            'summary': 'Painted the floor lines',
            'logDate': '2026-09-25T00:00:00.000Z',
            'hours': 1
          },
          {
            'id': 'c',
            'summary': 'Yesterday’s work',
            'logDate': '2026-09-24',
            'hours': 8
          },
        ]));
      }
      return jsonReply(envelope([]));
    });

    await _pump(tester, api);

    expect(find.text('Sorted the tool wall'), findsOneWidget);
    expect(find.text('Painted the floor lines'), findsOneWidget);
    expect(find.text('Yesterday’s work'), findsNothing);
    expect(find.text('Today: 3.5 h'), findsOneWidget);
  });

  testWidgets('saves the entry with its hours to the daily route, dated today',
      (tester) async {
    final (api, adapter, _) = await makeApi((request) {
      if (request.path == '/work-logs/daily') {
        return jsonReply(
            envelope({
              'workLog': {
                'id': 'n',
                'summary': 'Sorted the tool wall',
                'logDate': '2026-09-25',
                'hours': 1.5
              },
              'timeEntry': {'id': 't'},
            }),
            status: 201);
      }
      return jsonReply(envelope([]));
    });
    await _pump(tester, api);

    await tester.enterText(
        find.byKey(const Key('log-summary')), 'Sorted the tool wall');
    // A Mongolian keyboard offers the comma first.
    await tester.enterText(find.byKey(const Key('log-hours')), '1,5');
    await tester.tap(find.byKey(const Key('log-save')));
    await tester.pumpAndSettle();

    final sent =
        adapter.requests.firstWhere((r) => r.path == '/work-logs/daily');
    expect(sent.method, 'POST');
    expect(sent.data, containsPair('hours', 1.5));
    expect(sent.data, containsPair('logDate', '2026-09-25'));
    expect(sent.data, isNot(contains('projectId')));
    expect(sent.data, isNot(contains('taskId')));
    expect(find.text('Today: 1.5 h'), findsOneWidget);
    expect(find.text('Saved.'), findsOneWidget);
  });

  testWidgets(
      'a finished assigned task selects its project and saves both links',
      (tester) async {
    final (api, adapter, _) = await makeApi((request) {
      if (request.path == '/projects') return jsonReply(envelope(_projects));
      if (request.path == '/tasks') return jsonReply(envelope(_tasks));
      if (request.path == '/work-logs/daily') {
        return jsonReply(
            envelope({
              'workLog': {'id': 'saved', ...request.data as Map}
            }),
            status: 201);
      }
      return jsonReply(envelope([]));
    });
    await _pump(tester, api);
    await tester.tap(find.byKey(const Key('log-task')));
    await tester.pumpAndSettle();
    expect(find.text('Someone else’s task'), findsNothing);
    await tester.tap(find.text('Sorted the tools').last);
    await tester.pumpAndSettle();
    expect(
        tester
            .state<FormFieldState<String?>>(
                find.byKey(const Key('log-project')))
            .value,
        'p1');

    await tester.enterText(
        find.byKey(const Key('log-summary')), 'Tools sorted');
    await tester.enterText(find.byKey(const Key('log-hours')), '2');
    await tester.enterText(
        find.byKey(const Key('log-blockers')), 'Need new labels');
    await _save(tester);

    final sent =
        adapter.requests.firstWhere((r) => r.path == '/work-logs/daily');
    expect(sent.data, containsPair('projectId', 'p1'));
    expect(sent.data, containsPair('taskId', 't1'));
    expect(sent.data, containsPair('blockers', 'Need new labels'));
    expect(
        tester
            .state<FormFieldState<String?>>(
                find.byKey(const Key('log-project')))
            .value,
        isNull);
    expect(
        tester
            .state<FormFieldState<String?>>(find.byKey(const Key('log-task')))
            .value,
        isNull);
  });

  testWidgets(
      'changing the project clears an incompatible task and filters choices',
      (tester) async {
    final (api, adapter, _) = await makeApi((request) {
      if (request.path == '/projects') return jsonReply(envelope(_projects));
      if (request.path == '/tasks') return jsonReply(envelope(_tasks));
      if (request.path == '/work-logs/daily') {
        return jsonReply(
            envelope({
              'workLog': {'id': 'saved', ...request.data as Map}
            }),
            status: 201);
      }
      return jsonReply(envelope([]));
    });
    await _pump(tester, api);
    await _select(tester, 'log-task', 'Sorted the tools');
    await _select(tester, 'log-project', 'Warehouse');
    expect(
        tester
            .state<FormFieldState<String?>>(find.byKey(const Key('log-task')))
            .value,
        isNull);
    await tester.tap(find.byKey(const Key('log-task')));
    await tester.pumpAndSettle();
    expect(find.text('Clear the dock'), findsWidgets);
    expect(find.text('Sorted the tools'), findsNothing);
    expect(find.text('General work'), findsNothing);
    await tester.tap(find.text('Not for a particular task').last);
    await tester.pumpAndSettle();

    await tester.enterText(
        find.byKey(const Key('log-summary')), 'Warehouse inspection');
    await tester.enterText(find.byKey(const Key('log-hours')), '1');
    await _save(tester);
    final sent =
        adapter.requests.firstWhere((r) => r.path == '/work-logs/daily');
    expect(sent.data, containsPair('projectId', 'p2'));
    expect(sent.data, isNot(contains('taskId')));
  });

  testWidgets(
      'clearing the project clears its task and permits a task without a project',
      (tester) async {
    final (api, adapter, _) = await makeApi((request) {
      if (request.path == '/projects') return jsonReply(envelope(_projects));
      if (request.path == '/tasks') return jsonReply(envelope(_tasks));
      if (request.path == '/work-logs/daily') {
        return jsonReply(
            envelope({
              'workLog': {'id': 'saved', ...request.data as Map}
            }),
            status: 201);
      }
      return jsonReply(envelope([]));
    });
    await _pump(tester, api);
    await _select(tester, 'log-task', 'Sorted the tools');
    await _select(tester, 'log-project', 'Not for a particular project');
    expect(
        tester
            .state<FormFieldState<String?>>(find.byKey(const Key('log-task')))
            .value,
        isNull);
    await _select(tester, 'log-task', 'General work');
    await tester.enterText(
        find.byKey(const Key('log-summary')), 'General work');
    await tester.enterText(find.byKey(const Key('log-hours')), '1');
    await _save(tester);

    final sent =
        adapter.requests.firstWhere((r) => r.path == '/work-logs/daily');
    expect(sent.data, containsPair('taskId', 't3'));
    expect(sent.data, isNot(contains('projectId')));
  });

  testWidgets(
      'a project lookup failure still permits linked tasks and preserves their project',
      (tester) async {
    final (api, adapter, _) = await makeApi((request) {
      if (request.path == '/projects')
        return jsonReply({'errorCode': 'INTERNAL_ERROR'}, status: 500);
      if (request.path == '/tasks') return jsonReply(envelope(_tasks));
      if (request.path == '/work-logs/daily') {
        return jsonReply(
            envelope({
              'workLog': {'id': 'saved', ...request.data as Map}
            }),
            status: 201);
      }
      return jsonReply(envelope([]));
    });
    await _pump(tester, api, locale: const Locale('mn'));
    expect(find.text('Аль төсөлд (заавал биш)'), findsOneWidget);
    expect(
        find.text(
            'Төсөл эсвэл ажлын жагсаалтыг шинэчилж чадсангүй. Дахин оролдох эсвэл холбоосгүй бүртгэж болно.'),
        findsOneWidget);
    await _select(tester, 'log-task', 'Sorted the tools');
    expect(find.text('Ажлын төсөл'), findsOneWidget);
    await tester.enterText(
        find.byKey(const Key('log-summary')), 'Багаж ангилсан');
    await tester.enterText(find.byKey(const Key('log-hours')), '2');
    await _save(tester);
    final sent =
        adapter.requests.firstWhere((r) => r.path == '/work-logs/daily');
    expect(sent.data, containsPair('projectId', 'p1'));
    expect(sent.data, containsPair('taskId', 't1'));
  });

  testWidgets('rejects NaN hours before encoding a request', (tester) async {
    final (api, adapter, _) = await makeApi((_) => jsonReply(envelope([])));
    await _pump(tester, api);
    await tester.enterText(find.byKey(const Key('log-summary')), 'Something');
    await tester.enterText(find.byKey(const Key('log-hours')), 'NaN');
    await _save(tester);
    expect(find.text('Enter the hours it took, up to 24.'), findsOneWidget);
    expect(
        adapter.requests.where((r) => r.path == '/work-logs/daily'), isEmpty);
  });

  for (final original in [_tasks[0], _tasks[2]]) {
    testWidgets(
        'background refresh clears a moved ${original['title']} selection without losing the draft',
        (tester) async {
      var serverTasks = _tasks;
      final (api, adapter, _) = await makeApi((request) {
        if (request.path == '/projects') return jsonReply(envelope(_projects));
        if (request.path == '/tasks') return jsonReply(envelope(serverTasks));
        if (request.path == '/work-logs/daily') {
          return jsonReply(
              envelope({
                'workLog': {'id': 'saved', ...request.data as Map}
              }),
              status: 201);
        }
        return jsonReply(envelope([]));
      });
      await _pump(tester, api);
      await _select(tester, 'log-task', original['title']!);
      await tester.enterText(
          find.byKey(const Key('log-summary')), 'Keep this draft');
      await tester.enterText(find.byKey(const Key('log-hours')), '1.5');
      final tasks =
          tester.element(find.byType(WorkLogScreen)).read<TaskProvider>();

      serverTasks = [
        for (final task in _tasks)
          if (task['id'] == original['id'])
            {...task, 'projectId': 'p2'}
          else
            task,
      ];
      await tester.runAsync(() => tasks.load(assigneeId: 'u1'));
      await tester.pumpAndSettle();
      expect(
          tester
              .state<FormFieldState<String?>>(find.byKey(const Key('log-task')))
              .value,
          isNull);
      expect(
          tester
              .state<FormFieldState<String?>>(
                  find.byKey(const Key('log-project')))
              .value,
          original['projectId']);
      expect(find.text('Keep this draft'), findsOneWidget);

      // Returning to the previous server value must not resurrect a choice
      // that the form already stopped showing.
      serverTasks = _tasks;
      await tester.runAsync(() => tasks.load(assigneeId: 'u1'));
      await tester.pumpAndSettle();
      expect(
          tester
              .state<FormFieldState<String?>>(find.byKey(const Key('log-task')))
              .value,
          isNull);
      await _save(tester);
      final sent =
          adapter.requests.firstWhere((r) => r.path == '/work-logs/daily');
      expect(sent.data, isNot(contains('taskId')));
      expect((sent.data as Map)['projectId'], original['projectId']);
      expect(sent.data, containsPair('summary', 'Keep this draft'));
      expect(sent.data, containsPair('hours', 1.5));
    });
  }

  testWidgets('refuses an entry with no hours before sending anything',
      (tester) async {
    final (api, adapter, _) = await makeApi((_) => jsonReply(envelope([])));
    await _pump(tester, api);

    await tester.enterText(find.byKey(const Key('log-summary')), 'Something');
    await tester.tap(find.byKey(const Key('log-save')));
    await tester.pumpAndSettle();

    expect(find.text('Enter the hours it took, up to 24.'), findsOneWidget);
    expect(
        adapter.requests.where((r) => r.path == '/work-logs/daily'), isEmpty);
  });

  testWidgets(
      'keeps what was typed when the save fails, and says why in Mongolian',
      (tester) async {
    final (api, _, _) = await makeApi((request) {
      if (request.path == '/work-logs/daily') {
        return jsonReply({'errorCode': 'INTERNAL_ERROR'}, status: 500);
      }
      return jsonReply(envelope([]));
    });
    await _pump(tester, api, locale: const Locale('mn'));

    await tester.enterText(
        find.byKey(const Key('log-summary')), 'Багаж ангилсан');
    await tester.enterText(find.byKey(const Key('log-hours')), '2');
    await tester.tap(find.byKey(const Key('log-save')));
    await tester.pumpAndSettle();

    expect(
        find.text('Серверт алдаа гарлаа. Дахин оролдоно уу.'), findsOneWidget);
    // Losing what somebody typed because the network dropped is how people
    // stop typing it.
    expect(find.text('Багаж ангилсан'), findsOneWidget);
  });
}
