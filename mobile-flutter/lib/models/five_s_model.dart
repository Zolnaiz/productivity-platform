/// The 5S checklist as the phone walks it: the plans and their areas, the
/// checklists, and the rules that turn answers into a score.
///
/// The scoring and the layer rules mirror the web's `auditAnswers.ts` and
/// `tierRules.ts`, so a walk scored on the floor reads the same as one scored
/// at a desk.
library;

class AuditQuestion {
  const AuditQuestion(
      {required this.id, required this.text, required this.type, this.maxScore});

  final String id;
  final String text;

  /// `score`, `yes_no` or `text`.
  final String type;
  final int? maxScore;

  int get outOf => maxScore == null || maxScore! <= 0 ? _defaultMaxScore : maxScore!;

  factory AuditQuestion.fromJson(Map<String, dynamic> json) => AuditQuestion(
        id: json['id'] as String,
        text: json['text'] as String? ?? '',
        type: json['type'] as String? ?? 'text',
        maxScore: (json['maxScore'] as num?)?.toInt(),
      );
}

class AuditTemplate {
  const AuditTemplate(
      {required this.id,
      required this.title,
      this.category = '5s',
      this.isActive = true,
      this.questions = const []});

  final String id;
  final String title;
  final String category;
  final bool isActive;
  final List<AuditQuestion> questions;

  factory AuditTemplate.fromJson(Map<String, dynamic> json) => AuditTemplate(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        category: json['category'] as String? ?? '5s',
        isActive: json['isActive'] as bool? ?? true,
        questions: [
          for (final question in (json['questions'] as List? ?? const []))
            AuditQuestion.fromJson((question as Map).cast<String, dynamic>())
        ],
      );
}

/// One layer of a layered audit: who walks it and how often.
class AuditTier {
  const AuditTier(
      {required this.tier,
      required this.name,
      this.role,
      this.frequency = 'weekly',
      this.templateId});

  final int tier;
  final String name;
  final String? role;
  final String frequency;

  /// The checklist this layer walks, when the plan names one.
  final String? templateId;

  static AuditTier? fromJson(Object? json) {
    if (json is! Map || json['tier'] is! num) return null;
    return AuditTier(
      tier: (json['tier'] as num).toInt(),
      name: json['name'] as String? ?? '',
      role: json['role'] as String?,
      frequency: json['frequency'] as String? ?? 'weekly',
      templateId: json['templateId'] as String?,
    );
  }
}

class FiveSZone {
  const FiveSZone(
      {required this.id,
      required this.code,
      required this.name,
      this.lastAuditScore,
      this.lastAuditAt});

  final String id;
  final String code;
  final String name;
  final num? lastAuditScore;
  final String? lastAuditAt;

  /// How the area is written on the run, as the web writes it.
  String get location => code.isEmpty ? name : '$code - $name';

  factory FiveSZone.fromJson(Map<String, dynamic> json) => FiveSZone(
        id: json['id'] as String,
        code: json['code'] as String? ?? '',
        name: json['name'] as String? ?? '',
        lastAuditScore: json['lastAuditScore'] as num?,
        lastAuditAt: json['lastAuditAt'] as String?,
      );
}

class FiveSPlan {
  const FiveSPlan(
      {required this.id,
      required this.name,
      this.site = '',
      this.floor = '',
      this.zones = const [],
      this.auditTiers = const []});

  final String id;
  final String name;
  final String site;
  final String floor;
  final List<FiveSZone> zones;
  final List<AuditTier> auditTiers;

  String get heading =>
      [name, site, floor].where((part) => part.trim().isNotEmpty).join(' · ');

  factory FiveSPlan.fromJson(Map<String, dynamic> json) => FiveSPlan(
        id: json['id'] as String? ?? '',
        name: json['name'] as String? ?? '',
        site: json['site'] as String? ?? '',
        floor: json['floor'] as String? ?? '',
        zones: [
          for (final zone in (json['zones'] as List? ?? const []))
            if (zone is Map && zone['id'] is String)
              FiveSZone.fromJson(zone.cast<String, dynamic>())
        ],
        auditTiers: [
          for (final tier in (json['auditTiers'] as List? ?? const []))
            if (AuditTier.fromJson(tier) != null) AuditTier.fromJson(tier)!
        ],
      );
}

const _defaultMaxScore = 5;

/// The answers so far, by question id: a score as its number, yes/no as
/// `yes` or `no`, text as written.
typedef AuditAnswers = Map<String, String>;

/// The run's score as a rounded percentage. Text questions are not scored,
/// and a question not yet answered counts as nought.
int scoreAnswers(AuditTemplate? template, AuditAnswers answers) {
  if (template == null) return 0;
  var earned = 0.0;
  var possible = 0;
  for (final question in template.questions) {
    if (question.type == 'score') {
      possible += question.outOf;
      earned += double.tryParse(answers[question.id] ?? '') ?? 0;
    }
    if (question.type == 'yes_no') {
      possible += 1;
      earned += answers[question.id] == 'yes' ? 1 : 0;
    }
  }
  return possible == 0 ? 0 : (earned / possible * 100).round();
}

/// The answers as the server stores them: a number, a boolean or a string.
List<Map<String, dynamic>> answersForRun(
        AuditTemplate? template, AuditAnswers answers) =>
    [
      for (final question in template?.questions ?? const <AuditQuestion>[])
        {
          'questionId': question.id,
          'value': switch (question.type) {
            'score' => num.tryParse(answers[question.id] ?? '') ?? 0,
            'yes_no' => answers[question.id] == 'yes',
            _ => answers[question.id] ?? '',
          },
        }
    ];

/// Most senior first, as the server ranks them.
const memberRoles = [
  'super_admin',
  'organization_admin',
  'admin',
  'manager',
  'user',
  'viewer',
];

const defaultAuditTiers = [
  AuditTier(tier: 1, name: 'Operator', role: 'user', frequency: 'daily'),
  AuditTier(tier: 2, name: 'Supervisor', role: 'manager', frequency: 'weekly'),
  AuditTier(tier: 3, name: 'Manager', role: 'admin', frequency: 'monthly'),
];

List<AuditTier> readAuditTiers(List<AuditTier> tiers) => tiers.isEmpty
    ? defaultAuditTiers
    : ([...tiers]..sort((a, b) => a.tier.compareTo(b.tier)));

bool _covers(String? role, String? layerRole) {
  if (layerRole == null || layerRole.isEmpty) return true;
  final rank = memberRoles.indexOf(role ?? '');
  final needed = memberRoles.indexOf(layerRole);
  return rank >= 0 && needed >= 0 && rank <= needed;
}

/// The layers this role may record, closest to the work first.
List<AuditTier> tiersForRole(List<AuditTier> tiers, String? role) =>
    readAuditTiers(tiers).where((tier) => _covers(role, tier.role)).toList();

/// The layer recorded by default: the most senior one the person covers. A
/// supervisor holding the phone is doing the supervisor's check, and filing it
/// as the operator's would reset the wrong clock.
AuditTier? tierForRole(List<AuditTier> tiers, String? role) {
  final covered = tiersForRole(tiers, role);
  return covered.isEmpty ? null : covered.last;
}
