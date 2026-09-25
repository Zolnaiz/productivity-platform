import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:productivity_mobile/services/api_service.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('signs in and reads tasks from the running backend',
      (tester) async {
    const baseUrl = String.fromEnvironment('API_BASE_URL',
        defaultValue: 'http://10.0.2.2:3000/api');
    const email = String.fromEnvironment('MOBILE_TEST_EMAIL',
        defaultValue: 'owner@example.com');
    const password = String.fromEnvironment('MOBILE_TEST_PASSWORD',
        defaultValue: 'Password123');
    dotenv.loadFromString(
        envString: 'API_BASE_URL=$baseUrl\nAPP_VERSION=1.0.0');

    final api = ApiService();
    await api.initialize();
    final session = await api.login(email, password);
    expect(session['access_token'], isA<String>());
    expect(session['refresh_token'], isA<String>());
    expect(session['user']['email'], email);

    final tasks = await api.getTasks();
    expect(tasks, isA<List<Map<String, dynamic>>>());
  });
}
