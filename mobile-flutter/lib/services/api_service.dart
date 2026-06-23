import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late Dio _dio;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  late SharedPreferences _prefs;
  final Connectivity _connectivity = Connectivity();

  String get baseUrl =>
      dotenv.get('API_BASE_URL', fallback: 'http://10.0.2.2:3000/api');

  bool get isDebug => kDebugMode;

  ApiService._internal();

  Future<void> initialize() async {
    _prefs = await SharedPreferences.getInstance();

    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    ));

    // Add request interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Check internet connection
        final connectivityResult = await _connectivity.checkConnectivity();
        if (connectivityResult == ConnectivityResult.none) {
          return handler.reject(DioException(
            requestOptions: options,
            error: 'No internet connection',
            type: DioExceptionType.connectionError,
          ));
        }

        // Add authorization token
        final token = await _secureStorage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }

        // Add device info headers
        options.headers['X-Device-Id'] = await _getDeviceId();
        options.headers['X-App-Version'] =
            dotenv.get('APP_VERSION', fallback: '1.0.0');
        options.headers['X-Platform'] = Platform.isAndroid
            ? 'android'
            : Platform.isIOS
                ? 'ios'
                : 'web';

        if (isDebug) {
          print('🌐 API Request: ${options.method} ${options.path}');
          print('📦 Headers: ${options.headers}');
          if (options.data != null) {
            print('📝 Body: ${options.data}');
          }
        }

        return handler.next(options);
      },
      onResponse: (response, handler) {
        if (isDebug) {
          print(
              '✅ API Response: ${response.statusCode} ${response.requestOptions.path}');
          print('📦 Response Data: ${response.data}');
        }

        final responseData = response.data;
        if (responseData is Map<String, dynamic> &&
            responseData.containsKey('data') &&
            (responseData.containsKey('success') ||
                responseData.containsKey('statusCode'))) {
          response.data = responseData['data'];
        }

        return handler.next(response);
      },
      onError: (error, handler) async {
        if (isDebug) {
          print(
              '❌ API Error: ${error.response?.statusCode} ${error.requestOptions.path}');
          print('📦 Error Data: ${error.response?.data}');
          print('📦 Error Message: ${error.message}');
        }

        // Handle 401 Unauthorized (Token expired)
        if (error.response?.statusCode == 401) {
          final refreshed = await _refreshToken();
          if (refreshed) {
            // Retry the original request
            final options = error.requestOptions;
            final token = await _secureStorage.read(key: 'access_token');
            options.headers['Authorization'] = 'Bearer $token';

            if (isDebug) {
              print('🔄 Retrying request with new token');
            }

            try {
              final response = await _dio.fetch(options);
              return handler.resolve(response);
            } catch (retryError) {
              if (retryError is DioException) {
                return handler.next(retryError);
              }
              return handler.reject(
                DioException(
                  requestOptions: options,
                  error: retryError,
                ),
              );
            }
          } else {
            // Clear auth data if refresh fails
            await _clearAuth();
          }
        }

        return handler.next(error);
      },
    ));

    // Add logging interceptor for debug
    if (isDebug) {
      _dio.interceptors.add(LogInterceptor(
        request: true,
        requestHeader: true,
        requestBody: true,
        responseHeader: true,
        responseBody: true,
        error: true,
        logPrint: (object) => print(object),
      ));
    }
  }

  Future<String> _getDeviceId() async {
    String? deviceId = await _secureStorage.read(key: 'device_id');
    if (deviceId == null) {
      deviceId = 'device_${DateTime.now().millisecondsSinceEpoch}';
      await _secureStorage.write(key: 'device_id', value: deviceId);
    }
    return deviceId;
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await _secureStorage.read(key: 'refresh_token');
      if (refreshToken == null) {
        if (isDebug) print('❌ No refresh token available');
        return false;
      }

      if (isDebug) print('🔄 Refreshing access token');

      final response = await _dio.post('/auth/refresh', data: {
        'refresh_token': refreshToken,
      });

      final newAccessToken = response.data['access_token'];
      final newRefreshToken = response.data['refresh_token'];

      await _secureStorage.write(
        key: 'access_token',
        value: newAccessToken,
      );

      if (newRefreshToken != null) {
        await _secureStorage.write(
          key: 'refresh_token',
          value: newRefreshToken,
        );
      }

      if (isDebug) print('✅ Token refreshed successfully');
      return true;
    } catch (e) {
      if (isDebug) print('❌ Token refresh failed: $e');
      return false;
    }
  }

  Future<void> _clearAuth() async {
    await _secureStorage.delete(key: 'access_token');
    await _secureStorage.delete(key: 'refresh_token');
    await _prefs.remove('user');

    if (isDebug) print('🧹 Auth data cleared');
  }

  // ========== AUTH METHODS ==========

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      final data = response.data;

      await _secureStorage.write(
        key: 'access_token',
        value: data['access_token'],
      );

      await _secureStorage.write(
        key: 'refresh_token',
        value: data['refresh_token'],
      );

      await _prefs.setString('user', json.encode(data['user']));

      if (isDebug) {
        print('✅ Login successful for: $email');
        print('🔑 Access Token: ${data['access_token']?.substring(0, 20)}...');
      }

      return data;
    } catch (e) {
      if (isDebug) print('❌ Login failed: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> register(
    String email,
    String password,
    String fullName,
    String organizationCode,
  ) async {
    try {
      final response = await _dio.post('/auth/register', data: {
        'email': email,
        'password': password,
        'fullName': fullName,
        'organizationCode': organizationCode,
      });

      final data = response.data;

      await _secureStorage.write(
        key: 'access_token',
        value: data['access_token'],
      );

      await _secureStorage.write(
        key: 'refresh_token',
        value: data['refresh_token'],
      );

      await _prefs.setString('user', json.encode(data['user']));

      if (isDebug) print('✅ Registration successful for: $email');

      return data;
    } catch (e) {
      if (isDebug) print('❌ Registration failed: $e');
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } catch (e) {
      if (isDebug) print('⚠️ Logout API call failed: $e');
    } finally {
      await _clearAuth();
      if (isDebug) print('✅ User logged out');
    }
  }

  Future<Map<String, dynamic>> getCurrentUser() async {
    try {
      final response = await _dio.get('/auth/me');
      await _prefs.setString('user', json.encode(response.data));
      return response.data;
    } catch (e) {
      if (isDebug) print('❌ Failed to get current user: $e');
      rethrow;
    }
  }

  // ========== QUESTIONNAIRE METHODS ==========

  Future<List<dynamic>> getQuestionnaires() async {
    try {
      final response = await _dio.get('/assessment-templates');
      return response.data;
    } catch (e) {
      if (isDebug) print('❌ Failed to get questionnaires: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getQuestionnaire(String id) async {
    try {
      final questionnaires = await getQuestionnaires();
      return questionnaires.cast<Map<String, dynamic>>().firstWhere(
            (item) => item['id'] == id,
            orElse: () => throw StateError('Questionnaire not found: $id'),
          );
    } catch (e) {
      if (isDebug) print('❌ Failed to get questionnaire $id: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> submitResponse(
    String questionnaireId,
    Map<String, dynamic> answers,
  ) async {
    try {
      final response = await _dio.post('/responses', data: {
        'questionnaireId': questionnaireId,
        'answers': answers,
        'submittedAt': DateTime.now().toIso8601String(),
      });
      return response.data;
    } catch (e) {
      if (isDebug) print('❌ Failed to submit response: $e');
      rethrow;
    }
  }

  // ========== DASHBOARD METHODS ==========

  Future<Map<String, dynamic>> getOverview() async {
    try {
      final response = await _dio.get('/reports/overview');
      return response.data;
    } catch (e) {
      if (isDebug) print('❌ Failed to get overview: $e');
      rethrow;
    }
  }

  Future<List<dynamic>> getMyResponses() async {
    try {
      final response = await _dio.get('/responses/me');
      return response.data;
    } catch (e) {
      if (isDebug) print('❌ Failed to get my responses: $e');
      rethrow;
    }
  }

  // ========== EXPENSE METHODS ==========

  Future<List<dynamic>> getExpenses() async {
    try {
      final response = await _dio.get('/expenses');
      return response.data;
    } catch (e) {
      if (isDebug) print('❌ Failed to get expenses: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> createExpense(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/expenses', data: data);
      return response.data;
    } catch (e) {
      if (isDebug) print('❌ Failed to create expense: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> updateExpense(
    String id,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await _dio.put('/expenses/$id', data: data);
      return response.data;
    } catch (e) {
      if (isDebug) print('❌ Failed to update expense: $e');
      rethrow;
    }
  }

  Future<void> deleteExpense(String id) async {
    try {
      await _dio.delete('/expenses/$id');
    } catch (e) {
      if (isDebug) print('❌ Failed to delete expense: $e');
      rethrow;
    }
  }

  // ========== ORGANIZATION METHODS ==========

  Future<Map<String, dynamic>> getOrganization() async {
    try {
      final response = await _dio.get('/organizations/me');
      return response.data;
    } catch (e) {
      if (isDebug) print('❌ Failed to get organization: $e');
      rethrow;
    }
  }

  Future<List<dynamic>> getOrganizationMembers() async {
    try {
      final response = await _dio.get('/organizations/members');
      return response.data;
    } catch (e) {
      if (isDebug) print('❌ Failed to get organization members: $e');
      rethrow;
    }
  }

  // ========== REPORT METHODS ==========

  Future<List<dynamic>> getReports() async {
    try {
      final response = await _dio.get('/reports');
      return response.data;
    } catch (e) {
      if (isDebug) print('❌ Failed to get reports: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> generateReport(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/reports/generate', data: data);
      return response.data;
    } catch (e) {
      if (isDebug) print('❌ Failed to generate report: $e');
      rethrow;
    }
  }

  // ========== FILE UPLOAD ==========

  Future<String> uploadFile(File file, String fileName) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: fileName,
        ),
      });

      final response = await _dio.post('/upload', data: formData);
      return response.data['url'];
    } catch (e) {
      if (isDebug) print('❌ Failed to upload file: $e');
      rethrow;
    }
  }

  // ========== HEALTH CHECK ==========

  Future<bool> healthCheck() async {
    try {
      await _dio.get('/health');
      return true;
    } catch (e) {
      if (isDebug) print('❌ Health check failed: $e');
      return false;
    }
  }

  // ========== MISC METHODS ==========

  Future<Map<String, dynamic>> getStatistics() async {
    try {
      final response = await _dio.get('/statistics');
      return response.data;
    } catch (e) {
      if (isDebug) print('❌ Failed to get statistics: $e');
      rethrow;
    }
  }

  Future<List<dynamic>> getNotifications() async {
    try {
      final response = await _dio.get('/notifications');
      return response.data;
    } catch (e) {
      if (isDebug) print('❌ Failed to get notifications: $e');
      rethrow;
    }
  }

  Future<void> markNotificationAsRead(String id) async {
    try {
      await _dio.patch('/notifications/$id/read');
    } catch (e) {
      if (isDebug) print('❌ Failed to mark notification as read: $e');
      rethrow;
    }
  }
}
