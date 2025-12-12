import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'screens/dashboard_screen.dart';
import 'screens/expense_form_screen.dart';
import 'screens/expense_list_screen.dart';
import 'screens/login_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/questionnaire_detail_screen.dart';
import 'screens/questionnaire_list_screen.dart';
import 'screens/register_screen.dart';
import 'screens/report_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/splash_screen.dart';

class AppRouter {
  static GoRouter createRouter(AuthProvider? authProvider) {
    return GoRouter(
      routes: [
        GoRoute(
          path: '/',
          builder: (BuildContext context, GoRouterState state) =>
              const SplashScreen(),
        ),
        GoRoute(
          path: '/login',
          builder: (BuildContext context, GoRouterState state) =>
              const LoginScreen(),
        ),
        GoRoute(
          path: '/register',
          builder: (BuildContext context, GoRouterState state) =>
              const RegisterScreen(),
        ),
        GoRoute(
          path: '/dashboard',
          builder: (BuildContext context, GoRouterState state) =>
              const DashboardScreen(),
        ),
        GoRoute(
          path: '/questionnaires',
          builder: (BuildContext context, GoRouterState state) =>
              const QuestionnaireListScreen(),
        ),
        GoRoute(
          path: '/questionnaires/:id',
          builder: (BuildContext context, GoRouterState state) =>
              QuestionnaireDetailScreen(
                questionnaireId: state.pathParameters['id'] as String,
              ),
        ),
        GoRoute(
          path: '/expenses',
          builder: (BuildContext context, GoRouterState state) =>
              const ExpenseListScreen(),
        ),
        GoRoute(
          path: '/expenses/new',
          builder: (BuildContext context, GoRouterState state) =>
              const ExpenseFormScreen(),
        ),
        GoRoute(
          path: '/expenses/:id/edit',
          builder: (BuildContext context, GoRouterState state) =>
              ExpenseFormScreen(
                expenseId: state.pathParameters['id'] as String?,
              ),
        ),
        GoRoute(
          path: '/reports',
          builder: (BuildContext context, GoRouterState state) =>
              const ReportScreen(),
        ),
        GoRoute(
          path: '/profile',
          builder: (BuildContext context, GoRouterState state) =>
              const ProfileScreen(),
        ),
        GoRoute(
          path: '/settings',
          builder: (BuildContext context, GoRouterState state) =>
              const SettingsScreen(),
        ),
      ],
      refreshListenable: authProvider,
      redirect: (BuildContext context, GoRouterState state) {
        final isLoggedIn = authProvider?.isAuthenticated ?? false;

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
}
