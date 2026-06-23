import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/questionnaire_provider.dart';
import '../models/questionnaire_model.dart';
import '../widgets/questionnaire_card.dart';
import '../widgets/loading_indicator.dart';
import '../widgets/error_widget.dart' as custom;
import '../utils/constants.dart';
import '../themes/colors.dart';

class QuestionnaireListScreen extends StatefulWidget {
  const QuestionnaireListScreen({Key? key}) : super(key: key);

  @override
  State<QuestionnaireListScreen> createState() =>
      _QuestionnaireListScreenState();
}

class _QuestionnaireListScreenState extends State<QuestionnaireListScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';
  QuestionnaireFilter _currentFilter = QuestionnaireFilter.all;
  bool _isRefreshing = false;

  void _showUnavailable(String feature) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text('$feature is not available yet')));
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadQuestionnaires();
    });
  }

  Future<void> _loadQuestionnaires() async {
    final provider = Provider.of<QuestionnaireProvider>(context, listen: false);
    await provider.fetchQuestionnaires();
  }

  Future<void> _refreshData() async {
    setState(() => _isRefreshing = true);
    await _loadQuestionnaires();
    setState(() => _isRefreshing = false);
  }

  List<Questionnaire> _filterQuestionnaires(
      List<Questionnaire> questionnaires) {
    List<Questionnaire> filtered = questionnaires;

    // Apply search filter
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((q) {
        return q.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            (q.description?.toLowerCase() ?? '')
                .contains(_searchQuery.toLowerCase());
      }).toList();
    }

    // Apply status filter
    switch (_currentFilter) {
      case QuestionnaireFilter.active:
        filtered = filtered.where((q) => q.isActive).toList();
        break;
      case QuestionnaireFilter.expired:
        filtered = filtered
            .where((q) =>
                q.expiresAt != null && q.expiresAt!.isBefore(DateTime.now()))
            .toList();
        break;
      case QuestionnaireFilter.completed:
        filtered = filtered.where((q) => q.responseCount > 0).toList();
        break;
      case QuestionnaireFilter.all:
      default:
        break;
    }

    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Questionnaires'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'New questionnaire',
            onPressed: () => _showUnavailable('Questionnaire creation'),
          ),
        ],
      ),
      body: Consumer<QuestionnaireProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && !_isRefreshing) {
            return const LoadingIndicator();
          }

          if (provider.error != null) {
            return custom.ErrorWidget(
              message: provider.error!,
              onRetry: _loadQuestionnaires,
            );
          }

          final questionnaires = _filterQuestionnaires(provider.questionnaires);

          return Column(
            children: [
              _buildSearchBar(),
              _buildFilterChips(),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: _refreshData,
                  child: _buildQuestionnaireList(questionnaires),
                ),
              ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showUnavailable('Questionnaire creation'),
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Search questionnaires...',
          prefixIcon: const Icon(Icons.search),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    setState(() => _searchQuery = '');
                  },
                )
              : null,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppConstants.borderRadius),
          ),
        ),
        onChanged: (value) {
          setState(() => _searchQuery = value);
        },
      ),
    );
  }

  Widget _buildFilterChips() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding:
          const EdgeInsets.symmetric(horizontal: AppConstants.paddingMedium),
      child: Row(
        children: QuestionnaireFilter.values.map((filter) {
          return Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: FilterChip(
              label: Text(_getFilterLabel(filter)),
              selected: _currentFilter == filter,
              onSelected: (selected) {
                setState(() => _currentFilter = filter);
              },
              selectedColor: AppColors.primary.withOpacity(0.2),
              checkmarkColor: AppColors.primary,
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildQuestionnaireList(List<Questionnaire> questionnaires) {
    if (questionnaires.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.assignment_outlined,
              size: 80,
              color: Colors.grey.shade300,
            ),
            const SizedBox(height: 16),
            Text(
              _getEmptyStateMessage(),
              style: const TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 8),
            if (_searchQuery.isNotEmpty ||
                _currentFilter != QuestionnaireFilter.all)
              TextButton(
                onPressed: () {
                  setState(() {
                    _searchController.clear();
                    _searchQuery = '';
                    _currentFilter = QuestionnaireFilter.all;
                  });
                },
                child: const Text('Clear filters'),
              ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      itemCount: questionnaires.length,
      itemBuilder: (context, index) {
        final questionnaire = questionnaires[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12.0),
          child: QuestionnaireCard(
            questionnaire: questionnaire,
            onTap: () => context.push('/questionnaires/${questionnaire.id}'),
            onMoreTap: () {
              _showQuestionnaireOptions(questionnaire);
            },
          ),
        );
      },
    );
  }

  void _showQuestionnaireOptions(Questionnaire questionnaire) {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.visibility_outlined),
                title: const Text('View Details'),
                onTap: () {
                  Navigator.pop(context);
                  this.context.push('/questionnaires/${questionnaire.id}');
                },
              ),
              ListTile(
                leading: const Icon(Icons.edit_outlined),
                title: const Text('Edit'),
                onTap: () {
                  Navigator.pop(context);
                  _showUnavailable('Questionnaire editing');
                },
              ),
              if (questionnaire.isActive)
                ListTile(
                  leading: const Icon(Icons.share_outlined),
                  title: const Text('Share'),
                  onTap: () {
                    Navigator.pop(context);
                    _shareQuestionnaire(questionnaire);
                  },
                ),
              ListTile(
                leading: const Icon(Icons.bar_chart_outlined),
                title: const Text('View Responses'),
                onTap: () {
                  Navigator.pop(context);
                  _showUnavailable('Questionnaire responses');
                },
              ),
              ListTile(
                leading: Icon(
                  questionnaire.isActive
                      ? Icons.pause_circle_outline
                      : Icons.play_circle_outline,
                ),
                title: Text(
                  questionnaire.isActive ? 'Pause' : 'Activate',
                ),
                onTap: () {
                  Navigator.pop(context);
                  _toggleQuestionnaireStatus(questionnaire);
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.delete_outline, color: Colors.red),
                title: const Text(
                  'Delete',
                  style: TextStyle(color: Colors.red),
                ),
                onTap: () {
                  Navigator.pop(context);
                  _confirmDeleteQuestionnaire(questionnaire);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _shareQuestionnaire(Questionnaire questionnaire) {
    // Implement sharing logic
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Share Questionnaire'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Share this questionnaire with others'),
              const SizedBox(height: 16),
              TextField(
                decoration: const InputDecoration(
                  labelText: 'Share Link',
                  border: OutlineInputBorder(),
                ),
                readOnly: true,
                controller: TextEditingController(
                  text:
                      'https://app.example.com/questionnaires/${questionnaire.id}',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                // Copy to clipboard
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Link copied to clipboard'),
                  ),
                );
              },
              child: const Text('Copy Link'),
            ),
          ],
        );
      },
    );
  }

  void _toggleQuestionnaireStatus(Questionnaire questionnaire) async {
    final provider = Provider.of<QuestionnaireProvider>(context, listen: false);

    try {
      // Call API to toggle status
      await Future.delayed(const Duration(seconds: 1)); // Mock API call

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            questionnaire.isActive
                ? 'Questionnaire paused'
                : 'Questionnaire activated',
          ),
        ),
      );

      _refreshData();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _confirmDeleteQuestionnaire(Questionnaire questionnaire) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Delete Questionnaire'),
          content: const Text(
            'Are you sure you want to delete this questionnaire? '
            'This action cannot be undone.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () async {
                Navigator.pop(context);
                await _deleteQuestionnaire(questionnaire);
              },
              child: const Text(
                'Delete',
                style: TextStyle(color: Colors.red),
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _deleteQuestionnaire(Questionnaire questionnaire) async {
    final provider = Provider.of<QuestionnaireProvider>(context, listen: false);

    try {
      // Call API to delete
      await Future.delayed(const Duration(seconds: 1)); // Mock API call

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Questionnaire deleted successfully'),
        ),
      );

      _refreshData();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error deleting questionnaire: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  String _getFilterLabel(QuestionnaireFilter filter) {
    switch (filter) {
      case QuestionnaireFilter.all:
        return 'All';
      case QuestionnaireFilter.active:
        return 'Active';
      case QuestionnaireFilter.expired:
        return 'Expired';
      case QuestionnaireFilter.completed:
        return 'Completed';
    }
  }

  String _getEmptyStateMessage() {
    if (_searchQuery.isNotEmpty) {
      return 'No questionnaires found for "$_searchQuery"';
    }

    switch (_currentFilter) {
      case QuestionnaireFilter.active:
        return 'No active questionnaires';
      case QuestionnaireFilter.expired:
        return 'No expired questionnaires';
      case QuestionnaireFilter.completed:
        return 'No completed questionnaires';
      case QuestionnaireFilter.all:
      default:
        return 'No questionnaires yet';
    }
  }
}

enum QuestionnaireFilter {
  all,
  active,
  expired,
  completed,
}
