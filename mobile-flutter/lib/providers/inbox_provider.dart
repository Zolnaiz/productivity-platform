import 'package:flutter/foundation.dart';

import '../services/api_service.dart';

/// Something the person was told: work given to them, or the morning's
/// reminder of what is due and late.
class InboxItem {
  const InboxItem({
    required this.id,
    required this.title,
    this.titleKey,
    this.titleParams = const {},
    this.body = '',
    this.read = false,
    this.createdAt,
  });

  final String id;
  final String title;
  final String? titleKey;
  final Map<String, dynamic> titleParams;
  final String body;
  final bool read;
  final DateTime? createdAt;

  factory InboxItem.fromJson(Map<String, dynamic> json) => InboxItem(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        titleKey: json['titleKey'] as String?,
        titleParams:
            (json['titleParams'] as Map?)?.cast<String, dynamic>() ?? const {},
        body: json['body'] as String? ?? '',
        read: json['readAt'] != null,
        createdAt: DateTime.tryParse(json['createdAt'] as String? ?? ''),
      );

  InboxItem markedRead() => InboxItem(
        id: id,
        title: title,
        titleKey: titleKey,
        titleParams: titleParams,
        body: body,
        read: true,
        createdAt: createdAt,
      );
}

/// The person's inbox on the phone.
///
/// The server already told people — the morning reminder, a task given to
/// them — but only a browser could read it, and the people most in need of
/// being told are the ones on the floor without one.
class InboxProvider extends ChangeNotifier {
  InboxProvider(this._api);
  final ApiService _api;

  List<InboxItem> items = [];
  bool loading = false;
  Object? error;

  int get unread => items.where((item) => !item.read).length;

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
      items = (await _api.getNotifications())
          .cast<Map>()
          .map((item) => InboxItem.fromJson(item.cast<String, dynamic>()))
          .toList();
    } catch (e) {
      error = e;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  /// Marks one read on screen at once, and puts it back if the server says no:
  /// an item that looks read and is not would never be seen again.
  Future<void> markRead(InboxItem item) async {
    if (item.read) return;
    final before = items;
    items = [for (final each in items) each.id == item.id ? each.markedRead() : each];
    notifyListeners();
    try {
      await _api.markNotificationAsRead(item.id);
    } catch (e) {
      items = before;
      error = e;
      notifyListeners();
    }
  }
}
