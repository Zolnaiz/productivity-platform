import 'dart:async';
import 'dart:convert';
import 'dart:math';

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
    String? key,
    this.owner,
  }) : key = key ?? id;

  final String id;

  /// The id of the person who made it. A phone handed between shifts may
  /// hold several people's changes, and only the session of the one who made
  /// a change sends it, so one worker's audit never reaches the server under
  /// another's name. Null on changes kept before this was recorded; those go
  /// with whoever is signed in, as they always did.
  final String? owner;

  /// Sent as `Idempotency-Key`, so the server writes it once however many
  /// times it is sent.
  final String key;
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
        'key': key,
        'owner': owner,
      };

  factory PendingWrite.fromJson(Map<String, dynamic> json) => PendingWrite(
        id: json['id'] as String,
        method: json['method'] as String,
        path: json['path'] as String,
        kind: json['kind'] as String? ?? 'change',
        data: (json['data'] as Map?)?.cast<String, dynamic>(),
        createdAt:
            DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
        key: json['key'] as String?,
        owner: json['owner'] as String?,
      );
}

/// Whether a change can be kept and sent again: no answer came back.
///
/// The phone cannot tell whether such a change reached the server. Dio calls
/// a line that dropped after the request went out a "connection error", the
/// same as no signal at all, so a rule that kept only changes "never sent"
/// kept changes the server had already saved; sent again later, they were
/// saved twice (test/network_drop_live_test.dart shows it on a real server).
/// So a change is kept whenever its answer is missing, and every POST that
/// can be kept carries its `Idempotency-Key` from the first try: the server
/// writes a key once, and a second copy of a saved change gets the first
/// answer back. A PATCH or PUT sets a value, which arriving twice does not
/// change.
bool unanswered(Object error) =>
    error is DioException && error.response == null && error.type != DioExceptionType.cancel;

/// The API's error code in a refusal, wherever its error filter put it.
String? errorCodeOf(DioException error) {
  final body = error.response?.data;
  if (body is! Map) return null;
  final nested = body['error'];
  return (body['errorCode'] ?? (nested is Map ? nested['errorCode'] : null))
      as String?;
}

final _random = Random.secure();

/// A fresh `Idempotency-Key`: the moment and 64 random bits.
String newIdempotencyKey() =>
    '${DateTime.now().microsecondsSinceEpoch.toRadixString(36)}-'
    '${_random.nextInt(1 << 32).toRadixString(36)}${_random.nextInt(1 << 32).toRadixString(36)}';

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

  /// Every kept change, everyone's, in the order they were made. What the
  /// signed-in person can send is [ownPending].
  List<PendingWrite> pending = [];
  bool sending = false;

  /// The id of the person signed in, as [AuthProvider] last said through
  /// [signedIn]. Null while nobody is.
  String? _owner;

  /// The kept changes the signed-in person can send: their own, and any kept
  /// before owners were recorded. What the home screen counts.
  List<PendingWrite> get ownPending => pending.where(_isOwn).toList();

  bool _isOwn(PendingWrite item) => item.owner == null || item.owner == _owner;

  PendingWrite? _firstOwn() {
    for (final item in pending) {
      if (_isOwn(item)) return item;
    }
    return null;
  }

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

  /// Counts each return of the network, after what was kept has been sent.
  /// The home screen listens: tabs that read a kept copy while offline read
  /// again, so their lists show the server's records and the banner saying
  /// the phone is offline goes. Sending alone left both until the app was
  /// next brought back to the front (seen on an emulator, 11.14).
  final reconnected = ValueNotifier<int>(0);

  /// Sends what is kept whenever the phone comes back online.
  void start() {
    _connectivity ??= Connectivity().onConnectivityChanged.listen((results) {
      if (results.any((result) => result != ConnectivityResult.none)) {
        _backOnline();
      }
    });
  }

  Future<void> _backOnline() async {
    await flush();
    reconnected.value++;
  }

  @override
  void dispose() {
    _connectivity?.cancel();
    reconnected.dispose();
    super.dispose();
  }

  /// Told by [AuthProvider] whenever who is signed in changes: an id on
  /// sign-in or when a session is read back at start-up, null on sign-out or
  /// when the session expires. Someone signing in may have changes kept from
  /// before, so theirs are sent straight away. Returns how many reached the
  /// server, for whoever wants to wait for it; the provider does not.
  Future<int> signedIn(String? userId) async {
    if (userId == _owner) return 0;
    _owner = userId;
    notifyListeners();
    if (userId == null) return 0;
    return flush();
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
      Map<String, dynamic>? data,
      String? key}) async {
    pending = [
      ...pending,
      PendingWrite(
        id: '${DateTime.now().microsecondsSinceEpoch}-${pending.length}',
        method: method,
        path: path,
        kind: kind,
        data: data,
        createdAt: DateTime.now(),
        key: key ?? newIdempotencyKey(),
        owner: _owner,
      ),
    ];
    await _save();
    notifyListeners();
  }

  /// Sends the signed-in person's kept changes, oldest first, and stops at
  /// the first that still cannot get through, so the order they were made in
  /// is kept. Other people's stay where they are until their owner signs in.
  /// Returns how many reached the server.
  ///
  /// Asked while a send is already going - the network back and the app
  /// brought to the front at once - it waits for that send and returns its
  /// count, so whoever reads the lists next reads them with the change in.
  Future<int> flush() => _flushing ??= _flush().whenComplete(() => _flushing = null);

  Future<int>? _flushing;

  Future<int> _flush() async {
    if (_firstOwn() == null) return 0;
    sending = true;
    notifyListeners();
    var sent = 0;
    try {
      while (true) {
        final next = _firstOwn();
        if (next == null) break;
        try {
          await _api.send(next.method, next.path, next.data,
              idempotencyKey: next.key);
          sent++;
        } on DioException catch (error) {
          final status = error.response?.statusCode;
          // Still offline, the server failing, the session over, or the
          // first copy of it still being saved: keep it and try again later.
          if (status == null ||
              status >= 500 ||
              status == 401 ||
              errorCodeOf(error) == 'REQUEST_IN_PROGRESS') {
            break;
          }
          // Refused for what it says: sending it again would be refused again.
          refused++;
        }
        pending = List.of(pending)..remove(next);
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
