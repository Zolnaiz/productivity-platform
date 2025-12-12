import 'package:flutter/material.dart';

class QuestionnaireDetailScreen extends StatelessWidget {
  const QuestionnaireDetailScreen({super.key, required this.questionnaireId});
  final String questionnaireId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Questionnaire')),
      body: Center(child: Text('Questionnaire ID: $questionnaireId')),
    );
  }
}
