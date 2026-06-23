import 'dart:convert';

class User {
  final String id;
  final String email;
  final String username;
  final String fullName;
  final String role;
  final bool isActive;
  final DateTime? lastLoginAt;
  final String? phoneNumber;
  final String? avatarUrl;
  final DateTime createdAt;
  final DateTime updatedAt;

  User({
    required this.id,
    required this.email,
    required this.username,
    required this.fullName,
    required this.role,
    required this.isActive,
    this.lastLoginAt,
    this.phoneNumber,
    this.avatarUrl,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    final email = json['email'] as String? ?? '';
    final createdAt = DateTime.tryParse(json['createdAt'] as String? ?? '');

    return User(
      id: json['id'] as String? ?? '',
      email: email,
      username: json['username'] as String? ??
          (email.contains('@') ? email.split('@').first : email),
      fullName: json['fullName'] as String? ??
          [json['firstName'], json['lastName']]
              .whereType<String>()
              .join(' ')
              .trim(),
      role: json['role'] as String? ?? 'user',
      isActive: json['isActive'] ?? true,
      lastLoginAt: json['lastLoginAt'] != null
          ? DateTime.tryParse(json['lastLoginAt'] as String)
          : null,
      phoneNumber: json['phoneNumber'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      createdAt: createdAt ?? DateTime.fromMillisecondsSinceEpoch(0),
      updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? '') ??
          createdAt ??
          DateTime.fromMillisecondsSinceEpoch(0),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'username': username,
      'fullName': fullName,
      'role': role,
      'isActive': isActive,
      'lastLoginAt': lastLoginAt?.toIso8601String(),
      'phoneNumber': phoneNumber,
      'avatarUrl': avatarUrl,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  User copyWith({
    String? id,
    String? email,
    String? username,
    String? fullName,
    String? role,
    bool? isActive,
    DateTime? lastLoginAt,
    String? phoneNumber,
    String? avatarUrl,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      username: username ?? this.username,
      fullName: fullName ?? this.fullName,
      role: role ?? this.role,
      isActive: isActive ?? this.isActive,
      lastLoginAt: lastLoginAt ?? this.lastLoginAt,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  String toString() {
    return 'User(id: $id, email: $email, fullName: $fullName, role: $role)';
  }

  static List<User> fromList(List<dynamic> list) {
    return list.map((e) => User.fromJson(e)).toList();
  }

  String toJsonString() {
    return json.encode(toJson());
  }

  static User fromJsonString(String jsonString) {
    return User.fromJson(json.decode(jsonString));
  }

  bool get isSuperAdmin => role == 'super_admin';
  bool get isOrganizationAdmin => role == 'organization_admin';
  bool get isRegularUser => role == 'user';

  String get displayName => fullName.isNotEmpty ? fullName : username;
  String get firstName => fullName.trim().split(' ').first;
  String get lastName {
    final parts = fullName.trim().split(' ');
    return parts.length > 1 ? parts.sublist(1).join(' ') : '';
  }

  String? get phone => phoneNumber;
  String? get position => null;
  String? get department => null;
  String? get organization => null;
  String? get profileImageUrl => avatarUrl;
  DateTime? get lastLogin => lastLoginAt;

  String get initials {
    if (fullName.isNotEmpty) {
      final parts = fullName.split(' ');
      if (parts.length > 1) {
        return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
      }
      return fullName[0].toUpperCase();
    }
    return username[0].toUpperCase();
  }
}
