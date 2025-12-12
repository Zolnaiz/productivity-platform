import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/primary_button.dart';
import '../utils/constants.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notificationsEnabled = true;
  bool _emailNotifications = true;
  bool _pushNotifications = true;
  bool _biometricAuth = false;
  bool _autoSync = true;
  String _selectedLanguage = 'English';
  String _selectedTheme = 'System default';

  final List<String> _languages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Japanese',
    'Chinese',
  ];

  final List<String> _themes = [
    'System default',
    'Light',
    'Dark',
  ];

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.paddingLarge),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionTitle('Appearance'),
            _buildThemeSelector(themeProvider),
            const SizedBox(height: 24),
            _buildSectionTitle('Notifications'),
            _buildNotificationSettings(),
            const SizedBox(height: 24),
            _buildSectionTitle('Security'),
            _buildSecuritySettings(),
            const SizedBox(height: 24),
            _buildSectionTitle('Data & Storage'),
            _buildDataSettings(),
            const SizedBox(height: 24),
            _buildSectionTitle('About'),
            _buildAboutSection(),
            const SizedBox(height: 32),
            _buildDangerZone(),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildThemeSelector(ThemeProvider themeProvider) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          children: [
            ListTile(
              leading: const Icon(Icons.color_lens_outlined),
              title: const Text('Theme'),
              trailing: DropdownButton<String>(
                value: _selectedTheme,
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _selectedTheme = value);
                    
                    if (value == 'Light') {
                      themeProvider.setThemeMode(ThemeMode.light);
                    } else if (value == 'Dark') {
                      themeProvider.setThemeMode(ThemeMode.dark);
                    } else {
                      themeProvider.setThemeMode(ThemeMode.system);
                    }
                  }
                },
                items: _themes.map((theme) {
                  return DropdownMenuItem(
                    value: theme,
                    child: Text(theme),
                  );
                }).toList(),
                underline: Container(),
              ),
            ),
            const Divider(),
            SwitchListTile(
              title: const Text('Use system theme'),
              value: themeProvider.themeMode == ThemeMode.system,
              onChanged: (value) {
                themeProvider.setThemeMode(
                  value ? ThemeMode.system : ThemeMode.light,
                );
                setState(() {
                  _selectedTheme = value ? 'System default' : 'Light';
                });
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationSettings() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          children: [
            SwitchListTile(
              title: const Text('Enable Notifications'),
              value: _notificationsEnabled,
              onChanged: (value) {
                setState(() => _notificationsEnabled = value);
              },
            ),
            const Divider(),
            SwitchListTile(
              title: const Text('Email Notifications'),
              subtitle: const Text('Receive notifications via email'),
              value: _emailNotifications,
              onChanged: _notificationsEnabled ? (value) {
                setState(() => _emailNotifications = value);
              } : null,
              secondary: const Icon(Icons.email_outlined),
            ),
            SwitchListTile(
              title: const Text('Push Notifications'),
              subtitle: const Text('Receive push notifications on device'),
              value: _pushNotifications,
              onChanged: _notificationsEnabled ? (value) {
                setState(() => _pushNotifications = value);
              } : null,
              secondary: const Icon(Icons.notifications_outlined),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.notification_important_outlined),
              title: const Text('Notification Sound'),
              trailing: Switch(
                value: true,
                onChanged: _notificationsEnabled ? (value) {} : null,
              ),
            ),
            ListTile(
              leading: const Icon(Icons.vibration_outlined),
              title: const Text('Vibration'),
              trailing: Switch(
                value: true,
                onChanged: _notificationsEnabled ? (value) {} : null,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSecuritySettings() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          children: [
            SwitchListTile(
              title: const Text('Biometric Authentication'),
              subtitle: const Text('Use fingerprint or face ID to login'),
              value: _biometricAuth,
              onChanged: (value) {
                setState(() => _biometricAuth = value);
              },
              secondary: const Icon(Icons.fingerprint_outlined),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.lock_outlined),
              title: const Text('Change Password'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.pushNamed(context, '/change-password');
              },
            ),
            ListTile(
              leading: const Icon(Icons.devices_outlined),
              title: const Text('Manage Devices'),
              subtitle: const Text('View and remove connected devices'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.pushNamed(context, '/settings/devices');
              },
            ),
            ListTile(
              leading: const Icon(Icons.history_outlined),
              title: const Text('Login History'),
              subtitle: const Text('View recent login activity'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.pushNamed(context, '/settings/login-history');
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDataSettings() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          children: [
            SwitchListTile(
              title: const Text('Auto Sync'),
              subtitle: const Text('Automatically sync data when online'),
              value: _autoSync,
              onChanged: (value) {
                setState(() => _autoSync = value);
              },
              secondary: const Icon(Icons.sync_outlined),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.save_outlined),
              title: const Text('Cache Size'),
              subtitle: const Text('125.4 MB'),
              trailing: TextButton(
                onPressed: () {
                  _clearCache();
                },
                child: const Text('Clear'),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.cloud_download_outlined),
              title: const Text('Data Backup'),
              subtitle: const Text('Last backup: 2 days ago'),
              trailing: TextButton(
                onPressed: () {
                  _createBackup();
                },
                child: const Text('Backup Now'),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.restore_outlined),
              title: const Text('Data Restore'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.pushNamed(context, '/settings/restore');
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.language_outlined),
              title: const Text('Language'),
              trailing: DropdownButton<String>(
                value: _selectedLanguage,
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _selectedLanguage = value);
                  }
                },
                items: _languages.map((language) {
                  return DropdownMenuItem(
                    value: language,
                    child: Text(language),
                  );
                }).toList(),
                underline: Container(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAboutSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          children: [
            ListTile(
              leading: const Icon(Icons.info_outlined),
              title: const Text('App Version'),
              subtitle: const Text('1.0.0 (Build 123)'),
            ),
            ListTile(
              leading: const Icon(Icons.update_outlined),
              title: const Text('Check for Updates'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                _checkForUpdates();
              },
            ),
            ListTile(
              leading: const Icon(Icons.description_outlined),
              title: const Text('Terms of Service'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.pushNamed(context, '/terms');
              },
            ),
            ListTile(
              leading: const Icon(Icons.privacy_tip_outlined),
              title: const Text('Privacy Policy'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.pushNamed(context, '/privacy');
              },
            ),
            ListTile(
              leading: const Icon(Icons.help_outline_outlined),
              title: const Text('Help & Support'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.pushNamed(context, '/help');
              },
            ),
            ListTile(
              leading: const Icon(Icons.email_outlined),
              title: const Text('Contact Us'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                _contactSupport();
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDangerZone() {
    return Card(
      color: Colors.red.shade50,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Danger Zone',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.red,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'These actions are irreversible. Please proceed with caution.',
              style: TextStyle(
                fontSize: 14,
                color: Colors.red,
              ),
            ),
            const SizedBox(height: 16),
            PrimaryButton(
              text: 'Delete Account',
              onPressed: () {
                _confirmDeleteAccount();
              },
              fullWidth: true,
              backgroundColor: Colors.red,
              textColor: Colors.white,
            ),
            const SizedBox(height: 8),
            PrimaryButton(
              text: 'Logout All Devices',
              onPressed: () {
                _confirmLogoutAll();
              },
              fullWidth: true,
              backgroundColor: Colors.orange,
              textColor: Colors.white,
            ),
          ],
        ),
      ),
    );
  }

  void _clearCache() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Clear Cache'),
          content: const Text(
            'This will remove all cached data. Some data will be re-downloaded when needed. Continue?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Cache cleared successfully'),
                  ),
                );
              },
              child: const Text('Clear'),
            ),
          ],
        );
      },
    );
  }

  void _createBackup() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Create Backup'),
          content: const Text('This will create a backup of all your data. Continue?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                // Simulate backup creation
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Creating backup...'),
                  ),
                );
                
                Future.delayed(const Duration(seconds: 2), () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Backup created successfully'),
                    ),
                  );
                });
              },
              child: const Text('Backup'),
            ),
          ],
        );
      },
    );
  }

  void _checkForUpdates() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Check for Updates'),
          content: const Text('Checking for available updates...'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
    
    // Simulate update check
    Future.delayed(const Duration(seconds: 2), () {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('You are using the latest version'),
        ),
      );
    });
  }

  void _contactSupport() {
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
                const Text(
                  'Contact Support',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Email: support@productivityplatform.com',
                  style: TextStyle(fontSize: 16),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Phone: +1 (555) 123-4567',
                  style: TextStyle(fontSize: 16),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Hours: Mon-Fri 9AM-6PM',
                  style: TextStyle(fontSize: 16),
                ),
                const SizedBox(height: 24),
                const TextField(
                  decoration: InputDecoration(
                    labelText: 'Subject',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 1,
                ),
                const SizedBox(height: 16),
                const TextField(
                  decoration: InputDecoration(
                    labelText: 'Message',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 5,
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Cancel'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Message sent to support'),
                            ),
                          );
                        },
                        child: const Text('Send'),
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

  void _confirmDeleteAccount() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Delete Account'),
          content: const Text(
            'This action is permanent and cannot be undone. '
            'All your data will be deleted. Are you sure you want to delete your account?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                _deleteAccount();
              },
              child: const Text(
                'Delete Account',
                style: TextStyle(color: Colors.red),
              ),
            ),
          ],
        );
      },
    );
  }

  void _deleteAccount() {
    // Implement account deletion
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Account deletion requested. Please check your email.'),
      ),
    );
  }

  void _confirmLogoutAll() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Logout All Devices'),
          content: const Text(
            'This will log you out from all devices. '
            'You will need to login again on this device. Continue?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                Provider.of<AuthProvider>(context, listen: false).logout();
                Navigator.pushReplacementNamed(context, '/login');
                
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Logged out from all devices'),
                  ),
                );
              },
              child: const Text('Logout All'),
            ),
          ],
        );
      },
    );
  }
}