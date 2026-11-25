// Widget/unit test: the reminder on the Today screen.

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:productivity_mobile/screens/sus_screen.dart';
import 'package:productivity_mobile/services/api_service.dart';
import 'package:productivity_mobile/services/outbox.dart';

import 'support/fake_api.dart';

const _good = [4, 2, 4, 2, 4, 2, 4, 2, 4, 2]; // 75 by Brooke's rule

Future<void> _pumpScreen(WidgetTester tester, ApiService api, {Outbox? outbox}) async {
  await tester.pumpWidget(MaterialApp(
    locale: const Locale('en'),
    supportedLocales: const [Locale('en'), Locale('mn')],
    localizationsDelegates: testDelegates,
    home: Builder(
      builder: (context) => Scaffold(
        body: Center(
          child: TextButton(
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => SusScreen(api: api, outbox: outbox, roundId: 'r1', title: 'End of pilot'))),
            child: const Text('open'),
          ),
        ),
      ),
    ),
  ));
  await tester.tap(find.text('open'));
  await tester.pumpAndSettle();
}

/// Scrolls the questionnaire until [finder] is built and on screen: the list
/// builds its statements lazily, so the later ones do not exist until reached.
Future<void> _reach(WidgetTester tester, Finder finder) =>
    tester.scrollUntilVisible(finder, 200, scrollable: find.byType(Scrollable).first);

/// Taps one answer for every statement, scrolling to each in turn.
Future<void> _answerAll(WidgetTester tester, List<int> answers) async {
  for (var item = 0; item < answers.length; item++) {
    final choice = find.byKey(Key('sus-s${item + 1}-${answers[item]}'));
    await _reach(tester, choice);
    await tester.tap(choice);
    await tester.pump();
  }
}

Future<void> _send(WidgetTester tester) async {
  await _reach(tester, find.byKey(const Key('sus-send')));
  await tester.tap(find.byKey(const Key('sus-send')));
  await tester.pumpAndSettle();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('asks the ten statements, and sends nothing until all ten are answered', (tester) async {
    final (api, adapter, _) = await makeApi((request) =>
        jsonReply(envelope({'answers': (request.data as Map)['answers'], 'score': 75, 'updatedAt': '2026-11-17T10:00:00Z'})));
    await _pumpScreen(tester, api);

    expect(find.textContaining('S1. I think that I would like to use this system frequently.'), findsOneWidget);
    final send = find.byKey(const Key('sus-send'));
    await _reach(tester, send);
    expect(tester.widget<FilledButton>(send).onPressed, isNull);

    await tester.scrollUntilVisible(find.byKey(const Key('sus-s1')), -200, scrollable: find.byType(Scrollable).first);
    await _answerAll(tester, _good);
    await _send(tester);

    final put = adapter.requests.singleWhere((request) => request.method == 'PUT');
    expect(put.path, '/sus/rounds/r1/answers/mine');
    expect(put.data, {'answers': _good});
    expect(find.text('Thank you. Your answers come to 75 out of 100.'), findsOneWidget);
  });

  testWidgets('keeps the answers on the phone when there is no signal', (tester) async {
    final (api, _, _) = await makeApi((request) {
      throw DioException.connectionError(requestOptions: request, reason: 'offline');
    });
    final outbox = Outbox(api);
    await _pumpScreen(tester, api, outbox: outbox);

    await _answerAll(tester, _good);
    await _send(tester);

    final kept = outbox.pending.single;
    expect(kept.method, 'PUT');
    expect(kept.path, '/sus/rounds/r1/answers/mine');
    expect(kept.data, {'answers': _good});
    expect(find.text('No network. Kept on this phone to send later.'), findsOneWidget);
  });

  group('the reminder on the Today screen', () {
    Future<void> pumpCard(WidgetTester tester, ApiService api) async {
      await tester.pumpWidget(MaterialApp(
        locale: const Locale('en'),
        supportedLocales: const [Locale('en'), Locale('mn')],
        localizationsDelegates: testDelegates,
        home: Scaffold(body: SusReminderCard(api: api)),
      ));
      await tester.pumpAndSettle();
    }

    testWidgets('asks somebody who has not answered the open round', (tester) async {
      final (api, _, _) = await makeApi((request) =>
          jsonReply(envelope({'round': {'id': 'r1', 'title': 'End of pilot'}, 'mine': null})));
      await pumpCard(tester, api);

      expect(find.byKey(const Key('today-sus')), findsOneWidget);
      await tester.tap(find.text('Answer'));
      await tester.pumpAndSettle();
      expect(find.text('End of pilot'), findsOneWidget);
    });

    testWidgets('says nothing once they have answered, or with no round open', (tester) async {
      final (answered, _, _) = await makeApi((request) => jsonReply(envelope({
            'round': {'id': 'r1', 'title': 'End of pilot'},
            'mine': {'answers': _good, 'score': 75},
          })));
      await pumpCard(tester, answered);
      expect(find.byKey(const Key('today-sus')), findsNothing);

      final (closed, _, _) = await makeApi((request) => jsonReply(envelope({'round': null, 'mine': null})));
      await pumpCard(tester, closed);
      expect(find.byKey(const Key('today-sus')), findsNothing);
    });
  });
}
