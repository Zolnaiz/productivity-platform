import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

abstract interface class TokenStore {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
  Future<void> delete(String key);
}

class _SecureTokenStore implements TokenStore {
  const _SecureTokenStore();
  @override
  Future<String?> read(String key) =>
      const FlutterSecureStorage().read(key: key);
  @override
  Future<void> write(String key, String value) =>
      const FlutterSecureStorage().write(key: key, value: value);
  @override
  Future<void> delete(String key) =>
      const FlutterSecureStorage().delete(key: key);
}

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  ApiService.forTesting({required Dio client, required TokenStore tokenStore})
      : _instanceOverride = true,
        _tokenStore = tokenStore {
    _dio = client;
  }

  late Dio _dio;
  final TokenStore? _tokenStore;
  final bool _instanceOverride;
  TokenStore get _tokens => _tokenStore ?? const _SecureTokenStore();
  late SharedPreferences _prefs;
  final Connectivity _connectivity = Connectivity();
  Future<bool>? _refreshInFlight;

  String get baseUrl => const String.fromEnvironment('API_BASE_URL').isNotEmpty
      ? const String.fromEnvironment('API_BASE_URL')
      : dotenv.get('API_BASE_URL', fallback: 'http://10.0.2.2:3000/api');

  bool get isDebug => kDebugMode;

  ApiService._internal()
      : _instanceOverride = false,
        _tokenStore = null;

  Future<String?> _readToken(String key) => _tokens.read(key);
  Future<void> _writeToken(String key, String value) =>
      _tokens.write(key, value);
  Future<void> _deleteToken(String key) => _tokens.delete(key);

  Future<void> initialize({Dio? client}) async {
    _prefs = await SharedPreferences.getInstance();

    _dio = client ??
        Dio(BaseOptions(
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
        final connectivityResult = _instanceOverride
            ? ConnectivityResult.wifi
            : await _connectivity.checkConnectivity();
        if (connectivityResult == ConnectivityResult.none) {
          return handler.reject(DioException(
            requestOptions: options,
            error: 'No internet connection',
            type: DioExceptionType.connectionError,
          ));
        }

        // Add authorization token
        final isPublicAuthCall = options.path.endsWith('/auth/login') ||
            options.path.endsWith('/auth/refresh');
        final token =
            isPublicAuthCall ? null : await _readToken('access_token');
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
          debugPrint('🌐 API Request: ${options.method} ${options.path}');
        }

        return handler.next(options);
      },
      onResponse: (response, handler) {
        if (isDebug) {
          debugPrint(
              '✅ API Response: ${response.statusCode} ${response.requestOptions.path}');
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
          debugPrint(
              '❌ API Error: ${error.response?.statusCode} ${error.requestOptions.path}');
          final responseBody = error.response?.data;
          final code = responseBody is Map ? responseBody['errorCode'] : null;
          if (code is String) debugPrint('API error code: $code');
        }

        // Handle 401 Unauthorized (Token expired)
        if (error.response?.statusCode == 401) {
          if (error.requestOptions.extra['retriedAfterRefresh'] == true ||
              error.requestOptions.path.endsWith('/auth/login') ||
              error.requestOptions.path.endsWith('/auth/refresh')) {
            return handler.next(error);
          }
          final refreshed = await _refreshToken();
          if (refreshed) {
            // Retry the original request
            final options = error.requestOptions;
            options.extra['retriedAfterRefresh'] = true;
            final token = await _readToken('access_token');
            options.headers['Authorization'] = 'Bearer $token';

            if (isDebug) {
              debugPrint('🔄 Retrying request with new token');
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

    // Auth responses contain tokens and user data, so debug traces keep only
    // request metadata rather than recording credentials or personal details.
    if (isDebug) {
      _dio.interceptors.add(LogInterceptor(
        request: true,
        requestHeader: false,
        requestBody: false,
        responseHeader: false,
        responseBody: false,
        error: true,
        logPrint: (object) => debugPrint(object.toString()),
      ));
    }
  }

  Future<String> _getDeviceId() async {
    String? deviceId = await _readToken('device_id');
    if (deviceId == null) {
      deviceId = 'device_${DateTime.now().millisecondsSinceEpoch}';
      await _writeToken('device_id', deviceId);
    }
    return deviceId;
  }

  Future<bool> _refreshToken() async {
    final ongoingRefresh = _refreshInFlight;
    if (ongoingRefresh != null) return ongoingRefresh;

    final refresh = _performRefresh();
    _refreshInFlight = refresh;
    try {
      return await refresh;
    } finally {
      if (identical(_refreshInFlight, refresh)) _refreshInFlight = null;
    }
  }

  Future<bool> _performRefresh() async {
    try {
      final refreshToken = await _readToken('refresh_token');
      if (refreshToken == null) {
        if (isDebug) debugPrint('❌ No refresh token available');
        return false;
      }

      if (isDebug) debugPrint('🔄 Refreshing access token');

      final response = await _dio.post('/auth/refresh',
          data: {
            'refreshToken': refreshToken,
          },
          options: Options(headers: {'Authorization': null}));

      final newAccessToken = response.data['access_token'];
      final newRefreshToken = response.data['refresh_token'];

      await _writeToken('access_token', newAccessToken as String);

      if (newRefreshToken != null) {
        await _writeToken('refresh_token', newRefreshToken as String);
      }

      if (isDebug) debugPrint('✅ Token refreshed successfully');
      return true;
    } catch (e) {
      if (isDebug) debugPrint('❌ Token refresh failed: $e');
      return false;
    }
  }

  Future<void> _clearAuth() async {
    await _deleteToken('access_token');
    await _deleteToken('refresh_token');
    await _prefs.remove('user');

    if (isDebug) debugPrint('🧹 Auth data cleared');
  }

  // ========== AUTH METHODS ==========

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      final data = response.data;

      await _writeToken('access_token', data['access_token'] as String);

      await _writeToken('refresh_token', data['refresh_token'] as String);

      await _prefs.setString('user', json.encode(data['user']));

      if (isDebug) {
        debugPrint('✅ Login successful');
      }

      return data;
    } catch (e) {
      if (isDebug) debugPrint('❌ Login failed: $e');
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> getTasks() async {
    final response = await _dio.get('/tasks');
    return (response.data as List).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> updateTask(
      String id, Map<String, dynamic> changes) async {
    final response = await _dio.patch('/tasks/$id', data: changes);
    return (response.data as Map).cast<String, dynamic>();
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

      await _writeToken('access_token', data['access_token'] as String);

      await _writeToken('refresh_token', data['refresh_token'] as String);

      await _prefs.setString('user', json.encode(data['user']));

      if (isDebug) debugPrint('✅ Registration successful');

      return data;
    } catch (e) {
      if (isDebug) debugPrint('❌ Registration failed: $e');
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } catch (e) {
      if (isDebug) debugPrint('⚠️ Logout API call failed: $e');
    } finally {
      await _clearAuth();
      if (isDebug) debugPrint('✅ User logged out');
    }
  }

  Future<Map<String, dynamic>> getCurrentUser() async {
    try {
      final response = await _dio.get('/auth/me');
      await _prefs.setString('user', json.encode(response.data));
      return response.data;
    } catch (e) {
      if (isDebug) debugPrint('❌ Failed to get current user: $e');
      rethrow;
    }
  }

  // ========== QUESTIONNAIRE METHODS ==========

  Future<List<dynamic>> getQuestionnaires() async {
    try {
      final response = await _dio.get('/assessment-templates');
      return response.data;
    } catch (e) {
      if (isDebug) debugPrint('❌ Failed to get questionnaires: $e');
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
      if (isDebug) debugPrint('❌ Failed to get questionnaire $id: $e');
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
      if (isDebug) debugPrint('❌ Failed to submit response: $e');
      rethrow;
    }
  }

  // ========== DASHBOARD METHODS ==========

  Future<Map<String, dynamic>> getOverview() async {
    try {
      final response = await _dio.get('/reports/overview');
      return response.data;
    } catch (e) {
      if (isDebug) debugPrint('❌ Failed to get overview: $e');
      rethrow;
    }
  }

  Future<List<dynamic>> getMyResponses() async {
    try {
      final response = await _dio.get('/responses/me');
      return response.data;
    } catch (e) {
      if (isDebug) debugPrint('❌ Failed to get my responses: $e');
      rethrow;
    }
  }

  // ========== EXPENSE METHODS ==========

  Future<List<dynamic>> getExpenses() async {
    try {
      final response = await _dio.get('/expenses');
      return response.data;
    } catch (e) {
      if (isDebug) debugPrint('❌ Failed to get expenses: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> createExpense(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/expenses', data: data);
      return response.data;
    } catch (e) {
      if (isDebug) debugPrint('❌ Failed to create expense: $e');
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
      if (isDebug) debugPrint('❌ Failed to update expense: $e');
      rethrow;
    }
  }

  Future<void> deleteExpense(String id) async {
    try {
      await _dio.delete('/expenses/$id');
    } catch (e) {
      if (isDebug) debugPrint('❌ Failed to delete expense: $e');
      rethrow;
    }
  }

  // ========== ORGANIZATION METHODS ==========

  Future<Map<String, dynamic>> getOrganization() async {
    try {
      final response = await _dio.get('/organizations/me');
      return response.data;
    } catch (e) {
      if (isDebug) debugPrint('❌ Failed to get organization: $e');
      rethrow;
    }
  }

  Future<List<dynamic>> getOrganizationMembers() async {
    try {
      final response = await _dio.get('/organizations/members');
      return response.data;
    } catch (e) {
      if (isDebug) debugPrint('❌ Failed to get organization members: $e');
      rethrow;
    }
  }

  // ========== REPORT METHODS ==========

  Future<List<dynamic>> getReports() async {
    try {
      final response = await _dio.get('/reports');
      return response.data;
    } catch (e) {
      if (isDebug) debugPrint('❌ Failed to get reports: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> generateReport(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/reports/generate', data: data);
      return response.data;
    } catch (e) {
      if (isDebug) debugPrint('❌ Failed to generate report: $e');
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
      if (isDebug) debugPrint('❌ Failed to upload file: $e');
      rethrow;
    }
  }

  // ========== HEALTH CHECK ==========

  Future<bool> healthCheck() async {
    try {
      await _dio.get('/health');
      return true;
    } catch (e) {
      if (isDebug) debugPrint('❌ Health check failed: $e');
      return false;
    }
  }

  // ========== MISC METHODS ==========

  Future<Map<String, dynamic>> getStatistics() async {
    try {
      final response = await _dio.get('/statistics');
      return response.data;
    } catch (e) {
      if (isDebug) debugPrint('❌ Failed to get statistics: $e');
      rethrow;
    }
  }

  Future<List<dynamic>> getNotifications() async {
    try {
      final response = await _dio.get('/notifications');
      return response.data;
    } catch (e) {
      if (isDebug) debugPrint('❌ Failed to get notifications: $e');
      rethrow;
    }
  }

  Future<void> markNotificationAsRead(String id) async {
    try {
      await _dio.patch('/notifications/$id/read');
    } catch (e) {
      if (isDebug) debugPrint('❌ Failed to mark notification as read: $e');
      rethrow;
    }
  }
}
