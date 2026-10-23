import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:productivity_mobile/screens/profile_screen.dart';

import 'support/fake_api.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<MockAdapter> pump(WidgetTester tester,
      {int passwordStatus = 201}) async {
    final (api, adapter, _) = await makeApi((request) {
      if (request.path == '/auth/me') {
        return jsonReply(envelope({
          'id': 'u1',
          'firstName': 'Bat',
          'lastName': 'Dorj',
          'phone': '99112233',
          'language': 'mn'
        }));
      }
      if (request.path == '/auth/change-password' && passwordStatus != 201) {
        return jsonReply({
          'success': false,
          'errorCode': 'AUTH_CURRENT_PASSWORD_WRONG'
        }, status: passwordStatus);
      }
      return jsonReply(envelope({}), status: 200);
    });
    await tester.pumpWidget(MaterialApp(
      locale: const Locale('en'),
      supportedLocales: const [Locale('en'), Locale('mn')],
      localizationsDelegates: testDelegates,
      home: ProfileScreen(api: api),
    ));
    await tester.pumpAndSettle();
    return adapter;
  }

  testWidgets('shows my details and saves an edited phone', (tester) async {
    final adapter = await pump(tester);

    expect(find.text('99112233'), findsOneWidget);
    await tester.enterText(find.byKey(const Key('profile-phone')), '88001122');
    await tester.tap(find.byKey(const Key('profile-save')));
    await tester.pumpAndSettle();

    final patch = adapter.requests.firstWhere((r) => r.method == 'PATCH');
    expect(patch.path, '/users/profile/me');
    expect((patch.data as Map)['phone'], '88001122');
    expect(find.text('Saved'), findsOneWidget);
  });

  testWidgets('refuses a short new password without asking the server',
      (tester) async {
    final adapter = await pump(tester);

    await tester.enterText(
        find.byKey(const Key('profile-current-password')), 'old-password');
    await tester.enterText(find.byKey(const Key('profile-new-password')), '123');
    await tester.tap(find.byKey(const Key('profile-change-password')));
    await tester.pumpAndSettle();

    expect(find.text('At least 6 characters'), findsOneWidget);
    expect(adapter.requests.where((r) => r.path == '/auth/change-password'),
        isEmpty);
  });

  testWidgets('says so when the current password is wrong', (tester) async {
    await pump(tester, passwordStatus: 400);

    await tester.enterText(
        find.byKey(const Key('profile-current-password')), 'wrong');
    await tester.enterText(
        find.byKey(const Key('profile-new-password')), 'Secret123');
    await tester.tap(find.byKey(const Key('profile-change-password')));
    await tester.pumpAndSettle();

    expect(find.text('The current password is incorrect.'), findsOneWidget);
  });

  test('keeps the new session the server answers a password change with',
      () async {
    // Every other session ends on a password change; this phone stays in.
    final (api, _, tokens) = await makeApi((request) => jsonReply(
        envelope({'access_token': 'new-access', 'refresh_token': 'new-refresh'}),
        status: 201));
    tokens.values['refresh_token'] = 'old-refresh';

    await api.changePassword('old-password', 'Secret123');

    expect(tokens.values['access_token'], 'new-access');
    expect(tokens.values['refresh_token'], 'new-refresh');
  });
}
