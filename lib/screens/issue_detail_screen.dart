import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:share_plus/share_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:timeago/timeago.dart' as timeago;

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
    final slaHours = _issue['sla_target_hours'] ?? _issue['sla_hours'] ?? 72;
    return elapsed.inHours > slaHours && _issue['status'] != 'community_verified' && _issue['status'] != 'resolved_by_worker';
  }

  Map<String, dynamic> _getSeverityInfo() {
    final level = _issue['severity_level']?.toString().toUpperCase() ?? 'S3';
    final score = (_issue['severity_score'] is num) ? (_issue['severity_score'] as num).toDouble() : 50.0;

    switch (level) {
      case 'S5':
        return {'label': 'S5 - Critical (गंभीर)', 'color': Colors.red.shade700, 'sla': '4 Hours', 'score': score};
      case 'S4':
        return {'label': 'S4 - High (उच्च)', 'color': Colors.deepOrange.shade600, 'sla': '12 Hours', 'score': score};
      case 'S3':
        return {'label': 'S3 - Moderate (मध्यम)', 'color': Colors.amber.shade800, 'sla': '48 Hours', 'score': score};
      case 'S2':
        return {'label': 'S2 - Low (निम्न)', 'color': Colors.blue.shade600, 'sla': '7 Days', 'score': score};
      default:
        return {'label': 'S1 - Minimal (सामान्य)', 'color': Colors.teal.shade600, 'sla': '14 Days', 'score': score};
    }
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
                  if (_issue['address'] != null)
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
