import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/api_service.dart';
import '../services/outbox.dart';
import '../utils/phase_one_strings.dart';

/// The ten statements of the usability questionnaire (SUS, measure K7), the
/// same as the web's and Appendix B of the thesis, each answered 1-5.
///
/// Operators mostly use the phone, so the questionnaire has to be here too:
/// a usability score from only those at a desk would leave out the people
/// the app was built for. Nothing is sent until all ten are answered. With
/// no signal the answers are kept and sent later; the server keeps one set a
/// person a round, so a copy sent twice changes nothing.
class SusScreen extends StatefulWidget {
  const SusScreen({
    super.key,
    required this.api,
    required this.roundId,
    required this.title,
    this.answers,
    this.outbox,
  });

  final ApiService api;
  final Outbox? outbox;
  final String roundId;
  final String title;

  /// The answers already given, to change while the round is open.
  final List<int>? answers;

  @override
  State<SusScreen> createState() => _SusScreenState();
}

class _SusScreenState extends State<SusScreen> {
  static const _items = 10;
  late final List<int?> _answers = widget.answers?.cast<int?>().toList() ?? List<int?>.filled(_items, null);
  bool _saving = false;

  bool get _complete => _answers.every((answer) => answer != null);

  Future<void> _send() async {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    final answers = _answers.cast<int>();
    setState(() => _saving = true);
    try {
      final saved = await widget.api.answerSus(widget.roundId, answers);
      messenger.showSnackBar(SnackBar(content: Text(strings.susThanks(saved['score'] as num? ?? 0))));
      navigator.pop(true);
    } catch (e) {
      if (widget.outbox != null && unanswered(e)) {
        await widget.outbox!.keep(
            method: 'PUT',
            path: '/sus/rounds/${widget.roundId}/answers/mine',
            kind: 'sus',
            data: {'answers': answers});
        messenger.showSnackBar(SnackBar(content: Text(strings.text('keptNow'))));
        navigator.pop(true);
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
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(strings.text('susTitle'))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Text(widget.title, style: theme.textTheme.titleMedium),
        const SizedBox(height: 4),
        Text(strings.text('susScaleHint')),
        const SizedBox(height: 12),
        for (var item = 0; item < _items; item++)
          Card(
            key: Key('sus-s${item + 1}'),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('S${item + 1}. ${strings.text('sus.s${item + 1}')}', style: theme.textTheme.bodyLarge),
                const SizedBox(height: 8),
                // Large targets for a thumb, one tap each; the ends of the
                // scale are named under the row.
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  for (var value = 1; value <= 5; value++)
                    Semantics(
                      label: strings.susChoice(item + 1, value),
                      selected: _answers[item] == value,
                      button: true,
                      excludeSemantics: true,
                      child: ChoiceChip(
                        key: Key('sus-s${item + 1}-$value'),
                        label: Text('$value'),
                        selected: _answers[item] == value,
                        onSelected: (_) => setState(() => _answers[item] = value),
                      ),
                    ),
                ]),
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text(strings.text('susDisagree'), style: theme.textTheme.bodySmall),
                  Text(strings.text('susAgree'), style: theme.textTheme.bodySmall),
                ]),
              ]),
            ),
          ),
        const SizedBox(height: 8),
        if (!_complete) Text(strings.text('susAnswerAll')),
        const SizedBox(height: 8),
        FilledButton(
          key: const Key('sus-send'),
          onPressed: _complete && !_saving ? _send : null,
          child: Text(strings.text('susSend')),
        ),
      ]),
    );
  }
}

/// On the Today screen while a round is open and this person has not
/// answered it: one tap to the questionnaire, and gone once it is answered.
/// Asks the server itself, so the screen it sits on needs no new provider;
/// with no signal it shows nothing rather than an error.
class SusReminderCard extends StatefulWidget {
  const SusReminderCard({super.key, required this.api});

  final ApiService api;

  @override
  State<SusReminderCard> createState() => _SusReminderCardState();
}

class _SusReminderCardState extends State<SusReminderCard> {
  Map<String, dynamic>? _round;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final current = await widget.api.getCurrentSus();
      final round = current['round'];
      if (mounted) {
        setState(() => _round = round is Map && current['mine'] == null ? round.cast<String, dynamic>() : null);
      }
    } catch (_) {
      // Offline or refused: no reminder.
    }
  }

  Future<void> _open() async {
    Outbox? outbox;
    try {
      outbox = context.read<Outbox>();
    } catch (_) {
      outbox = null;
    }
    final round = _round!;
    final answered = await Navigator.of(context).push<bool>(MaterialPageRoute(
        builder: (_) => SusScreen(
            api: widget.api, outbox: outbox, roundId: round['id'] as String, title: round['title'] as String? ?? '')));
    if (answered == true && mounted) setState(() => _round = null);
  }

  @override
  Widget build(BuildContext context) {
    if (_round == null) return const SizedBox.shrink();
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    return Card(
      child: ListTile(
        key: const Key('today-sus'),
        leading: const Icon(Icons.fact_check_outlined),
        title: Text(strings.text('susReminder')),
        trailing: TextButton(onPressed: _open, child: Text(strings.text('susAnswer'))),
        onTap: _open,
      ),
    );
  }
}
