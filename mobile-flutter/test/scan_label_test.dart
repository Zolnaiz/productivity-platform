import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:productivity_mobile/providers/auth_provider.dart';
import 'package:productivity_mobile/providers/five_s_provider.dart';
import 'package:productivity_mobile/screens/five_s_screen.dart';
import 'package:productivity_mobile/screens/scan_label_screen.dart';

import 'support/fake_api.dart';

final _plan = {
  'id': 'plan-1',
  'name': 'Workshop',
  'zones': [
    {'id': 'z1', 'code': 'A1', 'name': 'Tool wall'},
  ],
};

Future<void> _pump(WidgetTester tester, LabelScanner scanner) async {
  final (api, _, _) = await makeApi((request) {
    if (request.path == '/five-s-layouts') return jsonReply(envelope([_plan]));
    return jsonReply(envelope([]));
  });
  await tester.pumpWidget(MultiProvider(
    providers: [
      ChangeNotifierProvider.value(value: AuthProvider(apiService: api)),
      ChangeNotifierProvider.value(value: FiveSProvider(api)),
    ],
    child: MaterialApp(
      locale: const Locale('en'),
      supportedLocales: const [Locale('en'), Locale('mn')],
      localizationsDelegates: testDelegates,
      home: FiveSScreen(scanLabel: scanner),
    ),
  ));
  await tester.pumpAndSettle();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('reading a label', () {
    test('finds the plan and the area in the link the web prints', () {
      expect(zoneFromLabel('https://mpc.example.mn/zone/plan-1/z1'), (planId: 'plan-1', zoneId: 'z1'));
    });

    test('reads a label printed from a site served under a folder', () {
      expect(zoneFromLabel('https://example.mn/app/zone/plan%201/z1'), (planId: 'plan 1', zoneId: 'z1'));
    });

    test('names nothing for any other code', () {
      expect(zoneFromLabel('https://example.mn/tasks'), isNull);
      expect(zoneFromLabel('4006381333931'), isNull);
      expect(zoneFromLabel('https://example.mn/zone/plan-1'), isNull);
    });
  });

  testWidgets('opens the area a scanned label names', (tester) async {
    await _pump(tester, (_) async => (planId: 'plan-1', zoneId: 'z1'));

    await tester.tap(find.byKey(const Key('scan-label')));
    await tester.pumpAndSettle();

    expect(find.byType(FiveSZoneScreen), findsOneWidget);
    expect(find.text('A1 - Tool wall'), findsWidgets);
  });

  testWidgets('says so when the label is for an area not on the plans', (tester) async {
    await _pump(tester, (_) async => (planId: 'plan-1', zoneId: 'gone'));

    await tester.tap(find.byKey(const Key('scan-label')));
    await tester.pumpAndSettle();

    expect(find.byType(FiveSZoneScreen), findsNothing);
    expect(find.text('This label names an area that is not on your organization’s plans.'), findsOneWidget);
  });
}
