import 'package:flutter/material.dart';

import '../models/five_s_model.dart';
import '../services/api_service.dart';
import '../services/outbox.dart';
import '../utils/phase_one_strings.dart';

/// Roles that walk the floor as part of their standard work.
const gembaRoles = {'manager', 'admin', 'organization_admin', 'super_admin'};

/// A gemba walk, written where it happened.
///
/// A manager on the floor is holding a phone, not sitting at the web page:
/// where they are, what they saw, what the people doing the work said, and
/// what should happen next - each next step a task at once. With no signal
/// it is kept on the phone and sent later, like everything else here.
class GembaWalkScreen extends StatefulWidget {
  const GembaWalkScreen({super.key, required this.api, required this.zones, this.outbox});

  final ApiService api;
  final List<FiveSZone> zones;
  final Outbox? outbox;

  @override
  State<GembaWalkScreen> createState() => _GembaWalkScreenState();
}

class _GembaWalkScreenState extends State<GembaWalkScreen> {
  String? _zoneId;
  final _observations = TextEditingController();
  final _conversations = TextEditingController();
  final List<TextEditingController> _followUps = [TextEditingController()];
  bool _saving = false;

  @override
  void dispose() {
    _observations.dispose();
    _conversations.dispose();
    for (final controller in _followUps) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    final followUps = _followUps
        .map((controller) => controller.text.trim())
        .where((title) => title.length >= 3)
        .map((title) => {'title': title})
        .toList();
    if (_observations.text.trim().isEmpty && followUps.isEmpty) {
      messenger.showSnackBar(SnackBar(content: Text(strings.text('gembaEmpty'))));
      return;
    }
    final zone = widget.zones.where((zone) => zone.id == _zoneId).firstOrNull;
    final body = <String, dynamic>{
      if (zone != null) 'zoneId': zone.id,
      if (zone != null) 'area': zone.location,
      'observations': _observations.text.trim(),
      'conversations': _conversations.text.trim(),
      'followUps': followUps,
    };
    setState(() => _saving = true);
    try {
      await widget.api.recordGembaWalk(body);
      messenger.showSnackBar(SnackBar(content: Text(strings.text('gembaSaved'))));
      navigator.pop();
    } catch (e) {
      if (widget.outbox != null && neverSent(e)) {
        await widget.outbox!.keep(method: 'POST', path: '/gemba', kind: 'gemba', data: body);
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
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    return Scaffold(
      appBar: AppBar(title: Text(strings.text('gembaWalk'))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        DropdownButtonFormField<String?>(
          key: const Key('gemba-zone'),
          initialValue: _zoneId,
          isExpanded: true,
          decoration: InputDecoration(labelText: strings.text('gembaWhere')),
          items: [
            DropdownMenuItem<String?>(value: null, child: Text(strings.text('gembaNoZone'))),
            for (final zone in widget.zones)
              DropdownMenuItem<String?>(value: zone.id, child: Text(zone.location, overflow: TextOverflow.ellipsis)),
          ],
          onChanged: (value) => setState(() => _zoneId = value),
        ),
        const SizedBox(height: 12),
        TextField(
            key: const Key('gemba-observations'),
            controller: _observations,
            maxLines: 3,
            decoration: InputDecoration(labelText: strings.text('gembaSaw'))),
        const SizedBox(height: 12),
        TextField(
            controller: _conversations,
            maxLines: 2,
            decoration: InputDecoration(labelText: strings.text('gembaSaid'))),
        const SizedBox(height: 16),
        Text(strings.text('gembaNext'), style: Theme.of(context).textTheme.titleSmall),
        for (var index = 0; index < _followUps.length; index++)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: TextField(
              key: Key('gemba-follow-up-$index'),
              controller: _followUps[index],
              decoration: InputDecoration(labelText: strings.gembaStep(index + 1)),
            ),
          ),
        if (_followUps.length < 10)
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: () => setState(() => _followUps.add(TextEditingController())),
              icon: const Icon(Icons.add),
              label: Text(strings.text('gembaAddStep')),
            ),
          ),
        const SizedBox(height: 16),
        FilledButton.icon(
          key: const Key('gemba-save'),
          onPressed: _saving ? null : _save,
          icon: const Icon(Icons.directions_walk),
          label: Text(strings.text('gembaSave')),
        ),
      ]),
    );
  }
}
