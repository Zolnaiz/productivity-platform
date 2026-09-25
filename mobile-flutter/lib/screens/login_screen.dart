import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
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
                  Text(strings.text('tasks'),
                      style: Theme.of(context).textTheme.headlineMedium,
                      textAlign: TextAlign.center),
                  const SizedBox(height: 32),
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
