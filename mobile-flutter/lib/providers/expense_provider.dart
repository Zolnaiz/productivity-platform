import 'package:flutter/foundation.dart';

import '../models/expense_model.dart';
import '../services/api_service.dart';

class ExpenseProvider with ChangeNotifier {
  final ApiService _apiService;

  List<Expense> _expenses = [];
  bool _isLoading = false;
  String? _error;

  List<Expense> get expenses => _expenses;
  bool get isLoading => _isLoading;
  String? get error => _error;

  ExpenseProvider(this._apiService);

  Future<void> fetchExpenses() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final raw = await _apiService.getExpenses();
      _expenses = (raw)
          .map((e) => Expense.fromJson(e as Map<String, dynamic>))
          .toList();
      _error = null;
    } catch (e) {
      _error = e.toString();
      _expenses = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Expense?> fetchExpenseById(String id) async {
    try {
      final raw = await _apiService.getExpenses();
      final found = (raw).cast<Map<String, dynamic>>().firstWhere(
        (m) => m['id'] == id,
        orElse: () => {},
      );
      if (found.isEmpty) return null;
      return Expense.fromJson(found);
    } catch (e) {
      _error = e.toString();
      return null;
    }
  }

  Future<bool> createExpense(Expense expense) async {
    try {
      final created = await _apiService.createExpense(expense.toJson());
      final createdModel = Expense.fromJson(created);
      _expenses.insert(0, createdModel);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    }
  }

  Future<bool> updateExpense(String id, Expense expense) async {
    try {
      final updated = await _apiService.updateExpense(id, expense.toJson());
      final updatedModel = Expense.fromJson(updated);
      final idx = _expenses.indexWhere((e) => e.id == id);
      if (idx != -1) {
        _expenses[idx] = updatedModel;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    }
  }

  Future<bool> deleteExpense(String id) async {
    try {
      await _apiService.deleteExpense(id);
      _expenses.removeWhere((e) => e.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
