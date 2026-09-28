import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/work_log_model.dart' show localDay;
import '../services/api_service.dart';
import '../services/outbox.dart';
import '../utils/phase_one_strings.dart';

/// The Monday of the week a calendar day falls in.
String mondayOf(DateTime day) =>
    localDay(DateTime(day.year, day.month, day.day - (day.weekday - 1)));

/// The week in three parts - done, next, in the way - from the phone.
///
/// The same check-in the web keeps: written on Friday in two minutes, and
/// the part a manager most needs to hear is what is in the way.
class WeeklyCheckinScreen extends StatefulWidget {
  const WeeklyCheckinScreen({super.key, required this.api, this.outbox, this.clock});

  final ApiService api;
  final Outbox? outbox;
  final DateTime Function()? clock;

  @override
  State<WeeklyCheckinScreen> createState() => _WeeklyCheckinScreenState();
}

class _WeeklyCheckinScreenState extends State<WeeklyCheckinScreen> {
  final _progress = TextEditingController();
  final _plans = TextEditingController();
  final _problems = TextEditingController();
  late final String _week = mondayOf((widget.clock ?? DateTime.now)());
  bool _loaded = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final mine = await widget.api.getMyCheckin(_week);
      if (mine != null) {
        _progress.text = mine['progress'] as String? ?? '';
        _plans.text = mine['plans'] as String? ?? '';
        _problems.text = mine['problems'] as String? ?? '';
      }
    } catch (_) {
      // Offline or refused: start empty; saving says what happened.
    }
    if (mounted) setState(() => _loaded = true);
  }

  Future<void> _save() async {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    final body = {
      'week': _week,
      'progress': _progress.text.trim(),
      'plans': _plans.text.trim(),
      'problems': _problems.text.trim(),
    };
    setState(() => _saving = true);
    try {
      await widget.api.saveMyCheckin(body);
      messenger.showSnackBar(SnackBar(content: Text(strings.text('weekSaved'))));
      navigator.pop();
    } catch (e) {
      if (widget.outbox != null && neverSent(e)) {
        await widget.outbox!.keep(method: 'PUT', path: '/checkins/mine', kind: 'checkin', data: body);
        messenger.showSnackBar(SnackBar(content: Text(strings.text('keptNow'))));
        navigator.pop();
      } else {
        messenger.showSnackBar(SnackBar(content: Text(strings.error(e))));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  void dispose() {
    _progress.dispose();
    _plans.dispose();
    _problems.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    return Scaffold(
      appBar: AppBar(title: Text(strings.text('myWeek'))),
      body: !_loaded
          ? const Center(child: CircularProgressIndicator())
          : ListView(padding: const EdgeInsets.all(16), children: [
              Text(strings.weekOf(_week), style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 12),
              TextField(
                  key: const Key('week-progress'),
                  controller: _progress,
                  maxLines: 3,
                  decoration: InputDecoration(labelText: strings.text('weekProgress'))),
              const SizedBox(height: 12),
              TextField(
                  key: const Key('week-plans'),
                  controller: _plans,
                  maxLines: 3,
                  decoration: InputDecoration(labelText: strings.text('weekPlans'))),
              const SizedBox(height: 12),
              TextField(
                  key: const Key('week-problems'),
                  controller: _problems,
                  maxLines: 2,
                  decoration: InputDecoration(labelText: strings.text('weekProblems'))),
              const SizedBox(height: 16),
              FilledButton(
                key: const Key('week-save'),
                onPressed: _saving ? null : _save,
                child: Text(strings.text('weekSave')),
              ),
            ]),
    );
  }
}

/// Opens the week from anywhere that has the API and, if there is one, the outbox.
void openWeeklyCheckin(BuildContext context) {
  Outbox? outbox;
  try {
    outbox = context.read<Outbox>();
  } catch (_) {
    outbox = null;
  }
  Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => WeeklyCheckinScreen(api: ApiService(), outbox: outbox)));
}
