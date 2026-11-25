import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:productivity_mobile/providers/auth_provider.dart';
import 'package:productivity_mobile/screens/login_screen.dart';
import 'package:productivity_mobile/services/api_service.dart';

import 'support/fake_api.dart';

/// The server a phone signs in to is chosen on the sign-in screen, not fixed
/// into the build: one store app serves every organization, each on its own
/// server, and a tunnelled server's address changes when the tunnel restarts.

/// A server that answers `/health` at `company.example.com` only.
ResponseBody companyOnly(RequestOptions request) {
  if (request.uri.host == 'company.example.com' &&
      request.uri.path == '/api/health') {
    return jsonReply(envelope({'status': 'ok'}));
  }
  if (request.uri.host == 'company.example.com') {
    return jsonReply(envelope([]));
  }
  throw DioException.connectionError(
      requestOptions: request, reason: 'nothing there');
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('normalizeServerAddress', () {
    test('reads a bare host as the HTTPS API on it', () {
      expect(normalizeServerAddress('company.example.com'),
          'https://company.example.com/api');
    });

    test('ends up at one /api however it is written', () {
      for (final typed in [
        ' https://company.example.com ',
        'https://company.example.com/',
        'https://company.example.com/api',
        'https://company.example.com/api/',
      ]) {
        expect(normalizeServerAddress(typed), 'https://company.example.com/api',
            reason: typed);
      }
    });

    test('keeps a typed scheme and port, for a development backend', () {
      expect(normalizeServerAddress('http://10.0.2.2:3000'),
          'http://10.0.2.2:3000/api');
    });

    test('drops a query and a fragment', () {
      expect(normalizeServerAddress('https://company.example.com/?a=1#top'),
          'https://company.example.com/api');
    });

    test('refuses what has no host, or is not the web', () {
      for (final typed in ['', '   ', 'https://', 'ftp://company.example.com']) {
        expect(normalizeServerAddress(typed), isNull, reason: typed);
      }
    });
  });

  group('ApiService.useServer', () {
    test('switches once the API answers, and sends there from then on',
        () async {
      final (api, adapter, _) = await makeApi(companyOnly);

      expect(await api.useServer('company.example.com'),
          'https://company.example.com/api');
      expect(api.serverAddress, 'https://company.example.com/api');

      await api.send('GET', '/tasks', null);
      expect(adapter.requests.last.uri.toString(),
          'https://company.example.com/api/tasks');
    });

    test('leaves everything as it was when nothing answers', () async {
      final (api, _, _) = await makeApi(companyOnly);

      await expectLater(
          api.useServer('elsewhere.example.com'), throwsA(isA<ServerUnreachable>()));
      expect(api.serverAddress, 'http://localhost/api');
      expect((await SharedPreferences.getInstance()).getString('server_url'),
          isNull);
    });

    test('refuses something that answers but is not this API', () async {
      final (api, _, _) = await makeApi(
          (request) => jsonReply({'hello': 'a different site'}));

      await expectLater(
          api.useServer('company.example.com'), throwsA(isA<ServerUnreachable>()));
    });

    test('never sends a token to the address being checked', () async {
      final (api, adapter, tokens) = await makeApi(companyOnly);
      tokens.values['access_token'] = 'from-the-old-server';

      await api.useServer('company.example.com');

      final probe = adapter.requests
          .singleWhere((request) => request.uri.path == '/api/health');
      expect(probe.headers['Authorization'], isNull);
    });

    test('drops the old server’s session', () async {
      final (api, _, tokens) = await makeApi(companyOnly);
      tokens.values['access_token'] = 'old';
      tokens.values['refresh_token'] = 'old';

      await api.useServer('company.example.com');

      expect(tokens.values, isEmpty);
    });

    test('is remembered when the app is opened again', () async {
      final (api, adapter, _) = await makeApi(companyOnly);
      await api.useServer('company.example.com');

      final client = Dio(BaseOptions(baseUrl: 'http://localhost/api'))
        ..httpClientAdapter = adapter;
      final reopened =
          ApiService.forTesting(client: client, tokenStore: MemoryTokens());
      await reopened.initialize(client: client);

      expect(reopened.serverAddress, 'https://company.example.com/api');
    });
  });

  group('the sign-in screen', () {
    // Switching runs a request, then shared preferences, then token storage,
    // each awaited in turn; real time is let through a few times so the whole
    // chain finishes before the screen is read.
    Future<void> settleRequests(WidgetTester tester) async {
      for (var round = 0; round < 5; round++) {
        await tester.runAsync(
            () => Future<void>.delayed(const Duration(milliseconds: 20)));
        await tester.pump();
      }
      await tester.pumpAndSettle();
    }

    Future<void> pumpLogin(WidgetTester tester, ApiService api) async {
      await tester.pumpWidget(ChangeNotifierProvider(
        create: (_) => AuthProvider(apiService: api),
        child: const MaterialApp(
          locale: Locale('en'),
          supportedLocales: [Locale('en'), Locale('mn')],
          localizationsDelegates: testDelegates,
          home: LoginScreen(),
        ),
      ));
      await tester.pumpAndSettle();
    }

    testWidgets('shows the server and switches to the one typed in',
        (tester) async {
      final (api, _, _) =
          await tester.runAsync(() => makeApi(companyOnly)) ??
              (throw StateError('no api'));
      await pumpLogin(tester, api);

      expect(find.text('Server: localhost'), findsOneWidget);

      await tester.tap(find.byKey(const Key('change-server')));
      await tester.pumpAndSettle();
      await tester.enterText(
          find.byKey(const Key('server-address')), 'company.example.com');
      await tester.tap(find.text('Use'));
      await settleRequests(tester);

      expect(find.byType(AlertDialog), findsNothing);
      expect(find.text('Server: company.example.com'), findsOneWidget);
    });

    testWidgets('keeps the dialog open and says so when nothing answers',
        (tester) async {
      final (api, _, _) =
          await tester.runAsync(() => makeApi(companyOnly)) ??
              (throw StateError('no api'));
      await pumpLogin(tester, api);

      await tester.tap(find.byKey(const Key('change-server')));
      await tester.pumpAndSettle();
      await tester.enterText(
          find.byKey(const Key('server-address')), 'typo.example.com');
      await tester.tap(find.text('Use'));
      await settleRequests(tester);

      expect(find.byType(AlertDialog), findsOneWidget);
      expect(find.textContaining('No Productivity Platform server answered'),
          findsOneWidget);
      expect(find.text('Server: localhost'), findsOneWidget);
    });
  });
}
