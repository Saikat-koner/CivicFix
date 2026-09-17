import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  String _getCitizenTier(int points) {
    if (points >= 500) return 'Diamond Guardian 💎';
    if (points >= 250) return 'Gold Warden 🥇';
    if (points >= 100) return 'Silver Inspector 🥈';
    if (points >= 50) return 'Bronze Scout 🥉';
    return 'Active Citizen 🛡️';
  }

  Color _getRankColor(int index) {
    switch (index) {
      case 0:
        return const Color(0xFFFFD700); // Gold
      case 1:
        return const Color(0xFFC0C0C0); // Silver
      case 2:
        return const Color(0xFFCD7F32); // Bronze
      default:
        return Colors.blueGrey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final currentUserId = Supabase.instance.client.auth.currentUser?.id;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Citizen Leaderboard (नागरिक सम्मान)', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 1,
      ),
      body: StreamBuilder<List<Map<String, dynamic>>>(
        stream: Supabase.instance.client
            .from('profiles')
            .stream(primaryKey: ['id'])
            .order('reputation_points', ascending: false)
            .limit(50),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Text('Error loading leaderboard: ${snapshot.error}'),
              ),
            );
          }
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.emoji_events_outlined, size: 64, color: theme.colorScheme.onSurfaceVariant),
                  const SizedBox(height: 12),
                  Text(
                    'No citizen points registered yet.\nReport and verify hazards to earn reputation!',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
                  ),
                ],
              ),
            );
          }
          final users = snapshot.data!;

          // Find current user's rank
          int? myRank;
          for (int i = 0; i < users.length; i++) {
            if (users[i]['id'] == currentUserId) {
              myRank = i;
              break;
            }
          }

          return Column(
            children: [
              // Current user rank banner
              if (myRank != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  color: theme.colorScheme.primaryContainer,
                  child: Row(
                    children: [
                      Icon(Icons.star, color: theme.colorScheme.primary, size: 22),
                      const SizedBox(width: 10),
                      Text(
                        'Your Rank: #${myRank + 1}',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 15,
                          color: theme.colorScheme.onPrimaryContainer,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '•  ${_getCitizenTier((users[myRank]['reputation_points'] as num?)?.toInt() ?? 0)}',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: theme.colorScheme.onPrimaryContainer,
                        ),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '${(users[myRank]['reputation_points'] as num?)?.toInt() ?? 0} XP',
                          style: TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 13,
                            color: theme.colorScheme.onPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              Expanded(
                child: RefreshIndicator(
                  onRefresh: () async {
                    // Force rebuild to re-subscribe to the stream
                    setState(() {});
                    // Small delay to allow stream re-subscription
                    await Future.delayed(const Duration(milliseconds: 500));
                  },
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: users.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final user = users[index];
                      final isTopThree = index < 3;
                      final rankColor = _getRankColor(index);
                      final points = (user['reputation_points'] is num) ? (user['reputation_points'] as num).toInt() : 0;
                      final tier = _getCitizenTier(points);
                      final isCurrentUser = user['id'] == currentUserId;

                      return Card(
                        elevation: isTopThree ? 2 : 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                          side: BorderSide(
                            color: isCurrentUser
                                ? theme.colorScheme.primary
                                : (isTopThree
                                    ? rankColor.withValues(alpha: 0.6)
                                    : theme.colorScheme.outlineVariant.withValues(alpha: 0.5)),
                            width: isCurrentUser ? 2 : (isTopThree ? 1.5 : 1),
                          ),
                        ),
                        color: isCurrentUser
                            ? (isDark ? theme.colorScheme.primary.withValues(alpha: 0.15) : theme.colorScheme.primaryContainer.withValues(alpha: 0.4))
                            : (isTopThree
                                ? (isDark ? rankColor.withValues(alpha: 0.12) : rankColor.withValues(alpha: 0.08))
                                : theme.colorScheme.surface),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                          leading: CircleAvatar(
                            radius: 20,
                            backgroundColor: isCurrentUser
                                ? theme.colorScheme.primary
                                : (isTopThree ? rankColor : theme.colorScheme.surfaceContainerHighest),
                            foregroundColor: isCurrentUser
                                ? theme.colorScheme.onPrimary
                                : (isTopThree ? Colors.black87 : theme.colorScheme.onSurface),
                            child: Text(
                              '#${index + 1}',
                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
                            ),
                          ),
                          title: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  '${user['full_name'] ?? user['username'] ?? 'Active Citizen'}${isCurrentUser ? ' (You)' : ''}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                    color: isCurrentUser ? theme.colorScheme.primary : null,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (index == 0) const Text(' 👑', style: TextStyle(fontSize: 16)),
                            ],
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 4.0),
                            child: Text(
                              tier,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.primaryContainer,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '$points XP',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                                color: theme.colorScheme.onPrimaryContainer,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
