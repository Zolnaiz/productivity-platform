import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:productivity_mobile/models/five_s_model.dart';
import 'package:productivity_mobile/models/work_log_model.dart';
import 'package:productivity_mobile/providers/auth_provider.dart';
import 'package:productivity_mobile/providers/five_s_provider.dart';
import 'package:productivity_mobile/screens/five_s_screen.dart';
import 'package:productivity_mobile/services/api_service.dart';
import 'package:productivity_mobile/utils/phase_one_strings.dart';

import 'support/fake_api.dart';

const _template = {
  'id': 't-daily',
  'title': 'Daily 5S',
  'category': '5s',
  'isActive': true,
  'questions': [
    {'id': 'q1', 'text': 'Tools back on the shadow board', 'type': 'score', 'maxScore': 4},
    {'id': 'q2', 'text': 'Floor lines unbroken', 'type': 'yes_no'},
    {'id': 'q3', 'text': 'Anything else', 'type': 'text'},
  ],
};

const _supervisorTemplate = {
  'id': 't-weekly',
  'title': 'Weekly 5S',
  'category': '5s',
  'isActive': true,
  'questions': [
    {'id': 's1', 'text': 'Standard posted and current', 'type': 'yes_no'},
  ],
};

final _plan = {
  'id': 'plan-1',
  'name': 'Workshop',
  'site': 'Main',
  'floor': '1',
  'auditTiers': [
    {'tier': 1, 'name': 'Operator', 'role': 'user', 'frequency': 'daily', 'templateId': 't-daily'},
    {'tier': 2, 'name': 'Supervisor', 'role': 'manager', 'frequency': 'weekly', 'templateId': 't-weekly'},
  ],
  'zones': [
    {
      'id': 'z1',
      'code': 'A1',
      'name': 'Tool wall',
      'lastAuditScore': 62,
      'lastAuditAt': '2026-09-20T03:00:00.000Z',
      'lastCleanedAt': '2026-09-26',
      'redTags': [
        {'id': 'rt1', 'title': 'Broken pallet', 'disposition': 'Scrap it', 'status': 'open'},
        {'id': 'rt2', 'title': 'Old drill', 'status': 'open', 'closedAt': '2026-09-01'},
      ],
    },
    {'id': 'z2', 'code': 'A2', 'name': 'Stores'},
  ],
};

Future<(ApiService, MockAdapter)> _server({int saveStatus = 201}) async {
  final (api, adapter, _) = await makeApi((request) {
    if (request.path == '/five-s-layouts') return jsonReply(envelope([_plan]));
    if (request.path == '/audit-templates') {
      return jsonReply(envelope([
        _template,
        _supervisorTemplate,
        {'id': 't-old', 'title': 'Retired', 'category': '5s', 'isActive': false, 'questions': []},
        {'id': 't-safety', 'title': 'Safety walk', 'category': 'safety', 'isActive': true, 'questions': []},
      ]));
    }
    if (request.path.endsWith('/red-tags') && request.method == 'POST') {
      return jsonReply(envelope({'id': 'rt3', 'title': 'Spare chair', 'status': 'open'}), status: 201);
    }
    if (request.path.endsWith('/cleaned') && request.method == 'POST') {
      return jsonReply(envelope({'zoneId': 'z1', 'lastCleanedAt': '2026-09-28'}), status: 201);
    }
    if (request.path == '/audit-runs' && request.method == 'POST') {
      return saveStatus < 300
          ? jsonReply(envelope({'id': 'run-1'}), status: saveStatus)
          : jsonReply({'success': false, 'errorCode': 'INTERNAL_ERROR'}, status: saveStatus);
    }
    return jsonReply(envelope([]));
  });
  return (api, adapter);
}

Future<void> _pump(WidgetTester tester, ApiService api,
    {String role = 'user', Locale locale = const Locale('en')}) async {
  SharedPreferences.setMockInitialValues({
    'user': jsonEncode({'id': 'u1', 'email': 'op@example.com', 'role': role}),
  });
  final auth = AuthProvider(apiService: api);
  await tester.pumpWidget(MultiProvider(
    providers: [
      ChangeNotifierProvider.value(value: auth),
      ChangeNotifierProvider.value(value: FiveSProvider(api)),
    ],
    child: MaterialApp(
      locale: locale,
      supportedLocales: const [Locale('en'), Locale('mn')],
      localizationsDelegates: testDelegates,
      home: const FiveSScreen(),
    ),
  ));
  await tester.pumpAndSettle();
}

Map<String, dynamic> _posted(MockAdapter adapter) {
  final request = adapter.requests
      .lastWhere((request) => request.path == '/audit-runs' && request.method == 'POST');
  return (request.data as Map).cast<String, dynamic>();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('scoring, as the web scores', () {
    final template = AuditTemplate.fromJson(_template);

    test('counts score questions out of their maximum and yes as one', () {
      expect(scoreAnswers(template, {'q1': '3', 'q2': 'yes', 'q3': 'dusty'}), 80);
    });

    test('counts an unanswered question as nought, not as missing', () {
      expect(scoreAnswers(template, {'q1': '4'}), 80);
      expect(scoreAnswers(template, {}), 0);
    });

    test('scores a score question with no maximum out of five', () {
      final open = AuditTemplate.fromJson({
        'id': 'x',
        'title': 'x',
        'questions': [
          {'id': 'a', 'text': 'a', 'type': 'score'}
        ],
      });
      expect(scoreAnswers(open, {'a': '4'}), 80);
    });

    test('sends a number, a boolean and the words, one per question', () {
      expect(answersForRun(template, {'q1': '3', 'q2': 'no'}), [
        {'questionId': 'q1', 'value': 3},
        {'questionId': 'q2', 'value': false},
        {'questionId': 'q3', 'value': ''},
      ]);
    });
  });

  group('audit layers', () {
    final tiers = FiveSPlan.fromJson(_plan).auditTiers;

    test('defaults to the most senior layer the person covers', () {
      expect(tierForRole(tiers, 'user')?.tier, 1);
      expect(tierForRole(tiers, 'manager')?.tier, 2);
      expect(tierForRole(tiers, 'admin')?.tier, 2);
    });

    test('offers a viewer no layer to record', () {
      expect(tierForRole(tiers, 'viewer'), isNull);
    });

    test('uses the standard three layers when the plan sets none', () {
      expect(tiersForRole(const [], 'manager').map((tier) => tier.name),
          ['Operator', 'Supervisor']);
    });
  });

  test('dates a check on the phone’s calendar, not UTC’s', () {
    const strings = PhaseOneStrings(Locale('en'));
    const late = '2026-09-26T20:30:00.000Z';
    expect(strings.lastChecked(late),
        'Last checked ${localDay(DateTime.parse(late))}');
    // A bare date is already a day and is not shifted.
    expect(strings.lastChecked('2026-06-12'), 'Last checked 2026-06-12');
  });

  testWidgets('lists the areas with how they last scored', (tester) async {
    final (api, _) = await _server();
    await _pump(tester, api);

    expect(find.text('A1 - Tool wall'), findsOneWidget);
    expect(find.text('Last checked 2026-09-20'), findsOneWidget);
    expect(find.text('62'), findsOneWidget);
    expect(find.text('A2 - Stores'), findsOneWidget);
    expect(find.text('Not checked yet'), findsOneWidget);
  });

  testWidgets('records an operator’s walk against their layer’s checklist',
      (tester) async {
    final (api, adapter) = await _server();
    await _pump(tester, api);

    await tester.tap(find.text('A1 - Tool wall'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('zone-walk')));
    await tester.pumpAndSettle();

    // An operator covers one layer, so there is nothing to choose.
    expect(find.byKey(const Key('audit-layer')), findsNothing);
    expect(find.text('Tools back on the shadow board'), findsOneWidget);

    await tester.tap(find.byKey(const Key('answer-q1-3')));
    await tester.tap(find.byKey(const Key('answer-q2-yes')));
    await tester.enterText(find.byKey(const Key('answer-q3')), 'Two spanners missing');
    await tester.pump();
    expect(find.text('Score: 80%'), findsOneWidget);

    await tester.ensureVisible(find.byKey(const Key('audit-save')));
    await tester.tap(find.byKey(const Key('audit-save')));
    await tester.pumpAndSettle();

    expect(_posted(adapter), {
      'templateId': 't-daily',
      'zoneId': 'z1',
      'tier': 1,
      'location': 'A1 - Tool wall',
      'score': 80,
      'status': 'submitted',
      'answers': [
        {'questionId': 'q1', 'value': 3},
        {'questionId': 'q2', 'value': true},
        {'questionId': 'q3', 'value': 'Two spanners missing'},
      ],
    });
    expect(find.text('Check recorded: 80%'), findsOneWidget);
    // Back on the area, which was read again for its new score.
    expect(find.byKey(const Key('zone-walk')), findsOneWidget);
    expect(adapter.requests.where((r) => r.path == '/five-s-layouts').length, 2);
  });

  testWidgets('files a supervisor’s walk as the supervisor’s check',
      (tester) async {
    final (api, adapter) = await _server();
    await _pump(tester, api, role: 'manager');

    await tester.tap(find.text('A2 - Stores'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('zone-walk')));
    await tester.pumpAndSettle();

    expect(find.text('Supervisor'), findsOneWidget);
    expect(find.text('Standard posted and current'), findsOneWidget);
    await tester.tap(find.byKey(const Key('answer-s1-no')));
    await tester.tap(find.byKey(const Key('audit-save')));
    await tester.pumpAndSettle();

    final run = _posted(adapter);
    expect(run['tier'], 2);
    expect(run['templateId'], 't-weekly');
    expect(run['score'], 0);
  });

  testWidgets('keeps the answers on screen when the save fails', (tester) async {
    final (api, _) = await _server(saveStatus: 500);
    await _pump(tester, api);

    await tester.tap(find.text('A1 - Tool wall'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('zone-walk')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('answer-q1-4')));
    await tester.ensureVisible(find.byKey(const Key('audit-save')));
    await tester.tap(find.byKey(const Key('audit-save')));
    await tester.pumpAndSettle();

    expect(find.text('Something went wrong on the server. Try again.'), findsOneWidget);
    expect(find.text('Score: 80%'), findsOneWidget);
    expect(find.byKey(const Key('audit-save')), findsOneWidget);
  });

  testWidgets('reads in Mongolian', (tester) async {
    final (api, _) = await _server();
    await _pump(tester, api, locale: const Locale('mn'));

    expect(find.text('Одоогоор шалгаагүй'), findsOneWidget);
    await tester.tap(find.text('A1 - Tool wall'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('zone-walk')));
    await tester.pumpAndSettle();
    expect(find.text('Тийм'), findsOneWidget);
    expect(find.text('Шалгалтыг бүртгэх'), findsOneWidget);
  });

  group('an area, from where it is', () {
    testWidgets('shows what is still tagged there, not what was cleared',
        (tester) async {
      final (api, _) = await _server();
      await _pump(tester, api);
      await tester.tap(find.text('A1 - Tool wall'));
      await tester.pumpAndSettle();

      expect(find.text('Red tags (1)'), findsOneWidget);
      expect(find.text('Broken pallet'), findsOneWidget);
      expect(find.text('Scrap it'), findsOneWidget);
      expect(find.text('Old drill'), findsNothing);
      expect(find.text('Last cleaned 2026-09-26'), findsOneWidget);
    });

    testWidgets('tags something from the floor', (tester) async {
      final (api, adapter) = await _server();
      await _pump(tester, api);
      await tester.tap(find.text('A1 - Tool wall'));
      await tester.pumpAndSettle();

      await tester.enterText(find.byKey(const Key('redtag-title')), 'Spare chair');
      await tester.ensureVisible(find.byKey(const Key('redtag-save')));
      await tester.tap(find.byKey(const Key('redtag-save')));
      await tester.pumpAndSettle();

      final request = adapter.requests.lastWhere((r) => r.path.endsWith('/red-tags'));
      expect(request.path, '/five-s-layouts/plan-1/zones/z1/red-tags');
      expect(request.data, {'title': 'Spare chair'});
      expect(find.text('Red tag added.'), findsOneWidget);
    });

    testWidgets('says the area was cleaned today', (tester) async {
      final (api, adapter) = await _server();
      await _pump(tester, api);
      await tester.tap(find.text('A1 - Tool wall'));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('zone-cleaned')));
      await tester.pumpAndSettle();

      expect(adapter.requests.map((r) => r.path),
          contains('/five-s-layouts/plan-1/zones/z1/cleaned'));
    });

    testWidgets('lets a viewer look, not act', (tester) async {
      final (api, _) = await _server();
      await _pump(tester, api, role: 'viewer');
      await tester.tap(find.text('A1 - Tool wall'));
      await tester.pumpAndSettle();

      expect(find.text('Broken pallet'), findsOneWidget);
      expect(find.byKey(const Key('zone-walk')), findsNothing);
      expect(find.byKey(const Key('redtag-save')), findsNothing);
    });
  });
}
