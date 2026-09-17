import 'package:flutter_test/flutter_test.dart';
import 'package:civic_connect/services/severity_engine.dart';

void main() {
  group('SeverityEngine Mathematical & Triage Tests', () {
    test('Category Base Weights exist for all 14 civic hazard categories', () {
      expect(SeverityEngine.categoryBaseWeights['manhole_open'], equals(95.0));
      expect(SeverityEngine.categoryBaseWeights['traffic_signal_broken'], equals(90.0));
      expect(SeverityEngine.categoryBaseWeights['tree_fallen'], equals(85.0));
      expect(SeverityEngine.categoryBaseWeights['water_leakage'], equals(75.0));
      expect(SeverityEngine.categoryBaseWeights['pothole'], equals(70.0));
      expect(SeverityEngine.categoryBaseWeights['drainage_blocked'], equals(65.0));
      expect(SeverityEngine.categoryBaseWeights['broken_sidewalk'], equals(55.0));
      expect(SeverityEngine.categoryBaseWeights['stray_animals'], equals(50.0));
      expect(SeverityEngine.categoryBaseWeights['street_light'], equals(50.0));
      expect(SeverityEngine.categoryBaseWeights['garbage_dump'], equals(45.0));
      expect(SeverityEngine.categoryBaseWeights['illegal_construction'], equals(40.0));
      expect(SeverityEngine.categoryBaseWeights['road_sign_missing'], equals(40.0));
      expect(SeverityEngine.categoryBaseWeights['public_toilet_broken'], equals(35.0));
      expect(SeverityEngine.categoryBaseWeights['illegal_parking'], equals(30.0));
    });

    test('Composite Severity Score calculation obeys mathematical formula', () {
      // Open manhole (95.0), urgency 5 (100), affected 500 (100), upvotes 100 (100), open 72h (100)
      // (95 * 0.35 = 33.25) + (100 * 0.25 = 25) + (100 * 0.15 = 15) + (100 * 0.15 = 15) + (100 * 0.10 = 10) = 98.25 -> 98.3
      final maxScore = SeverityEngine.calculateSeverityScore(
        category: 'manhole_open',
        urgencyLevel: 5,
        affectedPeople: 500,
        upvotes: 100,
        createdAt: DateTime.now().subtract(const Duration(hours: 72)),
      );
      expect(maxScore, closeTo(98.3, 0.2));

      // Illegal parking (30.0), urgency 1 (20), affected 1 (0.2), upvotes 0 (0), open 0h (0)
      // (30 * 0.35 = 10.5) + (20 * 0.25 = 5.0) + (0.2 * 0.15 = 0.03) + 0 + 0 = 15.53 -> 15.5
      final minScore = SeverityEngine.calculateSeverityScore(
        category: 'illegal_parking',
        urgencyLevel: 1,
        affectedPeople: 1,
        upvotes: 0,
        createdAt: DateTime.now(),
      );
      expect(minScore, closeTo(15.5, 0.2));
    });

    test('S1 to S5 Tier Classification and Dynamic SLA mapping', () {
      expect(SeverityEngine.getSeverityTier(85.0), equals('S5'));
      expect(SeverityEngine.getSeverityTier(72.0), equals('S4'));
      expect(SeverityEngine.getSeverityTier(55.0), equals('S3'));
      expect(SeverityEngine.getSeverityTier(40.0), equals('S2'));
      expect(SeverityEngine.getSeverityTier(20.0), equals('S1'));

      expect(SeverityEngine.getSlaTargetHours('S5'), equals(4));
      expect(SeverityEngine.getSlaTargetHours('S4'), equals(12));
      expect(SeverityEngine.getSlaTargetHours('S3'), equals(48));
      expect(SeverityEngine.getSlaTargetHours('S2'), equals(168));
      expect(SeverityEngine.getSlaTargetHours('S1'), equals(336));

      expect(SeverityEngine.getSlaLabel('S5'), equals('4 Hours'));
      expect(SeverityEngine.getSlaLabel('S4'), equals('12 Hours'));
      expect(SeverityEngine.getSlaLabel('S3'), equals('48 Hours'));
      expect(SeverityEngine.getSlaLabel('S2'), equals('7 Days'));
      expect(SeverityEngine.getSlaLabel('S1'), equals('14 Days'));
    });

    test('2-Hour Rapid On-Site Survey window detection and remaining time', () {
      final now = DateTime.now();
      final withinWindow = now.subtract(const Duration(minutes: 30));
      final closedWindow = now.subtract(const Duration(minutes: 150));

      expect(SeverityEngine.isWithinTwoHourSurveyWindow(withinWindow), isTrue);
      expect(SeverityEngine.isWithinTwoHourSurveyWindow(closedWindow), isFalse);

      expect(SeverityEngine.remainingSurveyMinutes(withinWindow), inInclusiveRange(88, 91));
      expect(SeverityEngine.remainingSurveyMinutes(closedWindow), equals(0));

      final strWithin = SeverityEngine.formatRemainingSurveyTime(withinWindow);
      expect(strWithin.contains('left'), isTrue);

      final strClosed = SeverityEngine.formatRemainingSurveyTime(closedWindow);
      expect(strClosed, equals('Survey Window Closed'));
    });

    test('Ground Audit Hazard Modifier accurately computes multi-factor weights', () {
      // Lethal (+20) + Full Closure (+15) + Vulnerable Zone (+10) = +45.0
      final lethalMod = SeverityEngine.calculateGroundSurveyModifier(
        groundHazardLevel: 'lethal',
        trafficBlockage: 'full_closure',
        isNearVulnerableZone: true,
      );
      expect(lethalMod, equals(45.0));

      // Minimal (-10) + No blockage (0) + Normal Zone (0) = -10.0
      final minimalMod = SeverityEngine.calculateGroundSurveyModifier(
        groundHazardLevel: 'minimal',
        trafficBlockage: 'none',
        isNearVulnerableZone: false,
      );
      expect(minimalMod, equals(-10.0));

      // High (+10) + Partial Closure (+5) + Vulnerable Zone (+10) = +25.0
      final highMod = SeverityEngine.calculateGroundSurveyModifier(
        groundHazardLevel: 'high',
        trafficBlockage: 'partial',
        isNearVulnerableZone: true,
      );
      expect(highMod, equals(25.0));
    });

    test('Intelligent Triage Sorting accurately arranges feeds by priority', () {
      final issueA = {
        'id': '1',
        'title': 'Open Manhole',
        'category': 'manhole_open',
        'urgency_level': 5,
        'affected_people': 300,
        'upvotes_count': 50,
        'created_at': DateTime.now().subtract(const Duration(hours: 3)).toIso8601String(),
      }; // High score (S5)

      final issueB = {
        'id': '2',
        'title': 'Broken Sidewalk',
        'category': 'broken_sidewalk',
        'urgency_level': 2,
        'affected_people': 10,
        'upvotes_count': 2,
        'created_at': DateTime.now().subtract(const Duration(minutes: 20)).toIso8601String(),
      }; // Lower score (S2), but in 2-Hr survey window!

      final rawList = [issueB, issueA];

      // Sort by highest severity -> issueA should be first
      final severitySorted = SeverityEngine.sortIssues(issues: rawList, sortMode: 'highest_severity');
      expect(severitySorted.first['id'], equals('1'));

      // Sort by rapid survey -> issueB should be first because it is in active 120-min window
      final rapidSorted = SeverityEngine.sortIssues(issues: rawList, sortMode: 'rapid_survey');
      expect(rapidSorted.first['id'], equals('2'));
    });
  });
}
