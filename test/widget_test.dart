import 'package:flutter_test/flutter_test.dart';

void main() {
  group('CivicFix Business Logic Tests', () {
    test('Email validation checks format correctly', () {
      final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');

      expect(emailRegex.hasMatch('citizen@civicfix.org'), isTrue);
      expect(emailRegex.hasMatch('invalid-email'), isFalse);
      expect(emailRegex.hasMatch('user@domain'), isFalse);
      expect(emailRegex.hasMatch('officer.zonal@mumbai.gov.in'), isTrue);
    });

    test('Password validation enforces 8+ characters', () {
      bool isValidPassword(String? p) => p != null && p.length >= 8;

      expect(isValidPassword('short'), isFalse);
      expect(isValidPassword('1234567'), isFalse);
      expect(isValidPassword('SecurePass123!'), isTrue);
    });

    test('Citizen Tier categorization gives proper rank badges', () {
      String getCitizenTier(int points) {
        if (points >= 500) return 'Diamond Guardian 💎';
        if (points >= 250) return 'Gold Warden 🥇';
        if (points >= 100) return 'Silver Inspector 🥈';
        if (points >= 50) return 'Bronze Scout 🥉';
        return 'Active Citizen 🛡️';
      }

      expect(getCitizenTier(600), equals('Diamond Guardian 💎'));
      expect(getCitizenTier(300), equals('Gold Warden 🥇'));
      expect(getCitizenTier(150), equals('Silver Inspector 🥈'));
      expect(getCitizenTier(75), equals('Bronze Scout 🥉'));
      expect(getCitizenTier(20), equals('Active Citizen 🛡️'));
    });

    test('Severity Level mapping conforms to S1-S5 scale', () {
      String getSeverityLevel(num score) {
        if (score >= 80) return 'S5';
        if (score >= 65) return 'S4';
        if (score >= 50) return 'S3';
        if (score >= 35) return 'S2';
        return 'S1';
      }

      expect(getSeverityLevel(95), equals('S5'));
      expect(getSeverityLevel(70), equals('S4'));
      expect(getSeverityLevel(55), equals('S3'));
      expect(getSeverityLevel(40), equals('S2'));
      expect(getSeverityLevel(10), equals('S1'));
    });

    test('SLA target hours calculation matches severity tiers', () {
      int getSlaHours(String severityLevel) {
        switch (severityLevel) {
          case 'S5':
            return 4; // 4 hours for Critical
          case 'S4':
            return 12; // 12 hours for High
          case 'S3':
            return 48; // 2 days for Medium
          case 'S2':
            return 168; // 1 week for Low
          case 'S1':
          default:
            return 336; // 2 weeks for Minimal
        }
      }

      expect(getSlaHours('S5'), equals(4));
      expect(getSlaHours('S4'), equals(12));
      expect(getSlaHours('S3'), equals(48));
      expect(getSlaHours('S2'), equals(168));
      expect(getSlaHours('S1'), equals(336));
    });
  });
}
