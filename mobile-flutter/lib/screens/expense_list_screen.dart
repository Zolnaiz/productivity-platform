import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/expense_model.dart';
import '../widgets/expense_card.dart';
import '../widgets/loading_indicator.dart';
import '../widgets/error_widget.dart' as custom;
import '../utils/constants.dart';
import '../themes/colors.dart';

class ExpenseListScreen extends StatefulWidget {
  const ExpenseListScreen({Key? key}) : super(key: key);

  @override
  State<ExpenseListScreen> createState() => _ExpenseListScreenState();
}

class _ExpenseListScreenState extends State<ExpenseListScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';
  ExpenseFilter _currentFilter = ExpenseFilter.all;
  ExpenseSort _currentSort = ExpenseSort.dateDesc;
  DateTimeRange? _dateRange;
  bool _isRefreshing = false;

  final List<Expense> _mockExpenses = [
    Expense(
      id: '1',
      userId: 'user1',
      organizationId: 'org1',
      title: 'Business Trip - Tokyo',
      description: 'Flight and accommodation for client meeting',
      amount: 1250.00,
      category: ExpenseCategory.travel,
      status: ExpenseStatus.approved,
      date: DateTime.now().subtract(const Duration(days: 3)),
      createdAt: DateTime.now().subtract(const Duration(days: 5)),
    ),
    Expense(
      id: '2',
      userId: 'user1',
      organizationId: 'org1',
      title: 'Team Lunch',
      description: 'Weekly team building lunch',
      amount: 320.50,
      category: ExpenseCategory.meals,
      status: ExpenseStatus.pending,
      date: DateTime.now().subtract(const Duration(days: 1)),
      createdAt: DateTime.now().subtract(const Duration(days: 2)),
    ),
    Expense(
      id: '3',
      userId: 'user1',
      organizationId: 'org1',
      title: 'Software Subscription',
      description: 'Annual license for design tools',
      amount: 899.99,
      category: ExpenseCategory.software,
      status: ExpenseStatus.paid,
      date: DateTime.now().subtract(const Duration(days: 30)),
      createdAt: DateTime.now().subtract(const Duration(days: 35)),
      approvedBy: 'admin1',
      approvedAt: DateTime.now().subtract(const Duration(days: 33)),
      paidBy: 'finance1',
      paidAt: DateTime.now().subtract(const Duration(days: 32)),
    ),
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _refreshData() async {
    setState(() => _isRefreshing = true);
    await Future.delayed(const Duration(seconds: 1)); // Mock API call
    setState(() => _isRefreshing = false);
  }

  List<Expense> _filterAndSortExpenses(List<Expense> expenses) {
    List<Expense> filtered = expenses;

    // Apply search filter
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((expense) {
        return expense.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            expense.description.toLowerCase().contains(_searchQuery.toLowerCase());
      }).toList();
    }

    // Apply status filter
    switch (_currentFilter) {
      case ExpenseFilter.pending:
        filtered = filtered.where((e) => e.status == ExpenseStatus.pending).toList();
        break;
      case ExpenseFilter.approved:
        filtered = filtered.where((e) => e.status == ExpenseStatus.approved).toList();
        break;
      case ExpenseFilter.paid:
        filtered = filtered.where((e) => e.status == ExpenseStatus.paid).toList();
        break;
      case ExpenseFilter.rejected:
        filtered = filtered.where((e) => e.status == ExpenseStatus.rejected).toList();
        break;
      case ExpenseFilter.all:
      default:
        break;
    }

    // Apply date range filter
    if (_dateRange != null) {
      filtered = filtered.where((expense) {
        return !expense.date.isBefore(_dateRange!.start) &&
            !expense.date.isAfter(_dateRange!.end);
      }).toList();
    }

    // Apply sorting
    switch (_currentSort) {
      case ExpenseSort.dateDesc:
        filtered.sort((a, b) => b.date.compareTo(a.date));
        break;
      case ExpenseSort.dateAsc:
        filtered.sort((a, b) => a.date.compareTo(b.date));
        break;
      case ExpenseSort.amountDesc:
        filtered.sort((a, b) => b.amount.compareTo(a.amount));
        break;
      case ExpenseSort.amountAsc:
        filtered.sort((a, b) => a.amount.compareTo(b.amount));
        break;
    }

    return filtered;
  }

  double _calculateTotal(List<Expense> expenses) {
    return expenses.fold(0.0, (sum, expense) => sum + expense.amount);
  }

  Future<void> _selectDateRange(BuildContext context) async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      initialDateRange: _dateRange,
    );
    
    if (picked != null) {
      setState(() => _dateRange = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    final expenses = _filterAndSortExpenses(_mockExpenses);
    final totalAmount = _calculateTotal(expenses);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Expenses'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              Navigator.pushNamed(context, '/expenses/create');
            },
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchAndFilters(),
          _buildSummaryCard(totalAmount, expenses.length),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _refreshData,
              child: _isRefreshing
                  ? const LoadingIndicator()
                  : _buildExpenseList(expenses),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.pushNamed(context, '/expenses/create');
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildSearchAndFilters() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(AppConstants.paddingMedium),
          child: TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search expenses...',
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
        ),
        _buildFilterRow(),
      ],
    );
  }

  Widget _buildFilterRow() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: AppConstants.paddingMedium),
      child: Row(
        children: [
          // Status filters
          ...ExpenseFilter.values.map((filter) {
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
          
          // Date range filter
          Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: ActionChip(
              label: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.calendar_today, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    _dateRange == null
                        ? 'All dates'
                        : '${DateFormat('MMM dd').format(_dateRange!.start)} - ${DateFormat('MMM dd').format(_dateRange!.end)}',
                  ),
                ],
              ),
              onPressed: () => _selectDateRange(context),
              backgroundColor: _dateRange == null
                  ? Colors.grey.shade200
                  : AppColors.primary.withOpacity(0.1),
            ),
          ),
          
          // Sort dropdown
          DropdownButtonHideUnderline(
            child: DropdownButton<ExpenseSort>(
              value: _currentSort,
              items: ExpenseSort.values.map((sort) {
                return DropdownMenuItem(
                  value: sort,
                  child: Text(_getSortLabel(sort)),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() => _currentSort = value);
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(double totalAmount, int count) {
    return Container(
      margin: const EdgeInsets.all(AppConstants.paddingMedium),
      padding: const EdgeInsets.all(AppConstants.paddingLarge),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(AppConstants.borderRadius),
        border: Border.all(color: AppColors.primary.withOpacity(0.1)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Total Expenses',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '\$${totalAmount.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Text(
                'Number of Expenses',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '$count',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildExpenseList(List<Expense> expenses) {
    if (expenses.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.receipt_long_outlined,
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
            if (_searchQuery.isNotEmpty || _currentFilter != ExpenseFilter.all)
              TextButton(
                onPressed: () {
                  setState(() {
                    _searchController.clear();
                    _searchQuery = '';
                    _currentFilter = ExpenseFilter.all;
                    _dateRange = null;
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
      itemCount: expenses.length,
      itemBuilder: (context, index) {
        final expense = expenses[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12.0),
          child: ExpenseCard(
            expense: expense,
            onTap: () {
              Navigator.pushNamed(
                context,
                '/expenses/${expense.id}',
              );
            },
            onMoreTap: () {
              _showExpenseOptions(expense);
            },
          ),
        );
      },
    );
  }

  void _showExpenseOptions(Expense expense) {
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
                  Navigator.pushNamed(
                    context,
                    '/expenses/${expense.id}',
                  );
                },
              ),
              if (expense.status == ExpenseStatus.pending)
                ListTile(
                  leading: const Icon(Icons.edit_outlined),
                  title: const Text('Edit'),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pushNamed(
                      context,
                      '/expenses/${expense.id}/edit',
                    );
                  },
                ),
              ListTile(
                leading: const Icon(Icons.attachment_outlined),
                title: const Text('View Attachments'),
                onTap: () {
                  Navigator.pop(context);
                  _viewAttachments(expense);
                },
              ),
              ListTile(
                leading: const Icon(Icons.receipt_outlined),
                title: const Text('Generate Receipt'),
                onTap: () {
                  Navigator.pop(context);
                  _generateReceipt(expense);
                },
              ),
              if (expense.status == ExpenseStatus.pending)
                ListTile(
                  leading: const Icon(Icons.delete_outline, color: Colors.red),
                  title: const Text(
                    'Delete',
                    style: TextStyle(color: Colors.red),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    _confirmDeleteExpense(expense);
                  },
                ),
            ],
          ),
        );
      },
    );
  }

  void _viewAttachments(Expense expense) {
    if (expense.attachments == null || expense.attachments!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No attachments available'),
        ),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Attachments'),
          content: SizedBox(
            width: double.maxFinite,
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: expense.attachments!.length,
              itemBuilder: (context, index) {
                return ListTile(
                  leading: const Icon(Icons.attach_file),
                  title: Text('Attachment ${index + 1}'),
                  onTap: () {
                    // Open attachment
                    Navigator.pop(context);
                  },
                );
              },
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }

  void _generateReceipt(Expense expense) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Generate Receipt'),
          content: const Text('Receipt will be generated and saved to your device.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Receipt generated successfully'),
                  ),
                );
              },
              child: const Text('Generate'),
            ),
          ],
        );
      },
    );
  }

  void _confirmDeleteExpense(Expense expense) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Delete Expense'),
          content: const Text(
            'Are you sure you want to delete this expense? '
            'This action cannot be undone.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                _deleteExpense(expense);
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

  void _deleteExpense(Expense expense) {
    // Mock delete
    setState(() {
      _mockExpenses.removeWhere((e) => e.id == expense.id);
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Expense deleted successfully'),
      ),
    );
  }

  String _getFilterLabel(ExpenseFilter filter) {
    switch (filter) {
      case ExpenseFilter.all:
        return 'All';
      case ExpenseFilter.pending:
        return 'Pending';
      case ExpenseFilter.approved:
        return 'Approved';
      case ExpenseFilter.paid:
        return 'Paid';
      case ExpenseFilter.rejected:
        return 'Rejected';
    }
  }

  String _getSortLabel(ExpenseSort sort) {
    switch (sort) {
      case ExpenseSort.dateDesc:
        return 'Date ↓';
      case ExpenseSort.dateAsc:
        return 'Date ↑';
      case ExpenseSort.amountDesc:
        return 'Amount ↓';
      case ExpenseSort.amountAsc:
        return 'Amount ↑';
    }
  }

  String _getEmptyStateMessage() {
    if (_searchQuery.isNotEmpty) {
      return 'No expenses found for "$_searchQuery"';
    }
    
    if (_currentFilter != ExpenseFilter.all) {
      return 'No ${_getFilterLabel(_currentFilter).toLowerCase()} expenses';
    }
    
    if (_dateRange != null) {
      return 'No expenses in selected date range';
    }
    
    return 'No expenses recorded';
  }
}

enum ExpenseFilter {
  all,
  pending,
  approved,
  paid,
  rejected,
}

enum ExpenseSort {
  dateDesc,
  dateAsc,
  amountDesc,
  amountAsc,
}