import 'package:flutter/material.dart';

import '../services/api_service.dart';
import '../utils/phase_one_strings.dart';

/// A person's own details: name, phone, language and password. Reached from
/// the account menu rather than a tab of its own.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key, required this.api});

  final ApiService api;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _phone = TextEditingController();
  final _current = TextEditingController();
  final _next = TextEditingController();
  String _language = 'mn';
  String? _detailsError;
  String? _passwordError;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _read();
  }

  @override
  void dispose() {
    for (final c in [_first, _last, _phone, _current, _next]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _read() async {
    try {
      final me = await widget.api.getCurrentUser();
      final data = me['data'] is Map ? me['data'] as Map : me;
      if (!mounted) return;
      setState(() {
        _first.text = (data['firstName'] as String?) ?? '';
        _last.text = (data['lastName'] as String?) ?? '';
        _phone.text = (data['phone'] as String?) ?? '';
        _language = (data['language'] as String?) == 'en' ? 'en' : 'mn';
        _loaded = true;
      });
    } catch (_) {
      if (mounted) setState(() => _loaded = true);
    }
  }

  Future<void> _saveDetails() async {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _detailsError = null);
    try {
      await widget.api.updateProfile(
          firstName: _first.text.trim(),
          lastName: _last.text.trim(),
          phone: _phone.text.trim(),
          language: _language);
      messenger.showSnackBar(SnackBar(content: Text(strings.text('profileSaved'))));
    } catch (e) {
      if (mounted) setState(() => _detailsError = strings.error(e));
    }
  }

  Future<void> _savePassword() async {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    final messenger = ScaffoldMessenger.of(context);
    if (_next.text.length < 6) {
      setState(() => _passwordError = strings.text('profilePasswordShort'));
      return;
    }
    setState(() => _passwordError = null);
    try {
      await widget.api.changePassword(_current.text, _next.text);
      _current.clear();
      _next.clear();
      messenger.showSnackBar(SnackBar(content: Text(strings.text('profilePasswordChanged'))));
    } catch (e) {
      if (mounted) setState(() => _passwordError = strings.error(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    return Scaffold(
      appBar: AppBar(title: Text(strings.text('profile'))),
      body: !_loaded
          ? const Center(child: CircularProgressIndicator())
          : ListView(padding: const EdgeInsets.all(16), children: [
              TextField(
                  key: const Key('profile-last'),
                  controller: _last,
                  decoration: InputDecoration(labelText: strings.text('profileLastName'))),
              TextField(
                  key: const Key('profile-first'),
                  controller: _first,
                  decoration: InputDecoration(labelText: strings.text('profileFirstName'))),
              TextField(
                  key: const Key('profile-phone'),
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(labelText: strings.text('profilePhone'))),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                key: const Key('profile-language'),
                initialValue: _language,
                decoration: InputDecoration(labelText: strings.text('profileLanguage')),
                items: const [
                  DropdownMenuItem(value: 'mn', child: Text('Монгол')),
                  DropdownMenuItem(value: 'en', child: Text('English')),
                ],
                onChanged: (value) => setState(() => _language = value ?? 'mn'),
              ),
              if (_detailsError != null)
                Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(_detailsError!, style: TextStyle(color: Theme.of(context).colorScheme.error))),
              const SizedBox(height: 12),
              FilledButton(
                  key: const Key('profile-save'),
                  onPressed: _saveDetails,
                  child: Text(strings.text('profileSave'))),
              const Divider(height: 40),
              Text(strings.text('profilePassword'), style: Theme.of(context).textTheme.titleMedium),
              TextField(
                  key: const Key('profile-current-password'),
                  controller: _current,
                  obscureText: true,
                  decoration: InputDecoration(labelText: strings.text('profileCurrentPassword'))),
              TextField(
                  key: const Key('profile-new-password'),
                  controller: _next,
                  obscureText: true,
                  decoration: InputDecoration(labelText: strings.text('profileNewPassword'))),
              if (_passwordError != null)
                Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(_passwordError!, style: TextStyle(color: Theme.of(context).colorScheme.error))),
              const SizedBox(height: 12),
              FilledButton.tonal(
                  key: const Key('profile-change-password'),
                  onPressed: _savePassword,
                  child: Text(strings.text('profilePassword'))),
            ]),
    );
  }
}
