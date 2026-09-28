import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:productivity_mobile/providers/auth_provider.dart';
import 'package:productivity_mobile/providers/idea_provider.dart';
import 'package:productivity_mobile/screens/ideas_screen.dart';
import 'package:productivity_mobile/services/outbox.dart';

import 'support/fake_api.dart';

final _ideas = [
  {'id': 'i1', 'authorId': 'u1', 'title': 'Shadow board for wrenches', 'area': 'Assembly', 'status': 'approved', 'reviewNote': 'Go ahead.'},
  {'id': 'i2', 'authorId': 'u2', 'title': 'Floor tape at the dock', 'status': 'done'},
];

Future<(IdeaProvider, MockAdapter)> _pump(WidgetTester tester,
    {bool online = true, Outbox? Function(dynamic api)? outboxFor}) async {
  final (api, adapter, _) = await makeApi((request) {
    if (!online && request.method == 'POST') {
      throw DioException.connectionError(requestOptions: request, reason: 'offline');
    }
    if (request.path == '/ideas' && request.method == 'GET') return jsonReply(envelope(_ideas));
    if (request.path == '/ideas' && request.method == 'POST') {
      return jsonReply(envelope({'id': 'i3', 'authorId': 'u1', ...(request.data as Map), 'status': 'submitted'}), status: 201);
    }
    if (request.path == '/attachments') return jsonReply(envelope({'id': 'p1'}), status: 201);
    return jsonReply(envelope([]));
  });
  final auth = AuthProvider(apiService: api);
  await auth.fromJson({
    'user': {'id': 'u1', 'email': 'op@example.com', 'fullName': 'Operator'},
    'isAuthenticated': true
  });
  final ideas = IdeaProvider(api, outbox: outboxFor?.call(api));
  await tester.pumpWidget(MultiProvider(
    providers: [
      ChangeNotifierProvider.value(value: auth),
      ChangeNotifierProvider.value(value: ideas),
    ],
    child: MaterialApp(
      locale: const Locale('en'),
      supportedLocales: const [Locale('en'), Locale('mn')],
      localizationsDelegates: testDelegates,
      home: IdeasScreen(pickPhoto: () async => (bytes: [1, 2, 3], name: 'before.jpg')),
    ),
  ));
  await tester.pumpAndSettle();
  return (ideas, adapter);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('shows the ideas and what became of them, mine marked', (tester) async {
    await _pump(tester);

    expect(find.text('Shadow board for wrenches'), findsOneWidget);
    expect(find.textContaining('Yours'), findsOneWidget);
    expect(find.textContaining('“Go ahead.”'), findsOneWidget);
    expect(find.text('Taken up'), findsOneWidget);
    expect(find.text('In place'), findsOneWidget);
  });

  testWidgets('puts an idea in from the floor, then a photo of how it is now', (tester) async {
    final (_, adapter) = await _pump(tester);

    await tester.tap(find.byKey(const Key('new-idea')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('idea-title')), 'Label the racking');
    await tester.enterText(find.widgetWithText(TextField, 'Where'), 'Stores');
    await tester.tap(find.byKey(const Key('idea-send')));
    await tester.pumpAndSettle();

    final posted = adapter.requests.lastWhere((request) => request.path == '/ideas' && request.method == 'POST');
    expect(posted.data, {'title': 'Label the racking', 'area': 'Stores'});
    expect(find.text('Label the racking'), findsOneWidget);

    await tester.tap(find.text('Add a photo'));
    await tester.pumpAndSettle();
    final upload = adapter.requests.lastWhere((request) => request.path == '/attachments');
    final fields = Map.fromEntries((upload.data as FormData).fields);
    expect(fields['ownerType'], 'idea');
    expect(fields['ownerId'], 'i3');
    expect(fields['kind'], 'before');
  });

  testWidgets('keeps an idea put in with no signal, to send later', (tester) async {
    late Outbox outbox;
    await _pump(tester, online: false, outboxFor: (api) => outbox = Outbox(api));

    await tester.tap(find.byKey(const Key('new-idea')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('idea-title')), 'Label the racking');
    await tester.tap(find.byKey(const Key('idea-send')));
    await tester.pumpAndSettle();

    expect(outbox.pending.single.path, '/ideas');
    expect(find.text('On this phone'), findsOneWidget);
    expect(find.text('No network. Kept on this phone to send later.'), findsOneWidget);
  });

  testWidgets('asks for a few words before sending', (tester) async {
    final (_, adapter) = await _pump(tester);

    await tester.tap(find.byKey(const Key('new-idea')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('idea-title')), 'ok');
    await tester.tap(find.byKey(const Key('idea-send')));
    await tester.pumpAndSettle();

    expect(adapter.requests.where((request) => request.method == 'POST'), isEmpty);
    expect(find.text('Say the idea in a few words.'), findsOneWidget);
  });
}
