import 'package:flutter/material.dart';

import '../utils/phase_one_strings.dart';
import 'tasks_screen.dart';
import 'work_log_screen.dart';

/// The two things somebody on shift does with the app: see their work, and
/// write up their day. Kept side by side so writing up is one tap away from
/// the task it is about.
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
      // Both kept alive, so a half-typed entry survives a look at the tasks.
      body: IndexedStack(
          index: _tab, children: const [TasksScreen(), WorkLogScreen()]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (index) => setState(() => _tab = index),
        destinations: [
          NavigationDestination(
              icon: const Icon(Icons.checklist), label: strings.text('tasks')),
          NavigationDestination(
              icon: const Icon(Icons.edit_note), label: strings.text('today')),
        ],
      ),
    );
  }
}
