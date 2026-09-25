/// One entry in somebody's record of their day.
///
/// The server keeps it next to the clock entry that measures it, so the hours
/// here are the ones the monthly report counts.
class WorkLog {
  const WorkLog({
    required this.id,
    required this.summary,
    required this.logDate,
    this.hours = 0,
    this.taskId,
    this.blockers,
    this.nextSteps,
  });

  final String id;
  final String summary;

  /// The day it is about, as YYYY-MM-DD — not when it was typed.
  final String logDate;
  final double hours;
  final String? taskId;
  final String? blockers;
  final String? nextSteps;

  factory WorkLog.fromJson(Map<String, dynamic> json) => WorkLog(
        id: json['id'] as String,
        summary: json['summary'] as String? ?? '',
        logDate: (json['logDate'] as String? ?? '').split('T').first,
        // Numeric columns arrive as strings from PostgreSQL.
        hours: double.tryParse('${json['hours'] ?? 0}') ?? 0,
        taskId: json['taskId'] as String?,
        blockers: json['blockers'] as String?,
        nextSteps: json['nextSteps'] as String?,
      );
}

/// The calendar day on the phone, as YYYY-MM-DD.
///
/// The phone's own day rather than UTC: somebody in Ulaanbaatar writing up
/// their morning at 07:30 is writing about today, which UTC still calls
/// yesterday.
String localDay(DateTime moment) {
  final local = moment.toLocal();
  String two(int value) => value.toString().padLeft(2, '0');
  return '${local.year}-${two(local.month)}-${two(local.day)}';
}
