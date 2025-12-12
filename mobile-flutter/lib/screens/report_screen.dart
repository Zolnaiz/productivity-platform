import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/report_model.dart';
import '../widgets/report_card.dart';
import '../widgets/loading_indicator.dart';
import '../utils/constants.dart';
import '../themes/colors.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({Key? key}) : super(key: key);

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  ReportType _selectedType = ReportType.questionnaireSummary;
  DateTime? _startDate;
  DateTime? _endDate;
  bool _isGenerating = false;
  bool _showGenerated = false;

  final List<Report> _availableReports = [
    Report(
      id: '1',
      title: 'Monthly Questionnaire Summary',
      description: 'Summary of all questionnaire responses for November 2024',
      type: ReportType.questionnaireSummary,
      organizationId: 'org1',
      generatedBy: 'John Doe',
      generatedAt: DateTime.now().subtract(const Duration(days: 2)),
      startDate: DateTime(2024, 11, 1),
      endDate: DateTime(2024, 11, 30),
      parameters: {
        'includeCharts': true,
        'breakdownByDepartment': true,
      },
      format: ReportFormat.pdf,
      downloadUrl: 'https://example.com/reports/1.pdf',
      fileSize: 2456789,
      summary: {
        'totalResponses': 1567,
        'completionRate': 78.5,
        'averageTime': '12.3 minutes',
      },
    ),
    Report(
      id: '2',
      title: 'Q3 Expense Report',
      description: 'Quarterly expense breakdown and analysis',
      type: ReportType.expenseSummary,
      organizationId: 'org1',
      generatedBy: 'Jane Smith',
      generatedAt: DateTime.now().subtract(const Duration(days: 5)),
      startDate: DateTime(2024, 7, 1),
      endDate: DateTime(2024, 9, 30),
      parameters: {
        'categories': ['travel', 'meals', 'equipment'],
        'includeVAT': true,
      },
      format: ReportFormat.excel,
      downloadUrl: 'https://example.com/reports/2.xlsx',
      fileSize: 3456789,
      summary: {
        'totalExpenses': 24567.89,
        'largestCategory': 'Travel',
        'savingsVsBudget': 12.3,
      },
    ),
    Report(
      id: '3',
      title: 'User Activity Dashboard',
      description: 'User engagement and activity metrics',
      type: ReportType.userActivity,
      organizationId: 'org1',
      generatedBy: 'System',
      generatedAt: DateTime.now().subtract(const Duration(days: 1)),
      startDate: DateTime(2024, 11, 1),
      endDate: DateTime.now(),
      parameters: {
        'metrics': ['logins', 'responses', 'expenses'],
        'frequency': 'daily',
      },
      format: ReportFormat.pdf,
      downloadUrl: 'https://example.com/reports/3.pdf',
      fileSize: 1567890,
      summary: {
        'activeUsers': 234,
        'averageSessions': 3.2,
        'peakActivity': '10:00 AM',
      },
    ),
  ];

  final List<Report> _generatedReports = [];

  Future<void> _generateReport() async {
    if (_startDate == null || _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select start and end dates'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isGenerating = true);

    // Mock API call
    await Future.delayed(const Duration(seconds: 2));

    final newReport = Report(
      id: '${DateTime.now().millisecondsSinceEpoch}',
      title: '${_getReportTypeLabel(_selectedType)} Report',
      description: 'Generated report for ${DateFormat('MMM dd, yyyy').format(_startDate!)} - ${DateFormat('MMM dd, yyyy').format(_endDate!)}',
      type: _selectedType,
      organizationId: 'org1',
      generatedBy: 'Current User',
      generatedAt: DateTime.now(),
      startDate: _startDate,
      endDate: _endDate,
      parameters: {
        'reportType': _selectedType.toString(),
        'dateRange': {
          'start': _startDate!.toIso8601String(),
          'end': _endDate!.toIso8601String(),
        },
      },
      format: ReportFormat.pdf,
      downloadUrl: 'https://example.com/reports/${DateTime.now().millisecondsSinceEpoch}.pdf',
      fileSize: 1234567,
      summary: {
        'generatedAt': DateTime.now().toIso8601String(),
        'status': 'completed',
      },
    );

    setState(() {
      _generatedReports.insert(0, newReport);
      _isGenerating = false;
      _showGenerated = true;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Report generated successfully'),
      ),
    );
  }

  Future<void> _selectStartDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _startDate ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    
    if (picked != null) {
      setState(() => _startDate = picked);
    }
  }

  Future<void> _selectEndDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _endDate ?? DateTime.now(),
      firstDate: _startDate ?? DateTime(2020),
      lastDate: DateTime(2030),
    );
    
    if (picked != null) {
      setState(() => _endDate = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Reports'),
          bottom: TabBar(
            tabs: const [
              Tab(text: 'Generate'),
              Tab(text: 'History'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildGenerateTab(),
            _buildHistoryTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildGenerateTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppConstants.paddingLarge),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Generate New Report',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),
          _buildReportTypeSelector(),
          const SizedBox(height: 24),
          _buildDateRangeSelector(),
          const SizedBox(height: 32),
          _buildFormatSelector(),
          const SizedBox(height: 32),
          _buildGenerateButton(),
          const SizedBox(height: 32),
          if (_showGenerated) _buildGeneratedReports(),
        ],
      ),
    );
  }

  Widget _buildReportTypeSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Report Type',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: ReportType.values.map((type) {
            return ChoiceChip(
              label: Text(_getReportTypeLabel(type)),
              selected: _selectedType == type,
              onSelected: (selected) {
                setState(() => _selectedType = type);
              },
              selectedColor: AppColors.primary.withOpacity(0.2),
            );
          }).toList(),
        ),
        const SizedBox(height: 8),
        Text(
          _getReportTypeDescription(_selectedType),
          style: const TextStyle(
            fontSize: 14,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }

  Widget _buildDateRangeSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Date Range',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildDatePicker(
                label: 'Start Date',
                date: _startDate,
                onTap: () => _selectStartDate(context),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildDatePicker(
                label: 'End Date',
                date: _endDate,
                onTap: () => _selectEndDate(context),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (_startDate != null && _endDate != null)
          Text(
            'Selected: ${DateFormat('MMM dd, yyyy').format(_startDate!)} - ${DateFormat('MMM dd, yyyy').format(_endDate!)}',
            style: const TextStyle(
              fontSize: 14,
              color: Colors.grey,
            ),
          ),
      ],
    );
  }

  Widget _buildDatePicker({
    required String label,
    required DateTime? date,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(AppConstants.borderRadius),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              date == null
                  ? 'Select date'
                  : DateFormat('MMM dd, yyyy').format(date),
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormatSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Export Format',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: ReportFormat.values.map((format) {
            return Expanded(
              child: RadioListTile<ReportFormat>(
                title: Text(_getFormatLabel(format)),
                value: format,
                groupValue: ReportFormat.pdf, // Default to PDF
                onChanged: (value) {
                  // Handle format change
                },
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildGenerateButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isGenerating ? null : _generateReport,
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppConstants.borderRadius),
          ),
        ),
        child: _isGenerating
            ? const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(width: 12),
                  Text('Generating...'),
                ],
              )
            : const Text(
                'Generate Report',
                style: TextStyle(fontSize: 16),
              ),
      ),
    );
  }

  Widget _buildGeneratedReports() {
    if (_generatedReports.isEmpty) {
      return Container();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Recently Generated',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        ..._generatedReports.take(3).map((report) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: ReportCard(
              report: report,
              onTap: () {
                _viewReportDetails(report);
              },
            ),
          );
        }).toList(),
      ],
    );
  }

  Widget _buildHistoryTab() {
    return RefreshIndicator(
      onRefresh: () async {
        await Future.delayed(const Duration(seconds: 1));
      },
      child: _availableReports.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.description_outlined,
                    size: 80,
                    color: Colors.grey.shade300,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'No reports available',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Generate your first report to see it here',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(AppConstants.paddingMedium),
              itemCount: _availableReports.length,
              itemBuilder: (context, index) {
                final report = _availableReports[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: ReportCard(
                    report: report,
                    onTap: () {
                      _viewReportDetails(report);
                    },
                  ),
                );
              },
            ),
    );
  }

  void _viewReportDetails(Report report) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return SingleChildScrollView(
          child: Container(
            padding: const EdgeInsets.all(AppConstants.paddingLarge),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      report.title,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                if (report.description != null)
                  Text(
                    report.description!,
                    style: const TextStyle(
                      fontSize: 16,
                      color: Colors.grey,
                    ),
                  ),
                const SizedBox(height: 24),
                _buildDetailRow('Type', _getReportTypeLabel(report.type)),
                _buildDetailRow('Format', _getFormatLabel(report.format)),
                _buildDetailRow(
                  'Generated',
                  DateFormat('MMM dd, yyyy HH:mm').format(report.generatedAt),
                ),
                if (report.startDate != null && report.endDate != null)
                  _buildDetailRow(
                    'Date Range',
                    '${DateFormat('MMM dd, yyyy').format(report.startDate!)} - ${DateFormat('MMM dd, yyyy').format(report.endDate!)}',
                  ),
                if (report.generatedBy != null)
                  _buildDetailRow('Generated By', report.generatedBy!),
                if (report.fileSize != null)
                  _buildDetailRow(
                    'File Size',
                    '${(report.fileSize! / 1024 / 1024).toStringAsFixed(2)} MB',
                  ),
                const SizedBox(height: 24),
                if (report.summary != null) ...[
                  const Text(
                    'Summary',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(AppConstants.borderRadius),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: report.summary!.entries.map((entry) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                entry.key,
                                style: const TextStyle(fontSize: 14),
                              ),
                              Text(
                                entry.value.toString(),
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
                const SizedBox(height: 32),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.pop(context);
                        },
                        child: const Text('Close'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          _downloadReport(report);
                        },
                        child: const Text('Download'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.grey,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  void _downloadReport(Report report) {
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Downloading report...'),
      ),
    );
    
    // Simulate download
    Future.delayed(const Duration(seconds: 2), () {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Report downloaded: ${report.title}'),
        ),
      );
    });
  }

  String _getReportTypeLabel(ReportType type) {
    switch (type) {
      case ReportType.questionnaireSummary:
        return 'Questionnaire Summary';
      case ReportType.expenseSummary:
        return 'Expense Summary';
      case ReportType.userActivity:
        return 'User Activity';
      case ReportType.organizationOverview:
        return 'Organization Overview';
    }
  }

  String _getReportTypeDescription(ReportType type) {
    switch (type) {
      case ReportType.questionnaireSummary:
        return 'Summary of questionnaire responses with completion rates and insights';
      case ReportType.expenseSummary:
        return 'Detailed breakdown of expenses by category, department, and time period';
      case ReportType.userActivity:
        return 'User engagement metrics, login frequency, and platform usage patterns';
      case ReportType.organizationOverview:
        return 'Overall organization performance and productivity metrics';
    }
  }

  String _getFormatLabel(ReportFormat format) {
    switch (format) {
      case ReportFormat.pdf:
        return 'PDF';
      case ReportFormat.excel:
        return 'Excel';
      case ReportFormat.csv:
        return 'CSV';
      case ReportFormat.json:
        return 'JSON';
    }
  }
}