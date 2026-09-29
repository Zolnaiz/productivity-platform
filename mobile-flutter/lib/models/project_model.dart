/// A project that the signed-in person can link their daily work to.
class Project {
  const Project({required this.id, required this.name});

  final String id;
  final String name;

  factory Project.fromJson(Map<String, dynamic> json) => Project(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
      );
}
