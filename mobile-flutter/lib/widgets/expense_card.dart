import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/expense_model.dart';
import '../utils/constants.dart';

class ExpenseCard extends StatelessWidget {
  final Expense expense;
  final VoidCallback onTap;
  final VoidCallback? onMoreTap;
  final bool showActions;

  const ExpenseCard({
    super.key,
    required this.expense,
    required this.onTap,
    this.onMoreTap,
    this.showActions = false,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(expense.status);
    final statusText = _getStatusText(expense.status);
    final categoryText = _getCategoryText(expense.category);

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
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          expense.title,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (expense.description.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              expense.description,
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
                  if (onMoreTap != null)
                    IconButton(
                      icon: const Icon(Icons.more_vert),
                      onPressed: onMoreTap,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _buildStatusChip(statusColor, statusText),
                  const SizedBox(width: 8),
                  _buildCategoryChip(categoryText),
                  const Spacer(),
                  _buildAmountChip(),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildInfoRow(
                    Icons.calendar_today_outlined,
                    DateFormat('MMM dd, yyyy').format(expense.date),
                  ),
                  _buildInfoRow(
                    Icons.access_time_outlined,
                    DateFormat('MMM dd').format(expense.createdAt),
                  ),
                  if (expense.approvedBy != null && expense.approvedAt != null)
                    _buildInfoRow(
                      Icons.check_circle_outline,
                      'Approved ${DateFormat('MM/dd').format(expense.approvedAt!)}',
                    ),
                ],
              ),
              if (expense.attachments != null && expense.attachments!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Row(
                    children: [
                      const Icon(Icons.attach_file, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        '${expense.attachments!.length} attachment(s)',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
              if (showActions && expense.status == ExpenseStatus.pending)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            // Edit action
                          },
                          child: const Text('Edit'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            // Submit for approval
                          },
                          child: const Text('Submit'),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(Color color, String text) {
    return Chip(
      label: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          color: color,
          fontWeight: FontWeight.w500,
        ),
      ),
      backgroundColor: color.withOpacity(0.1),
      side: BorderSide.none,
      padding: const EdgeInsets.symmetric(horizontal: 4),
      labelPadding: const EdgeInsets.symmetric(horizontal: 4),
      visualDensity: VisualDensity.compact,
    );
  }

  Widget _buildCategoryChip(String text) {
    return Chip(
      label: Text(
        text,
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

  Widget _buildAmountChip() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        '\$${expense.amount.toStringAsFixed(2)}',
        style: const TextStyle(
          fontSize: 14,
          color: Colors.green,
          fontWeight: FontWeight.bold,
        ),
      ),
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

  Color _getStatusColor(ExpenseStatus status) {
    switch (status) {
      case ExpenseStatus.pending:
        return Colors.orange;
      case ExpenseStatus.approved:
        return Colors.green;
      case ExpenseStatus.rejected:
        return Colors.red;
      case ExpenseStatus.paid:
        return Colors.purple;
    }
  }

  String _getStatusText(ExpenseStatus status) {
    switch (status) {
      case ExpenseStatus.pending:
        return 'Pending';
      case ExpenseStatus.approved:
        return 'Approved';
      case ExpenseStatus.rejected:
        return 'Rejected';
      case ExpenseStatus.paid:
        return 'Paid';
    }
  }

  String _getCategoryText(ExpenseCategory category) {
    switch (category) {
      case ExpenseCategory.travel:
        return 'Travel';
      case ExpenseCategory.meals:
        return 'Meals';
      case ExpenseCategory.equipment:
        return 'Equipment';
      case ExpenseCategory.software:
        return 'Software';
      case ExpenseCategory.office:
        return 'Office';
      case ExpenseCategory.training:
        return 'Training';
      case ExpenseCategory.other:
        return 'Other';
    }
  }
}