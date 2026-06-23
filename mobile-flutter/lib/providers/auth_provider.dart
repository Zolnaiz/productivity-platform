import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/organization_model.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  AuthProvider() {
    _prefsFuture.then(_loadUserFromStorage);
  }
  final ApiService _apiService = ApiService();
  final Future<SharedPreferences> _prefsFuture =
      SharedPreferences.getInstance();

  User? _user;
  Organization? _organization;
  bool _isLoading = true;
  bool _isAuthenticated = false;
  String? _error;

  User? get user => _user;
  Organization? get organization => _organization;
  bool get isLoading => _isLoading;
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
        print('User loaded from storage: ${_user?.email}');
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error loading user from storage: $e');
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print('Attempting login for: $email');
      final result = await _apiService.login(email, password);

      _user = User.fromJson(result['user'] as Map<String, dynamic>);
      _organization = result['user']['organization'] != null
          ? Organization.fromJson(
              result['user']['organization'] as Map<String, dynamic>,
            )
          : null;
      _isAuthenticated = true;

      final prefs = await _prefsFuture;
      await prefs.setString('user', json.encode(result['user']));
      print('Login successful for: ${_user?.email}');

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      print('Login error: $_error');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String fullName,
    required String organizationCode,
    String? organizationName,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print('Attempting registration for: $email');
      final result = await _apiService.register(
        email,
        password,
        fullName,
        organizationCode,
      );

      _user = User.fromJson(result['user'] as Map<String, dynamic>);
      _organization = result['user']['organization'] != null
          ? Organization.fromJson(
              result['user']['organization'] as Map<String, dynamic>,
            )
          : null;
      _isAuthenticated = true;

      final prefs = await _prefsFuture;
      await prefs.setString('user', json.encode(result['user']));
      print('Registration successful for: ${_user?.email}');

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      print('Registration error: $_error');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      print('Logging out user: ${_user?.email}');
      await _apiService.logout();
    } catch (e) {
      print('Logout error: $e');
    } finally {
      _user = null;
      _organization = null;
      _isAuthenticated = false;
      _error = null;

      final prefs = await _prefsFuture;
      await prefs.remove('user');
      print('User logged out successfully');

      notifyListeners();
    }
  }

  Future<void> refreshUser() async {
    try {
      print('Refreshing user data');
      final userData = await _apiService.getCurrentUser();
      _user = User.fromJson(userData);

      if (userData['organization'] != null) {
        _organization = Organization.fromJson(
          userData['organization'] as Map<String, dynamic>,
        );
      }

      final prefs = await _prefsFuture;
      await prefs.setString('user', json.encode(userData));
      print('User data refreshed: ${_user?.email}');

      notifyListeners();
    } catch (e) {
      print('Error refreshing user: $e');
      // If refresh fails, logout the user
      await logout();
    }
  }

  Future<bool> updateProfile(Map<String, dynamic> data) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print('Updating profile for: ${_user?.email}');
      // TODO: Implement profile update API call
      await Future.delayed(const Duration(milliseconds: 500));

      if (data.containsKey('fullName')) {
        _user = _user?.copyWith(fullName: data['fullName']);
      }
      if (data.containsKey('firstName') || data.containsKey('lastName')) {
        final firstName = data['firstName'] ?? _user?.firstName ?? '';
        final lastName = data['lastName'] ?? _user?.lastName ?? '';
        _user = _user?.copyWith(fullName: '$firstName $lastName'.trim());
      }

      if (data.containsKey('phoneNumber') || data.containsKey('phone')) {
        _user = _user?.copyWith(
          phoneNumber: data['phoneNumber'] ?? data['phone'],
        );
      }

      final prefs = await _prefsFuture;
      await prefs.setString('user', json.encode(_user?.toJson()));
      print('Profile updated successfully');

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      print('Profile update error: $_error');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print('Changing password for: ${_user?.email}');
      // TODO: Implement password change API call
      await Future.delayed(const Duration(milliseconds: 500));

      print('Password changed successfully');

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      print('Password change error: $_error');
      _isLoading = false;
      notifyListeners();
    }
  }

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

      final prefs = await _prefsFuture;
      await prefs.setString('user', json.encode(value['user']));

      notifyListeners();
    } catch (e) {
      print('Error restoring auth state: $e');
    }
  }
}
