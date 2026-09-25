class Task {
  const Task({
    required this.id,
    required this.title,
    required this.status,
    this.titleKey,
    this.titleParams = const {},
    this.description,
    this.priority = 'medium',
    this.dueDate,
    this.assigneeId,
  });

  final String id;
  final String title;
  final String status;
  final String? titleKey;
  final Map<String, dynamic> titleParams;
  final String? description;
  final String priority;
  final DateTime? dueDate;
  final String? assigneeId;

  factory Task.fromJson(Map<String, dynamic> json) => Task(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        titleKey: json['titleKey'] as String?,
        titleParams:
            (json['titleParams'] as Map?)?.cast<String, dynamic>() ?? const {},
        status: json['status'] as String? ?? 'backlog',
        description: json['description'] as String?,
        priority: json['priority'] as String? ?? 'medium',
        dueDate: DateTime.tryParse(json['dueDate'] as String? ?? ''),
        assigneeId: json['assigneeId'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'titleKey': titleKey,
        'titleParams': titleParams,
        'status': status,
        'description': description,
        'priority': priority,
        'dueDate': dueDate?.toIso8601String(),
        'assigneeId': assigneeId,
      };

  Task copyWith({String? status}) => Task(
        id: id,
        title: title,
        titleKey: titleKey,
        titleParams: titleParams,
        status: status ?? this.status,
        description: description,
        priority: priority,
        dueDate: dueDate,
        assigneeId: assigneeId,
      );
}
