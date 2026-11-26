// Real network failures between the phone's code and a running server.
//
// The outbox tests (outbox_test.dart) answer every request from a fake
// adapter, which fails only the way it is told to. Here the app's own
// providers talk to a real server through [_Link], a TCP relay on loopback
// that the test breaks the two ways a workshop's Wi-Fi breaks:
//
//  - down: nothing listens on the port, so a request is refused before it
//    leaves the phone - no signal at all;
//  - losing answers: what the phone sends reaches the server, which saves
//    it, and the line drops as the answer starts back - the signal lost
//    mid-request.
//
// The second is the one a fake cannot show honestly, because whether a
// change ends up saved once depends on the server really holding the first
// copy. Each test counts the copies on the server over a separate, unbroken
// connection.
//
// It writes, so it runs only with LIVE_WRITES=true against a throwaway
// database, as CI's "Live API" job does:
//
//   flutter test test/network_drop_live_test.dart \
//     --dart-define=API_BASE_URL=http://127.0.0.1:3000/api \
//     --dart-define=LIVE_WRITES=true
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:productivity_mobile/providers/five_s_provider.dart';
import 'package:productivity_mobile/providers/idea_provider.dart';
import 'package:productivity_mobile/providers/work_log_provider.dart';
import 'package:productivity_mobile/services/api_service.dart';
import 'package:productivity_mobile/services/outbox.dart';

import 'support/fake_api.dart' show MemoryTokens;

/// Lets the test's requests leave the process: the default test binding
/// answers every HTTP request with 400 so widget tests cannot reach a network.
class _LiveNetworkBinding extends AutomatedTestWidgetsFlutterBinding {
  @override
  bool get overrideHttpClient => false;
}

enum _LinkState { up, down, losingAnswers }

/// The stretch of network between the phone and the server, as a TCP relay
/// the test can break. Each connection through it is two sockets - the
/// phone's and the server's - copied byte for byte while the link is up.
class _Link {
  _Link(this._server);

  /// The real server's host and port, from API_BASE_URL.
  final Uri _server;
  final _open = <Socket>{};
  ServerSocket? _listener;
  late final int port;
  var _state = _LinkState.up;

  /// API_BASE_URL with the relay's port in place of the server's.
  String get baseUrl => _server.replace(host: '127.0.0.1', port: port).toString();

  Future<void> open() async {
    _listener = await ServerSocket.bind(InternetAddress.loopbackIPv4, 0);
    port = _listener!.port;
    _listener!.listen(_relay);
  }

  /// No signal: the port stops listening and every open connection is cut,
  /// so the next request is refused before anything leaves.
  Future<void> down() async {
    _state = _LinkState.down;
    await _listener?.close();
    _listener = null;
    _cutAll();
  }

  /// Signal back, on the same port.
  Future<void> up() async {
    _state = _LinkState.up;
    if (_listener != null) return;
    _listener = await ServerSocket.bind(InternetAddress.loopbackIPv4, port);
    _listener!.listen(_relay);
  }

  /// Signal lost mid-request: requests still reach the server, and the
  /// connection is cut on the first byte of its answer - by which time the
  /// server has finished, and committed, whatever was asked.
  Future<void> loseAnswers() async {
    await up();
    _state = _LinkState.losingAnswers;
  }

  Future<void> close() async {
    await _listener?.close();
    _cutAll();
  }

  void _cutAll() {
    for (final socket in _open.toList()) {
      socket.destroy();
    }
    _open.clear();
  }

  Future<void> _relay(Socket phone) async {
    _open.add(phone);
    final Socket server;
    try {
      server = await Socket.connect(_server.host, _server.port);
    } catch (_) {
      phone.destroy();
      _open.remove(phone);
      return;
    }
    _open.add(server);
    void cut() {
      phone.destroy();
      server.destroy();
      _open
        ..remove(phone)
        ..remove(server);
    }

    // A write to a socket already cut throws; that end is gone either way.
    void copy(Socket to, List<int> bytes) {
      try {
        to.add(bytes);
      } catch (_) {
        cut();
      }
    }

    phone.listen((bytes) => copy(server, bytes),
        onDone: cut, onError: (_) => cut());
    server.listen((bytes) {
      if (_state == _LinkState.losingAnswers) return cut();
      copy(phone, bytes);
    }, onDone: cut, onError: (_) => cut());
  }
}

void main() {
  _LiveNetworkBinding();

  const baseUrl = String.fromEnvironment('API_BASE_URL');
  const writes = bool.fromEnvironment('LIVE_WRITES');
  const email = String.fromEnvironment('MOBILE_TEST_EMAIL',
      defaultValue: 'owner@example.com');
  const password = String.fromEnvironment('MOBILE_TEST_PASSWORD',
      defaultValue: 'Password123');
  const skip = baseUrl == '' || !writes
      ? 'needs API_BASE_URL and LIVE_WRITES=true (a throwaway database)'
      : null;

  // Shared by every test: one relay, the phone's session through it, and a
  // second session straight to the server for counting what it holds.
  late _Link link;
  late ApiService phone;
  late ApiService direct;
  late Outbox outbox;
  late String myId;
  final clients = <Dio>[];

  Future<ApiService> signIn(String url) async {
    final client = Dio(BaseOptions(baseUrl: url));
    clients.add(client);
    final api = ApiService.forTesting(client: client, tokenStore: MemoryTokens());
    await api.initialize(client: client);
    final session = await api.login(email, password);
    myId = session['user']['id'] as String;
    return api;
  }

  /// A title or summary no earlier run of this test has used, so counting
  /// it on a database the test has written to before still means something.
  String unique(String what) =>
      '$what over a dropped line ${DateTime.now().microsecondsSinceEpoch}';

  setUpAll(() async {
    if (skip != null) return;
    SharedPreferences.setMockInitialValues({});
    dotenv.loadFromString(envString: 'APP_VERSION=1.0.0');
    link = _Link(Uri.parse(baseUrl));
    await link.open();
    phone = await signIn(link.baseUrl);
    direct = await signIn(baseUrl);
  });

  setUp(() async {
    if (skip != null) return;
    SharedPreferences.setMockInitialValues({});
    await link.up();
    // A fresh outbox each time, signed in as the account the test uses, so
    // one test's kept change is never sent by the next.
    outbox = Outbox(phone);
    await outbox.signedIn(myId);
  });

  tearDownAll(() async {
    if (skip != null) return;
    await link.close();
    for (final client in clients) {
      client.close(force: true);
    }
  });

  Future<int> ideasTitled(String title) async =>
      (await direct.getIdeas()).where((idea) => idea['title'] == title).length;

  test('an idea made with no signal is kept, and reaches the server once it is back',
      () async {
    final ideas = IdeaProvider(phone, outbox: outbox);
    final title = unique('An idea');

    await link.down();
    await ideas.submit(title: title, description: 'Kept while the line was down.');

    expect(ideas.lastKept, isTrue);
    expect(outbox.ownPending, hasLength(1));
    expect(await ideasTitled(title), 0, reason: 'nothing left the phone');

    await link.up();
    expect(await outbox.flush(), 1);
    expect(outbox.pending, isEmpty);
    expect(await ideasTitled(title), 1);
  }, skip: skip);

  test('an idea whose answer was lost is kept, and sending it again does not make a second',
      () async {
    final ideas = IdeaProvider(phone, outbox: outbox);
    final title = unique('An idea');

    await link.loseAnswers();
    await ideas.submit(title: title, description: 'The answer never came back.');

    expect(await ideasTitled(title), 1, reason: 'the server has the first copy');
    expect(ideas.lastKept, isTrue,
        reason: 'no answer is not a refusal: kept, not shown as an error to send again');

    await link.up();
    expect(await outbox.flush(), 1);
    expect(outbox.pending, isEmpty);
    expect(await ideasTitled(title), 1, reason: 'the second send was the same write');
  }, skip: skip);

  test('an audit whose answer was lost is recorded once, so the area is scored once',
      () async {
    final fiveS = FiveSProvider(phone, outbox: outbox);
    await fiveS.load();
    final plan = fiveS.plans.firstWhere((plan) => plan.zones.isNotEmpty,
        orElse: () => throw StateError('Seed a 5S layout with an area.'));
    final zone = plan.zones.first;
    final template = fiveS.templates.firstWhere(
        (template) => template.isActive && template.questions.isNotEmpty,
        orElse: () => throw StateError('Seed an audit checklist with questions.'));
    final answers = <String, String>{
      for (final question in template.questions)
        question.id: switch (question.type) {
          'score' => '${question.outOf}',
          'yes_no' => 'yes',
          _ => 'Walked over a dropped line.',
        },
    };
    Future<int> runs() async =>
        ((await direct.send('GET', '/audit-runs?zoneId=${zone.id}', null)) as List)
            .length;
    final before = await runs();

    await link.loseAnswers();
    await fiveS.submit(zone: zone, template: template, answers: answers);

    expect(await runs(), before + 1, reason: 'the server has the first copy');
    expect(fiveS.lastKept, isTrue);

    await link.up();
    expect(await outbox.flush(), 1);
    expect(await runs(), before + 1,
        reason: 'one walk, one run: a second would move the score again');
  }, skip: skip);

  test('a day written up as the answer was lost is saved once, and its hours counted once',
      () async {
    final logs = WorkLogProvider(phone, outbox: outbox);
    final summary = unique('A day');
    Future<int> saved() async => (await direct.getWorkLogs())
        .where((log) => log['summary'] == summary)
        .length;

    await link.loseAnswers();
    expect(await logs.submit(summary: summary, hours: 1.5), isTrue);

    expect(await saved(), 1);
    expect(logs.lastKept, isTrue);

    await link.up();
    expect(await outbox.flush(), 1);
    expect(await saved(), 1);
  }, skip: skip);
}
