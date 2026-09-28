import 'package:flutter/foundation.dart';

import '../services/api_service.dart';
import '../services/outbox.dart';

/// One idea in the organization's idea box.
class Idea {
  const Idea({
    required this.id,
    required this.title,
    this.description = '',
    this.area = '',
    this.benefit = '',
    this.status = 'submitted',
    this.reviewNote = '',
    this.authorId,
    this.createdAt,
  });

  final String id;
  final String title;
  final String description;
  final String area;
  final String benefit;

  /// submitted, approved, done or declined.
  final String status;
  final String reviewNote;
  final String? authorId;
  final String? createdAt;

  factory Idea.fromJson(Map<String, dynamic> json) => Idea(
        id: json['id'] as String? ?? '',
        title: json['title'] as String? ?? '',
        description: json['description'] as String? ?? '',
        area: json['area'] as String? ?? '',
        benefit: json['benefit'] as String? ?? '',
        status: json['status'] as String? ?? 'submitted',
        reviewNote: json['reviewNote'] as String? ?? '',
        authorId: json['authorId'] as String?,
        createdAt: json['createdAt'] as String?,
      );
}

/// The idea box, from the phone.
///
/// The person with the idea is on the floor, looking at the thing that could
/// be better. Putting it in has to take less time than forgetting it: a line,
/// where, and a photograph of how it is now.
class IdeaProvider extends ChangeNotifier {
  IdeaProvider(this._api, {this.outbox});

  final ApiService _api;
  final Outbox? outbox;

  List<Idea> ideas = [];
  bool loading = false;
  bool saving = false;
  bool lastKept = false;
  Object? error;

  Future<void> load() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      ideas = (await _api.getIdeas()).map(Idea.fromJson).toList();
    } catch (e) {
      error = e;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  /// Puts an idea in. Returns it, or null when it was not saved; an idea
  /// kept on the phone comes back without an id, so no photograph yet.
  Future<Idea?> submit(
      {required String title,
      String description = '',
      String area = '',
      String benefit = ''}) async {
    saving = true;
    error = null;
    lastKept = false;
    notifyListeners();
    final body = {
      'title': title,
      if (description.isNotEmpty) 'description': description,
      if (area.isNotEmpty) 'area': area,
      if (benefit.isNotEmpty) 'benefit': benefit,
    };
    try {
      final idea = Idea.fromJson(await _api.createIdea(body));
      ideas = [idea, ...ideas];
      return idea;
    } catch (e) {
      if (outbox != null && neverSent(e)) {
        await outbox!.keep(method: 'POST', path: '/ideas', kind: 'idea', data: body);
        lastKept = true;
        final kept = Idea(
            id: '', title: title, description: description, area: area, benefit: benefit);
        ideas = [kept, ...ideas];
        return kept;
      }
      error = e;
      return null;
    } finally {
      saving = false;
      notifyListeners();
    }
  }

  /// The photograph of how it is now.
  Future<bool> addBeforePhoto(Idea idea,
      {required List<int> bytes, required String fileName}) async {
    if (idea.id.isEmpty) return false;
    try {
      await _api.uploadAttachment(
          ownerType: 'idea',
          ownerId: idea.id,
          bytes: bytes,
          fileName: fileName,
          kind: 'before');
      return true;
    } catch (e) {
      error = e;
      notifyListeners();
      return false;
    }
  }
}
