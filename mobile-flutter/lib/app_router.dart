import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'providers/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/home_screen.dart';

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
          path: '/dashboard',
          builder: (BuildContext context, GoRouterState state) =>
              const HomeScreen(),
        ),
      ],
      refreshListenable: authProvider,
      redirect: (BuildContext context, GoRouterState state) {
        final location = state.uri.path;
        final isLoading = authProvider?.isLoading ?? true;
        final isLoggedIn = authProvider?.isAuthenticated ?? false;

        if (isLoading) {
          return location == '/' ? null : '/';
        }

        if (location == '/') {
          return isLoggedIn ? '/dashboard' : '/login';
        }

        // If user is not logged in and trying to access protected routes
        if (!isLoggedIn && location != '/login') {
          return '/login';
        }

        // If user is logged in and trying to access login/register
        if (isLoggedIn && location == '/login') {
          return '/dashboard';
        }

        return null;
      },
    );
  }
}
