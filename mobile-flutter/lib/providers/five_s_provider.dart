import 'package:flutter/foundation.dart';

import '../models/five_s_model.dart';
import '../services/api_service.dart';

/// The 5S walk on the phone: the areas to check and the checklists to check
/// them against.
///
/// The daily check is the operator's, and the operator is on the floor with a
/// phone, not at a desk. Until this, the check could be walked only in a
/// browser, so it was walked from memory afterwards or not at all.
class FiveSProvider extends ChangeNotifier {
  FiveSProvider(this._api);
  final ApiService _api;

  List<FiveSPlan> plans = [];
  List<AuditTemplate> templates = [];
  bool loading = false;
  bool saving = false;
  Object? error;

  bool get sessionExpired {
    try {
      final dynamic failure = error;
      return failure.response?.statusCode == 401;
    } catch (_) {
      return false;
    }
  }

  Future<void> load() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      final results =
          await Future.wait([_api.getFiveSPlans(), _api.getAuditTemplates()]);
      plans = results[0].map(FiveSPlan.fromJson).toList();
      // Only the 5S checklists that are in use: a retired checklist is kept
      // for the runs made against it, not for new ones.
      templates = results[1]
          .map(AuditTemplate.fromJson)
          .where((template) => template.isActive && template.category == '5s')
          .toList();
    } catch (e) {
      error = e;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  /// Records the walk. Returns the score it was recorded with, or null when it
  /// was not saved, so the answers stay on screen to be sent again.
  Future<int?> submit({
    required FiveSZone zone,
    required AuditTemplate template,
    required AuditAnswers answers,
    AuditTier? tier,
  }) async {
    final score = scoreAnswers(template, answers);
    saving = true;
    error = null;
    notifyListeners();
    try {
      await _api.createAuditRun({
        'templateId': template.id,
        'zoneId': zone.id,
        if (tier != null) 'tier': tier.tier,
        'location': zone.location,
        'score': score,
        'status': 'submitted',
        'answers': answersForRun(template, answers),
      });
      // The area's score has moved on the server; read it back rather than
      // guess at how the server rounds and stores it.
      saving = false;
      await load();
      return score;
    } catch (e) {
      error = e;
      return null;
    } finally {
      saving = false;
      notifyListeners();
    }
  }
}
