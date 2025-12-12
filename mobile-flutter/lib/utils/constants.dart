class AppConstants {
  // Layout constants
  static const double paddingSmall = 8.0;
  static const double paddingMedium = 16.0;
  static const double paddingLarge = 24.0;
  static const double paddingExtraLarge = 32.0;
  
  static const double borderRadius = 12.0;
  static const double borderRadiusSmall = 8.0;
  static const double borderRadiusLarge = 16.0;
  
  static const double elevation = 2.0;
  static const double elevationHigh = 8.0;
  
  // Animation durations
  static const Duration animationShort = Duration(milliseconds: 200);
  static const Duration animationMedium = Duration(milliseconds: 300);
  static const Duration animationLong = Duration(milliseconds: 500);
  
  // API constants
  static const String apiBaseUrl = 'http://localhost:3000/api';
  static const int apiTimeout = 30000; // 30 seconds
  
  // Storage keys
  static const String storageAuthToken = 'auth_token';
  static const String storageRefreshToken = 'refresh_token';
  static const String storageUserData = 'user_data';
  static const String storageSettings = 'app_settings';
  static const String storageRecentSearches = 'recent_searches';
  
  // Date formats
  static const String dateFormatShort = 'MM/dd/yyyy';
  static const String dateFormatLong = 'MMMM dd, yyyy';
  static const String dateTimeFormat = 'MM/dd/yyyy HH:mm';
  static const String timeFormat = 'HH:mm';
  
  // Validation constants
  static const int passwordMinLength = 6;
  static const int passwordMaxLength = 32;
  static const int nameMaxLength = 50;
  static const int emailMaxLength = 100;
  static const int phoneMaxLength = 20;
  
  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
  
  // Cache durations
  static const Duration cacheShort = Duration(minutes: 5);
  static const Duration cacheMedium = Duration(hours: 1);
  static const Duration cacheLong = Duration(hours: 24);
  
  // File size limits (in bytes)
  static const int maxImageSize = 5 * 1024 * 1024; // 5MB
  static const int maxFileSize = 10 * 1024 * 1024; // 10MB
  
  // Notification channels
  static const String notificationChannelGeneral = 'general';
  static const String notificationChannelImportant = 'important';
  
  // Feature flags
  static const bool enableAnalytics = true;
  static const bool enableCrashReporting = true;
  static const bool enableLogging = true;
}

class AppRoutes {
  // Auth routes
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';
  static const String resetPassword = '/reset-password';
  
  // Main routes
  static const String dashboard = '/dashboard';
  static const String profile = '/profile';
  static const String settings = '/settings';
  
  // Questionnaire routes
  static const String questionnaires = '/questionnaires';
  static const String questionnaireCreate = '/questionnaires/create';
  static const String questionnaireDetail = '/questionnaires/:id';
  static const String questionnaireEdit = '/questionnaires/:id/edit';
  static const String questionnaireResponses = '/questionnaires/:id/responses';
  
  // Expense routes
  static const String expenses = '/expenses';
  static const String expenseCreate = '/expenses/create';
  static const String expenseDetail = '/expenses/:id';
  static const String expenseEdit = '/expenses/:id/edit';
  
  // Report routes
  static const String reports = '/reports';
  static const String reportCreate = '/reports/create';
  static const String reportDetail = '/reports/:id';
  
  // Organization routes
  static const String organization = '/organization';
  static const String organizationMembers = '/organization/members';
  static const String organizationSettings = '/organization/settings';
  
  // Other routes
  static const String notifications = '/notifications';
  static const String search = '/search';
  static const String help = '/help';
  static const String about = '/about';
  static const String privacy = '/privacy';
  static const String terms = '/terms';
}

class ApiEndpoints {
  // Auth endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  
  // User endpoints
  static const String currentUser = '/users/me';
  static const String updateProfile = '/users/profile';
  static const String changePassword = '/users/password';
  
  // Questionnaire endpoints
  static const String questionnaires = '/questionnaires';
  static const String questionnaireDetail = '/questionnaires/{id}';
  static const String questionnaireResponses = '/questionnaires/{id}/responses';
  static const String submitResponse = '/questionnaires/{id}/submit';
  
  // Expense endpoints
  static const String expenses = '/expenses';
  static const String expenseDetail = '/expenses/{id}';
  static const String expenseApprove = '/expenses/{id}/approve';
  static const String expenseReject = '/expenses/{id}/reject';
  static const String expensePay = '/expenses/{id}/pay';
  
  // Report endpoints
  static const String reports = '/reports';
  static const String reportGenerate = '/reports/generate';
  static const String reportDownload = '/reports/{id}/download';
  
  // Organization endpoints
  static const String organizations = '/organizations';
  static const String organizationDetail = '/organizations/{id}';
  static const String organizationMembers = '/organizations/{id}/members';
  static const String organizationInvite = '/organizations/{id}/invite';
  
  // Analytics endpoints
  static const String analyticsOverview = '/analytics/overview';
  static const String analyticsQuestionnaires = '/analytics/questionnaires';
  static const String analyticsExpenses = '/analytics/expenses';
  static const String analyticsUsers = '/analytics/users';
}

class AppStrings {
  // Common strings
  static const String appName = 'Productivity Platform';
  static const String loading = 'Loading...';
  static const String saving = 'Saving...';
  static const String submitting = 'Submitting...';
  static const String processing = 'Processing...';
  static const String pleaseWait = 'Please wait...';
  
  // Error messages
  static const String networkError = 'Network error. Please check your connection.';
  static const String serverError = 'Server error. Please try again later.';
  static const String unknownError = 'An unknown error occurred.';
  static const String timeoutError = 'Request timed out. Please try again.';
  
  // Success messages
  static const String success = 'Success!';
  static const String savedSuccessfully = 'Saved successfully!';
  static const String submittedSuccessfully = 'Submitted successfully!';
  static const String deletedSuccessfully = 'Deleted successfully!';
  
  // Validation messages
  static const String requiredField = 'This field is required';
  static const String invalidEmail = 'Please enter a valid email address';
  static const String invalidPhone = 'Please enter a valid phone number';
  static const String passwordTooShort = 'Password must be at least 6 characters';
  static const String passwordMismatch = 'Passwords do not match';
  
  // Empty states
  static const String noQuestionnaires = 'No questionnaires available';
  static const String noExpenses = 'No expenses recorded';
  static const String noReports = 'No reports generated';
  static const String noNotifications = 'No notifications';
  static const String noSearchResults = 'No results found';
}