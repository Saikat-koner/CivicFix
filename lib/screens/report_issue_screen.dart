import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/issue.dart';
import '../services/image_compression_service.dart';
import '../services/offline_sync_service.dart';
import 'osm_picker_screen.dart';

class ReportIssueScreen extends StatefulWidget {
  final List<CivicIssue> existingIssues;
  final ValueChanged<CivicIssue> onIssueSubmitted;

  const ReportIssueScreen({
    super.key,
    required this.existingIssues,
    required this.onIssueSubmitted,
  });

  @override
  State<ReportIssueScreen> createState() => _ReportIssueScreenState();
}

class _ReportIssueScreenState extends State<ReportIssueScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _citizenNameController = TextEditingController(text: 'Citizen Contributor');

  String _selectedCategoryId = 'roads';
  double _urgencyWeight = 60.0; // 0-100 (Default Moderate/High)
  double _affectedScaleWeight = 50.0; // Street level

  double _latitude = 12.9716;
  double _longitude = 77.5946;
  String _address = 'Indiranagar 100 Feet Road, Bengaluru';
  String _district = 'Ward 112 Indiranagar';
  Uint8List? _selectedImageBytes;
  bool _isCompressingImage = false;
  double _compressionProgress = 0.0;
  String? _compressionStatusText;

  bool _isSubmitting = false;

  Future<void> _pickAndCompressImage() async {
    setState(() {
      _isCompressingImage = true;
      _compressionProgress = 0.1;
      _compressionStatusText = 'Inspecting photographic evidence byte buffer...';
    });

    final rawBuffer = ImageCompressionService.createSampleHazardImage();
    final result = await ImageCompressionService.compressBytes(
      rawBuffer,
      onProgress: (progress, status) {
        if (mounted) {
          setState(() {
            _compressionProgress = progress;
            _compressionStatusText = status;
          });
        }
      },
    );

    if (mounted) {
      setState(() {
        _selectedImageBytes = result.bytes;
        _isCompressingImage = false;
        _compressionStatusText = result.progressSummary;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('✅ ${result.progressSummary}'),
          backgroundColor: const Color(0xFF006699),
        ),
      );
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _citizenNameController.dispose();
    super.dispose();
  }

  /// Proactive Duplicate Detection: Check if an open issue exists within 50 meters in the same category
  CivicIssue? _detectNearbyDuplicate() {
    for (final issue in widget.existingIssues) {
      if (issue.isResolved) continue;
      if (issue.categoryId != _selectedCategoryId) continue;

      final distMeters = _calculateDistanceMeters(
        _latitude,
        _longitude,
        issue.latitude,
        issue.longitude,
      );

      if (distMeters <= 50.0) {
        return issue;
      }
    }
    return null;
  }

  /// Haversine distance in meters
  double _calculateDistanceMeters(double lat1, double lon1, double lat2, double lon2) {
    const r = 6371000.0; // Earth radius in meters
    final dLat = (lat2 - lat1) * (pi / 180.0);
    final dLon = (lon2 - lon1) * (pi / 180.0);
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1 * (pi / 180.0)) * cos(lat2 * (pi / 180.0)) * sin(dLon / 2) * sin(dLon / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return r * c;
  }

  double get _calculatedSeverityScore {
    final cat = kCivic14Categories.firstWhere(
      (c) => c.id == _selectedCategoryId,
      orElse: () => kCivic14Categories.first,
    );

    return SeverityScoringEngine.calculate(
      categoryBaseWeight: cat.baseWeight,
      urgencyWeight: _urgencyWeight,
      affectedScaleWeight: _affectedScaleWeight,
      communityWeight: 15.0, // Initial report
      timeElapsedWeight: 10.0,
      groundModifier: 0,
    );
  }

  SeverityLevel get _predictedSeverity => SeverityLevel.fromScore(_calculatedSeverityScore);

  Future<void> _submitReport() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
    });

    final now = DateTime.now();
    final randomSuffix = (1000 + Random().nextInt(9000)).toString();
    final code = 'CFX-2026-$randomSuffix';

    final calculatedScore = _calculatedSeverityScore;
    final severity = SeverityLevel.fromScore(calculatedScore);

    final newIssue = CivicIssue(
      id: 'ISSUE-$code',
      code: code,
      title: _titleController.text.trim(),
      description: _descriptionController.text.trim(),
      categoryId: _selectedCategoryId,
      severityScore: calculatedScore,
      severity: severity,
      latitude: _latitude,
      longitude: _longitude,
      address: _address,
      district: _district,
      status: 'open',
      reportedAt: now,
      slaDeadline: now.add(Duration(hours: severity.slaHours)),
      rapidSurveyExpiresAt: now.add(const Duration(minutes: 120)), // 2-Hour Rapid On-Site Window
      reportedByName: _citizenNameController.text.trim(),
      imageBytes: _selectedImageBytes,
      upvotes: 1,
      hasUpvoted: true,
      groundModifier: 0,
    );

    // Create offline queue representation
    final offlineIssue = OfflineQueuedIssue(
      tempId: 'OFFLINE-$code',
      title: _titleController.text.trim(),
      description: _descriptionController.text.trim(),
      categoryId: _selectedCategoryId,
      urgencyWeight: _urgencyWeight,
      affectedScaleWeight: _affectedScaleWeight,
      latitude: _latitude,
      longitude: _longitude,
      address: _address,
      district: _district,
      citizenName: _citizenNameController.text.trim(),
      imageBytes: _selectedImageBytes,
      createdAt: now,
      status: SyncStatus.pending,
    );

    // Save locally to queue
    OfflineSyncService.enqueueIssue(offlineIssue);

    // Notify parent state for immediate UI feed update
    widget.onIssueSubmitted(newIssue);

    // Attempt backend synchronization
    final isOnline = await OfflineSyncService.checkOnlineStatus();
    if (isOnline) {
      OfflineSyncService.syncAllPending();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle_rounded, color: Colors.white),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Report #$code lodged and synced! Statutory SLA active.',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            backgroundColor: const Color(0xFF059669),
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.pop(context);
      }
    } else {
      if (mounted) {
        _showOfflineLodgedDialog(offlineIssue, code);
      }
    }
  }

  void _showOfflineLodgedDialog(OfflineQueuedIssue offlineIssue, String code) {
    final smsBody = OfflineSyncService.generateSmsReport(offlineIssue);
    final ussdCode = OfflineSyncService.generateUssdDialerCode(offlineIssue);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFD97706).withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.cloud_off_rounded, color: Color(0xFFD97706), size: 22),
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: Text(
                'Saved Offline in Queue',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Your grievance #$code has been securely queued on your device.',
              style: const TextStyle(fontSize: 13, color: Color(0xFF334155)),
            ),
            const SizedBox(height: 6),
            const Text(
              'It will automatically sync to the Municipal Server the moment your internet connection is restored.',
              style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Zero-Internet Immediate Fallback Options:',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.sms_outlined, size: 16, color: Color(0xFF006699)),
                      const SizedBox(width: 6),
                      const Expanded(
                        child: Text(
                          'Toll-Free SMS Relay (160 Chars):',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                        ),
                      ),
                      InkWell(
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: smsBody));
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            const SnackBar(
                              content: Text('SMS Template copied to clipboard!'),
                              duration: Duration(seconds: 2),
                            ),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF006699).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'Copy SMS',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF006699)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    smsBody,
                    style: const TextStyle(fontSize: 10, fontFamily: 'monospace', color: Color(0xFF475569)),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const Divider(height: 16),
                  Row(
                    children: [
                      const Icon(Icons.dialpad_rounded, size: 16, color: Color(0xFF059669)),
                      const SizedBox(width: 6),
                      const Expanded(
                        child: Text(
                          'Feature Phone USSD String:',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                        ),
                      ),
                      InkWell(
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: ussdCode));
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            const SnackBar(
                              content: Text('USSD code copied! Dial *144# on phone.'),
                              duration: Duration(seconds: 2),
                            ),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF059669).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'Copy USSD',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    ussdCode,
                    style: const TextStyle(fontSize: 10, fontFamily: 'monospace', color: Color(0xFF059669), fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF006699),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
            child: const Text('Got It, Return to Feed'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final duplicate = _detectNearbyDuplicate();
    final score = _calculatedSeverityScore;
    final sev = _predictedSeverity;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Lodge Municipal Grievance',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w800,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Proactive Duplicate Detection Warning Banner
            if (duplicate != null)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: isDark ? 0.15 : 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.amber.shade700, width: 1.5),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.warning_amber_rounded, color: Colors.amber.shade800, size: 22),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            '⚠️ Similar issue already reported nearby. You can upvote the existing ticket or proceed to submit a new one.',
                            style: TextStyle(
                              color: isDark ? Colors.amber.shade200 : Colors.amber.shade900,
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : Colors.white,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  duplicate.title,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text(
                                  '${duplicate.code} • ${duplicate.address}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          TextButton.icon(
                            icon: const Icon(Icons.thumb_up_alt_rounded, size: 16),
                            label: const Text('Upvote It'),
                            style: TextButton.styleFrom(
                              foregroundColor: const Color(0xFF006699),
                            ),
                            onPressed: () {
                              Navigator.pop(context);
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

            // Live Severity & SLA Preview Card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark
                      ? [const Color(0xFF1E293B), const Color(0xFF0F172A)]
                      : [const Color(0xFFEFF6FF), const Color(0xFFE0F2FE)],
                ),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: sev.color.withValues(alpha: 0.4),
                  width: 1.5,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.calculate_rounded, color: sev.color, size: 20),
                          const SizedBox(width: 6),
                          Text(
                            '5-Variable Severity Score',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                              color: isDark ? Colors.grey.shade300 : const Color(0xFF1E293B),
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: sev.color,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '${sev.code} • ${sev.label}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Score: ${score.toStringAsFixed(1)} / 100',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: sev.color,
                              ),
                            ),
                            Text(
                              'Statutory SLA: ${sev.slaHours < 24 ? "${sev.slaHours} Hours" : "${(sev.slaHours / 24).round()} Days"}',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.grey.shade400 : Colors.grey.shade700,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF006699).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.timer_outlined, size: 16, color: Color(0xFF006699)),
                            SizedBox(width: 4),
                            Text(
                              '2-Hr Rapid Survey',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF006699),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 14 Hazard Categories Picker
            Text(
              'Select Civic Hazard Category',
              style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: kCivic14Categories.map((cat) {
                final isSelected = cat.id == _selectedCategoryId;
                return ChoiceChip(
                  avatar: Icon(cat.icon, size: 16, color: isSelected ? Colors.white : cat.themeColor),
                  label: Text(
                    cat.englishName,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                      color: isSelected ? Colors.white : null,
                    ),
                  ),
                  selected: isSelected,
                  selectedColor: const Color(0xFF006699),
                  onSelected: (selected) {
                    if (selected) {
                      setState(() {
                        _selectedCategoryId = cat.id;
                      });
                    }
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Title Field
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Incident Title *',
                hintText: 'e.g. Broken Traffic Signal at Junction',
                prefixIcon: Icon(Icons.title_rounded),
                border: OutlineInputBorder(),
              ),
              validator: (v) => v == null || v.trim().isEmpty ? 'Title is required' : null,
            ),
            const SizedBox(height: 14),

            // Description Field
            TextFormField(
              controller: _descriptionController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Hazard Details & Observations *',
                hintText: 'Describe public risk, obstruction, or danger...',
                prefixIcon: Icon(Icons.description_outlined),
                border: OutlineInputBorder(),
              ),
              validator: (v) => v == null || v.trim().isEmpty ? 'Description is required' : null,
            ),
            const SizedBox(height: 16),

            // Urgency & Affected Scale Sliders
            Text(
              'Immediate Public Danger / Urgency',
              style: theme.textTheme.labelMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            Slider(
              value: _urgencyWeight,
              min: 0,
              max: 100,
              divisions: 4,
              label: _urgencyWeight <= 25
                  ? 'Low (25)'
                  : _urgencyWeight <= 50
                      ? 'Moderate (50)'
                      : _urgencyWeight <= 75
                          ? 'High (75)'
                          : 'Critical Emergency (100)',
              activeColor: sev.color,
              onChanged: (val) {
                setState(() {
                  _urgencyWeight = val;
                });
              },
            ),

            Text(
              'Scale of Affected Commuters / Residents',
              style: theme.textTheme.labelMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            Slider(
              value: _affectedScaleWeight,
              min: 0,
              max: 100,
              divisions: 4,
              label: _affectedScaleWeight <= 25
                  ? 'Individual property'
                  : _affectedScaleWeight <= 50
                      ? 'Local street'
                      : _affectedScaleWeight <= 75
                          ? 'Neighborhood'
                          : 'Major arterial corridor',
              activeColor: const Color(0xFF006699),
              onChanged: (val) {
                setState(() {
                  _affectedScaleWeight = val;
                });
              },
            ),
            const SizedBox(height: 16),

            // Location Picker with OSM integration
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                border: Border.all(
                  color: isDark ? Colors.grey.shade700 : Colors.grey.shade300,
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.location_on_rounded, color: Color(0xFF006699)),
                          SizedBox(width: 6),
                          Text('Incident Coordinates', style: TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      TextButton.icon(
                        icon: const Icon(Icons.map_rounded, size: 16),
                        label: const Text('Pick on Map'),
                        style: TextButton.styleFrom(foregroundColor: const Color(0xFF006699)),
                        onPressed: () async {
                          final loc = await Navigator.push<PickedLocation>(
                            context,
                            MaterialPageRoute(
                              builder: (_) => OsmPickerScreen(
                                initialLat: _latitude,
                                initialLng: _longitude,
                              ),
                            ),
                          );
                          if (loc != null) {
                            setState(() {
                              _latitude = loc.latitude;
                              _longitude = loc.longitude;
                              _address = loc.address;
                            });
                          }
                        },
                      ),
                    ],
                  ),
                  Text(
                    _address,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.grey.shade400 : Colors.grey.shade700,
                    ),
                  ),
                  Text(
                    'GPS: Lat ${_latitude.toStringAsFixed(5)}, Lng ${_longitude.toStringAsFixed(5)}',
                    style: const TextStyle(fontFamily: 'monospace', fontSize: 11),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Client-Side Compressed Photo Evidence Card
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                border: Border.all(
                  color: isDark ? Colors.grey.shade700 : Colors.grey.shade300,
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.camera_alt_rounded, color: Color(0xFF006699)),
                          SizedBox(width: 6),
                          Text(
                            'Photo Evidence (फोटोग्राफिक साक्ष्य)',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ],
                      ),
                      TextButton.icon(
                        icon: const Icon(Icons.add_photo_alternate_rounded, size: 16),
                        label: Text(_selectedImageBytes == null ? 'Attach Photo' : 'Replace Photo'),
                        style: TextButton.styleFrom(foregroundColor: const Color(0xFF006699)),
                        onPressed: _isCompressingImage ? null : _pickAndCompressImage,
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'In-memory web compression automatically resizes photos > 500 KB to max 1280px at 80% JPEG quality.',
                    style: TextStyle(fontSize: 11, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                  ),
                  if (_isCompressingImage) ...[
                    const SizedBox(height: 12),
                    LinearProgressIndicator(
                      value: _compressionProgress,
                      backgroundColor: Colors.grey.shade200,
                      color: const Color(0xFF006699),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _compressionStatusText ?? 'Compressing photo buffer...',
                      style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Color(0xFF006699)),
                    ),
                  ] else if (_selectedImageBytes != null) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF006699).withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(6),
                              color: const Color(0xFF006699).withValues(alpha: 0.2),
                            ),
                            child: const Icon(Icons.image_rounded, color: Color(0xFF006699)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Photo Optimized & Ready',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                                ),
                                Text(
                                  _compressionStatusText ??
                                      '${(_selectedImageBytes!.lengthInBytes / 1024).toStringAsFixed(0)} KB Web-Safe Buffer',
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF006699)),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline_rounded, color: Colors.red, size: 20),
                            tooltip: 'Remove photo',
                            onPressed: () {
                              setState(() {
                                _selectedImageBytes = null;
                                _compressionStatusText = null;
                              });
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Submit Button
            FilledButton.icon(
              icon: _isSubmitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.send_rounded),
              label: Text(_isSubmitting ? 'Lodging Grievance...' : 'Submit Official Civic Ticket'),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF006699),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: _isSubmitting ? null : _submitReport,
            ),
          ],
        ),
      ),
    );
  }
}
