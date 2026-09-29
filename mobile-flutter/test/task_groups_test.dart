import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:productivity_mobile/models/task_model.dart';
import 'package:productivity_mobile/providers/auth_provider.dart';
import 'package:productivity_mobile/providers/task_provider.dart';
import 'package:productivity_mobile/screens/tasks_screen.dart';

import 'support/fake_api.dart';

Task _task(String id, {String status = 'todo', String? due}) =>
    Task.fromJson({'id': id, 'title': id, 'assigneeId': 'u1', 'status': status, 'dueDate': due});

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('puts tasks in the order they need the person', () {
    final now = DateTime(2026, 10, 2, 9);
    final groups = groupTasks([
      _task('finished', status: 'done', due: '2026-09-01'),
      _task('later', due: '2026-10-30'),
      _task('late', due: '2026-09-30'),
      _task('someday'),
      _task('today', due: '2026-10-02'),
      _task('friday-next', due: '2026-10-09'),
      _task('parked', status: 'backlog', due: '2026-09-01'),
    ], now);

    expect(
      {for (final group in groups) group.key: group.tasks.map((task) => task.id).toList()},
      {
        'late': ['late'],
        'today': ['today'],
        'week': ['friday-next'],
        // Backlog is nobody's promise yet: never late, whatever its date.
        'later': ['later', 'parked'],
        'noDate': ['someday'],
        'done': ['finished'],
      },
    );
  });

  testWidgets('finishes a task with one tap', (tester) async {
    final today = DateTime.now();
    String day(DateTime at) =>
        '${at.year}-${at.month.toString().padLeft(2, '0')}-${at.day.toString().padLeft(2, '0')}';
    final (api, adapter, _) = await makeApi((request) {
      if (request.method == 'PATCH') {
        return jsonReply(envelope({'id': 't1', 'title': 'Clear the aisle', 'assigneeId': 'u1', 'status': 'done'}));
      }
      return jsonReply(envelope([
        {'id': 't1', 'title': 'Clear the aisle', 'assigneeId': 'u1', 'status': 'todo', 'dueDate': day(today)},
      ]));
    });
    final auth = AuthProvider(apiService: api);
    await auth.fromJson({
      'user': {'id': 'u1', 'email': 'u1@example.com', 'fullName': 'Worker'},
      'isAuthenticated': true
    });
    await tester.pumpWidget(MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: TaskProvider(api)),
        ChangeNotifierProvider.value(value: auth),
      ],
      child: const MaterialApp(
        locale: Locale('en'),
        supportedLocales: [Locale('en'), Locale('mn')],
        localizationsDelegates: testDelegates,
        home: TasksScreen(),
      ),
    ));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('task-group-today')), findsOneWidget);
    await tester.tap(find.byKey(const Key('done-t1')));
    await tester.pumpAndSettle();

    final patch = adapter.requests.lastWhere((request) => request.method == 'PATCH');
    expect(patch.path, '/tasks/t1');
    expect(patch.data, {'status': 'done'});
    expect(find.byKey(const Key('task-group-done')), findsOneWidget);
  });
}
