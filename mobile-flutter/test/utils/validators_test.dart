import 'package:flutter_test/flutter_test.dart';
import 'package:productivity_mobile/utils/validators.dart';

/// `Validators` is the only util the screens actually call — login, register
/// and profile all validate through it, so a mistake here is a mistake a user
/// meets on their first screen.
void main() {
  group('validateEmail', () {
    test('accepts an ordinary address', () {
      expect(Validators.validateEmail('owner@example.com'), isNull);
    });

    test('rejects an empty field with a reason', () {
      expect(Validators.validateEmail(''), 'Email is required');
      expect(Validators.validateEmail(null), 'Email is required');
    });

    test('rejects an address with no domain', () {
      expect(Validators.validateEmail('owner@'), isNotNull);
      expect(Validators.validateEmail('owner'), isNotNull);
    });
  });

  group('validatePassword', () {
    test('accepts a password with a letter and a number', () {
      expect(Validators.validatePassword('Password123'), isNull);
    });

    test('states the rule that was broken, not just that it failed', () {
      expect(Validators.validatePassword('abc12'), contains('6 characters'));
      expect(Validators.validatePassword('password'), contains('number'));
      expect(Validators.validatePassword('12345678'), contains('letter'));
    });
  });

  group('validateName', () {
    test('accepts a Latin name', () {
      expect(Validators.validateName('Bat Erdene'), isNull);
    });

    test('accepts a Mongolian name', () {
      // The first deployment is Mongolian. A rule that only admits a-z locks
      // every one of those users out of registration and profile editing.
      expect(Validators.validateName('Батбаяр'), isNull);
      expect(Validators.validateName('Ганбат Дорж'), isNull);
    });

    test('accepts a hyphenated name', () {
      expect(Validators.validateName('Anne-Marie'), isNull);
    });

    test('rejects digits and punctuation', () {
      expect(Validators.validateName('Bat3'), isNotNull);
      expect(Validators.validateName('DROP TABLE;'), isNotNull);
    });

    test('names the field it is complaining about', () {
      expect(Validators.validateName('', fieldName: 'First name'),
          'First name is required');
    });
  });

  group('validatePhone', () {
    test('treats an empty phone as acceptable, because it is optional', () {
      expect(Validators.validatePhone(''), isNull);
      expect(Validators.validatePhone(null), isNull);
    });

    test('accepts a Mongolian number with its country code', () {
      expect(Validators.validatePhone('+976 9911 2233'), isNull);
    });

    test('rejects something that is not a phone number', () {
      expect(Validators.validatePhone('call me'), isNotNull);
    });
  });

  group('validateRequired', () {
    test('treats whitespace as empty', () {
      expect(Validators.validateRequired('   '), 'This field is required');
    });

    test('accepts any real content', () {
      expect(Validators.validateRequired('0'), isNull);
    });
  });

  group('validateNumber', () {
    test('enforces the range it was given', () {
      expect(Validators.validateNumber('5', min: 1, max: 10), isNull);
      expect(Validators.validateNumber('0', min: 1), contains('at least'));
      expect(Validators.validateNumber('11', max: 10), contains('at most'));
    });

    test('rejects text', () {
      expect(Validators.validateNumber('many'), isNotNull);
    });
  });

  group('validateMultiple', () {
    test('reports the first rule that fails', () {
      final error = Validators.validateMultiple('', [
        (value) => Validators.validateRequired(value, fieldName: 'Title'),
        (value) => Validators.validateMinLength(value!, 5),
      ]);

      expect(error, 'Title is required');
    });

    test('passes when every rule passes', () {
      final error = Validators.validateMultiple('A real title', [
        (value) => Validators.validateRequired(value),
        (value) => Validators.validateMinLength(value!, 5),
      ]);

      expect(error, isNull);
    });
  });
}
