import 'dart:async';
import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api_service.dart';

/// One change made on the phone that has not reached the server yet.
class PendingWrite {
  const PendingWrite({
    required this.id,
    required this.method,
    required this.path,
    required this.kind,
    this.data,
    required this.createdAt,
  });

  final String id;
  final String method;
  final String path;

  /// What it is, for the person: an audit, a red tag, a day's write-up.
  final String kind;
  final Map<String, dynamic>? data;
  final DateTime createdAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'method': method,
        'path': path,
        'kind': kind,
        'data': data,
        'createdAt': createdAt.toIso8601String(),
      };

  factory PendingWrite.fromJson(Map<String, dynamic> json) => PendingWrite(
        id: json['id'] as String,
        method: json['method'] as String,
        path: json['path'] as String,
        kind: json['kind'] as String? ?? 'change',
        data: (json['data'] as Map?)?.cast<String, dynamic>(),
        createdAt:
            DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      );
}

/// Whether a request failed without ever reaching the server: no network,
/// or the connection refused. Only these are safe to send again later. A
/// timeout may have been recorded before the answer was lost, and sending
/// it twice would count an audit twice.
bool neverSent(Object error) =>
    error is DioException &&
    error.response == null &&
    error.type == DioExceptionType.connectionError;

/// Changes kept on the phone until the server can take them.
///
/// A workshop floor, a warehouse, a basement stores: the places 5S is done
/// are the places the signal drops. An audit walked there failed to send and
/// was lost with the screen - which is why SafetyCulture, Alpha TransForm and
/// Beekeeper all let a form be finished offline. A change that could not
/// leave the phone is kept here, in the order it was made, and sent when the
/// network is back, when the app is opened again, or when the person asks.
class Outbox extends ChangeNotifier {
  Outbox(this._api, {Future<SharedPreferences> Function()? prefs})
      : _prefs = prefs ?? SharedPreferences.getInstance;

  static const _key = 'outbox';

  final ApiService _api;
  final Future<SharedPreferences> Function() _prefs;
  StreamSubscription<List<ConnectivityResult>>? _connectivity;

  List<PendingWrite> pending = [];
  bool sending = false;

  /// How many kept changes the server refused when they were sent - a tag
  /// on an area deleted in the meantime, say. Said once, then cleared.
  int refused = 0;

  Future<void> restore() async {
    final prefs = await _prefs();
    final raw = prefs.getString(_key);
    if (raw == null) return;
    try {
      pending = (json.decode(raw) as List)
          .cast<Map>()
          .map((item) => PendingWrite.fromJson(item.cast<String, dynamic>()))
          .toList();
    } catch (_) {
      pending = [];
    }
    notifyListeners();
  }

  /// Sends what is kept whenever the phone comes back online.
  void start() {
    _connectivity ??= Connectivity().onConnectivityChanged.listen((results) {
      if (results.any((result) => result != ConnectivityResult.none)) flush();
    });
  }

  @override
  void dispose() {
    _connectivity?.cancel();
    super.dispose();
  }

  Future<void> _save() async {
    final prefs = await _prefs();
    await prefs.setString(
        _key, json.encode(pending.map((item) => item.toJson()).toList()));
  }

  Future<void> keep(
      {required String method,
      required String path,
      required String kind,
      Map<String, dynamic>? data}) async {
    pending = [
      ...pending,
      PendingWrite(
        id: '${DateTime.now().microsecondsSinceEpoch}-${pending.length}',
        method: method,
        path: path,
        kind: kind,
        data: data,
        createdAt: DateTime.now(),
      ),
    ];
    await _save();
    notifyListeners();
  }

  /// Sends what is kept, oldest first, and stops at the first that still
  /// cannot get through, so the order they were made in is kept. Returns how
  /// many reached the server.
  Future<int> flush() async {
    if (sending || pending.isEmpty) return 0;
    sending = true;
    notifyListeners();
    var sent = 0;
    try {
      while (pending.isNotEmpty) {
        final next = pending.first;
        try {
          await _api.send(next.method, next.path, next.data);
          sent++;
        } on DioException catch (error) {
          final status = error.response?.statusCode;
          // Still offline, the server failing, or the session over: keep it
          // and try again later.
          if (status == null || status >= 500 || status == 401) break;
          // Refused for what it says: sending it again would be refused again.
          refused++;
        }
        pending = pending.sublist(1);
        await _save();
        notifyListeners();
      }
    } finally {
      sending = false;
      notifyListeners();
    }
    return sent;
  }

  void acknowledgeRefused() {
    refused = 0;
    notifyListeners();
  }
}
