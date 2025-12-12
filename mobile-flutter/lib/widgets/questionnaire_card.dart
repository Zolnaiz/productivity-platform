import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/questionnaire_model.dart';
import '../utils/constants.dart';
import '../themes/colors.dart';

class QuestionnaireCard extends StatelessWidget {
  final Questionnaire questionnaire;
  final VoidCallback onTap;
  final VoidCallback? onMoreTap;
  final bool showOrganization;

  const QuestionnaireCard({
    super.key,
    required this.questionnaire,
    required this.onTap,
    this.onMoreTap,
    this.showOrganization = true,
  });

  @override
  Widget build(BuildContext context) {
    final isExpired = questionnaire.expiresAt != null &&
        questionnaire.expiresAt!.isBefore(DateTime.now());

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
                          questionnaire.title,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (questionnaire.description != null &&
                            questionnaire.description!.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              questionnaire.description!,
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
                  _buildStatusChip(isExpired),
                  const SizedBox(width: 8),
                  _buildQuestionCountChip(),
                  const Spacer(),
                  _buildResponseCountChip(),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildInfoRow(
                          Icons.calendar_today_outlined,
                          'Created: ${DateFormat('MMM dd, yyyy').format(questionnaire.createdAt)}',
                        ),
                        if (questionnaire.expiresAt != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: _buildInfoRow(
                              Icons.timer_outlined,
                              'Expires: ${DateFormat('MMM dd, yyyy').format(questionnaire.expiresAt!)}',
                              color: isExpired ? Colors.red : Colors.grey,
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (questionnaire.questions.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '${questionnaire.questions.length} questions',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.blue,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(bool isExpired) {
    Color color;
    String text;

    if (!questionnaire.isActive) {
      color = Colors.grey;
      text = 'Inactive';
    } else if (isExpired) {
      color = Colors.red;
      text = 'Expired';
    } else {
      color = Colors.green;
      text = 'Active';
    }

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

  Widget _buildQuestionCountChip() {
    return Chip(
      label: Text(
        '${questionnaire.questions.length} Qs',
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

  Widget _buildResponseCountChip() {
    return Chip(
      label: Text(
        '${questionnaire.responseCount} Responses',
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

  Widget _buildInfoRow(IconData icon, String text, {Color? color}) {
    return Row(
      children: [
        Icon(
          icon,
          size: 14,
          color: color ?? Colors.grey.shade600,
        ),
        const SizedBox(width: 4),
        Text(
          text,
          style: TextStyle(
            fontSize: 12,
            color: color ?? Colors.grey.shade600,
          ),
        ),
      ],
    );
  }
}