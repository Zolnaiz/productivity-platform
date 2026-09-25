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

    // Moving a task along, as the My tasks screen does. The server dates the
    // finish itself, and forgets it on reopening.
    final mine = tasks
        .where((task) => task['assigneeId'] == session['user']['id'])
        .toList();
    if (mine.isNotEmpty) {
      final task = mine.first;
      final next = task['status'] == 'done' ? 'todo' : 'done';
      final updated = await api.updateTask(task['id'] as String, {'status': next});
      expect(updated['status'], next);
      expect(updated['completedAt'], next == 'done' ? isA<String>() : isNull);
    }

    // Writing up the day from the phone, as the Today screen does: the note
    // and its clock entry saved together.
    final summary = 'Emulator check ${DateTime.now().toIso8601String()}';
    final saved =
        await api.createDailyWorkLog({'summary': summary, 'hours': 1.5});
    expect(saved['timeEntry']['workLogId'], saved['workLog']['id']);
    expect((await api.getWorkLogs()).map((log) => log['summary']),
        contains(summary));

    // The inbox, as the Inbox screen reads it.
    expect(await api.getNotifications(), isA<List>());
  });
}
