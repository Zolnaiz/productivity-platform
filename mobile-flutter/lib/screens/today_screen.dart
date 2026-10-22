import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/inbox_provider.dart';
import '../providers/task_provider.dart';
import '../providers/work_log_provider.dart';
import '../utils/phase_one_strings.dart';
import 'tasks_screen.dart';

/// The first thing on the phone: what is due today, whether today's work is
/// written up and the morning's messages read, and one large button to check
/// an area by its label - the job somebody on the floor most often opens the
/// app to do.
class TodayScreen extends StatefulWidget {
  const TodayScreen({
    super.key,
    required this.onScan,
    required this.onWriteLog,
    required this.onOpenInbox,
  });

  final VoidCallback onScan;
  final VoidCallback onWriteLog;
  final VoidCallback onOpenInbox;

  @override
  State<TodayScreen> createState() => _TodayScreenState();
}

class _TodayScreenState extends State<TodayScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final tasks = context.read<TaskProvider>();
    final logs = context.read<WorkLogProvider>();
    final auth = context.read<AuthProvider>();
    await Future.wait([tasks.load(assigneeId: auth.user?.id), logs.load()]);
    if (mounted && (tasks.sessionExpired || logs.sessionExpired)) {
      await auth.expireSession();
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final theme = Theme.of(context);
    final tasks = context.watch<TaskProvider>();
    final logs = context.watch<WorkLogProvider>();
    final unread = context.watch<InboxProvider>().unread;
    final now = DateTime.now();
    final groups = groupTasks(tasks.tasks, now);
    final due = [
      for (final group in groups)
        if (group.key == 'late' || group.key == 'today') ...group.tasks
    ];
    final open = tasks.tasks.where((task) => task.status != 'done').length;
    final logged = logs.today.isNotEmpty;

    return Scaffold(
      appBar: AppBar(title: Text(strings.text('todayTitle')), actions: [
        AccountMenu(api: tasks.api),
      ]),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(padding: const EdgeInsets.all(16), children: [
          SizedBox(
            height: 72,
            child: FilledButton.icon(
              key: const Key('today-scan'),
              onPressed: widget.onScan,
              icon: const Icon(Icons.qr_code_scanner, size: 32),
              label: Text(strings.text('todayScan'),
                  style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.onPrimary)),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: ListTile(
              key: const Key('today-log-state'),
              leading: Icon(logged ? Icons.check_circle : Icons.pending_actions,
                  color: logged ? Colors.green.shade700 : theme.colorScheme.error),
              title: Text(logged ? strings.text('todayLogged') : strings.text('todayNotLogged')),
              subtitle: Text(logged
                  ? strings.hoursValue(logs.hoursToday)
                  : strings.text('todayReminderHint')),
              trailing: logged ? null : TextButton(onPressed: widget.onWriteLog, child: Text(strings.text('todayWrite'))),
            ),
          ),
          Card(
            child: ListTile(
              key: const Key('today-inbox-state'),
              leading: Icon(unread > 0 ? Icons.mark_email_unread_outlined : Icons.mark_email_read_outlined),
              title: Text(unread > 0 ? strings.todayUnread(unread) : strings.text('todayAllRead')),
              onTap: widget.onOpenInbox,
            ),
          ),
          const SizedBox(height: 8),
          Text('${strings.text('todayDue')} (${due.length})', style: theme.textTheme.titleSmall),
          const SizedBox(height: 4),
          if (tasks.loading && tasks.tasks.isEmpty)
            const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator()))
          else if (due.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(strings.text('todayNothingDue')),
            )
          else
            for (final task in due)
              ListTile(
                key: Key('today-task-${task.id}'),
                contentPadding: EdgeInsets.zero,
                leading: Icon(isLate(task, now) ? Icons.warning_amber : Icons.radio_button_unchecked,
                    color: isLate(task, now) ? theme.colorScheme.error : null),
                title: Text(strings.taskTitle(title: task.title, key: task.titleKey, params: task.titleParams)),
                subtitle: Text(isLate(task, now) ? strings.text('group.late') : strings.text('group.today')),
              ),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(
              key: const Key('today-all-tasks'),
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const TasksScreen())),
              child: Text(strings.todayAllTasks(open)),
            ),
          ),
        ]),
      ),
    );
  }
}
