import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/inbox_provider.dart';
import '../utils/phase_one_strings.dart';
import 'inbox_screen.dart';
import 'tasks_screen.dart';
import 'work_log_screen.dart';

/// What somebody on shift does with the app: see their work, write up their
/// day, and read what they have been told. Kept side by side so writing up is
/// one tap away from the task it is about.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    return Scaffold(
      // All kept alive, so a half-typed entry survives a look at the tasks.
      body: IndexedStack(
          index: _tab,
          children: const [TasksScreen(), WorkLogScreen(), InboxScreen()]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (index) => setState(() => _tab = index),
        destinations: [
          NavigationDestination(
              icon: const Icon(Icons.checklist), label: strings.text('tasks')),
          NavigationDestination(
              icon: const Icon(Icons.edit_note), label: strings.text('today')),
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
