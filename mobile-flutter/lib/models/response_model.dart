import 'package:flutter/foundation.dart';

class Answer {
  final String questionId;
  final dynamic value;
  final DateTime answeredAt;

  Answer({
    required this.questionId,
    required this.value,
    required this.answeredAt,
  });

  factory Answer.fromJson(Map<String, dynamic> json) {
    return Answer(
      questionId: json['questionId'],
      value: json['value'],
      answeredAt: DateTime.parse(json['answeredAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'questionId': questionId,
      'value': value,
      'answeredAt': answeredAt.toIso8601String(),
    };
  }
}

class QuestionnaireResponse {
  final String id;
  final String questionnaireId;
  final String userId;
  final String organizationId;
  final List<Answer> answers;
  final DateTime submittedAt;
  final Duration? completionTime;
  final Map<String, dynamic>? metadata;

  QuestionnaireResponse({
    required this.id,
    required this.questionnaireId,
    required this.userId,
    required this.organizationId,
    required this.answers,
    required this.submittedAt,
    this.completionTime,
    this.metadata,
  });

  factory QuestionnaireResponse.fromJson(Map<String, dynamic> json) {
    return QuestionnaireResponse(
      id: json['id'],
      questionnaireId: json['questionnaireId'],
      userId: json['userId'],
      organizationId: json['organizationId'],
      answers: List<Answer>.from(
        json['answers'].map((a) => Answer.fromJson(a))
      ),
      submittedAt: DateTime.parse(json['submittedAt']),
      completionTime: json['completionTime'] != null 
        ? Duration(seconds: json['completionTime']) 
        : null,
      metadata: json['metadata'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'questionnaireId': questionnaireId,
      'userId': userId,
      'organizationId': organizationId,
      'answers': answers.map((a) => a.toJson()).toList(),
      'submittedAt': submittedAt.toIso8601String(),
      'completionTime': completionTime?.inSeconds,
      'metadata': metadata,
    };
  }
}