import 'package:flutter/material.dart';

/// SeverityEngine provides composite mathematical scoring, S1-S5 tier classification,
/// dynamic SLA target assignment, 2-Hour Rapid On-Site Survey mechanics, and intelligent
/// triage sorting across CivicFix.
class SeverityEngine {
  /// Base weights for all 14 civic hazard categories (scale: 0 - 100)
  static const Map<String, double> categoryBaseWeights = {
    'manhole_open': 95.0,
    'traffic_signal_broken': 90.0,
    'tree_fallen': 85.0,
    'water_leakage': 75.0,
    'pothole': 70.0,
    'drainage_blocked': 65.0,
    'broken_sidewalk': 55.0,
    'stray_animals': 50.0,
    'street_light': 50.0,
    'garbage_dump': 45.0,
    'illegal_construction': 40.0,
    'road_sign_missing': 40.0,
    'public_toilet_broken': 35.0,
    'illegal_parking': 30.0,
  };

  /// Calculates composite severity score (0.0 to 100.0)
  /// Formula: (Category × 0.35) + (Urgency × 0.25) + (Affected × 0.15) + (Community × 0.15) + (Time × 0.10) + GroundModifier
  static double calculateSeverityScore({
    required String category,
    required int urgencyLevel,
    required int affectedPeople,
    int upvotes = 0,
    DateTime? createdAt,
    bool hasGroundSurvey = false,
    double groundHazardModifier = 0.0,
  }) {
    final double wCat = categoryBaseWeights[category] ?? 50.0;
    final double wUrgency = (urgencyLevel.clamp(1, 5) / 5.0) * 100.0;
    final double wAffected = (affectedPeople.clamp(1, 500) / 500.0) * 100.0;
    final double wCommunity = ((upvotes.clamp(0, 100)) / 100.0) * 100.0;

    double wTime = 0.0;
    if (createdAt != null) {
      final hoursOpen = DateTime.now().difference(createdAt).inHours;
      wTime = (hoursOpen.clamp(0, 72) / 72.0) * 100.0;
    }

    double baseScore = (wCat * 0.35) +
        (wUrgency * 0.25) +
        (wAffected * 0.15) +
        (wCommunity * 0.15) +
        (wTime * 0.10);

    if (hasGroundSurvey) {
      baseScore = baseScore + groundHazardModifier;
    }

    return double.parse(baseScore.clamp(0.0, 100.0).toStringAsFixed(1));
  }

  /// Evaluates severity score from raw issue map (with intelligent fallbacks)
  static double getScoreForIssue(Map<String, dynamic> issue) {
    if (issue['severity_score'] != null && issue['severity_score'] is num) {
      return (issue['severity_score'] as num).toDouble();
    }

    final category = issue['category']?.toString() ?? 'pothole';
    final urgency = (issue['urgency_level'] as num?)?.toInt() ?? 3;
    final affected = (issue['affected_people'] as num?)?.toInt() ?? 10;
    final upvotes = (issue['upvotes_count'] ?? issue['upvotes'] as num?)?.toInt() ?? 0;
    final createdAt = DateTime.tryParse(issue['created_at']?.toString() ?? '');
    final hasSurvey = issue['has_ground_survey'] == true || issue['ground_survey'] != null;
    final groundMod = (issue['ground_hazard_modifier'] as num?)?.toDouble() ?? 0.0;

    return calculateSeverityScore(
      category: category,
      urgencyLevel: urgency,
      affectedPeople: affected,
      upvotes: upvotes,
      createdAt: createdAt,
      hasGroundSurvey: hasSurvey,
      groundHazardModifier: groundMod,
    );
  }

  /// Maps a numeric score (0-100) to an S1-S5 severity tier
  static String getSeverityTier(double score) {
    if (score >= 80.0) return 'S5';
    if (score >= 65.0) return 'S4';
    if (score >= 50.0) return 'S3';
    if (score >= 35.0) return 'S2';
    return 'S1';
  }

  /// Returns statutory SLA target in hours based on severity tier
  static int getSlaTargetHours(String tier) {
    switch (tier.toUpperCase()) {
      case 'S5':
        return 4; // 4 Hours (Life/Safety Critical)
      case 'S4':
        return 12; // 12 Hours (High Impact)
      case 'S3':
        return 48; // 48 Hours (2 Days - Moderate)
      case 'S2':
        return 168; // 7 Days (1 Week - Low)
      case 'S1':
      default:
        return 336; // 14 Days (2 Weeks - Minimal)
    }
  }

  /// Human-readable label for severity tier (Bilingual EN/HI)
  static String getTierLabel(String tier) {
    switch (tier.toUpperCase()) {
      case 'S5':
        return 'S5 Critical (अत्यंत गंभीर)';
      case 'S4':
        return 'S4 High (उच्च प्राथमिकता)';
      case 'S3':
        return 'S3 Moderate (मध्यम)';
      case 'S2':
        return 'S2 Low (निम्न)';
      case 'S1':
      default:
        return 'S1 Minimal (सामान्य)';
    }
  }

  /// Color palette for severity tiers
  static Color getTierColor(String tier) {
    switch (tier.toUpperCase()) {
      case 'S5':
        return Colors.red.shade700;
      case 'S4':
        return Colors.deepOrange.shade600;
      case 'S3':
        return Colors.amber.shade800;
      case 'S2':
        return Colors.blue.shade600;
      case 'S1':
      default:
        return Colors.teal.shade600;
    }
  }

  /// SLA human string for severity tier
  static String getSlaLabel(String tier) {
    switch (tier.toUpperCase()) {
      case 'S5':
        return '4 Hours';
      case 'S4':
        return '12 Hours';
      case 'S3':
        return '48 Hours';
      case 'S2':
        return '7 Days';
      case 'S1':
      default:
        return '14 Days';
    }
  }

  // ==========================================
  // 2-HOUR RAPID ON-SITE SURVEY MECHANICS
  // ==========================================

  /// Checks if the issue is currently within its 2-hour rapid on-site survey window (120 min from creation)
  static bool isWithinTwoHourSurveyWindow(DateTime? createdAt) {
    if (createdAt == null) return false;
    final diffMinutes = DateTime.now().difference(createdAt).inMinutes;
    return diffMinutes >= 0 && diffMinutes <= 120;
  }

  /// Remaining minutes in the 2-hour rapid survey window
  static int remainingSurveyMinutes(DateTime? createdAt) {
    if (createdAt == null) return 0;
    final diffMinutes = DateTime.now().difference(createdAt).inMinutes;
    final remaining = 120 - diffMinutes;
    return remaining > 0 ? remaining : 0;
  }

  /// Formatted string of remaining survey time (e.g., "1h 42m remaining" or "28m remaining")
  static String formatRemainingSurveyTime(DateTime? createdAt) {
    final minutes = remainingSurveyMinutes(createdAt);
    if (minutes <= 0) return 'Survey Window Closed';
    final hrs = minutes ~/ 60;
    final mins = minutes % 60;
    if (hrs > 0) {
      return '${hrs}h ${mins}m left';
    }
    return '${mins}m left';
  }

  /// Calculates ground audit hazard modifier from multi-factor on-site survey
  static double calculateGroundSurveyModifier({
    required String groundHazardLevel, // 'minimal', 'moderate', 'high', 'lethal'
    required String trafficBlockage, // 'none', 'partial', 'full_closure'
    required bool isNearVulnerableZone, // School, hospital, metro/bus transit
  }) {
    double modifier = 0.0;

    // Hazard Level Factor
    switch (groundHazardLevel) {
      case 'lethal':
        modifier += 20.0;
        break;
      case 'high':
        modifier += 10.0;
        break;
      case 'minimal':
        modifier -= 10.0;
        break;
      case 'moderate':
      default:
        modifier += 0.0;
        break;
    }

    // Traffic Blockage Factor
    switch (trafficBlockage) {
      case 'full_closure':
        modifier += 15.0;
        break;
      case 'partial':
        modifier += 5.0;
        break;
      default:
        break;
    }

    // Vulnerable Zone Proximity (School / Hospital / Senior Citizen Hub)
    if (isNearVulnerableZone) {
      modifier += 10.0;
    }

    return modifier;
  }

  // ==========================================
  // INTELLIGENT FEED SORTING & TRIAGE
  // ==========================================

  /// Sorts a list of issues by chosen priority mode:
  /// - 'highest_severity': Sorts strictly S5 -> S1 by composite score
  /// - 'rapid_survey': Puts active 2-hour rapid survey issues first, then by severity
  /// - 'overdue_sla': Puts breached/urgent SLA issues first
  /// - 'newest': Chronological descending
  static List<Map<String, dynamic>> sortIssues({
    required List<Map<String, dynamic>> issues,
    required String sortMode,
  }) {
    final List<Map<String, dynamic>> sorted = List<Map<String, dynamic>>.from(issues);

    switch (sortMode) {
      case 'highest_severity':
        sorted.sort((a, b) {
          final scoreA = getScoreForIssue(a);
          final scoreB = getScoreForIssue(b);
          return scoreB.compareTo(scoreA);
        });
        break;

      case 'rapid_survey':
        sorted.sort((a, b) {
          final createdA = DateTime.tryParse(a['created_at']?.toString() ?? '');
          final createdB = DateTime.tryParse(b['created_at']?.toString() ?? '');
          final inWindowA = isWithinTwoHourSurveyWindow(createdA);
          final inWindowB = isWithinTwoHourSurveyWindow(createdB);

          if (inWindowA && !inWindowB) return -1;
          if (!inWindowA && inWindowB) return 1;

          // If both in window or both outside, sort by severity
          final scoreA = getScoreForIssue(a);
          final scoreB = getScoreForIssue(b);
          return scoreB.compareTo(scoreA);
        });
        break;

      case 'overdue_sla':
        sorted.sort((a, b) {
          final createdA = DateTime.tryParse(a['created_at']?.toString() ?? '') ?? DateTime.now();
          final createdB = DateTime.tryParse(b['created_at']?.toString() ?? '') ?? DateTime.now();

          final tierA = getSeverityTier(getScoreForIssue(a));
          final tierB = getSeverityTier(getScoreForIssue(b));

          final slaHoursA = getSlaTargetHours(tierA);
          final slaHoursB = getSlaTargetHours(tierB);

          final elapsedA = DateTime.now().difference(createdA).inHours;
          final elapsedB = DateTime.now().difference(createdB).inHours;

          final urgencyA = elapsedA - slaHoursA; // Higher positive = more overdue
          final urgencyB = elapsedB - slaHoursB;

          return urgencyB.compareTo(urgencyA);
        });
        break;

      case 'newest':
      default:
        sorted.sort((a, b) {
          final createdA = DateTime.tryParse(a['created_at']?.toString() ?? '') ?? DateTime.now();
          final createdB = DateTime.tryParse(b['created_at']?.toString() ?? '') ?? DateTime.now();
          return createdB.compareTo(createdA);
        });
        break;
    }

    return sorted;
  }
}
