import 'package:flutter/foundation.dart';

class Organization {
  final String id;
  final String name;
  final String? description;
  final DateTime createdAt;
  final int memberCount;
  final String? logoUrl;
  final List<String> features;

  Organization({
    required this.id,
    required this.name,
    this.description,
    required this.createdAt,
    required this.memberCount,
    this.logoUrl,
    this.features = const [],
  });

  factory Organization.fromJson(Map<String, dynamic> json) {
    return Organization(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      createdAt: DateTime.parse(json['createdAt']),
      memberCount: json['memberCount'] ?? 0,
      logoUrl: json['logoUrl'],
      features: List<String>.from(json['features'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'createdAt': createdAt.toIso8601String(),
      'memberCount': memberCount,
      'logoUrl': logoUrl,
      'features': features,
    };
  }
}