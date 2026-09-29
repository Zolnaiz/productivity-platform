import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/task_model.dart';
import '../providers/auth_provider.dart';
import '../providers/task_provider.dart';
import '../providers/work_log_provider.dart';
import '../utils/phase_one_strings.dart';
import 'weekly_checkin_screen.dart';

/// Writing up the day, from the phone in somebody's pocket.
///
/// One form: what was done, how long it took, and optionally which project/task it
/// was for and what is in the way. The hours go into the monthly report as
/// they are, so the form asks for them plainly rather than hiding them.
class WorkLogScreen extends StatefulWidget {
  const WorkLogScreen({super.key});
  @override
  State<WorkLogScreen> createState() => _WorkLogScreenState();
}

class _WorkLogScreenState extends State<WorkLogScreen> {
  final _form = GlobalKey<FormState>();
  final _summary = TextEditingController();
  final _hours = TextEditingController();
  final _blockers = TextEditingController();
  String? _taskId;
  String? _projectId;
  TaskProvider? _taskProvider;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final tasks = context.read<TaskProvider>();
    if (identical(tasks, _taskProvider)) return;
    _taskProvider?.removeListener(_tasksChanged);
    _taskProvider = tasks..addListener(_tasksChanged);
  }

  void _tasksChanged() {
    if (_taskId != null && _selectedTask(_taskProvider!.tasks) == null) {
      // Background refreshes also change the choices. Forget a moved or
      // removed task so it cannot return as an invisible stale selection.
      setState(() => _taskId = null);
    }
  }

  @override
  void dispose() {
    _taskProvider?.removeListener(_tasksChanged);
    _summary.dispose();
    _hours.dispose();
    _blockers.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    if (!mounted) return;
    final logs = context.read<WorkLogProvider>();
    final tasks = context.read<TaskProvider>();
    final auth = context.read<AuthProvider>();
    await Future.wait([
      logs.load(),
      if (!tasks.loading) tasks.load(assigneeId: auth.user?.id),
    ]);
    if (!mounted) return;
    if (logs.sessionExpired || tasks.sessionExpired) {
      await auth.expireSession();
    } else {
      setState(() {
        // A refresh can remove or reassign a task. Its old selection must not
        // remain hidden in the payload after it disappears from the choices.
        final selected = _selectedTask(tasks.tasks);
        if (selected == null) _taskId = null;
        if (_projectId != null &&
            logs.projectsError == null &&
            !logs.projects.any((project) => project.id == _projectId) &&
            selected?.projectId != _projectId) {
          _projectId = null;
        }
      });
    }
  }

  Task? _selectedTask(List<Task> tasks) {
    for (final task in tasks) {
      if (task.id == _taskId && task.projectId == _projectId) {
        return task;
      }
    }
    return null;
  }

  /// Hours as people type them: "1.5", "1,5" — a Mongolian keyboard offers
  /// the comma first.
  static double? parseHours(String value) =>
      double.tryParse(value.trim().replaceAll(',', '.'));

  Future<void> _submit(PhaseOneStrings strings) async {
    if (!(_form.currentState?.validate() ?? false)) return;
    final logs = context.read<WorkLogProvider>();
    final task = _selectedTask(context.read<TaskProvider>().tasks);
    final saved = await logs.submit(
      summary: _summary.text.trim(),
      hours: parseHours(_hours.text) ?? 0,
      taskId: task?.id,
      // The task's actual project is authoritative, including a null project.
      projectId: task == null ? _projectId : task.projectId,
      blockers: _blockers.text.trim(),
    );
    if (!mounted) return;
    if (logs.sessionExpired) {
      await context.read<AuthProvider>().expireSession();
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(saved
          ? strings.text(logs.lastKept ? 'keptNow' : 'logSaved')
          : strings.error(logs.error!)),
    ));
    // What somebody typed survives a failed save, so they can send it again.
    if (saved) {
      _summary.clear();
      _hours.clear();
      _blockers.clear();
      setState(() {
        _taskId = null;
        _projectId = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final tasks = context.watch<TaskProvider>();
    // Finished tasks remain available: a write-up commonly follows marking
    // the work done. TaskProvider already restricts the list to this person.
    final availableTasks = tasks.tasks
        .where((task) => _projectId == null || task.projectId == _projectId)
        .toList();
    final selectedTask = _selectedTask(tasks.tasks);

    return Scaffold(
      appBar: AppBar(title: Text(strings.text('today')), actions: [
        // The week sits beside the day it is written from. An icon with its
        // name as the tooltip: a worded button overflowed the bar at large text.
        IconButton(
          key: const Key('open-week'),
          tooltip: strings.text('myWeek'),
          onPressed: () => openWeeklyCheckin(context),
          icon: const Icon(Icons.view_week_outlined),
        ),
      ]),
      body: Consumer<WorkLogProvider>(builder: (context, logs, _) {
        return RefreshIndicator(
          onRefresh: _load,
          child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              children: [
                Form(
                  key: _form,
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        TextFormField(
                          key: const Key('log-summary'),
                          controller: _summary,
                          maxLines: 3,
                          decoration: InputDecoration(
                              labelText: strings.text('whatDidYouDo'),
                              border: const OutlineInputBorder()),
                          validator: (value) => (value ?? '').trim().isEmpty
                              ? strings.text('summaryRequired')
                              : null,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          key: const Key('log-hours'),
                          controller: _hours,
                          keyboardType: const TextInputType.numberWithOptions(
                              decimal: true),
                          decoration: InputDecoration(
                              labelText: strings.text('hours'),
                              border: const OutlineInputBorder()),
                          validator: (value) {
                            final hours = parseHours(value ?? '');
                            return hours == null ||
                                    !hours.isFinite ||
                                    hours <= 0 ||
                                    hours > 24
                                ? strings.text('hoursInvalid')
                                : null;
                          },
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String?>(
                          key: const Key('log-project'),
                          initialValue: _projectId,
                          isExpanded: true,
                          decoration: InputDecoration(
                              labelText: strings.text('forProject'),
                              border: const OutlineInputBorder()),
                          items: [
                            DropdownMenuItem<String?>(
                                value: null,
                                child: Text(strings.text('noProject'),
                                    overflow: TextOverflow.ellipsis)),
                            ...logs.projects.map((project) =>
                                DropdownMenuItem<String?>(
                                    value: project.id,
                                    child: Text(project.name,
                                        overflow: TextOverflow.ellipsis))),
                            // Tasks still carry a project when the project request
                            // fails. Keep its linkage explicit and usable offline.
                            if (_projectId != null &&
                                !logs.projects
                                    .any((project) => project.id == _projectId))
                              DropdownMenuItem<String?>(
                                  value: _projectId,
                                  child: Text(strings.text('taskProject'),
                                      overflow: TextOverflow.ellipsis)),
                          ],
                          onChanged: logs.saving
                              ? null
                              : (value) => setState(() {
                                    _projectId = value;
                                    if (selectedTask?.projectId != value)
                                      _taskId = null;
                                  }),
                        ),
                        if (logs.projectsError != null ||
                            tasks.error != null) ...[
                          const SizedBox(height: 8),
                          Text(strings.text('workLinksUnavailable')),
                          Align(
                            alignment: AlignmentDirectional.centerStart,
                            child: TextButton(
                                onPressed: logs.loading ? null : _load,
                                child: Text(strings.text('retry'))),
                          ),
                        ],
                        if (tasks.tasks.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          DropdownButtonFormField<String?>(
                            key: const Key('log-task'),
                            initialValue: selectedTask?.id,
                            isExpanded: true,
                            decoration: InputDecoration(
                                labelText: strings.text('forTask'),
                                border: const OutlineInputBorder()),
                            items: [
                              DropdownMenuItem<String?>(
                                  value: null,
                                  child: Text(strings.text('noTask'),
                                      overflow: TextOverflow.ellipsis)),
                              ...availableTasks
                                  .map((task) => DropdownMenuItem<String?>(
                                      value: task.id,
                                      child: Text(
                                        strings.taskTitle(
                                            title: task.title,
                                            key: task.titleKey,
                                            params: task.titleParams),
                                        overflow: TextOverflow.ellipsis,
                                      ))),
                            ],
                            onChanged: logs.saving
                                ? null
                                : (value) => setState(() {
                                      _taskId = value;
                                      if (value != null) {
                                        _projectId = availableTasks
                                            .firstWhere(
                                                (task) => task.id == value)
                                            .projectId;
                                      }
                                    }),
                          ),
                        ],
                        const SizedBox(height: 12),
                        TextFormField(
                          key: const Key('log-blockers'),
                          controller: _blockers,
                          decoration: InputDecoration(
                              labelText: strings.text('blockers'),
                              border: const OutlineInputBorder()),
                        ),
                        const SizedBox(height: 16),
                        FilledButton(
                          key: const Key('log-save'),
                          onPressed:
                              logs.saving ? null : () => _submit(strings),
                          child: Text(strings.text('saveLog')),
                        ),
                      ]),
                ),
                const SizedBox(height: 24),
                Text(
                  strings.hoursToday(logs.hoursToday),
                  key: const Key('hours-today'),
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                if (logs.loading && logs.today.isEmpty)
                  const Center(child: CircularProgressIndicator())
                else if (logs.today.isEmpty)
                  Text(strings.text('nothingLogged'))
                else
                  ...logs.today.map((log) => Card(
                        child: ListTile(
                          title: Text(log.summary),
                          subtitle: log.blockers?.isNotEmpty == true
                              ? Text(
                                  '${strings.text('blockers')}: ${log.blockers}')
                              : null,
                          trailing: Text(strings.hoursValue(log.hours)),
                        ),
                      )),
              ]),
        );
      }),
    );
  }
}
