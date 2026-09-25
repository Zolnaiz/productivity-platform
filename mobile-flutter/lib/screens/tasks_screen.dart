import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/task_model.dart';
import '../providers/auth_provider.dart';
import '../providers/task_provider.dart';
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
        IconButton(
            tooltip: strings.text('logout'),
            icon: const Icon(Icons.logout),
            onPressed: () => context.read<AuthProvider>().logout()),
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
        return RefreshIndicator(
            onRefresh: _load,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: provider.tasks.length,
              itemBuilder: (context, index) =>
                  _TaskCard(task: provider.tasks[index], strings: strings),
            ));
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
              Text(
                  strings.taskTitle(
                      title: task.title,
                      key: task.titleKey,
                      params: task.titleParams),
                  style: Theme.of(context).textTheme.titleMedium),
              if (task.description?.isNotEmpty == true) ...[
                const SizedBox(height: 8),
                Text(task.description!)
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
