import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/five_s_model.dart';
import '../providers/auth_provider.dart';
import '../providers/five_s_provider.dart';
import '../utils/phase_one_strings.dart';

/// The areas on the organization's floor plans, each with how it scored last.
/// Tapping one walks its checklist.
class FiveSScreen extends StatefulWidget {
  const FiveSScreen({super.key});
  @override
  State<FiveSScreen> createState() => _FiveSScreenState();
}

class _FiveSScreenState extends State<FiveSScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final fiveS = context.read<FiveSProvider>();
    await fiveS.load();
    if (mounted && fiveS.sessionExpired) {
      await context.read<AuthProvider>().expireSession();
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    return Scaffold(
      appBar: AppBar(title: Text(strings.text('fiveS'))),
      body: Consumer<FiveSProvider>(builder: (context, fiveS, _) {
        if (fiveS.loading && fiveS.plans.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }
        if (fiveS.error != null && fiveS.plans.isEmpty) {
          return Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(strings.error(fiveS.error!)),
            const SizedBox(height: 12),
            FilledButton(onPressed: _load, child: Text(strings.text('retry'))),
          ]));
        }
        final withAreas = fiveS.plans.where((plan) => plan.zones.isNotEmpty);
        return RefreshIndicator(
          onRefresh: _load,
          child: ListView(children: [
            if (withAreas.isEmpty)
              Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(strings.text('fiveSEmpty'))),
            for (final plan in withAreas) ...[
              if (fiveS.plans.length > 1)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                  child: Text(plan.heading,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
              for (final zone in plan.zones)
                ListTile(
                  key: Key('zone-${zone.id}'),
                  leading: _ScoreBadge(score: zone.lastAuditScore),
                  title: Text(zone.location),
                  subtitle: Text(zone.lastAuditAt == null
                      ? strings.text('neverChecked')
                      : strings.lastChecked(zone.lastAuditAt!)),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(
                      builder: (_) => FiveSWalkScreen(plan: plan, zone: zone))),
                ),
            ],
          ]),
        );
      }),
    );
  }
}

class _ScoreBadge extends StatelessWidget {
  const _ScoreBadge({this.score});
  final num? score;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return CircleAvatar(
      backgroundColor: score == null
          ? colors.surfaceContainerHighest
          : score! >= 80
              ? colors.primaryContainer
              : colors.errorContainer,
      child: Text(score == null ? '–' : '${score!.round()}',
          style: Theme.of(context).textTheme.labelLarge),
    );
  }
}

/// One area's checklist, answered where the area is.
class FiveSWalkScreen extends StatefulWidget {
  const FiveSWalkScreen({super.key, required this.plan, required this.zone});
  final FiveSPlan plan;
  final FiveSZone zone;

  @override
  State<FiveSWalkScreen> createState() => _FiveSWalkScreenState();
}

class _FiveSWalkScreenState extends State<FiveSWalkScreen> {
  final AuditAnswers _answers = {};
  List<AuditTier> _layers = [];
  AuditTier? _tier;
  String? _templateId;

  @override
  void initState() {
    super.initState();
    final role = context.read<AuthProvider>().user?.role;
    _layers = tiersForRole(widget.plan.auditTiers, role);
    _tier = tierForRole(widget.plan.auditTiers, role);
    final templates = context.read<FiveSProvider>().templates;
    _templateId = _templateFor(_tier, templates) ??
        (templates.isEmpty ? null : templates.first.id);
  }

  /// The checklist a layer names, when the plan names one that is in use.
  String? _templateFor(AuditTier? tier, List<AuditTemplate> templates) {
    final wanted = tier?.templateId;
    return templates.any((template) => template.id == wanted) ? wanted : null;
  }

  Future<void> _save(AuditTemplate template) async {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final fiveS = context.read<FiveSProvider>();
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    final score = await fiveS.submit(
        zone: widget.zone, template: template, answers: _answers, tier: _tier);
    if (score != null) {
      messenger.showSnackBar(SnackBar(content: Text(strings.auditSaved(score))));
      navigator.pop();
    } else if (fiveS.error != null) {
      messenger.showSnackBar(SnackBar(content: Text(strings.error(fiveS.error!))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final fiveS = context.watch<FiveSProvider>();
    final templates = fiveS.templates;
    final template = templates.where((t) => t.id == _templateId).firstOrNull;

    return Scaffold(
      appBar: AppBar(title: Text(widget.zone.location)),
      body: template == null
          ? Padding(
              padding: const EdgeInsets.all(24),
              child: Text(strings.text('noChecklist')))
          : ListView(padding: const EdgeInsets.all(16), children: [
              if (_layers.length > 1) ...[
                DropdownButtonFormField<int>(
                  key: const Key('audit-layer'),
                  initialValue: _tier?.tier,
                  decoration: InputDecoration(labelText: strings.text('layer')),
                  items: [
                    for (final layer in _layers)
                      DropdownMenuItem(value: layer.tier, child: Text(layer.name))
                  ],
                  onChanged: (value) => setState(() {
                    _tier = _layers.firstWhere((layer) => layer.tier == value);
                    final named = _templateFor(_tier, templates);
                    if (named != null && named != _templateId) {
                      _templateId = named;
                      _answers.clear();
                    }
                  }),
                ),
                const SizedBox(height: 12),
              ],
              if (templates.length > 1) ...[
                DropdownButtonFormField<String>(
                  key: const Key('audit-template'),
                  initialValue: _templateId,
                  isExpanded: true,
                  decoration:
                      InputDecoration(labelText: strings.text('checklist')),
                  items: [
                    for (final item in templates)
                      DropdownMenuItem(value: item.id, child: Text(item.title))
                  ],
                  onChanged: (value) => setState(() {
                    _templateId = value;
                    _answers.clear();
                  }),
                ),
                const SizedBox(height: 12),
              ],
              for (final question in template.questions)
                _QuestionCard(
                  key: Key('question-${template.id}-${question.id}'),
                  question: question,
                  answer: _answers[question.id],
                  strings: strings,
                  onAnswer: (value) =>
                      setState(() => _answers[question.id] = value),
                ),
              const SizedBox(height: 8),
              Text(strings.scoreSoFar(scoreAnswers(template, _answers)),
                  key: const Key('audit-score'),
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              FilledButton(
                key: const Key('audit-save'),
                onPressed: fiveS.saving ? null : () => _save(template),
                child: Text(strings.text('saveAudit')),
              ),
            ]),
    );
  }
}

class _QuestionCard extends StatelessWidget {
  const _QuestionCard(
      {super.key,
      required this.question,
      required this.answer,
      required this.strings,
      required this.onAnswer});

  final AuditQuestion question;
  final String? answer;
  final PhaseOneStrings strings;
  final ValueChanged<String> onAnswer;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(question.text, style: Theme.of(context).textTheme.bodyLarge),
          const SizedBox(height: 8),
          switch (question.type) {
            'score' => Wrap(spacing: 8, runSpacing: 4, children: [
                for (var value = 0; value <= question.outOf; value++)
                  ChoiceChip(
                    key: Key('answer-${question.id}-$value'),
                    label: Text('$value'),
                    // No tick: it widens the chip and shoves the row along
                    // under the thumb that is choosing.
                    showCheckmark: false,
                    selected: answer == '$value',
                    onSelected: (_) => onAnswer('$value'),
                  ),
              ]),
            'yes_no' => Wrap(spacing: 8, children: [
                for (final value in const ['yes', 'no'])
                  ChoiceChip(
                    key: Key('answer-${question.id}-$value'),
                    label: Text(strings.text(value)),
                    selected: answer == value,
                    onSelected: (_) => onAnswer(value),
                  ),
              ]),
            _ => TextFormField(
                key: Key('answer-${question.id}'),
                initialValue: answer,
                decoration: InputDecoration(hintText: strings.text('auditNote')),
                maxLines: null,
                onChanged: onAnswer,
              ),
          },
        ]),
      ),
    );
  }
}
