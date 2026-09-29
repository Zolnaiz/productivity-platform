import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/task_model.dart';
import '../models/work_log_model.dart' show localDay;
import '../providers/auth_provider.dart';
import '../providers/task_provider.dart';
import '../services/api_service.dart';
import '../utils/phase_one_strings.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});
  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final tasks = context.read<TaskProvider>();
    await tasks.load(assigneeId: context.read<AuthProvider>().user?.id);
    if (mounted && tasks.sessionExpired)
      await context.read<AuthProvider>().expireSession();
  }

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    return Scaffold(
      appBar: AppBar(title: Text(strings.text('tasks')), actions: [
        // The account's two ways out: signing out, and asking for it to be
        // deleted - which Google Play asks every app with accounts to offer.
        PopupMenuButton<String>(
          key: const Key('account-menu'),
          tooltip: strings.text('account'),
          icon: const Icon(Icons.account_circle_outlined),
          onSelected: (choice) => choice == 'logout'
              ? context.read<AuthProvider>().logout()
              : _requestDeletion(context, context.read<TaskProvider>().api),
          itemBuilder: (_) => [
            PopupMenuItem(value: 'logout', child: Text(strings.text('logout'))),
            PopupMenuItem(value: 'delete', child: Text(strings.text('deleteAccount'))),
          ],
        ),
      ]),
      body: Consumer<TaskProvider>(builder: (context, provider, _) {
        if (provider.loading && provider.tasks.isEmpty)
          return const Center(child: CircularProgressIndicator());
        if (provider.error != null && provider.tasks.isEmpty)
          return Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(strings.error(provider.error!)),
            const SizedBox(height: 12),
            FilledButton(onPressed: _load, child: Text(strings.text('retry'))),
          ]));
        if (provider.tasks.isEmpty)
          return Center(child: Text(strings.text('noTasks')));
        // In the order they need the person: late, today, this week,
        // later, with no date, and what is finished last.
        final groups = groupTasks(provider.tasks, DateTime.now());
        return RefreshIndicator(
            onRefresh: _load,
            child: ListView(padding: const EdgeInsets.all(16), children: [
              for (final group in groups) ...[
                Padding(
                  padding: const EdgeInsets.only(top: 8, bottom: 8),
                  child: Text('${strings.text('group.${group.key}')} (${group.tasks.length})',
                      key: Key('task-group-${group.key}'),
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: group.key == 'late' ? Theme.of(context).colorScheme.error : null)),
                ),
                for (final task in group.tasks) _TaskCard(task: task, strings: strings),
              ],
            ]));
      }),
    );
  }
}

class _TaskCard extends StatelessWidget {
  const _TaskCard({required this.task, required this.strings});
  final Task task;
  final PhaseOneStrings strings;

  Future<void> _changeStatus(
      BuildContext context, Task task, String status) async {
    final tasks = context.read<TaskProvider>();
    await tasks.changeStatus(task, status);
    if (!context.mounted) return;
    if (tasks.sessionExpired) {
      await context.read<AuthProvider>().expireSession();
    } else if (tasks.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(strings.error(tasks.error!)),
      ));
    }
  }

  @override
  Widget build(BuildContext context) => Card(
        margin: const EdgeInsets.only(bottom: 12),
        child: Padding(
            padding: const EdgeInsets.all(16),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                // Finishing a task is one tap, where the task is.
                IconButton(
                  key: Key('done-${task.id}'),
                  tooltip: task.status == 'done' ? strings.text('reopen') : strings.text('markDone'),
                  onPressed: () => _changeStatus(context, task, task.status == 'done' ? 'todo' : 'done'),
                  icon: Icon(task.status == 'done' ? Icons.check_circle : Icons.radio_button_unchecked,
                      color: task.status == 'done' ? Colors.green.shade700 : null),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: Text(
                        strings.taskTitle(
                            title: task.title,
                            key: task.titleKey,
                            params: task.titleParams),
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            decoration: task.status == 'done' ? TextDecoration.lineThrough : null)),
                  ),
                ),
              ]),
              if (task.dueDate != null)
                Padding(
                  padding: const EdgeInsets.only(left: 48),
                  child: Text(strings.dueOn(localDay(task.dueDate!)),
                      style: TextStyle(
                          color: isLate(task, DateTime.now()) ? Theme.of(context).colorScheme.error : null)),
                ),
              if (task.description?.isNotEmpty == true ||
                  task.descriptionKey != null) ...[
                const SizedBox(height: 8),
                Text(strings.taskTitle(
                    title: task.description ?? '',
                    key: task.descriptionKey,
                    params: task.descriptionParams))
              ],
              const SizedBox(height: 12),
              Row(children: [
                Text(strings.text('status')),
                const SizedBox(width: 12),
                Expanded(
                    child: DropdownButton<String>(
                  value: task.status,
                  isExpanded: true,
                  items: const [
                    'backlog',
                    'todo',
                    'in_progress',
                    'review',
                    'done'
                  ]
                      .map((value) => DropdownMenuItem(
                          value: value, child: Text(strings.text(value))))
                      .toList(),
                  onChanged: (value) {
                    if (value != null) _changeStatus(context, task, value);
                  },
                ))
              ]),
            ])),
      );
}

/// Asks, then sends the request to the organization's administrators.
Future<void> _requestDeletion(BuildContext context, ApiService api) async {
  final strings = PhaseOneStrings(Localizations.localeOf(context));
  final messenger = ScaffoldMessenger.of(context);
  final sure = await showDialog<bool>(
    context: context,
    builder: (dialog) => AlertDialog(
      title: Text(strings.text('deleteAccount')),
      content: Text(strings.text('deleteAccountExplain')),
      actions: [
        TextButton(onPressed: () => Navigator.pop(dialog, false), child: Text(strings.text('cancel'))),
        FilledButton(
            key: const Key('confirm-delete-account'),
            onPressed: () => Navigator.pop(dialog, true),
            child: Text(strings.text('deleteAccountSend'))),
      ],
    ),
  );
  if (sure != true) return;
  try {
    await api.requestAccountDeletion();
    messenger.showSnackBar(SnackBar(content: Text(strings.text('deleteAccountSent'))));
  } catch (e) {
    messenger.showSnackBar(SnackBar(content: Text(strings.error(e))));
  }
}

/// Late: due before today and not finished. Backlog is nobody's promise yet.
bool isLate(Task task, DateTime now) =>
    task.dueDate != null &&
    task.status != 'done' &&
    task.status != 'backlog' &&
    localDay(task.dueDate!).compareTo(localDay(now)) < 0;

class TaskGroup {
  const TaskGroup(this.key, this.tasks);
  final String key;
  final List<Task> tasks;
}

/// The person's tasks in the order they need them, empty groups left out.
List<TaskGroup> groupTasks(List<Task> tasks, DateTime now) {
  final today = localDay(now);
  final weekEnd = localDay(DateTime(now.year, now.month, now.day + 7));
  final groups = <String, List<Task>>{
    'late': [],
    'today': [],
    'week': [],
    'later': [],
    'noDate': [],
    'done': [],
  };
  for (final task in tasks) {
    if (task.status == 'done') {
      groups['done']!.add(task);
    } else if (task.status == 'backlog') {
      // Not promised yet, whatever date it carries.
      groups['later']!.add(task);
    } else if (task.dueDate == null) {
      groups['noDate']!.add(task);
    } else if (isLate(task, now)) {
      groups['late']!.add(task);
    } else {
      final day = localDay(task.dueDate!);
      if (day == today) {
        groups['today']!.add(task);
      } else if (day.compareTo(weekEnd) <= 0) {
        groups['week']!.add(task);
      } else {
        groups['later']!.add(task);
      }
    }
  }
  return [
    for (final entry in groups.entries)
      if (entry.value.isNotEmpty) TaskGroup(entry.key, entry.value)
  ];
}
