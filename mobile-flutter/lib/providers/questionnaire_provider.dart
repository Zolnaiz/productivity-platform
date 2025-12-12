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
      _questionnaires = await _apiService.getQuestionnaires();
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
      return await _apiService.getQuestionnaireById(id);
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
      await _apiService.submitQuestionnaireResponse(
        questionnaireId: questionnaireId,
        answers: answers,
        completionTime: completionTime,
      );
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