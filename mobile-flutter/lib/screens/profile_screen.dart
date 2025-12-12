import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../providers/auth_provider.dart';
import '../models/user_model.dart';
import '../widgets/primary_button.dart';
import '../widgets/input_field.dart';
import '../widgets/loading_indicator.dart';
import '../utils/validators.dart';
import '../utils/constants.dart';
import '../themes/colors.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _positionController = TextEditingController();
  final _departmentController = TextEditingController();
  
  bool _isEditing = false;
  bool _isLoading = false;
  String? _profileImageUrl;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  void _loadUserData() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;
    
    if (user != null) {
      _firstNameController.text = user.firstName;
      _lastNameController.text = user.lastName;
      _emailController.text = user.email;
      _phoneController.text = user.phone ?? '';
      _positionController.text = user.position ?? '';
      _departmentController.text = user.department ?? '';
      _profileImageUrl = user.profileImageUrl;
    }
  }

  Future<void> _updateProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    final success = await authProvider.updateProfile(
      firstName: _firstNameController.text.trim(),
      lastName: _lastNameController.text.trim(),
      phone: _phoneController.text.trim(),
      position: _positionController.text.trim(),
      department: _departmentController.text.trim(),
    );

    if (success && mounted) {
      setState(() {
        _isEditing = false;
        _isLoading = false;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile updated successfully'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.error ?? 'Update failed'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _pickProfileImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    
    if (pickedFile != null) {
      // Upload image to server
      setState(() {
        _isLoading = true;
      });
      
      // Mock upload
      await Future.delayed(const Duration(seconds: 2));
      
      setState(() {
        _profileImageUrl = pickedFile.path;
        _isLoading = false;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile picture updated'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          if (!_isEditing)
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              onPressed: () {
                setState(() => _isEditing = true);
              },
            ),
          if (_isEditing)
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: () {
                setState(() {
                  _isEditing = false;
                  _loadUserData(); // Reset changes
                });
              },
            ),
        ],
      ),
      body: _isLoading
          ? const LoadingIndicator()
          : SingleChildScrollView(
              padding: const EdgeInsets.all(AppConstants.paddingLarge),
              child: Column(
                children: [
                  _buildProfileHeader(user),
                  const SizedBox(height: 32),
                  if (_isEditing)
                    _buildEditForm()
                  else
                    _buildProfileInfo(user),
                  const SizedBox(height: 32),
                  _buildAccountActions(),
                ],
              ),
            ),
    );
  }

  Widget _buildProfileHeader(User? user) {
    return Column(
      children: [
        GestureDetector(
          onTap: _isEditing ? _pickProfileImage : null,
          child: Stack(
            children: [
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.primary.withOpacity(0.2),
                    width: 3,
                  ),
                ),
                child: ClipOval(
                  child: _profileImageUrl != null
                      ? Image.network(
                          _profileImageUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return _buildDefaultAvatar(user);
                          },
                        )
                      : _buildDefaultAvatar(user),
                ),
              ),
              if (_isEditing)
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.camera_alt_outlined,
                      size: 20,
                      color: Colors.white,
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Text(
          user?.fullName ?? 'Loading...',
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        if (user?.position != null)
          Text(
            user!.position!,
            style: const TextStyle(
              fontSize: 16,
              color: Colors.grey,
            ),
          ),
        const SizedBox(height: 4),
        if (user?.organization != null)
          Text(
            user!.organization!.name,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.grey,
            ),
          ),
      ],
    );
  }

  Widget _buildDefaultAvatar(User? user) {
    return Container(
      color: AppColors.primary.withOpacity(0.1),
      child: Center(
        child: Text(
          user?.initials ?? '?',
          style: const TextStyle(
            fontSize: 40,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
      ),
    );
  }

  Widget _buildEditForm() {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: InputField(
                  controller: _firstNameController,
                  labelText: 'First Name',
                  hintText: 'Enter first name',
                  validator: (value) => Validators.validateName(
                    value,
                    fieldName: 'First name',
                  ),
                  enabled: _isEditing,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: InputField(
                  controller: _lastNameController,
                  labelText: 'Last Name',
                  hintText: 'Enter last name',
                  validator: (value) => Validators.validateName(
                    value,
                    fieldName: 'Last name',
                  ),
                  enabled: _isEditing,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          InputField(
            controller: _emailController,
            labelText: 'Email',
            hintText: 'Enter email',
            keyboardType: TextInputType.emailAddress,
            validator: Validators.validateEmail,
            enabled: false, // Email cannot be changed
          ),
          const SizedBox(height: 16),
          InputField(
            controller: _phoneController,
            labelText: 'Phone Number',
            hintText: 'Enter phone number',
            keyboardType: TextInputType.phone,
            validator: Validators.validatePhone,
            enabled: _isEditing,
          ),
          const SizedBox(height: 16),
          InputField(
            controller: _positionController,
            labelText: 'Position',
            hintText: 'Enter your position',
            enabled: _isEditing,
          ),
          const SizedBox(height: 16),
          InputField(
            controller: _departmentController,
            labelText: 'Department',
            hintText: 'Enter your department',
            enabled: _isEditing,
          ),
          const SizedBox(height: 24),
          PrimaryButton(
            text: 'Save Changes',
            onPressed: _updateProfile,
            fullWidth: true,
            isLoading: _isLoading,
          ),
        ],
      ),
    );
  }

  Widget _buildProfileInfo(User? user) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInfoCard(
          title: 'Personal Information',
          children: [
            _buildInfoRow('Email', user?.email ?? 'N/A'),
            _buildInfoRow('Phone', user?.phone ?? 'Not provided'),
            _buildInfoRow('Position', user?.position ?? 'Not specified'),
            _buildInfoRow('Department', user?.department ?? 'Not specified'),
          ],
        ),
        const SizedBox(height: 16),
        _buildInfoCard(
          title: 'Organization',
          children: [
            _buildInfoRow('Organization', user?.organization?.name ?? 'N/A'),
            _buildInfoRow(
              'Member Since',
              user?.createdAt?.format(pattern: 'MMM dd, yyyy') ?? 'N/A',
            ),
            _buildInfoRow('Role', user?.role?.name ?? 'User'),
          ],
        ),
        const SizedBox(height: 16),
        _buildInfoCard(
          title: 'Account',
          children: [
            _buildInfoRow('User ID', user?.id ?? 'N/A'),
            _buildInfoRow(
              'Last Login',
              user?.lastLogin?.format(pattern: 'MMM dd, yyyy HH:mm') ?? 'Never',
            ),
            _buildInfoRow('Status', 'Active'),
          ],
        ),
      ],
    );
  }

  Widget _buildInfoCard({
    required String title,
    required List<Widget> children,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingLarge),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
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

  Widget _buildAccountActions() {
    return Column(
      children: [
        ListTile(
          leading: const Icon(Icons.notifications_outlined),
          title: const Text('Notification Settings'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () {
            Navigator.pushNamed(context, '/settings/notifications');
          },
        ),
        ListTile(
          leading: const Icon(Icons.lock_outlined),
          title: const Text('Change Password'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () {
            Navigator.pushNamed(context, '/change-password');
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
          leading: const Icon(Icons.description_outlined),
          title: const Text('Terms & Privacy'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () {
            Navigator.pushNamed(context, '/terms');
          },
        ),
        ListTile(
          leading: const Icon(Icons.logout_outlined, color: Colors.red),
          title: const Text(
            'Logout',
            style: TextStyle(color: Colors.red),
          ),
          onTap: () {
            _confirmLogout();
          },
        ),
      ],
    );
  }

  void _confirmLogout() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Logout'),
          content: const Text('Are you sure you want to logout?'),
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
              },
              child: const Text(
                'Logout',
                style: TextStyle(color: Colors.red),
              ),
            ),
          ],
        );
      },
    );
  }
}