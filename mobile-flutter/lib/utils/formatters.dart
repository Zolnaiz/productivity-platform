import 'package:intl/intl.dart';

class Formatters {
  // Currency formatter
  static String formatCurrency(double amount, {
    String symbol = '\$',
    int decimalDigits = 2,
    String? locale,
  }) {
    final formatter = NumberFormat.currency(
      symbol: symbol,
      decimalDigits: decimalDigits,
      locale: locale,
    );
    return formatter.format(amount);
  }
  
  // Percentage formatter
  static String formatPercentage(double value, {
    int decimalDigits = 1,
    bool includeSymbol = true,
  }) {
    final formatter = NumberFormat.decimalPercentPattern(
      decimalDigits: decimalDigits,
    );
    final formatted = formatter.format(value / 100);
    return includeSymbol ? formatted : formatted.replaceAll('%', '');
  }
  
  // Date formatter
  static String formatDate(DateTime date, {
    String format = 'MMM dd, yyyy',
    String? locale,
  }) {
    final formatter = DateFormat(format, locale);
    return formatter.format(date);
  }
  
  // Time formatter
  static String formatTime(DateTime date, {
    String format = 'HH:mm',
    String? locale,
  }) {
    final formatter = DateFormat(format, locale);
    return formatter.format(date);
  }
  
  // DateTime formatter
  static String formatDateTime(DateTime date, {
    String format = 'MMM dd, yyyy HH:mm',
    String? locale,
  }) {
    final formatter = DateFormat(format, locale);
    return formatter.format(date);
  }
  
  // Relative time formatter (e.g., "2 hours ago")
  static String formatRelativeTime(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inSeconds < 60) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      final minutes = difference.inMinutes;
      return '$minutes ${minutes == 1 ? 'minute' : 'minutes'} ago';
    } else if (difference.inHours < 24) {
      final hours = difference.inHours;
      return '$hours ${hours == 1 ? 'hour' : 'hours'} ago';
    } else if (difference.inDays < 30) {
      final days = difference.inDays;
      return '$days ${days == 1 ? 'day' : 'days'} ago';
    } else if (difference.inDays < 365) {
      final months = (difference.inDays / 30).floor();
      return '$months ${months == 1 ? 'month' : 'months'} ago';
    } else {
      final years = (difference.inDays / 365).floor();
      return '$years ${years == 1 ? 'year' : 'years'} ago';
    }
  }
  
  // Number formatter (with commas)
  static String formatNumber(num value, {
    int decimalDigits = 0,
    String? locale,
  }) {
    final formatter = NumberFormat.decimalPattern(locale);
    formatter.minimumFractionDigits = decimalDigits;
    formatter.maximumFractionDigits = decimalDigits;
    return formatter.format(value);
  }
  
  // File size formatter
  static String formatFileSize(int bytes, {int decimalDigits = 1}) {
    if (bytes <= 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    final i = (log(bytes) / log(1024)).floor();
    
    return '${(bytes / pow(1024, i)).toStringAsFixed(decimalDigits)} ${sizes[i]}';
  }
  
  // Duration formatter (e.g., "2:30:45")
  static String formatDuration(Duration duration) {
    final hours = duration.inHours.toString().padLeft(2, '0');
    final minutes = (duration.inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (duration.inSeconds % 60).toString().padLeft(2, '0');
    
    if (duration.inHours > 0) {
      return '$hours:$minutes:$seconds';
    } else {
      return '$minutes:$seconds';
    }
  }
  
  // Phone number formatter
  static String formatPhoneNumber(String phoneNumber) {
    final digits = phoneNumber.replaceAll(RegExp(r'\D'), '');
    
    if (digits.length == 10) {
      return '(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}';
    } else if (digits.length == 11) {
      return '+${digits.substring(0, 1)} (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}';
    }
    
    return phoneNumber;
  }
  
  // Credit card formatter (e.g., "**** **** **** 1234")
  static String formatCreditCard(String cardNumber) {
    final digits = cardNumber.replaceAll(RegExp(r'\D'), '');
    
    if (digits.length >= 4) {
      final lastFour = digits.substring(digits.length - 4);
      return '**** **** **** $lastFour';
    }
    
    return cardNumber;
  }
  
  // Social security number formatter (e.g., "***-**-1234")
  static String formatSSN(String ssn) {
    final digits = ssn.replaceAll(RegExp(r'\D'), '');
    
    if (digits.length >= 4) {
      final lastFour = digits.substring(digits.length - 4);
      return '***-**-$lastFour';
    }
    
    return ssn;
  }
  
  // Truncate text with ellipsis
  static String truncateText(String text, int maxLength) {
    if (text.length <= maxLength) return text;
    return '${text.substring(0, maxLength)}...';
  }
  
  // Capitalize first letter of each word
  static String capitalizeWords(String text) {
    if (text.isEmpty) return text;
    
    return text.split(' ').map((word) {
      if (word.isEmpty) return '';
      return '${word[0].toUpperCase()}${word.substring(1).toLowerCase()}';
    }).join(' ');
  }
  
  // Format list as comma-separated string
  static String formatList(List<String> items, {int? maxItems}) {
    if (items.isEmpty) return '';
    
    if (maxItems != null && items.length > maxItems) {
      final displayed = items.take(maxItems).toList();
      final remaining = items.length - maxItems;
      return '${displayed.join(', ')} and $remaining more';
    }
    
    return items.join(', ');
  }
  
  // Format boolean as Yes/No
  static String formatBoolean(bool value) {
    return value ? 'Yes' : 'No';
  }
}