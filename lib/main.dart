import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const CivicFixApp());
}

class CivicFixApp extends StatelessWidget {
  const CivicFixApp({super.key});

  @override
  Widget build(BuildContext context) {
    const seedColor = Color(0xFF006699);

    return MaterialApp(
      title: 'CivicFix GovPortal',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.system,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: seedColor,
          brightness: Brightness.light,
          surface: const Color(0xFFF8FAFC),
        ),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          elevation: 0,
          scrolledUnderElevation: 1,
        ),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: seedColor,
          brightness: Brightness.dark,
          surface: const Color(0xFF0F172A),
        ),
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF1E293B),
          elevation: 0,
          scrolledUnderElevation: 1,
        ),
      ),
      home: const AuthGate(),
    );
  }
}

/// Statutory AuthGate: Defaults to Public Guest Exploration Mode without locking users out.
class AuthGate extends StatelessWidget {
  final Object? session;

  const AuthGate({super.key, this.session});

  @override
  Widget build(BuildContext context) {
    // If session == null, directly render HomeScreen in Public Guest Mode
    return HomeScreen(isGuest: session == null);
  }
}
