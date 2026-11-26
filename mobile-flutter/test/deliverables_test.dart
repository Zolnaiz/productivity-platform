// Widget test for deliverables_sheet.dart: a photo of the finished work, sent for review, and a returned review.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:productivity_mobile/screens/deliverables_sheet.dart';

import 'support/fake_api.dart';

Map<String, dynamic> view(String status,
        {List<Map<String, dynamic>> files = const [], String? note}) =>
    {
      'review': {'status': status, 'note': note},
      'files': files,
    };

final photoV1 = {
  'id': 'f1',
  'fileName': 'photo-2026-11-26-101500.jpg',
  'sizeBytes': 2048,
  'version': 1,
};

Widget host(Widget child) => MaterialApp(
      locale: const Locale('en'),
      supportedLocales: const [Locale('en'), Locale('mn')],
      localizationsDelegates: testDelegates,
      home: Scaffold(body: child),
    );

void main() {
  testWidgets('takes a photo of the work, sends it for review, and reports the new state',
      (tester) async {
    var status = 'none';
    var files = <Map<String, dynamic>>[];
    final (api, adapter, _) = await makeApi((request) {
      if (request.method == 'POST' && request.path.endsWith('/submit')) {
        status = 'submitted';
      } else if (request.method == 'POST') {
        files = [photoV1];
      }
      return jsonReply(envelope(view(status, files: files)));
    });
    final reported = <String>[];

    await tester.pumpWidget(host(DeliverablesSheet(
      api: api,
      taskId: 't1',
      onStatus: reported.add,
      pickPhoto: () async => (bytes: [0xff, 0xd8, 0xff, 0xe0], name: 'work.jpg'),
    )));
    await settleUntil(tester, () => find.text('Not sent').evaluate().isNotEmpty);

    // Nothing to send until there is something to look at.
    expect(tester.widget<FilledButton>(find.byKey(const Key('docs-submit'))).onPressed, isNull);

    await tester.tap(find.byKey(const Key('docs-photo')));
    await settleUntil(tester, () => find.byKey(const Key('doc-f1')).evaluate().isNotEmpty);
    expect(find.text('v1'), findsOneWidget);
    expect(adapter.requests.any((r) => r.method == 'POST' && r.path == '/tasks/t1/deliverables'), isTrue);

    await tester.tap(find.byKey(const Key('docs-submit')));
    await settleUntil(tester, () => find.text('Under review').evaluate().isNotEmpty);
    expect(reported.last, 'submitted');
    // Frozen while it is being reviewed.
    expect(find.byKey(const Key('docs-photo')), findsNothing);
  });

  testWidgets('shows why the documents came back, and lets the person add a new version', (tester) async {
    final (api, _, _) = await makeApi((request) => jsonReply(
        envelope(view('returned', files: [photoV1], note: 'Show the label too'))));

    await tester.pumpWidget(host(DeliverablesSheet(api: api, taskId: 't1', onStatus: (_) {})));
    await settleUntil(tester, () => find.byKey(const Key('docs-note')).evaluate().isNotEmpty);

    expect(find.textContaining('Show the label too'), findsOneWidget);
    expect(find.byKey(const Key('docs-photo')), findsOneWidget);
  });

  testWidgets('says plainly when the server refuses a step', (tester) async {
    final (api, _, _) = await makeApi((request) => request.method == 'GET'
        ? jsonReply(envelope(view('none', files: [photoV1])))
        : jsonReply({'success': false, 'errorCode': 'DELIVERABLE_LOCKED'}, status: 409));

    await tester.pumpWidget(host(DeliverablesSheet(api: api, taskId: 't1', onStatus: (_) {})));
    await settleUntil(tester, () => find.byKey(const Key('doc-f1')).evaluate().isNotEmpty);
    await tester.tap(find.byKey(const Key('docs-submit')));
    await settleUntil(tester, () => find.byKey(const Key('docs-error')).evaluate().isNotEmpty);

    expect(find.textContaining('under review or approved'), findsOneWidget);
  });
}
