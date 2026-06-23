import 'package:flutter/material.dart';

import '../models/expense_model.dart';
import '../models/report_model.dart';

class AppColors {
  // Primary colors
  static const Color primary = Color(0xFF4F46E5);
  static const Color primaryLight = Color(0xFF7C73FF);
  static const Color primaryDark = Color(0xFF3730A3);
  
  // Secondary colors
  static const Color secondary = Color(0xFF10B981);
  static const Color secondaryLight = Color(0xFF34D399);
  static const Color secondaryDark = Color(0xFF059669);
  
  // Accent colors
  static const Color accent = Color(0xFFF59E0B);
  static const Color accentLight = Color(0xFFFBBF24);
  static const Color accentDark = Color(0xFFD97706);
  
  // Neutral colors (Light theme)
  static const Color backgroundLight = Color(0xFFF9FAFB);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color cardLight = Color(0xFFFFFFFF);
  
  // Neutral colors (Dark theme)
  static const Color backgroundDark = Color(0xFF111827);
  static const Color surfaceDark = Color(0xFF1F2937);
  static const Color cardDark = Color(0xFF374151);
  
  // Text colors (Light theme)
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textTertiary = Color(0xFF9CA3AF);
  static const Color textInverse = Color(0xFFFFFFFF);
  
  // Text colors (Dark theme)
  static const Color textPrimaryDark = Color(0xFFF9FAFB);
  static const Color textSecondaryDark = Color(0xFFD1D5DB);
  static const Color textTertiaryDark = Color(0xFF9CA3AF);
  static const Color textInverseDark = Color(0xFF111827);
  
  // Semantic colors
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);
  
  // Border colors
  static const Color borderLight = Color(0xFFE5E7EB);
  static const Color borderDark = Color(0xFF374151);
  
  // Shadow colors
  static const Color shadowLight = Color(0x1A000000);
  static const Color shadowDark = Color(0x4D000000);
  
  // Overlay colors
  static const Color overlayLight = Color(0x1A000000);
  static const Color overlayDark = Color(0x66000000);
  
  // Gradient colors
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF4F46E5),
      Color(0xFF7C73FF),
    ],
  );
  
  static const LinearGradient secondaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF10B981),
      Color(0xFF34D399),
    ],
  );
  
  static const LinearGradient accentGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFFF59E0B),
      Color(0xFFFBBF24),
    ],
  );
  
  // Status colors
  static const Map<ExpenseStatus, Color> expenseStatusColors = {
    ExpenseStatus.pending: Color(0xFFF59E0B),
    ExpenseStatus.approved: Color(0xFF10B981),
    ExpenseStatus.rejected: Color(0xFFEF4444),
    ExpenseStatus.paid: Color(0xFF8B5CF6),
  };
  
  static const Map<ReportType, Color> reportTypeColors = {
    ReportType.questionnaireSummary: Color(0xFF3B82F6),
    ReportType.expenseSummary: Color(0xFF10B981),
    ReportType.userActivity: Color(0xFF8B5CF6),
    ReportType.organizationOverview: Color(0xFFF59E0B),
  };
  
  // Utility methods
  static Color getStatusColor(ExpenseStatus status) {
    return expenseStatusColors[status] ?? textTertiary;
  }
  
  static Color getReportTypeColor(ReportType type) {
    return reportTypeColors[type] ?? textTertiary;
  }
  
  static Color getContrastingColor(Color backgroundColor) {
    final luminance = backgroundColor.computeLuminance();
    return luminance > 0.5 ? textPrimary : textInverse;
  }
  
  static Color darken(Color color, [double amount = 0.1]) {
    assert(amount >= 0 && amount <= 1);
    
    final hsl = HSLColor.fromColor(color);
    final hslDark = hsl.withLightness((hsl.lightness - amount).clamp(0.0, 1.0));
    
    return hslDark.toColor();
  }
  
  static Color lighten(Color color, [double amount = 0.1]) {
    assert(amount >= 0 && amount <= 1);
    
    final hsl = HSLColor.fromColor(color);
    final hslLight = hsl.withLightness((hsl.lightness + amount).clamp(0.0, 1.0));
    
    return hslLight.toColor();
  }
  
  static Color withOpacity(Color color, double opacity) {
    return color.withOpacity(opacity);
  }
}

