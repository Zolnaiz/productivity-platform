import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';

// Routes
import 'app_router.dart';
import 'theme.dart';
// Providers
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'providers/task_provider.dart';
import 'providers/work_log_provider.dart';
import 'providers/five_s_provider.dart';
import 'providers/inbox_provider.dart';
import 'providers/idea_provider.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'utils/phase_one_strings.dart';
// Services
import 'services/api_service.dart';
import 'services/outbox.dart';
import 'services/storage_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Load local environment variables when available.
  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {
    await dotenv.load(fileName: '.env.example');
  }

  // Initialize services
  await StorageService().init();
  await ApiService().initialize();

  // What was done offline before the app was closed is still to be sent.
  final outbox = Outbox(ApiService());
  await outbox.restore();
  outbox.start();

  // No pending font initialization required; fonts loaded when used.

  runApp(ProductivityApp(outbox: outbox));
}

class ProductivityApp extends StatelessWidget {
  const ProductivityApp({super.key, required this.outbox});

  final Outbox outbox;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider.value(value: outbox),
        ChangeNotifierProvider(
            create: (_) => TaskProvider(ApiService(), outbox: outbox)),
        ChangeNotifierProvider(
            create: (_) => WorkLogProvider(ApiService(), outbox: outbox)),
        ChangeNotifierProvider(create: (_) => InboxProvider(ApiService())),
        ChangeNotifierProvider(
            create: (_) => IdeaProvider(ApiService(), outbox: outbox)),
        ChangeNotifierProvider(
            create: (_) => FiveSProvider(ApiService(), outbox: outbox)),
      ],
      child: Consumer<ThemeProvider>(
        builder:
            (BuildContext context, ThemeProvider themeProvider, Widget? child) {
          return MaterialApp.router(
            title: 'Productivity Platform',
            supportedLocales: const [Locale('en'), Locale('mn')],
            localizationsDelegates: const [
              MongolianMaterialDelegate(),
              MongolianCupertinoDelegate(),
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            debugShowCheckedModeBanner: false,
            theme: buildLightTheme(),
            darkTheme: buildDarkTheme(),
            themeMode: themeProvider.themeMode,
            routerConfig: AppRouter.createRouter(
              Provider.of<AuthProvider>(context, listen: false),
            ),
            // The phone's text size is the reader's: somebody who enlarged
            // it needs it here too. Held at twice the default, where the
            // screens are checked, so a very large setting cannot push a
            // button off the screen.
            builder: (BuildContext context, Widget? child) {
              return MediaQuery(
                data: MediaQuery.of(context).copyWith(
                    textScaler: MediaQuery.textScalerOf(context)
                        .clamp(maxScaleFactor: maxTextScale)),
                child: child!,
              );
            },
          );
        },
      ),
    );
  }
}
