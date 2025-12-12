import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/questionnaire_list_screen.dart';
import 'screens/questionnaire_detail_screen.dart';
import 'screens/expense_list_screen.dart';
import 'screens/expense_form_screen.dart';
import 'screens/report_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/settings_screen.dart';

import 'providers/auth_provider.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/questionnaires',
        builder: (context, state) => const QuestionnaireListScreen(),
      ),
      GoRoute(
        path: '/questionnaires/:id',
        builder: (context, state) => QuestionnaireDetailScreen(
          questionnaireId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/expenses',
        builder: (context, state) => const ExpenseListScreen(),
      ),
      GoRoute(
        path: '/expenses/new',
        builder: (context, state) => const ExpenseFormScreen(),
      ),
      GoRoute(
        path: '/expenses/:id/edit',
        builder: (context, state) => ExpenseFormScreen(
          expenseId: state.pathParameters['id'],
        ),
      ),
      GoRoute(
        path: '/reports',
        builder: (context, state) => const ReportScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
    ],
    redirect: (context, state) {
      final authProvider = AuthProvider();
      final isLoggedIn = authProvider.isAuthenticated;
      
      // If user is not logged in and trying to access protected routes
      if (!isLoggedIn && 
          state.location != '/login' && 
          state.location != '/register' &&
          state.location != '/') {
        return '/login';
      }
      
      // If user is logged in and trying to access login/register
      if (isLoggedIn && 
          (state.location == '/login' || state.location == '/register')) {
        return '/dashboard';
      }
      
      return null;
    },
  );
}