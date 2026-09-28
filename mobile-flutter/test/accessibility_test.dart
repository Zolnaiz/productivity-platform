import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:productivity_mobile/providers/auth_provider.dart';
import 'package:productivity_mobile/providers/five_s_provider.dart';
import 'package:productivity_mobile/providers/idea_provider.dart';
import 'package:productivity_mobile/providers/inbox_provider.dart';
import 'package:productivity_mobile/providers/task_provider.dart';
import 'package:productivity_mobile/providers/work_log_provider.dart';
import 'package:productivity_mobile/screens/home_screen.dart';
import 'package:productivity_mobile/screens/login_screen.dart';
import 'package:productivity_mobile/theme.dart';

import 'support/accessible.dart';
import 'support/fake_api.dart';

/// Every tab, an area and its checklist, drawn in the app's own themes - the
/// colours people see, not the test default - and checked for thumb-sized
/// controls, names a screen reader can say, and readable contrast.

final _plan = {
  'id': 'plan-1',
  'name': 'Workshop',
  'auditTiers': [
    {'tier': 1, 'name': 'Operator', 'role': 'user', 'frequency': 'daily', 'templateId': 't-daily'},
  ],
  'zones': [
    {
      'id': 'z1',
      'code': 'A1',
      'name': 'Tool wall',
      'lastAuditScore': 62,
      'lastAuditAt': '2026-09-20T03:00:00.000Z',
      'redTags': [
        {'id': 'rt1', 'title': 'Broken pallet', 'status': 'open'},
      ],
    },
    {'id': 'z2', 'code': 'A2', 'name': 'Stores'},
  ],
};

const _template = {
  'id': 't-daily',
  'title': 'Daily 5S',
  'category': '5s',
  'isActive': true,
  'questions': [
    {'id': 'q1', 'text': 'Tools back on the shadow board', 'type': 'score', 'maxScore': 4},
    {'id': 'q2', 'text': 'Floor lines unbroken', 'type': 'yes_no'},
    {'id': 'q3', 'text': 'Anything else', 'type': 'text'},
  ],
};

Future<void> _pumpHome(WidgetTester tester, ThemeData theme, {double textScale = 1}) async {
  SharedPreferences.setMockInitialValues({
    'user': jsonEncode({'id': 'u1', 'email': 'op@example.com', 'role': 'user'}),
  });
  final (api, _, _) = await makeApi((request) {
    if (request.path == '/five-s-layouts') return jsonReply(envelope([_plan]));
    if (request.path == '/audit-templates') return jsonReply(envelope([_template]));
    if (request.path.startsWith('/tasks')) {
      return jsonReply(envelope([
        {'id': 't1', 'title': 'Clear the aisle', 'assigneeId': 'u1', 'status': 'todo', 'dueDate': '2026-09-28'},
      ]));
    }
    if (request.path == '/notifications') {
      return jsonReply(envelope([
        {'id': 'n1', 'type': 'reminder', 'title': 'Two tasks due today', 'body': 'Clear the aisle', 'readAt': null},
      ]));
    }
    return jsonReply(envelope([]));
  });

  final auth = AuthProvider(apiService: api);
  await auth.fromJson({
    'user': {'id': 'u1', 'email': 'op@example.com', 'fullName': 'Operator', 'role': 'user'},
    'isAuthenticated': true
  });
  final tasks = TaskProvider(api);
  final inbox = InboxProvider(api);
  final fiveS = FiveSProvider(api);
  await tester.pumpWidget(MultiProvider(
    providers: [
      ChangeNotifierProvider.value(value: auth),
      ChangeNotifierProvider.value(value: tasks),
      ChangeNotifierProvider.value(value: WorkLogProvider(api)),
      ChangeNotifierProvider.value(value: inbox),
      ChangeNotifierProvider.value(value: IdeaProvider(api)),
      ChangeNotifierProvider.value(value: fiveS),
    ],
    child: MaterialApp(
      theme: theme,
      locale: const Locale('mn'),
      supportedLocales: const [Locale('en'), Locale('mn')],
      localizationsDelegates: testDelegates,
      home: const HomeScreen(),
      builder: (context, child) => MediaQuery(
        data: MediaQuery.of(context).copyWith(textScaler: TextScaler.linear(textScale)),
        child: child!,
      ),
    ),
  ));
  await tester.runAsync(() async {
    await tasks.load(assigneeId: 'u1');
    await inbox.load();
    await fiveS.load();
  });
  await tester.pumpAndSettle();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  for (final (name, theme) in [('light', buildLightTheme), ('dark', buildDarkTheme)]) {
    testWidgets('the sign-in, in the $name theme', (tester) async {
      final (api, _, _) = await makeApi((_) => jsonReply(envelope([])));
      await tester.pumpWidget(ChangeNotifierProvider(
        create: (_) => AuthProvider(apiService: api),
        child: MaterialApp(
          theme: theme(),
          locale: const Locale('mn'),
          supportedLocales: const [Locale('en'), Locale('mn')],
          localizationsDelegates: testDelegates,
          home: const LoginScreen(),
        ),
      ));
      await tester.pumpAndSettle();
      await expectAccessible(tester);
    });

    testWidgets('every tab, an area and its checklist, in the $name theme', (tester) async {
      await _pumpHome(tester, theme());
      await expectAccessible(tester);

      for (final icon in [Icons.edit_note, Icons.fact_check_outlined, Icons.lightbulb_outline, Icons.notifications_outlined]) {
        await tester.tap(find.byIcon(icon));
        await tester.pumpAndSettle();
        await expectAccessible(tester);
      }

      await tester.tap(find.byIcon(Icons.fact_check_outlined));
      await tester.pumpAndSettle();
      await tester.tap(find.text('A1 - Tool wall'));
      await tester.pumpAndSettle();
      await expectAccessible(tester);

      await tester.tap(find.byKey(const Key('zone-walk')));
      await tester.pumpAndSettle();
      await expectAccessible(tester);
    });
  }

  // A phone set to its largest text. Nothing may overflow - Flutter fails
  // the test on a clipped row - and every control must still be reachable.
  testWidgets('every tab, an area and its checklist, with the text at its largest', (tester) async {
    tester.view.physicalSize = const Size(1080, 2340);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);
    await _pumpHome(tester, buildLightTheme(), textScale: maxTextScale);
    await expectAccessible(tester);

    for (final icon in [Icons.edit_note, Icons.fact_check_outlined, Icons.lightbulb_outline, Icons.notifications_outlined]) {
      await tester.tap(find.byIcon(icon));
      await tester.pumpAndSettle();
      await expectAccessible(tester);
    }

    await tester.tap(find.byIcon(Icons.fact_check_outlined));
    await tester.pumpAndSettle();
    await tester.tap(find.text('A1 - Tool wall'));
    await tester.pumpAndSettle();
    await expectAccessible(tester);

    await tester.tap(find.byKey(const Key('zone-walk')));
    await tester.pumpAndSettle();
    await expectAccessible(tester);
  });
}
