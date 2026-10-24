import 'package:flutter/foundation.dart';

import '../models/task_model.dart';
import '../services/api_service.dart';
import '../services/outbox.dart';
import '../services/read_cache.dart';

class TaskProvider extends ChangeNotifier {
  TaskProvider(this._api, {this.outbox, this.cache});
  final ApiService _api;
  final Outbox? outbox;

  /// Where the list is kept for when the phone is offline.
  final ReadCache? cache;

  /// When the list on screen was read, while the phone cannot reach the
  /// server and shows the copy it kept; null when it is fresh.
  DateTime? offlineSince;

  /// The connection this screen's work goes through, for the account actions beside it.
  ApiService get api => _api;
  List<Task> tasks = [];
  bool loading = false;
  Object? error;
  bool get sessionExpired {
    try {
      final dynamic failure = error;
      return failure.response?.statusCode == 401;
    } catch (_) {
      return false;
    }
  }

  Future<void> load({required String? assigneeId}) async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      // The API scopes this endpoint to an organization, so keep other people's
      // work out of an operator's list - and out of what the phone keeps -
      // on a phone they may share on shift.
      final (mine, savedAt) = await readThrough(cache, 'tasks', () async {
        if (assigneeId == null) return [];
        return (await _api.getTasks())
            .where((task) => task['assigneeId'] == assigneeId)
            .toList();
      });
      tasks = [
        for (final task in mine) Task.fromJson(Map<String, dynamic>.from(task as Map))
      ];
      offlineSince = savedAt;
    } catch (e) {
      error = e;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> changeStatus(Task task, String status) async {
    final before = tasks;
    tasks = [
      for (final item in tasks)
        item.id == task.id ? item.copyWith(status: status) : item
    ];
    notifyListeners();
    try {
      final updated = await _api.updateTask(task.id, {'status': status});
      tasks = [
        for (final item in tasks)
          item.id == task.id ? Task.fromJson(updated) : item
      ];
      error = null;
    } catch (e) {
      if (outbox != null && neverSent(e)) {
        // Moved on screen and kept: it goes to the server with the network.
        await outbox!.keep(
            method: 'PATCH',
            path: '/tasks/${task.id}',
            kind: 'task',
            data: {'status': status});
        error = null;
      } else {
        tasks = before;
        error = e;
      }
    }
    notifyListeners();
  }
}
