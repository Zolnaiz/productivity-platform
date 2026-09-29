import 'package:flutter/foundation.dart';

import '../models/project_model.dart';
import '../models/work_log_model.dart';
import '../services/api_service.dart';
import '../services/outbox.dart';

/// Today's record of work, for the person holding the phone.
///
/// The work log was the one thing an operator was asked to do every day and
/// could only do at a desk — so it was written from memory on Friday, or not
/// at all, and the monthly report counted whatever survived.
class WorkLogProvider extends ChangeNotifier {
  WorkLogProvider(this._api, {DateTime Function()? clock, this.outbox})
      : _clock = clock ?? DateTime.now;

  final ApiService _api;
  final Outbox? outbox;

  /// Whether the last entry was kept on the phone rather than sent.
  bool lastKept = false;
  final DateTime Function() _clock;

  List<WorkLog> today = [];
  List<Project> projects = [];
  bool loading = false;
  bool saving = false;
  Object? error;
  Object? projectsError;

  String get day => localDay(_clock());

  double get hoursToday => today.fold(0, (sum, log) => sum + log.hours);

  bool get sessionExpired {
    return _unauthorized(error) || _unauthorized(projectsError);
  }

  bool _unauthorized(Object? error) {
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
    projectsError = null;
    notifyListeners();
    await Future.wait([_loadLogs(), _loadProjects()]);
    loading = false;
    notifyListeners();
  }

  Future<void> _loadLogs() async {
    try {
      final logs = (await _api.getWorkLogs()).map(WorkLog.fromJson);
      final date = day;
      today = logs.where((log) => log.logDate == date).toList();
    } catch (e) {
      error = e;
    }
  }

  Future<void> _loadProjects() async {
    try {
      projects = (await _api.getProjects()).map(Project.fromJson).toList();
    } catch (e) {
      // A missing connection must not discard the last usable choices or
      // prevent a general work log from being written.
      projectsError = e;
    }
  }

  /// Saves one entry. Returns whether it was saved, so the form knows whether
  /// to clear itself: losing what somebody typed because the network dropped
  /// is how people stop typing it.
  Future<bool> submit({
    required String summary,
    required double hours,
    String? taskId,
    String? projectId,
    String? blockers,
    String? nextSteps,
  }) async {
    saving = true;
    error = null;
    lastKept = false;
    notifyListeners();
    final entry = {
      'summary': summary,
      'hours': hours,
      'logDate': day,
      if (taskId != null) 'taskId': taskId,
      if (projectId != null) 'projectId': projectId,
      if (blockers != null && blockers.isNotEmpty) 'blockers': blockers,
      if (nextSteps != null && nextSteps.isNotEmpty) 'nextSteps': nextSteps,
    };
    try {
      final saved = await _api.createDailyWorkLog(entry);
      final raw = saved['workLog'];
      final log =
          WorkLog.fromJson(raw is Map ? raw.cast<String, dynamic>() : saved);
      today = [log, ...today];
      return true;
    } catch (e) {
      if (outbox != null && neverSent(e)) {
        await outbox!.keep(
            method: 'POST',
            path: '/work-logs/daily',
            kind: 'workLog',
            data: entry);
        // On today's list at once, so the hours add up; the server's copy
        // replaces it when the list is read again.
        today = [
          WorkLog.fromJson({'id': 'kept-${outbox!.pending.length}', ...entry}),
          ...today
        ];
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
}
