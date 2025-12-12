import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/report_model.dart';
import '../utils/constants.dart';

class ReportCard extends StatelessWidget {
  final Report report;
  final VoidCallback onTap;
  final VoidCallback? onDownload;
  final bool showActions;

  const ReportCard({
    super.key,
    required this.report,
    required this.onTap,
    this.onDownload,
    this.showActions = true,
  });

  @override
  Widget build(BuildContext context) {
    final formatIcon = _getFormatIcon(report.format);
    final typeText = _getTypeText(report.type);
    final fileSizeText = report.fileSize != null
        ? '${(report.fileSize! / 1024 / 1024).toStringAsFixed(1)} MB'
        : null;

    return Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppConstants.borderRadius),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      formatIcon,
                      size: 24,
                      color: Colors.blue,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          report.title,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (report.description != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              report.description!,
                              style: const TextStyle(
                                fontSize: 14,
                                color: Colors.grey,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (showActions)
                    IconButton(
                      icon: const Icon(Icons.download_outlined),
                      onPressed: onDownload ?? onTap,
                      tooltip: 'Download',
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _buildTypeChip(typeText),
                  _buildFormatChip(report.format),
                  if (fileSizeText != null)
                    _buildSizeChip(fileSizeText),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildInfoRow(
                    Icons.person_outline,
                    report.generatedBy ?? 'System',
                  ),
                  _buildInfoRow(
                    Icons.calendar_today_outlined,
                    DateFormat('MMM dd, yyyy').format(report.generatedAt),
                  ),
                  if (report.startDate != null && report.endDate != null)
                    _buildInfoRow(
                      Icons.date_range_outlined,
                      '${DateFormat('MM/dd').format(report.startDate!)}-${DateFormat('MM/dd').format(report.endDate!)}',
                    ),
                ],
              ),
              if (report.summary != null && report.summary!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Highlights:',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Wrap(
                          spacing: 8,
                          runSpacing: 4,
                          children: report.summary!.entries.map((entry) {
                            return Chip(
                              label: Text(
                                '${entry.key}: ${entry.value}',
                                style: const TextStyle(
                                  fontSize: 11,
                                ),
                              ),
                              backgroundColor: Colors.white,
                              side: BorderSide(
                                color: Colors.grey.shade300,
                              ),
                              visualDensity: VisualDensity.compact,
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTypeChip(String text) {
    return Chip(
      label: Text(
        text,
        style: const TextStyle(
          fontSize: 11,
          color: Colors.purple,
          fontWeight: FontWeight.w500,
        ),
      ),
      backgroundColor: Colors.purple.shade50,
      side: BorderSide.none,
      padding: const EdgeInsets.symmetric(horizontal: 4),
      labelPadding: const EdgeInsets.symmetric(horizontal: 4),
      visualDensity: VisualDensity.compact,
    );
  }

  Widget _buildFormatChip(ReportFormat format) {
    return Chip(
      label: Text(
        _getFormatText(format),
        style: const TextStyle(
          fontSize: 11,
          color: Colors.blue,
          fontWeight: FontWeight.w500,
        ),
      ),
      backgroundColor: Colors.blue.shade50,
      side: BorderSide.none,
      padding: const EdgeInsets.symmetric(horizontal: 4),
      labelPadding: const EdgeInsets.symmetric(horizontal: 4),
      visualDensity: VisualDensity.compact,
    );
  }

  Widget _buildSizeChip(String size) {
    return Chip(
      label: Text(
        size,
        style: const TextStyle(
          fontSize: 11,
          color: Colors.green,
          fontWeight: FontWeight.w500,
        ),
      ),
      backgroundColor: Colors.green.shade50,
      side: BorderSide.none,
      padding: const EdgeInsets.symmetric(horizontal: 4),
      labelPadding: const EdgeInsets.symmetric(horizontal: 4),
      visualDensity: VisualDensity.compact,
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(
          icon,
          size: 14,
          color: Colors.grey.shade600,
        ),
        const SizedBox(width: 4),
        Text(
          text,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade600,
          ),
        ),
      ],
    );
  }

  IconData _getFormatIcon(ReportFormat format) {
    switch (format) {
      case ReportFormat.pdf:
        return Icons.picture_as_pdf_outlined;
      case ReportFormat.excel:
        return Icons.table_chart_outlined;
      case ReportFormat.csv:
        return Icons.grid_on_outlined;
      case ReportFormat.json:
        return Icons.code_outlined;
    }
  }

  String _getTypeText(ReportType type) {
    switch (type) {
      case ReportType.questionnaireSummary:
        return 'Questionnaire';
      case ReportType.expenseSummary:
        return 'Expense';
      case ReportType.userActivity:
        return 'Activity';
      case ReportType.organizationOverview:
        return 'Organization';
    }
  }

  String _getFormatText(ReportFormat format) {
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