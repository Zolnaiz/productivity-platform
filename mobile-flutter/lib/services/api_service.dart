import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

/// No Productivity Platform API answered at an address someone typed in:
/// nothing there, something else there, or not an address at all.
class ServerUnreachable implements Exception {
  const ServerUnreachable();
}

/// Turns what someone types for a server into the API's base address.
///
/// `company.example.com`, `https://company.example.com/` and
/// `https://company.example.com/api` all become
/// `https://company.example.com/api`. A scheme that is typed is kept, so a
/// development backend at `http://10.0.2.2:3000` still works. Query and
/// fragment are dropped. Null when there is no host to go to.
String? normalizeServerAddress(String input) {
  var text = input.trim();
  if (text.isEmpty) return null;
  if (!text.contains('://')) text = 'https://$text';
  final uri = Uri.tryParse(text);
  if (uri == null ||
      uri.host.isEmpty ||
      (uri.scheme != 'https' && uri.scheme != 'http')) {
    return null;
  }
  var path = uri.path;
  while (path.endsWith('/')) {
    path = path.substring(0, path.length - 1);
  }
  if (!path.endsWith('/api')) path = '$path/api';
  return Uri(
    scheme: uri.scheme,
    host: uri.host,
    port: uri.hasPort ? uri.port : null,
    path: path,
  ).toString();
}

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

  /// Where the address chosen on the sign-in screen is kept between launches.
  static const _serverKey = 'server_url';

  /// The server this build was made for: `--dart-define=API_BASE_URL`, else
  /// `.env`, else the Android emulator's view of a backend on the computer.
  /// Used until someone picks another server on the sign-in screen.
  String get builtInBaseUrl =>
      const String.fromEnvironment('API_BASE_URL').isNotEmpty
          ? const String.fromEnvironment('API_BASE_URL')
          : dotenv.get('API_BASE_URL', fallback: 'http://10.0.2.2:3000/api');

  /// The API every request goes to now, for the sign-in screen to show.
  String get serverAddress => _dio.options.baseUrl;

  /// Points the app at another organization's server.
  ///
  /// Each organization runs the platform on its own server, while the store
  /// has one app; and a server reached through a quick tunnel changes its
  /// address whenever the tunnel restarts. So the address is something the
  /// person can set, instead of one fixed into the build.
  ///
  /// The address is accepted only if a Productivity Platform API answers its
  /// `/health` with "ok". That check goes out on a bare client with no
  /// interceptors, so no token is ever sent to an address someone typed.
  /// Tokens and the stored user are dropped: a session belongs to the server
  /// that issued it. Returns the address as kept, or throws
  /// [ServerUnreachable].
  Future<String> useServer(String input) async {
    final address = normalizeServerAddress(input);
    if (address == null) throw const ServerUnreachable();

    final probe = Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ))
      ..httpClientAdapter = _dio.httpClientAdapter;
    try {
      final body = (await probe.get('$address/health')).data;
      // The API wraps every answer in {success, data}; /health's data is
      // {status: "ok", ...}.
      final health = body is Map ? (body['data'] ?? body) : null;
      if (health is! Map || health['status'] != 'ok') {
        throw const ServerUnreachable();
      }
    } on DioException {
      throw const ServerUnreachable();
    }

    _dio.options.baseUrl = address;
    _prefs = await SharedPreferences.getInstance();
    await _prefs.setString(_serverKey, address);
    await _clearAuth();
    return address;
  }

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
          baseUrl: builtInBaseUrl,
          connectTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
          sendTimeout: const Duration(seconds: 30),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        ));

    // A server picked on the sign-in screen wins over the built-in one.
    final chosenServer = _prefs.getString(_serverKey);
    if (chosenServer != null) _dio.options.baseUrl = chosenServer;

    // Add request interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Check internet connection. The plugin answers with every network
        // the phone is on; compared with a single value, as it was, the
        // check never matched and an offline request went out to fail.
        final connections = _instanceOverride
            ? const [ConnectivityResult.wifi]
            : await _connectivity.checkConnectivity();
        if (connections.every((result) => result == ConnectivityResult.none)) {
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
          if (error.requestOptions.extra['retriedAfterRefresh'] == true) {
            // A refreshed credential that the server still rejects cannot
            // recover this session; retaining it would replay the same 401.
            await _clearAuth();
            return handler.next(error);
          }
          if (error.requestOptions.path.endsWith('/auth/login') ||
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

  Future<List<Map<String, dynamic>>> getProjects() async {
    final response = await _dio.get('/projects');
    return (response.data as List).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> updateTask(
      String id, Map<String, dynamic> changes) async {
    final response = await _dio.patch('/tasks/$id', data: changes);
    return (response.data as Map).cast<String, dynamic>();
  }

  /// The signed-in person's work logs. The server sends an employee only
  /// their own.
  Future<List<Map<String, dynamic>>> getWorkLogs() async {
    final response = await _dio.get('/work-logs');
    return (response.data as List).cast<Map<String, dynamic>>();
  }

  /// The header that has the server write a POST once, however many times
  /// it arrives (the server's IdempotencyInterceptor). Every write the outbox
  /// can keep sends one from its first try, so the copy sent after a lost
  /// answer is recognised as the same write.
  static Options? _once(String? idempotencyKey) => idempotencyKey == null
      ? null
      : Options(headers: {'Idempotency-Key': idempotencyKey});

  /// Records a day's work and the time it took, as one act: the server saves
  /// the note and its clock entry together, so the hours are counted once.
  Future<Map<String, dynamic>> createDailyWorkLog(Map<String, dynamic> entry,
      {String? idempotencyKey}) async {
    final response = await _dio.post('/work-logs/daily',
        data: entry, options: _once(idempotencyKey));
    return (response.data as Map).cast<String, dynamic>();
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

  /// Edits the signed-in person's own name, phone and language.
  Future<void> updateProfile({String? firstName, String? lastName, String? phone, String? language}) async {
    await _dio.patch('/users/profile/me', data: {
      if (firstName != null) 'firstName': firstName,
      if (lastName != null) 'lastName': lastName,
      if (phone != null) 'phone': phone,
      if (language != null) 'language': language,
    });
    await getCurrentUser();
  }

  /// Changes the password. The server ends every other session and answers
  /// this one with new tokens, which are kept so the phone stays signed in.
  Future<void> changePassword(String currentPassword, String newPassword) async {
    final response = await _dio.post('/auth/change-password', data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
    final data = response.data;
    if (data is Map && data['access_token'] is String) {
      await _writeToken('access_token', data['access_token'] as String);
      if (data['refresh_token'] is String) {
        await _writeToken('refresh_token', data['refresh_token'] as String);
      }
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

  // ========== DASHBOARD METHODS ==========

  // ========== ORGANIZATION METHODS ==========

  /// The organization's floor plans, each with its areas and audit layers.
  Future<List<Map<String, dynamic>>> getFiveSPlans() async {
    final response = await _dio.get('/five-s-layouts');
    return (response.data as List)
        .cast<Map>()
        .map((plan) => plan.cast<String, dynamic>())
        .toList();
  }

  /// The checklists an area can be walked against.
  Future<List<Map<String, dynamic>>> getAuditTemplates() async {
    final response = await _dio.get('/audit-templates');
    return (response.data as List)
        .cast<Map>()
        .map((item) => item.cast<String, dynamic>())
        .toList();
  }

  /// Tags something in an area as not belonging there. Its own route, so the
  /// person who finds the clutter can say so without editing the plan.
  Future<Map<String, dynamic>> addRedTag(
      String planId, String zoneId, Map<String, dynamic> redTag,
      {String? idempotencyKey}) async {
    final response = await _dio.post(
        '/five-s-layouts/$planId/zones/$zoneId/red-tags',
        data: redTag,
        options: _once(idempotencyKey));
    return (response.data as Map).cast<String, dynamic>();
  }

  /// The files attached to a record, such as a red tag's photographs.
  Future<List<Map<String, dynamic>>> getAttachments(
      String ownerType, String ownerId) async {
    final response = await _dio.get('/attachments',
        queryParameters: {'ownerType': ownerType, 'ownerId': ownerId});
    return (response.data as List)
        .cast<Map>()
        .map((item) => item.cast<String, dynamic>())
        .toList();
  }

  /// Attaches a photograph to a record. The server decides what the bytes
  /// are from the bytes, not from the name.
  Future<Map<String, dynamic>> uploadAttachment({
    required String ownerType,
    required String ownerId,
    required List<int> bytes,
    required String fileName,
    String kind = 'evidence',
    String? part,
  }) async {
    final form = FormData.fromMap({
      'file': MultipartFile.fromBytes(bytes, filename: fileName),
      'ownerType': ownerType,
      'ownerId': ownerId,
      'kind': kind,
      if (part != null) 'part': part,
    });
    final response = await _dio.post('/attachments', data: form);
    return (response.data as Map).cast<String, dynamic>();
  }

  /// A task's work documents and their review (backend operations/deliverables.ts):
  /// `{review: {status, note, ...}, files: [... newest version first]}`.
  Future<Map<String, dynamic>> getDeliverables(String taskId) async {
    final response = await _dio.get('/tasks/$taskId/deliverables');
    return (response.data as Map).cast<String, dynamic>();
  }

  /// Adds a document or photo to the person's own task. Refused while the
  /// documents are under review or approved (DELIVERABLE_LOCKED).
  Future<Map<String, dynamic>> uploadDeliverable(
      String taskId, List<int> bytes, String fileName) async {
    final form = FormData.fromMap(
        {'file': MultipartFile.fromBytes(bytes, filename: fileName)});
    final response =
        await _dio.post('/tasks/$taskId/deliverables', data: form);
    return (response.data as Map).cast<String, dynamic>();
  }

  /// Sends the task's documents to be reviewed.
  Future<Map<String, dynamic>> submitDeliverables(String taskId) async {
    final response = await _dio.post('/tasks/$taskId/deliverables/submit');
    return (response.data as Map).cast<String, dynamic>();
  }

  /// Records that an area was cleaned today; the server dates it.
  Future<Map<String, dynamic>> markZoneCleaned(String planId, String zoneId,
      {String? idempotencyKey}) async {
    final response = await _dio.post(
        '/five-s-layouts/$planId/zones/$zoneId/cleaned',
        options: _once(idempotencyKey));
    return (response.data as Map).cast<String, dynamic>();
  }

  /// A file's bytes - a photograph to show on the phone.
  Future<Uint8List> getAttachmentBytes(String id) async {
    final response = await _dio.get<List<int>>('/attachments/$id/file',
        options: Options(responseType: ResponseType.bytes));
    return Uint8List.fromList(response.data ?? const []);
  }

  /// My check-in for the week a day falls in, or null when none is written.
  Future<Map<String, dynamic>?> getMyCheckin(String week) async {
    final response =
        await _dio.get('/checkins/mine', queryParameters: {'week': week});
    final data = response.data;
    return data is Map ? data.cast<String, dynamic>() : null;
  }

  /// Writes or updates my week.
  Future<Map<String, dynamic>> saveMyCheckin(Map<String, dynamic> checkin) async {
    final response = await _dio.put('/checkins/mine', data: checkin);
    return (response.data as Map).cast<String, dynamic>();
  }

  /// The open usability questionnaire (SUS, measure K7), if any, and my
  /// answers to it: `{round: {id, title} | null, mine: {answers, score} | null}`.
  Future<Map<String, dynamic>> getCurrentSus() async {
    final response = await _dio.get('/sus/current');
    return (response.data as Map).cast<String, dynamic>();
  }

  /// My ten answers (1-5 each) to a round. Sent again, they replace the last,
  /// so a copy sent after a lost answer changes nothing.
  Future<Map<String, dynamic>> answerSus(String roundId, List<int> answers) async {
    final response = await _dio.put('/sus/rounds/$roundId/answers/mine', data: {'answers': answers});
    return (response.data as Map).cast<String, dynamic>();
  }

  /// Asks the organization's administrators to delete my account.
  Future<void> requestAccountDeletion() async {
    await _dio.post('/account/deletion-request');
  }

  /// Records a gemba walk; its follow-ups become tasks on the server.
  Future<Map<String, dynamic>> recordGembaWalk(Map<String, dynamic> walk,
      {String? idempotencyKey}) async {
    final response =
        await _dio.post('/gemba', data: walk, options: _once(idempotencyKey));
    return (response.data as Map).cast<String, dynamic>();
  }

  /// The organization's idea box, newest first.
  Future<List<Map<String, dynamic>>> getIdeas() async {
    final response = await _dio.get('/ideas');
    return (response.data as List)
        .cast<Map>()
        .map((item) => item.cast<String, dynamic>())
        .toList();
  }

  /// Puts an idea in the box.
  Future<Map<String, dynamic>> createIdea(Map<String, dynamic> idea,
      {String? idempotencyKey}) async {
    final response =
        await _dio.post('/ideas', data: idea, options: _once(idempotencyKey));
    return (response.data as Map).cast<String, dynamic>();
  }

  /// Sends a change kept on the phone while it was offline, as it was made.
  Future<dynamic> send(String method, String path, Map<String, dynamic>? data,
      {String? idempotencyKey}) async {
    final response = await _dio.request(path,
        data: data,
        options: Options(
            method: method,
            headers: {
              if (idempotencyKey != null) 'Idempotency-Key': idempotencyKey
            }));
    return response.data;
  }

  /// Records a walked checklist. The server moves the area's score and raises
  /// the follow-up work a failing walk calls for.
  Future<Map<String, dynamic>> createAuditRun(Map<String, dynamic> run,
      {String? idempotencyKey}) async {
    final response = await _dio.post('/audit-runs',
        data: run, options: _once(idempotencyKey));
    return (response.data as Map).cast<String, dynamic>();
  }

  // ========== FILE UPLOAD ==========

  // ========== MISC METHODS ==========

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

  Future<void> markAllNotificationsRead() async {
    try {
      await _dio.patch('/notifications/read-all');
    } catch (e) {
      if (isDebug) debugPrint('❌ Failed to mark notifications as read: $e');
      rethrow;
    }
  }
}
