import 'package:flutter/foundation.dart';

enum QuestionType { multipleChoice, singleChoice, text, rating, date, number }

class Question {
  final String id;
  final String text;
  final QuestionType type;
  final List<String>? options;
  final bool isRequired;
  final String? placeholder;
  final int? minValue;
  final int? maxValue;

  Question({
    required this.id,
    required this.text,
    required this.type,
    this.options,
    this.isRequired = false,
    this.placeholder,
    this.minValue,
    this.maxValue,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    final type = json['type'] as String? ?? 'text';

    return Question(
      id: json['id'] as String? ?? '',
      text: json['text'] as String? ?? '',
      type: _parseQuestionType(type),
      options: json['options'] != null
          ? List<String>.from(json['options'] as List)
          : type == 'yes_no'
              ? const ['Yes', 'No']
              : null,
      isRequired: json['isRequired'] ?? false,
      placeholder: json['placeholder'] as String?,
      minValue: json['minValue'] as int?,
      maxValue: (json['maxValue'] ?? json['maxScore']) as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'type': _questionTypeToString(type),
      'options': options,
      'isRequired': isRequired,
      'placeholder': placeholder,
      'minValue': minValue,
      'maxValue': maxValue,
    };
  }

  static QuestionType _parseQuestionType(String type) {
    switch (type) {
      case 'multipleChoice':
        return QuestionType.multipleChoice;
      case 'singleChoice':
      case 'yes_no':
        return QuestionType.singleChoice;
      case 'text':
        return QuestionType.text;
      case 'rating':
      case 'score':
        return QuestionType.rating;
      case 'date':
        return QuestionType.date;
      case 'number':
        return QuestionType.number;
      default:
        return QuestionType.text;
    }
  }

  static String _questionTypeToString(QuestionType type) {
    return type.toString().split('.').last;
  }
}

class Questionnaire {
  final String id;
  final String title;
  final String? description;
  final String organizationId;
  final List<Question> questions;
  final DateTime createdAt;
  final DateTime? expiresAt;
  final bool isActive;
  final int responseCount;

  Questionnaire({
    required this.id,
    required this.title,
    this.description,
    required this.organizationId,
    required this.questions,
    required this.createdAt,
    this.expiresAt,
    this.isActive = true,
    this.responseCount = 0,
  });

  factory Questionnaire.fromJson(Map<String, dynamic> json) {
    final createdAt = DateTime.tryParse(json['createdAt'] as String? ?? '');
    final status = json['status'] as String?;

    return Questionnaire(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? 'Untitled assessment',
      description: json['description'] as String?,
      organizationId: json['organizationId'] as String? ?? '',
      questions: (json['questions'] as List<dynamic>? ?? const [])
          .map(
              (question) => Question.fromJson(question as Map<String, dynamic>))
          .toList(),
      createdAt: createdAt ?? DateTime.fromMillisecondsSinceEpoch(0),
      expiresAt: json['expiresAt'] != null
          ? DateTime.tryParse(json['expiresAt'] as String)
          : null,
      isActive: json['isActive'] ?? status == 'published',
      responseCount: json['responseCount'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'organizationId': organizationId,
      'questions': questions.map((q) => q.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
      'expiresAt': expiresAt?.toIso8601String(),
      'isActive': isActive,
      'responseCount': responseCount,
    };
  }
}
