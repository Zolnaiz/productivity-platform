import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

// String extensions
extension StringExtensions on String {
  // Check if string is null or empty
  bool get isNullOrEmpty => isEmpty;
  
  // Check if string is not null and not empty
  bool get isNotNullOrEmpty => !isNullOrEmpty;
  
  // Check if string is a valid email
  bool get isEmail {
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    );
    return emailRegex.hasMatch(this);
  }
  
  // Check if string is a valid phone number
  bool get isPhoneNumber {
    final phoneRegex = RegExp(r'^[\d\s\-\+\(\)]{10,20}$');
    if (!phoneRegex.hasMatch(this)) return false;
    
    final digitsOnly = replaceAll(RegExp(r'\D'), '');
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  }
  
  // Check if string is a valid URL
  bool get isUrl {
    final urlRegex = RegExp(
      r'^(https?:\/\/)?'
      r'((([a-zA-Z0-9]+\.)+[a-zA-Z]{2,})'
      r'|localhost'
      r'|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'
      r'(:\d+)?'
      r'(\/[^\s]*)?$',
      caseSensitive: false,
    );
    return urlRegex.hasMatch(this);
  }
  
  // Capitalize first letter
  String get capitalizeFirst {
    if (isEmpty) return this;
    return '${this[0].toUpperCase()}${substring(1)}';
  }
  
  // Convert to title case
  String get toTitleCase {
    if (isEmpty) return this;
    return split(' ').map((word) => word.capitalizeFirst).join(' ');
  }
  
  // Remove all whitespace
  String get removeWhitespace => replaceAll(RegExp(r'\s+'), '');
  
  // Truncate with ellipsis
  String truncate(int maxLength) {
    if (length <= maxLength) return this;
    return '${substring(0, maxLength)}...';
  }
  
  // Parse to int with default value
  int toInt({int defaultValue = 0}) {
    return int.tryParse(this) ?? defaultValue;
  }
  
  // Parse to double with default value
  double toDouble({double defaultValue = 0.0}) {
    return double.tryParse(this) ?? defaultValue;
  }
  
  // Parse to bool
  bool toBool() {
    return toLowerCase() == 'true' || this == '1';
  }
  
  // Mask sensitive information (e.g., emails, phone numbers)
  String mask({int visibleStart = 3, int visibleEnd = 2, String maskChar = '*'}) {
    if (length <= visibleStart + visibleEnd) return this;
    
    final start = substring(0, visibleStart);
    final end = substring(length - visibleEnd);
    final masked = maskChar * (length - visibleStart - visibleEnd);
    
    return '$start$masked$end';
  }
  
  // Format as currency
  String toCurrency({
    String symbol = '\$',
    int decimalDigits = 2,
    String? locale,
  }) {
    final amount = toDouble();
    final formatter = NumberFormat.currency(
      symbol: symbol,
      decimalDigits: decimalDigits,
      locale: locale,
    );
    return formatter.format(amount);
  }
  
  // Parse date from ISO string
  DateTime? toDateTime() {
    try {
      return DateTime.parse(this);
    } catch (e) {
      return null;
    }
  }
}

// DateTime extensions
extension DateTimeExtensions on DateTime {
  // Check if date is today
  bool get isToday {
    final now = DateTime.now();
    return year == now.year && month == now.month && day == now.day;
  }
  
  // Check if date is yesterday
  bool get isYesterday {
    final yesterday = DateTime.now().subtract(const Duration(days: 1));
    return year == yesterday.year && month == yesterday.month && day == yesterday.day;
  }
  
  // Check if date is tomorrow
  bool get isTomorrow {
    final tomorrow = DateTime.now().add(const Duration(days: 1));
    return year == tomorrow.year && month == tomorrow.month && day == tomorrow.day;
  }
  
  // Check if date is in the past
  bool get isPast => isBefore(DateTime.now());
  
  // Check if date is in the future
  bool get isFuture => isAfter(DateTime.now());
  
  // Get start of day
  DateTime get startOfDay => DateTime(year, month, day);
  
  // Get end of day
  DateTime get endOfDay => DateTime(year, month, day, 23, 59, 59, 999);
  
  // Get start of week (Monday)
  DateTime get startOfWeek {
    final weekday = this.weekday;
    return subtract(Duration(days: weekday - 1));
  }
  
  // Get end of week (Sunday)
  DateTime get endOfWeek {
    final weekday = this.weekday;
    return add(Duration(days: 7 - weekday));
  }
  
  // Get start of month
  DateTime get startOfMonth => DateTime(year, month, 1);
  
  // Get end of month
  DateTime get endOfMonth => DateTime(year, month + 1, 0);
  
  // Get age in years
  int get age {
    final now = DateTime.now();
    var age = now.year - year;
    if (now.month < month || (now.month == month && now.day < day)) {
      age--;
    }
    return age;
  }
  
  // Format date
  String format({String pattern = 'MMM dd, yyyy', String? locale}) {
    final formatter = DateFormat(pattern, locale);
    return formatter.format(this);
  }
  
  // Format time
  String formatTime({String pattern = 'HH:mm', String? locale}) {
    final formatter = DateFormat(pattern, locale);
    return formatter.format(this);
  }
  
  // Format date and time
  String formatDateTime({String pattern = 'MMM dd, yyyy HH:mm', String? locale}) {
    final formatter = DateFormat(pattern, locale);
    return formatter.format(this);
  }
  
  // Get relative time string
  String get relativeTime {
    final now = DateTime.now();
    final difference = now.difference(this);
    
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
  
  // Add business days (excludes weekends)
  DateTime addBusinessDays(int days) {
    var result = this;
    var daysAdded = 0;
    
    while (daysAdded < days) {
      result = result.add(const Duration(days: 1));
      if (result.weekday != DateTime.saturday && result.weekday != DateTime.sunday) {
        daysAdded++;
      }
    }
    
    return result;
  }
  
  // Check if date is weekend
  bool get isWeekend => weekday == DateTime.saturday || weekday == DateTime.sunday;
  
  // Check if date is weekday
  bool get isWeekday => !isWeekend;
  
  // Get days difference
  int daysDifference(DateTime other) {
    return difference(other).inDays.abs();
  }
  
  // Check if two dates are same day
  bool isSameDay(DateTime other) {
    return year == other.year && month == other.month && day == other.day;
  }
}

// List extensions
extension ListExtensions<T> on List<T> {
  // Get element at index or null
  T? elementAtOrNull(int index) {
    return index >= 0 && index < length ? this[index] : null;
  }
  
  // Get first element or null
  T? get firstOrNull => isNotEmpty ? first : null;
  
  // Get last element or null
  T? get lastOrNull => isNotEmpty ? last : null;
  
  // Check if list is null or empty
  bool get isNullOrEmpty => isEmpty;
  
  // Check if list is not null and not empty
  bool get isNotNullOrEmpty => !isNullOrEmpty;
  
  // Map with index
  List<R> mapIndexed<R>(R Function(int index, T element) mapper) {
    return asMap().entries.map((entry) => mapper(entry.key, entry.value)).toList();
  }
  
  // For each with index
  void forEachIndexed(void Function(int index, T element) action) {
    asMap().forEach(action);
  }
  
  // Filter list
  List<T> whereIndexed(bool Function(int index, T element) test) {
    return asMap().entries
        .where((entry) => test(entry.key, entry.value))
        .map((entry) => entry.value)
        .toList();
  }
  
  // Remove duplicates based on property
  List<T> distinctBy<R>(R Function(T) selector) {
    final seen = <R>{};
    return where((element) => seen.add(selector(element))).toList();
  }
  
  // Group by property
  Map<K, List<T>> groupBy<K>(K Function(T) keySelector) {
    final map = <K, List<T>>{};
    for (final element in this) {
      final key = keySelector(element);
      map.putIfAbsent(key, () => []).add(element);
    }
    return map;
  }
  
  // Split list into chunks
  List<List<T>> chunk(int size) {
    final chunks = <List<T>>[];
    for (var i = 0; i < length; i += size) {
      chunks.add(sublist(i, i + size > length ? length : i + size));
    }
    return chunks;
  }
  
  // Get random element
  T? get randomElement {
    if (isEmpty) return null;
    final random = math.Random();
    return this[random.nextInt(length)];
  }
  
  // Swap elements
  void swap(int index1, int index2) {
    final temp = this[index1];
    this[index1] = this[index2];
    this[index2] = temp;
  }
  
  // Insert all elements at index
  void insertAllAt(int index, Iterable<T> iterable) {
    insertAll(index, iterable);
  }
  
  // Remove all elements that satisfy condition
  void removeWhereAll(bool Function(T) test) {
    removeWhere(test);
  }
  
  // Safe remove at index
  T? removeAtSafe(int index) {
    if (index >= 0 && index < length) {
      return removeAt(index);
    }
    return null;
  }
}

// Map extensions
extension MapExtensions<K, V> on Map<K, V> {
  // Get value or null
  V? getOrNull(K key) => containsKey(key) ? this[key] : null;
  
  // Get value or default
  V getOrDefault(K key, V defaultValue) => containsKey(key) ? this[key]! : defaultValue;
  
  // Map keys and values
  Map<K2, V2> mapEntries<K2, V2>(MapEntry<K2, V2> Function(K key, V value) mapper) {
    return map((key, value) => mapper(key, value));
  }
  
  // Filter map
  Map<K, V> filter(bool Function(K key, V value) test) {
    return Map.fromEntries(
      entries.where((entry) => test(entry.key, entry.value)),
    );
  }
  
  // Check if all entries satisfy condition
  bool all(bool Function(K key, V value) test) {
    return entries.every((entry) => test(entry.key, entry.value));
  }
  
  // Check if any entry satisfies condition
  bool any(bool Function(K key, V value) test) {
    return entries.any((entry) => test(entry.key, entry.value));
  }
  
  // Invert map (swap keys and values)
  Map<V, K> invert() {
    return map((key, value) => MapEntry(value, key));
  }
  
  // Merge with another map
  Map<K, V> merge(Map<K, V> other, {V Function(V, V)? mergeFunction}) {
    final result = Map<K, V>.from(this);
    for (final entry in other.entries) {
      if (result.containsKey(entry.key) && mergeFunction != null) {
        result[entry.key] = mergeFunction(result[entry.key]!, entry.value);
      } else {
        result[entry.key] = entry.value;
      }
    }
    return result;
  }
  
  // Convert to query string
  String toQueryString() {
    return entries.map((entry) => '${Uri.encodeComponent(entry.key.toString())}=${Uri.encodeComponent(entry.value.toString())}').join('&');
  }
}

// Number extensions
extension NumberExtensions on num {
  // Format as currency
  String toCurrency({
    String symbol = '\$',
    int decimalDigits = 2,
    String? locale,
  }) {
    final formatter = NumberFormat.currency(
      symbol: symbol,
      decimalDigits: decimalDigits,
      locale: locale,
    );
    return formatter.format(this);
  }
  
  // Format as percentage
  String toPercentage({
    int decimalDigits = 1,
    bool includeSymbol = true,
  }) {
    final formatter = NumberFormat.decimalPercentPattern(
      decimalDigits: decimalDigits,
    );
    final formatted = formatter.format(this / 100);
    return includeSymbol ? formatted : formatted.replaceAll('%', '');
  }
  
  // Format with commas
  String formatNumber({int decimalDigits = 0, String? locale}) {
    final formatter = NumberFormat.decimalPattern(locale);
    formatter.minimumFractionDigits = decimalDigits;
    formatter.maximumFractionDigits = decimalDigits;
    return formatter.format(this);
  }
  
  // Check if number is between two values
  bool isBetween(num min, num max) => this >= min && this <= max;
  
  // Clamp number between min and max
  num clampBetween(num min, num max) {
    if (this < min) return min;
    if (this > max) return max;
    return this;
  }
  
  // Convert to duration (seconds to Duration)
  Duration get seconds => Duration(seconds: toInt());
  
  // Convert to duration (minutes to Duration)
  Duration get minutes => Duration(minutes: toInt());
  
  // Convert to duration (hours to Duration)
  Duration get hours => Duration(hours: toInt());
  
  // Convert to duration (days to Duration)
  Duration get days => Duration(days: toInt());
  
  // Check if number is even
  bool get isEven => toInt().isEven;
  
  // Check if number is odd
  bool get isOdd => toInt().isOdd;
  
  // Round to nearest multiple
  num roundToNearest(num multiple) {
    return (this / multiple).round() * multiple;
  }
  
  // Floor to nearest multiple
  num floorToNearest(num multiple) {
    return (this / multiple).floor() * multiple;
  }
  
  // Ceil to nearest multiple
  num ceilToNearest(num multiple) {
    return (this / multiple).ceil() * multiple;
  }
}

// Duration extensions
extension DurationExtensions on Duration {
  // Format as HH:mm:ss
  String get formatHHMMSS {
    final hours = inHours.toString().padLeft(2, '0');
    final minutes = (inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (inSeconds % 60).toString().padLeft(2, '0');
    return '$hours:$minutes:$seconds';
  }
  
  // Format as mm:ss
  String get formatMMSS {
    final minutes = inMinutes.toString().padLeft(2, '0');
    final seconds = (inSeconds % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }
  
  // Format in words (e.g., "2 hours 30 minutes")
  String get inWords {
    if (inDays >= 1) {
      final days = inDays;
      final hours = (inHours % 24);
      if (hours > 0) {
        return '$days ${days == 1 ? 'day' : 'days'} $hours ${hours == 1 ? 'hour' : 'hours'}';
      }
      return '$days ${days == 1 ? 'day' : 'days'}';
    } else if (inHours >= 1) {
      final hours = inHours;
      final minutes = (inMinutes % 60);
      if (minutes > 0) {
        return '$hours ${hours == 1 ? 'hour' : 'hours'} $minutes ${minutes == 1 ? 'minute' : 'minutes'}';
      }
      return '$hours ${hours == 1 ? 'hour' : 'hours'}';
    } else if (inMinutes >= 1) {
      final minutes = inMinutes;
      final seconds = (inSeconds % 60);
      if (seconds > 0) {
        return '$minutes ${minutes == 1 ? 'minute' : 'minutes'} $seconds ${seconds == 1 ? 'second' : 'seconds'}';
      }
      return '$minutes ${minutes == 1 ? 'minute' : 'minutes'}';
    } else {
      return '$inSeconds ${inSeconds == 1 ? 'second' : 'seconds'}';
    }
  }
  
  // Get total hours as double
  double get inHoursDouble => inMinutes / 60.0;
  
  // Get total days as double
  double get inDaysDouble => inHours / 24.0;
  
  // Add duration
  Duration operator +(Duration other) => Duration(
    microseconds: inMicroseconds + other.inMicroseconds,
  );
  
  // Subtract duration
  Duration operator -(Duration other) => Duration(
    microseconds: inMicroseconds - other.inMicroseconds,
  );
  
  // Multiply duration
  Duration operator *(num factor) => Duration(
    microseconds: (inMicroseconds * factor).toInt(),
  );
  
  // Divide duration
  Duration operator /(num divisor) => Duration(
    microseconds: (inMicroseconds / divisor).toInt(),
  );
}

// Color extensions
extension ColorExtensions on Color {
  // Darken color
  Color darken([double amount = 0.1]) {
    assert(amount >= 0 && amount <= 1);
    
    final hsl = HSLColor.fromColor(this);
    final hslDark = hsl.withLightness((hsl.lightness - amount).clamp(0.0, 1.0));
    
    return hslDark.toColor();
  }
  
  // Lighten color
  Color lighten([double amount = 0.1]) {
    assert(amount >= 0 && amount <= 1);
    
    final hsl = HSLColor.fromColor(this);
    final hslLight = hsl.withLightness((hsl.lightness + amount).clamp(0.0, 1.0));
    
    return hslLight.toColor();
  }
  
  // Check if color is dark
  bool get isDark {
    final luminance = computeLuminance();
    return luminance < 0.5;
  }
  
  // Check if color is light
  bool get isLight => !isDark;
  
  // Get contrasting color (black or white)
  Color get contrastingColor {
    return computeLuminance() > 0.5 ? Colors.black : Colors.white;
  }
  
  // Convert to hex string
  String get toHex {
    return '#${value.toRadixString(16).padLeft(8, '0').toUpperCase()}';
  }
  
  // Create color from hex string
  static Color fromHex(String hexString) {
    final buffer = StringBuffer();
    if (hexString.length == 6 || hexString.length == 7) buffer.write('ff');
    buffer.write(hexString.replaceFirst('#', ''));
    return Color(int.parse(buffer.toString(), radix: 16));
  }
  
  // Blend with another color
  Color blend(Color other, double ratio) {
    final invRatio = 1.0 - ratio;
    return Color.fromARGB(
      (alpha * invRatio + other.alpha * ratio).round(),
      (red * invRatio + other.red * ratio).round(),
      (green * invRatio + other.green * ratio).round(),
      (blue * invRatio + other.blue * ratio).round(),
    );
  }
}

// BuildContext extensions
extension BuildContextExtensions on BuildContext {
  // Get screen size
  Size get screenSize => MediaQuery.of(this).size;
  
  // Get screen width
  double get screenWidth => screenSize.width;
  
  // Get screen height
  double get screenHeight => screenSize.height;
  
  // Check if screen is small (mobile)
  bool get isSmallScreen => screenWidth < 600;
  
  // Check if screen is medium (tablet)
  bool get isMediumScreen => screenWidth >= 600 && screenWidth < 1200;
  
  // Check if screen is large (desktop)
  bool get isLargeScreen => screenWidth >= 1200;
  
  // Get theme
  ThemeData get theme => Theme.of(this);
  
  // Get text theme
  TextTheme get textTheme => theme.textTheme;
  
  // Get color scheme
  ColorScheme get colorScheme => theme.colorScheme;
  
  // Get primary color
  Color get primaryColor => colorScheme.primary;
  
  // Get background color
  Color get backgroundColor => colorScheme.background;
  
  // Get surface color
  Color get surfaceColor => colorScheme.surface;
  
  // Get error color
  Color get errorColor => colorScheme.error;
  
  // Navigate to route
  Future<T?> navigate<T>(String route, {Object? arguments}) {
    return Navigator.of(this).pushNamed<T>(route, arguments: arguments);
  }
  
  // Navigate and replace
  Future<T?> navigateReplacement<T>(String route, {Object? arguments}) {
    return Navigator.of(this).pushReplacementNamed(route, arguments: arguments);
  }
  
  // Navigate and remove until
  Future<T?> navigateAndRemoveUntil<T>(String route, {Object? arguments}) {
    return Navigator.of(this).pushNamedAndRemoveUntil(
      route,
      (route) => false,
      arguments: arguments,
    );
  }
  
  // Go back
  void goBack<T>([T? result]) {
    Navigator.of(this).pop(result);
  }
  
  // Check if can pop
  bool get canPop => Navigator.of(this).canPop();
  
  // Show snackbar
  void showSnackBar(
    String message, {
    Duration duration = const Duration(seconds: 4),
    SnackBarAction? action,
  }) {
    ScaffoldMessenger.of(this).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: duration,
        action: action,
      ),
    );
  }
  
  // Show dialog
  Future<T?> showDialog<T>({
    required WidgetBuilder builder,
    bool barrierDismissible = true,
  }) {
    return showDialog<T>(
      context: this,
      builder: builder,
      barrierDismissible: barrierDismissible,
    );
  }
  
  // Show bottom sheet
  Future<T?> showBottomSheet<T>({
    required WidgetBuilder builder,
    Color? backgroundColor,
    double? elevation,
    ShapeBorder? shape,
    Clip? clipBehavior,
  }) {
    return showModalBottomSheet<T>(
      context: this,
      builder: builder,
      backgroundColor: backgroundColor,
      elevation: elevation,
      shape: shape,
      clipBehavior: clipBehavior,
    );
  }
}