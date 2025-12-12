import 'package:flutter/foundation.dart';

enum QuestionType {
  multipleChoice,
  singleChoice,
  text,
  rating,
  date,
  number
}

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
    return Question(
      id: json['id'],
      text: json['text'],
      type: _parseQuestionType(json['type']),
      options: json['options'] != null ? List<String>.from(json['options']) : null,
      isRequired: json['isRequired'] ?? false,
      placeholder: json['placeholder'],
      minValue: json['minValue'],
      maxValue: json['maxValue'],
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
      case 'multipleChoice': return QuestionType.multipleChoice;
      case 'singleChoice': return QuestionType.singleChoice;
      case 'text': return QuestionType.text;
      case 'rating': return QuestionType.rating;
      case 'date': return QuestionType.date;
      case 'number': return QuestionType.number;
      default: return QuestionType.text;
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
    return Questionnaire(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      organizationId: json['organizationId'],
      questions: List<Question>.from(
        json['questions'].map((q) => Question.fromJson(q))
      ),
      createdAt: DateTime.parse(json['createdAt']),
      expiresAt: json['expiresAt'] != null ? DateTime.parse(json['expiresAt']) : null,
      isActive: json['isActive'] ?? true,
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