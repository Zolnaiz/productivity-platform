import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
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
  await tester.pumpWidget(MultiProvider(
    providers: [
      ChangeNotifierProvider.value(value: TaskProvider(api)),
      ChangeNotifierProvider.value(
          value: WorkLogProvider(api, clock: () => _now)),
      ChangeNotifierProvider.value(value: AuthProvider(apiService: api)),
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

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('reads the day as the phone sees it, not as UTC does', () {
    // 07:30 in Ulaanbaatar is still yesterday in UTC.
    expect(localDay(DateTime(2026, 9, 25, 7, 30)), '2026-09-25');
  });

  test('reads hours that arrive as strings, as numeric columns do', () {
    expect(WorkLog.fromJson({'id': 'l1', 'summary': 'x', 'logDate': '2026-09-25', 'hours': '2.50'}).hours, 2.5);
  });

  testWidgets('shows only today’s entries and adds up their hours', (tester) async {
    final (api, _, _) = await makeApi((request) {
      if (request.path == '/work-logs') {
        return jsonReply(envelope([
          {'id': 'a', 'summary': 'Sorted the tool wall', 'logDate': '2026-09-25', 'hours': '2.5'},
          {'id': 'b', 'summary': 'Painted the floor lines', 'logDate': '2026-09-25T00:00:00.000Z', 'hours': 1},
          {'id': 'c', 'summary': 'Yesterday’s work', 'logDate': '2026-09-24', 'hours': 8},
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
        return jsonReply(envelope({
          'workLog': {'id': 'n', 'summary': 'Sorted the tool wall', 'logDate': '2026-09-25', 'hours': 1.5},
          'timeEntry': {'id': 't'},
        }), status: 201);
      }
      return jsonReply(envelope([]));
    });
    await _pump(tester, api);

    await tester.enterText(find.byKey(const Key('log-summary')), 'Sorted the tool wall');
    // A Mongolian keyboard offers the comma first.
    await tester.enterText(find.byKey(const Key('log-hours')), '1,5');
    await tester.tap(find.byKey(const Key('log-save')));
    await tester.pumpAndSettle();

    final sent = adapter.requests.firstWhere((r) => r.path == '/work-logs/daily');
    expect(sent.method, 'POST');
    expect(sent.data, containsPair('hours', 1.5));
    expect(sent.data, containsPair('logDate', '2026-09-25'));
    expect(find.text('Today: 1.5 h'), findsOneWidget);
    expect(find.text('Saved.'), findsOneWidget);
  });

  testWidgets('refuses an entry with no hours before sending anything',
      (tester) async {
    final (api, adapter, _) = await makeApi((_) => jsonReply(envelope([])));
    await _pump(tester, api);

    await tester.enterText(find.byKey(const Key('log-summary')), 'Something');
    await tester.tap(find.byKey(const Key('log-save')));
    await tester.pumpAndSettle();

    expect(find.text('Enter the hours it took, up to 24.'), findsOneWidget);
    expect(adapter.requests.where((r) => r.path == '/work-logs/daily'), isEmpty);
  });

  testWidgets('keeps what was typed when the save fails, and says why in Mongolian',
      (tester) async {
    final (api, _, _) = await makeApi((request) {
      if (request.path == '/work-logs/daily') {
        return jsonReply({'errorCode': 'INTERNAL_ERROR'}, status: 500);
      }
      return jsonReply(envelope([]));
    });
    await _pump(tester, api, locale: const Locale('mn'));

    await tester.enterText(find.byKey(const Key('log-summary')), 'Багаж ангилсан');
    await tester.enterText(find.byKey(const Key('log-hours')), '2');
    await tester.tap(find.byKey(const Key('log-save')));
    await tester.pumpAndSettle();

    expect(find.text('Серверт алдаа гарлаа. Дахин оролдоно уу.'), findsOneWidget);
    // Losing what somebody typed because the network dropped is how people
    // stop typing it.
    expect(find.text('Багаж ангилсан'), findsOneWidget);
  });
}
