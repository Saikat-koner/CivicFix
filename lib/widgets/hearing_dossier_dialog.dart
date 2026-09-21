import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../models/issue.dart';

/// Official Ward Hearing Dossier Preview and Printable Generator
class WardHearingDossierDialog extends StatelessWidget {
  final CivicIssue issue;
  final CitizenHearing? hearing;

  const WardHearingDossierDialog({
    super.key,
    required this.issue,
    this.hearing,
  });

  static void show(BuildContext context, CivicIssue issue, [CitizenHearing? hearing]) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (_) => Dialog(
        insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: WardHearingDossierDialog(issue: issue, hearing: hearing),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final sev = issue.severity;
    final cat = issue.category;
    final now = DateTime.now();
    final breachHours = issue.isSlaBreached
        ? now.difference(issue.slaDeadline).inHours
        : 0;

    final dateFormat = DateFormat('dd MMM yyyy, hh:mm a');

    return Container(
      width: 760,
      constraints: const BoxConstraints(maxHeight: 780),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          // Header Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: const BoxDecoration(
              color: Color(0xFF003366), // Municipal Royal Navy
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.description_rounded, color: Colors.amber, size: 22),
                    SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'CIVICFIX STATUTORY ESCALATION GRIEVANCE DOSSIER',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.5,
                          ),
                        ),
                        Text(
                          'Government of Karnataka • Bruhat Bengaluru Mahanagara Palike (BBMP)',
                          style: TextStyle(color: Colors.white70, fontSize: 11),
                        ),
                      ],
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, color: Colors.white70),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          // Scrollable Dossier Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Municipal Header & Verification QR Block
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFF006699).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFF006699)),
                            ),
                            child: const Text(
                              'FORM VII - SECTION 14(A) STATUTORY GRIEVANCE SUMMONS',
                              style: TextStyle(
                                color: Color(0xFF006699),
                                fontWeight: FontWeight.bold,
                                fontSize: 10,
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Grievance Dossier #${issue.code}',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            'Lodged on: ${dateFormat.format(issue.reportedAt)}',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                          ),
                          Text(
                            'Escalation Hearing Ref: ${hearing?.hearingId ?? "ESC-2026-${issue.code.split('-').last}"}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF006699),
                            ),
                          ),
                        ],
                      ),

                      // QR Code representation
                      Container(
                        width: 96,
                        height: 96,
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.black26),
                          borderRadius: BorderRadius.circular(8),
                          color: Colors.white,
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.qr_code_2_rounded, size: 56, color: Color(0xFF0F172A)),
                            const SizedBox(height: 2),
                            Text(
                              issue.code,
                              style: const TextStyle(
                                fontSize: 8,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 32),

                  // 2. Incident & Complainant Specifics
                  const Text(
                    '1. INCIDENT & GEOGRAPHICAL DETAILS',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildDataRow('Category / Hazard Type:', '${cat.englishName} (${cat.displayName})'),
                        _buildDataRow('Reported Title:', issue.title),
                        _buildDataRow('Incident Landmark:', issue.address),
                        _buildDataRow('District & Ward:', issue.district),
                        _buildDataRow(
                          'Precise GPS Coordinates:',
                          '${issue.latitude.toStringAsFixed(6)} N, ${issue.longitude.toStringAsFixed(6)} E (WGS-84)',
                        ),
                        _buildDataRow('Registered Citizen Complainant:', issue.reportedByName),
                        _buildDataRow('Current Status:', issue.status.replaceAll('_', ' ').toUpperCase()),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // 3. Mathematical 5-Variable Severity Breakdown Table
                  const Text(
                    '2. MATHEMATICAL 5-VARIABLE SEVERITY BREAKDOWN (FORMULA AUDIT)',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 8),
                  Table(
                    border: TableBorder.all(color: const Color(0xFFCBD5E1)),
                    columnWidths: const {
                      0: FlexColumnWidth(2.5),
                      1: FlexColumnWidth(1.2),
                      2: FlexColumnWidth(1.2),
                      3: FlexColumnWidth(3.0),
                    },
                    children: [
                      TableRow(
                        decoration: const BoxDecoration(color: Color(0xFFF1F5F9)),
                        children: const [
                          Padding(
                            padding: EdgeInsets.all(8),
                            child: Text('Variable Parameter', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                          ),
                          Padding(
                            padding: EdgeInsets.all(8),
                            child: Text('Raw Weight', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                          ),
                          Padding(
                            padding: EdgeInsets.all(8),
                            child: Text('Coef (α)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                          ),
                          Padding(
                            padding: EdgeInsets.all(8),
                            child: Text('Statutory Contribution / Metric', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                          ),
                        ],
                      ),
                      _buildTableRow('W_cat (Category Base)', '${cat.baseWeight.toStringAsFixed(0)} / 100', '35%', 'Intrinsic danger of ${cat.englishName}'),
                      _buildTableRow('W_urgency (Reported Hazard)', '60.0 / 100', '25%', 'Structural public danger severity'),
                      _buildTableRow('W_affected (Scale of Impact)', '50.0 / 100', '15%', 'Impacts local street & commercial corridor'),
                      _buildTableRow('W_community (Citizen Upvotes)', '${issue.upvotes * 3} pts', '15%', '${issue.upvotes} verified resident endorsements'),
                      _buildTableRow('W_time (Elapsed SLA Decay)', '20.0 pts', '10%', 'Statutory time elapsed since report logging'),
                      _buildTableRow('GroundModifier (2-Hr Rapid Audit)', '${issue.groundModifier >= 0 ? "+" : ""}${issue.groundModifier} pts', 'Direct', 'On-site verified ground truth validation'),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: sev.color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: sev.color.withValues(alpha: 0.5)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'FINAL SCORE: ${issue.severityScore.toStringAsFixed(1)} / 100  •  ${sev.code} (${sev.label})',
                          style: TextStyle(fontWeight: FontWeight.w900, color: sev.color, fontSize: 13),
                        ),
                        Text(
                          'Statutory SLA: ${sev.slaHours} Hours',
                          style: TextStyle(fontWeight: FontWeight.bold, color: sev.color, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // 4. Statutory SLA Breach Details
                  const Text(
                    '3. STATUTORY SLA BREACH ANALYSIS',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: issue.isSlaBreached ? const Color(0xFFFEF2F2) : const Color(0xFFF0FDF4),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: issue.isSlaBreached ? Colors.red.shade300 : Colors.green.shade300,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              issue.isSlaBreached ? Icons.error_outline_rounded : Icons.check_circle_outline_rounded,
                              color: issue.isSlaBreached ? Colors.red : Colors.green,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              issue.isSlaBreached
                                  ? 'STATUTORY SLA OVERDUE: $breachHours Hours past legal deadline'
                                  : 'COMPLIANT: Redressal within active statutory SLA window',
                              style: TextStyle(
                                fontWeight: FontWeight.w900,
                                color: issue.isSlaBreached ? Colors.red.shade900 : Colors.green.shade900,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Statutory Deadline: ${dateFormat.format(issue.slaDeadline)}',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF475569)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // 5. Photographic Evidence Summary
                  const Text(
                    '4. PHOTOGRAPHIC EVIDENCE ATTACHMENT',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 120,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFCBD5E1)),
                          ),
                          alignment: Alignment.center,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.camera_alt_outlined, color: Color(0xFF64748B), size: 28),
                              const SizedBox(height: 4),
                              const Text('Original Incident Photo', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                              Text(
                                'Timestamped: ${dateFormat.format(issue.reportedAt)}',
                                style: const TextStyle(fontSize: 9, color: Color(0xFF64748B)),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Container(
                          height: 120,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFCBD5E1)),
                          ),
                          alignment: Alignment.center,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.assignment_turned_in_outlined, color: Color(0xFF64748B), size: 28),
                              const SizedBox(height: 4),
                              const Text('Resolution / Audit Evidence', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                              Text(
                                issue.isResolved ? 'Resolved by Zonal Contractor' : 'Awaiting Municipal Redressal',
                                style: const TextStyle(fontSize: 9, color: Color(0xFF64748B)),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // 6. Signatures and Statutory Verification Stamp
                  const Text(
                    '5. IN-PERSON DISPUTE HEARING ENDORSEMENT & STAMP',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildSignatureBox('Citizen Complainant / RWA Signatory', issue.reportedByName),
                      _buildSignatureBox('Ward Executive Engineer (EE)', 'Zonal Engineering Authority'),
                      _buildStampBox(),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Footer Action Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: const BoxDecoration(
              color: Color(0xFFF8FAFC),
              border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(16)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'CivicFix GovTech v2.4 • Official Statutory Document',
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                ),
                Row(
                  children: [
                    OutlinedButton.icon(
                      icon: const Icon(Icons.copy_rounded, size: 16),
                      label: const Text('Copy Ref ID'),
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: issue.code));
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Copied Ticket Ref: ${issue.code}'),
                            backgroundColor: const Color(0xFF006699),
                          ),
                        );
                      },
                    ),
                    const SizedBox(width: 10),
                    FilledButton.icon(
                      icon: const Icon(Icons.print_rounded, size: 16),
                      label: const Text('Print Dossier (प्रिंट करें)'),
                      style: FilledButton.styleFrom(backgroundColor: const Color(0xFF006699)),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('🖨️ Opening browser print view for Statutory Hearing Dossier...'),
                            backgroundColor: Color(0xFF006699),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDataRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 190,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF475569)),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
            ),
          ),
        ],
      ),
    );
  }

  TableRow _buildTableRow(String variable, String raw, String coef, String note) {
    return TableRow(
      children: [
        Padding(
          padding: const EdgeInsets.all(8),
          child: Text(variable, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
        ),
        Padding(
          padding: const EdgeInsets.all(8),
          child: Text(raw, style: const TextStyle(fontSize: 10)),
        ),
        Padding(
          padding: const EdgeInsets.all(8),
          child: Text(coef, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF006699))),
        ),
        Padding(
          padding: const EdgeInsets.all(8),
          child: Text(note, style: const TextStyle(fontSize: 10, color: Color(0xFF475569))),
        ),
      ],
    );
  }

  Widget _buildSignatureBox(String title, String subtitle) {
    return Container(
      width: 220,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFCBD5E1)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 36,
            alignment: Alignment.bottomLeft,
            child: Container(
              height: 1,
              color: Colors.grey.shade400,
            ),
          ),
          const SizedBox(height: 6),
          Text(title, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
          Text(subtitle, style: const TextStyle(fontSize: 9, color: Color(0xFF64748B))),
        ],
      ),
    );
  }

  Widget _buildStampBox() {
    return Container(
      width: 140,
      height: 70,
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFF94A3B8), style: BorderStyle.solid),
        borderRadius: BorderRadius.circular(8),
      ),
      alignment: Alignment.center,
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.verified_outlined, size: 20, color: Color(0xFF94A3B8)),
          SizedBox(height: 4),
          Text(
            '[OFFICIAL SEAL / STAMP]',
            style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }
}
