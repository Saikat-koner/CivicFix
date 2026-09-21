import 'dart:math';
import 'dart:typed_data';
import 'package:flutter/material.dart';

/// 14 Bilingual Civic Categories (English + Hindi) with Base Weights
class CivicCategory {
  final String id;
  final String englishName;
  final String hindiName;
  final IconData icon;
  final Color themeColor;
  final String department;
  final double baseWeight; // W_cat (0-100)

  const CivicCategory({
    required this.id,
    required this.englishName,
    required this.hindiName,
    required this.icon,
    required this.themeColor,
    required this.department,
    required this.baseWeight,
  });

  String get displayName => '$englishName / $hindiName';
}

/// Official 14 Bilingual Categories for Citizen Redressal with Deterministic Weights
const List<CivicCategory> kCivic14Categories = [
  CivicCategory(
    id: 'drainage',
    englishName: 'Open Manholes & Drainage',
    hindiName: 'खुले मैनहोल और जल निकासी',
    icon: Icons.waves_rounded,
    themeColor: Color(0xFF0D9488),
    department: 'Stormwater Drain (SWD) Wing',
    baseWeight: 95.0, // manhole_open
  ),
  CivicCategory(
    id: 'violations',
    englishName: 'Building Collapse & Violations',
    hindiName: 'भवन ढहने का खतरा और अवैध निर्माण',
    icon: Icons.domain_disabled_rounded,
    themeColor: Color(0xFFDC2626),
    department: 'Town Planning & Building Vigilance',
    baseWeight: 95.0, // building_collapse_risk
  ),
  CivicCategory(
    id: 'traffic',
    englishName: 'Traffic Signals & Transit',
    hindiName: 'यातायात सिग्नल और पारगमन',
    icon: Icons.traffic_rounded,
    themeColor: Color(0xFFEA580C),
    department: 'Traffic Police & Urban Transit',
    baseWeight: 80.0, // traffic_signal_broken
  ),
  CivicCategory(
    id: 'parks',
    englishName: 'Fallen Trees & Public Parks',
    hindiName: 'गिरे हुए पेड़ और सार्वजनिक पार्क',
    icon: Icons.park_rounded,
    themeColor: Color(0xFF16A34A),
    department: 'Horticulture & Urban Forestry',
    baseWeight: 75.0, // tree_fallen
  ),
  CivicCategory(
    id: 'roads',
    englishName: 'Roads & Potholes',
    hindiName: 'सड़कें और गड्ढे',
    icon: Icons.add_road_rounded,
    themeColor: Color(0xFFD97706),
    department: 'Roads & Infrastructure Engineering',
    baseWeight: 65.0, // pothole
  ),
  CivicCategory(
    id: 'water_supply',
    englishName: 'Water Supply & Leakages',
    hindiName: 'जल आपूर्ति और रिसाव',
    icon: Icons.water_drop_rounded,
    themeColor: Color(0xFF0284C7),
    department: 'Water Supply & Sewerage Board',
    baseWeight: 60.0, // water_leakage
  ),
  CivicCategory(
    id: 'stray_animals',
    englishName: 'Stray Animals & Rabies Risk',
    hindiName: 'आवारा पशु और रेबीज',
    icon: Icons.pets_rounded,
    themeColor: Color(0xFFDB2777),
    department: 'Animal Husbandry & Vet Care',
    baseWeight: 40.0, // stray_animals
  ),
  CivicCategory(
    id: 'noise',
    englishName: 'Illegal Parking & Encroachment',
    hindiName: 'अवैध पार्किंग और अतिक्रमण',
    icon: Icons.local_parking_rounded,
    themeColor: Color(0xFF4F46E5),
    department: 'Encroachment Removal Taskforce',
    baseWeight: 30.0, // illegal_parking
  ),
  CivicCategory(
    id: 'streetlights',
    englishName: 'Streetlights & Electrical',
    hindiName: 'स्ट्रीट लाइट और बिजली',
    icon: Icons.lightbulb_outline_rounded,
    themeColor: Color(0xFFEAB308),
    department: 'Public Lighting & Power Grid',
    baseWeight: 55.0,
  ),
  CivicCategory(
    id: 'sanitation',
    englishName: 'Sanitation & Solid Waste',
    hindiName: 'स्वच्छता और कचरा प्रबंधन',
    icon: Icons.delete_outline_rounded,
    themeColor: Color(0xFF059669),
    department: 'Solid Waste Management Cell',
    baseWeight: 50.0,
  ),
  CivicCategory(
    id: 'footpaths',
    englishName: 'Footpaths & Pedestrian Access',
    hindiName: 'फुटपाथ और पैदल मार्ग',
    icon: Icons.directions_walk_rounded,
    themeColor: Color(0xFF6366F1),
    department: 'Pedestrian Infrastructure Division',
    baseWeight: 45.0,
  ),
  CivicCategory(
    id: 'health',
    englishName: 'Public Health & Clinics',
    hindiName: 'जन स्वास्थ्य और क्लीनिक',
    icon: Icons.local_hospital_rounded,
    themeColor: Color(0xFFE11D48),
    department: 'Municipal Health Directorate',
    baseWeight: 75.0,
  ),
  CivicCategory(
    id: 'schools',
    englishName: 'Municipal Schools',
    hindiName: 'नगर निगम स्कूल',
    icon: Icons.school_rounded,
    themeColor: Color(0xFF2563EB),
    department: 'Primary Education Cell',
    baseWeight: 70.0,
  ),
  CivicCategory(
    id: 'pollution',
    englishName: 'Air Quality & Pollution',
    hindiName: 'वायु गुणवत्ता और प्रदूषण',
    icon: Icons.air_rounded,
    themeColor: Color(0xFF7C3AED),
    department: 'Pollution Control Board',
    baseWeight: 55.0,
  ),
];

/// Statutory SLA Mapping & Severity Levels
/// S5 (80–100): 4 Hours (Crimson)
/// S4 (65–79.9): 12 Hours (Deep Orange)
/// S3 (50–64.9): 48 Hours (Amber)
/// S2 (35–49.9): 7 Days / 168h (Indigo)
/// S1 (0–34.9): 14 Days / 336h (Teal)
enum SeverityLevel {
  s5(
    code: 'S5',
    label: 'Critical Emergency',
    hindiLabel: 'गंभीर आपातकाल',
    slaHours: 4,
    color: Color(0xFFDC2626), // Crimson
    minScore: 80.0,
    maxScore: 100.0,
    description: 'Immediate threat to human life or critical infrastructure. 4-hour statutory SLA.',
  ),
  s4(
    code: 'S4',
    label: 'Severe Disruption',
    hindiLabel: 'गंभीर व्यवधान',
    slaHours: 12,
    color: Color(0xFFEA580C), // Deep Orange
    minScore: 65.0,
    maxScore: 79.9,
    description: 'Major arterial hazard or widespread utility stoppage. 12-hour statutory SLA.',
  ),
  s3(
    code: 'S3',
    label: 'Moderate Impact',
    hindiLabel: 'मध्यम प्रभाव',
    slaHours: 48,
    color: Color(0xFFD97706), // Amber
    minScore: 50.0,
    maxScore: 64.9,
    description: 'Noticeable public obstruction or sanitation bottleneck. 48-hour statutory SLA.',
  ),
  s2(
    code: 'S2',
    label: 'Standard Redressal',
    hindiLabel: 'मानक निवारण',
    slaHours: 168, // 7 Days
    color: Color(0xFF4F46E5), // Indigo
    minScore: 35.0,
    maxScore: 49.9,
    description: 'Routine neighborhood civic repair or scheduled maintenance. 7-day statutory SLA.',
  ),
  s1(
    code: 'S1',
    label: 'Low / Minor',
    hindiLabel: 'मामूली / कम प्राथमिकता',
    slaHours: 336, // 14 Days
    color: Color(0xFF0D9488), // Teal
    minScore: 0.0,
    maxScore: 34.9,
    description: 'Non-hazardous aesthetic issue, sign repaint, or landscape trim. 14-day SLA.',
  );

  final String code;
  final String label;
  final String hindiLabel;
  final int slaHours;
  final Color color;
  final double minScore;
  final double maxScore;
  final String description;

  const SeverityLevel({
    required this.code,
    required this.label,
    required this.hindiLabel,
    required this.slaHours,
    required this.color,
    required this.minScore,
    required this.maxScore,
    required this.description,
  });

  /// Map computed severity score (0-100) to Statutory SeverityLevel
  static SeverityLevel fromScore(double score) {
    if (score >= 80.0) return SeverityLevel.s5;
    if (score >= 65.0) return SeverityLevel.s4;
    if (score >= 50.0) return SeverityLevel.s3;
    if (score >= 35.0) return SeverityLevel.s2;
    return SeverityLevel.s1;
  }

  static SeverityLevel fromString(String? val) {
    if (val == null) return SeverityLevel.s3;
    final norm = val.toUpperCase().trim();
    if (norm == 'S5' || norm.contains('CRITICAL') || norm.contains('LETHAL')) return SeverityLevel.s5;
    if (norm == 'S4' || norm.contains('SEVERE') || norm.contains('HIGH')) return SeverityLevel.s4;
    if (norm == 'S3' || norm.contains('MODERATE') || norm.contains('MEDIUM')) return SeverityLevel.s3;
    if (norm == 'S2' || norm.contains('STANDARD') || norm.contains('7 DAYS')) return SeverityLevel.s2;
    if (norm == 'S1' || norm.contains('MINOR') || norm.contains('LOW') || norm.contains('14 DAYS')) return SeverityLevel.s1;
    return SeverityLevel.s3;
  }
}

/// 2-Hour Rapid On-Site Survey Ground-Truth Audit Model
class RapidSurveyAudit {
  final String id;
  final String citizenName;
  final DateTime auditedAt;
  final int hazardPoints; // Minimal (-10), Moderate (0), High (+10), Lethal (+20)
  final int blockagePoints; // None (0), Partial (+5), Full (+15)
  final int proximityPoints; // Normal (0), Vulnerable/School/Hospital (+10)
  final String notes;

  const RapidSurveyAudit({
    required this.id,
    required this.citizenName,
    required this.auditedAt,
    required this.hazardPoints,
    required this.blockagePoints,
    required this.proximityPoints,
    this.notes = '',
  });

  int get totalGroundModifier => (hazardPoints + blockagePoints + proximityPoints).clamp(-10, 45);
}

/// Deterministic 5-Variable Severity Scoring Calculator
class SeverityScoringEngine {
  /// Severity Score = (W_cat * 0.35) + (W_urgency * 0.25) + (W_affected * 0.15) + (W_community * 0.15) + (W_time * 0.10) + GroundModifier
  static double calculate({
    required double categoryBaseWeight,
    required double urgencyWeight, // 0-100 (Low: 25, Medium: 50, High: 75, Critical: 100)
    required double affectedScaleWeight, // 0-100 (Individual: 20, Street: 50, Block: 75, Ward: 100)
    required double communityWeight, // 0-100 (Upvotes/corroboration scaled)
    required double timeElapsedWeight, // 0-100 (Duration without action)
    int groundModifier = 0, // -10 to +45
  }) {
    final catPart = categoryBaseWeight * 0.35;
    final urgPart = urgencyWeight * 0.25;
    final affPart = affectedScaleWeight * 0.15;
    final comPart = communityWeight * 0.15;
    final timePart = timeElapsedWeight * 0.10;

    final rawScore = catPart + urgPart + affPart + comPart + timePart + groundModifier;
    return rawScore.clamp(0.0, 100.0);
  }
}

/// Statutory Citizen Hearing Model
class CitizenHearing {
  final String hearingId;
  final String issueId;
  final String officerName;
  final String officerTitle;
  final DateTime scheduledDate;
  final String timeSlot;
  final String citizenName;
  final String contactPhone;
  final String grievanceSummary;
  final String hearingMode; // 'In-Person at Ward Office' or 'Video Conference'
  final bool isConfirmed;

  const CitizenHearing({
    required this.hearingId,
    required this.issueId,
    required this.officerName,
    required this.officerTitle,
    required this.scheduledDate,
    required this.timeSlot,
    required this.citizenName,
    required this.contactPhone,
    required this.grievanceSummary,
    required this.hearingMode,
    this.isConfirmed = true,
  });
}

/// Civic Issue Model with 100% Web-Safe Byte Array Handling & Rapid Survey
class CivicIssue {
  final String id;
  final String code;
  final String title;
  final String description;
  final String categoryId;
  final double severityScore; // 0-100
  final SeverityLevel severity;
  final double latitude;
  final double longitude;
  final String address;
  final String district;
  final String status; // 'open', 'in_progress', 'resolved_by_worker', 'community_verified', 'resolved'
  final DateTime reportedAt;
  final DateTime slaDeadline;
  final DateTime rapidSurveyExpiresAt; // 120-minute countdown window
  final int upvotes;
  final bool hasUpvoted;
  final String reportedByName;
  final String? imageUrl;
  final Uint8List? imageBytes; // Web-safe memory image data
  final String? resolutionImageUrl; // For Before & After split slider
  final Uint8List? resolutionImageBytes;
  final List<CitizenHearing> scheduledHearings;
  final List<RapidSurveyAudit> surveyAudits;
  final int groundModifier;

  CivicIssue({
    required this.id,
    required this.code,
    required this.title,
    required this.description,
    required this.categoryId,
    double? severityScore,
    SeverityLevel? severity,
    required this.latitude,
    required this.longitude,
    required this.address,
    required this.district,
    required this.status,
    required this.reportedAt,
    DateTime? slaDeadline,
    DateTime? rapidSurveyExpiresAt,
    this.upvotes = 1,
    this.hasUpvoted = false,
    this.reportedByName = 'Citizen Contributor',
    this.imageUrl,
    this.imageBytes,
    this.resolutionImageUrl,
    this.resolutionImageBytes,
    this.scheduledHearings = const [],
    this.surveyAudits = const [],
    this.groundModifier = 0,
  })  : severityScore = severityScore ??
            SeverityScoringEngine.calculate(
              categoryBaseWeight: _getCategoryWeight(categoryId),
              urgencyWeight: 60.0,
              affectedScaleWeight: 50.0,
              communityWeight: min(100.0, upvotes * 3.0),
              timeElapsedWeight: 20.0,
              groundModifier: groundModifier,
            ),
        severity = severity ??
            SeverityLevel.fromScore(
              severityScore ??
                  SeverityScoringEngine.calculate(
                    categoryBaseWeight: _getCategoryWeight(categoryId),
                    urgencyWeight: 60.0,
                    affectedScaleWeight: 50.0,
                    communityWeight: min(100.0, upvotes * 3.0),
                    timeElapsedWeight: 20.0,
                    groundModifier: groundModifier,
                  ),
            ),
        slaDeadline = slaDeadline ??
            reportedAt.add(
              Duration(
                hours: (severity ??
                        SeverityLevel.fromScore(
                          severityScore ?? 50.0,
                        ))
                    .slaHours,
              ),
            ),
        rapidSurveyExpiresAt =
            rapidSurveyExpiresAt ?? reportedAt.add(const Duration(minutes: 120));

  static double _getCategoryWeight(String catId) {
    final cat = kCivic14Categories.firstWhere(
      (c) => c.id == catId,
      orElse: () => kCivic14Categories.first,
    );
    return cat.baseWeight;
  }

  bool get isSlaBreached => DateTime.now().isAfter(slaDeadline) && !isResolved;

  bool get isResolved =>
      status == 'resolved' ||
      status == 'resolved_by_worker' ||
      status == 'community_verified';

  bool get isRapidSurveyActive =>
      DateTime.now().isBefore(rapidSurveyExpiresAt) && !isResolved;

  Duration get remainingRapidSurveyTime {
    final diff = rapidSurveyExpiresAt.difference(DateTime.now());
    return diff.isNegative ? Duration.zero : diff;
  }

  Duration get remainingSlaTime {
    final diff = slaDeadline.difference(DateTime.now());
    return diff.isNegative ? Duration.zero : diff;
  }

  CivicCategory get category {
    return kCivic14Categories.firstWhere(
      (c) => c.id == categoryId,
      orElse: () => kCivic14Categories.first,
    );
  }

  /// Generate pre-formatted bilingual WhatsApp alert string matching Phase 2 GovTech spec
  String get whatsAppAlertText {
    final slaTarget = severity.slaHours < 24
        ? '${severity.slaHours} Hours'
        : '${(severity.slaHours / 24).round()} Days';

    final diff = slaDeadline.difference(DateTime.now());
    final hoursLeft = diff.isNegative ? '0 Hours (SLA BREACHED)' : '${diff.inHours} Hours';

    return '🚨 CIVIC HAZARD ALERT: ${category.englishName} - ${severity.code} (${severity.label})\n'
        '📍 Location: $address\n'
        '⚠️ Severity Score: ${severityScore.toStringAsFixed(1)}/100 (Statutory SLA: $slaTarget)\n'
        '⏱️ Time Remaining: $hoursLeft before statutory municipal breach!\n\n'
        '👉 Conduct Rapid On-Site Survey (+50 XP) or Upvote to accelerate repair:\n'
        'https://saikat-koner.github.io/CivicFix/#/issue/$code';
  }

  CivicIssue copyWith({
    String? status,
    int? upvotes,
    bool? hasUpvoted,
    double? severityScore,
    SeverityLevel? severity,
    DateTime? slaDeadline,
    int? groundModifier,
    List<CitizenHearing>? scheduledHearings,
    List<RapidSurveyAudit>? surveyAudits,
    String? resolutionImageUrl,
    Uint8List? resolutionImageBytes,
  }) {
    final newScore = severityScore ?? this.severityScore;
    final newSev = severity ?? (severityScore != null ? SeverityLevel.fromScore(newScore) : this.severity);

    return CivicIssue(
      id: id,
      code: code,
      title: title,
      description: description,
      categoryId: categoryId,
      severityScore: newScore,
      severity: newSev,
      latitude: latitude,
      longitude: longitude,
      address: address,
      district: district,
      status: status ?? this.status,
      reportedAt: reportedAt,
      slaDeadline: slaDeadline ?? this.slaDeadline,
      rapidSurveyExpiresAt: rapidSurveyExpiresAt,
      upvotes: upvotes ?? this.upvotes,
      hasUpvoted: hasUpvoted ?? this.hasUpvoted,
      reportedByName: reportedByName,
      imageUrl: imageUrl,
      imageBytes: imageBytes,
      resolutionImageUrl: resolutionImageUrl ?? this.resolutionImageUrl,
      resolutionImageBytes: resolutionImageBytes ?? this.resolutionImageBytes,
      scheduledHearings: scheduledHearings ?? this.scheduledHearings,
      surveyAudits: surveyAudits ?? this.surveyAudits,
      groundModifier: groundModifier ?? this.groundModifier,
    );
  }
}
