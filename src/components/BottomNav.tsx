import { Home, PlusCircle, Activity, Trophy, UserCheck, Compass } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'home' | 'portal' | 'report' | 'activity' | 'ranks' | 'admin';
  onTabChange: (tab: 'home' | 'portal' | 'report' | 'activity' | 'ranks' | 'admin') => void;
  userRole?: 'citizen' | 'admin';
}

export const BottomNav = ({ currentTab, onTabChange, userRole = 'citizen' }: BottomNavProps) => {
  return (
    <nav
      id="mobile-bottom-navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#c2c6d7] shadow-[0px_-10px_30px_rgba(10,30,74,0.08)] px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] flex justify-around items-center"
    >
      {/* Home */}
      <button
        id="bottom-nav-home-btn"
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] px-2 py-1 transition-transform active:scale-95 cursor-pointer ${
          currentTab === 'home'
            ? 'bg-[#1d68f2] text-white rounded-xl shadow-xs'
            : 'text-[#424655] hover:text-[#0050c8]'
        }`}
      >
        <Home className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] font-bold tracking-tight">Home</span>
      </button>

      {/* Citizen Portal / Hub (for citizens) OR Activity */}
      {userRole !== 'admin' && (
        <button
          id="bottom-nav-portal-btn"
          onClick={() => onTabChange('portal')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] px-2 py-1 transition-transform active:scale-95 cursor-pointer ${
            currentTab === 'portal'
              ? 'bg-[#1d68f2] text-white rounded-xl shadow-xs'
              : 'text-[#424655] hover:text-[#0050c8]'
          }`}
        >
          <Compass className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-bold tracking-tight">Hub</span>
        </button>
      )}

      {/* Report */}
      <button
        id="bottom-nav-report-btn"
        onClick={() => onTabChange('report')}
        className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] px-2 py-1 transition-transform active:scale-95 cursor-pointer ${
          currentTab === 'report'
            ? 'bg-[#1d68f2] text-white rounded-xl shadow-xs'
            : 'text-[#424655] hover:text-[#0050c8]'
        }`}
      >
        <PlusCircle className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] font-bold tracking-tight">Report</span>
      </button>

      {/* Activity / Map */}
      <button
        id="bottom-nav-activity-btn"
        onClick={() => onTabChange('activity')}
        className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] px-2 py-1 transition-transform active:scale-95 cursor-pointer ${
          currentTab === 'activity'
            ? 'bg-[#1d68f2] text-white rounded-xl shadow-xs'
            : 'text-[#424655] hover:text-[#0050c8]'
        }`}
      >
        <Activity className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] font-bold tracking-tight">Activity</span>
      </button>

      {/* Leaderboard */}
      <button
        id="bottom-nav-ranks-btn"
        onClick={() => onTabChange('ranks')}
        className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] px-2 py-1 transition-transform active:scale-95 cursor-pointer ${
          currentTab === 'ranks'
            ? 'bg-[#1d68f2] text-white rounded-xl shadow-xs'
            : 'text-[#424655] hover:text-[#0050c8]'
        }`}
      >
        <Trophy className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] font-bold tracking-tight">Ranks</span>
      </button>

      {/* Admin - ONLY for Admin users */}
      {userRole === 'admin' && (
        <button
          id="bottom-nav-admin-btn"
          onClick={() => onTabChange('admin')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[44px] px-2 py-1 transition-transform active:scale-95 cursor-pointer ${
            currentTab === 'admin'
              ? 'bg-[#003180] text-white rounded-xl shadow-xs'
              : 'text-[#003180] hover:text-[#1d68f2]'
          }`}
        >
          <UserCheck className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-bold tracking-tight">Admin</span>
        </button>
      )}
    </nav>
  );
};

