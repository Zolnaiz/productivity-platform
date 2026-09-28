import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/inbox_provider.dart';
import '../providers/task_provider.dart';
import '../services/outbox.dart';
import '../utils/phase_one_strings.dart';
import 'five_s_screen.dart';
import 'inbox_screen.dart';
import 'tasks_screen.dart';
import 'work_log_screen.dart';

/// What somebody on shift does with the app: see their work, write up their
/// day, check their area, and read what they have been told. Kept side by side so writing up is
/// one tap away from the task it is about.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  /// A phone opened again is usually a new part of the day: the morning's
  /// reminder has arrived, or a manager has given out work. The screens
  /// loaded once, when the app started, and showed yesterday's until it was
  /// closed and opened again.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed) return;
    _refresh();
  }

  /// What was kept on the phone goes first, so the lists read back include it.
  Future<void> _refresh() async {
    final inbox = context.read<InboxProvider>();
    final tasks = context.read<TaskProvider>();
    final userId = context.read<AuthProvider>().user?.id;
    await _sendKept();
    inbox.load();
    tasks.load(assigneeId: userId);
  }

  Future<void> _sendKept() async {
    final outbox = _outbox;
    if (outbox == null) return;
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final messenger = ScaffoldMessenger.of(context);
    await outbox.flush();
    if (outbox.refused > 0) {
      messenger.showSnackBar(
          SnackBar(content: Text(strings.keptRefused(outbox.refused))));
      outbox.acknowledgeRefused();
    }
  }

  // Optional, so a screen tested without one still draws.
  Outbox? get _outbox {
    try {
      return context.read<Outbox>();
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final kept = _outbox == null ? 0 : context.watch<Outbox>().pending.length;
    return Scaffold(
      body: Column(children: [
        // Said at the top of every tab while anything is waiting: somebody
        // who walked an audit in the basement should not have to wonder
        // whether it counted.
        if (kept > 0)
          Material(
            key: const Key('outbox-banner'),
            color: Theme.of(context).colorScheme.tertiaryContainer,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 8, 8),
                child: Row(children: [
                  Icon(Icons.cloud_off,
                      color: Theme.of(context).colorScheme.onTertiaryContainer),
                  const SizedBox(width: 12),
                  Expanded(
                      child: Text(strings.keptOnPhone(kept),
                          style: TextStyle(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onTertiaryContainer))),
                  TextButton(
                      onPressed: _refresh, child: Text(strings.text('sendNow'))),
                ]),
              ),
            ),
          ),
        // All kept alive, so a half-typed entry survives a look at the tasks.
        Expanded(
          child: IndexedStack(
              index: _tab,
              children: const [
                TasksScreen(),
                WorkLogScreen(),
                FiveSScreen(),
                InboxScreen()
              ]),
        ),
      ]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (index) => setState(() => _tab = index),
        destinations: [
          NavigationDestination(
              icon: const Icon(Icons.checklist), label: strings.text('tasks')),
          NavigationDestination(
              icon: const Icon(Icons.edit_note), label: strings.text('today')),
          NavigationDestination(
              icon: const Icon(Icons.fact_check_outlined),
              label: strings.text('fiveS')),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: context.watch<InboxProvider>().unread > 0,
              label: Text('${context.watch<InboxProvider>().unread}'),
              child: const Icon(Icons.notifications_outlined),
            ),
            label: strings.text('inbox'),
          ),
        ],
      ),
    );
  }
}
