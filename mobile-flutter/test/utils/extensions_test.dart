import 'package:flutter_test/flutter_test.dart';
import 'package:productivity_mobile/utils/extensions.dart';

/// Only a small part of `extensions.dart` reaches a screen: the profile screen
/// formats two dates through `DateTime.format`. These cover that path and the
/// string helpers most likely to be reached for next.
void main() {
  group('DateTime.format', () {
    final date = DateTime(2026, 9, 2, 14, 30);

    test('uses a readable default rather than an ISO string', () {
      expect(date.format(), 'Sep 02, 2026');
    });

    test('honours an explicit pattern', () {
      expect(date.format(pattern: 'yyyy-MM-dd'), '2026-09-02');
    });

    test('formats the time separately', () {
      expect(date.formatTime(), '14:30');
    });
  });

  group('String helpers', () {
    test('capitalizes only the first letter, leaving the rest alone', () {
      expect('bat'.capitalizeFirst, 'Bat');
      expect('mPo'.capitalizeFirst, 'MPo');
    });

    test('handles an empty string without throwing', () {
      expect(''.capitalizeFirst, '');
      expect(''.toTitleCase, '');
    });

    test('recognises an address as an email', () {
      expect('owner@example.com'.isEmail, isTrue);
      expect('owner@'.isEmail, isFalse);
    });
  });
}
