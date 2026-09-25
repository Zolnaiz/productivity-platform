import 'package:flutter_test/flutter_test.dart';
import 'package:productivity_mobile/models/user_model.dart';

User userWith({String fullName = '', String username = 'owner'}) => User(
      id: 'user-1',
      email: 'owner@example.com',
      username: username,
      fullName: fullName,
      role: 'user',
      isActive: true,
      createdAt: DateTime(2026, 1, 1),
      updatedAt: DateTime(2026, 1, 1),
    );

/// The profile screen renders `user.initials` into the avatar on every visit,
/// so anything this getter cannot handle is a crash on a screen every user
/// opens.
void main() {
  group('initials', () {
    test('takes the first letter of the first two names', () {
      expect(userWith(fullName: 'Bat Erdene').initials, 'BE');
    });

    test('takes one letter when there is only one name', () {
      expect(userWith(fullName: 'Батбаяр').initials, 'Б');
    });

    test('falls back to the username when there is no full name', () {
      expect(userWith(username: 'owner').initials, 'O');
    });

    test('survives a double space between names', () {
      // 'Bat  Erdene'.split(' ') yields an empty middle part, and reading
      // character zero of it used to throw where the avatar is drawn.
      expect(userWith(fullName: 'Bat  Erdene').initials, 'BE');
    });

    test('survives leading and trailing whitespace', () {
      expect(userWith(fullName: '  Bat Erdene  ').initials, 'BE');
    });

    test('survives a name that is only whitespace', () {
      expect(userWith(fullName: '   ', username: 'owner').initials, 'O');
    });

    test('survives having nothing to work with at all', () {
      expect(userWith(fullName: '', username: '').initials, '?');
    });
  });

  group('derived names', () {
    test('splits a full name into first and last', () {
      final user = userWith(fullName: 'Ganbat Dorj Batbayar');

      expect(user.firstName, 'Ganbat');
      expect(user.lastName, 'Dorj Batbayar');
    });

    test('leaves the last name empty when there is only one word', () {
      expect(userWith(fullName: 'Батбаяр').lastName, '');
    });

    test('falls back to the username for a display name', () {
      expect(userWith(username: 'owner').displayName, 'owner');
    });
  });

  group('fromJson', () {
    test('reads the contract the API actually sends', () {
      final user = User.fromJson({
        'id': 'user-9',
        'email': 'bat@example.com',
        'username': 'bat',
        'fullName': 'Bat Erdene',
        'role': 'organization_admin',
        'isActive': true,
        'createdAt': '2026-01-01T00:00:00.000Z',
        'updatedAt': '2026-02-01T00:00:00.000Z',
      });

      expect(user.id, 'user-9');
      expect(user.fullName, 'Bat Erdene');
      expect(user.isOrganizationAdmin, isTrue);
      expect(user.createdAt.year, 2026);
    });

    test('derives a username from the email when the API omits one', () {
      final user = User.fromJson({'email': 'bat@example.com'});

      expect(user.username, 'bat');
    });

    test('builds a full name from first and last when there is no fullName', () {
      final user = User.fromJson({
        'email': 'bat@example.com',
        'firstName': 'Bat',
        'lastName': 'Erdene',
      });

      expect(user.fullName, 'Bat Erdene');
    });

    test('survives a response with nothing in it', () {
      // A truncated or unexpected payload should leave the app on its feet
      // rather than throwing during parsing.
      final user = User.fromJson({});

      expect(user.id, '');
      expect(user.role, 'user');
      expect(user.isActive, isTrue);
    });

    test('ignores a date it cannot parse instead of throwing', () {
      final user = User.fromJson({
        'email': 'bat@example.com',
        'createdAt': 'not a date',
      });

      expect(user.createdAt, DateTime.fromMillisecondsSinceEpoch(0));
    });
  });
}
