import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// What a screen last read from the server, and when.
class CachedRead {
  CachedRead(this.data, this.savedAt);
  final List<dynamic> data;
  final DateTime savedAt;
}

/// Whether a read failed for want of a network rather than an answer: no
/// connection, or no reply in time. A refusal (401, 403, 500) has a response
/// and is not shown over with old data.
bool offline(Object error) =>
    error is DioException &&
    error.response == null &&
    error.type != DioExceptionType.cancel;

/// The lists the phone last read, kept on it so the tabs still show
/// something with no signal.
///
/// The outbox already keeps what is written in a basement; this is the
/// other half. Without it, somebody who opens the app where there is no
/// signal sees an error where their tasks and areas should be, and cannot
/// even find the area they came to check. Each screen saves what it reads
/// and, when a read cannot reach the server, shows the saved copy with the
/// time it was read, so nobody takes it for the current state.
///
/// It holds one person's view: it is cleared when they sign out or their
/// session ends, so a phone shared on shift does not show the next person
/// somebody else's work.
class ReadCache {
  ReadCache({Future<SharedPreferences> Function()? prefs})
      : _prefs = prefs ?? SharedPreferences.getInstance;

  final Future<SharedPreferences> Function() _prefs;
  static const _prefix = 'read_cache.';

  Future<void> put(String key, List<dynamic> data, {DateTime? at}) async {
    final prefs = await _prefs();
    await prefs.setString(
        '$_prefix$key',
        jsonEncode({
          'savedAt': (at ?? DateTime.now()).toUtc().toIso8601String(),
          'data': data,
        }));
  }

  Future<CachedRead?> get(String key) async {
    final prefs = await _prefs();
    final raw = prefs.getString('$_prefix$key');
    if (raw == null) return null;
    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      return CachedRead(json['data'] as List<dynamic>,
          DateTime.parse(json['savedAt'] as String).toLocal());
    } catch (_) {
      // A copy written by an older app, or cut short: as good as none.
      return null;
    }
  }

  Future<void> clear() async {
    final prefs = await _prefs();
    for (final key in prefs.getKeys().where((key) => key.startsWith(_prefix))) {
      await prefs.remove(key);
    }
  }
}

/// Reads through the cache: fresh from the server when it answers, saved
/// for next time; the saved copy when the phone is offline. Returns the
/// data and, for a saved copy, when it was read. Rethrows when the server
/// refused, or when there is nothing saved to fall back on.
Future<(List<dynamic>, DateTime?)> readThrough(
    ReadCache? cache, String key, Future<List<dynamic>> Function() read) async {
  try {
    final fresh = await read();
    await cache?.put(key, fresh);
    return (fresh, null);
  } catch (e) {
    final kept = cache == null || !offline(e) ? null : await cache.get(key);
    if (kept == null) rethrow;
    return (kept.data, kept.savedAt);
  }
}
