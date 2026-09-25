import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:productivity_mobile/services/api_service.dart';
import 'package:productivity_mobile/utils/phase_one_strings.dart';

/// A server for widget tests: every request is answered by `reply`, and kept
/// in `requests` so a test can say what was sent.

const List<LocalizationsDelegate<dynamic>> testDelegates = [
  MongolianMaterialDelegate(),
  MongolianCupertinoDelegate(),
  GlobalMaterialLocalizations.delegate,
  GlobalWidgetsLocalizations.delegate,
  GlobalCupertinoLocalizations.delegate
];

class MemoryTokens implements TokenStore {
  final values = <String, String>{};
  @override
  Future<String?> read(String key) async => values[key];
  @override
  Future<void> write(String key, String value) async => values[key] = value;
  @override
  Future<void> delete(String key) async => values.remove(key);
}

typedef Reply = ResponseBody Function(RequestOptions request);

class MockAdapter implements HttpClientAdapter {
  MockAdapter(this.reply);
  final Reply reply;
  final requests = <RequestOptions>[];
  @override
  Future<ResponseBody> fetch(RequestOptions options,
      Stream<Uint8List>? requestStream, Future<void>? cancelFuture) async {
    requests.add(options);
    return reply(options);
  }

  @override
  void close({bool force = false}) {}
}

ResponseBody jsonReply(Object body, {int status = 200}) =>
    ResponseBody.fromString(
      jsonEncode(body),
      status,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType]
      },
    );

Map<String, dynamic> envelope(Object data) => {'success': true, 'data': data};

Future<(ApiService, MockAdapter, MemoryTokens)> makeApi(Reply reply) async {
  dotenv.loadFromString(envString: 'APP_VERSION=1.0.0');
  SharedPreferences.setMockInitialValues({});
  final adapter = MockAdapter(reply);
  final client = Dio(BaseOptions(baseUrl: 'http://localhost/api'))
    ..httpClientAdapter = adapter;
  final tokens = MemoryTokens();
  final api = ApiService.forTesting(client: client, tokenStore: tokens);
  await api.initialize(client: client);
  return (api, adapter, tokens);
}
