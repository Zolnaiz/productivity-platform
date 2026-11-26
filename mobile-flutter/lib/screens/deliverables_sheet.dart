// A task's work documents on the phone (PLAN_V2 M2): the review state, the files newest version first, a photo of
// the finished work straight from the camera, and "send for review". Approving and returning are done on the web
// by whoever reviews; the server decides who may do what (backend operations/deliverables.ts). A photo needs a
// connection: unlike status changes it is not kept in the outbox, so a failed upload says so and can be retried.

import 'package:flutter/material.dart';

import '../services/api_service.dart';
import '../utils/phase_one_strings.dart';
import 'five_s_screen.dart' show PhotoPicker, takePhoto;

/// Opens the sheet; `onStatus` hears the review state after each step.
Future<void> showDeliverablesSheet(BuildContext context,
        {required ApiService api,
        required String taskId,
        required void Function(String status) onStatus,
        PhotoPicker? pickPhoto}) =>
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => DeliverablesSheet(
          api: api, taskId: taskId, onStatus: onStatus, pickPhoto: pickPhoto),
    );

class DeliverablesSheet extends StatefulWidget {
  const DeliverablesSheet(
      {super.key,
      required this.api,
      required this.taskId,
      required this.onStatus,
      this.pickPhoto});
  final ApiService api;
  final String taskId;
  final void Function(String status) onStatus;

  /// Where photographs come from; the camera unless a test says otherwise.
  final PhotoPicker? pickPhoto;

  @override
  State<DeliverablesSheet> createState() => _DeliverablesSheetState();
}

class _DeliverablesSheetState extends State<DeliverablesSheet> {
  Map<String, dynamic>? _state;
  Object? _error;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _run(() => widget.api.getDeliverables(widget.taskId), report: false);
  }

  Future<void> _run(Future<Map<String, dynamic>> Function() step,
      {bool report = true}) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final next = await step();
      if (!mounted) return;
      setState(() => _state = next);
      if (report) widget.onStatus(_status);
    } catch (error) {
      if (mounted) setState(() => _error = error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String get _status =>
      ((_state?['review'] as Map?)?['status'] as String?) ?? 'none';

  List<Map<String, dynamic>> get _files => ((_state?['files'] as List?) ?? [])
      .cast<Map>()
      .map((file) => file.cast<String, dynamic>())
      .toList();

  Future<void> _photo() async {
    final photo = await (widget.pickPhoto ?? takePhoto)();
    if (photo == null) return;
    await _run(() =>
        widget.api.uploadDeliverable(widget.taskId, photo.bytes, photo.name));
  }

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final theme = Theme.of(context);
    final editable = _status == 'none' || _status == 'returned';
    final note = (_state?['review'] as Map?)?['note'] as String?;

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
            16, 16, 16, 16 + MediaQuery.of(context).viewInsets.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(
                  child: Text(strings.text('docs.title'),
                      style: theme.textTheme.titleMedium)),
              if (_state != null)
                Chip(
                    key: const Key('docs-status'),
                    label: Text(strings.text('docs.status.$_status'))),
            ]),
            if (_state == null && _error == null)
              const Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(child: CircularProgressIndicator())),
            if (_status == 'returned' && note != null && note.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(top: 8),
                padding: const EdgeInsets.all(12),
                color: Colors.amber.shade50,
                child: Text('${strings.text('docs.returned')}\n$note',
                    key: const Key('docs-note')),
              ),
            if (_state != null && _files.isEmpty)
              Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Text(strings.text('docs.empty'))),
            for (final file in _files)
              ListTile(
                key: Key('doc-${file['id']}'),
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(child: Text('v${file['version']}')),
                title: Text(file['fileName'] as String? ?? ''),
                subtitle: Text(
                    '${((file['sizeBytes'] as num? ?? 0) / 1024).ceil()} KB'),
              ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(strings.error(_error!),
                    key: const Key('docs-error'),
                    style: TextStyle(color: theme.colorScheme.error)),
              ),
            if (_status == 'submitted')
              Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(strings.text('docs.waiting'))),
            if (_status == 'approved')
              Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(strings.text('docs.locked'))),
            if (_state != null && editable) ...[
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                  child: OutlinedButton.icon(
                    key: const Key('docs-photo'),
                    onPressed: _busy ? null : _photo,
                    icon: const Icon(Icons.photo_camera),
                    label: Text(strings.text('docs.photo')),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    key: const Key('docs-submit'),
                    onPressed: _busy || _files.isEmpty
                        ? null
                        : () => _run(() =>
                            widget.api.submitDeliverables(widget.taskId)),
                    child: Text(strings.text('docs.submit')),
                  ),
                ),
              ]),
            ],
          ],
        ),
      ),
    );
  }
}
