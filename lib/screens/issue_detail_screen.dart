import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:share_plus/share_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../services/severity_engine.dart';

class IssueDetailScreen extends StatefulWidget {
  final Map<String, dynamic> issue;

  const IssueDetailScreen({super.key, required this.issue});

  @override
  State<IssueDetailScreen> createState() => _IssueDetailScreenState();
}

class _IssueDetailScreenState extends State<IssueDetailScreen> {
  late Map<String, dynamic> _issue;
  bool _hasUpvoted = false;
  int _upvoteCount = 0;
  bool _isUpvoting = false;
  final TextEditingController _commentController = TextEditingController();
  bool _isPostingComment = false;

  // Cache of user_id -> display name for comment authors
  final Map<String, String> _userNameCache = {};

  @override
  void initState() {
    super.initState();
    _issue = Map<String, dynamic>.from(widget.issue);
    _upvoteCount = _issue['upvotes_count'] ?? _issue['upvotes'] ?? 0;
    _checkUserUpvoteStatus();
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _checkUserUpvoteStatus() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    try {
      final res = await Supabase.instance.client
          .from('issue_upvotes')
          .select()
          .eq('issue_id', _issue['id'])
          .eq('user_id', userId)
          .maybeSingle();

      if (mounted && res != null) {
        setState(() => _hasUpvoted = true);
      }
    } catch (_) {
      // Fallback if table doesn't exist yet
    }
  }

  Future<void> _toggleUpvote() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null || _isUpvoting) return;

    setState(() {
      _isUpvoting = true;
      _hasUpvoted = !_hasUpvoted;
      _upvoteCount += _hasUpvoted ? 1 : -1;
    });

    try {
      if (_hasUpvoted) {
        await Supabase.instance.client.from('issue_upvotes').upsert({
          'issue_id': _issue['id'],
          'user_id': userId,
        });
      } else {
        await Supabase.instance.client
            .from('issue_upvotes')
            .delete()
            .eq('issue_id', _issue['id'])
            .eq('user_id', userId);
      }

      await Supabase.instance.client
          .from('issues')
          .update({'upvotes_count': _upvoteCount})
          .eq('id', _issue['id']);
    } catch (e) {
      debugPrint('Upvote error: $e');
    } finally {
      if (mounted) setState(() => _isUpvoting = false);
    }
  }

  Future<void> _postComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    setState(() => _isPostingComment = true);
    try {
      await Supabase.instance.client.from('issue_comments').insert({
        'issue_id': _issue['id'],
        'user_id': userId,
        'text': text,
        'created_at': DateTime.now().toIso8601String(),
      });
      _commentController.clear();
      if (mounted) {
        FocusScope.of(context).unfocus();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Comment posted! (टिप्पणी जोड़ी गई)')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not post comment: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isPostingComment = false);
    }
  }

  /// Fetch a commenter's display name from profiles, with local cache
  Future<String> _getCommenterName(String userId) async {
    if (_userNameCache.containsKey(userId)) return _userNameCache[userId]!;
    try {
      final profile = await Supabase.instance.client
          .from('profiles')
          .select('full_name')
          .eq('id', userId)
          .maybeSingle();
      final name = (profile != null && profile['full_name'] != null && profile['full_name'].toString().isNotEmpty)
          ? profile['full_name'].toString()
          : 'Citizen';
      _userNameCache[userId] = name;
      return name;
    } catch (_) {
      return 'Citizen';
    }
  }

  Future<void> _verifyIssueResolution() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.camera, imageQuality: 70);
    if (picked == null) return;

    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;
    if (!mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const Center(child: CircularProgressIndicator()),
    );

    try {
      // Web-safe: read bytes and use uploadBinary instead of dart:io File
      final Uint8List bytes = await picked.readAsBytes();
      final fileName = 'verification_${DateTime.now().millisecondsSinceEpoch}_$userId.jpg';
      await Supabase.instance.client.storage.from('issue_images').uploadBinary(fileName, bytes);
      final imageUrl = Supabase.instance.client.storage.from('issue_images').getPublicUrl(fileName);

      await Supabase.instance.client.from('issue_verifications').insert({
        'issue_id': _issue['id'],
        'user_id': userId,
        'verification_type': 'after',
        'image_url': imageUrl,
        'notes': 'Citizen verified resolution on-site',
      });

      await Supabase.instance.client
          .from('issues')
          .update({'status': 'community_verified', 'updated_at': DateTime.now().toIso8601String()})
          .eq('id', _issue['id']);

      if (mounted) {
        Navigator.pop(context); // Close loading
        setState(() {
          _issue['status'] = 'community_verified';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Colors.green,
            content: Text('Resolution verified by community! (+25 XP awarded)'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Verification error: $e')),
        );
      }
    }
  }

  Duration _calculateTimeElapsed() {
    final reportedAt = DateTime.tryParse(_issue['created_at']?.toString() ?? '') ?? DateTime.now();
    return DateTime.now().difference(reportedAt);
  }

  bool _isSlaBreached() {
    final elapsed = _calculateTimeElapsed();
    final score = SeverityEngine.getScoreForIssue(_issue);
    final tier = SeverityEngine.getSeverityTier(score);
    final slaHours = _issue['sla_target_hours'] ?? SeverityEngine.getSlaTargetHours(tier);
    return elapsed.inHours > slaHours &&
        _issue['status'] != 'community_verified' &&
        _issue['status'] != 'resolved_by_worker';
  }

  Map<String, dynamic> _getSeverityInfo() {
    final score = SeverityEngine.getScoreForIssue(_issue);
    final tier = SeverityEngine.getSeverityTier(score);
    final color = SeverityEngine.getTierColor(tier);
    final label = SeverityEngine.getTierLabel(tier);
    final sla = SeverityEngine.getSlaLabel(tier);
    final slaHours = SeverityEngine.getSlaTargetHours(tier);

    return {
      'score': score,
      'tier': tier,
      'color': color,
      'label': label,
      'sla': sla,
      'slaHours': slaHours,
    };
  }

  void _openGroundSurveyModal(BuildContext context) {
    String hazardLevel = 'moderate'; // 'minimal', 'moderate', 'high', 'lethal'
    String trafficBlockage = 'none'; // 'none', 'partial', 'full_closure'
    bool nearVulnerableZone = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalContext, setModalState) {
            final theme = Theme.of(context);
            final isDark = theme.brightness == Brightness.dark;

            final modifier = SeverityEngine.calculateGroundSurveyModifier(
              groundHazardLevel: hazardLevel,
              trafficBlockage: trafficBlockage,
              isNearVulnerableZone: nearVulnerableZone,
            );

            final category = _issue['category']?.toString() ?? 'pothole';
            final urgency = (_issue['urgency_level'] as num?)?.toInt() ?? 3;
            final affected = (_issue['affected_people'] as num?)?.toInt() ?? 10;
            final createdAt = DateTime.tryParse(_issue['created_at']?.toString() ?? '');

            final updatedScore = SeverityEngine.calculateSeverityScore(
              category: category,
              urgencyLevel: urgency,
              affectedPeople: affected,
              upvotes: _upvoteCount,
              createdAt: createdAt,
              hasGroundSurvey: true,
              groundHazardModifier: modifier,
            );

            final currentScore = SeverityEngine.getScoreForIssue(_issue);
            final updatedTier = SeverityEngine.getSeverityTier(updatedScore);
            final updatedTierColor = SeverityEngine.getTierColor(updatedTier);
            final updatedSla = SeverityEngine.getSlaLabel(updatedTier);

            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(modalContext).viewInsets.bottom,
                top: 20,
                left: 16,
                right: 16,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.amber.shade100,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(Icons.bolt, color: Colors.amber.shade900, size: 24),
                        ),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '2-Hour Rapid On-Site Survey',
                                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                              Text(
                                'Ground Truth Hazard Audit (+50 XP)',
                                style: TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // 1. Hazard Severity Factor
                    const Text('1. On-Site Hazard Severity (खतरे की गंभीरता)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 6),
                    SegmentedButton<String>(
                      segments: const [
                        ButtonSegment(value: 'minimal', label: Text('Minimal\n-10 pts', textAlign: TextAlign.center, style: TextStyle(fontSize: 10))),
                        ButtonSegment(value: 'moderate', label: Text('Moderate\n0 pts', textAlign: TextAlign.center, style: TextStyle(fontSize: 10))),
                        ButtonSegment(value: 'high', label: Text('High\n+10 pts', textAlign: TextAlign.center, style: TextStyle(fontSize: 10))),
                        ButtonSegment(value: 'lethal', label: Text('Lethal\n+20 pts', textAlign: TextAlign.center, style: TextStyle(fontSize: 10))),
                      ],
                      selected: {hazardLevel},
                      onSelectionChanged: (set) {
                        setModalState(() => hazardLevel = set.first);
                      },
                    ),
                    const SizedBox(height: 14),

                    // 2. Traffic Blockage
                    const Text('2. Traffic / Transit Blockage (यातायात रुकावट)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 6),
                    SegmentedButton<String>(
                      segments: const [
                        ButtonSegment(value: 'none', label: Text('No Blockage\n0 pts', textAlign: TextAlign.center, style: TextStyle(fontSize: 11))),
                        ButtonSegment(value: 'partial', label: Text('Partial\n+5 pts', textAlign: TextAlign.center, style: TextStyle(fontSize: 11))),
                        ButtonSegment(value: 'full_closure', label: Text('Full Road Close\n+15 pts', textAlign: TextAlign.center, style: TextStyle(fontSize: 11))),
                      ],
                      selected: {trafficBlockage},
                      onSelectionChanged: (set) {
                        setModalState(() => trafficBlockage = set.first);
                      },
                    ),
                    const SizedBox(height: 14),

                    // 3. Vulnerable Zone Proximity Checkbox
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Near School / Hospital / Metro Transit (+10 pts)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      subtitle: const Text('Within 200 meters of high-density pedestrian zone', style: TextStyle(fontSize: 11)),
                      value: nearVulnerableZone,
                      activeThumbColor: Colors.amber.shade800,
                      onChanged: (val) {
                        setModalState(() => nearVulnerableZone = val);
                      },
                    ),
                    const SizedBox(height: 10),

                    // Live Calculated Modifier & Score Preview
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark ? theme.colorScheme.surfaceContainerHighest : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: updatedTierColor.withValues(alpha: 0.5)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Ground Modifier: ${modifier >= 0 ? '+$modifier' : '$modifier'} pts', style: TextStyle(fontWeight: FontWeight.bold, color: updatedTierColor)),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(color: updatedTierColor, borderRadius: BorderRadius.circular(12)),
                                child: Text('$updatedTier ($updatedScore / 100)', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text('Score Update: ${currentScore.toStringAsFixed(1)} ➔ ${updatedScore.toStringAsFixed(1)} | SLA Target: $updatedSla', style: const TextStyle(fontSize: 12)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Submit Survey Button
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: theme.colorScheme.primary,
                        foregroundColor: theme.colorScheme.onPrimary,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: const Icon(Icons.check_circle_rounded),
                      label: const Text('SUBMIT GROUND AUDIT (+50 XP) / दर्ज करें', style: TextStyle(fontWeight: FontWeight.bold)),
                      onPressed: () async {
                        final userId = Supabase.instance.client.auth.currentUser?.id;
                        if (userId == null) return;

                        try {
                          // Update issue table with verified ground truth
                          await Supabase.instance.client.from('issues').update({
                            'severity_score': updatedScore,
                            'severity_tier': updatedTier,
                            'severity_level': updatedTier,
                            'sla_target_hours': SeverityEngine.getSlaTargetHours(updatedTier),
                            'has_ground_survey': true,
                            'ground_hazard_modifier': modifier,
                            'ground_hazard_level': hazardLevel,
                            'traffic_blockage': trafficBlockage,
                            'is_near_vulnerable_zone': nearVulnerableZone,
                            'surveyed_by': userId,
                            'surveyed_at': DateTime.now().toIso8601String(),
                          }).eq('id', _issue['id']);

                          // Award +50 XP to the surveyor
                          try {
                            await Supabase.instance.client.rpc('increment_reputation', params: {
                              'user_id': userId,
                              'points_to_add': 50,
                            });
                          } catch (_) {
                            // Direct update fallback
                            final profile = await Supabase.instance.client
                                .from('profiles')
                                .select('reputation_points')
                                .eq('id', userId)
                                .maybeSingle();
                            final curPoints = (profile?['reputation_points'] as num?)?.toInt() ?? 10;
                            await Supabase.instance.client
                                .from('profiles')
                                .update({'reputation_points': curPoints + 50})
                                .eq('id', userId);
                          }

                          if (modalContext.mounted) {
                            Navigator.pop(modalContext);
                          }

                          if (mounted) {
                            setState(() {
                              _issue['severity_score'] = updatedScore;
                              _issue['severity_tier'] = updatedTier;
                              _issue['severity_level'] = updatedTier;
                              _issue['sla_target_hours'] = SeverityEngine.getSlaTargetHours(updatedTier);
                              _issue['has_ground_survey'] = true;
                              _issue['ground_hazard_modifier'] = modifier;
                            });

                            ScaffoldMessenger.of(this.context).showSnackBar(
                              const SnackBar(
                                backgroundColor: Colors.green,
                                content: Text('⚡ Ground survey submitted! Priority updated & +50 XP awarded!'),
                              ),
                            );
                          }
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(this.context).showSnackBar(
                              SnackBar(backgroundColor: Colors.red, content: Text('Survey submission failed: $e')),
                            );
                          }
                        }
                      },
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _shareIssue() {
    final title = _issue['title'] ?? 'Civic Issue';
    final category = _issue['category']?.toString().replaceAll('_', ' ') ?? '';
    final status = _issue['status']?.toString().replaceAll('_', ' ') ?? '';
    final address = _issue['address'] ?? '';

    final message = '🚨 CivicFix Report: $title\n'
        '📌 Category: $category\n'
        '📍 Location: $address\n'
        '📊 Status: $status\n'
        '👍 Upvotes: $_upvoteCount\n\n'
        'Help your community! Report civic issues on CivicFix.';

    SharePlus.instance.share(ShareParams(text: message));
  }

  void _bookEscalationAppointment(BuildContext context) {
    final nextSlot = DateTime.now().add(const Duration(days: 1));
    final formattedSlot = '${nextSlot.day}/${nextSlot.month}/${nextSlot.year} at 10:30 AM';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom,
          top: 24,
          left: 16,
          right: 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(Icons.gavel, color: Theme.of(context).colorScheme.error, size: 28),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Book Hearing with Ward Officer',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              'This issue has breached its SLA resolution window without closure. Under civic accountability rules, citizens have the right to an in-person hearing with the zonal officer.',
              style: TextStyle(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.calendar_month, color: Colors.blue),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Assigned Hearing Slot', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      Text(formattedSlot, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.error,
                foregroundColor: Theme.of(context).colorScheme.onError,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.check_circle_outline),
              label: const Text('Confirm Escalation Hearing / पुष्टि करें', style: TextStyle(fontWeight: FontWeight.bold)),
              onPressed: () async {
                final userId = Supabase.instance.client.auth.currentUser!.id;
                await Supabase.instance.client.from('officer_appointments').insert({
                  'issue_id': _issue['id'],
                  'citizen_id': userId,
                  'slot_time': nextSlot.toIso8601String(),
                  'escalation_reason': 'SLA breached with status: ${_issue['status']}',
                });
                if (ctx.mounted) {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Appointment booked. Officer notified.')),
                  );
                }
              },
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildRapidSurveyCard(ThemeData theme, bool isDark) {
    final createdAt = DateTime.tryParse(_issue['created_at']?.toString() ?? '');
    final inWindow = SeverityEngine.isWithinTwoHourSurveyWindow(createdAt);
    final remainingMins = SeverityEngine.remainingSurveyMinutes(createdAt);
    final remainingTimeStr = SeverityEngine.formatRemainingSurveyTime(createdAt);
    final hasSurvey = _issue['has_ground_survey'] == true || _issue['ground_survey'] != null;
    final groundModifier = (_issue['ground_hazard_modifier'] as num?)?.toDouble() ?? 0.0;

    if (hasSurvey) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? Colors.teal.shade900.withValues(alpha: 0.3) : Colors.teal.shade50,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.teal.shade400, width: 1.5),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.verified_user, color: Colors.teal, size: 22),
                const SizedBox(width: 8),
                const Text(
                  'Ground Truth Audit Completed',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.teal),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: Colors.teal, borderRadius: BorderRadius.circular(12)),
                  child: Text(
                    '${groundModifier >= 0 ? '+$groundModifier' : '$groundModifier'} pts applied',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'On-site inspection conducted. Hazard parameters integrated into the municipal dispatch queue.',
              style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurface),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.teal,
                side: const BorderSide(color: Colors.teal),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              icon: const Icon(Icons.edit_note, size: 18),
              label: const Text('Update Ground Audit / पुनर्परीक्षण करें', style: TextStyle(fontSize: 12)),
              onPressed: () => _openGroundSurveyModal(context),
            ),
          ],
        ),
      );
    }

    if (inWindow) {
      final progress = (120 - remainingMins) / 120.0;
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? Colors.amber.shade900.withValues(alpha: 0.25) : Colors.amber.shade50,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.amber.shade700, width: 2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade800,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.bolt, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '⚡ 2-Hour Rapid On-Site Survey Active',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      Text(
                        'Fast ground-truth verification window (2 घंटे की त्वरित जांच)',
                        style: TextStyle(fontSize: 11, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade800,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    remainingTimeStr,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: progress.clamp(0.0, 1.0),
                backgroundColor: isDark ? Colors.grey.shade800 : Colors.amber.shade200,
                color: Colors.amber.shade800,
                minHeight: 6,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'Are you near this location? Conduct the 2-hour rapid ground audit to calibrate hazard priority, set statutory SLA, and earn +50 XP reputation reward!',
              style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurface),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.amber.shade800,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.speed, size: 18),
              label: const Text('CONDUCT 2-HOUR RAPID SURVEY (+50 XP)', style: TextStyle(fontWeight: FontWeight.bold)),
              onPressed: () => _openGroundSurveyModal(context),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? theme.colorScheme.surfaceContainerHighest : Colors.grey.shade100,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Row(
        children: [
          Icon(Icons.schedule, color: theme.colorScheme.onSurfaceVariant, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('2-Hour Rapid Survey Concluded', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                Text(
                  'Initial 120-min window closed. You can still audit ground conditions.',
                  style: TextStyle(fontSize: 11, color: theme.colorScheme.onSurfaceVariant),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () => _openGroundSurveyModal(context),
            child: const Text('Audit Now'),
          ),
        ],
      ),
    );
  }

  Widget _buildMathematicalSeverityCard(ThemeData theme, bool isDark) {
    final category = _issue['category']?.toString() ?? 'pothole';
    final urgency = (_issue['urgency_level'] as num?)?.toInt() ?? 3;
    final affected = (_issue['affected_people'] as num?)?.toInt() ?? 10;
    final createdAt = DateTime.tryParse(_issue['created_at']?.toString() ?? '');
    final hasSurvey = _issue['has_ground_survey'] == true || _issue['ground_survey'] != null;
    final groundModifier = (_issue['ground_hazard_modifier'] as num?)?.toDouble() ?? 0.0;

    final score = SeverityEngine.calculateSeverityScore(
      category: category,
      urgencyLevel: urgency,
      affectedPeople: affected,
      upvotes: _upvoteCount,
      createdAt: createdAt,
      hasGroundSurvey: hasSurvey,
      groundHazardModifier: groundModifier,
    );
    final tier = SeverityEngine.getSeverityTier(score);
    final tierColor = SeverityEngine.getTierColor(tier);
    final tierLabel = SeverityEngine.getTierLabel(tier);
    final slaLabel = SeverityEngine.getSlaLabel(tier);

    final wCat = (SeverityEngine.categoryBaseWeights[category] ?? 50.0) * 0.35;
    final wUrgency = ((urgency.clamp(1, 5) / 5.0) * 100.0) * 0.25;
    final wAffected = ((affected.clamp(1, 500) / 500.0) * 100.0) * 0.15;
    final wCommunity = ((_upvoteCount.clamp(0, 100) / 100.0) * 100.0) * 0.15;
    double wTime = 0.0;
    if (createdAt != null) {
      final hoursOpen = DateTime.now().difference(createdAt).inHours;
      wTime = ((hoursOpen.clamp(0, 72) / 72.0) * 100.0) * 0.10;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? theme.colorScheme.surfaceContainerHighest : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: tierColor.withValues(alpha: 0.5), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black26 : Colors.grey.shade200,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.functions, color: tierColor, size: 22),
                  const SizedBox(width: 8),
                  const Text('Severity Mathematical Model', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: tierColor,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '$tier • ${score.toStringAsFixed(1)} / 100',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Dynamic Priority Tier: $tierLabel',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: theme.colorScheme.onSurface),
          ),
          Text(
            'Statutory Resolution SLA: $slaLabel',
            style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: 14),

          // Sub-factor breakdown items
          _buildFactorRow('Hazard Category Weight (35%)', '${wCat.toStringAsFixed(1)} pts', isDark),
          _buildFactorRow('Urgency Level ($urgency/5) (25%)', '${wUrgency.toStringAsFixed(1)} pts', isDark),
          _buildFactorRow('Citizens Affected ($affected) (15%)', '${wAffected.toStringAsFixed(1)} pts', isDark),
          _buildFactorRow('Community Upvotes ($_upvoteCount) (15%)', '${wCommunity.toStringAsFixed(1)} pts', isDark),
          _buildFactorRow('Aging Time Open Factor (10%)', '${wTime.toStringAsFixed(1)} pts', isDark),
          if (hasSurvey)
            _buildFactorRow('Ground Truth Audit Modifier', '${groundModifier >= 0 ? '+$groundModifier' : '$groundModifier'} pts', isDark, isBold: true, highlightColor: Colors.teal),

          const Divider(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Composite Calculated Score:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              Text('${score.toStringAsFixed(1)} / 100.0', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: tierColor)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFactorRow(String label, String value, bool isDark, {bool isBold = false, Color? highlightColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade400 : Colors.grey.shade700, fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
          Text(value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: highlightColor)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final elapsed = _calculateTimeElapsed();
    final days = elapsed.inDays;
    final hours = elapsed.inHours % 24;
    final isBreached = _isSlaBreached();
    final severityInfo = _getSeverityInfo();
    final isResolved = _issue['status'] == 'resolved_by_worker' || _issue['status'] == 'community_verified';

    return Scaffold(
      appBar: AppBar(
        title: Text(_issue['title'] ?? 'Issue Details', style: const TextStyle(fontWeight: FontWeight.bold)),
        elevation: 1,
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            tooltip: 'Share this issue',
            onPressed: _shareIssue,
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Photo View
            if (_issue['image_url'] != null && _issue['image_url'].toString().isNotEmpty)
              Image.network(
                _issue['image_url'],
                height: 240,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => Container(
                  height: 200,
                  color: theme.colorScheme.surfaceContainerHighest,
                  child: const Icon(Icons.broken_image, size: 48),
                ),
              )
            else
              Container(
                height: 160,
                color: theme.colorScheme.surfaceContainerHighest,
                child: const Center(child: Icon(Icons.image_not_supported, size: 48)),
              ),

            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Badges: Category, Status, SLA, Severity
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      Chip(
                        avatar: const Icon(Icons.category, size: 16),
                        label: Text(_issue['category'].toString().toUpperCase()),
                        backgroundColor: isDark ? Colors.blue.shade900.withValues(alpha: 0.3) : Colors.blue.shade50,
                      ),
                      Chip(
                        avatar: Icon(
                          isResolved ? Icons.check_circle : Icons.pending,
                          size: 16,
                          color: isResolved ? Colors.green : Colors.amber.shade900,
                        ),
                        label: Text(_issue['status'].toString().replaceAll('_', ' ').toUpperCase()),
                        backgroundColor: isResolved
                            ? (isDark ? Colors.green.shade900.withValues(alpha: 0.3) : Colors.green.shade50)
                            : (isDark ? Colors.amber.shade900.withValues(alpha: 0.3) : Colors.amber.shade100),
                      ),
                      Chip(
                        avatar: Icon(Icons.priority_high, size: 16, color: severityInfo['color'] as Color),
                        label: Text(severityInfo['label'] as String),
                        backgroundColor: (severityInfo['color'] as Color).withValues(alpha: 0.15),
                      ),
                      Chip(
                        avatar: Icon(Icons.timer, size: 16, color: isBreached ? Colors.red : Colors.green),
                        label: Text('Open: ${days}d ${hours}h (SLA: ${severityInfo['sla']})'),
                        backgroundColor: isDark
                            ? (isBreached ? Colors.red.shade900.withValues(alpha: 0.3) : Colors.green.shade900.withValues(alpha: 0.3))
                            : (isBreached ? Colors.red.shade50 : Colors.green.shade50),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Title & Action Row (Upvote button)
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          _issue['title'] ?? 'Issue',
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 12),
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          backgroundColor: _hasUpvoted ? theme.colorScheme.primary.withValues(alpha: 0.1) : null,
                          side: BorderSide(
                            color: _hasUpvoted ? theme.colorScheme.primary : theme.colorScheme.outlineVariant,
                            width: _hasUpvoted ? 2 : 1,
                          ),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        icon: Icon(
                          _hasUpvoted ? Icons.thumb_up : Icons.thumb_up_outlined,
                          color: _hasUpvoted ? theme.colorScheme.primary : theme.colorScheme.onSurfaceVariant,
                          size: 18,
                        ),
                        label: Text(
                          '$_upvoteCount',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: _hasUpvoted ? theme.colorScheme.primary : theme.colorScheme.onSurface,
                          ),
                        ),
                        onPressed: _toggleUpvote,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Reported timestamp with timeago
                  if (_issue['created_at'] != null)
                    Row(
                      children: [
                        Icon(Icons.schedule, size: 16, color: theme.colorScheme.onSurfaceVariant),
                        const SizedBox(width: 4),
                        Text(
                          'Reported ${timeago.format(DateTime.tryParse(_issue['created_at'].toString())?.toLocal() ?? DateTime.now())}',
                          style: TextStyle(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  const SizedBox(height: 8),

                  // Description
                  Text(
                    _issue['description'] ?? 'No description provided.',
                    style: TextStyle(fontSize: 15, color: theme.colorScheme.onSurfaceVariant),
                  ),
                  const SizedBox(height: 16),

                  // Address info if present
                  if (_issue['address'] != null) ...[
                    Row(
                      children: [
                        const Icon(Icons.location_on, size: 18, color: Colors.red),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            _issue['address'],
                            style: TextStyle(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                  ],

                  // 2-HOUR RAPID ON-SITE SURVEY CARD
                  _buildRapidSurveyCard(theme, isDark),
                  const SizedBox(height: 14),

                  // MATHEMATICAL SEVERITY BREAKDOWN CARD
                  _buildMathematicalSeverityCard(theme, isDark),

                  const Divider(height: 32),

                  // SLA Overdue Escalation Banner
                  if (isBreached) ...[
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.red.shade900.withValues(alpha: 0.3) : Colors.red.shade50,
                        border: Border.all(color: isDark ? Colors.red.shade700 : Colors.red.shade300),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.warning, color: Colors.red),
                              SizedBox(width: 8),
                              Text('Resolution Window Overdue (समय सीमा समाप्त)', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                            ],
                          ),
                          const SizedBox(height: 6),
                          const Text('The assigned municipal team has not resolved this issue within the stipulated SLA threshold.'),
                          const SizedBox(height: 10),
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
                            icon: const Icon(Icons.gavel),
                            onPressed: () => _bookEscalationAppointment(context),
                            label: const Text('Escalate & Book Hearing with Officer'),
                          )
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Community Verification Action
                  if (!isResolved)
                    Card(
                      elevation: 0,
                      color: isDark ? theme.colorScheme.primaryContainer.withValues(alpha: 0.2) : Colors.blue.shade50,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: isDark ? theme.colorScheme.primary.withValues(alpha: 0.3) : Colors.blue.shade200),
                      ),
                      child: ListTile(
                        leading: const Icon(Icons.verified, color: Colors.blue, size: 32),
                        title: const Text('Are you on-site? Verify this issue', style: TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: const Text('Take a photo to confirm fix or progress (+25 XP)'),
                        trailing: ElevatedButton(
                          onPressed: _verifyIssueResolution,
                          child: const Text('Verify'),
                        ),
                      ),
                    ),

                  const SizedBox(height: 24),

                  // Comments Section
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Community Discussion (टिप्पणियाँ)',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      Icon(Icons.chat_bubble_outline, size: 20, color: theme.colorScheme.primary),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Comment Input
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _commentController,
                          decoration: InputDecoration(
                            hintText: 'Add an update or comment...',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        icon: _isPostingComment
                            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.send),
                        onPressed: _isPostingComment ? null : _postComment,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Streamed Comments List
                  StreamBuilder<List<Map<String, dynamic>>>(
                    stream: Supabase.instance.client
                        .from('issue_comments')
                        .stream(primaryKey: ['id'])
                        .eq('issue_id', _issue['id'])
                        .order('created_at', ascending: true),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(child: Padding(padding: EdgeInsets.all(16.0), child: CircularProgressIndicator()));
                      }

                      final comments = snapshot.data ?? [];
                      if (comments.isEmpty) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 16.0),
                          child: Center(
                            child: Text(
                              'No comments yet. Be the first to share an update!',
                              style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
                            ),
                          ),
                        );
                      }

                      return ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: comments.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final comment = comments[index];
                          final commentUserId = comment['user_id']?.toString() ?? '';
                          final commentTime = DateTime.tryParse(comment['created_at']?.toString() ?? '');
                          final timeStr = commentTime != null ? timeago.format(commentTime.toLocal()) : '';

                          return FutureBuilder<String>(
                            future: _getCommenterName(commentUserId),
                            builder: (context, nameSnapshot) {
                              final displayName = nameSnapshot.data ?? 'Citizen';

                              return Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          children: [
                                            const Icon(Icons.account_circle, size: 16, color: Colors.grey),
                                            const SizedBox(width: 4),
                                            Text(displayName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                          ],
                                        ),
                                        Text(timeStr, style: TextStyle(fontSize: 11, color: theme.colorScheme.onSurfaceVariant)),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(comment['text'] ?? '', style: const TextStyle(fontSize: 14)),
                                  ],
                                ),
                              );
                            },
                          );
                        },
                      );
                    },
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
