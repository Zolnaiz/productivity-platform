import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:productivity_mobile/models/project_model.dart';
import 'package:productivity_mobile/models/task_model.dart';
import 'package:productivity_mobile/models/work_log_model.dart';
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
      'signs in, refreshes, and persists matching project/task links with daily hours',
      () async {
    const baseUrl = String.fromEnvironment('API_BASE_URL');
    const email = String.fromEnvironment('MOBILE_TEST_EMAIL',
        defaultValue: 'owner@example.com');
    const password = String.fromEnvironment('MOBILE_TEST_PASSWORD',
        defaultValue: 'Password123');
    SharedPreferences.setMockInitialValues({});
    dotenv.loadFromString(envString: 'APP_VERSION=1.0.0');

    final client = Dio(BaseOptions(baseUrl: baseUrl));
    addTearDown(() => client.close(force: true));
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

    final projects = (await api.getProjects()).map(Project.fromJson).toList();
    expect(projects, isNotEmpty,
        reason: 'Seed at least one project before running the live test.');
    final projectIds = projects.map((project) => project.id).toSet();
    final assignedTasks = tasks
        .map(Task.fromJson)
        .where((task) => task.assigneeId == session['user']['id'])
        .toList();
    expect(assignedTasks, isNotEmpty);
    final linkedTasks = assignedTasks
        .where((task) => projectIds.contains(task.projectId))
        .toList();
    expect(linkedTasks, isNotEmpty,
        reason: 'Seed a project-linked task assigned to the test account.');
    final task = linkedTasks.first;
    final nextStatus = task.status == 'done' ? 'todo' : 'done';
    final updated = await api.updateTask(task.id, {'status': nextStatus});
    expect(updated['status'], nextStatus);
    expect(Task.fromJson(updated).projectId, task.projectId);
    // The server dates the finish itself, and forgets it on reopening; the
    // monthly report counts the work by that date.
    if (nextStatus == 'done') {
      expect(updated['completedAt'], isA<String>());
    } else {
      expect(updated['completedAt'], isNull);
    }

    // Omit projectId deliberately: the server must infer the task's project
    // and persist the same links and measured hours in both records.
    final summary = 'Live check ${DateTime.now().toIso8601String()}';
    final day = localDay(DateTime.now());
    final saved = await api.createDailyWorkLog({
      'summary': summary,
      'hours': 1.5,
      'taskId': task.id,
      'logDate': day,
      'blockers': 'Live test blocker',
      'nextSteps': 'Verify stored links',
    });
    final workLog =
        WorkLog.fromJson((saved['workLog'] as Map).cast<String, dynamic>());
    final timeEntry = (saved['timeEntry'] as Map).cast<String, dynamic>();
    expect(workLog.id, isNotEmpty);
    expect(workLog.projectId, task.projectId);
    expect(workLog.taskId, task.id);
    expect(workLog.hours, 1.5);
    expect(workLog.logDate, day);
    expect(timeEntry['workLogId'], workLog.id);
    expect(timeEntry['projectId'], task.projectId);
    expect(timeEntry['taskId'], task.id);
    expect(timeEntry['userId'], session['user']['id']);
    expect(double.parse('${timeEntry['hours']}'), workLog.hours);
    expect(timeEntry['workDate'], day);

    // Verify a fresh read, not only the response from the write. The client
    // uses this same configured connection with auth/envelope interceptors.
    final logs = (await api.getWorkLogs()).map(WorkLog.fromJson).toList();
    final persistedLog = logs.singleWhere((log) => log.id == workLog.id);
    expect(persistedLog.summary, summary);
    expect(persistedLog.projectId, task.projectId);
    expect(persistedLog.taskId, task.id);
    expect(persistedLog.logDate, day);
    expect(persistedLog.hours, 1.5);
    expect(persistedLog.blockers, 'Live test blocker');
    expect(persistedLog.nextSteps, 'Verify stored links');
    final entries = (await client.get('/time-entries')).data as List;
    final linkedEntries = entries
        .cast<Map>()
        .where((entry) => entry['workLogId'] == workLog.id)
        .toList();
    expect(linkedEntries, hasLength(1),
        reason: 'Daily hours must be counted once.');
    final persistedTime = linkedEntries.single;
    expect(persistedTime['id'], timeEntry['id']);
    expect(persistedTime['projectId'], persistedLog.projectId);
    expect(persistedTime['taskId'], persistedLog.taskId);
    expect(persistedTime['userId'], session['user']['id']);
    expect(persistedTime['workDate'], persistedLog.logDate);
    expect(double.parse('${persistedTime['hours']}'), persistedLog.hours);
    expect(persistedTime['note'], persistedLog.summary);

    // The inbox, which answered with a 500 on a real database until its
    // timestamp columns were repaired.
    expect(await api.getNotifications(), isA<List>());
  },
      skip: const String.fromEnvironment('API_BASE_URL').isEmpty
          ? 'Set API_BASE_URL to run against a live server.'
          : false);
}
