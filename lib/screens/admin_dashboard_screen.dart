import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'issue_detail_screen.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  String _searchQuery = '';
  String _selectedStatusFilter = 'all';
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _showStatusConfirmDialog(Map<String, dynamic> issue, String newStatus) async {
    final theme = Theme.of(context);
    final statusDisplayName = newStatus.replaceAll('_', ' ').toUpperCase();
    final TextEditingController notesController = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Confirm Status Update'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Are you sure you want to change ticket status to:'),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                statusDisplayName,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onPrimaryContainer,
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: notesController,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: 'Officer / Team Remarks (optional)',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: theme.colorScheme.primary,
              foregroundColor: theme.colorScheme.onPrimary,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirm Update'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _updateStatus(issue['id'], newStatus, notesController.text.trim());
    }
  }

  Future<void> _updateStatus(String issueId, String newStatus, String remarks) async {
    try {
      final updateData = {
        'status': newStatus,
        'updated_at': DateTime.now().toIso8601String(),
      };
      if (remarks.isNotEmpty) {
        updateData['admin_notes'] = remarks;
      }

      await Supabase.instance.client
          .from('issues')
          .update(updateData)
          .eq('id', issueId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.green,
            content: Text('Status successfully updated to ${newStatus.replaceAll('_', ' ')}'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red,
            content: Text('Failed to update status: $e'),
          ),
        );
      }
    }
  }

  Future<void> _updateAppointmentStatus(String appointmentId, String newStatus) async {
    try {
      await Supabase.instance.client
          .from('officer_appointments')
          .update({'status': newStatus})
          .eq('id', appointmentId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Appointment marked as $newStatus')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating appointment: $e')),
        );
      }
    }
  }

  Map<String, dynamic> _getSeverityInfo(Map<String, dynamic> issue) {
    final level = issue['severity_level']?.toString().toUpperCase() ?? 'S3';
    switch (level) {
      case 'S5':
        return {'label': 'S5 Critical', 'color': Colors.red.shade700};
      case 'S4':
        return {'label': 'S4 High', 'color': Colors.deepOrange.shade600};
      case 'S3':
        return {'label': 'S3 Moderate', 'color': Colors.amber.shade800};
      case 'S2':
        return {'label': 'S2 Low', 'color': Colors.blue.shade600};
      default:
        return {'label': 'S1 Minimal', 'color': Colors.teal.shade600};
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin & Officer Control Room', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
      ),
      body: StreamBuilder<List<Map<String, dynamic>>>(
        stream: Supabase.instance.client
            .from('issues')
            .stream(primaryKey: ['id'])
            .order('created_at', ascending: false),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error loading issues: ${snapshot.error}'));
          }

          final allIssues = snapshot.data ?? [];
          final int total = allIssues.length;
          final int resolved = allIssues
              .where((i) => i['status'] == 'resolved_by_worker' || i['status'] == 'community_verified')
              .length;
          final int inProgress = allIssues.where((i) => i['status'] == 'in_progress').length;
          final int pending = total - resolved;

          // Filter by search query and status filter
          final filteredIssues = allIssues.where((issue) {
            final title = (issue['title'] ?? '').toString().toLowerCase();
            final desc = (issue['description'] ?? '').toString().toLowerCase();
            final cat = (issue['category'] ?? '').toString().toLowerCase();
            final status = (issue['status'] ?? '').toString().toLowerCase();
            final address = (issue['address'] ?? issue['address_text'] ?? '').toString().toLowerCase();

            final matchesQuery = _searchQuery.isEmpty ||
                title.contains(_searchQuery) ||
                desc.contains(_searchQuery) ||
                cat.contains(_searchQuery) ||
                address.contains(_searchQuery);

            final matchesStatus = _selectedStatusFilter == 'all' ||
                (_selectedStatusFilter == 'pending' && (status == 'reported' || status == 'open')) ||
                (_selectedStatusFilter == 'in_progress' && status == 'in_progress') ||
                (_selectedStatusFilter == 'resolved' && (status == 'resolved_by_worker' || status == 'community_verified'));

            return matchesQuery && matchesStatus;
          }).toList();

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Real-time KPI Analytics Cards
                Row(
                  children: [
                    _kpiCard('Total Reported', '$total', Colors.blue, Icons.folder_open),
                    const SizedBox(width: 8),
                    _kpiCard('In Progress', '$inProgress', Colors.amber.shade800, Icons.engineering),
                    const SizedBox(width: 8),
                    _kpiCard('Pending', '$pending', Colors.deepOrange, Icons.pending_actions),
                    const SizedBox(width: 8),
                    _kpiCard('Resolved', '$resolved', Colors.green, Icons.task_alt),
                  ],
                ),
                const SizedBox(height: 20),

                // SLA Breached Hearings Section
                StreamBuilder<List<Map<String, dynamic>>>(
                  stream: Supabase.instance.client
                      .from('officer_appointments')
                      .stream(primaryKey: ['id']),
                  builder: (context, appSnapshot) {
                    final appointments = appSnapshot.data ?? [];
                    if (appointments.isEmpty) return const SizedBox.shrink();

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.gavel, color: theme.colorScheme.error, size: 22),
                            const SizedBox(width: 8),
                            const Text(
                              'Citizen Hearing Requests (SLA Escalations)',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: appointments.length,
                          itemBuilder: (ctx, idx) {
                            final app = appointments[idx];
                            final isPendingHearing = app['status'] != 'completed';
                            final slotTime = app['slot_time'] != null
                                ? app['slot_time'].toString().substring(0, 16)
                                : 'Pending';
                            return Card(
                              color: isDark ? Colors.red.shade900.withValues(alpha: 0.25) : Colors.red.shade50,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                                side: BorderSide(color: Colors.red.withValues(alpha: 0.3)),
                              ),
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                leading: const Icon(Icons.warning_amber_rounded, color: Colors.red),
                                title: Text('Hearing Slot: $slotTime', style: const TextStyle(fontWeight: FontWeight.bold)),
                                subtitle: Text('Reason: ${app['escalation_reason'] ?? 'SLA Breach'}'),
                                trailing: isPendingHearing
                                    ? OutlinedButton(
                                        style: OutlinedButton.styleFrom(
                                          foregroundColor: Colors.green,
                                          side: const BorderSide(color: Colors.green),
                                        ),
                                        onPressed: () => _updateAppointmentStatus(app['id'], 'completed'),
                                        child: const Text('Resolve Hearing'),
                                      )
                                    : Chip(
                                        label: const Text('Completed'),
                                        color: WidgetStatePropertyAll(Colors.green.withValues(alpha: 0.15)),
                                      ),
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 20),
                      ],
                    );
                  },
                ),

                // Search & Filtering Bar
                const Text('Manage Municipal Tickets', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                TextField(
                  controller: _searchController,
                  onChanged: (val) {
                    setState(() => _searchQuery = val.trim().toLowerCase());
                  },
                  decoration: InputDecoration(
                    hintText: 'Search by issue, category, or area...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                ),
                const SizedBox(height: 10),

                // Status Filter Chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _statusFilterChip('all', 'All (${allIssues.length})'),
                      const SizedBox(width: 8),
                      _statusFilterChip('pending', 'Action Required ($pending)'),
                      const SizedBox(width: 8),
                      _statusFilterChip('in_progress', 'In Progress ($inProgress)'),
                      const SizedBox(width: 8),
                      _statusFilterChip('resolved', 'Resolved ($resolved)'),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Issues List
                if (filteredIssues.isEmpty)
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 36.0),
                      child: Column(
                        children: [
                          Icon(Icons.inbox, size: 48, color: theme.colorScheme.onSurfaceVariant),
                          const SizedBox(height: 8),
                          Text(
                            'No matching tickets found.',
                            style: TextStyle(color: theme.colorScheme.onSurfaceVariant, fontSize: 15),
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: filteredIssues.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (ctx, idx) {
                      final item = filteredIssues[idx];
                      final severity = _getSeverityInfo(item);
                      final status = item['status']?.toString() ?? 'reported';
                      final isResolved = status == 'resolved_by_worker' || status == 'community_verified';

                      // Timeago
                      String timeAgoStr = '';
                      if (item['created_at'] != null) {
                        try {
                          final dt = DateTime.parse(item['created_at'].toString());
                          timeAgoStr = timeago.format(dt);
                        } catch (_) {}
                      }

                      return Card(
                        elevation: 1,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                          side: BorderSide(
                            color: isResolved
                                ? Colors.green.withValues(alpha: 0.3)
                                : theme.colorScheme.outlineVariant,
                          ),
                        ),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(14),
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => IssueDetailScreen(issue: item)),
                            );
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        item['title'] ?? 'Civic Hazard',
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: (severity['color'] as Color).withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        severity['label'] as String,
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          color: severity['color'] as Color,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                if (item['description'] != null && item['description'].toString().isNotEmpty)
                                  Text(
                                    item['description'],
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(fontSize: 13, color: theme.colorScheme.onSurfaceVariant),
                                  ),
                                const SizedBox(height: 8),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 4,
                                  children: [
                                    Chip(
                                      visualDensity: VisualDensity.compact,
                                      label: Text(item['category']?.toString().toUpperCase() ?? 'GENERAL', style: const TextStyle(fontSize: 11)),
                                    ),
                                    Chip(
                                      visualDensity: VisualDensity.compact,
                                      label: Text(
                                        status.replaceAll('_', ' ').toUpperCase(),
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          color: isResolved ? Colors.green : Colors.amber.shade900,
                                        ),
                                      ),
                                      color: WidgetStatePropertyAll(
                                        isResolved
                                            ? Colors.green.withValues(alpha: 0.12)
                                            : Colors.amber.withValues(alpha: 0.15),
                                      ),
                                    ),
                                    if (timeAgoStr.isNotEmpty)
                                      Chip(
                                        visualDensity: VisualDensity.compact,
                                        avatar: const Icon(Icons.access_time, size: 14),
                                        label: Text(timeAgoStr, style: const TextStyle(fontSize: 11)),
                                      ),
                                    if (item['address'] != null || item['address_text'] != null)
                                      Chip(
                                        visualDensity: VisualDensity.compact,
                                        avatar: const Icon(Icons.location_on, size: 14, color: Colors.red),
                                        label: Text(
                                          (item['address_text'] ?? item['address']).toString(),
                                          style: const TextStyle(fontSize: 11),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                  ],
                                ),
                                const Divider(height: 20),
                                // Fast Action Buttons
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    if (status != 'in_progress' && !isResolved)
                                      OutlinedButton.icon(
                                        icon: const Icon(Icons.engineering, size: 16),
                                        label: const Text('Assign Field Team'),
                                        onPressed: () => _showStatusConfirmDialog(item, 'in_progress'),
                                      ),
                                    if (!isResolved)
                                      ElevatedButton.icon(
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: Colors.green,
                                          foregroundColor: Colors.white,
                                        ),
                                        icon: const Icon(Icons.check_circle_outline, size: 16),
                                        label: const Text('Mark Resolved'),
                                        onPressed: () => _showStatusConfirmDialog(item, 'resolved_by_worker'),
                                      ),
                                    if (isResolved)
                                      OutlinedButton.icon(
                                        icon: const Icon(Icons.replay, size: 16),
                                        label: const Text('Reopen Ticket'),
                                        onPressed: () => _showStatusConfirmDialog(item, 'reported'),
                                      ),
                                  ],
                                )
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _statusFilterChip(String key, String label) {
    final isSelected = _selectedStatusFilter == key;
    final theme = Theme.of(context);

    return FilterChip(
      selected: isSelected,
      label: Text(label),
      onSelected: (_) {
        setState(() => _selectedStatusFilter = key);
      },
      selectedColor: theme.colorScheme.primaryContainer,
      labelStyle: TextStyle(
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        color: isSelected ? theme.colorScheme.onPrimaryContainer : null,
      ),
    );
  }

  Widget _kpiCard(String title, String count, Color color, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.25)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 6),
            Text(count, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: color)),
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 10,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
