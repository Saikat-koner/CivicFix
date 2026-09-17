import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'report_issue_screen.dart';
import 'issue_detail_screen.dart';
import 'leaderboard_screen.dart';
import 'admin_dashboard_screen.dart';
import 'profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final MapController _mapController = MapController();

  String _selectedFilter = 'all';
  Map<String, dynamic>? _userProfile;
  double _currentZoom = 13.0;
  LatLng _mapCenter = const LatLng(28.6139, 77.2090);

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadUserProfile();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadUserProfile() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId != null) {
      final data = await Supabase.instance.client
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
      if (mounted && data != null) {
        setState(() => _userProfile = data);
      }
    }
  }

  Stream<List<Map<String, dynamic>>> _streamIssues() {
    var stream = Supabase.instance.client
        .from('issues')
        .stream(primaryKey: ['id']);

    if (_selectedFilter != 'all') {
      stream = stream.eq('category', _selectedFilter);
    }

    return stream.order('created_at', ascending: false);
  }

  Stream<List<Map<String, dynamic>>> _streamMyIssues() {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) {
      return Stream.value([]);
    }
    return Supabase.instance.client
        .from('issues')
        .stream(primaryKey: ['id'])
        .eq('user_id', userId)
        .order('created_at', ascending: false);
  }

  Color _getCategoryColor(String cat) {
    switch (cat) {
      case 'pothole':
        return const Color(0xFFE65100);
      case 'street_light':
        return const Color(0xFFF57F17);
      case 'garbage_dump':
        return const Color(0xFF2E7D32);
      case 'water_leakage':
        return const Color(0xFF0277BD);
      case 'manhole_open':
        return const Color(0xFFC62828);
      case 'drainage_blocked':
        return const Color(0xFF455A64);
      case 'broken_sidewalk':
        return const Color(0xFF6D4C41);
      case 'traffic_signal_broken':
        return const Color(0xFFD84315);
      case 'stray_animals':
        return const Color(0xFF8D6E63);
      case 'illegal_construction':
        return const Color(0xFF5D4037);
      case 'tree_fallen':
        return const Color(0xFF388E3C);
      case 'public_toilet_broken':
        return const Color(0xFF00897B);
      case 'road_sign_missing':
        return const Color(0xFF1565C0);
      case 'illegal_parking':
        return const Color(0xFF6A1B9A);
      default:
        return const Color(0xFF6A1B9A);
    }
  }

  IconData _getCategoryIcon(String cat) {
    switch (cat) {
      case 'pothole':
        return Icons.warning_amber_rounded;
      case 'street_light':
        return Icons.lightbulb;
      case 'garbage_dump':
        return Icons.delete_forever;
      case 'water_leakage':
        return Icons.water_drop;
      case 'manhole_open':
        return Icons.dangerous;
      case 'drainage_blocked':
        return Icons.water_damage;
      case 'broken_sidewalk':
        return Icons.directions_walk;
      case 'traffic_signal_broken':
        return Icons.traffic;
      case 'stray_animals':
        return Icons.pets;
      case 'illegal_construction':
        return Icons.fence;
      case 'tree_fallen':
        return Icons.park;
      case 'public_toilet_broken':
        return Icons.wc;
      case 'road_sign_missing':
        return Icons.signpost;
      case 'illegal_parking':
        return Icons.no_transfer;
      default:
        return Icons.report_problem;
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'resolved_by_worker':
      case 'community_verified':
        return 'RESOLVED (हल हो गया)';
      case 'in_progress':
        return 'WORKING (काम चालू)';
      default:
        return 'PENDING (लंबित)';
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'resolved_by_worker':
      case 'community_verified':
        return Colors.green;
      case 'in_progress':
        return Colors.orange;
      default:
        return Colors.redAccent;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'resolved_by_worker':
      case 'community_verified':
        return Icons.check_circle;
      case 'in_progress':
        return Icons.engineering;
      default:
        return Icons.pending;
    }
  }

  // --- SMART MAP DE-CLUSTERING & DE-CONGESTION ALGORITHM ---
  List<MapCluster> _clusterIssues(List<Map<String, dynamic>> issues, double zoom) {
    final validIssues = issues.where((i) => i['latitude'] != null && i['longitude'] != null).toList();
    if (validIssues.isEmpty) return [];

    final double clusterThreshold = 0.08 / (zoom > 10 ? (zoom - 9) * 2.5 : 1.0);

    final List<MapCluster> clusters = [];

    for (var issue in validIssues) {
      final double lat = (issue['latitude'] as num).toDouble();
      final double lng = (issue['longitude'] as num).toDouble();
      final LatLng pos = LatLng(lat, lng);

      bool addedToCluster = false;
      for (var cluster in clusters) {
        final double distLat = (cluster.center.latitude - lat).abs();
        final double distLng = (cluster.center.longitude - lng).abs();

        if (distLat < clusterThreshold && distLng < clusterThreshold && zoom < 16.0) {
          cluster.items.add(issue);
          double avgLat = 0, avgLng = 0;
          for (var item in cluster.items) {
            avgLat += (item['latitude'] as num).toDouble();
            avgLng += (item['longitude'] as num).toDouble();
          }
          cluster.center = LatLng(avgLat / cluster.items.length, avgLng / cluster.items.length);
          addedToCluster = true;
          break;
        }
      }

      if (!addedToCluster) {
        clusters.add(MapCluster(center: pos, items: [issue]));
      }
    }

    return clusters;
  }

  void _showClusterDetails(BuildContext context, MapCluster cluster) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.5,
          minChildSize: 0.3,
          maxChildSize: 0.85,
          expand: false,
          builder: (_, scrollController) {
            return Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 45,
                      height: 5,
                      decoration: BoxDecoration(color: Theme.of(context).colorScheme.outlineVariant, borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '📍 ${cluster.items.length} Issues in this Area',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      IconButton(
                        icon: Icon(Icons.zoom_in, color: Theme.of(context).colorScheme.primary, size: 28),
                        tooltip: 'Zoom into area',
                        onPressed: () {
                          Navigator.pop(ctx);
                          _mapController.move(cluster.center, _currentZoom + 2.5);
                        },
                      )
                    ],
                  ),
                  const Divider(),
                  Expanded(
                    child: ListView.builder(
                      controller: scrollController,
                      itemCount: cluster.items.length,
                      itemBuilder: (context, idx) {
                        final item = cluster.items[idx];
                        final color = _getCategoryColor(item['category'] ?? '');
                        final icon = _getCategoryIcon(item['category'] ?? '');

                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 6),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: color.withValues(alpha: 0.15),
                              child: Icon(icon, color: color),
                            ),
                            title: Text(item['title'] ?? 'Issue', style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text(item['address_text'] ?? 'Nearby location'),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () {
                              Navigator.pop(ctx);
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => IssueDetailScreen(issue: item)),
                              );
                            },
                          ),
                        );
                      },
                    ),
                  )
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildIssueFeedCard(BuildContext context, Map<String, dynamic> item) {
    final color = _getCategoryColor(item['category'] ?? '');
    final icon = _getCategoryIcon(item['category'] ?? '');
    final status = item['status']?.toString() ?? 'reported';
    final statusColor = _getStatusColor(status);
    final statusLabel = _getStatusLabel(status);
    final statusIcon = _getStatusIcon(status);

    // Timeago
    String timeAgoStr = '';
    if (item['created_at'] != null) {
      try {
        final dt = DateTime.parse(item['created_at'].toString());
        timeAgoStr = timeago.format(dt);
      } catch (_) {}
    }

    return Card(
      elevation: 3,
      margin: const EdgeInsets.only(bottom: 14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => IssueDetailScreen(issue: item)),
          );
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  child: Image.network(
                    item['image_url'] ?? '',
                    height: 180,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => Container(
                      height: 180,
                      color: Theme.of(context).colorScheme.surfaceContainerHighest,
                      child: const Icon(Icons.broken_image, size: 48),
                    ),
                  ),
                ),
                // Category Badge
                Positioned(
                  top: 10,
                  left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)],
                    ),
                    child: Row(
                      children: [
                        Icon(icon, color: Colors.white, size: 18),
                        const SizedBox(width: 6),
                        Text(
                          item['category'].toString().toUpperCase(),
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ),
                // Status Badge (3-state: PENDING/WORKING/RESOLVED)
                Positioned(
                  top: 10,
                  right: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: statusColor,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        Icon(statusIcon, color: Colors.white, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          statusLabel,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item['title'] ?? 'Civic Issue',
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item['description'] ?? 'No description provided.',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 13),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          '📍 ${item['address_text'] ?? item['address'] ?? 'Nearby'}',
                          style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Row(
                        children: [
                          if (timeAgoStr.isNotEmpty) ...[
                            Icon(Icons.access_time, size: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                            const SizedBox(width: 3),
                            Text(
                              timeAgoStr,
                              style: TextStyle(fontSize: 11, color: Theme.of(context).colorScheme.onSurfaceVariant),
                            ),
                            const SizedBox(width: 8),
                          ],
                          if (item['severity_level'] != null) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.red.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                item['severity_level'].toString().toUpperCase(),
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.red),
                              ),
                            ),
                            const SizedBox(width: 8),
                          ],
                          Icon(Icons.thumb_up_outlined, size: 14, color: Theme.of(context).colorScheme.primary),
                          const SizedBox(width: 4),
                          Text(
                            '${item['upvotes_count'] ?? item['upvotes'] ?? 0}',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary),
                          ),
                        ],
                      ),
                    ],
                  )
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final points = _userProfile?['reputation_points'] ?? 10;
    final role = _userProfile?['role'] ?? 'citizen';
    final isAdmin = role == 'admin' || role == 'department_officer' || role == 'super_admin';

    return Scaffold(
      appBar: AppBar(
        elevation: 1,
        backgroundColor: Theme.of(context).colorScheme.surface,
        title: GestureDetector(
          onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen()));
          },
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.location_city, color: Theme.of(context).colorScheme.primary, size: 26),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'CivicFix',
                    style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: Theme.of(context).colorScheme.primary),
                  ),
                  Text(
                    '⭐ $points XP • Level ${(points / 50).floor() + 1}',
                    style: TextStyle(fontSize: 11, color: Theme.of(context).colorScheme.onSurfaceVariant, fontWeight: FontWeight.bold),
                  )
                ],
              ),
            ],
          ),
        ),
        actions: [
          if (isAdmin)
            IconButton.filledTonal(
              icon: const Icon(Icons.admin_panel_settings, color: Colors.indigo),
              tooltip: 'Admin / Worker Control',
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AdminDashboardScreen()),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.emoji_events, color: Colors.amber),
            tooltip: 'Leaderboard',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const LeaderboardScreen()),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.person_outline),
            tooltip: 'My Profile',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ProfileScreen()),
            ).then((_) => _loadUserProfile()),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign Out',
            onPressed: () => Supabase.instance.client.auth.signOut(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: Theme.of(context).colorScheme.primary,
          unselectedLabelColor: Theme.of(context).colorScheme.onSurfaceVariant,
          indicatorColor: Theme.of(context).colorScheme.primary,
          indicatorWeight: 3,
          tabs: const [
            Tab(icon: Icon(Icons.view_agenda_rounded), text: 'Feed (फोटो सूची)'),
            Tab(icon: Icon(Icons.map_rounded), text: 'Map (नक्शा)'),
            Tab(icon: Icon(Icons.person_pin), text: 'My Reports (मेरी)'),
          ],
        ),
      ),
      body: Column(
        children: [
          // HIGH VISIBILITY PICTORIAL CATEGORY BAR
          Container(
            color: Theme.of(context).colorScheme.surface,
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: Row(
                children: [
                  _visualFilterChip('all', 'All (सभी)', Icons.apps, Colors.blueGrey),
                  _visualFilterChip('pothole', 'Pothole (गड्ढा)', Icons.warning_amber_rounded, const Color(0xFFE65100)),
                  _visualFilterChip('street_light', 'Light (बत्ती)', Icons.lightbulb, const Color(0xFFF57F17)),
                  _visualFilterChip('garbage_dump', 'Garbage (कचरा)', Icons.delete_forever, const Color(0xFF2E7D32)),
                  _visualFilterChip('water_leakage', 'Water (पानी)', Icons.water_drop, const Color(0xFF0277BD)),
                  _visualFilterChip('manhole_open', 'Manhole (मैनहोल)', Icons.dangerous, const Color(0xFFC62828)),
                  _visualFilterChip('drainage_blocked', 'Drainage (नाली)', Icons.water_damage, const Color(0xFF455A64)),
                  _visualFilterChip('broken_sidewalk', 'Footpath (फुटपाथ)', Icons.directions_walk, const Color(0xFF6D4C41)),
                  _visualFilterChip('traffic_signal_broken', 'Signal (सिग्नल)', Icons.traffic, const Color(0xFFD84315)),
                  _visualFilterChip('stray_animals', 'Animals (पशु)', Icons.pets, const Color(0xFF8D6E63)),
                  _visualFilterChip('tree_fallen', 'Tree (पेड़)', Icons.park, const Color(0xFF388E3C)),
                  _visualFilterChip('illegal_construction', 'Illegal Build (अवैध)', Icons.fence, const Color(0xFF5D4037)),
                  _visualFilterChip('public_toilet_broken', 'Toilet (शौचालय)', Icons.wc, const Color(0xFF00897B)),
                  _visualFilterChip('road_sign_missing', 'Sign (साइन)', Icons.signpost, const Color(0xFF1565C0)),
                  _visualFilterChip('illegal_parking', 'Parking (पार्किंग)', Icons.no_transfer, const Color(0xFF6A1B9A)),
                ],
              ),
            ),
          ),

          // MAIN TABBED CONTENT
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // TAB 1: VISUAL CITIZEN FEED
                _buildFeedTab(),

                // TAB 2: SMART MAP RADAR
                _buildMapTab(),

                // TAB 3: MY REPORTS
                _buildMyReportsTab(),
              ],
            ),
          ),
        ],
      ),

      // BIG 1-CLICK PICTORIAL REPORT BUTTON
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Theme.of(context).colorScheme.onPrimary,
        elevation: 6,
        onPressed: () async {
          await Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportIssueScreen()));
          _loadUserProfile();
        },
        icon: const Icon(Icons.camera_alt_rounded, size: 28),
        label: const Text(
          'SNAP & REPORT (फोटो खींचे +15 XP)',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
        ),
      ),
    );
  }

  Widget _buildFeedTab() {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: _streamIssues(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        }
        final issues = snapshot.data ?? [];

        if (issues.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.check_circle_outline, size: 72, color: Colors.green.shade400),
                  const SizedBox(height: 12),
                  const Text(
                    'No active problems reported here!\nसभी काम ठीक है!',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            _loadUserProfile();
            setState(() {});
          },
          child: ListView.builder(
            itemCount: issues.length,
            padding: const EdgeInsets.all(12),
            itemBuilder: (context, index) => _buildIssueFeedCard(context, issues[index]),
          ),
        );
      },
    );
  }

  Widget _buildMapTab() {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: _streamIssues(),
      builder: (context, snapshot) {
        final issues = snapshot.data ?? [];
        final clusters = _clusterIssues(issues, _currentZoom);

        return Stack(
          children: [
            FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: _mapCenter,
                initialZoom: _currentZoom,
                onPositionChanged: (pos, hasGesture) {
                  if ((pos.zoom - _currentZoom).abs() > 0.4) {
                    setState(() {
                      _currentZoom = pos.zoom;
                      _mapCenter = pos.center;
                    });
                  }
                },
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.civicpulse.app',
                ),
                MarkerLayer(
                  markers: clusters.map((cluster) {
                    final isSingle = cluster.items.length == 1;

                    if (isSingle) {
                      final singleItem = cluster.items.first;
                      final color = _getCategoryColor(singleItem['category'] ?? '');
                      final icon = _getCategoryIcon(singleItem['category'] ?? '');

                      return Marker(
                        point: cluster.center,
                        width: 42,
                        height: 42,
                        child: GestureDetector(
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => IssueDetailScreen(issue: singleItem)),
                          ),
                          child: Container(
                            decoration: BoxDecoration(
                              color: color,
                              shape: BoxShape.circle,
                              border: Border.all(color: Theme.of(context).colorScheme.surface, width: 2.5),
                              boxShadow: const [BoxShadow(color: Colors.black38, blurRadius: 6, offset: Offset(0, 2))],
                            ),
                            child: Icon(icon, color: Colors.white, size: 22),
                          ),
                        ),
                      );
                    } else {
                      return Marker(
                        point: cluster.center,
                        width: 50,
                        height: 50,
                        child: GestureDetector(
                          onTap: () => _showClusterDetails(context, cluster),
                          child: Container(
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.primary,
                              shape: BoxShape.circle,
                              border: Border.all(color: Theme.of(context).colorScheme.surface, width: 3),
                              boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 8, offset: Offset(0, 3))],
                            ),
                            child: Center(
                              child: Text(
                                '${cluster.items.length}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    }
                  }).toList(),
                ),
              ],
            ),

            // Map Control Floating Tools
            Positioned(
              right: 14,
              top: 14,
              child: Column(
                children: [
                  _mapToolButton(Icons.add, () {
                    _mapController.move(_mapCenter, _currentZoom + 1.0);
                  }),
                  const SizedBox(height: 8),
                  _mapToolButton(Icons.remove, () {
                    _mapController.move(_mapCenter, _currentZoom - 1.0);
                  }),
                  const SizedBox(height: 8),
                  _mapToolButton(Icons.my_location, () {
                    _mapController.move(const LatLng(28.6139, 77.2090), 14.0);
                  }),
                ],
              ),
            ),

            // Map Legend Banner
            Positioned(
              bottom: 12,
              left: 12,
              right: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.92),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6)],
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _MapLegendItem(color: Color(0xFFE65100), label: 'Pothole'),
                    _MapLegendItem(color: Color(0xFFF57F17), label: 'Light'),
                    _MapLegendItem(color: Color(0xFF2E7D32), label: 'Garbage'),
                    _MapLegendItem(color: Color(0xFF0277BD), label: 'Water'),
                    _MapLegendItem(color: Color(0xFF0056B3), label: 'Cluster'),
                  ],
                ),
              ),
            )
          ],
        );
      },
    );
  }

  Widget _buildMyReportsTab() {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: _streamMyIssues(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        }
        final issues = snapshot.data ?? [];

        if (issues.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.report_off, size: 72, color: Theme.of(context).colorScheme.onSurfaceVariant),
                  const SizedBox(height: 12),
                  Text(
                    'You haven\'t reported any issues yet.\nTap the button below to report one!',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: Theme.of(context).colorScheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
          );
        }

        final resolved = issues.where((i) => i['status'] == 'resolved_by_worker' || i['status'] == 'community_verified').length;
        final pending = issues.length - resolved;

        return RefreshIndicator(
          onRefresh: () async {
            _loadUserProfile();
            setState(() {});
          },
          child: ListView(
            padding: const EdgeInsets.all(12),
            children: [
              // Summary bar
              Card(
                color: Theme.of(context).colorScheme.primaryContainer,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _myReportsStat('Total', issues.length, Icons.folder_open, Colors.blue),
                      _myReportsStat('Pending', pending, Icons.pending_actions, Colors.orange),
                      _myReportsStat('Resolved', resolved, Icons.task_alt, Colors.green),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),
              ...issues.map((item) => _buildIssueFeedCard(context, item)),
            ],
          ),
        );
      },
    );
  }

  Widget _myReportsStat(String label, int count, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 4),
        Text('$count', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: color)),
        Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onPrimaryContainer)),
      ],
    );
  }

  Widget _visualFilterChip(String key, String label, IconData icon, Color color) {
    final isSelected = _selectedFilter == key;
    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: FilterChip(
        selected: isSelected,
        avatar: Icon(icon, size: 18, color: isSelected ? Theme.of(context).colorScheme.onPrimary : color),
        label: Text(label),
        labelStyle: TextStyle(
          color: isSelected ? Theme.of(context).colorScheme.onPrimary : Theme.of(context).colorScheme.onSurface,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
        selectedColor: Theme.of(context).colorScheme.primary,
        backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        side: BorderSide(color: isSelected ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.outlineVariant),
        onSelected: (val) => setState(() => _selectedFilter = key),
      ),
    );
  }

  Widget _mapToolButton(IconData icon, VoidCallback onTap) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        shape: BoxShape.circle,
        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)],
      ),
      child: IconButton(
        icon: Icon(icon, color: Theme.of(context).colorScheme.primary),
        onPressed: onTap,
      ),
    );
  }
}

class MapCluster {
  LatLng center;
  List<Map<String, dynamic>> items;
  MapCluster({required this.center, required this.items});
}

class _MapLegendItem extends StatelessWidget {
  final Color color;
  final String label;

  const _MapLegendItem({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
