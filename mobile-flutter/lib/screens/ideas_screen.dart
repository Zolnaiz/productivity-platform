import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/idea_provider.dart';
import '../utils/phase_one_strings.dart';
import 'five_s_screen.dart' show PhotoPicker, takePhoto;

/// The idea box on the phone: what others suggested and what became of it,
/// and a button to put one's own in while looking at the thing.
class IdeasScreen extends StatefulWidget {
  const IdeasScreen({super.key, this.pickPhoto});

  final PhotoPicker? pickPhoto;

  @override
  State<IdeasScreen> createState() => _IdeasScreenState();
}

class _IdeasScreenState extends State<IdeasScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() => context.read<IdeaProvider>().load();

  Future<void> _newIdea() async {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final ideas = context.read<IdeaProvider>();
    final messenger = ScaffoldMessenger.of(context);
    final saved = await showModalBottomSheet<Idea>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => ChangeNotifierProvider.value(value: ideas, child: const _IdeaForm()),
    );
    if (saved == null || !mounted) return;
    if (ideas.lastKept) {
      messenger.showSnackBar(SnackBar(content: Text(strings.text('keptNow'))));
      return;
    }
    // How it is now, while the person is still standing in front of it.
    messenger.showSnackBar(SnackBar(
      content: Text(strings.text('ideaSent')),
      duration: const Duration(seconds: 8),
      action: SnackBarAction(
        label: strings.text('ideaAddPhoto'),
        onPressed: () async {
          final photo = await (widget.pickPhoto ?? takePhoto)();
          if (photo == null) return;
          final ok = await ideas.addBeforePhoto(saved, bytes: photo.bytes, fileName: photo.name);
          messenger.showSnackBar(SnackBar(
              content: Text(ok ? strings.text('photoSaved') : strings.error(ideas.error ?? 'error.unknown'))));
        },
      ),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final me = context.watch<AuthProvider>().user?.id;
    return Scaffold(
      appBar: AppBar(title: Text(strings.text('ideas'))),
      floatingActionButton: FloatingActionButton.extended(
        key: const Key('new-idea'),
        // Each tab keeps its own button alive; a shared default tag breaks
        // the page transition when an area is opened.
        heroTag: 'new-idea',
        onPressed: _newIdea,
        icon: const Icon(Icons.lightbulb_outline),
        label: Text(strings.text('ideaNew')),
      ),
      body: Consumer<IdeaProvider>(builder: (context, ideas, _) {
        if (ideas.loading && ideas.ideas.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }
        if (ideas.error != null && ideas.ideas.isEmpty) {
          return Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(strings.error(ideas.error!)),
            const SizedBox(height: 12),
            FilledButton(onPressed: _load, child: Text(strings.text('retry'))),
          ]));
        }
        return RefreshIndicator(
          onRefresh: _load,
          child: ListView(padding: const EdgeInsets.only(bottom: 96), children: [
            if (ideas.ideas.isEmpty)
              Padding(padding: const EdgeInsets.all(24), child: Text(strings.text('ideasEmpty'))),
            for (final idea in ideas.ideas)
              ListTile(
                key: Key('idea-${idea.id.isEmpty ? idea.title : idea.id}'),
                title: Text(idea.title),
                subtitle: Text([
                  if (idea.authorId != null && idea.authorId == me) strings.text('ideaYours'),
                  if (idea.area.isNotEmpty) idea.area,
                  if (idea.reviewNote.isNotEmpty) '“${idea.reviewNote}”',
                ].join(' · ')),
                trailing: Chip(label: Text(strings.text('ideaStatus.${idea.id.isEmpty ? 'kept' : idea.status}'))),
              ),
          ]),
        );
      }),
    );
  }
}

class _IdeaForm extends StatefulWidget {
  const _IdeaForm();

  @override
  State<_IdeaForm> createState() => _IdeaFormState();
}

class _IdeaFormState extends State<_IdeaForm> {
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _area = TextEditingController();
  final _benefit = TextEditingController();

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _area.dispose();
    _benefit.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final ideas = context.read<IdeaProvider>();
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    if (_title.text.trim().length < 3) {
      messenger.showSnackBar(SnackBar(content: Text(strings.text('ideaTooShort'))));
      return;
    }
    final saved = await ideas.submit(
      title: _title.text.trim(),
      description: _description.text.trim(),
      area: _area.text.trim(),
      benefit: _benefit.text.trim(),
    );
    if (saved != null) {
      navigator.pop(saved);
    } else {
      messenger.showSnackBar(SnackBar(content: Text(strings.error(ideas.error ?? 'error.unknown'))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final saving = context.watch<IdeaProvider>().saving;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text(strings.text('ideaNew'), style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          TextField(
              key: const Key('idea-title'),
              controller: _title,
              autofocus: true,
              decoration: InputDecoration(labelText: strings.text('ideaTitle'))),
          const SizedBox(height: 12),
          TextField(
              controller: _description,
              maxLines: 3,
              decoration: InputDecoration(labelText: strings.text('ideaDescription'))),
          const SizedBox(height: 12),
          TextField(controller: _area, decoration: InputDecoration(labelText: strings.text('ideaArea'))),
          const SizedBox(height: 12),
          TextField(controller: _benefit, decoration: InputDecoration(labelText: strings.text('ideaBenefit'))),
          const SizedBox(height: 16),
          FilledButton.icon(
            key: const Key('idea-send'),
            onPressed: saving ? null : _send,
            icon: const Icon(Icons.send),
            label: Text(strings.text('ideaSend')),
          ),
        ]),
      ),
    );
  }
}
