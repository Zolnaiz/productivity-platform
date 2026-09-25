import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:productivity_mobile/providers/auth_provider.dart';
import 'package:productivity_mobile/providers/task_provider.dart';
import 'package:productivity_mobile/screens/login_screen.dart';
import 'package:productivity_mobile/screens/tasks_screen.dart';
import 'package:productivity_mobile/services/api_service.dart';
import 'package:productivity_mobile/utils/phase_one_strings.dart';

const List<LocalizationsDelegate<dynamic>> testDelegates = [
  MongolianMaterialDelegate(),
  MongolianCupertinoDelegate(),
  GlobalMaterialLocalizations.delegate,
  GlobalWidgetsLocalizations.delegate,
  GlobalCupertinoLocalizations.delegate
];

class MemoryTokens implements TokenStore {
  final values = <String, String>{};
  @override
  Future<String?> read(String key) async => values[key];
  @override
  Future<void> write(String key, String value) async => values[key] = value;
  @override
  Future<void> delete(String key) async => values.remove(key);
}

typedef Reply = ResponseBody Function(RequestOptions request);

class MockAdapter implements HttpClientAdapter {
  MockAdapter(this.reply);
  final Reply reply;
  final requests = <RequestOptions>[];
  @override
  Future<ResponseBody> fetch(RequestOptions options,
      Stream<Uint8List>? requestStream, Future<void>? cancelFuture) async {
    requests.add(options);
    return reply(options);
  }

  @override
  void close({bool force = false}) {}
}

ResponseBody jsonReply(Object body, {int status = 200}) =>
    ResponseBody.fromString(
      jsonEncode(body),
      status,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType]
      },
    );

Map<String, dynamic> envelope(Object data) => {'success': true, 'data': data};

Future<(ApiService, MockAdapter, MemoryTokens)> makeApi(Reply reply) async {
  dotenv.loadFromString(envString: 'APP_VERSION=1.0.0');
  SharedPreferences.setMockInitialValues({});
  final adapter = MockAdapter(reply);
  final client = Dio(BaseOptions(baseUrl: 'http://localhost/api'))
    ..httpClientAdapter = adapter;
  final tokens = MemoryTokens();
  final api = ApiService.forTesting(client: client, tokenStore: tokens);
  await api.initialize(client: client);
  return (api, adapter, tokens);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('unknown server error codes fall back to a reader-friendly sentence',
      () {
    expect(
        const PhaseOneStrings(Locale('en'))
            .error('error.AUTH_CODE_FROM_THE_FUTURE'),
        'Something went wrong. Try again.');
  });

  testWidgets('shows the server wording for a wrong password', (tester) async {
    final (api, _, _) = await makeApi((_) => jsonReply({
          'statusCode': 401,
          'errorCode': 'AUTH_INVALID_CREDENTIALS',
          'message': 'Invalid email or password'
        }, status: 401));
    await tester.pumpWidget(ChangeNotifierProvider(
        create: (_) => AuthProvider(apiService: api),
        child: const MaterialApp(
            locale: Locale('en'),
            supportedLocales: [Locale('en'), Locale('mn')],
            localizationsDelegates: testDelegates,
            home: LoginScreen())));
    await tester.pumpAndSettle();
    await tester.enterText(
        find.byType(TextFormField).at(0), 'worker@example.com');
    await tester.enterText(find.byType(TextFormField).at(1), 'incorrect');
    await tester.tap(find.byType(FilledButton));
    await tester.pumpAndSettle();
    expect(find.text('Email or password is incorrect.'), findsOneWidget);
  });

  testWidgets('explains a network failure in the selected language',
      (tester) async {
    final (api, _, _) = await makeApi((request) =>
        throw DioException.connectionError(
            requestOptions: request, reason: 'offline'));
    await tester.pumpWidget(ChangeNotifierProvider(
        create: (_) => AuthProvider(apiService: api),
        child: const MaterialApp(
            locale: Locale('mn'),
            supportedLocales: [Locale('en'), Locale('mn')],
            localizationsDelegates: testDelegates,
            home: LoginScreen())));
    await tester.pumpAndSettle();
    await tester.enterText(
        find.byType(TextFormField).at(0), 'worker@example.com');
    await tester.enterText(find.byType(TextFormField).at(1), 'secret');
    await tester.tap(find.byType(FilledButton));
    await tester.pumpAndSettle();
    expect(find.text('Сервертэй холбогдож чадсангүй. Сүлжээгээ шалгана уу.'),
        findsOneWidget);
  });

  testWidgets('renders server tasks and lets the operator change status',
      (tester) async {
    final (api, adapter, _) = await makeApi((request) {
      if (request.method == 'PATCH')
        return jsonReply(envelope({
          'id': 'task-1',
          'title': 'Tier 1 5S audit due: A03 - Storage',
          'titleKey': 'raised.tierAuditDue',
          'titleParams': {'layer': 'Tier 1', 'place': 'A03 - Storage'},
          'assigneeId': 'worker-id',
          'status': 'done'
        }));
      return jsonReply(envelope([
        {
          'id': 'task-1',
          'title': 'Tier 1 5S audit due: A03 - Storage',
          'titleKey': 'raised.tierAuditDue',
          'titleParams': {'layer': 'Tier 1', 'place': 'A03 - Storage'},
          'assigneeId': 'worker-id',
          'status': 'todo'
        },
        {
          'id': 'task-2',
          'title': 'Another operator task',
          'assigneeId': 'another-worker',
          'status': 'todo'
        },
      ]));
    });
    final auth = AuthProvider(apiService: api);
    await auth.fromJson({
      'user': {
        'id': 'worker-id',
        'email': 'worker@example.com',
        'fullName': 'Worker'
      },
      'isAuthenticated': true
    });
    await tester.pumpWidget(MultiProvider(
        providers: [
          ChangeNotifierProvider.value(value: TaskProvider(api)),
          ChangeNotifierProvider.value(value: auth)
        ],
        child: const MaterialApp(
            locale: Locale('mn'),
            supportedLocales: [Locale('en'), Locale('mn')],
            localizationsDelegates: testDelegates,
            home: TasksScreen())));
    await tester.pumpAndSettle();
    expect(find.text('Tier 1-ын 5S аудитын хугацаа болсон: A03 - Storage'),
        findsOneWidget);
    await tester.tap(find.byType(DropdownButton<String>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Дууссан').last);
    await tester.pumpAndSettle();
    expect(
        adapter.requests.any((request) =>
            request.method == 'PATCH' &&
            request.path.endsWith('/tasks/task-1')),
        isTrue);
    expect(find.text('Дууссан'), findsOneWidget);
  });

  testWidgets('shows tasks after the expired token refreshes successfully',
      (tester) async {
    final (api, _, tokens) = await makeApi((request) {
      if (request.path.endsWith('/auth/refresh'))
        return jsonReply(envelope({
          'access_token': 'fresh-access',
          'refresh_token': 'fresh-refresh',
          'token_type': 'Bearer',
          'user': {}
        }));
      if (request.headers['Authorization'] == 'Bearer fresh-access')
        return jsonReply(envelope([]));
      return jsonReply({'errorCode': 'AUTH_TOKEN_INVALID'}, status: 401);
    });
    await tokens.write('access_token', 'stale-access');
    await tokens.write('refresh_token', 'refresh-me');
    final auth = AuthProvider(apiService: api);
    await auth.fromJson({
      'user': {
        'id': 'worker-id',
        'email': 'worker@example.com',
        'fullName': 'Worker'
      },
      'isAuthenticated': true
    });
    await tester.pumpWidget(MultiProvider(
        providers: [
          ChangeNotifierProvider.value(value: TaskProvider(api)),
          ChangeNotifierProvider.value(value: auth)
        ],
        child: const MaterialApp(
            locale: Locale('en'),
            supportedLocales: [Locale('en'), Locale('mn')],
            localizationsDelegates: testDelegates,
            home: TasksScreen())));
    await tester.pumpAndSettle();
    expect(find.text('No tasks assigned to you.'), findsOneWidget);
    expect(await tokens.read('access_token'), 'fresh-access');
  });

  testWidgets(
      'returns to signed-out state when an expired session cannot refresh',
      (tester) async {
    final (api, _, tokens) = await makeApi(
        (_) => jsonReply({'errorCode': 'AUTH_SESSION_EXPIRED'}, status: 401));
    await tokens.write('access_token', 'stale-access');
    await tokens.write('refresh_token', 'expired-refresh');
    final auth = AuthProvider(apiService: api);
    await auth.fromJson({
      'user': {
        'id': 'user-1',
        'email': 'worker@example.com',
        'fullName': 'Worker'
      },
      'isAuthenticated': true
    });
    await tester.pumpWidget(MultiProvider(
        providers: [
          ChangeNotifierProvider.value(value: TaskProvider(api)),
          ChangeNotifierProvider.value(value: auth)
        ],
        child: const MaterialApp(
            locale: Locale('en'),
            supportedLocales: [Locale('en'), Locale('mn')],
            localizationsDelegates: testDelegates,
            home: TasksScreen())));
    await tester.pumpAndSettle();
    expect(auth.isAuthenticated, isFalse);
    expect(find.text('Your session expired. Sign in again.'), findsOneWidget);
  });

  test('retries a task request once after refreshing an expired access token',
      () async {
    final (api, adapter, tokens) = await makeApi((request) {
      if (request.path.endsWith('/auth/refresh'))
        return jsonReply(envelope({
          'access_token': 'new-access',
          'refresh_token': 'new-refresh',
          'token_type': 'Bearer',
          'user': {}
        }));
      if (request.headers['Authorization'] == 'Bearer new-access')
        return jsonReply(envelope([]));
      return jsonReply({'errorCode': 'AUTH_TOKEN_INVALID'}, status: 401);
    });
    await tokens.write('access_token', 'expired');
    await tokens.write('refresh_token', 'valid-refresh');
    expect(await api.getTasks(), isEmpty);
    expect(adapter.requests.map((r) => r.path).toList(),
        ['/tasks', '/auth/refresh', '/tasks']);
    expect(adapter.requests[1].data['refreshToken'], 'valid-refresh');
    expect(await tokens.read('access_token'), 'new-access');
  });

  test('lets concurrent expired requests share one refresh operation',
      () async {
    var refreshRequests = 0;
    final (api, _, tokens) = await makeApi((request) {
      if (request.path.endsWith('/auth/refresh')) {
        refreshRequests++;
        return jsonReply(envelope({
          'access_token': 'shared-access',
          'refresh_token': 'shared-refresh',
          'token_type': 'Bearer',
          'user': {},
        }));
      }
      if (request.headers['Authorization'] == 'Bearer shared-access') {
        return jsonReply(envelope([]));
      }
      return jsonReply({'errorCode': 'AUTH_TOKEN_INVALID'}, status: 401);
    });
    await tokens.write('access_token', 'old-access');
    await tokens.write('refresh_token', 'valid-refresh');

    await Future.wait([api.getTasks(), api.getTasks()]);

    expect(refreshRequests, 1);
    expect(await tokens.read('access_token'), 'shared-access');
  });

  test('clears the refreshed credentials when the server rejects the retry',
      () async {
    final (api, adapter, tokens) = await makeApi((request) {
      if (request.path.endsWith('/auth/refresh')) {
        return jsonReply(envelope({
          'access_token': 'fresh-but-rejected',
          'refresh_token': 'rotated-refresh',
          'token_type': 'Bearer',
          'user': {},
        }));
      }
      return jsonReply({'errorCode': 'AUTH_TOKEN_INVALID'}, status: 401);
    });
    await tokens.write('access_token', 'expired-access');
    await tokens.write('refresh_token', 'valid-refresh');

    await expectLater(api.getTasks(), throwsA(isA<DioException>()));

    expect(adapter.requests.map((request) => request.path), [
      '/tasks',
      '/auth/refresh',
      '/tasks',
    ]);
    expect(await tokens.read('access_token'), isNull);
    expect(await tokens.read('refresh_token'), isNull);
  });

  test('clears credentials after refresh fails rather than retrying forever',
      () async {
    final (api, adapter, tokens) = await makeApi((request) =>
        jsonReply({'errorCode': 'AUTH_SESSION_EXPIRED'}, status: 401));
    await tokens.write('access_token', 'expired');
    await tokens.write('refresh_token', 'expired-refresh');
    await expectLater(api.getTasks(), throwsA(isA<DioException>()));
    expect(adapter.requests.map((r) => r.path).toList(),
        ['/tasks', '/auth/refresh']);
    expect(await tokens.read('access_token'), isNull);
    expect(await tokens.read('refresh_token'), isNull);
  });
}
