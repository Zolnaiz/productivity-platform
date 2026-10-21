import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:productivity_mobile/models/work_log_model.dart' show localDay;
import 'package:productivity_mobile/providers/auth_provider.dart';
import 'package:productivity_mobile/providers/five_s_provider.dart';
import 'package:productivity_mobile/providers/idea_provider.dart';
import 'package:productivity_mobile/providers/inbox_provider.dart';
import 'package:productivity_mobile/providers/task_provider.dart';
import 'package:productivity_mobile/providers/work_log_provider.dart';
import 'package:productivity_mobile/screens/home_screen.dart';

import 'support/fake_api.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final now = DateTime.now();
  final today = localDay(now);
  final yesterday = localDay(now.subtract(const Duration(days: 1)));
  final nextWeek = localDay(now.add(const Duration(days: 5)));

  Future<void> pump(WidgetTester tester, {List<Map<String, dynamic>> logs = const []}) async {
    final (api, _, _) = await makeApi((request) {
      if (request.path == '/tasks') {
        return jsonReply(envelope([
          {'id': 't1', 'title': 'Clear the aisle', 'status': 'todo', 'dueDate': today, 'assigneeId': 'u1'},
          {'id': 't2', 'title': 'Fix the label', 'status': 'in_progress', 'dueDate': yesterday, 'assigneeId': 'u1'},
          {'id': 't3', 'title': 'Order tape', 'status': 'todo', 'dueDate': nextWeek, 'assigneeId': 'u1'},
          {'id': 't4', 'title': 'Old job', 'status': 'done', 'dueDate': yesterday, 'assigneeId': 'u1'},
        ]));
      }
      if (request.path == '/work-logs') return jsonReply(envelope(logs));
      if (request.path == '/notifications') {
        return jsonReply(envelope([
          {'id': 'n1', 'title': 'Today: 1 due, 1 late', 'readAt': null},
        ]));
      }
      return jsonReply(envelope([]));
    });
    final auth = AuthProvider(apiService: api);
    await auth.fromJson({
      'user': {'id': 'u1', 'email': 'op@example.com', 'fullName': 'Operator', 'role': 'user'},
      'isAuthenticated': true
    });
    await tester.pumpWidget(MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: auth),
        ChangeNotifierProvider.value(value: TaskProvider(api)),
        ChangeNotifierProvider.value(value: WorkLogProvider(api)),
        ChangeNotifierProvider.value(value: InboxProvider(api)..load()),
        ChangeNotifierProvider.value(value: IdeaProvider(api)),
        ChangeNotifierProvider.value(value: FiveSProvider(api)),
      ],
      child: const MaterialApp(
        locale: Locale('en'),
        supportedLocales: [Locale('en'), Locale('mn')],
        localizationsDelegates: testDelegates,
        home: HomeScreen(),
      ),
    ));
    await tester.pumpAndSettle();
  }

  testWidgets('opens on Today: due and late work, the log not written, the message unread', (tester) async {
    await pump(tester);

    expect(find.text('Check an area by QR'), findsOneWidget);
    expect(find.byKey(const Key('today-task-t1')), findsOneWidget);
    expect(find.byKey(const Key('today-task-t2')), findsOneWidget);
    // Next week's and finished work are not today's.
    expect(find.byKey(const Key('today-task-t3')), findsNothing);
    expect(find.byKey(const Key('today-task-t4')), findsNothing);
    expect(find.text('Today’s work is not logged yet'), findsOneWidget);
    expect(find.text('1 unread messages'), findsOneWidget);
    expect(find.text('All tasks (3 open)'), findsOneWidget);
    // Still five tabs.
    expect(tester.widget<NavigationBar>(find.byType(NavigationBar)).destinations, hasLength(5));
  });

  testWidgets('says the day is logged once it is', (tester) async {
    await pump(tester, logs: [
      {'id': 'l1', 'logDate': today, 'hours': 6, 'summary': 'Assembly', 'userId': 'u1'},
    ]);

    expect(find.text('Today’s work is logged'), findsOneWidget);
  });

  testWidgets('the write button opens the log tab, the big button the 5S tab', (tester) async {
    await pump(tester);

    await tester.tap(find.text('Write'));
    await tester.pumpAndSettle();
    expect(tester.widget<NavigationBar>(find.byType(NavigationBar)).selectedIndex, 1);

    await tester.tap(find.byIcon(Icons.today));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('today-scan')));
    await tester.pump();
    expect(tester.widget<NavigationBar>(find.byType(NavigationBar)).selectedIndex, 2);
  });
}
