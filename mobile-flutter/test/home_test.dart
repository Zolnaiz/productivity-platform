import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:productivity_mobile/providers/auth_provider.dart';
import 'package:productivity_mobile/providers/five_s_provider.dart';
import 'package:productivity_mobile/providers/inbox_provider.dart';
import 'package:productivity_mobile/providers/task_provider.dart';
import 'package:productivity_mobile/providers/work_log_provider.dart';
import 'package:productivity_mobile/screens/home_screen.dart';

import 'support/fake_api.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('asks again for the inbox and the tasks when the app is opened again',
      (tester) async {
    var reminders = <Map<String, dynamic>>[];
    final (api, adapter, _) = await makeApi((request) {
      if (request.path == '/notifications') return jsonReply(envelope(reminders));
      return jsonReply(envelope([]));
    });
    final auth = AuthProvider(apiService: api);
    await auth.fromJson({
      'user': {'id': 'u1', 'email': 'op@example.com', 'fullName': 'Operator', 'role': 'user'},
      'isAuthenticated': true
    });
    final inbox = InboxProvider(api);
    await tester.pumpWidget(MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: auth),
        ChangeNotifierProvider.value(value: TaskProvider(api)),
        ChangeNotifierProvider.value(value: WorkLogProvider(api)),
        ChangeNotifierProvider.value(value: inbox),
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
    expect(inbox.unread, 0);

    // Overnight, with the phone in a pocket, the morning reminder arrives.
    for (final state in [AppLifecycleState.inactive, AppLifecycleState.hidden, AppLifecycleState.paused]) {
      tester.binding.handleAppLifecycleStateChanged(state);
    }
    reminders = [
      {'id': 'n1', 'title': 'Today: 2 due, 1 late', 'readAt': null},
    ];
    adapter.requests.clear();

    for (final state in [AppLifecycleState.hidden, AppLifecycleState.inactive, AppLifecycleState.resumed]) {
      tester.binding.handleAppLifecycleStateChanged(state);
    }
    await tester.pumpAndSettle();

    expect(adapter.requests.map((request) => request.path), containsAll(['/notifications', '/tasks']));
    expect(inbox.unread, 1);
    expect(find.text('1'), findsOneWidget);
  });
}
