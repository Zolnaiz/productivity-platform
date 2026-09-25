import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:productivity_mobile/services/api_service.dart';

class _LiveNetworkBinding extends AutomatedTestWidgetsFlutterBinding {
  @override
  bool get overrideHttpClient => false;
}

class _MemoryTokens implements TokenStore {
  final values = <String, String>{};
  @override
  Future<String?> read(String key) async => values[key];
  @override
  Future<void> write(String key, String value) async => values[key] = value;
  @override
  Future<void> delete(String key) async => values.remove(key);
}

void main() {
  _LiveNetworkBinding();

  test(
      'signs in, refreshes, lists assigned tasks, and updates a task on the running API',
      () async {
    const baseUrl = String.fromEnvironment('API_BASE_URL');
    const email = String.fromEnvironment('MOBILE_TEST_EMAIL',
        defaultValue: 'owner@example.com');
    const password = String.fromEnvironment('MOBILE_TEST_PASSWORD',
        defaultValue: 'Password123');
    SharedPreferences.setMockInitialValues({});
    dotenv.loadFromString(envString: 'APP_VERSION=1.0.0');

    final client = Dio(BaseOptions(baseUrl: baseUrl));
    final tokens = _MemoryTokens();
    final api = ApiService.forTesting(client: client, tokenStore: tokens);
    await api.initialize(client: client);
    final session = await api.login(email, password);
    expect(session['access_token'], isA<String>());
    expect(session['refresh_token'], isA<String>());
    expect(session['user']['email'], email);

    await tokens.write('access_token', 'expired-access-token');
    final tasks = await api.getTasks();
    expect(tasks, isA<List<Map<String, dynamic>>>());
    expect(await tokens.read('access_token'), isNot('expired-access-token'));

    final assignedTasks = tasks
        .where((task) => task['assigneeId'] == session['user']['id'])
        .toList();
    expect(assignedTasks, isNotEmpty);
    final task = assignedTasks.first;
    final nextStatus = task['status'] == 'done' ? 'todo' : 'done';
    final updated =
        await api.updateTask(task['id'] as String, {'status': nextStatus});
    expect(updated['status'], nextStatus);
  },
      skip: const String.fromEnvironment('API_BASE_URL').isEmpty
          ? 'Set API_BASE_URL to run against a live server.'
          : false);
}
