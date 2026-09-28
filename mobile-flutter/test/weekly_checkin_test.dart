import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:productivity_mobile/screens/weekly_checkin_screen.dart';
import 'package:productivity_mobile/services/api_service.dart';
import 'package:productivity_mobile/services/outbox.dart';

import 'support/fake_api.dart';

// Friday 2 October 2026: the week of Monday 28 September.
DateTime _friday() => DateTime(2026, 10, 2, 17);

Future<void> _pump(WidgetTester tester, ApiService api, {Outbox? outbox}) async {
  await tester.pumpWidget(MaterialApp(
    locale: const Locale('en'),
    supportedLocales: const [Locale('en'), Locale('mn')],
    localizationsDelegates: testDelegates,
    home: Builder(
      builder: (context) => Scaffold(
        body: Center(
          child: TextButton(
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => WeeklyCheckinScreen(api: api, outbox: outbox, clock: _friday))),
            child: const Text('open'),
          ),
        ),
      ),
    ),
  ));
  await tester.tap(find.text('open'));
  await tester.pumpAndSettle();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('files a day under the Monday of its week', () {
    expect(mondayOf(DateTime(2026, 10, 2)), '2026-09-28');
    expect(mondayOf(DateTime(2026, 9, 28)), '2026-09-28');
    expect(mondayOf(DateTime(2026, 10, 4)), '2026-09-28');
    expect(mondayOf(DateTime(2026, 1, 1)), '2025-12-29');
  });

  testWidgets('opens on what was already written, and saves the three parts', (tester) async {
    final (api, adapter, _) = await makeApi((request) {
      if (request.method == 'GET') {
        return jsonReply(envelope({'week': '2026-09-28', 'progress': 'Cleared the dock', 'plans': '', 'problems': ''}));
      }
      return jsonReply(envelope({...(request.data as Map), 'userId': 'u1'}));
    });
    await _pump(tester, api);

    expect(find.text('Cleared the dock'), findsOneWidget);
    expect(adapter.requests.first.queryParameters['week'], '2026-09-28');

    await tester.enterText(find.byKey(const Key('week-problems')), 'No labels in stock');
    await tester.tap(find.byKey(const Key('week-save')));
    await tester.pumpAndSettle();

    final put = adapter.requests.lastWhere((request) => request.method == 'PUT');
    expect(put.path, '/checkins/mine');
    expect(put.data, {'week': '2026-09-28', 'progress': 'Cleared the dock', 'plans': '', 'problems': 'No labels in stock'});
    expect(find.text('Your week is saved.'), findsOneWidget);
  });

  testWidgets('keeps the week on the phone when there is no signal', (tester) async {
    final (api, _, _) = await makeApi((request) {
      if (request.method == 'PUT') {
        throw DioException.connectionError(requestOptions: request, reason: 'offline');
      }
      return jsonReply({'success': true, 'data': null});
    });
    final outbox = Outbox(api);
    await _pump(tester, api, outbox: outbox);

    await tester.enterText(find.byKey(const Key('week-problems')), 'Forklift is broken');
    await tester.tap(find.byKey(const Key('week-save')));
    await tester.pumpAndSettle();

    expect(outbox.pending.single.method, 'PUT');
    expect(outbox.pending.single.data?['problems'], 'Forklift is broken');
    expect(find.text('No network. Kept on this phone to send later.'), findsOneWidget);
  });
}
