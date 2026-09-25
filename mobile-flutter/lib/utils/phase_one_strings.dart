import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

class MongolianMaterialDelegate
    extends LocalizationsDelegate<MaterialLocalizations> {
  const MongolianMaterialDelegate();
  @override
  bool isSupported(Locale locale) => locale.languageCode == 'mn';
  @override
  Future<MaterialLocalizations> load(Locale locale) =>
      GlobalMaterialLocalizations.delegate.load(const Locale('en'));
  @override
  bool shouldReload(MongolianMaterialDelegate old) => false;
}

class MongolianCupertinoDelegate
    extends LocalizationsDelegate<CupertinoLocalizations> {
  const MongolianCupertinoDelegate();
  @override
  bool isSupported(Locale locale) => locale.languageCode == 'mn';
  @override
  Future<CupertinoLocalizations> load(Locale locale) =>
      GlobalCupertinoLocalizations.delegate.load(const Locale('en'));
  @override
  bool shouldReload(MongolianCupertinoDelegate old) => false;
}

class PhaseOneStrings {
  const PhaseOneStrings(this.locale);
  final Locale locale;
  bool get mn => locale.languageCode == 'mn';

  String text(String key) => (mn ? _mn : _en)[key] ?? key;

  String error(Object error) {
    if (error is String && error.startsWith('error.')) {
      final translations = mn ? _mn : _en;
      return translations[error] ?? translations['error.unknown']!;
    }
    final code = _errorCode(error);
    final translations = mn ? _mn : _en;
    return translations['error.$code'] ?? translations['error.unknown']!;
  }

  String _errorCode(Object error) {
    try {
      final dynamic e = error;
      final data = e.response?.data;
      if (data is Map && data['errorCode'] is String)
        return data['errorCode'] as String;
      final status = e.response?.statusCode;
      if (status == 400 || status == 422) return 'VALIDATION_FAILED';
      if (status == 401) return 'AUTH_TOKEN_INVALID';
      if (status == 403) return 'ACCESS_DENIED';
      if (status == 404) return 'RESOURCE_NOT_FOUND';
      if (status == 500 || status == 502 || status == 503)
        return 'INTERNAL_ERROR';
      if (status == null) return 'offline';
    } catch (_) {
      return 'unknown';
    }
    return 'unknown';
  }

  String taskTitle(
      {required String title,
      String? key,
      Map<String, dynamic> params = const {}}) {
    if (key == null) return title;
    final template = (mn ? _raisedMn : _raisedEn)[key];
    if (template == null) return title;
    return template.replaceAllMapped(RegExp(r'\{\{(\w+)\}\}'), (match) {
      final value = params[match[1]];
      return value == null ? match[0]! : value.toString();
    });
  }
}

const _raisedMn = {
  'raised.tierAuditDue': '{{layer}}-ын 5S аудитын хугацаа болсон: {{place}}',
  'raised.redTagDecision':
      'Улаан шошготой зүйлд шийдвэр гаргах хугацаа болсон: {{item}}',
  'raised.auditFollowUp': '5S залруулах ажил: {{place}}',
};
const _raisedEn = {
  'raised.tierAuditDue': '{{layer}} 5S audit due: {{place}}',
  'raised.redTagDecision': 'Red-tag decision due: {{item}}',
  'raised.auditFollowUp': '5S follow-up: {{place}}',
};

const _en = {
  'tasks': 'My tasks',
  'noTasks': 'No tasks assigned to you.',
  'retry': 'Try again',
  'signIn': 'Sign in',
  'logout': 'Sign out',
  'email': 'Email',
  'password': 'Password',
  'forgot': 'Forgot password?',
  'remember': 'Remember me',
  'newAccount': "Don't have an account?",
  'signUp': 'Sign up',
  'loading': 'Loading…',
  'status': 'Status',
  'backlog': 'Backlog',
  'todo': 'To do',
  'in_progress': 'In progress',
  'review': 'In review',
  'done': 'Done',
  'error.AUTH_INVALID_CREDENTIALS': 'Email or password is incorrect.',
  'error.AUTH_ACCOUNT_INACTIVE':
      'This account has been deactivated. Contact your workspace admin.',
  'error.AUTH_EMAIL_TAKEN':
      'This email is already registered. Sign in instead.',
  'error.AUTH_USER_NOT_FOUND': 'This account no longer exists.',
  'error.AUTH_SESSION_EXPIRED': 'Your session expired. Sign in again.',
  'error.AUTH_TOKEN_INVALID': 'Your session is no longer valid. Sign in again.',
  'error.AUTH_TOKEN_MISSING': 'Sign in to continue.',
  'error.ACCESS_DENIED': 'You do not have access to this.',
  'error.AUTH_ORGANIZATION_REQUIRED':
      'Your account is not linked to an organization. Contact your admin.',
  'error.AUTH_ORGANIZATION_TAKEN':
      'An organization with this name already exists. Choose another.',
  'error.INVITATION_INVALID':
      'This invitation link is not valid. Ask for a new one.',
  'error.INVITATION_EXPIRED': 'This invitation has expired. Ask for a new one.',
  'error.INVITATION_USED':
      'This invitation has already been used. Sign in instead.',
  'error.RESOURCE_NOT_FOUND': 'That record was not found.',
  'error.VALIDATION_FAILED': 'Check your details and try again.',
  'error.UNSUPPORTED_FILE_TYPE':
      'Only photographs and PDF files can be attached.',
  'error.FILE_TOO_LARGE': 'That file is too large. Attach one under 12 MB.',
  'error.METRICS_DISABLED': 'The metrics endpoint is switched off.',
  'error.INTERNAL_ERROR': 'Something went wrong on the server. Try again.',
  'error.offline':
      'Could not reach the server. Check your connection and try again.',
  'error.unknown': 'Something went wrong. Try again.',
};
const _mn = {
  'tasks': 'Миний ажлууд',
  'noTasks': 'Танд оноосон ажил алга.',
  'retry': 'Дахин оролдох',
  'signIn': 'Нэвтрэх',
  'logout': 'Гарах',
  'email': 'И-мэйл',
  'password': 'Нууц үг',
  'forgot': 'Нууц үгээ мартсан уу?',
  'remember': 'Намайг сана',
  'newAccount': 'Бүртгэлгүй юу?',
  'signUp': 'Бүртгүүлэх',
  'loading': 'Уншиж байна…',
  'status': 'Төлөв',
  'backlog': 'Төлөвлөөгүй',
  'todo': 'Хийх',
  'in_progress': 'Хийгдэж байна',
  'review': 'Хянаж байна',
  'done': 'Дууссан',
  'error.AUTH_INVALID_CREDENTIALS': 'И-мэйл эсвэл нууц үг буруу байна.',
  'error.AUTH_ACCOUNT_INACTIVE':
      'Энэ бүртгэлийг идэвхгүй болгосон байна. Workspace-ийн админтай холбогдоно уу.',
  'error.AUTH_EMAIL_TAKEN':
      'Энэ и-мэйл бүртгэлтэй байна. Оронд нь нэвтэрнэ үү.',
  'error.AUTH_USER_NOT_FOUND': 'Энэ бүртгэл байхгүй болсон байна.',
  'error.AUTH_SESSION_EXPIRED':
      'Нэвтрэх хугацаа дууссан байна. Дахин нэвтэрнэ үү.',
  'error.AUTH_TOKEN_INVALID': 'Нэвтрэх эрх хүчингүй боллоо. Дахин нэвтэрнэ үү.',
  'error.AUTH_TOKEN_MISSING': 'Үргэлжлүүлэхийн тулд нэвтэрнэ үү.',
  'error.ACCESS_DENIED': 'Энэ үйлдлийг хийх эрхгүй байна.',
  'error.AUTH_ORGANIZATION_REQUIRED':
      'Таны бүртгэл байгууллагатай холбогдоогүй байна. Админтай холбогдоно уу.',
  'error.AUTH_ORGANIZATION_TAKEN':
      'Ийм нэртэй байгууллага бүртгэлтэй байна. Өөр нэр сонгоно уу.',
  'error.INVITATION_INVALID':
      'Энэ урилгын холбоос хүчингүй байна. Шинээр авна уу.',
  'error.INVITATION_EXPIRED':
      'Энэ урилгын хугацаа дууссан байна. Шинээр авна уу.',
  'error.INVITATION_USED':
      'Энэ урилгыг аль хэдийн ашигласан байна. Оронд нь нэвтэрнэ үү.',
  'error.RESOURCE_NOT_FOUND': 'Бичлэг олдсонгүй.',
  'error.VALIDATION_FAILED': 'Мэдээллээ шалгаад дахин оролдоно уу.',
  'error.UNSUPPORTED_FILE_TYPE':
      'Зөвхөн зураг болон PDF файл хавсаргах боломжтой.',
  'error.FILE_TOO_LARGE':
      'Файл хэт том байна. 12 MB-аас бага файл хавсаргана уу.',
  'error.METRICS_DISABLED': 'Metrics эндпойнт унтраалттай байна.',
  'error.INTERNAL_ERROR': 'Серверт алдаа гарлаа. Дахин оролдоно уу.',
  'error.offline': 'Сервертэй холбогдож чадсангүй. Сүлжээгээ шалгана уу.',
  'error.unknown': 'Алдаа гарлаа. Дахин оролдоно уу.',
};
