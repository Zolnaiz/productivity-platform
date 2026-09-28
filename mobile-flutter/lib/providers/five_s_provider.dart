import 'package:flutter/foundation.dart';

import '../models/five_s_model.dart';
import '../services/api_service.dart';
import '../services/outbox.dart';

/// The 5S walk on the phone: the areas to check and the checklists to check
/// them against.
///
/// The daily check is the operator's, and the operator is on the floor with a
/// phone, not at a desk. Until this, the check could be walked only in a
/// browser, so it was walked from memory afterwards or not at all.
class FiveSProvider extends ChangeNotifier {
  FiveSProvider(this._api, {this.outbox});
  final ApiService _api;

  /// Where a change goes when the phone is offline. Without one, an
  /// offline change fails as any other would.
  final Outbox? outbox;

  /// Whether the last change was kept on the phone rather than sent.
  bool lastKept = false;

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

  /// The plan and area as last read, found again after a reload.
  (FiveSPlan, FiveSZone)? find(String planId, String zoneId) {
    for (final plan in plans) {
      if (plan.id != planId) continue;
      for (final zone in plan.zones) {
        if (zone.id == zoneId) return (plan, zone);
      }
    }
    return null;
  }

  /// How many photographs each red tag has, by the tag's id.
  final Map<String, int> photoCounts = {};

  /// Reads how many photographs these tags have. Quietly: the counts are a
  /// courtesy, and a tag without one still shows.
  Future<void> loadPhotoCounts(List<FiveSRedTag> redTags) async {
    for (final redTag in redTags) {
      try {
        final files = await _api.getAttachments('five_s_red_tag', redTag.id);
        photoCounts[redTag.id] = files.length;
      } catch (_) {
        // Left as it was.
      }
    }
    notifyListeners();
  }

  /// Attaches a photograph of the tagged item, as it was found. Returns
  /// whether it was saved.
  Future<bool> addRedTagPhoto(FiveSRedTag redTag,
      {required List<int> bytes, required String fileName}) async {
    saving = true;
    error = null;
    notifyListeners();
    try {
      await _api.uploadAttachment(
          ownerType: 'five_s_red_tag',
          ownerId: redTag.id,
          kind: 'before',
          bytes: bytes,
          fileName: fileName);
      photoCounts[redTag.id] = (photoCounts[redTag.id] ?? 0) + 1;
      return true;
    } catch (e) {
      error = e;
      return false;
    } finally {
      saving = false;
      notifyListeners();
    }
  }

  /// Tags something in an area. Returns whether it was saved.
  Future<bool> addRedTag(FiveSPlan plan, FiveSZone zone,
      {required String title, String disposition = ''}) async {
    final body = {
      'title': title,
      if (disposition.isNotEmpty) 'disposition': disposition,
    };
    return _write(() => _api.addRedTag(plan.id, zone.id, body),
        kind: 'redTag',
        path: '/five-s-layouts/${plan.id}/zones/${zone.id}/red-tags',
        data: body);
  }

  /// Records that an area was cleaned today. Returns whether it was saved.
  Future<bool> markCleaned(FiveSPlan plan, FiveSZone zone) =>
      _write(() => _api.markZoneCleaned(plan.id, zone.id),
          kind: 'cleaned',
          path: '/five-s-layouts/${plan.id}/zones/${zone.id}/cleaned');

  /// Sends one change, then reads the plans again rather than guess at what
  /// the server made of it.
  Future<bool> _write(Future<Object?> Function() send,
      {required String kind,
      required String path,
      Map<String, dynamic>? data}) async {
    saving = true;
    error = null;
    lastKept = false;
    notifyListeners();
    try {
      await send();
      saving = false;
      await load();
      return true;
    } catch (e) {
      if (outbox != null && neverSent(e)) {
        await outbox!.keep(method: 'POST', path: path, kind: kind, data: data);
        lastKept = true;
        return true;
      }
      error = e;
      return false;
    } finally {
      saving = false;
      notifyListeners();
    }
  }

  /// Records the walk. Returns the score it was recorded with and the run's
  /// id, or null when it was not saved, so the answers stay on screen to be
  /// sent again.
  Future<({int score, String runId})?> submit({
    required FiveSZone zone,
    required AuditTemplate template,
    required AuditAnswers answers,
    AuditTier? tier,
  }) async {
    final score = scoreAnswers(template, answers);
    saving = true;
    error = null;
    lastKept = false;
    notifyListeners();
    final body = {
      'templateId': template.id,
      'zoneId': zone.id,
      if (tier != null) 'tier': tier.tier,
      'location': zone.location,
      'score': score,
      'status': 'submitted',
      'answers': answersForRun(template, answers),
    };
    try {
      final run = await _api.createAuditRun(body);
      // The area's score has moved on the server; read it back rather than
      // guess at how the server rounds and stores it.
      saving = false;
      await load();
      return (score: score, runId: run['id'] as String? ?? '');
    } catch (e) {
      // Walked where there is no signal: kept, and sent once there is. No run
      // id yet, so no photographs of the shortfalls until then.
      if (outbox != null && neverSent(e)) {
        await outbox!
            .keep(method: 'POST', path: '/audit-runs', kind: 'audit', data: body);
        lastKept = true;
        return (score: score, runId: '');
      }
      error = e;
      return null;
    } finally {
      saving = false;
      notifyListeners();
    }
  }

  /// How many photographs each question of a run has, by the question's id.
  final Map<String, int> shortfallPhotoCounts = {};

  /// Attaches a photograph of what one question of a run fell short on.
  Future<bool> addShortfallPhoto(String runId, AuditQuestion question,
      {required List<int> bytes, required String fileName}) async {
    saving = true;
    error = null;
    notifyListeners();
    try {
      await _api.uploadAttachment(
          ownerType: 'audit_run',
          ownerId: runId,
          part: question.id,
          bytes: bytes,
          fileName: fileName);
      shortfallPhotoCounts[question.id] =
          (shortfallPhotoCounts[question.id] ?? 0) + 1;
      return true;
    } catch (e) {
      error = e;
      return false;
    } finally {
      saving = false;
      notifyListeners();
    }
  }
}
