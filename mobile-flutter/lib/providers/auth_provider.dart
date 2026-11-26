// Sign-in state: signs in/out and restores the session at start-up. When the signed-in person changes, the read
// cache is emptied (one person's view only); the outbox is kept, because each change waits for the person who
// made it.

import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/organization_model.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/outbox.dart';
import '../services/read_cache.dart';

class AuthProvider with ChangeNotifier {
  AuthProvider({ApiService? apiService, ReadCache? readCache, Outbox? outbox})
      : _apiService = apiService ?? ApiService(),
        _readCache = readCache ?? ReadCache(),
        _outbox = outbox {
    // Every change to who is signed in - session read back, sign-in,
    // sign-out, expiry - ends in notifyListeners, so listening
    // to itself tells the outbox about each of them, and about any added
    // later, without every one of those having to remember to.
    addListener(_tellOutboxWhoIsSignedIn);
    _prefsFuture.then(_loadUserFromStorage);
  }
  final ApiService _apiService;

  /// What the tabs kept for offline reading: one person's view, emptied
  /// whenever who is signed in changes.
  final ReadCache _readCache;

  /// Changes made offline and not yet sent. Unlike the read cache they are
  /// not emptied on sign-out - that would lose an audit walked with no
  /// signal - but each belongs to whoever made it and waits for them.
  final Outbox? _outbox;

  void _tellOutboxWhoIsSignedIn() =>
      _outbox?.signedIn(_isAuthenticated ? _user?.id : null);
  final Future<SharedPreferences> _prefsFuture =
      SharedPreferences.getInstance();

  User? _user;
  Organization? _organization;
  bool _isLoading = true;
  bool _isRestoring = true;
  bool _isAuthenticated = false;
  String? _error;

  User? get user => _user;
  Organization? get organization => _organization;
  bool get isLoading => _isLoading;

  /// Only the session being read back when the app starts. Signing in is
  /// [isLoading] alone: the router used to send the sign-in screen to the
  /// splash while it waited, so a wrong password came back to an empty form
  /// with its message lost, and the app looked stuck.
  bool get isRestoring => _isRestoring;
  bool get isAuthenticated => _isAuthenticated;
  String? get error => _error;

  Future<void> _loadUserFromStorage(SharedPreferences prefs) async {
    try {
      final userString = prefs.getString('user');

      if (userString != null) {
        final userData = json.decode(userString) as Map<String, dynamic>;
        _user = User.fromJson(userData);

        if (userData['organization'] != null) {
          _organization = Organization.fromJson(
            userData['organization'] as Map<String, dynamic>,
          );
        }

        _isAuthenticated = true;
        debugPrint('User session restored from storage');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Error loading user from storage: $e');
      }
    } finally {
      _isLoading = false;
      _isRestoring = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _apiService.login(email, password);
      // Whatever an earlier session left for offline reading is not this one's.
      await _readCache.clear();

      _user = User.fromJson(result['user'] as Map<String, dynamic>);
      _organization = result['user']['organization'] != null
          ? Organization.fromJson(
              result['user']['organization'] as Map<String, dynamic>,
            )
          : null;
      _isAuthenticated = true;

      final prefs = await _prefsFuture;
      await prefs.setString('user', json.encode(result['user']));
      debugPrint('Login session restored');

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      try {
        final dynamic failure = e;
        final data = failure.response?.data;
        _error = data is Map && data['errorCode'] is String
            ? 'error.${data['errorCode']}'
            : failure.response == null
                ? 'error.offline'
                : 'error.unknown';
      } catch (_) {
        _error = 'error.unknown';
      }
      debugPrint('Login failed');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// The API this phone signs in to, shown on the sign-in screen.
  String get serverAddress => _apiService.serverAddress;

  /// Switches to another organization's server before signing in; see
  /// [ApiService.useServer], which checks it and throws [ServerUnreachable]
  /// when nothing answers there.
  ///
  /// Changes waiting in the outbox stay where they are. Each carries the id
  /// of the person who made it, issued by the server they made it on, so a
  /// person signing in to another server cannot send them there.
  Future<void> useServer(String address) async {
    await _apiService.useServer(address);
    notifyListeners();
  }

  // There is no sign-up on the phone. An organization is created on the web
  // (/register) and its people join through an invitation accepted on the
  // web; the phone only signs them in. A sign-up here would also make Play
  // require account deletion inside the app.

  Future<void> logout() async {
    try {
      debugPrint('Logging out');
      await _apiService.logout();
    } catch (e) {
      debugPrint('Logout error: $e');
    } finally {
      _user = null;
      _organization = null;
      _isAuthenticated = false;
      _error = null;

      final prefs = await _prefsFuture;
      await prefs.remove('user');
      await _readCache.clear();
      debugPrint('User logged out successfully');

      notifyListeners();
    }
  }

  Future<void> expireSession() async {
    _user = null;
    _organization = null;
    _isAuthenticated = false;
    _error = 'error.AUTH_SESSION_EXPIRED';
    final prefs = await _prefsFuture;
    await prefs.remove('user');
    await _readCache.clear();
    notifyListeners();
  }

  // No refreshUser either. One stood here that nothing called, and it signed
  // the person out on any failure - an offline phone included, in an app
  // built to keep working offline. The phone reads only the id and role of
  // the signed-in person, which a profile edit does not change; a session
  // the server has ended is handled by expireSession.

  // Profile and password changes are not made here. The profile screen
  // (screens/profile_screen.dart) sends them straight to the server through
  // ApiService.updateProfile and ApiService.changePassword, and ApiService
  // keeps the new tokens a password change answers with. Stand-ins that only
  // waited and reported success used to sit here; nothing called them, and a
  // password "changed" that way would have stayed the old one.

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Map<String, dynamic> toJson() {
    return {
      'user': _user?.toJson(),
      'organization': _organization?.toJson(),
      'isAuthenticated': _isAuthenticated,
    };
  }

  Future<void> fromJson(Map<String, dynamic> value) async {
    try {
      if (value['user'] != null) {
        _user = User.fromJson(value['user'] as Map<String, dynamic>);
      }

      if (value['organization'] != null) {
        _organization = Organization.fromJson(
          value['organization'] as Map<String, dynamic>,
        );
      }

      _isAuthenticated = value['isAuthenticated'] ?? false;
      _isRestoring = false;

      final prefs = await _prefsFuture;
      await prefs.setString('user', json.encode(value['user']));

      notifyListeners();
    } catch (e) {
      debugPrint('Error restoring auth state: $e');
    }
  }
}
