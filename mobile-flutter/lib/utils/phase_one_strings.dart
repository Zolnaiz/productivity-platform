import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import '../models/work_log_model.dart' show localDay;

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

  String hoursValue(double hours) {
    final shown =
        hours == hours.roundToDouble() ? hours.toInt().toString() : '$hours';
    return mn ? '$shown цаг' : '$shown h';
  }

  String hoursToday(double hours) =>
      mn ? 'Өнөөдөр: ${hoursValue(hours)}' : 'Today: ${hoursValue(hours)}';

  /// When an area was last checked, as the day on the phone's calendar: a
  /// check at 07:00 in Ulaanbaatar is the day before in UTC.
  String lastChecked(String at) {
    final parsed = DateTime.tryParse(at);
    final day = parsed == null
        ? (at.length >= 10 ? at.substring(0, 10) : at)
        : at.length <= 10
            ? at
            : localDay(parsed.toLocal());
    return mn ? 'Сүүлд шалгасан: $day' : 'Last checked $day';
  }

  String lastCleaned(String day) {
    final shown = day.length >= 10 ? day.substring(0, 10) : day;
    return mn ? 'Сүүлд цэвэрлэсэн: $shown' : 'Last cleaned $shown';
  }

  String redTagsHeading(int count) =>
      mn ? 'Улаан шошго ($count)' : 'Red tags ($count)';

  String scoreSoFar(int score) => mn ? 'Оноо: $score%' : 'Score: $score%';

  String auditSaved(int score) =>
      mn ? 'Шалгалт бүртгэгдлээ: $score%' : 'Check recorded: $score%';

  /// Said when a change could not leave the phone and was kept to send later.
  String keptOnPhone(int count) => mn
      ? 'Утсанд $count зүйл хадгалагдсан. Сүлжээ ормогц илгээнэ.'
      : '$count kept on this phone, sent when the network is back.';

  String keptRefused(int count) => mn
      ? 'Хадгалсан $count зүйлийг сервер хүлээж авсангүй.'
      : 'The server did not take $count kept change${count == 1 ? '' : 's'}.';

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
  'raised.ideaApproved': 'Таны санааг хэрэгжүүлэхээр шийдлээ: {{title}}',
  'raised.ideaDeclined': 'Таны санааг одоохондоо хэрэгжүүлэхгүй: {{title}}',
  'raised.ideaDone': 'Таны санаа хэрэгжлээ: {{title}}',
  'raised.tierAuditDue': '{{layer}}-ын 5S аудитын хугацаа болсон: {{place}}',
  'raised.redTagDecision':
      'Улаан шошготой зүйлд шийдвэр гаргах хугацаа болсон: {{item}}',
  'raised.auditFollowUp': '5S залруулах ажил: {{place}}',
  'raised.dailyDigest':
      'Өнөөдөр: {{dueToday}} ажлын хугацаа дуусна, {{overdue}} хоцорсон',
  'raised.teamDigest':
      'Багийн өнөөдөр: {{late}} хоцорсон, {{unassigned}} хариуцагчгүй',
  'raised.dueOn': '{{date}}-нд дуусна',
  'raised.dailyDigestBody':
      'Хоцорсон:\n{{overdue}}\nӨнөөдөр дуусах:\n{{dueToday}}',
  'raised.teamDigestBody': 'Хариуцагчгүй:\n{{unassigned}}\nХоцорсон:\n{{late}}',
  'raised.tierAuditDueBody.daily':
      'Түвшин: {{tier}} ({{layer}})\nДавтамж: өдөр бүр\nЭнэ түвшинд сүүлд шалгасан: {{lastChecked}}\nДуусах: {{due}}',
  'raised.tierAuditDueBody.weekly':
      'Түвшин: {{tier}} ({{layer}})\nДавтамж: долоо хоног бүр\nЭнэ түвшинд сүүлд шалгасан: {{lastChecked}}\nДуусах: {{due}}',
  'raised.tierAuditDueBody.monthly':
      'Түвшин: {{tier}} ({{layer}})\nДавтамж: сар бүр\nЭнэ түвшинд сүүлд шалгасан: {{lastChecked}}\nДуусах: {{due}}',
  'raised.redTagDecisionBody':
      'Бүс: {{place}}\nШошголсон: {{heldSince}}\nЗүйлийг хаях эсвэл бүсэд нь буцаахыг шийднэ үү.',
  'raised.auditFollowUpBody':
      '{{date}}-ны аудитын оноо {{score}}%.\nЭнэ бүсийн стандарт {{standard}}%.\nБүсийг стандартад нь эргүүлж оруулна уу; дараагийн аудит үүнийг шалгана.',
};
const _raisedEn = {
  'raised.ideaApproved': 'Your idea was taken up: {{title}}',
  'raised.ideaDeclined': 'Your idea was not taken up: {{title}}',
  'raised.ideaDone': 'Your idea is in place: {{title}}',
  'raised.tierAuditDue': '{{layer}} 5S audit due: {{place}}',
  'raised.redTagDecision': 'Red-tag decision due: {{item}}',
  'raised.auditFollowUp': '5S follow-up: {{place}}',
  'raised.dailyDigest': 'Today: {{dueToday}} due, {{overdue}} late',
  'raised.teamDigest':
      'Team today: {{late}} late, {{unassigned}} with nobody on it',
  'raised.dueOn': 'Due {{date}}',
  'raised.dailyDigestBody': 'Late:\n{{overdue}}\nDue today:\n{{dueToday}}',
  'raised.teamDigestBody': 'Nobody on it:\n{{unassigned}}\nLate:\n{{late}}',
  'raised.tierAuditDueBody.daily':
      'Layer: tier {{tier}} ({{layer}})\nFrequency: daily\nLast checked at this layer: {{lastChecked}}\nDue: {{due}}',
  'raised.tierAuditDueBody.weekly':
      'Layer: tier {{tier}} ({{layer}})\nFrequency: weekly\nLast checked at this layer: {{lastChecked}}\nDue: {{due}}',
  'raised.tierAuditDueBody.monthly':
      'Layer: tier {{tier}} ({{layer}})\nFrequency: monthly\nLast checked at this layer: {{lastChecked}}\nDue: {{due}}',
  'raised.redTagDecisionBody':
      'Area: {{place}}\nHeld since: {{heldSince}}\nDecide whether the item is disposed of or returned to the area.',
  'raised.auditFollowUpBody':
      'The audit on {{date}} scored {{score}}%.\nThe standard for this area is {{standard}}%.\nBring the area back to its standard; the next audit verifies it.',
};

const _en = {
  'tasks': 'My tasks',
  'today': 'Today',
  'inbox': 'Inbox',
  'fiveS': '5S',
  'fiveSEmpty': 'No areas on the floor plan yet. They are drawn on the web.',
  'neverChecked': 'Not checked yet',
  'noChecklist': 'No 5S checklist is set up yet. Ask an admin to add one.',
  'layer': 'Audit layer',
  'checklist': 'Checklist',
  'yes': 'Yes',
  'no': 'No',
  'auditNote': 'What you found',
  'saveAudit': 'Record the check',
  'neverCleaned': 'No cleaning recorded yet',
  'walkChecklist': 'Walk the checklist',
  'cleanedToday': 'Cleaned today',
  'noRedTags': 'Nothing is tagged here.',
  'redTagTitle': 'What does not belong here',
  'redTagDisposition': 'What should happen to it (optional)',
  'addRedTag': 'Add a red tag',
  'redTagSaved': 'Red tag added.',
  'takePhoto': 'Photograph it',
  'photoSaved': 'Photograph added.',
  'shortfallPrompt': 'Where it fell short. A photograph of each shows what has to change.',
  'walkDone': 'Done',
  'inboxEmpty':
      'Nothing here yet. Work given to you and the morning reminder arrive here.',
  'whatDidYouDo': 'What did you do?',
  'summaryRequired': 'Say what you did.',
  'hours': 'Hours',
  'hoursInvalid': 'Enter the hours it took, up to 24.',
  'forTask': 'For which task',
  'noTask': 'Not for a particular task',
  'blockers': 'Anything in the way',
  'saveLog': 'Save',
  'logSaved': 'Saved.',
  'nothingLogged': 'Nothing written up for today yet.',
  'noTasks': 'No tasks assigned to you.',
  'retry': 'Try again',
  'sendNow': 'Send now',
  'ideas': 'Ideas',
  'ideaNew': 'New idea',
  'ideaTitle': 'The idea',
  'ideaDescription': 'What is wrong now, and what would be better',
  'ideaArea': 'Where',
  'ideaBenefit': 'What it would bring',
  'ideaSend': 'Send the idea',
  'ideaSent': 'Thank you. Your idea is in.',
  'ideaAddPhoto': 'Add a photo',
  'ideaTooShort': 'Say the idea in a few words.',
  'ideaYours': 'Yours',
  'ideasEmpty': 'No ideas yet. Put the first one in.',
  'ideaStatus.submitted': 'New',
  'ideaStatus.approved': 'Taken up',
  'ideaStatus.done': 'In place',
  'ideaStatus.declined': 'Not taken up',
  'ideaStatus.kept': 'On this phone',
  'scanLabel': 'Scan a label',
  'scanHint': 'Point the camera at the QR code on an area’s 5S label.',
  'notALabel': 'That code is not a 5S area label.',
  'labelUnknown': 'This label names an area that is not on your organization’s plans.',
  'cameraUnavailable': 'The camera could not be opened. Allow it in the phone’s settings.',
  'keptNow': 'No network. Kept on this phone to send later.',
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
  'today': 'Өнөөдөр',
  'inbox': 'Мэдэгдэл',
  'fiveS': '5S',
  'fiveSEmpty': 'Зураг төсөлд бүс алга байна. Бүсийг вэб дээр зурна.',
  'neverChecked': 'Одоогоор шалгаагүй',
  'noChecklist': '5S шалгах хуудас тохируулаагүй байна. Админд хандана уу.',
  'layer': 'Аудитын түвшин',
  'checklist': 'Шалгах хуудас',
  'yes': 'Тийм',
  'no': 'Үгүй',
  'auditNote': 'Юу ажигласан бэ',
  'saveAudit': 'Шалгалтыг бүртгэх',
  'neverCleaned': 'Цэвэрлэгээ бүртгэгдээгүй',
  'walkChecklist': 'Шалгах хуудсаар шалгах',
  'cleanedToday': 'Өнөөдөр цэвэрлэсэн',
  'noRedTags': 'Энд улаан шошготой зүйл алга.',
  'redTagTitle': 'Энд байх ёсгүй зүйл',
  'redTagDisposition': 'Юу хийх вэ (заавал биш)',
  'addRedTag': 'Улаан шошго нэмэх',
  'redTagSaved': 'Улаан шошго нэмэгдлээ.',
  'takePhoto': 'Зураг авах',
  'photoSaved': 'Зураг нэмэгдлээ.',
  'shortfallPrompt': 'Шаардлага хангаагүй хэсгүүд. Тус бүрийн зураг юуг өөрчлөхийг харуулна.',
  'walkDone': 'Болсон',
  'inboxEmpty': 'Одоогоор алга. Танд оноосон ажил, өглөөний сануулга энд ирнэ.',
  'whatDidYouDo': 'Юу хийсэн бэ?',
  'summaryRequired': 'Юу хийснээ бичнэ үү.',
  'hours': 'Цаг',
  'hoursInvalid': 'Зарцуулсан цагаа 24 хүртэл оруулна уу.',
  'forTask': 'Аль ажилд',
  'noTask': 'Тодорхой ажилд хамаарахгүй',
  'blockers': 'Саад болж буй зүйл',
  'saveLog': 'Хадгалах',
  'logSaved': 'Хадгаллаа.',
  'nothingLogged': 'Өнөөдрийн бүртгэл одоогоор алга.',
  'noTasks': 'Танд оноосон ажил алга.',
  'retry': 'Дахин оролдох',
  'sendNow': 'Одоо илгээх',
  'ideas': 'Санаа',
  'ideaNew': 'Шинэ санаа',
  'ideaTitle': 'Санаа',
  'ideaDescription': 'Одоо юу буруу байна, юу илүү сайн болох вэ',
  'ideaArea': 'Хаана',
  'ideaBenefit': 'Ямар үр дүн гарах вэ',
  'ideaSend': 'Санаа илгээх',
  'ideaSent': 'Баярлалаа. Таны санаа ирлээ.',
  'ideaAddPhoto': 'Зураг нэмэх',
  'ideaTooShort': 'Санаагаа хэдэн үгээр бичнэ үү.',
  'ideaYours': 'Таных',
  'ideasEmpty': 'Одоогоор санаа алга. Эхнийхийг нь илгээгээрэй.',
  'ideaStatus.submitted': 'Шинэ',
  'ideaStatus.approved': 'Хэрэгжүүлж буй',
  'ideaStatus.done': 'Хэрэгжсэн',
  'ideaStatus.declined': 'Хэрэгжүүлэхгүй',
  'ideaStatus.kept': 'Утсанд',
  'scanLabel': 'Шошго уншуулах',
  'scanHint': 'Камераа талбайн 5S шошгон дээрх QR код руу чиглүүлнэ үү.',
  'notALabel': 'Энэ код 5S талбайн шошго биш байна.',
  'labelUnknown': 'Энэ шошгоны талбай танай байгууллагын зураг дээр алга.',
  'cameraUnavailable': 'Камер нээгдсэнгүй. Утасны тохиргооноос зөвшөөрнө үү.',
  'keptNow': 'Сүлжээ алга. Утсанд хадгаллаа, дараа нь илгээнэ.',
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
