import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:productivity_mobile/providers/auth_provider.dart';
import 'package:productivity_mobile/providers/inbox_provider.dart';
import 'package:productivity_mobile/screens/inbox_screen.dart';
import 'package:productivity_mobile/services/api_service.dart';

import 'support/fake_api.dart';

final _reminder = {
  'id': 'n1',
  'title': 'Today: 2 due, 1 late',
  'titleKey': 'raised.dailyDigest',
  'titleParams': {'dueToday': 2, 'overdue': 1},
  'body': '- Clear the aisle (2026-09-20)',
  'readAt': null,
};

Future<InboxProvider> _pump(WidgetTester tester, ApiService api,
    {Locale locale = const Locale('en')}) async {
  final inbox = InboxProvider(api);
  await tester.pumpWidget(MultiProvider(
    providers: [
      ChangeNotifierProvider.value(value: inbox),
      ChangeNotifierProvider.value(value: AuthProvider(apiService: api)),
    ],
    child: MaterialApp(
      locale: locale,
      supportedLocales: const [Locale('en'), Locale('mn')],
      localizationsDelegates: testDelegates,
      home: const InboxScreen(),
    ),
  ));
  await tester.pumpAndSettle();
  return inbox;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('words the morning reminder in the reader’s language',
      (tester) async {
    final (api, _, _) = await makeApi((_) => jsonReply(envelope([_reminder])));

    final inbox = await _pump(tester, api, locale: const Locale('mn'));

    expect(find.text('Өнөөдөр: 2 ажлын хугацаа дуусна, 1 хоцорсон'), findsOneWidget);
    expect(find.text('- Clear the aisle (2026-09-20)'), findsOneWidget);
    expect(inbox.unread, 1);
  });

  testWidgets('marks an item read when it is opened', (tester) async {
    final (api, adapter, _) = await makeApi((request) => request.method == 'PATCH'
        ? jsonReply(envelope({..._reminder, 'readAt': '2026-09-25T01:00:00Z'}))
        : jsonReply(envelope([_reminder])));
    final inbox = await _pump(tester, api);

    await tester.tap(find.byKey(const Key('inbox-n1')));
    await tester.pumpAndSettle();

    expect(adapter.requests.last.path, '/notifications/n1/read');
    expect(inbox.unread, 0);
  });

  testWidgets('puts it back to unread when the server refuses', (tester) async {
    // An item that looks read and is not would never be seen again.
    final (api, _, _) = await makeApi((request) => request.method == 'PATCH'
        ? jsonReply({'errorCode': 'INTERNAL_ERROR'}, status: 500)
        : jsonReply(envelope([_reminder])));
    final inbox = await _pump(tester, api);

    await tester.tap(find.byKey(const Key('inbox-n1')));
    await tester.pumpAndSettle();

    expect(inbox.unread, 1);
  });

  testWidgets('says what arrives here when there is nothing yet', (tester) async {
    final (api, _, _) = await makeApi((_) => jsonReply(envelope([])));

    await _pump(tester, api);

    expect(find.textContaining('morning reminder arrive here'), findsOneWidget);
  });

  testWidgets('words the text under a title too, not only the title',
      (tester) async {
    // It was an English sentence under a Mongolian title.
    final (api, _, _) = await makeApi((_) => jsonReply(envelope([
          {
            'id': 'n2',
            'title': 'Clear the aisle',
            'body': 'Due 2026-09-30',
            'bodyKey': 'raised.dueOn',
            'bodyParams': {'date': '2026-09-30'},
            'readAt': null,
          }
        ])));

    await _pump(tester, api, locale: const Locale('mn'));

    expect(find.text('2026-09-30-нд дуусна'), findsOneWidget);
    expect(find.text('Due 2026-09-30'), findsNothing);
  });
}
