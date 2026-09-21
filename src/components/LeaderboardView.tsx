import React, { useState } from 'react';
import { Contributor, CivicQuest, RedeemedPerkVoucher } from '../types';
import {
  Trophy,
  CheckCircle2,
  Eye,
  Award,
  Camera,
  CheckSquare,
  Gift,
  Zap,
  Sparkles,
  TrendingUp,
  Target,
  Clock,
  ChevronRight,
  ShieldCheck,
  Flame,
  Check,
  QrCode,
  FileCheck2,
  Ticket,
  Coins,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VoucherModal } from './VoucherModal';
import { CivicCertificateModal } from './CivicCertificateModal';

interface LeaderboardViewProps {
  contributors: Contributor[];
  currentUser: Contributor;
  quests: CivicQuest[];
  onRedeemPerk?: (perkName: string, cost: number) => void;
  onClaimQuestReward?: (questId: string, reward: number) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  contributors,
  currentUser,
  quests,
  onRedeemPerk,
  onClaimQuestReward,
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [redeemedPerks, setRedeemedPerks] = useState<string[]>([]);
  const [activeVoucherForModal, setActiveVoucherForModal] = useState<RedeemedPerkVoucher | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [userVouchers, setUserVouchers] = useState<RedeemedPerkVoucher[]>([]);
  const [insufficientCreditsNotice, setInsufficientCreditsNotice] = useState<{ needed: number; current: number; perkName: string } | null>(null);

  const handleClaim = (perkItem: { id: string; name: string; cost: number; badge?: string; desc: string }) => {
    if (currentUser.civicCredits < perkItem.cost) {
      setInsufficientCreditsNotice({
        needed: perkItem.cost,
        current: currentUser.civicCredits,
        perkName: perkItem.name,
      });
      return;
    }
    if (onRedeemPerk) {
      onRedeemPerk(perkItem.name, perkItem.cost);
    }
    setRedeemedPerks((prev) => [...prev, perkItem.name]);

    const newVoucher: RedeemedPerkVoucher = {
      id: `vouch-${Date.now()}`,
      perkName: perkItem.name,
      costCC: perkItem.cost,
      voucherCode: `CF-${perkItem.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10 + Math.random() * 89)}`,
      redeemedAt: 'Just now',
      validUntil: 'Valid for 30 Days',
      qrData: `civicfix:perk:${perkItem.id}:${Date.now()}`,
      status: 'active',
      category: perkItem.badge || 'Civic Pass',
      instructions: `Present this QR pass or serial code at any municipal transit kiosk, facility gate, or participating merchant partner.`,
      recipientName: currentUser.name
    };

    setUserVouchers((prev) => [newVoucher, ...prev]);
    setActiveVoucherForModal(newVoucher);

    confetti({
      particleCount: 80,
      spread: 60,
      colors: ['#0050c8', '#10B981', '#f88400'],
    });
  };

  const handleQuestClaim = (quest: CivicQuest) => {
    if (onClaimQuestReward && !quest.claimed && quest.current >= quest.target) {
      onClaimQuestReward(quest.id, quest.rewardCC);
      confetti({
        particleCount: 90,
        spread: 70,
        colors: ['#1d68f2', '#10B981', '#ffdcc4'],
      });
    }
  };

  const filteredContributors = contributors.filter((_c) => {
    if (selectedDistrict === 'all') return true;
    return true;
  });

  return (
    <main
      id="leaderboard-view-container"
      className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-28 space-y-8 animate-in fade-in duration-200"
    >
      {/* GOVERNOR'S AWARD COUNTDOWN BANNER (Screen 15) */}
      <section
        id="governors-award-countdown-card"
        className="bg-gradient-to-r from-[#0b1320] via-[#121c28] to-[#1e293b] text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-white/10 relative overflow-hidden"
      >
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center flex-shrink-0 shadow-md">
              <Trophy className="w-6 h-6 text-[#0b1320]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="bg-amber-400 text-[#0b1320] text-[10px] font-black uppercase px-2 py-0.5 rounded">
                  Annual Municipal Distinction
                </span>
                <span className="text-xs font-bold text-amber-300">
                  Governor's Medal of Civic Excellence
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                2026 City Infrastructure Vanguard Honors
              </h2>
              <p className="text-xs text-white/70 mt-0.5 max-w-xl">
                Top 3 neighborhood contributors receive the official Governor's Medal, a $2,500 civic project grant, and honorary seat on the Municipal Infrastructure Advisory Board.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15">
              <div className="text-center">
                <span className="text-lg sm:text-xl font-black text-amber-300 font-mono block">14</span>
                <span className="text-[9px] uppercase tracking-wider text-white/60 font-bold">Days</span>
              </div>
              <span className="text-white/40 font-bold text-lg">:</span>
              <div className="text-center">
                <span className="text-lg sm:text-xl font-black text-amber-300 font-mono block">08</span>
                <span className="text-[9px] uppercase tracking-wider text-white/60 font-bold">Hours</span>
              </div>
              <span className="text-white/40 font-bold text-lg">:</span>
              <div className="text-center">
                <span className="text-lg sm:text-xl font-black text-amber-300 font-mono block">32</span>
                <span className="text-[9px] uppercase tracking-wider text-white/60 font-bold">Mins</span>
              </div>
            </div>

            <button
              onClick={() => setShowCertificateModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#0b1320] font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Official Merit Certificate</span>
            </button>
          </div>
        </div>
      </section>

      {/* POINT BREAKDOWN RULES STRIP */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#c2c6d7] rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EDF4FF] text-[#0050c8] flex items-center justify-center font-black text-xs shadow-xs">
            +50
          </div>
          <div>
            <span className="text-xs font-bold text-[#121c28] block">Verified Incident Report</span>
            <span className="text-[10px] text-[#737686]">Awarded on AI computer vision triage</span>
          </div>
        </div>

        <div className="bg-white border border-[#c2c6d7] rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#dcfce7] text-[#15803d] flex items-center justify-center font-black text-xs shadow-xs">
            +100
          </div>
          <div>
            <span className="text-xs font-bold text-[#121c28] block">Citizen Fix Verification</span>
            <span className="text-[10px] text-[#737686]">Confirmed ground resolution check</span>
          </div>
        </div>

        <div className="bg-white border border-[#c2c6d7] rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-xs shadow-xs">
            +10
          </div>
          <div>
            <span className="text-xs font-bold text-[#121c28] block">Community Upvote / Merge</span>
            <span className="text-[10px] text-[#737686]">Prioritizing neighborhood work orders</span>
          </div>
        </div>
      </section>

      {/* User Stats Bento */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Credit Display (8 cols) */}
        <div
          id="civic-credits-summary-card"
          className="md:col-span-8 bg-white border border-[#c2c6d7] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-52 h-52 bg-[#EDF4FF] rounded-full blur-3xl opacity-70 -mr-10 -mt-10 pointer-events-none" />

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-[#1d68f2]" />
              <h2 className="text-xl md:text-2xl font-extrabold text-[#121c28] tracking-tight">
                Your Civic Impact Dashboard
              </h2>
            </div>
            <p className="text-xs md:text-sm text-[#424655]">
              Earn credits for verified reports, ground audits, and community verification to support your neighborhood.
            </p>
          </div>

          <div className="mt-8 flex items-end gap-4 flex-wrap">
            <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#0050c8] tracking-tight font-mono">
              {currentUser.civicCredits.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-[#0050c8] bg-[#EDF4FF] border border-[#dae2ff] px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-2">
              Civic Credits (CC)
            </span>
          </div>
        </div>

        {/* Badges Box (4 cols) */}
        <div
          id="active-badges-card"
          className="md:col-span-4 bg-white border border-[#c2c6d7] rounded-2xl p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 className="text-xs font-bold text-[#737686] uppercase tracking-widest mb-4">
              Active Badges & Tier
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 bg-[#eef4ff] p-3 rounded-xl border border-[#dae2ff]">
                <div className="w-8 h-8 rounded-full bg-[#1d68f2] text-white flex items-center justify-center shadow-xs">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs md:text-sm font-bold text-[#121c28] block">Eagle Eye</span>
                  <span className="text-[10px] text-[#424655]">50+ accurate issue reports</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#eef4ff] p-3 rounded-xl border border-[#dae2ff]">
                <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-xs">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs md:text-sm font-bold text-[#121c28] block">Community Hero</span>
                  <span className="text-[10px] text-[#424655]">Top 5% downtown contributor</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-[#0050c8] font-semibold">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Rank #4 in City
            </span>
            <span className="text-[#737686]">Level 3 Master Citizen</span>
          </div>
        </div>
      </section>

      {/* Active Civic Quests Interactive Section */}
      <section
        id="active-civic-quests-container"
        className="bg-white border border-[#c2c6d7] rounded-2xl p-6 md:p-8 shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#1d68f2]" />
              <h2 className="text-xl font-bold text-[#121c28] tracking-tight">
                Live Civic Quests & Missions
              </h2>
            </div>
            <p className="text-xs text-[#424655] mt-0.5">
              Complete community challenges to unlock massive credit boosts and badges.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#0050c8] font-semibold bg-[#EDF4FF] px-3 py-1.5 rounded-full border border-[#dae2ff] w-fit">
            <Clock className="w-3.5 h-3.5" />
            <span>Season 4: 4 Days Left</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {quests.map((quest) => {
            const isCompleted = quest.current >= quest.target;
            const isClaimable = isCompleted && !quest.claimed;
            const pct = Math.min(100, Math.round((quest.current / quest.target) * 100));

            return (
              <div
                key={quest.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  quest.claimed
                    ? 'bg-gray-50 border-gray-200 opacity-85'
                    : isClaimable
                    ? 'bg-[#EDF4FF] border-[#1d68f2] shadow-sm ring-1 ring-[#1d68f2]'
                    : 'bg-[#f8f9ff] border-[#c2c6d7]/50 hover:border-[#1d68f2]/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-[#737686] uppercase tracking-wider">
                      District Mission
                    </span>
                    <span className="text-xs font-extrabold text-[#0050c8] bg-white px-2 py-0.5 rounded-md border border-[#dae2ff]">
                      +{quest.rewardCC} CC
                    </span>
                  </div>
                  <h4 className="font-bold text-[#121c28] text-sm leading-snug">
                    {quest.title}
                  </h4>
                  <p className="text-xs text-[#424655] mt-1 line-clamp-2 leading-relaxed">
                    {quest.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200/60">
                  <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                    <span className="text-[#737686]">Progress</span>
                    <span className="text-[#121c28]">
                      {quest.current} / {quest.target}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        quest.claimed ? 'bg-[#10B981]' : 'bg-[#1d68f2]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {quest.claimed ? (
                    <button
                      disabled
                      className="w-full py-1.5 bg-gray-200 text-gray-500 text-xs font-bold rounded-lg flex items-center justify-center gap-1 cursor-default"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Reward Claimed</span>
                    </button>
                  ) : isClaimable ? (
                    <button
                      onClick={() => handleQuestClaim(quest)}
                      className="w-full py-1.5 bg-[#10B981] hover:bg-[#004c17] text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1 animate-pulse cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Claim +{quest.rewardCC} CC</span>
                    </button>
                  ) : (
                    <div className="text-center text-[11px] text-[#737686] py-1 font-medium">
                      In Progress ({pct}%)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Leaderboard List & How to Earn */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Top Contributors List (8 cols) */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-[#121c28] tracking-tight">
                Top Contributors
              </h2>
              <span className="text-xs font-semibold text-[#737686]">
                Real-time citizen impact ratings
              </span>
            </div>

            {/* District Filter Pills */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#c2c6d7] overflow-x-auto">
              {[
                { id: 'all', label: 'All Districts' },
                { id: 'Downtown', label: 'Downtown' },
                { id: 'Mission District', label: 'Mission' },
                { id: 'Sunset District', label: 'Sunset' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDistrict(d.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedDistrict === d.id
                      ? 'bg-[#1d68f2] text-white shadow-xs'
                      : 'text-[#424655] hover:bg-[#EDF4FF]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredContributors.map((user) => {
              const isRank1 = user.rank === 1;
              const isCurrentUser = user.isCurrentUser;

              return (
                <div
                  key={user.id}
                  className={`rounded-2xl p-4 flex items-center justify-between transition-all relative overflow-hidden ${
                    isRank1
                      ? 'bg-white border-2 border-[#1d68f2] shadow-md'
                      : isCurrentUser
                      ? 'bg-[#EDF4FF] border border-[#1d68f2] shadow-sm'
                      : 'bg-white border border-[#c2c6d7] shadow-xs hover:border-[#1d68f2]/50'
                  }`}
                >
                  {/* Decorative background trophy for #1 */}
                  {isRank1 && (
                    <div className="absolute -right-3 -top-3 text-[#1d68f2] opacity-10 pointer-events-none transform rotate-12">
                      <Trophy className="w-32 h-32" />
                    </div>
                  )}

                  {/* Left: Rank, Avatar, Name, Resolved count */}
                  <div className="flex items-center gap-3 sm:gap-4 z-10">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm ${
                        isRank1
                          ? 'bg-[#1d68f2] text-white shadow-sm'
                          : isCurrentUser
                          ? 'bg-[#0050c8] text-white'
                          : 'bg-[#dfe9fa] text-[#121c28]'
                      }`}
                    >
                      {user.rank}
                    </div>

                    <img
                      src={user.avatar}
                      alt={user.name}
                      className={`w-11 h-11 rounded-full object-cover border-2 ${
                        isRank1 ? 'border-[#1d68f2]' : 'border-white'
                      } shadow-sm`}
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm sm:text-base font-bold text-[#121c28]">
                          {user.name}
                        </p>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-[#1d68f2] text-white rounded-full">
                            YOU
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#424655] flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>{user.issuesResolved} Issues Resolved</span>
                        {user.district && (
                          <span className="text-[#737686]">({user.district})</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right: CC points */}
                  <div className="text-right z-10">
                    <p
                      className={`text-lg sm:text-xl font-extrabold tracking-tight ${
                        isRank1 ? 'text-[#0050c8]' : 'text-[#121c28]'
                      }`}
                    >
                      {user.civicCredits.toLocaleString()}
                    </p>
                    <p className="text-[11px] font-bold text-[#737686] uppercase tracking-wider">
                      CC
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* How to Earn & Expanded Perks Store */}
        <aside className="md:col-span-4 space-y-6">
          <div className="bg-white border border-[#c2c6d7] rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#121c28] mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#1d68f2]" />
              How to earn
            </h3>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EDF4FF] text-[#0050c8] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#121c28]">Report an Issue</h4>
                  <p className="text-xs text-[#424655] mt-0.5">
                    <span className="font-bold text-[#0050c8]">+50 CC</span> for every verified issue you report.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#83fc8e]/30 text-[#004c17] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#121c28]">Verify Others</h4>
                  <p className="text-xs text-[#424655] mt-0.5">
                    <span className="font-bold text-[#10B981]">+10 CC</span> when you confirm an issue exists.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ffdcc4] text-[#924c00] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#121c28]">Resolution Bonus</h4>
                  <p className="text-xs text-[#424655] mt-0.5">
                    <span className="font-bold text-[#f88400]">+100 CC</span> when an issue you reported is fixed by the city.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Civic Perks Store with Live Redemption */}
          <div
            id="community-perks-shop-card"
            className="bg-[#eef4ff] border border-[#dae2ff] rounded-2xl p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#0050c8] uppercase tracking-wider flex items-center gap-1.5">
                <Gift className="w-4 h-4" />
                Community Perks Shop
              </h4>
              <span className="text-[10px] text-[#0050c8] font-bold">
                Balance: {currentUser.civicCredits.toLocaleString()} CC
              </span>
            </div>
            <p className="text-xs text-[#424655]">
              Redeem your hard-earned Civic Credits for municipal perks and community tokens.
            </p>

            <div className="space-y-2.5">
              {[
                {
                  id: 'parking',
                  name: '1-Day Municipal Parking Pass',
                  desc: 'Valid at all city garages',
                  cost: 500,
                  badge: 'Popular',
                },
                {
                  id: 'transit',
                  name: 'Metro Transit Day Pass',
                  desc: 'Unlimited bus & light rail rides',
                  cost: 750,
                  badge: 'Eco',
                },
                {
                  id: 'wellness',
                  name: 'Municipal Sports Complex Day Pass',
                  desc: 'Access to Olympic pool & gym facility',
                  cost: 400,
                  badge: 'Health',
                },
                {
                  id: 'tree',
                  name: 'Plant Dedicated Park Tree',
                  desc: 'Includes memorial brass plaque & certificate',
                  cost: 1000,
                  badge: 'Green',
                },
              ].map((perk) => {
                const isClaimed = redeemedPerks.includes(perk.name);

                return (
                  <div
                    key={perk.id}
                    className="bg-white p-3 rounded-xl border border-[#dae2ff] flex items-center justify-between shadow-2xs"
                  >
                    <div className="pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#121c28] block">
                          {perk.name}
                        </span>
                        {perk.badge && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-[#EDF4FF] text-[#0050c8] rounded">
                            {perk.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#737686]">{perk.desc}</span>
                    </div>

                    <button
                      id={`redeem-perk-${perk.id}-btn`}
                      onClick={() => handleClaim(perk)}
                      disabled={currentUser.civicCredits < perk.cost}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                        isClaimed
                          ? 'bg-[#10B981] text-white'
                          : currentUser.civicCredits >= perk.cost
                          ? 'bg-[#1d68f2] hover:bg-[#0050c8] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isClaimed ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Redeemed</span>
                        </>
                      ) : (
                        <span>{perk.cost.toLocaleString()} CC</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* My Active Vouchers & Passbook */}
            {userVouchers.length > 0 && (
              <div className="pt-3 border-t border-[#dae2ff] space-y-2">
                <span className="text-[10px] font-black uppercase text-[#0050c8] tracking-wider flex items-center gap-1">
                  <Ticket className="w-3 h-3" />
                  <span>Your Active Municipal Passes ({userVouchers.length})</span>
                </span>
                <div className="space-y-1.5">
                  {userVouchers.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setActiveVoucherForModal(v)}
                      className="p-2.5 bg-white rounded-xl border border-[#c2c6d7] hover:border-[#0050c8] transition-all cursor-pointer flex items-center justify-between shadow-2xs group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <QrCode className="w-3.5 h-3.5 text-[#0050c8]" />
                          <span className="text-xs font-bold text-[#121c28] truncate">{v.perkName}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#737686]">{v.voucherCode}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#0050c8] bg-[#EDF4FF] px-2 py-0.5 rounded-md group-hover:bg-[#0050c8] group-hover:text-white transition-colors shrink-0">
                        View Pass
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </section>

      {/* MODALS */}
      {activeVoucherForModal && (
        <VoucherModal
          voucher={activeVoucherForModal}
          onClose={() => setActiveVoucherForModal(null)}
        />
      )}

      {showCertificateModal && (
        <CivicCertificateModal
          citizen={currentUser}
          onClose={() => setShowCertificateModal(false)}
        />
      )}

      {insufficientCreditsNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-[#c2c6d7] shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#121c28]">Insufficient Civic Credits</h3>
              <p className="text-xs text-[#424655] mt-1.5 leading-relaxed">
                You need <span className="font-bold text-amber-700">{insufficientCreditsNotice.needed.toLocaleString()} CC</span> to redeem{' '}
                <span className="font-semibold text-[#121c28]">"{insufficientCreditsNotice.perkName}"</span>.
                You currently have <span className="font-bold text-[#0050c8]">{insufficientCreditsNotice.current.toLocaleString()} CC</span>.
              </p>
              <p className="text-xs text-[#737686] mt-2">
                Keep reporting community hazards, verifying resolutions, and earning quest bonuses to unlock this perk!
              </p>
            </div>
            <button
              onClick={() => setInsufficientCreditsNotice(null)}
              className="w-full py-2.5 bg-[#0050c8] text-white font-semibold text-xs rounded-xl hover:bg-[#003da0] transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
