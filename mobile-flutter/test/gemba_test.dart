import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:productivity_mobile/models/five_s_model.dart';
import 'package:productivity_mobile/screens/gemba_screen.dart';
import 'package:productivity_mobile/services/api_service.dart';
import 'package:productivity_mobile/services/outbox.dart';

import 'support/fake_api.dart';

final _zones = [FiveSZone.fromJson({'id': 'z1', 'code': 'A3', 'name': 'Assembly'})];

Future<void> _pump(WidgetTester tester, ApiService api, {Outbox? outbox}) async {
  await tester.pumpWidget(MaterialApp(
    locale: const Locale('en'),
    supportedLocales: const [Locale('en'), Locale('mn')],
    localizationsDelegates: testDelegates,
    home: Builder(
      builder: (context) => Scaffold(
        body: Center(
          child: TextButton(
            onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => GembaWalkScreen(api: api, zones: _zones, outbox: outbox))),
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

  testWidgets('records a walk in an area, with its follow-ups', (tester) async {
    final (api, adapter, _) = await makeApi((request) => jsonReply(envelope({'id': 'w1', 'followUps': []}), status: 201));
    await _pump(tester, api);

    await tester.tap(find.byKey(const Key('gemba-zone')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('A3 - Assembly').last);
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('gemba-observations')), 'Wrenches on the bench.');
    await tester.enterText(find.byKey(const Key('gemba-follow-up-0')), 'Move the board to the bench');
    await tester.tap(find.text('Add a follow-up'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('gemba-follow-up-1')), 'ok');
    await tester.tap(find.byKey(const Key('gemba-save')));
    await tester.pumpAndSettle();

    final posted = adapter.requests.lastWhere((request) => request.path == '/gemba');
    expect(posted.data, {
      'zoneId': 'z1',
      'area': 'A3 - Assembly',
      'observations': 'Wrenches on the bench.',
      'conversations': '',
      // Two letters is not a follow-up.
      'followUps': [
        {'title': 'Move the board to the bench'}
      ],
    });
    expect(find.text('Walk recorded. Its follow-ups are on the task board.'), findsOneWidget);
  });

  testWidgets('asks for something before recording an empty walk', (tester) async {
    final (api, adapter, _) = await makeApi((request) => jsonReply(envelope({})));
    await _pump(tester, api);

    await tester.tap(find.byKey(const Key('gemba-save')));
    await tester.pumpAndSettle();

    expect(adapter.requests, isEmpty);
    expect(find.text('Write what you saw, or at least one follow-up.'), findsOneWidget);
  });

  testWidgets('keeps the walk on the phone with no signal', (tester) async {
    final (api, _, _) = await makeApi(
        (request) => throw DioException.connectionError(requestOptions: request, reason: 'offline'));
    final outbox = Outbox(api);
    await _pump(tester, api, outbox: outbox);

    await tester.enterText(find.byKey(const Key('gemba-observations')), 'Aisle blocked by pallets.');
    await tester.tap(find.byKey(const Key('gemba-save')));
    await tester.pumpAndSettle();

    expect(outbox.pending.single.path, '/gemba');
    expect(find.text('No network. Kept on this phone to send later.'), findsOneWidget);
  });
}
