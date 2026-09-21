import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/issue.dart';
import '../widgets/hearing_dossier_dialog.dart';

class IssueDetailScreen extends StatefulWidget {
  final CivicIssue issue;
  final bool isGuestUser;
  final VoidCallback? onRequestAuth;
  final ValueChanged<CivicIssue>? onIssueUpdated;

  const IssueDetailScreen({
    super.key,
    required this.issue,
    this.isGuestUser = false,
    this.onRequestAuth,
    this.onIssueUpdated,
  });

  @override
  State<IssueDetailScreen> createState() => _IssueDetailScreenState();
}

enum ComparisonViewMode { split, sideBySide, fullScreen }

class _IssueDetailScreenState extends State<IssueDetailScreen>
    with SingleTickerProviderStateMixin {
  late CivicIssue _currentIssue;
  Timer? _tickerTimer;
  Duration _remainingSlaTime = Duration.zero;
  Duration _remainingRapidSurveyTime = Duration.zero;

  // Split Screen Before/After Slider position (0.0 to 1.0)
  double _splitPosition = 0.5;
  ComparisonViewMode _comparisonMode = ComparisonViewMode.split;

  // Pulsating animation for S5 critical badges
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _currentIssue = widget.issue;
    _updateCountdowns();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.92, end: 1.08).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _tickerTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() {
          _updateCountdowns();
        });
      }
    });
  }

  void _updateCountdowns() {
    _remainingSlaTime = _currentIssue.slaDeadline.difference(DateTime.now());
    _remainingRapidSurveyTime =
        _currentIssue.rapidSurveyExpiresAt.difference(DateTime.now());
  }

  @override
  void dispose() {
    _tickerTimer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  void _checkAuthAndExecute(VoidCallback action, String actionName) {
    if (widget.isGuestUser) {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (ctx) {
          final isDark = Theme.of(ctx).brightness == Brightness.dark;
          return Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade400,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Sign in to take civic action',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                ),
                const Text(
                  'नागरिक कार्रवाई के लिए साइन इन करें',
                  style: TextStyle(fontSize: 12, color: Color(0xFF006699), fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                Text(
                  'Authentication required to proceed with "$actionName". Sign in or register your citizen account to verify ground surveys, upvote grievances, and lodge official hearings.',
                  style: TextStyle(fontSize: 13, color: isDark ? Colors.grey.shade300 : const Color(0xFF475569)),
                ),
                const SizedBox(height: 20),
                FilledButton.icon(
                  icon: const Icon(Icons.login_rounded),
                  label: const Text('Sign In with Email / OTP (साइन इन करें)'),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF006699),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: () {
                    Navigator.pop(ctx);
                    widget.onRequestAuth?.call();
                  },
                ),
                const SizedBox(height: 10),
                OutlinedButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Continue Browsing as Guest (अतिथि के रूप में जारी रखें)'),
                ),
              ],
            ),
          );
        },
      );
      return;
    }
    action();
  }

  void _handleUpvote() {
    _checkAuthAndExecute(() {
      setState(() {
        final newUpvotes = _currentIssue.hasUpvoted
            ? _currentIssue.upvotes - 1
            : _currentIssue.upvotes + 1;
        _currentIssue = _currentIssue.copyWith(
          upvotes: newUpvotes,
          hasUpvoted: !_currentIssue.hasUpvoted,
        );
      });
      widget.onIssueUpdated?.call(_currentIssue);
    }, 'Upvoting Grievance');
  }

  /// WhatsApp 1-Click Mobilization Handler
  void _mobilizeViaWhatsApp() {
    final text = _currentIssue.whatsAppAlertText;
    Clipboard.setData(ClipboardData(text: text));

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.check_circle_outline_rounded, color: Colors.white, size: 18),
                SizedBox(width: 8),
                Text(
                  'WhatsApp Ward Mobilization Alert Copied!',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Bilingual alert with live SLA countdown ready to broadcast to RWA groups.',
              style: const TextStyle(fontSize: 11, color: Colors.white70),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF25D366),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  /// Open 2-Hour Rapid On-Site Survey Modal
  void _openRapidSurveyModal() {
    _checkAuthAndExecute(() {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (ctx) => _RapidSurveyBottomSheet(
          issue: _currentIssue,
          onAuditSubmitted: (audit) {
            final newGroundModifier = audit.totalGroundModifier;
            final newScore = SeverityScoringEngine.calculate(
              categoryBaseWeight: _currentIssue.category.baseWeight,
              urgencyWeight: 75.0,
              affectedScaleWeight: 60.0,
              communityWeight: min(100.0, _currentIssue.upvotes * 4.0),
              timeElapsedWeight: 25.0,
              groundModifier: newGroundModifier,
            );
            final newSeverity = SeverityLevel.fromScore(newScore);

            setState(() {
              _currentIssue = _currentIssue.copyWith(
                groundModifier: newGroundModifier,
                severityScore: newScore,
                severity: newSeverity,
                surveyAudits: [..._currentIssue.surveyAudits, audit],
              );
            });
            widget.onIssueUpdated?.call(_currentIssue);

            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  '✅ Ground-Truth Audit Logged! Recalibrated to ${newSeverity.code} (${newScore.toStringAsFixed(1)} pts). Awarded +50 XP!',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                backgroundColor: const Color(0xFF006699),
                behavior: SnackBarBehavior.floating,
              ),
            );
          },
        ),
      );
    }, 'Ground-Truth Survey');
  }

  /// Open Ward Officer Escalation Hearing Modal
  void _openHearingModal() {
    _checkAuthAndExecute(() {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (ctx) => _HearingBookingBottomSheet(
          issue: _currentIssue,
          onHearingBooked: (hearing) {
            setState(() {
              _currentIssue = _currentIssue.copyWith(
                scheduledHearings: [..._currentIssue.scheduledHearings, hearing],
              );
            });
            widget.onIssueUpdated?.call(_currentIssue);

            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Official Hearing with ${hearing.officerName} confirmed for ${hearing.timeSlot}!',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                backgroundColor: const Color(0xFF006699),
                behavior: SnackBarBehavior.floating,
              ),
            );
          },
        ),
      );
    }, 'Booking Escalation Hearing');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final severity = _currentIssue.severity;
    final category = _currentIssue.category;
    final isS5 = severity == SeverityLevel.s5;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Grievance Triage Console',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w900,
              ),
            ),
            Text(
              'Ticket ID: ${_currentIssue.code}',
              style: TextStyle(
                fontFamily: 'monospace',
                fontSize: 11,
                color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Share WhatsApp Alert',
            icon: const Icon(Icons.share_rounded, color: Color(0xFF25D366)),
            onPressed: _mobilizeViaWhatsApp,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Live S1-S5 Severity Scoring & SLA Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: severity.color.withValues(alpha: isDark ? 0.15 : 0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: severity.color.withValues(alpha: 0.5),
                  width: isS5 ? 2.0 : 1.0,
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
                          Icon(Icons.shield_rounded, color: severity.color, size: 22),
                          const SizedBox(width: 8),
                          Text(
                            'Statutory Severity Assessment',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 14,
                              color: isDark ? Colors.grey.shade200 : const Color(0xFF0F172A),
                            ),
                          ),
                        ],
                      ),
                      // S5 pulsating badge or static badge
                      isS5
                          ? ScaleTransition(
                              scale: _pulseAnimation,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: severity.color,
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: [
                                    BoxShadow(
                                      color: severity.color.withValues(alpha: 0.4),
                                      blurRadius: 8,
                                      spreadRadius: 1,
                                    ),
                                  ],
                                ),
                                child: Text(
                                  '${severity.code} • ${severity.label}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                            )
                          : Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: severity.color,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                '${severity.code} • ${severity.label}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Score: ${_currentIssue.severityScore.toStringAsFixed(1)} / 100',
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                                color: severity.color,
                              ),
                            ),
                            Text(
                              'Formula: (W_cat×0.35)+(W_urg×0.25)+(W_aff×0.15)+(W_com×0.15)+(W_time×0.10) + GM(${_currentIssue.groundModifier > 0 ? "+${_currentIssue.groundModifier}" : _currentIssue.groundModifier})',
                              style: TextStyle(
                                fontSize: 10,
                                fontFamily: 'monospace',
                                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: isDark ? Colors.grey.shade700 : Colors.grey.shade300,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              'Statutory SLA',
                              style: TextStyle(
                                fontSize: 10,
                                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                              ),
                            ),
                            Text(
                              _remainingSlaTime.isNegative
                                  ? 'SLA Breached'
                                  : (_remainingSlaTime.inHours >= 24
                                      ? '${(_remainingSlaTime.inHours / 24).round()}d left'
                                      : '${_remainingSlaTime.inHours}h ${_remainingSlaTime.inMinutes % 60}m left'),
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w900,
                                color: _remainingSlaTime.isNegative ? Colors.red : severity.color,
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
            const SizedBox(height: 14),

            // 2. 2-Hour Rapid On-Site Survey Framework Card
            if (_currentIssue.isRapidSurveyActive)
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF006699).withValues(alpha: isDark ? 0.2 : 0.08),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFF006699), width: 1.5),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.bolt_rounded, color: Color(0xFF006699), size: 22),
                        const SizedBox(width: 8),
                        const Expanded(
                          child: Text(
                            '2-Hour Rapid On-Site Survey Active',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 14,
                              color: Color(0xFF006699),
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF006699),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '${_remainingRapidSurveyTime.inMinutes}m left',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Are you near this location? Submit an on-ground audit (-10 to +45 pts) to dynamically recalibrate SLA priority and earn +50 XP.',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.grey.shade300 : const Color(0xFF334155),
                      ),
                    ),
                    const SizedBox(height: 10),
                    FilledButton.icon(
                      icon: const Icon(Icons.verified_rounded, size: 16),
                      label: const Text('Conduct Ground-Truth Audit (+50 XP)'),
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF006699),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: _openRapidSurveyModal,
                    ),
                  ],
                ),
              ),

            if (_currentIssue.isRapidSurveyActive) const SizedBox(height: 14),

            // 3. Interactive "Before & After" Split Screen Resolution Slider (If Resolved)
            if (_currentIssue.isResolved) ...[
              _buildBeforeAfterComparisonCard(context, isDark),
              const SizedBox(height: 14),
            ],

            // 4. Issue Description & Location Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: category.themeColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(category.icon, color: category.themeColor, size: 22),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              category.displayName,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: category.themeColor,
                              ),
                            ),
                            Text(
                              _currentIssue.title,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _currentIssue.description,
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      color: isDark ? Colors.grey.shade300 : const Color(0xFF334155),
                    ),
                  ),
                  const Divider(height: 24),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 18, color: Color(0xFF006699)),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          _currentIssue.address,
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? Colors.grey.shade400 : const Color(0xFF475569),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.account_circle_outlined, size: 18, color: Colors.grey),
                      const SizedBox(width: 6),
                      Text(
                        'Reported by ${_currentIssue.reportedByName}',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // 5. 1-Click WhatsApp Mobilization Banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF25D366).withValues(alpha: isDark ? 0.2 : 0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF25D366), width: 1.5),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF25D366),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.forum_rounded, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Mobilize Ward (व्हाट्सएप पर साझा करें)',
                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
                        ),
                        Text(
                          'Broadcast live SLA countdown & statutory hazard score to your RWA group',
                          style: TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                  FilledButton.icon(
                    icon: const Icon(Icons.send_rounded, size: 14),
                    label: const Text('Mobilize Ward'),
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF25D366),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: _mobilizeViaWhatsApp,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // 6. Ward Officer Escalation Hearing Section
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.gavel_rounded, color: Color(0xFF006699), size: 20),
                          SizedBox(width: 8),
                          Text(
                            'Statutory Ward Officer Hearing',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                        ],
                      ),
                      if (_currentIssue.isSlaBreached)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.red.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.red),
                          ),
                          child: const Text(
                            'SLA BREACHED',
                            style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 9),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'If resolution exceeds statutory SLA or quality is disputed, schedule a formal hearing with the Zonal Executive Engineer or download the official legal summons dossier.',
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                    ),
                  ),
                  if (_currentIssue.scheduledHearings.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF006699).withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFF006699).withValues(alpha: 0.3)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.event_available_rounded, size: 16, color: Color(0xFF006699)),
                              const SizedBox(width: 6),
                              Text(
                                'Scheduled Slot: ${_currentIssue.scheduledHearings.first.scheduledDate.toLocal().toString().split(" ")[0]} (${_currentIssue.scheduledHearings.first.timeSlot})',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Mode: ${_currentIssue.scheduledHearings.first.hearingMode} • Officer: ${_currentIssue.scheduledHearings.first.officerName}',
                            style: TextStyle(fontSize: 10, color: isDark ? Colors.grey.shade300 : const Color(0xFF475569)),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      FilledButton.tonalIcon(
                        icon: const Icon(Icons.description_rounded, size: 16),
                        label: const Text('Export Ward Hearing Dossier (सुनवाई दस्तावेज़ डाउनलोड करें)'),
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF006699).withValues(alpha: 0.15),
                          foregroundColor: const Color(0xFF006699),
                        ),
                        onPressed: () => WardHearingDossierDialog.show(
                          context,
                          _currentIssue,
                          _currentIssue.scheduledHearings.isNotEmpty ? _currentIssue.scheduledHearings.first : null,
                        ),
                      ),
                      OutlinedButton.icon(
                        icon: const Icon(Icons.calendar_month_rounded, size: 16),
                        label: Text(_currentIssue.scheduledHearings.isNotEmpty ? 'Rebook Slot' : 'Book Escalation Hearing Slot'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF006699),
                          side: const BorderSide(color: Color(0xFF006699)),
                        ),
                        onPressed: _openHearingModal,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF0F172A) : Colors.white,
          border: Border(
            top: BorderSide(
              color: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
            ),
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                icon: Icon(
                  _currentIssue.hasUpvoted ? Icons.thumb_up_alt_rounded : Icons.thumb_up_alt_outlined,
                  color: const Color(0xFF006699),
                ),
                label: Text(
                  '${_currentIssue.upvotes} Upvotes',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFF006699)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: _handleUpvote,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton.icon(
                icon: const Icon(Icons.share_location_rounded),
                label: const Text('Mobilize Ward'),
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF25D366),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: _mobilizeViaWhatsApp,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBeforeAfterComparisonCard(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: Colors.teal.withValues(alpha: 0.5),
          width: 1.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.compare_rounded, color: Colors.teal, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Before & After Resolution Inspector',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                  ),
                ],
              ),
              Container(
                decoration: BoxDecoration(
                  color: isDark ? Colors.grey.shade900 : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildModeButton('Split View', ComparisonViewMode.split, Icons.splitscreen_rounded, isDark),
                    _buildModeButton('Side-by-Side', ComparisonViewMode.sideBySide, Icons.view_column_rounded, isDark),
                    _buildModeButton('Full Screen', ComparisonViewMode.fullScreen, Icons.fullscreen_rounded, isDark),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          if (_comparisonMode == ComparisonViewMode.sideBySide)
            _buildSideBySideView(isDark)
          else
            _buildSplitSliderView(isDark),

          if (_comparisonMode == ComparisonViewMode.split) ...[
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Original (Before)',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                ),
                Text(
                  'Drag Divider (${(_splitPosition * 100).toInt()}%)',
                  style: TextStyle(fontSize: 11, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                ),
                const Text(
                  'Resolved (After)',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.teal),
                ),
              ],
            ),
            Slider(
              value: _splitPosition,
              min: 0.05,
              max: 0.95,
              activeColor: Colors.teal,
              onChanged: (val) {
                setState(() {
                  _splitPosition = val;
                });
              },
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildModeButton(String title, ComparisonViewMode mode, IconData icon, bool isDark) {
    final isSelected = _comparisonMode == mode;
    return InkWell(
      onTap: () {
        if (mode == ComparisonViewMode.fullScreen) {
          _openFullScreenComparison();
        } else {
          setState(() {
            _comparisonMode = mode;
          });
        }
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF006699) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 14,
              color: isSelected ? Colors.white : (isDark ? Colors.grey.shade400 : Colors.grey.shade600),
            ),
            const SizedBox(width: 4),
            Text(
              title,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.white : (isDark ? Colors.grey.shade300 : Colors.grey.shade700),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSplitSliderView(bool isDark) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final totalWidth = constraints.maxWidth;
        const totalHeight = 230.0;

        return ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: SizedBox(
            width: totalWidth,
            height: totalHeight,
            child: GestureDetector(
              onHorizontalDragUpdate: (details) {
                setState(() {
                  _splitPosition = (_splitPosition + details.delta.dx / totalWidth).clamp(0.05, 0.95);
                });
              },
              child: Stack(
                children: [
                  Positioned.fill(
                    child: _buildAfterVisual(),
                  ),
                  Positioned(
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: totalWidth * _splitPosition,
                    child: ClipRect(
                      child: OverflowBox(
                        alignment: Alignment.centerLeft,
                        maxWidth: totalWidth,
                        maxHeight: totalHeight,
                        child: SizedBox(
                          width: totalWidth,
                          height: totalHeight,
                          child: _buildBeforeVisual(),
                        ),
                      ),
                    ),
                  ),
                  // Floating Pill Badge: [Before / पहले] Top-Left
                  Positioned(
                    top: 10,
                    left: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.75),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white24),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.report_problem_rounded, color: Colors.amber, size: 12),
                          SizedBox(width: 4),
                          Text(
                            'Before / पहले',
                            style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Floating Pill Badge: [After / बाद में] Top-Right
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F766E).withValues(alpha: 0.85),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white30),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.task_alt_rounded, color: Colors.white, size: 12),
                          SizedBox(width: 4),
                          Text(
                            'After / बाद में',
                            style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Draggable Vertical Divider with Circular Handle
                  Positioned(
                    left: totalWidth * _splitPosition - 1.5,
                    top: 0,
                    bottom: 0,
                    child: Container(
                      width: 3,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.3),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    left: totalWidth * _splitPosition - 18,
                    top: (totalHeight - 36) / 2,
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.35),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.compare_arrows_rounded,
                        color: Color(0xFF006699),
                        size: 20,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildSideBySideView(bool isDark) {
    return SizedBox(
      height: 200,
      child: Row(
        children: [
          Expanded(
            child: Stack(
              children: [
                Positioned.fill(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: _buildBeforeVisual(),
                  ),
                ),
                Positioned(
                  top: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.75),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Before / पहले',
                      style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Stack(
              children: [
                Positioned.fill(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: _buildAfterVisual(),
                  ),
                ),
                Positioned(
                  top: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F766E).withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'After / बाद में',
                      style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBeforeVisual() {
    return Container(
      color: const Color(0xFF7F1D1D),
      alignment: Alignment.center,
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.report_problem_rounded, color: Colors.white, size: 48),
          SizedBox(height: 8),
          Text(
            'ORIGINAL INCIDENT REPORT',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              fontSize: 13,
              letterSpacing: 0.5,
            ),
          ),
          Text(
            'Uncovered Hazard & Street Cavity',
            style: TextStyle(color: Colors.white70, fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _buildAfterVisual() {
    return Container(
      color: const Color(0xFF0F766E),
      alignment: Alignment.center,
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.task_alt_rounded, color: Colors.white, size: 48),
          SizedBox(height: 8),
          Text(
            'VERIFIED MUNICIPAL RESOLUTION',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              fontSize: 13,
              letterSpacing: 0.5,
            ),
          ),
          Text(
            'Pavement Restored & Debris Cleared',
            style: TextStyle(color: Colors.white70, fontSize: 11),
          ),
        ],
      ),
    );
  }

  void _openFullScreenComparison() {
    showDialog(
      context: context,
      builder: (ctx) => Dialog.fullscreen(
        child: Scaffold(
          appBar: AppBar(
            title: const Text('Before & After High-Res Resolution Inspector'),
            leading: IconButton(
              icon: const Icon(Icons.close_rounded),
              onPressed: () => Navigator.pop(ctx),
            ),
          ),
          body: Padding(
            padding: const EdgeInsets.all(24),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 900),
                child: _buildSplitSliderView(Theme.of(ctx).brightness == Brightness.dark),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// 2-Hour Rapid On-Site Survey Bottom Sheet
class _RapidSurveyBottomSheet extends StatefulWidget {
  final CivicIssue issue;
  final ValueChanged<RapidSurveyAudit> onAuditSubmitted;

  const _RapidSurveyBottomSheet({
    required this.issue,
    required this.onAuditSubmitted,
  });

  @override
  State<_RapidSurveyBottomSheet> createState() => _RapidSurveyBottomSheetState();
}

class _RapidSurveyBottomSheetState extends State<_RapidSurveyBottomSheet> {
  int _hazardPoints = 0; // -10, 0, +10, +20
  int _blockagePoints = 0; // 0, +5, +15
  int _proximityPoints = 0; // 0, +10
  final _notesController = TextEditingController();

  int get _totalModifier => (_hazardPoints + _blockagePoints + _proximityPoints).clamp(-10, 45);

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: ListView(
        shrinkWrap: true,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.bolt_rounded, color: Color(0xFF006699), size: 24),
                  SizedBox(width: 8),
                  Text(
                    '2-Hour Ground-Truth Audit',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF006699),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'Modifier: ${_totalModifier >= 0 ? "+$_totalModifier" : _totalModifier} pts',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // 1. Observed Hazard Level
          Text('1. Observed Hazard Severity Level', style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(
                label: const Text('Minimal (-10)'),
                selected: _hazardPoints == -10,
                onSelected: (s) => setState(() => _hazardPoints = -10),
              ),
              ChoiceChip(
                label: const Text('Moderate (+0)'),
                selected: _hazardPoints == 0,
                onSelected: (s) => setState(() => _hazardPoints = 0),
              ),
              ChoiceChip(
                label: const Text('High (+10)'),
                selected: _hazardPoints == 10,
                onSelected: (s) => setState(() => _hazardPoints = 10),
              ),
              ChoiceChip(
                label: const Text('Lethal/Critical (+20)'),
                selected: _hazardPoints == 20,
                selectedColor: Colors.red.shade700,
                onSelected: (s) => setState(() => _hazardPoints = 20),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // 2. Road Blockage
          Text('2. Road & Commuter Blockage', style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(
                label: const Text('None (+0)'),
                selected: _blockagePoints == 0,
                onSelected: (s) => setState(() => _blockagePoints = 0),
              ),
              ChoiceChip(
                label: const Text('Partial Lane (+5)'),
                selected: _blockagePoints == 5,
                onSelected: (s) => setState(() => _blockagePoints = 5),
              ),
              ChoiceChip(
                label: const Text('Full Arterial Closure (+15)'),
                selected: _blockagePoints == 15,
                onSelected: (s) => setState(() => _blockagePoints = 15),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // 3. Sensitive Proximity
          Text('3. Sensitive Zone Proximity', style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(
                label: const Text('Normal Zone (+0)'),
                selected: _proximityPoints == 0,
                onSelected: (s) => setState(() => _proximityPoints = 0),
              ),
              ChoiceChip(
                label: const Text('Hospital / School / Vulnerable (+10)'),
                selected: _proximityPoints == 10,
                onSelected: (s) => setState(() => _proximityPoints = 10),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Notes
          TextField(
            controller: _notesController,
            decoration: const InputDecoration(
              labelText: 'On-Site Field Notes (Optional)',
              hintText: 'e.g. Water entering nearby clinic basement...',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 20),

          FilledButton.icon(
            icon: const Icon(Icons.check_rounded),
            label: const Text('Submit Audit & Recalibrate Ticket (+50 XP)'),
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF006699),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: () {
              final audit = RapidSurveyAudit(
                id: 'AUDIT-${DateTime.now().millisecondsSinceEpoch}',
                citizenName: 'Citizen Verifier',
                auditedAt: DateTime.now(),
                hazardPoints: _hazardPoints,
                blockagePoints: _blockagePoints,
                proximityPoints: _proximityPoints,
                notes: _notesController.text.trim(),
              );
              widget.onAuditSubmitted(audit);
              Navigator.pop(context);
            },
          ),
        ],
      ),
    );
  }
}

/// Hearing Booking Bottom Sheet
class _HearingBookingBottomSheet extends StatefulWidget {
  final CivicIssue issue;
  final ValueChanged<CitizenHearing> onHearingBooked;

  const _HearingBookingBottomSheet({
    required this.issue,
    required this.onHearingBooked,
  });

  @override
  State<_HearingBookingBottomSheet> createState() => _HearingBookingBottomSheetState();
}

class _HearingBookingBottomSheetState extends State<_HearingBookingBottomSheet> {
  String _selectedOfficer = 'Er. Raghavan, Executive Engineer (BBMP)';
  String _selectedMode = 'In-Person at Ward Office';
  String _selectedSlot = 'Tomorrow at 11:30 AM';
  final _phoneController = TextEditingController(text: '+91 98450 12345');
  final _reasonController = TextEditingController(text: 'Statutory SLA escalation for hazard remediation');

  @override
  void dispose() {
    _phoneController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: ListView(
        shrinkWrap: true,
        children: [
          const Text(
            'Schedule Statutory Escalation Hearing',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _selectedOfficer,
            decoration: const InputDecoration(labelText: 'Designated Ward Officer', border: OutlineInputBorder()),
            items: [
              'Er. Raghavan, Executive Engineer (BBMP)',
              'Dr. K. S. Rajendra, IAS - Zonal Commissioner',
              'Smt. Meenakshi Sundaram - Chief Health Officer',
            ].map((o) => DropdownMenuItem(value: o, child: Text(o, style: const TextStyle(fontSize: 12)))).toList(),
            onChanged: (v) => setState(() => _selectedOfficer = v!),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _selectedMode,
            decoration: const InputDecoration(labelText: 'Hearing Mode', border: OutlineInputBorder()),
            items: ['In-Person at Ward Office', 'Video Conference'].map((m) => DropdownMenuItem(value: m, child: Text(m))).toList(),
            onChanged: (v) => setState(() => _selectedMode = v!),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _selectedSlot,
            decoration: const InputDecoration(labelText: 'Available Time Slot', border: OutlineInputBorder()),
            items: ['Tomorrow at 11:30 AM', 'Thursday at 02:00 PM', 'Friday at 10:00 AM'].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
            onChanged: (v) => setState(() => _selectedSlot = v!),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            icon: const Icon(Icons.check_circle_outline_rounded),
            label: const Text('Confirm Statutory Hearing'),
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF006699),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: () {
              final hearing = CitizenHearing(
                hearingId: 'HRG-${DateTime.now().millisecondsSinceEpoch}',
                issueId: widget.issue.id,
                officerName: _selectedOfficer,
                officerTitle: 'Ward Statutory In-Charge',
                scheduledDate: DateTime.now().add(const Duration(days: 1)),
                timeSlot: _selectedSlot,
                citizenName: 'Citizen Contributor',
                contactPhone: _phoneController.text.trim(),
                grievanceSummary: _reasonController.text.trim(),
                hearingMode: _selectedMode,
              );
              widget.onHearingBooked(hearing);
              Navigator.pop(context);
            },
          ),
        ],
      ),
    );
  }
}
