import 'package:flutter/foundation.dart';

enum ExpenseCategory {
  travel,
  meals,
  equipment,
  software,
  office,
  training,
  other
}

enum ExpenseStatus {
  pending,
  approved,
  rejected,
  paid
}

class Expense {
  final String id;
  final String userId;
  final String organizationId;
  final String title;
  final String description;
  final double amount;
  final ExpenseCategory category;
  final ExpenseStatus status;
  final DateTime date;
  final DateTime createdAt;
  final List<String>? attachments;
  final String? rejectedReason;
  final String? approvedBy;
  final DateTime? approvedAt;
  final String? paidBy;
  final DateTime? paidAt;

  Expense({
    required this.id,
    required this.userId,
    required this.organizationId,
    required this.title,
    required this.description,
    required this.amount,
    required this.category,
    required this.status,
    required this.date,
    required this.createdAt,
    this.attachments,
    this.rejectedReason,
    this.approvedBy,
    this.approvedAt,
    this.paidBy,
    this.paidAt,
  });

  factory Expense.fromJson(Map<String, dynamic> json) {
    return Expense(
      id: json['id'],
      userId: json['userId'],
      organizationId: json['organizationId'],
      title: json['title'],
      description: json['description'],
      amount: (json['amount'] as num).toDouble(),
      category: _parseExpenseCategory(json['category']),
      status: _parseExpenseStatus(json['status']),
      date: DateTime.parse(json['date']),
      createdAt: DateTime.parse(json['createdAt']),
      attachments: json['attachments'] != null 
        ? List<String>.from(json['attachments']) 
        : null,
      rejectedReason: json['rejectedReason'],
      approvedBy: json['approvedBy'],
      approvedAt: json['approvedAt'] != null 
        ? DateTime.parse(json['approvedAt']) 
        : null,
      paidBy: json['paidBy'],
      paidAt: json['paidAt'] != null 
        ? DateTime.parse(json['paidAt']) 
        : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'organizationId': organizationId,
      'title': title,
      'description': description,
      'amount': amount,
      'category': _expenseCategoryToString(category),
      'status': _expenseStatusToString(status),
      'date': date.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'attachments': attachments,
      'rejectedReason': rejectedReason,
      'approvedBy': approvedBy,
      'approvedAt': approvedAt?.toIso8601String(),
      'paidBy': paidBy,
      'paidAt': paidAt?.toIso8601String(),
    };
  }

  static ExpenseCategory _parseExpenseCategory(String category) {
    switch (category) {
      case 'travel': return ExpenseCategory.travel;
      case 'meals': return ExpenseCategory.meals;
      case 'equipment': return ExpenseCategory.equipment;
      case 'software': return ExpenseCategory.software;
      case 'office': return ExpenseCategory.office;
      case 'training': return ExpenseCategory.training;
      default: return ExpenseCategory.other;
    }
  }

  static String _expenseCategoryToString(ExpenseCategory category) {
    return category.toString().split('.').last;
  }

  static ExpenseStatus _parseExpenseStatus(String status) {
    switch (status) {
      case 'pending': return ExpenseStatus.pending;
      case 'approved': return ExpenseStatus.approved;
      case 'rejected': return ExpenseStatus.rejected;
      case 'paid': return ExpenseStatus.paid;
      default: return ExpenseStatus.pending;
    }
  }

  static String _expenseStatusToString(ExpenseStatus status) {
    return status.toString().split('.').last;
  }
}