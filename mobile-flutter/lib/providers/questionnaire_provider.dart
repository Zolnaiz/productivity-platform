import 'package:flutter/foundation.dart';
import '../models/questionnaire_model.dart';
import '../services/api_service.dart';

class QuestionnaireProvider with ChangeNotifier {
  final ApiService _apiService;
  
  List<Questionnaire> _questionnaires = [];
  bool _isLoading = false;
  String? _error;

  List<Questionnaire> get questionnaires => _questionnaires;
  bool get isLoading => _isLoading;
  String? get error => _error;

  QuestionnaireProvider(this._apiService);

  Future<void> fetchQuestionnaires() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final items = await _apiService.getQuestionnaires();
      _questionnaires = items
          .map((item) => Questionnaire.fromJson(item as Map<String, dynamic>))
          .toList();
      _error = null;
    } catch (e) {
      _error = e.toString();
      _questionnaires = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Questionnaire?> fetchQuestionnaireById(String id) async {
    try {
      final item = await _apiService.getQuestionnaire(id);
      return Questionnaire.fromJson(item);
    } catch (e) {
      _error = e.toString();
      return null;
    }
  }

  Future<bool> submitResponse({
    required String questionnaireId,
    required Map<String, dynamic> answers,
    Duration? completionTime,
  }) async {
    try {
      await _apiService.submitResponse(questionnaireId, answers);
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
