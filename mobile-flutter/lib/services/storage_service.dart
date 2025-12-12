import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  late SharedPreferences _preferences;

  Future<void> init() async {
    _preferences = await SharedPreferences.getInstance();
  }

  // Secure storage (for tokens, etc.)
  Future<void> setSecure(String key, String value) async {
    await _secureStorage.write(key: key, value: value);
  }

  Future<String?> getSecure(String key) async {
    return await _secureStorage.read(key: key);
  }

  Future<void> deleteSecure(String key) async {
    await _secureStorage.delete(key: key);
  }

  // Shared preferences (for non-sensitive data)
  Future<void> setString(String key, String value) async {
    await _preferences.setString(key, value);
  }

  Future<String?> getString(String key) async {
    return _preferences.getString(key);
  }

  Future<void> setBool(String key, bool value) async {
    await _preferences.setBool(key, value);
  }

  Future<bool?> getBool(String key) async {
    return _preferences.getBool(key);
  }

  Future<void> setInt(String key, int value) async {
    await _preferences.setInt(key, value);
  }

  Future<int?> getInt(String key) async {
    return _preferences.getInt(key);
  }

  Future<void> setDouble(String key, double value) async {
    await _preferences.setDouble(key, value);
  }

  Future<double?> getDouble(String key) async {
    return _preferences.getDouble(key);
  }

  Future<void> setStringList(String key, List<String> value) async {
    await _preferences.setStringList(key, value);
  }

  Future<List<String>?> getStringList(String key) async {
    return _preferences.getStringList(key);
  }

  // JSON storage
  Future<void> setJson(String key, Map<String, dynamic> json) async {
    final String jsonString = jsonEncode(json);
    await setString(key, jsonString);
  }

  Future<Map<String, dynamic>?> getJson(String key) async {
    final String? jsonString = await getString(key);
    if (jsonString != null) {
      return jsonDecode(jsonString);
    }
    return null;
  }

  // Clear all storage
  Future<void> clearAll() async {
    await _secureStorage.deleteAll();
    await _preferences.clear();
  }

  // Check if key exists
  Future<bool> containsKey(String key) async {
    return _preferences.containsKey(key);
  }

  // Remove specific key
  Future<void> remove(String key) async {
    await _preferences.remove(key);
    await _secureStorage.delete(key: key);
  }
}