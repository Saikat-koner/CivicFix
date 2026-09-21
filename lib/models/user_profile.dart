import 'package:flutter/material.dart';

/// 4 Citizen Tiers
enum CitizenTier {
  bronzeScout(
    title: 'Bronze Scout',
    hindiTitle: 'कांस्य स्काउट',
    minXp: 0,
    maxXp: 999,
    badgeColor: Color(0xFFB45309), // Bronze
    icon: Icons.shield_outlined,
    privilege: 'Standard Reporting & Community Upvotes',
  ),
  silverInspector(
    title: 'Silver Inspector',
    hindiTitle: 'रजत निरीक्षक',
    minXp: 1000,
    maxXp: 2499,
    badgeColor: Color(0xFF64748B), // Silver
    icon: Icons.verified_user_outlined,
    privilege: 'Priority Ward Review & 1.2x Civic Credits',
  ),
  goldWarden(
    title: 'Gold Warden',
    hindiTitle: 'स्वर्ण वार्डन',
    minXp: 2500,
    maxXp: 4999,
    badgeColor: Color(0xFFEAB308), // Gold
    icon: Icons.military_tech_rounded,
    privilege: 'Direct Dispatch Verification & Expedited Hearings',
  ),
  diamondGuardian(
    title: 'Diamond Guardian',
    hindiTitle: 'हीरा संरक्षक',
    minXp: 5000,
    maxXp: 99999,
    badgeColor: Color(0xFF0EA5E9), // Diamond Cyan-Blue
    icon: Icons.workspace_premium_rounded,
    privilege: 'Municipal Ombudsman Liaison & Statutory Hearing Privileges',
  );

  final String title;
  final String hindiTitle;
  final int minXp;
  final int maxXp;
  final Color badgeColor;
  final IconData icon;
  final String privilege;

  const CitizenTier({
    required this.title,
    required this.hindiTitle,
    required this.minXp,
    required this.maxXp,
    required this.badgeColor,
    required this.icon,
    required this.privilege,
  });

  static CitizenTier fromXp(int xp) {
    if (xp >= 5000) return CitizenTier.diamondGuardian;
    if (xp >= 2500) return CitizenTier.goldWarden;
    if (xp >= 1000) return CitizenTier.silverInspector;
    return CitizenTier.bronzeScout;
  }
}

/// Citizen Profile with Impact Metrics & Gamification
class CitizenProfile {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String wardName;
  final int totalXp;
  final int reportsSubmitted;
  final int reportsResolved;
  final int civicCredits;
  final int communityUpvotes;
  final int wardRank;
  final double verificationAccuracy; // e.g. 98.4%
  final DateTime joinedDate;

  const CitizenProfile({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.wardName,
    required this.totalXp,
    required this.reportsSubmitted,
    required this.reportsResolved,
    required this.civicCredits,
    required this.communityUpvotes,
    required this.wardRank,
    required this.verificationAccuracy,
    required this.joinedDate,
  });

  CitizenTier get tier => CitizenTier.fromXp(totalXp);

  double get progressToNextTier {
    if (tier == CitizenTier.diamondGuardian) return 1.0;
    final range = tier.maxXp - tier.minXp;
    final current = totalXp - tier.minXp;
    return (current / range).clamp(0.0, 1.0);
  }

  int get xpNeededForNextTier {
    if (tier == CitizenTier.diamondGuardian) return 0;
    return (tier.maxXp + 1) - totalXp;
  }
}
