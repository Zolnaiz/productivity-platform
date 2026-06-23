import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import '../providers/auth_provider.dart';
import '../providers/questionnaire_provider.dart';
import '../models/questionnaire_model.dart';
import '../models/expense_model.dart';
import '../models/report_model.dart';
import '../widgets/questionnaire_card.dart';
import '../widgets/expense_card.dart';
import '../widgets/report_card.dart';
import '../widgets/kpi_card.dart';
import '../widgets/loading_indicator.dart';
import '../utils/constants.dart';
import '../themes/colors.dart';
import 'expense_list_screen.dart';
import 'profile_screen.dart';
import 'questionnaire_list_screen.dart';
import 'report_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;
  final PageController _pageController = PageController();
  late DateTimeRange _dateRange;

  @override
  void initState() {
    super.initState();
    _dateRange = DateTimeRange(
      start: DateTime.now().subtract(const Duration(days: 30)),
      end: DateTime.now(),
    );
    _loadData();
  }

  Future<void> _loadData() async {
    final questionnaireProvider = Provider.of<QuestionnaireProvider>(
      context,
      listen: false,
    );
    await questionnaireProvider.fetchQuestionnaires();
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
    _pageController.jumpToPage(index);
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  Widget _buildDashboardTab() {
    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(AppConstants.paddingLarge),
              child: Column(
                children: [
                  _buildWelcomeSection(),
                  const SizedBox(height: 20),
                  _buildKpiSection(),
                  const SizedBox(height: 20),
                  _buildRecentQuestionnaires(),
                  const SizedBox(height: 20),
                  _buildRecentExpenses(),
                  const SizedBox(height: 20),
                  _buildQuickActions(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeSection() {
    final authProvider = Provider.of<AuthProvider>(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primary.withOpacity(0.1),
            AppColors.secondary.withOpacity(0.1),
          ],
        ),
        borderRadius: BorderRadius.circular(AppConstants.borderRadius),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Hello, ${authProvider.user?.firstName ?? 'User'}!',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            DateFormat('EEEE, MMMM d, y').format(DateTime.now()),
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Welcome back to Productivity Platform',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKpiSection() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      childAspectRatio: 1.05,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      children: [
        KpiCard(
          title: 'Pending Questionnaires',
          value: '5',
          icon: Icons.assignment_outlined,
          color: Colors.blue,
          onTap: () => _onItemTapped(1),
        ),
        KpiCard(
          title: 'Expenses This Month',
          value: '\$1,250',
          icon: Icons.attach_money_outlined,
          color: Colors.green,
          onTap: () => _onItemTapped(2),
        ),
        KpiCard(
          title: 'Response Rate',
          value: '78%',
          icon: Icons.trending_up_outlined,
          color: Colors.orange,
          onTap: () => _onItemTapped(1),
        ),
        KpiCard(
          title: 'Reports Generated',
          value: '12',
          icon: Icons.description_outlined,
          color: Colors.purple,
          onTap: () => _onItemTapped(3),
        ),
      ],
    );
  }

  Widget _buildRecentQuestionnaires() {
    final questionnaireProvider = Provider.of<QuestionnaireProvider>(context);

    if (questionnaireProvider.isLoading) {
      return const LoadingIndicator();
    }

    if (questionnaireProvider.questionnaires.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(AppConstants.borderRadius),
        ),
        child: Column(
          children: [
            Icon(
              Icons.assignment_outlined,
              size: 60,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 12),
            const Text(
              'No questionnaires yet',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Create your first questionnaire to get started',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _onItemTapped(1),
              child: const Text('Create Questionnaire'),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Recent Questionnaires',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            TextButton(
              onPressed: () => _onItemTapped(1),
              child: const Text('View All'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...questionnaireProvider.questionnaires
            .take(3)
            .map((questionnaire) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: QuestionnaireCard(
                    questionnaire: questionnaire,
                    onTap: () => context.push(
                      '/questionnaires/${questionnaire.id}',
                    ),
                  ),
                ))
            .toList(),
      ],
    );
  }

  Widget _buildRecentExpenses() {
    final List<Expense> recentExpenses = []; // Mock data

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Recent Expenses',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            TextButton(
              onPressed: () => _onItemTapped(2),
              child: const Text('View All'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (recentExpenses.isEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(AppConstants.borderRadius),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.receipt_long_outlined,
                  size: 60,
                  color: Colors.grey.shade400,
                ),
                const SizedBox(height: 12),
                const Text(
                  'No expenses recorded',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Add your first expense to track spending',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => context.push('/expenses/new'),
                  child: const Text('Add Expense'),
                ),
              ],
            ),
          )
        else
          ...recentExpenses
              .take(3)
              .map((expense) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: ExpenseCard(
                      expense: expense,
                      onTap: () => _onItemTapped(2),
                    ),
                  ))
              .toList(),
      ],
    );
  }

  Widget _buildQuickActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Actions',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          childAspectRatio: 2.5,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          children: [
            _buildQuickActionButton(
              icon: Icons.add,
              label: 'New Questionnaire',
              onTap: () => _onItemTapped(1),
            ),
            _buildQuickActionButton(
              icon: Icons.receipt_long,
              label: 'Add Expense',
              onTap: () => context.push('/expenses/new'),
            ),
            _buildQuickActionButton(
              icon: Icons.description,
              label: 'Generate Report',
              onTap: () => _onItemTapped(3),
            ),
            _buildQuickActionButton(
              icon: Icons.share,
              label: 'Share Data',
              onTap: () => SharePlus.instance.share(
                ShareParams(
                  text: 'Productivity Platform dashboard',
                  subject: 'Productivity Platform',
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return ElevatedButton(
      onPressed: onTap,
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppConstants.borderRadius),
          side: BorderSide(color: Colors.grey.shade300),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontSize: 14),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionnairesTab() {
    return const QuestionnaireListScreen();
  }

  Widget _buildExpensesTab() {
    return const ExpenseListScreen();
  }

  Widget _buildReportsTab() {
    return const ReportScreen();
  }

  Widget _buildProfileTab() {
    return const ProfileScreen();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _selectedIndex == 0
          ? AppBar(
              title: const Text('Dashboard'),
              actions: [
                IconButton(
                  icon: const Icon(Icons.notifications_outlined),
                  tooltip: 'Notifications',
                  onPressed: () => _showMessage('No new notifications'),
                ),
                IconButton(
                  icon: const Icon(Icons.search),
                  tooltip: 'Search forms',
                  onPressed: () => _onItemTapped(1),
                ),
                PopupMenuButton<String>(
                  onSelected: (value) {
                    switch (value) {
                      case 'settings':
                        context.push('/settings');
                        break;
                      case 'help':
                        _showMessage(
                            'Support information will be available soon');
                        break;
                      case 'logout':
                        Provider.of<AuthProvider>(context, listen: false)
                            .logout();
                        break;
                    }
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'settings',
                      child: Row(
                        children: [
                          Icon(Icons.settings_outlined, size: 20),
                          SizedBox(width: 8),
                          Text('Settings'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'help',
                      child: Row(
                        children: [
                          Icon(Icons.help_outline, size: 20),
                          SizedBox(width: 8),
                          Text('Help & Support'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'logout',
                      child: Row(
                        children: [
                          Icon(Icons.logout_outlined, size: 20),
                          SizedBox(width: 8),
                          Text('Logout'),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            )
          : null,
      body: PageView(
        controller: _pageController,
        onPageChanged: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        children: [
          _buildDashboardTab(),
          _buildQuestionnairesTab(),
          _buildExpensesTab(),
          _buildReportsTab(),
          _buildProfileTab(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment_outlined),
            activeIcon: Icon(Icons.assignment),
            label: 'Forms',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            activeIcon: Icon(Icons.receipt_long),
            label: 'Expenses',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.description_outlined),
            activeIcon: Icon(Icons.description),
            label: 'Reports',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outlined),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
