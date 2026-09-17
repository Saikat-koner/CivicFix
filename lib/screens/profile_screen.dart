import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _profile;
  bool _loading = true;
  int _totalReported = 0;
  int _totalResolved = 0;
  int _totalUpvotes = 0;
  int _totalGroundSurveys = 0;

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    setState(() => _loading = true);
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }

    try {
      // 1. Fetch Profile
      final profileRes = await Supabase.instance.client
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

      // 2. Fetch User's Issues Stats
      final issuesRes = await Supabase.instance.client
          .from('issues')
          .select('id, status, upvotes_count, has_ground_survey, ground_survey')
          .eq('user_id', user.id);

      int resolved = 0;
      int upvotes = 0;
      int groundSurveys = 0;
      final issuesList = issuesRes as List<dynamic>? ?? [];
      for (var issue in issuesList) {
        final status = issue['status']?.toString();
        if (status == 'resolved_by_worker' || status == 'community_verified') {
          resolved++;
        }
        upvotes += (issue['upvotes_count'] as num?)?.toInt() ?? 0;
        if (issue['has_ground_survey'] == true || issue['ground_survey'] != null) {
          groundSurveys++;
        }
      }

      if (mounted) {
        setState(() {
          _profile = profileRes;
          _totalReported = issuesList.length;
          _totalResolved = resolved;
          _totalUpvotes = upvotes;
          _totalGroundSurveys = groundSurveys;
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading profile: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  String _getCitizenTier(int points) {
    if (points >= 500) return 'Diamond Guardian 💎';
    if (points >= 250) return 'Gold Warden 🥇';
    if (points >= 100) return 'Silver Inspector 🥈';
    if (points >= 50) return 'Bronze Scout 🥉';
    return 'Active Citizen 🛡️';
  }

  Future<void> _showEditProfileDialog() async {
    final theme = Theme.of(context);
    final nameCtrl = TextEditingController(text: _profile?['full_name'] ?? '');
    final phoneCtrl = TextEditingController(text: _profile?['phone_number'] ?? '');

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Edit Citizen Profile'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: InputDecoration(
                labelText: 'Full Name (पूरा नाम)',
                prefixIcon: const Icon(Icons.person_outline),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: 'Phone Number (फ़ोन नंबर)',
                prefixIcon: const Icon(Icons.phone_outlined),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: theme.colorScheme.primary,
              foregroundColor: theme.colorScheme.onPrimary,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Save Changes'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;

      try {
        await Supabase.instance.client.from('profiles').update({
          'full_name': nameCtrl.text.trim(),
          'phone_number': phoneCtrl.text.trim(),
          'updated_at': DateTime.now().toIso8601String(),
        }).eq('id', user.id);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(backgroundColor: Colors.green, content: Text('Profile updated successfully!')),
          );
        }
        _loadProfileData();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(backgroundColor: Colors.red, content: Text('Failed to update: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = Supabase.instance.client.auth.currentUser;
    final email = user?.email ?? 'No email';
    final name = _profile?['full_name'] ?? 'Citizen';
    final points = (_profile?['reputation_points'] as num?)?.toInt() ?? 10;
    final role = _profile?['role']?.toString().toUpperCase() ?? 'CITIZEN';
    final tier = _getCitizenTier(points);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Citizen Profile (नागरिक प्रोफ़ाइल)', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 1,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Edit Profile',
            onPressed: _showEditProfileDialog,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadProfileData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    // Profile Header Card
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          children: [
                            CircleAvatar(
                              radius: 40,
                              backgroundColor: theme.colorScheme.primary,
                              foregroundColor: theme.colorScheme.onPrimary,
                              child: Text(
                                name.isNotEmpty ? name[0].toUpperCase() : 'C',
                                style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text(email, style: TextStyle(color: theme.colorScheme.onSurfaceVariant, fontSize: 13)),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              children: [
                                Chip(
                                  avatar: const Icon(Icons.shield, size: 16, color: Colors.blue),
                                  label: Text(tier, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                  backgroundColor: theme.colorScheme.primaryContainer.withValues(alpha: 0.5),
                                ),
                                Chip(
                                  avatar: const Icon(Icons.badge, size: 16),
                                  label: Text(role, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Citizen Impact Statistics Grid
                    Row(
                      children: [
                        _statCard('Total Reported', '$_totalReported', Icons.campaign, Colors.blue),
                        const SizedBox(width: 8),
                        _statCard('Resolved', '$_totalResolved', Icons.task_alt, Colors.green),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _statCard('⚡ Rapid Audits', '$_totalGroundSurveys', Icons.bolt, Colors.amber.shade900),
                        const SizedBox(width: 8),
                        _statCard('Citizen XP', '$points', Icons.star, Colors.amber.shade800),
                        const SizedBox(width: 8),
                        _statCard('Upvotes', '$_totalUpvotes', Icons.thumb_up, Colors.deepPurple),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Badges & Achievements Section
                    Card(
                      elevation: 1,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.military_tech, color: Colors.amber, size: 24),
                                SizedBox(width: 8),
                                Text('Civic Badges & Badging', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const SizedBox(height: 12),
                            _badgeRow(
                              'Rapid Triage Surveyor ⚡',
                              'Conducted rapid on-site hazard survey within 2 hours (+50 XP)',
                              _totalGroundSurveys >= 1 || points >= 60,
                              Icons.bolt,
                              Colors.amber.shade900,
                            ),
                            const Divider(height: 16),
                            _badgeRow(
                              'Ground Truth Auditor 🛡️',
                              'Conducted 3+ on-site ground hazard audits with live modifiers',
                              _totalGroundSurveys >= 3,
                              Icons.verified_user,
                              Colors.teal,
                            ),
                            const Divider(height: 16),
                            _badgeRow(
                              'First Responder',
                              'Reported your first civic hazard',
                              _totalReported >= 1,
                              Icons.flag,
                              Colors.orange,
                            ),
                            const Divider(height: 16),
                            _badgeRow(
                              'Eagle Eye Citizen',
                              'Reported 5 or more civic issues',
                              _totalReported >= 5,
                              Icons.visibility,
                              Colors.blue,
                            ),
                            const Divider(height: 16),
                            _badgeRow(
                              'Community Champion',
                              'Earned 100+ reputation points',
                              points >= 100,
                              Icons.emoji_events,
                              Colors.amber,
                            ),
                            const Divider(height: 16),
                            _badgeRow(
                              'Resolution Hero',
                              '3+ of your reported issues resolved',
                              _totalResolved >= 3,
                              Icons.verified,
                              Colors.green,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Sign Out Button
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: const Icon(Icons.logout),
                      label: const Text('Sign Out (लॉग आउट)', style: TextStyle(fontWeight: FontWeight.bold)),
                      onPressed: () async {
                        final confirm = await showDialog<bool>(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            title: const Text('Sign Out'),
                            content: const Text('Are you sure you want to sign out of CivicFix?'),
                            actions: [
                              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
                                onPressed: () => Navigator.pop(ctx, true),
                                child: const Text('Sign Out'),
                              ),
                            ],
                          ),
                        );
                        if (confirm == true) {
                          if (context.mounted) {
                            Navigator.of(context).pop();
                          }
                          await Supabase.instance.client.auth.signOut();
                        }
                      },
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _statCard(String title, String count, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.25)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 26),
            const SizedBox(height: 8),
            Text(count, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: color)),
            const SizedBox(height: 2),
            Text(
              title,
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }

  Widget _badgeRow(String title, String subtitle, bool unlocked, IconData icon, Color color) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: unlocked ? color.withValues(alpha: 0.15) : Colors.grey.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: unlocked ? color : Colors.grey, size: 24),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  color: unlocked ? null : Colors.grey,
                ),
              ),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 12,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        Icon(
          unlocked ? Icons.check_circle : Icons.lock_outline,
          color: unlocked ? Colors.green : Colors.grey,
          size: 20,
        ),
      ],
    );
  }
}
