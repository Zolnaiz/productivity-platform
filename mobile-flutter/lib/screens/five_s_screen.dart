import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../models/five_s_model.dart';
import '../models/work_log_model.dart' show localDay;
import '../providers/auth_provider.dart';
import '../providers/five_s_provider.dart';
import '../utils/phase_one_strings.dart';
import 'scan_label_screen.dart';

/// Reads a label and says which area it names, or null.
typedef LabelScanner = Future<({String planId, String zoneId})?> Function(
    BuildContext context);

Future<({String planId, String zoneId})?> scanWithCamera(BuildContext context) =>
    Navigator.of(context).push<({String planId, String zoneId})>(
        MaterialPageRoute(builder: (_) => const ScanLabelScreen()));

/// The areas on the organization's floor plans, each with how it scored last.
/// Tapping one walks its checklist; scanning its label opens it too.
class FiveSScreen extends StatefulWidget {
  const FiveSScreen({super.key, this.scanLabel = scanWithCamera});

  final LabelScanner scanLabel;
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

  /// Opens the area a scanned label names. A label for an area this phone
  /// has not heard of yet - drawn on the plan since it loaded - is looked for
  /// again once before it is called unknown.
  Future<void> _scan() async {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final fiveS = context.read<FiveSProvider>();
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    final label = await widget.scanLabel(context);
    if (label == null) return;

    (FiveSPlan, FiveSZone)? find() {
      for (final plan in fiveS.plans) {
        if (plan.id != label.planId) continue;
        for (final zone in plan.zones) {
          if (zone.id == label.zoneId) return (plan, zone);
        }
      }
      return null;
    }

    var found = find();
    if (found == null) {
      await fiveS.load();
      found = find();
    }
    if (found == null) {
      messenger.showSnackBar(SnackBar(content: Text(strings.text('labelUnknown'))));
      return;
    }
    final (plan, zone) = found;
    navigator.push(MaterialPageRoute(builder: (_) => FiveSZoneScreen(plan: plan, zone: zone)));
  }

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    return Scaffold(
      appBar: AppBar(title: Text(strings.text('fiveS'))),
      // Where the thumb is: the person is standing at the label.
      floatingActionButton: FloatingActionButton.extended(
        key: const Key('scan-label'),
        onPressed: _scan,
        icon: const Icon(Icons.qr_code_scanner),
        label: Text(strings.text('scanLabel')),
      ),
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
                      builder: (_) => FiveSZoneScreen(plan: plan, zone: zone))),
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

/// One area, as somebody standing in it needs it: how it last scored, what
/// is tagged there, and the three things they can do about it - tag
/// something, say it was cleaned, walk the checklist.
/// A photograph taken for the app: its bytes and a name. Null when the person
/// backed out of the camera.
typedef PhotoPicker = Future<({List<int> bytes, String name})?> Function();

/// The phone's camera, at a size that is enough to see a pallet by and small
/// enough to send from the floor.
Future<({List<int> bytes, String name})?> takePhoto() async {
  final photo = await ImagePicker()
      .pickImage(source: ImageSource.camera, maxWidth: 1600, imageQuality: 80);
  if (photo == null) return null;
  // The camera's own name reads "scaled_543dcb74-...jpg" in every list the
  // photograph appears in; the moment it was taken says something.
  final now = DateTime.now();
  String two(int value) => value.toString().padLeft(2, '0');
  final name = 'photo-${localDay(now)}-${two(now.hour)}${two(now.minute)}'
      '${two(now.second)}.jpg';
  return (bytes: await photo.readAsBytes(), name: name);
}

class FiveSZoneScreen extends StatefulWidget {
  const FiveSZoneScreen(
      {super.key, required this.plan, required this.zone, this.pickPhoto});
  final FiveSPlan plan;
  final FiveSZone zone;

  /// Where photographs come from; the camera unless a test says otherwise.
  final PhotoPicker? pickPhoto;

  @override
  State<FiveSZoneScreen> createState() => _FiveSZoneScreenState();
}

class _FiveSZoneScreenState extends State<FiveSZoneScreen> {
  final _title = TextEditingController();
  final _disposition = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<FiveSProvider>().loadPhotoCounts(widget.zone.openRedTags);
    });
  }

  @override
  void dispose() {
    _title.dispose();
    _disposition.dispose();
    super.dispose();
  }

  /// A photograph of the tagged item as it was found - the "before" a 5S
  /// board shows beside the "after".
  Future<void> _photograph(FiveSRedTag redTag) async {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final fiveS = context.read<FiveSProvider>();
    final messenger = ScaffoldMessenger.of(context);
    final photo = await (widget.pickPhoto ?? takePhoto)();
    if (photo == null) return;
    final saved = await fiveS.addRedTagPhoto(redTag,
        bytes: photo.bytes, fileName: photo.name);
    messenger.showSnackBar(SnackBar(
        content: Text(saved
            ? strings.text('photoSaved')
            : strings.error(fiveS.error ?? 'error.unknown'))));
  }

  Future<void> _tag(FiveSPlan plan, FiveSZone zone) async {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final title = _title.text.trim();
    if (title.isEmpty) return;
    final fiveS = context.read<FiveSProvider>();
    final messenger = ScaffoldMessenger.of(context);
    final saved = await fiveS.addRedTag(plan, zone,
        title: title, disposition: _disposition.text.trim());
    if (saved) {
      _title.clear();
      _disposition.clear();
      messenger
          .showSnackBar(SnackBar(
              content: Text(strings
                  .text(fiveS.lastKept ? 'keptNow' : 'redTagSaved'))));
    } else if (fiveS.error != null) {
      messenger
          .showSnackBar(SnackBar(content: Text(strings.error(fiveS.error!))));
    }
  }

  Future<void> _cleaned(FiveSPlan plan, FiveSZone zone) async {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final fiveS = context.read<FiveSProvider>();
    final messenger = ScaffoldMessenger.of(context);
    final done = await fiveS.markCleaned(plan, zone);
    if (done && fiveS.lastKept) {
      messenger.showSnackBar(SnackBar(content: Text(strings.text('keptNow'))));
    }
    if (!done && fiveS.error != null) {
      messenger
          .showSnackBar(SnackBar(content: Text(strings.error(fiveS.error!))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final fiveS = context.watch<FiveSProvider>();
    // The area as last read, so a tag or a clean shows as soon as it is saved.
    final (plan, zone) = fiveS.find(widget.plan.id, widget.zone.id) ??
        (widget.plan, widget.zone);
    // A viewer may look; everybody else on the floor may tag and clean.
    final canAct = context.read<AuthProvider>().user?.role != 'viewer';
    final tags = zone.openRedTags;

    return Scaffold(
      appBar: AppBar(title: Text(zone.location)),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Row(children: [
          _ScoreBadge(score: zone.lastAuditScore),
          const SizedBox(width: 12),
          Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(zone.lastAuditAt == null
                  ? strings.text('neverChecked')
                  : strings.lastChecked(zone.lastAuditAt!)),
              Text(zone.lastCleanedAt == null
                  ? strings.text('neverCleaned')
                  : strings.lastCleaned(zone.lastCleanedAt!)),
            ]),
          ),
        ]),
        const SizedBox(height: 16),
        if (canAct) ...[
          FilledButton.icon(
            key: const Key('zone-walk'),
            icon: const Icon(Icons.fact_check_outlined),
            label: Text(strings.text('walkChecklist')),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => FiveSWalkScreen(
                    plan: plan, zone: zone, pickPhoto: widget.pickPhoto))),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            key: const Key('zone-cleaned'),
            icon: const Icon(Icons.cleaning_services_outlined),
            label: Text(strings.text('cleanedToday')),
            onPressed: fiveS.saving ? null : () => _cleaned(plan, zone),
          ),
          const SizedBox(height: 16),
        ],
        Text(strings.redTagsHeading(tags.length),
            style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 4),
        if (tags.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Text(strings.text('noRedTags')),
          ),
        for (final redTag in tags)
          ListTile(
            key: Key('redtag-${redTag.id}'),
            contentPadding: EdgeInsets.zero,
            leading:
                const Icon(Icons.label_important_outline, color: Colors.red),
            title: Text(redTag.title),
            subtitle:
                redTag.disposition.isEmpty ? null : Text(redTag.disposition),
            trailing: canAct
                ? IconButton(
                    key: Key('redtag-photo-${redTag.id}'),
                    tooltip: strings.text('takePhoto'),
                    onPressed: fiveS.saving ? null : () => _photograph(redTag),
                    icon: Badge(
                      isLabelVisible: (fiveS.photoCounts[redTag.id] ?? 0) > 0,
                      label: Text('${fiveS.photoCounts[redTag.id] ?? 0}'),
                      child: const Icon(Icons.photo_camera_outlined),
                    ),
                  )
                : null,
          ),
        if (canAct) ...[
          const SizedBox(height: 8),
          TextField(
            key: const Key('redtag-title'),
            controller: _title,
            decoration: InputDecoration(labelText: strings.text('redTagTitle')),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 8),
          TextField(
            key: const Key('redtag-disposition'),
            controller: _disposition,
            decoration:
                InputDecoration(labelText: strings.text('redTagDisposition')),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            key: const Key('redtag-save'),
            onPressed: fiveS.saving ? null : () => _tag(plan, zone),
            child: Text(strings.text('addRedTag')),
          ),
        ],
      ]),
    );
  }
}

/// The questions a recorded walk fell short on, each with a camera: of twelve
/// answers, the one a picture has to explain.
class FiveSShortfallScreen extends StatelessWidget {
  const FiveSShortfallScreen(
      {super.key,
      required this.runId,
      required this.zone,
      required this.shortfalls,
      this.pickPhoto});
  final String runId;
  final FiveSZone zone;
  final List<AuditQuestion> shortfalls;
  final PhotoPicker? pickPhoto;

  Future<void> _photograph(BuildContext context, AuditQuestion question) async {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final fiveS = context.read<FiveSProvider>();
    final messenger = ScaffoldMessenger.of(context);
    final photo = await (pickPhoto ?? takePhoto)();
    if (photo == null) return;
    final saved = await fiveS.addShortfallPhoto(runId, question,
        bytes: photo.bytes, fileName: photo.name);
    messenger.showSnackBar(SnackBar(
        content: Text(saved
            ? strings.text('photoSaved')
            : strings.error(fiveS.error ?? 'error.unknown'))));
  }

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final fiveS = context.watch<FiveSProvider>();
    return Scaffold(
      appBar: AppBar(title: Text(zone.location)),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Text(strings.text('shortfallPrompt')),
        const SizedBox(height: 8),
        for (final question in shortfalls)
          ListTile(
            key: Key('shortfall-${question.id}'),
            contentPadding: EdgeInsets.zero,
            title: Text(question.text),
            trailing: IconButton(
              key: Key('shortfall-photo-${question.id}'),
              tooltip: strings.text('takePhoto'),
              onPressed:
                  fiveS.saving ? null : () => _photograph(context, question),
              icon: Badge(
                isLabelVisible:
                    (fiveS.shortfallPhotoCounts[question.id] ?? 0) > 0,
                label: Text('${fiveS.shortfallPhotoCounts[question.id] ?? 0}'),
                child: const Icon(Icons.photo_camera_outlined),
              ),
            ),
          ),
        const SizedBox(height: 16),
        FilledButton(
          key: const Key('shortfall-done'),
          onPressed: () => Navigator.of(context).pop(),
          child: Text(strings.text('walkDone')),
        ),
      ]),
    );
  }
}

/// One area's checklist, answered where the area is.
class FiveSWalkScreen extends StatefulWidget {
  const FiveSWalkScreen(
      {super.key, required this.plan, required this.zone, this.pickPhoto});
  final FiveSPlan plan;
  final FiveSZone zone;
  final PhotoPicker? pickPhoto;

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
    final recorded = await fiveS.submit(
        zone: widget.zone, template: template, answers: _answers, tier: _tier);
    if (recorded != null) {
      messenger.showSnackBar(
          SnackBar(
              content: Text(fiveS.lastKept
                  ? strings.text('keptNow')
                  : strings.auditSaved(recorded.score))));
      final shortfalls = shortfallsOf(template, _answers);
      if (shortfalls.isEmpty || recorded.runId.isEmpty) {
        navigator.pop();
      } else {
        // Where it fell short, while the person is still standing there.
        fiveS.shortfallPhotoCounts.clear();
        navigator.pushReplacement(MaterialPageRoute(
            builder: (_) => FiveSShortfallScreen(
                runId: recorded.runId,
                zone: widget.zone,
                shortfalls: shortfalls,
                pickPhoto: widget.pickPhoto)));
      }
    } else if (fiveS.error != null) {
      messenger
          .showSnackBar(SnackBar(content: Text(strings.error(fiveS.error!))));
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
                      DropdownMenuItem(
                          value: layer.tier, child: Text(layer.name))
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
                decoration:
                    InputDecoration(hintText: strings.text('auditNote')),
                maxLines: null,
                onChanged: onAnswer,
              ),
          },
        ]),
      ),
    );
  }
}
