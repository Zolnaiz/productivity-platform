import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/task_provider.dart';
import '../providers/work_log_provider.dart';
import '../utils/phase_one_strings.dart';
import 'weekly_checkin_screen.dart';

/// Writing up the day, from the phone in somebody's pocket.
///
/// One form: what was done, how long it took, and optionally which task it
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

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _summary.dispose();
    _hours.dispose();
    _blockers.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final logs = context.read<WorkLogProvider>();
    await logs.load();
    if (mounted && logs.sessionExpired) {
      await context.read<AuthProvider>().expireSession();
    }
  }

  /// Hours as people type them: "1.5", "1,5" — a Mongolian keyboard offers
  /// the comma first.
  static double? parseHours(String value) =>
      double.tryParse(value.trim().replaceAll(',', '.'));

  Future<void> _submit(PhaseOneStrings strings) async {
    if (!(_form.currentState?.validate() ?? false)) return;
    final logs = context.read<WorkLogProvider>();
    final saved = await logs.submit(
      summary: _summary.text.trim(),
      hours: parseHours(_hours.text) ?? 0,
      taskId: _taskId,
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
      setState(() => _taskId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final openTasks = context
        .watch<TaskProvider>()
        .tasks
        .where((task) => task.status != 'done')
        .toList();

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
          child: ListView(padding: const EdgeInsets.all(16), children: [
            Form(
              key: _form,
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
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
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(
                      labelText: strings.text('hours'),
                      border: const OutlineInputBorder()),
                  validator: (value) {
                    final hours = parseHours(value ?? '');
                    return hours == null || hours <= 0 || hours > 24
                        ? strings.text('hoursInvalid')
                        : null;
                  },
                ),
                if (openTasks.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String?>(
                    key: const Key('log-task'),
                    initialValue: _taskId,
                    isExpanded: true,
                    decoration: InputDecoration(
                        labelText: strings.text('forTask'),
                        border: const OutlineInputBorder()),
                    items: [
                      DropdownMenuItem<String?>(
                          value: null, child: Text(strings.text('noTask'))),
                      ...openTasks.map((task) => DropdownMenuItem<String?>(
                          value: task.id,
                          child: Text(
                            strings.taskTitle(
                                title: task.title,
                                key: task.titleKey,
                                params: task.titleParams),
                            overflow: TextOverflow.ellipsis,
                          ))),
                    ],
                    onChanged: (value) => setState(() => _taskId = value),
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
                  onPressed: logs.saving ? null : () => _submit(strings),
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
                          ? Text('${strings.text('blockers')}: ${log.blockers}')
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
