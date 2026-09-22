import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../models/issue.dart';
import 'civic_repository.dart';

enum SyncStatus {
  pending,
  syncing,
  synced,
  failed,
}

/// Offline Queued Issue Model for Low/No-Internet Reporting
class OfflineQueuedIssue {
  final String tempId;
  final String title;
  final String description;
  final String categoryId;
  final double urgencyWeight;
  final double affectedScaleWeight;
  final double latitude;
  final double longitude;
  final String address;
  final String district;
  final String citizenName;
  final Uint8List? imageBytes;
  final DateTime createdAt;
  SyncStatus status;
  String? errorMessage;

  OfflineQueuedIssue({
    required this.tempId,
    required this.title,
    required this.description,
    required this.categoryId,
    required this.urgencyWeight,
    required this.affectedScaleWeight,
    required this.latitude,
    required this.longitude,
    required this.address,
    required this.district,
    required this.citizenName,
    this.imageBytes,
    required this.createdAt,
    this.status = SyncStatus.pending,
    this.errorMessage,
  });

  CivicIssue toCivicIssue() {
    final score = SeverityScoringEngine.calculate(
      categoryBaseWeight: _getCategoryBaseWeight(categoryId),
      urgencyWeight: urgencyWeight,
      affectedScaleWeight: affectedScaleWeight,
      communityWeight: 15.0,
      timeElapsedWeight: 10.0,
      groundModifier: 0,
    );
    final sev = SeverityLevel.fromScore(score);

    return CivicIssue(
      id: tempId,
      code: tempId.replaceAll('OFFLINE-', ''),
      title: title,
      description: description,
      categoryId: categoryId,
      severityScore: score,
      severity: sev,
      latitude: latitude,
      longitude: longitude,
      address: address,
      district: district,
      status: 'open',
      reportedAt: createdAt,
      slaDeadline: createdAt.add(Duration(hours: sev.slaHours)),
      rapidSurveyExpiresAt: createdAt.add(const Duration(minutes: 120)),
      reportedByName: citizenName,
      imageBytes: imageBytes,
      upvotes: 1,
      hasUpvoted: true,
      groundModifier: 0,
    );
  }

  static double _getCategoryBaseWeight(String catId) {
    final cat = kCivic14Categories.firstWhere(
      (c) => c.id == catId,
      orElse: () => kCivic14Categories.first,
    );
    return cat.baseWeight;
  }

  Map<String, dynamic> toJson() {
    return {
      'tempId': tempId,
      'title': title,
      'description': description,
      'categoryId': categoryId,
      'urgencyWeight': urgencyWeight,
      'affectedScaleWeight': affectedScaleWeight,
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'district': district,
      'citizenName': citizenName,
      'imageBytesBase64': imageBytes != null ? base64Encode(imageBytes!) : null,
      'createdAt': createdAt.toIso8601String(),
      'status': status.name,
      'errorMessage': errorMessage,
    };
  }

  factory OfflineQueuedIssue.fromJson(Map<String, dynamic> map) {
    return OfflineQueuedIssue(
      tempId: map['tempId'] as String,
      title: map['title'] as String,
      description: map['description'] as String,
      categoryId: map['categoryId'] as String,
      urgencyWeight: (map['urgencyWeight'] as num).toDouble(),
      affectedScaleWeight: (map['affectedScaleWeight'] as num).toDouble(),
      latitude: (map['latitude'] as num).toDouble(),
      longitude: (map['longitude'] as num).toDouble(),
      address: map['address'] as String,
      district: map['district'] as String,
      citizenName: map['citizenName'] as String? ?? 'Citizen Contributor',
      imageBytes: map['imageBytesBase64'] != null
          ? base64Decode(map['imageBytesBase64'] as String)
          : null,
      createdAt: DateTime.parse(map['createdAt'] as String),
      status: SyncStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => SyncStatus.pending,
      ),
      errorMessage: map['errorMessage'] as String?,
    );
  }
}

/// Offline-First Synchronization & Resilient Low-Bandwidth Service
class OfflineSyncService {
  static final List<OfflineQueuedIssue> _queue = [];
  static final ValueNotifier<int> pendingCountNotifier = ValueNotifier<int>(0);
  static final ValueNotifier<bool> isSyncingNotifier = ValueNotifier<bool>(false);
  static final ValueNotifier<bool> isOnlineNotifier = ValueNotifier<bool>(true);

  static Timer? _connectivityCheckerTimer;

  /// Initialize periodic background sync & connectivity watchdog
  static void initialize() {
    _connectivityCheckerTimer?.cancel();
    _connectivityCheckerTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      checkConnectivityAndAutoSync();
    });
  }

  /// Get read-only list of all queued items
  static List<OfflineQueuedIssue> get queue => List.unmodifiable(_queue);

  /// Get pending un-synced count
  static int get pendingCount =>
      _queue.where((item) => item.status == SyncStatus.pending || item.status == SyncStatus.failed).length;

  /// Enqueue an issue drafted without internet
  static void enqueueIssue(OfflineQueuedIssue issue) {
    _queue.removeWhere((item) => item.tempId == issue.tempId);
    _queue.insert(0, issue);
    _updatePendingCount();
  }

  /// Remove an issue from queue
  static void removeIssue(String tempId) {
    _queue.removeWhere((item) => item.tempId == tempId);
    _updatePendingCount();
  }

  /// Check connectivity status
  static Future<bool> checkOnlineStatus() async {
    try {
      final isConnected = await CivicRepository.checkBackendHealth();
      isOnlineNotifier.value = isConnected;
      return isConnected;
    } catch (_) {
      isOnlineNotifier.value = false;
      return false;
    }
  }

  /// Automatically attempt synchronization when online
  static Future<void> checkConnectivityAndAutoSync() async {
    final online = await checkOnlineStatus();
    if (online && pendingCount > 0 && !isSyncingNotifier.value) {
      await syncAllPending();
    }
  }

  /// Sync all pending items with the backend
  static Future<int> syncAllPending({Function(CivicIssue syncedIssue)? onIssueSynced}) async {
    if (isSyncingNotifier.value) return 0;
    isSyncingNotifier.value = true;

    int successfulSyncs = 0;

    try {
      for (final item in _queue) {
        if (item.status == SyncStatus.synced) continue;

        item.status = SyncStatus.syncing;
        _updatePendingCount();

        try {
          // Attempt backend submission
          final success = await CivicRepository.submitIssuePayload(
            title: item.title,
            description: item.description,
            categoryId: item.categoryId,
            latitude: item.latitude,
            longitude: item.longitude,
            address: item.address,
            district: item.district,
            reportedByName: item.citizenName,
            severityScore: SeverityScoringEngine.calculate(
              categoryBaseWeight: OfflineQueuedIssue._getCategoryBaseWeight(item.categoryId),
              urgencyWeight: item.urgencyWeight,
              affectedScaleWeight: item.affectedScaleWeight,
              communityWeight: 15.0,
              timeElapsedWeight: 10.0,
              groundModifier: 0,
            ),
          );

          if (success) {
            item.status = SyncStatus.synced;
            item.errorMessage = null;
            successfulSyncs++;
            final syncedIssue = item.toCivicIssue();
            onIssueSynced?.call(syncedIssue);
          } else {
            item.status = SyncStatus.failed;
            item.errorMessage = 'Backend rejected payload or credentials missing.';
          }
        } catch (e) {
          item.status = SyncStatus.failed;
          item.errorMessage = e.toString();
        }
      }
    } finally {
      isSyncingNotifier.value = false;
      _updatePendingCount();
    }

    return successfulSyncs;
  }

  /// Generate SMS Template for zero-internet / 2G fallback reporting (160 characters)
  static String generateSmsReport(OfflineQueuedIssue issue) {
    final catCode = issue.categoryId.toUpperCase().substring(0, issue.categoryId.length > 6 ? 6 : issue.categoryId.length);
    final latStr = issue.latitude.toStringAsFixed(4);
    final lngStr = issue.longitude.toStringAsFixed(4);
    final shortTitle = issue.title.length > 40 ? issue.title.substring(0, 40) : issue.title;

    return 'CIVICFIX $catCode $latStr,$lngStr $shortTitle [ID:${issue.tempId.substring(issue.tempId.length - 4)}]';
  }

  /// Generate USSD String for feature-phone / offline municipal gateway (*144#)
  static String generateUssdDialerCode(OfflineQueuedIssue issue) {
    final latInt = (issue.latitude * 1000).round();
    final lngInt = (issue.longitude * 1000).round();
    return '*144*2*${issue.categoryId}*$latInt*$lngInt#';
  }

  static void _updatePendingCount() {
    pendingCountNotifier.value = pendingCount;
  }
}
