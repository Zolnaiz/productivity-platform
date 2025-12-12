class Validators {
  // Email validation
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    );
    
    if (!emailRegex.hasMatch(value)) {
      return 'Please enter a valid email address';
    }
    
    return null;
  }
  
  // Password validation
  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    
    if (value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    
    if (value.length > 32) {
      return 'Password must be less than 32 characters';
    }
    
    // Check for at least one number
    if (!RegExp(r'\d').hasMatch(value)) {
      return 'Password must contain at least one number';
    }
    
    // Check for at least one letter
    if (!RegExp(r'[a-zA-Z]').hasMatch(value)) {
      return 'Password must contain at least one letter';
    }
    
    return null;
  }
  
  // Confirm password validation
  static String? validateConfirmPassword(String? value, String? password) {
    if (value == null || value.isEmpty) {
      return 'Please confirm your password';
    }
    
    if (value != password) {
      return 'Passwords do not match';
    }
    
    return null;
  }
  
  // Required field validation
  static String? validateRequired(String? value, {String? fieldName}) {
    if (value == null || value.trim().isEmpty) {
      return fieldName != null 
          ? '$fieldName is required'
          : 'This field is required';
    }
    
    return null;
  }
  
  // Name validation
  static String? validateName(String? value, {String? fieldName = 'Name'}) {
    if (value == null || value.isEmpty) {
      return '$fieldName is required';
    }
    
    if (value.length > 50) {
      return '$fieldName must be less than 50 characters';
    }
    
    final nameRegex = RegExp(r'^[a-zA-Z\s\-]+$');
    if (!nameRegex.hasMatch(value)) {
      return 'Please enter a valid $fieldName';
    }
    
    return null;
  }
  
  // Phone number validation
  static String? validatePhone(String? value) {
    if (value == null || value.isEmpty) {
      return null; // Phone is optional
    }
    
    final phoneRegex = RegExp(r'^[\d\s\-\+\(\)]{10,20}$');
    if (!phoneRegex.hasMatch(value)) {
      return 'Please enter a valid phone number';
    }
    
    // Remove non-digits and check length
    final digitsOnly = value.replaceAll(RegExp(r'\D'), '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return 'Phone number must be 10-15 digits';
    }
    
    return null;
  }
  
  // URL validation
  static String? validateUrl(String? value) {
    if (value == null || value.isEmpty) {
      return null; // URL is optional
    }
    
    final urlRegex = RegExp(
      r'^(https?:\/\/)?'
      r'((([a-zA-Z0-9]+\.)+[a-zA-Z]{2,})'
      r'|localhost'
      r'|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'
      r'(:\d+)?'
      r'(\/[^\s]*)?$',
      caseSensitive: false,
    );
    
    if (!urlRegex.hasMatch(value)) {
      return 'Please enter a valid URL';
    }
    
    return null;
  }
  
  // Number validation
  static String? validateNumber(String? value, {
    double? min,
    double? max,
    String? fieldName = 'Value',
  }) {
    if (value == null || value.isEmpty) {
      return '$fieldName is required';
    }
    
    final number = double.tryParse(value);
    if (number == null) {
      return 'Please enter a valid number';
    }
    
    if (min != null && number < min) {
      return '$fieldName must be at least $min';
    }
    
    if (max != null && number > max) {
      return '$fieldName must be at most $max';
    }
    
    return null;
  }
  
  // Integer validation
  static String? validateInteger(String? value, {
    int? min,
    int? max,
    String? fieldName = 'Value',
  }) {
    if (value == null || value.isEmpty) {
      return '$fieldName is required';
    }
    
    final integer = int.tryParse(value);
    if (integer == null) {
      return 'Please enter a whole number';
    }
    
    if (min != null && integer < min) {
      return '$fieldName must be at least $min';
    }
    
    if (max != null && integer > max) {
      return '$fieldName must be at most $max';
    }
    
    return null;
  }
  
  // Date validation
  static String? validateDate(String? value, {String? fieldName = 'Date'}) {
    if (value == null || value.isEmpty) {
      return '$fieldName is required';
    }
    
    try {
      DateTime.parse(value);
      return null;
    } catch (e) {
      return 'Please enter a valid date';
    }
  }
  
  // Min length validation
  static String? validateMinLength(String? value, int minLength, {String? fieldName}) {
    if (value == null || value.isEmpty) {
      return fieldName != null 
          ? '$fieldName is required'
          : 'This field is required';
    }
    
    if (value.length < minLength) {
      return fieldName != null
          ? '$fieldName must be at least $minLength characters'
          : 'Must be at least $minLength characters';
    }
    
    return null;
  }
  
  // Max length validation
  static String? validateMaxLength(String? value, int maxLength, {String? fieldName}) {
    if (value == null || value.isEmpty) {
      return null; // Not required, just check length if provided
    }
    
    if (value.length > maxLength) {
      return fieldName != null
          ? '$fieldName must be at most $maxLength characters'
          : 'Must be at most $maxLength characters';
    }
    
    return null;
  }
  
  // List validation (minimum items)
  static String? validateList(List<dynamic>? list, int minItems, {String? fieldName}) {
    if (list == null || list.isEmpty) {
      return fieldName != null
          ? 'Please add at least $minItems ${fieldName.toLowerCase()}'
          : 'Please add at least $minItems items';
    }
    
    if (list.length < minItems) {
      return fieldName != null
          ? 'Please add at least $minItems ${fieldName.toLowerCase()}'
          : 'Please add at least $minItems items';
    }
    
    return null;
  }
  
  // Custom regex validation
  static String? validateRegex(String? value, RegExp regex, String errorMessage) {
    if (value == null || value.isEmpty) {
      return null; // Not required, just check if provided
    }
    
    if (!regex.hasMatch(value)) {
      return errorMessage;
    }
    
    return null;
  }
  
  // Multiple validators
  static String? validateMultiple(String? value, List<String? Function(String?)> validators) {
    for (final validator in validators) {
      final error = validator(value);
      if (error != null) {
        return error;
      }
    }
    return null;
  }
  
  // Conditional validation
  static String? Function(String?) conditional(bool condition, String? Function(String?) validator) {
    return (value) => condition ? validator(value) : null;
  }
}