import 'dart:math';
import 'package:flutter/material.dart';
import '../models/issue.dart';
import '../models/user_profile.dart';
import 'profile_screen.dart';
import 'issue_detail_screen.dart';
import 'report_issue_screen.dart';

enum FilterStream {
  all(label: 'All Active'),
  rapidSurvey(label: '⚡ Rapid Survey Active'),
  criticalS5(label: '🚨 Critical S5'),
  overdueSla(label: '⏳ Overdue SLA'),
  resolved(label: '✅ Resolved Issues');

  final String label;
  const FilterStream({required this.label});
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();

  // Guest Exploration Mode
  bool _isGuestMode = true;

  String? _selectedCategoryId;
  FilterStream _activeStream = FilterStream.all;
  String _searchQuery = '';
  late List<CivicIssue> _issues;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _issues = _generateInitialIssues();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  List<CivicIssue> _generateInitialIssues() {
    final now = DateTime.now();
    return [
      CivicIssue(
        id: 'CFX-2026-1042',
        code: 'BLR-W112-042',
        title: 'Open Manhole with Collapsed Rim on Main Corridor',
        description: 'Uncovered deep stormwater manhole 2m deep on 100 Feet Road right at pedestrian crossing. Immediate risk of pedestrian or biker fall.',
        categoryId: 'drainage', // manhole_open (95 weight)
        severityScore: 92.5,
        severity: SeverityLevel.s5, // 4-Hour Critical SLA
        latitude: 12.9716,
        longitude: 77.5946,
        address: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, 560038',
        district: 'Indiranagar Ward 112',
        status: 'open',
        reportedAt: now.subtract(const Duration(minutes: 45)),
        rapidSurveyExpiresAt: now.add(const Duration(minutes: 75)),
        upvotes: 42,
        reportedByName: 'Ananya Deshmukh',
      ),
      CivicIssue(
        id: 'CFX-2026-1043',
        code: 'BLR-W112-043',
        title: 'Broken Traffic Signal Junction & Dangerous Blind Turn',
        description: '4-way traffic signal power severed. Heavy vehicular gridlock and multiple near-collisions during school rush hour.',
        categoryId: 'traffic', // traffic_signal_broken (80 weight)
        severityScore: 78.0,
        severity: SeverityLevel.s4, // 12-Hour SLA
        latitude: 12.9698,
        longitude: 77.6355,
        address: '8th Main, Domlur Layout, Bengaluru, 560071',
        district: 'Domlur Ward 112',
        status: 'open',
        reportedAt: now.subtract(const Duration(minutes: 30)),
        rapidSurveyExpiresAt: now.add(const Duration(minutes: 90)),
        upvotes: 89,
        reportedByName: 'Karthik Ramanathan',
      ),
      CivicIssue(
        id: 'CFX-2026-1044',
        code: 'BLR-W112-044',
        title: 'Main Pipeline Burst - Flooding Service Road',
        description: 'High pressure BWSSB water line cracked. Potable water gushing onto pavement and filling basements of adjacent apartment complex.',
        categoryId: 'water_supply', // water_leakage (60 weight)
        severityScore: 61.5,
        severity: SeverityLevel.s3, // 48-Hour SLA
        latitude: 12.9784,
        longitude: 77.6408,
        address: 'Old Airport Road, Kodihalli, Bengaluru, 560008',
        district: 'HAL Airport Ward 113',
        status: 'in_progress',
        reportedAt: now.subtract(const Duration(hours: 3)),
        rapidSurveyExpiresAt: now.subtract(const Duration(hours: 1)),
        upvotes: 31,
        reportedByName: 'Suresh Babu',
      ),
      CivicIssue(
        id: 'CFX-2026-1045',
        code: 'BLR-W112-045',
        title: 'Deep Road Cavity & Asphalt Potholes',
        description: 'Severe 15cm deep asphalt cavity after heavy monsoon rain. Repaired successfully with hot-mix asphalt and stone ballast by Ward PWD crew.',
        categoryId: 'roads',
        severityScore: 68.0,
        severity: SeverityLevel.s4,
        latitude: 12.9750,
        longitude: 77.6000,
        address: 'Residency Road, Ward 111, Bengaluru',
        district: 'Ward 111 Shanthala Nagar',
        status: 'resolved_by_worker',
        reportedAt: now.subtract(const Duration(hours: 36)),
        slaDeadline: now.subtract(const Duration(hours: 24)),
        upvotes: 75,
        reportedByName: 'Rohan Varma',
        resolutionImageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=600&q=80',
      ),
    ];
  }

  void _showAuthPrompt(String actionName, [VoidCallback? onAuthenticated]) {
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
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF006699).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.lock_open_rounded, color: Color(0xFF006699), size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Sign In Required for $actionName',
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                        ),
                        const Text(
                          'नागरिक प्रमाणीकरण आवश्यक है',
                          style: TextStyle(fontSize: 12, color: Color(0xFF006699), fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                'You are currently exploring CivicFix in Public Guest Mode.\n\n'
                'To lodge formal grievances, participate in 2-Hour Rapid On-Site Surveys, '
                'or book Ward Officer Hearings, please authenticate with your citizen profile.',
                style: TextStyle(fontSize: 13, color: isDark ? Colors.grey.shade300 : const Color(0xFF475569)),
              ),
              const SizedBox(height: 22),
              FilledButton.icon(
                icon: const Icon(Icons.verified_user_rounded, size: 18),
                label: const Text('Sign In with OTP / Email (साइन इन करें)'),
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF006699),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () {
                  Navigator.pop(ctx);
                  setState(() {
                    _isGuestMode = false;
                  });
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('✅ Authenticated as Citizen Contributor (Ward 112 Indiranagar)!'),
                      backgroundColor: Color(0xFF006699),
                    ),
                  );
                  onAuthenticated?.call();
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
  }

  void _onLodgeReportPressed() {
    if (_isGuestMode) {
      _showAuthPrompt('Lodging Grievance', () {
        _navigateToReportScreen();
      });
      return;
    }
    _navigateToReportScreen();
  }

  void _navigateToReportScreen() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ReportIssueScreen(
          existingIssues: _issues,
          onIssueSubmitted: (newIssue) {
            setState(() {
              _issues.insert(0, newIssue);
            });
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('🚨 Grievance #${newIssue.code} lodged! Statutory SLA active.'),
                backgroundColor: const Color(0xFF006699),
              ),
            );
          },
        ),
      ),
    );
  }

  List<CivicIssue> get _filteredIssues {
    return _issues.where((issue) {
      // Category filter
      if (_selectedCategoryId != null && issue.categoryId != _selectedCategoryId) {
        return false;
      }

      // Filter stream
      switch (_activeStream) {
        case FilterStream.all:
          break;
        case FilterStream.rapidSurvey:
          if (!issue.isRapidSurveyActive) return false;
          break;
        case FilterStream.criticalS5:
          if (issue.severity != SeverityLevel.s5) return false;
          break;
        case FilterStream.overdueSla:
          if (!issue.isSlaBreached) return false;
          break;
        case FilterStream.resolved:
          if (!issue.isResolved) return false;
          break;
      }

      // Search query
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final matchTitle = issue.title.toLowerCase().contains(q);
        final matchCode = issue.code.toLowerCase().contains(q);
        final matchAddress = issue.address.toLowerCase().contains(q);
        if (!matchTitle && !matchCode && !matchAddress) return false;
      }

      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isWide = MediaQuery.of(context).size.width >= 768;

    final criticalS5Count = _issues.where((i) => i.severity == SeverityLevel.s5 && !i.isResolved).length;
    final rapidSurveyCount = _issues.where((i) => i.isRapidSurveyActive).length;
    final resolvedCount = _issues.where((i) => i.isResolved).length;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF006699),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.location_city_rounded, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'CivicFix GovPortal',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                ),
                Text(
                  _isGuestMode ? 'Public Guest Exploration Mode' : 'Verified Resident • Ward 112',
                  style: TextStyle(
                    fontSize: 11,
                    color: _isGuestMode ? Colors.amber.shade700 : const Color(0xFF006699),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          if (_isGuestMode)
            TextButton.icon(
              icon: const Icon(Icons.login_rounded, size: 16),
              label: const Text('Sign In'),
              style: TextButton.styleFrom(foregroundColor: const Color(0xFF006699)),
              onPressed: () => _showAuthPrompt('Account Login'),
            )
          else
            IconButton(
              tooltip: 'Citizen Profile & Badges',
              icon: const Icon(Icons.account_circle_rounded, color: Color(0xFF006699)),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ProfileScreen()),
                );
              },
            ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF006699),
          labelColor: const Color(0xFF006699),
          unselectedLabelColor: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
          tabs: const [
            Tab(icon: Icon(Icons.radar_rounded, size: 18), text: 'Live Radar'),
            Tab(icon: Icon(Icons.analytics_outlined, size: 18), text: 'Command Ticker'),
            Tab(icon: Icon(Icons.leaderboard_rounded, size: 18), text: 'Leaderboard'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Live Radar Feed with Category Filter & 5-Variable Severity
          _buildRadarFeedView(isDark, criticalS5Count, rapidSurveyCount, resolvedCount),

          // Tab 2: Municipal Command Center Ticker
          _buildMunicipalCommandView(isDark, criticalS5Count, rapidSurveyCount, resolvedCount),

          // Tab 3: Public Leaderboard
          _buildLeaderboardView(isDark),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFF006699),
        icon: const Icon(Icons.add_location_alt_rounded, color: Colors.white),
        label: const Text(
          'Lodge Grievance',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        onPressed: _onLodgeReportPressed,
      ),
    );
  }

  /// Live Radar Feed View
  Widget _buildRadarFeedView(
    bool isDark,
    int criticalCount,
    int rapidSurveyCount,
    int resolvedCount,
  ) {
    final issues = _filteredIssues;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Live Municipal KPI Ticker Bar
        _buildKpiTickerCard(isDark, criticalCount, rapidSurveyCount, resolvedCount),
        const SizedBox(height: 12),

        // Search Bar
        TextField(
          controller: _searchController,
          decoration: InputDecoration(
            hintText: 'Search tickets by code, hazard, or ward...',
            prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF006699)),
            suffixIcon: _searchQuery.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear_rounded),
                    onPressed: () {
                      _searchController.clear();
                      setState(() => _searchQuery = '');
                    },
                  )
                : null,
            filled: true,
            fillColor: isDark ? const Color(0xFF1E293B) : Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: isDark ? Colors.grey.shade800 : Colors.grey.shade300),
            ),
          ),
          onChanged: (val) => setState(() => _searchQuery = val.trim()),
        ),
        const SizedBox(height: 12),

        // 1-Click Filter Streams
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: FilterStream.values.map((stream) {
              final isSelected = _activeStream == stream;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  label: Text(stream.label),
                  selected: isSelected,
                  selectedColor: const Color(0xFF006699).withValues(alpha: 0.15),
                  checkmarkColor: const Color(0xFF006699),
                  labelStyle: TextStyle(
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    color: isSelected ? const Color(0xFF006699) : null,
                  ),
                  onSelected: (_) => setState(() => _activeStream = stream),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 10),

        // 14 Hazard Categories Horizontal Selector
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              Padding(
                padding: const EdgeInsets.only(right: 6),
                child: ChoiceChip(
                  label: const Text('All Hazards'),
                  selected: _selectedCategoryId == null,
                  onSelected: (s) => setState(() => _selectedCategoryId = null),
                ),
              ),
              ...kCivic14Categories.map((cat) {
                final isSel = _selectedCategoryId == cat.id;
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: ChoiceChip(
                    avatar: Icon(cat.icon, size: 14, color: isSel ? Colors.white : cat.themeColor),
                    label: Text(cat.englishName, style: const TextStyle(fontSize: 11)),
                    selected: isSel,
                    selectedColor: const Color(0xFF006699),
                    onSelected: (s) => setState(() => _selectedCategoryId = s ? cat.id : null),
                  ),
                );
              }),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Issue List or Clean GovTech Empty State
        if (issues.isEmpty)
          _buildEmptyState(isDark)
        else
          ...issues.map((issue) => _buildIssueCard(issue, isDark)),
      ],
    );
  }

  /// Live KPI Ticker Widget
  Widget _buildKpiTickerCard(
    bool isDark,
    int criticalCount,
    int rapidSurveyCount,
    int resolvedCount,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildTickerMetric(
            icon: Icons.error_rounded,
            iconColor: const Color(0xFFDC2626),
            value: '$criticalCount',
            label: 'Active Critical S5',
            onTap: () => setState(() => _activeStream = FilterStream.criticalS5),
          ),
          Container(width: 1, height: 32, color: Colors.grey.shade300),
          _buildTickerMetric(
            icon: Icons.bolt_rounded,
            iconColor: const Color(0xFF006699),
            value: '$rapidSurveyCount',
            label: 'Rapid Surveys',
            onTap: () => setState(() => _activeStream = FilterStream.rapidSurvey),
          ),
          Container(width: 1, height: 32, color: Colors.grey.shade300),
          _buildTickerMetric(
            icon: Icons.check_circle_rounded,
            iconColor: Colors.teal,
            value: '$resolvedCount',
            label: 'Resolved Issues',
            onTap: () => setState(() => _activeStream = FilterStream.resolved),
          ),
        ],
      ),
    );
  }

  Widget _buildTickerMetric({
    required IconData icon,
    required Color iconColor,
    required String value,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Row(
          children: [
            Icon(icon, color: iconColor, size: 20),
            const SizedBox(width: 6),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: iconColor),
                ),
                Text(
                  label,
                  style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// Clean GovTech Vector Empty State
  Widget _buildEmptyState(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(Icons.assignment_turned_in_outlined, size: 56, color: Colors.teal.shade300),
          const SizedBox(height: 12),
          const Text(
            'All Wards Operating Under SLA',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          Text(
            'No matching complaints found under this stream filter. Keep ward corridors monitored.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
          ),
        ],
      ),
    );
  }

  /// Ticket Card in Feed
  Widget _buildIssueCard(CivicIssue issue, bool isDark) {
    final sev = issue.severity;
    final cat = issue.category;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      color: isDark ? const Color(0xFF1E293B) : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => IssueDetailScreen(
                issue: issue,
                isGuestUser: _isGuestMode,
                onRequestAuth: () => _showAuthPrompt('Ticket Actions'),
                onIssueUpdated: (updated) {
                  setState(() {
                    final idx = _issues.indexWhere((i) => i.id == updated.id);
                    if (idx != -1) _issues[idx] = updated;
                  });
                },
              ),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(cat.icon, size: 16, color: cat.themeColor),
                      const SizedBox(width: 6),
                      Text(
                        cat.englishName,
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: cat.themeColor),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: sev.color.withValues(alpha: isDark ? 0.2 : 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: sev.color.withValues(alpha: 0.5)),
                    ),
                    child: Text(
                      '${sev.code} • ${sev.label}',
                      style: TextStyle(color: sev.color, fontSize: 11, fontWeight: FontWeight.w900),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                issue.title,
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Text(
                issue.address,
                style: TextStyle(fontSize: 11, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (issue.isRapidSurveyActive)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF006699).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.bolt_rounded, size: 14, color: Color(0xFF006699)),
                          const SizedBox(width: 4),
                          Text(
                            '2-Hr Survey Active (${issue.remainingRapidSurveyTime.inMinutes}m)',
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF006699)),
                          ),
                        ],
                      ),
                    )
                  else
                    Text(
                      'Ticket: ${issue.code}',
                      style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: Colors.grey),
                    ),
                  Row(
                    children: [
                      const Icon(Icons.thumb_up_alt_rounded, size: 14, color: Color(0xFF006699)),
                      const SizedBox(width: 4),
                      Text('${issue.upvotes}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Municipal Command Center Tab
  Widget _buildMunicipalCommandView(
    bool isDark,
    int criticalCount,
    int rapidSurveyCount,
    int resolvedCount,
  ) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildKpiTickerCard(isDark, criticalCount, rapidSurveyCount, resolvedCount),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                '🏛️ Municipal Governance Live Status',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Automated escalation protocol enforces statutory SLAs based on deterministic 5-variable mathematical weights.',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const Divider(height: 24),
              _buildSlaSpecRow('S5 Critical Emergency', '4 Hours', 'Crimson (Open Manhole, Structural Collapse)'),
              _buildSlaSpecRow('S4 Severe Disruption', '12 Hours', 'Orange (Traffic Lights, Fallen Trees)'),
              _buildSlaSpecRow('S3 Moderate Impact', '48 Hours', 'Amber (Water Leaks, Solid Waste)'),
              _buildSlaSpecRow('S2 Standard Redressal', '7 Days', 'Indigo (Neighborhood Repairs)'),
              _buildSlaSpecRow('S1 Minor / Aesthetic', '14 Days', 'Teal (Sign Painting, Trimming)'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSlaSpecRow(String level, String hours, String examples) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(level, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
          ),
          Expanded(
            flex: 1,
            child: Text(hours, style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF006699), fontSize: 12)),
          ),
          Expanded(
            flex: 3,
            child: Text(examples, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          ),
        ],
      ),
    );
  }

  /// Leaderboard Tab
  Widget _buildLeaderboardView(bool isDark) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF006699), Color(0xFF004C73)],
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '🏆 Ward Citizen Leaderboard',
                style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 4),
              Text(
                'Top verified citizen wardens resolving civic hazards and conducting rapid ground-truth audits.',
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _buildLeaderboardItem(1, 'Priya Sharma', 'Gold Warden', 3450, isDark),
        _buildLeaderboardItem(2, 'Karthik Ramanathan', 'Silver Warden', 2890, isDark),
        _buildLeaderboardItem(3, 'Ananya Deshmukh', 'Bronze Sentinel', 2410, isDark),
        _buildLeaderboardItem(4, 'Suresh Babu', 'Active Verifier', 1850, isDark),
      ],
    );
  }

  Widget _buildLeaderboardItem(int rank, String name, String tier, int xp, bool isDark) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 0,
      color: isDark ? const Color(0xFF1E293B) : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: rank == 1 ? Colors.amber : const Color(0xFF006699),
          foregroundColor: Colors.white,
          child: Text('#$rank', style: const TextStyle(fontWeight: FontWeight.bold)),
        ),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(tier, style: const TextStyle(fontSize: 11)),
        trailing: Text(
          '$xp XP',
          style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF006699), fontSize: 14),
        ),
      ),
    );
  }
}
