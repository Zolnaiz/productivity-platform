// Sign-in screen, with a dialog to change the server address.

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../services/api_service.dart' show ServerUnreachable;
import '../utils/phase_one_strings.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final success = await auth.login(_email.text.trim(), _password.text);
    if (!mounted || success) return;
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(strings.error(auth.error ?? 'error.unknown'))));
  }

  Future<void> _changeServer() => showDialog<void>(
        context: context,
        builder: (_) => _ServerDialog(auth: context.read<AuthProvider>()),
      );

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    return Scaffold(
        body: SafeArea(
            child: Center(
                child: SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 440),
          child: Form(
            key: _formKey,
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(Icons.work_outline, size: 64),
                  const SizedBox(height: 16),
                  // The app's name, not a tab's: "My tasks" here read as if
                  // the task list had opened empty.
                  Text(strings.text('appName'),
                      style: Theme.of(context).textTheme.headlineMedium,
                      textAlign: TextAlign.center),
                  const SizedBox(height: 8),
                  Text(strings.text('signInHint'),
                      style: Theme.of(context).textTheme.bodyMedium,
                      textAlign: TextAlign.center),
                  // Which organization's server this signs in to. One app
                  // from the store serves every organization, each on its
                  // own server, so the address is shown and can be changed.
                  Consumer<AuthProvider>(
                      builder: (context, auth, _) => Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Flexible(
                                    child: Text(
                                        '${strings.text('server')}: '
                                        '${hostOf(auth.serverAddress)}',
                                        key: const Key('server-shown'),
                                        overflow: TextOverflow.ellipsis,
                                        // bodyMedium, as the line above:
                                        // bodySmall's grey reads below the
                                        // WCAG 4.5:1 contrast on this
                                        // background.
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodyMedium)),
                                TextButton(
                                    key: const Key('change-server'),
                                    onPressed:
                                        auth.isLoading ? null : _changeServer,
                                    child: Text(strings.text('serverChange'))),
                              ])),
                  const SizedBox(height: 24),
                  TextFormField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.username],
                      decoration:
                          InputDecoration(labelText: strings.text('email')),
                      validator: (value) => value != null && value.contains('@')
                          ? null
                          : strings.text('error.VALIDATION_FAILED')),
                  const SizedBox(height: 16),
                  TextFormField(
                      controller: _password,
                      obscureText: true,
                      autofillHints: const [AutofillHints.password],
                      decoration:
                          InputDecoration(labelText: strings.text('password')),
                      validator: (value) => value != null && value.isNotEmpty
                          ? null
                          : strings.text('error.VALIDATION_FAILED'),
                      onFieldSubmitted: (_) => _submit()),
                  const SizedBox(height: 24),
                  Consumer<AuthProvider>(
                      builder: (context, auth, _) => FilledButton(
                            onPressed: auth.isLoading ? null : _submit,
                            child: auth.isLoading
                                ? const SizedBox.square(
                                    dimension: 20,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2))
                                : Text(strings.text('signIn')),
                          )),
                ]),
          )),
    ))));
  }
}

/// The part of an API address a person recognises: `company.example.com`
/// rather than `https://company.example.com/api`.
String hostOf(String address) => Uri.tryParse(address)?.authority ?? address;

/// Asks for the organization's server and switches to it once its API
/// answers ([AuthProvider.useServer]). It stays open with a message when
/// nothing does, so a typo can be fixed without typing the address again.
///
/// A widget of its own so the text field's controller lives exactly as long
/// as the field: a dialog keeps drawing while it closes, and a controller
/// disposed by whoever opened it is still in use until then.
class _ServerDialog extends StatefulWidget {
  const _ServerDialog({required this.auth});

  final AuthProvider auth;

  @override
  State<_ServerDialog> createState() => _ServerDialogState();
}

class _ServerDialogState extends State<_ServerDialog> {
  late final _address =
      TextEditingController(text: hostOf(widget.auth.serverAddress));
  String? _problem;
  bool _checking = false;

  @override
  void dispose() {
    _address.dispose();
    super.dispose();
  }

  Future<void> _use() async {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    setState(() {
      _checking = true;
      _problem = null;
    });
    try {
      await widget.auth.useServer(_address.text);
      if (mounted) Navigator.of(context).pop();
    } on ServerUnreachable {
      if (!mounted) return;
      setState(() {
        _checking = false;
        _problem = strings.text('serverUnreachable');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = PhaseOneStrings(Localizations.localeOf(context));
    return AlertDialog(
      title: Text(strings.text('serverAddress')),
      content: TextField(
        key: const Key('server-address'),
        controller: _address,
        autofocus: true,
        keyboardType: TextInputType.url,
        autocorrect: false,
        decoration: InputDecoration(
            hintText: strings.text('serverAddressHint'),
            errorText: _problem,
            errorMaxLines: 3),
        onSubmitted: (_) => _checking ? null : _use(),
      ),
      actions: [
        TextButton(
            onPressed: _checking ? null : () => Navigator.of(context).pop(),
            child: Text(strings.text('cancel'))),
        FilledButton(
            onPressed: _checking ? null : _use,
            child: Text(strings.text('serverUse'))),
      ],
    );
  }
}
