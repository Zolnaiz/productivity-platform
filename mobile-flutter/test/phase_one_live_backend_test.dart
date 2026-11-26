// Widget/unit test.

import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:productivity_mobile/models/project_model.dart';
import 'package:productivity_mobile/models/task_model.dart';
import 'package:productivity_mobile/models/work_log_model.dart';
import 'package:productivity_mobile/providers/idea_provider.dart';
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

  // The rest of what the phone says to the server, said to a real one.
  //
  // Unit tests answer the phone with a fake server, so a request the real
  // server refuses passes them: the phone's sign-up sent fields the server
  // had stopped accepting, and nothing failed. Each call here is made through
  // the same ApiService and providers the screens use, so a request whose
  // shape has drifted from the API fails in CI rather than on a phone.
  //
  // Changing the password and asking for the account to be deleted write to
  // the database; they run only with LIVE_WRITES=true, which CI sets on its
  // throwaway database (.github/workflows/ci.yml, job "Live API").
  test('the sign-in check, the account and the daily screens, as the phone sends them',
      () async {
    const baseUrl = String.fromEnvironment('API_BASE_URL');
    const email = String.fromEnvironment('MOBILE_TEST_EMAIL',
        defaultValue: 'owner@example.com');
    const password = String.fromEnvironment('MOBILE_TEST_PASSWORD',
        defaultValue: 'Password123');
    const writes = bool.fromEnvironment('LIVE_WRITES');
    SharedPreferences.setMockInitialValues({});
    dotenv.loadFromString(envString: 'APP_VERSION=1.0.0');

    final client = Dio(BaseOptions(baseUrl: 'http://unused.invalid/api'));
    addTearDown(() => client.close(force: true));
    final tokens = _MemoryTokens();
    final api = ApiService.forTesting(client: client, tokenStore: tokens);
    await api.initialize(client: client);

    // The sign-in screen's server check, against the real /health.
    expect(await api.useServer(baseUrl), normalizeServerAddress(baseUrl));
    await expectLater(api.useServer('http://127.0.0.1:9/api'),
        throwsA(isA<ServerUnreachable>()));
    expect(api.serverAddress, normalizeServerAddress(baseUrl));

    final session = await api.login(email, password);
    final me = await api.getCurrentUser();
    expect(me['email'], email);
    expect(me['id'], session['user']['id']);

    // The profile screen sends `phone`, and reads it back from /auth/me as
    // `phoneNumber`; a fake server that answered `phone` once hid that the
    // screen showed an empty field and erased the number on save.
    final phoneBefore = me['phoneNumber'] as String? ?? '';
    final language = (me['language'] as String?) ?? 'mn';
    await api.updateProfile(phone: '99001122', language: language);
    expect((await api.getCurrentUser())['phoneNumber'], '99001122');
    await api.updateProfile(phone: phoneBefore, language: language);

    // What the daily tabs read: 5S plans and checklists, ideas, the week.
    expect(await api.getFiveSPlans(), isA<List>());
    expect(await api.getAuditTemplates(), isA<List>());
    expect(await api.getIdeas(), isA<List>());
    await api.getMyCheckin(localDay(DateTime.now()));

    // An idea built by the provider the Ideas tab uses, read back.
    final ideas = IdeaProvider(api);
    final title = 'Live idea ${DateTime.now().toIso8601String()}';
    final idea = await ideas.submit(title: title, benefit: 'Checked live');
    expect(idea, isNotNull, reason: '${ideas.error}');
    expect((await api.getIdeas()).map((item) => item['title']), contains(title));

    await api.markAllNotificationsRead();

    if (!writes) return;

    // The password, changed and changed back. The server ends every other
    // session and answers with new tokens, which the phone must keep: the
    // next call has to go through without signing in again.
    const temporary = 'Live-check-123456';
    await api.changePassword(password, temporary);
    expect((await api.getCurrentUser())['email'], email);
    await api.changePassword(temporary, password);
    expect((await api.login(email, password))['access_token'], isA<String>());

    // FR-21, from the account menu.
    await api.requestAccountDeletion();
  },
      skip: const String.fromEnvironment('API_BASE_URL').isEmpty
          ? 'Set API_BASE_URL to run against a live server.'
          : false);
}
