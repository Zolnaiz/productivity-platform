import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import '../services/api_service.dart';
import '../models/user_model.dart';
import '../models/organization_model.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final SharedPreferences _prefs;
  
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
  
  AuthProvider() : _prefs = SharedPreferences.getInstance() as SharedPreferences {
    _loadUserFromStorage();
  }
  
  Future<void> _loadUserFromStorage() async {
    try {
      final userString = _prefs.getString('user');
      
      if (userString != null) {
        final userData = json.decode(userString);
        _user = User.fromJson(userData);
        
        if (userData['organization'] != null) {
          _organization = Organization.fromJson(userData['organization']);
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
      
      _user = User.fromJson(result['user']);
      _organization = result['user']['organization'] != null
          ? Organization.fromJson(result['user']['organization'])
          : null;
      _isAuthenticated = true;
      
      await _prefs.setString('user', json.encode(result['user']));
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
      
      _user = User.fromJson(result['user']);
      _organization = result['user']['organization'] != null
          ? Organization.fromJson(result['user']['organization'])
          : null;
      _isAuthenticated = true;
      
      await _prefs.setString('user', json.encode(result['user']));
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
      
      await _prefs.remove('user');
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
        _organization = Organization.fromJson(userData['organization']);
      }
      
      await _prefs.setString('user', json.encode(userData));
      print('User data refreshed: ${_user?.email}');
      
      notifyListeners();
    } catch (e) {
      print('Error refreshing user: $e');
      // If refresh fails, logout the user
      await logout();
    }
  }
  
  Future<void> updateProfile(Map<String, dynamic> data) async {
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
      
      if (data.containsKey('phoneNumber')) {
        _user = _user?.copyWith(phoneNumber: data['phoneNumber']);
      }
      
      await _prefs.setString('user', json.encode(_user?.toJson()));
      print('Profile updated successfully');
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      print('Profile update error: $_error');
      _isLoading = false;
      notifyListeners();
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
  
  Future<void> fromJson(Map<String, dynamic> json) async {
    try {
      if (json['user'] != null) {
        _user = User.fromJson(json['user']);
      }
      
      if (json['organization'] != null) {
        _organization = Organization.fromJson(json['organization']);
      }
      
      _isAuthenticated = json['isAuthenticated'] ?? false;
      
      await _prefs.setString('user', json.encode(json['user']));
      
      notifyListeners();
    } catch (e) {
      print('Error restoring auth state: $e');
    }
  }
}