import 'package:flutter/foundation.dart';

enum ReportType {
  questionnaireSummary,
  expenseSummary,
  userActivity,
  organizationOverview
}

enum ReportFormat {
  pdf,
  excel,
  csv,
  json
}

class Report {
  final String id;
  final String title;
  final String? description;
  final ReportType type;
  final String organizationId;
  final String? generatedBy;
  final DateTime generatedAt;
  final DateTime? startDate;
  final DateTime? endDate;
  final Map<String, dynamic> parameters;
  final ReportFormat format;
  final String? downloadUrl;
  final int? fileSize;
  final Map<String, dynamic>? summary;

  Report({
    required this.id,
    required this.title,
    this.description,
    required this.type,
    required this.organizationId,
    this.generatedBy,
    required this.generatedAt,
    this.startDate,
    this.endDate,
    this.parameters = const {},
    this.format = ReportFormat.pdf,
    this.downloadUrl,
    this.fileSize,
    this.summary,
  });

  factory Report.fromJson(Map<String, dynamic> json) {
    return Report(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      type: _parseReportType(json['type']),
      organizationId: json['organizationId'],
      generatedBy: json['generatedBy'],
      generatedAt: DateTime.parse(json['generatedAt']),
      startDate: json['startDate'] != null 
        ? DateTime.parse(json['startDate']) 
        : null,
      endDate: json['endDate'] != null 
        ? DateTime.parse(json['endDate']) 
        : null,
      parameters: Map<String, dynamic>.from(json['parameters'] ?? {}),
      format: _parseReportFormat(json['format']),
      downloadUrl: json['downloadUrl'],
      fileSize: json['fileSize'],
      summary: json['summary'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'type': _reportTypeToString(type),
      'organizationId': organizationId,
      'generatedBy': generatedBy,
      'generatedAt': generatedAt.toIso8601String(),
      'startDate': startDate?.toIso8601String(),
      'endDate': endDate?.toIso8601String(),
      'parameters': parameters,
      'format': _reportFormatToString(format),
      'downloadUrl': downloadUrl,
      'fileSize': fileSize,
      'summary': summary,
    };
  }

  static ReportType _parseReportType(String type) {
    switch (type) {
      case 'questionnaireSummary': return ReportType.questionnaireSummary;
      case 'expenseSummary': return ReportType.expenseSummary;
      case 'userActivity': return ReportType.userActivity;
      case 'organizationOverview': return ReportType.organizationOverview;
      default: return ReportType.questionnaireSummary;
    }
  }

  static String _reportTypeToString(ReportType type) {
    return type.toString().split('.').last;
  }

  static ReportFormat _parseReportFormat(String format) {
    switch (format) {
      case 'pdf': return ReportFormat.pdf;
      case 'excel': return ReportFormat.excel;
      case 'csv': return ReportFormat.csv;
      case 'json': return ReportFormat.json;
      default: return ReportFormat.pdf;
    }
  }

  static String _reportFormatToString(ReportFormat format) {
    return format.toString().split('.').last;
  }
}