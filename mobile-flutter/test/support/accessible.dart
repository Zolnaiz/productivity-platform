import 'package:flutter_test/flutter_test.dart';

/// Flutter's own accessibility checks, on whatever is on screen now: every
/// control big enough for a thumb (48 by 48 on Android, 44 on iOS), every
/// control named for a screen reader, and text at 4.5:1 or better.
Future<void> expectAccessible(WidgetTester tester) async {
  final semantics = tester.ensureSemantics();
  await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
  await expectLater(tester, meetsGuideline(iOSTapTargetGuideline));
  await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
  await expectLater(tester, meetsGuideline(textContrastGuideline));
  semantics.dispose();
}
