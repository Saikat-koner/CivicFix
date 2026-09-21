import React, { useState } from 'react';
import {
  CivicIssue,
  IssueStatus,
  HigherUpOfficial,
  MunicipalAppointment,
  GrievancePetition,
  Contributor
} from '../types';
import {
  ShieldCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  Send,
  Calendar,
  Layers,
  Wrench,
  Sparkles,
  Phone,
  Video,
  FileText,
  Filter,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  RotateCcw,
  Plus,
  Truck,
  FileSpreadsheet,
  HardHat,
  TrendingUp,
  MapPin,
  Database,
  Edit2,
  Trash2,
  Save,
  CheckCircle,
  RefreshCw,
  KeyRound,
  UserPlus,
  Copy,
  Lock,
  Award,
  Mail
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CrewDispatchModal } from './CrewDispatchModal';
import { WorkOrderBatchExportModal } from './WorkOrderBatchExportModal';
import {
  getRegisteredUsers,
  provisionNewAdminByPreviousAdmin,
  RegisteredUserAccount,
  DEDICATED_ADMIN_ACCOUNT
} from '../utils/storage';

interface AdminPortalProps {
  issues: CivicIssue[];
  appointments: MunicipalAppointment[];
  grievances: GrievancePetition[];
  officials: HigherUpOfficial[];
  adminUser: Contributor;
  onUpdateIssueStatus: (issueId: string, status: IssueStatus, officialNote?: string, repairImageUrl?: string) => void;
  onAssignCrew: (issueId: string, crewName: string) => void;
  onUpdateGrievanceStatus: (grievanceId: string, status: GrievancePetition['status'], adminRemark: string) => void;
  onUpdateAppointmentStatus: (appointmentId: string, status: MunicipalAppointment['status'], note?: string) => void;
  onOpenIssueDetail: (issue: CivicIssue) => void;
  onOpenDbDiagnostics?: () => void;
  onOpenApiModal?: () => void;
  onUpdateIssue?: (issueId: string, updates: Partial<CivicIssue>) => void;
  onDeleteIssue?: (issueId: string) => void;
  onReseedDatabase?: () => void;
  onSyncDatabase?: () => void;
  onAddOfficial?: (official: Omit<HigherUpOfficial, 'id'>) => void;
  onUpdateOfficial?: (officialId: string, updates: Partial<HigherUpOfficial>) => void;
  onDeleteOfficial?: (officialId: string) => void;
  onBookOfficialAppointment?: (appointmentData: Omit<MunicipalAppointment, 'id' | 'createdAt'>) => void;
  lastSyncTime?: Date;
  isLiveSyncing?: boolean;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  issues,
  appointments,
  grievances,
  officials,
  adminUser,
  onUpdateIssueStatus,
  onAssignCrew,
  onUpdateGrievanceStatus,
  onUpdateAppointmentStatus,
  onOpenIssueDetail,
  onOpenDbDiagnostics,
  onOpenApiModal,
  onUpdateIssue,
  onDeleteIssue,
  onReseedDatabase,
  onSyncDatabase,
  onAddOfficial,
  onUpdateOfficial,
  onDeleteOfficial,
  onBookOfficialAppointment,
  lastSyncTime,
  isLiveSyncing = false,
}) => {
  const [activeSection, setActiveSection] = useState<'issues' | 'grievances' | 'appointments' | 'officials' | 'admin_provisioning'>('issues');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'investigating' | 'fixed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedIssueForAction, setSelectedIssueForAction] = useState<CivicIssue | null>(null);
  const [officialNote, setOfficialNote] = useState<string>('');
  const [repairImageUrl, setRepairImageUrl] = useState<string>('https://images.unsplash.com/photo-1541888946425-d0fbb180c5f7?auto=format&fit=crop&w=800&q=80');
  const [selectedCrew, setSelectedCrew] = useState<string>('Public Works Rapid Response Team #3');
  const [dispatchingIssue, setDispatchingIssue] = useState<CivicIssue | null>(null);
  const [showBatchExportModal, setShowBatchExportModal] = useState<boolean>(false);
  const [slaFilter, setSlaFilter] = useState<'all' | 'breached' | 'warning' | 'healthy'>('all');
  const [showWardMatrix, setShowWardMatrix] = useState<boolean>(false);

  // Admin ID Provisioning & Access Control State
  const [provisionName, setProvisionName] = useState('');
  const [provisionEmail, setProvisionEmail] = useState('');
  const [provisionPassword, setProvisionPassword] = useState('Sk@2264');
  const [provisionPin, setProvisionPin] = useState('2264');
  const [provisionDepartment, setProvisionDepartment] = useState('Public Works & Urban Infrastructure Directorate');
  const [provisionDistrict, setProvisionDistrict] = useState('Bengaluru Central (Ward 112)');
  const [provisionPhone, setProvisionPhone] = useState('+91 80 2297 5500');
  const [showProvisionPassword, setShowProvisionPassword] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [provisionSuccessSlip, setProvisionSuccessSlip] = useState<RegisteredUserAccount | null>(null);
  const [copiedSlip, setCopiedSlip] = useState(false);
  const [adminUsersList, setAdminUsersList] = useState<RegisteredUserAccount[]>(() => {
    return getRegisteredUsers().filter((u) => u.role === 'admin');
  });

  // Admin DB direct modification state
  const [editingIssueForDb, setEditingIssueForDb] = useState<CivicIssue | null>(null);
  const [editDbForm, setEditDbForm] = useState<Partial<CivicIssue>>({});
  const [savingDbIssue, setSavingDbIssue] = useState(false);
  const [deletingIssue, setDeletingIssue] = useState<CivicIssue | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  // Higher-Up Officials Backend Management State
  const [showAddOfficialModal, setShowAddOfficialModal] = useState<boolean>(false);
  const [editingOfficial, setEditingOfficial] = useState<HigherUpOfficial | null>(null);
  const [deletingOfficial, setDeletingOfficial] = useState<HigherUpOfficial | null>(null);
  const [showAdminReseedConfirm, setShowAdminReseedConfirm] = useState<boolean>(false);
  const [reseedLoading, setReseedLoading] = useState<boolean>(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [editOfficialForm, setEditOfficialForm] = useState<Partial<HigherUpOfficial>>({});
  const [schedulingOfficial, setSchedulingOfficial] = useState<HigherUpOfficial | null>(null);
  const [expandedOfficialAppointments, setExpandedOfficialAppointments] = useState<string | null>(null);

  const [scheduleAppointmentForm, setScheduleAppointmentForm] = useState<{
    citizenName: string;
    citizenEmail: string;
    citizenPhone: string;
    date: string;
    timeSlot: string;
    mode: 'in-person' | 'video' | 'phone';
    purpose: string;
    agenda: string;
  }>({
    citizenName: 'Aditi Sharma',
    citizenEmail: 'aditi.sharma@example.com',
    citizenPhone: '+91 98450 12345',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    timeSlot: '11:00 AM',
    mode: 'in-person',
    purpose: 'Infrastructure Escalation & Dispute',
    agenda: 'Urgent consultation regarding chronic stormwater drainage overflow and delayed road re-surfacing.',
  });

  const [newOfficialForm, setNewOfficialForm] = useState<Omit<HigherUpOfficial, 'id'>>({
    name: '',
    role: 'Ward Councilor',
    title: 'Councilor',
    department: 'Urban Governance & Public Infrastructure',
    jurisdiction: 'Bengaluru Central (Ward 112)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    phone: '+91 80 2297 5500',
    alternatePhone: '+91 80 2297 5599',
    email: 'councilor@civicfix.gov.in',
    officeLocation: 'BBMP Ward 112 Office, MG Road',
    roomNumber: 'Room 304, 3rd Floor',
    officeHours: 'Mon - Fri, 10:00 AM - 1:30 PM',
    availableModes: ['in-person', 'video', 'phone'],
    nextAvailableSlot: 'Tomorrow at 11:00 AM',
    appointmentSlots: ['10:00 AM', '11:00 AM', '12:00 PM', '02:30 PM', '03:30 PM'],
    escalationSpecialties: ['Road Redressal', 'Drainage', 'Sanitation Disputes'],
    rating: 4.8,
    bio: 'Dedicated municipal representative addressing civic escalations and citizen petitions.',
  });

  const handleOpenEditDb = (issue: CivicIssue) => {
    setEditingIssueForDb(issue);
    setEditDbForm({
      title: issue.title,
      description: issue.description,
      category: issue.category,
      severity: issue.severity,
      status: issue.status,
      address: issue.address,
      district: issue.district,
      upvotes: issue.upvotes,
    });
  };

  const handleSaveEditDb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIssueForDb || !onUpdateIssue) return;
    setSavingDbIssue(true);
    try {
      await onUpdateIssue(editingIssueForDb.id, editDbForm);
      setEditingIssueForDb(null);
    } catch (err: any) {
      setAdminError(`Failed to update issue: ${err.message || 'Database error'}`);
    } finally {
      setSavingDbIssue(false);
    }
  };

  const handleDeleteIssueClick = (issue: CivicIssue) => {
    if (!onDeleteIssue) return;
    setDeletingIssue(issue);
  };

  const handleConfirmDelete = async () => {
    if (!deletingIssue || !onDeleteIssue) return;
    setIsDeleting(true);
    const trackingCode = deletingIssue.code || deletingIssue.title;
    try {
      await onDeleteIssue(deletingIssue.id);
      setDeleteNotice(`Issue #${trackingCode} was deleted permanently from Cloud SQL PostgreSQL.`);
      setTimeout(() => setDeleteNotice(null), 4500);
      setDeletingIssue(null);
    } catch (err: any) {
      console.error('Failed to delete issue in AdminPortal:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for municipal SLA calculation
  const getSLAInfo = (issue: CivicIssue) => {
    const limitHours = issue.category === 'Roads' || issue.category === 'Safety' ? 24 :
                       issue.category === 'Utilities' ? 48 :
                       issue.category === 'Sanitation' ? 36 : 72;

    if (issue.status === 'fixed') {
      return { status: 'met', label: 'SLA Met (100% On-Time)', color: 'text-[#15803d] bg-[#dcfce7] border-[#bbf7d0]', hoursLeft: 0, isBreached: false };
    }

    const isOverdue = issue.id === 'issue-2' || issue.reportedDaysAgo.includes('5') || issue.reportedDaysAgo.includes('6');
    const isWarning = issue.id === 'issue-3' || issue.reportedDaysAgo.includes('1') || issue.reportedDaysAgo.includes('2');

    if (isOverdue) {
      return { status: 'breached', label: '🚨 SLA Breached (+18h Overdue)', color: 'text-[#b91c1c] bg-[#fee2e2] border-[#fca5a5]', hoursLeft: -18, isBreached: true };
    }
    if (isWarning) {
      return { status: 'warning', label: '⚠️ SLA Warning (5h left)', color: 'text-[#b45309] bg-[#fef3c7] border-[#fde68a]', hoursLeft: 5, isBreached: false };
    }
    return { status: 'healthy', label: `✓ SLA Healthy (${limitHours - 6}h remaining)`, color: 'text-[#15803d] bg-[#dcfce7] border-[#bbf7d0]', hoursLeft: limitHours - 6, isBreached: false };
  };

  const handleConfirmDispatch = (issueId: string, dispatchData: {
    crewName: string;
    headEngineer: string;
    budgetCode: string;
    estimatedCost: string;
    targetDate: string;
    equipment: string;
    notes: string;
  }) => {
    onUpdateIssueStatus(
      issueId,
      'investigating',
      `Dispatched to ${dispatchData.crewName} (${dispatchData.headEngineer}). Equipment: ${dispatchData.equipment}. Budget: ${dispatchData.budgetCode}. Target: ${dispatchData.targetDate}.`
    );
    onAssignCrew(issueId, dispatchData.crewName);
  };

  // Stats calculation
  const totalOpen = issues.filter((i) => i.status === 'open').length;
  const totalInvestigating = issues.filter((i) => i.status === 'investigating').length;
  const totalFixed = issues.filter((i) => i.status === 'fixed').length;
  const pendingGrievances = grievances.filter((g) => g.status !== 'resolved').length;
  const pendingAppts = appointments.filter((a) => a.status === 'confirmed').length;

  const filteredIssues = issues.filter((issue) => {
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;
    if (slaFilter !== 'all') {
      const sla = getSLAInfo(issue);
      if (slaFilter === 'breached' && sla.status !== 'breached') return false;
      if (slaFilter === 'warning' && sla.status !== 'warning') return false;
      if (slaFilter === 'healthy' && (sla.status !== 'healthy' && sla.status !== 'met')) return false;
    }
    return true;
  });

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueForAction) return;

    onUpdateIssueStatus(
      selectedIssueForAction.id,
      'fixed',
      officialNote || 'Verified and completed by City Operations Field Supervisor.',
      repairImageUrl
    );

    confetti({ particleCount: 60, spread: 50 });
    setSelectedIssueForAction(null);
    setOfficialNote('');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Officer Credentials */}
      <div className="bg-gradient-to-r from-[#003180] via-[#0050c8] to-[#1d68f2] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 z-10">
          <img
            src={adminUser.avatar}
            alt={adminUser.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-white/40 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#f88400] text-white font-extrabold text-[10px] rounded-full uppercase tracking-wider shadow-xs">
                Municipal Authority Portal
              </span>
              <span className="text-xs text-white/80 font-medium">Clearance: Level 5 Administrator</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">{adminUser.name}</h1>
            <p className="text-xs text-white/80 font-medium">
              Office of the Municipal Commissioner & Public Works Command Center
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 z-10">
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-center">
            <span className="text-lg font-black block leading-none">{issues.length}</span>
            <span className="text-[10px] text-white/80 font-bold uppercase">City Issues</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-center">
            <span className="text-lg font-black block leading-none text-[#ffdcc4]">{pendingGrievances}</span>
            <span className="text-[10px] text-white/80 font-bold uppercase">Escalations</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-center">
            <span className="text-lg font-black block leading-none text-[#bdf4d4]">{pendingAppts}</span>
            <span className="text-[10px] text-white/80 font-bold uppercase">Hearings</span>
          </div>
        </div>
      </div>

      {/* Database Error Banner */}
      {adminError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{adminError}</span>
          </div>
          <button
            onClick={() => setAdminError(null)}
            className="text-red-700 hover:text-red-900 text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Database Deletion Notice Banner */}
      {deleteNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{deleteNotice}</span>
          </div>
          <button
            onClick={() => setDeleteNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Admin KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-[#c2c6d7] shadow-xs">
          <span className="text-[11px] font-bold text-[#737686] uppercase tracking-wider block">
            Needs Action / Open
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-[#dc2626]">{totalOpen}</span>
            <span className="text-xs font-bold text-[#dc2626] bg-[#fee2e2] px-2 py-0.5 rounded-md">
              High Priority
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#c2c6d7] shadow-xs">
          <span className="text-[11px] font-bold text-[#737686] uppercase tracking-wider block">
            In Field Investigation
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-[#f88400]">{totalInvestigating}</span>
            <span className="text-xs font-bold text-[#f88400] bg-[#fff7ed] px-2 py-0.5 rounded-md">
              Crews Active
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#c2c6d7] shadow-xs">
          <span className="text-[11px] font-bold text-[#737686] uppercase tracking-wider block">
            Resolved & Verified
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-[#10B981]">{totalFixed}</span>
            <span className="text-xs font-bold text-[#10B981] bg-[#dcfce7] px-2 py-0.5 rounded-md">
              SLA Met (94%)
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#c2c6d7] shadow-xs">
          <span className="text-[11px] font-bold text-[#737686] uppercase tracking-wider block">
            Citizen Higher-Up Petitions
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-[#0050c8]">{grievances.length}</span>
            <span className="text-xs font-bold text-[#0050c8] bg-[#eef4ff] px-2 py-0.5 rounded-md">
              Ombudsman Tracked
            </span>
          </div>
        </div>
      </div>

      {/* Admin Module Tabs */}
      <div className="flex items-center gap-2 border-b border-[#c2c6d7] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSection('issues')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'issues'
              ? 'bg-[#0050c8] text-white shadow-xs'
              : 'text-[#424655] hover:bg-gray-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Issues & Field Dispatches ({issues.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('grievances')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'grievances'
              ? 'bg-[#0050c8] text-white shadow-xs'
              : 'text-[#424655] hover:bg-gray-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-[#f88400]" />
          <span>Higher-Up Grievances ({grievances.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('appointments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'appointments'
              ? 'bg-[#0050c8] text-white shadow-xs'
              : 'text-[#424655] hover:bg-gray-100'
          }`}
        >
          <Calendar className="w-4 h-4 text-[#10B981]" />
          <span>Citizen Consultations ({appointments.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('officials')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSection === 'officials'
              ? 'bg-[#0050c8] text-white shadow-xs'
              : 'text-[#424655] hover:bg-gray-100'
          }`}
        >
          <Building2 className="w-4 h-4 text-[#0050c8]" />
          <span>Council & Officers Roster</span>
        </button>

        <button
          onClick={() => setActiveSection('admin_provisioning')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSection === 'admin_provisioning'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-[#424655] hover:bg-gray-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Admin IDs & Provisioning</span>
        </button>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {onSyncDatabase && (
            <button
              type="button"
              onClick={onSyncDatabase}
              disabled={isLiveSyncing}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                isLiveSyncing
                  ? 'bg-blue-50 text-blue-400 border-blue-200 cursor-not-allowed'
                  : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-300 shadow-2xs'
              }`}
              title={lastSyncTime ? `Last synced with Cloud SQL at ${lastSyncTime.toLocaleTimeString()}` : 'Sync with PostgreSQL'}
            >
              <RotateCcw className={`w-3.5 h-3.5 text-blue-600 ${isLiveSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isLiveSyncing ? 'Syncing DB...' : 'Sync DB'}
              </span>
            </button>
          )}

          {onReseedDatabase && (
            <button
              type="button"
              onClick={() => setShowAdminReseedConfirm(true)}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs cursor-pointer"
              title="Reseed database with fresh mock civic records"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Reseed DB</span>
            </button>
          )}

          {onOpenApiModal && (
            <button
              type="button"
              onClick={onOpenApiModal}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 shadow-2xs cursor-pointer"
              title="Where to get free API keys: Gemini, Brevo, Resend, Maps"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Free APIs</span>
            </button>
          )}

          {onOpenDbDiagnostics && (
            <button
              type="button"
              onClick={onOpenDbDiagnostics}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
              title="Inspect & Modify Cloud SQL PostgreSQL Database directly"
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Database Admin Studio</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: ISSUES & DISPATCH */}
      {activeSection === 'issues' && (
        <div className="space-y-4">
          {/* SLA Breach Radar & Command Bar */}
          <div className="bg-[#121c28] text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>Statutory Municipal SLA Radar</span>
                    <span className="text-[10px] bg-red-500 text-white font-black px-2 py-0.2 rounded-full uppercase tracking-wider">
                      Live Enforcement
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Enforcing Karnataka Municipal Statutory SLA: 24h for Road hazards, 48h for Streetlights/Utilities.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowWardMatrix(!showWardMatrix)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    showWardMatrix
                      ? 'bg-[#0050c8] text-white shadow-xs'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
                  <span>Ward Stress Matrix</span>
                </button>

                <button
                  onClick={() => setShowBatchExportModal(true)}
                  className="px-3 py-1.5 bg-[#0050c8] hover:bg-[#1d68f2] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export Manifest</span>
                </button>
              </div>
            </div>

            {/* SLA Radar Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                SLA Compliance Radar:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Issues' },
                  { id: 'breached', label: '🚨 Breached (+18h Overdue)' },
                  { id: 'warning', label: '⚠️ Warning (<12h)' },
                  { id: 'healthy', label: '✓ Compliant / Healthy' },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setSlaFilter(pill.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      slaFilter === pill.id
                        ? 'bg-amber-400 text-black shadow-xs'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Ward Stress Matrix Bento */}
          {showWardMatrix && (
            <div className="bg-white rounded-2xl border border-[#c2c6d7] p-5 shadow-xs animate-in fade-in duration-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-[#121c28] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#0050c8]" />
                    <span>Metropolitan Ward Infrastructure Stress Radar</span>
                  </h4>
                  <p className="text-xs text-[#737686] mt-0.5">
                    Active infrastructure strain calculations and contractor field unit distribution across city zones.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-[#0050c8] bg-[#eef4ff] px-2.5 py-1 rounded-lg border border-[#dae2ff] font-bold">
                  Citywide Resolution Rate: 88.4%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { ward: 'Indiranagar (Ward 112)', open: 2, resolved: 14, stress: 'Low (22%)', color: 'text-[#15803d] bg-[#dcfce7]', crew: 'Crew #4 Active' },
                  { ward: 'Koramangala (Ward 151)', open: 5, resolved: 8, stress: 'High Stress (68%)', color: 'text-[#b91c1c] bg-[#fee2e2]', crew: 'Crew #3 Dispatched' },
                  { ward: 'HSR Layout (Ward 174)', open: 3, resolved: 11, stress: 'Moderate (38%)', color: 'text-amber-700 bg-amber-50', crew: 'Crew #1 Standby' },
                  { ward: 'Whitefield (Ward 84)', open: 4, resolved: 9, stress: 'Moderate (44%)', color: 'text-amber-700 bg-amber-50', crew: 'Fleet #2 Active' },
                ].map((w, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-[#c2c6d7] bg-gray-50/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-[#121c28]">{w.ward}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${w.color}`}>
                        {w.stress}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#424655] flex items-center justify-between">
                      <span>Open: <strong>{w.open}</strong></span>
                      <span>Resolved: <strong>{w.resolved}</strong></span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 text-[10px] text-[#0050c8] font-bold flex items-center gap-1">
                      <HardHat className="w-3 h-3" />
                      <span>{w.crew}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#c2c6d7]">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#737686]" />
              <span className="text-xs font-bold text-[#121c28]">Filters:</span>
              <div className="flex items-center gap-1">
                {(['all', 'open', 'investigating', 'fixed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#0050c8] text-white'
                        : 'bg-gray-100 text-[#424655] hover:bg-gray-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#737686]">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1 rounded-lg border border-[#c2c6d7] text-xs font-bold bg-white"
              >
                <option value="all">All Categories</option>
                <option value="Roads">Roads</option>
                <option value="Utilities">Utilities</option>
                <option value="Sanitation">Sanitation</option>
                <option value="Parks">Parks</option>
                <option value="Safety">Safety</option>
              </select>
            </div>
          </div>

          {/* Issues Table / Cards */}
          <div className="space-y-3">
            {filteredIssues.map((issue) => {
              const sla = getSLAInfo(issue);

              return (
                <div
                  key={issue.id}
                  className={`bg-white rounded-xl border p-4 shadow-xs hover:border-[#0050c8] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    sla.isBreached ? 'border-red-300 bg-red-50/10' : 'border-[#c2c6d7]'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <img
                      src={issue.imageUrl}
                      alt={issue.title}
                      className="w-16 h-16 rounded-xl object-cover border border-[#c2c6d7] flex-shrink-0 cursor-pointer"
                      onClick={() => onOpenIssueDetail(issue)}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-[#0050c8] bg-[#EDF4FF] px-2 py-0.5 rounded">
                          {issue.code}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            issue.status === 'open'
                              ? 'bg-[#fee2e2] text-[#dc2626]'
                              : issue.status === 'investigating'
                              ? 'bg-[#fff7ed] text-[#ea580c]'
                              : 'bg-[#dcfce7] text-[#15803d]'
                          }`}
                        >
                          {issue.status}
                        </span>

                        {/* Statutory SLA Badge */}
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${sla.color}`}
                        >
                          {sla.label}
                        </span>

                        <span className="text-xs font-bold text-[#737686]">{issue.category}</span>
                        <span className="text-xs text-[#737686]">• {issue.district}</span>
                        {issue.escalationStatus === 'escalated_to_higher_up' && (
                          <span className="text-[10px] font-bold bg-[#fee2e2] text-[#dc2626] border border-[#dc2626]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Escalated to Commissioner
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => onOpenIssueDetail(issue)}
                        className="text-sm font-extrabold text-[#121c28] mt-1 cursor-pointer hover:text-[#0050c8] truncate"
                      >
                        {issue.title}
                      </h3>
                      <p className="text-xs text-[#56596e] truncate">{issue.address}</p>

                      <div className="flex items-center gap-3 text-[11px] text-[#737686] mt-1 flex-wrap">
                        <span>Reported by {issue.reportedBy.name}</span>
                        <span>• {issue.reportedDaysAgo}</span>
                        <span>• {issue.upvotes} Citizen Votes</span>
                        {issue.assignedCrew && (
                          <span className="font-bold text-[#0050c8] bg-[#eef4ff] px-2 py-0.2 rounded-md border border-[#dae2ff] flex items-center gap-1">
                            <HardHat className="w-3 h-3" />
                            <span>{issue.assignedCrew}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Admin Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                    {issue.status !== 'fixed' && (
                      <button
                        onClick={() => setDispatchingIssue(issue)}
                        className="px-3 py-1.5 bg-[#0050c8] hover:bg-[#1d68f2] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5 text-amber-300" />
                        <span>{issue.assignedCrew ? 'Reassign Crew' : 'Dispatch Crew'}</span>
                      </button>
                    )}

                    {issue.status !== 'fixed' && (
                      <button
                        onClick={() => setSelectedIssueForAction(issue)}
                        className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark As Fixed</span>
                      </button>
                    )}

                    {issue.status === 'fixed' && (
                      <button
                        onClick={() => onUpdateIssueStatus(issue.id, 'investigating', 'Re-opened for additional inspection by Admin.')}
                        className="px-3 py-1.5 bg-white border border-[#c2c6d7] hover:bg-gray-50 text-[#424655] text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Re-Open Case</span>
                      </button>
                    )}

                    <button
                      onClick={() => onOpenIssueDetail(issue)}
                      className="px-3 py-1.5 bg-white border border-[#c2c6d7] text-[#121c28] hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Details
                    </button>

                    {/* Admin DB Direct Modification Buttons */}
                    {onUpdateIssue && (
                      <button
                        onClick={() => handleOpenEditDb(issue)}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Edit issue record directly in PostgreSQL database"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit DB</span>
                      </button>
                    )}

                    {onDeleteIssue && (
                      <button
                        onClick={() => handleDeleteIssueClick(issue)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Delete issue record from PostgreSQL database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: HIGHER-UP GRIEVANCES REVIEW */}
      {activeSection === 'grievances' && (
        <div className="space-y-4">
          <div className="p-3 bg-[#fff7ed] rounded-xl border border-[#ffedd5] text-xs text-[#ea580c] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>Citizen Redressal Inquiries:</strong> Citizens who are dissatisfied with solutions or reporting unresolved municipal delays.
            </span>
          </div>

          <div className="space-y-3">
            {grievances.map((grv) => (
              <div
                key={grv.id}
                className="p-5 rounded-xl border border-[#c2c6d7] bg-white space-y-3 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-[#0050c8] bg-[#EDF4FF] px-2 py-0.5 rounded">
                      {grv.petitionNumber}
                    </span>
                    <span className="text-sm font-black text-[#121c28]">
                      Case {grv.issueCode}: {grv.issueTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                        grv.severity === 'Critical'
                          ? 'bg-[#fee2e2] text-[#dc2626]'
                          : 'bg-[#fff7ed] text-[#ea580c]'
                      }`}
                    >
                      {grv.severity} Priority
                    </span>
                    <span className="text-xs text-[#737686]">{grv.filedAt}</span>
                  </div>
                </div>

                <div className="text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[#121c28]">
                      <strong>Filed by Citizen:</strong> {grv.citizenName} | <strong>Target Official:</strong> {grv.targetHigherUpName} ({grv.targetHigherUpRole})
                    </p>
                    <span className="font-bold text-[#0050c8] uppercase text-[10px]">
                      Type: {grv.escalationType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="p-3 bg-[#f8f9ff] rounded-lg border border-[#dae2ff] text-[#121c28]">
                    <span className="font-bold block text-[#737686] mb-0.5">Citizen Dissatisfaction Statement:</span>
                    <p className="italic">"{grv.dissatisfactionReason}"</p>
                  </div>
                </div>

                {grv.adminRemarks && (
                  <div className="p-3 bg-[#f0fdf4] rounded-lg border border-[#bbf7d0] text-xs text-[#166534]">
                    <strong>Administrative Order:</strong> {grv.adminRemarks}
                  </div>
                )}

                {/* Admin Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      onUpdateGrievanceStatus(
                        grv.id,
                        'action_ordered',
                        'Commissioner ordered immediate heavy equipment resurfacing and site re-inspection.'
                      );
                      confetti({ particleCount: 40 });
                    }}
                    className="px-3 py-1.5 bg-[#0050c8] hover:bg-[#1d68f2] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                  >
                    Issue Executive Action Order
                  </button>
                  <button
                    onClick={() => {
                      onUpdateGrievanceStatus(
                        grv.id,
                        'resolved',
                        'Citizen grievance addressed in official ward briefing and repair re-certified.'
                      );
                      confetti({ particleCount: 40 });
                    }}
                    className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                  >
                    Mark Redressal Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: CITIZEN APPOINTMENTS MANAGEMENT */}
      {activeSection === 'appointments' && (
        <div className="space-y-4">
          <div className="p-3 bg-[#eef4ff] rounded-xl border border-[#dae2ff] text-xs text-[#0050c8] flex items-center justify-between">
            <span>
              <strong>Citizen Consultation Calendar:</strong> Manage official briefings with City Commissioners, Ward Councilors & Public Works Directors.
            </span>
          </div>

          <div className="space-y-3">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="p-5 rounded-xl border border-[#c2c6d7] bg-white space-y-3 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-sm font-black text-[#121c28]">
                      Citizen: {appt.citizenName} ({appt.citizenPhone} • {appt.citizenEmail})
                    </span>
                    <span className="text-xs text-[#0050c8] block font-medium">
                      Meeting with: {appt.officialName} ({appt.officialRole})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#dcfce7] text-[#15803d] text-xs font-bold rounded-lg capitalize">
                      {appt.meetingMode === 'in-person' && <Building2 className="w-3.5 h-3.5" />}
                      {appt.meetingMode === 'video' && <Video className="w-3.5 h-3.5" />}
                      {appt.meetingMode === 'phone' && <Phone className="w-3.5 h-3.5" />}
                      <span>{appt.status} • {appt.meetingMode}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[#737686] block">Scheduled Time:</span>
                    <span className="font-bold text-[#121c28]">
                      📅 {appt.date} at {appt.timeSlot}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#737686] block">Venue / Link:</span>
                    <span className="font-bold text-[#0050c8] truncate block">
                      📍 {appt.locationOrLink}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#737686] block">Related Case:</span>
                    <span className="font-bold text-[#121c28]">
                      {appt.issueCode || 'General Consultation'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#f8f9ff] rounded-lg border border-[#dae2ff] text-xs">
                  <span className="font-bold text-[#121c28]">Agenda / Dissatisfaction Details:</span>
                  <p className="text-[#424655] mt-0.5 italic">"{appt.agenda}"</p>
                </div>

                {/* Status Toggles */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => onUpdateAppointmentStatus(appt.id, 'completed', 'Briefing held at City Hall. Action items delegated.')}
                    className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                  >
                    Mark Consultation Completed
                  </button>
                  <button
                    onClick={() => onUpdateAppointmentStatus(appt.id, 'rescheduled', 'Time slot moved per commissioner schedule.')}
                    className="px-3 py-1.5 bg-white border border-[#c2c6d7] text-[#424655] hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors"
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: OFFICIALS ROSTER (ADMIN BACKEND PROVISIONING) */}
      {activeSection === 'officials' && (
        <div className="space-y-4">
          {/* SECTION HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0050c8]" />
                <h2 className="text-base font-black text-[#121c28] dark:text-white">
                  Higher-Up Authorities & Officials Roster
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800">
                  {officials.length} Registered
                </span>
              </div>
              <p className="text-xs text-[#737686] dark:text-gray-400 mt-0.5">
                Manage appointed commissioners, councilors, grievance ombudsmen, their direct contacts, and citizen appointments.
              </p>
            </div>
            <button
              id="admin-add-official-btn"
              type="button"
              onClick={() => setShowAddOfficialModal(true)}
              className="px-4 py-2 bg-[#0050c8] hover:bg-[#1d68f2] text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Add Higher-Up Official</span>
            </button>
          </div>

          {/* OFFICIALS CARDS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {officials.map((official) => {
              const officialAppts = appointments.filter(
                (a) =>
                  a.officialId === official.id ||
                  (a.officialName && a.officialName.toLowerCase().includes(official.name.toLowerCase()))
              );
              const isApptsExpanded = expandedOfficialAppointments === official.id;

              return (
                <div
                  key={official.id}
                  id={`official-card-${official.id}`}
                  className="p-5 rounded-2xl border border-[#c2c6d7] dark:border-gray-700 bg-white dark:bg-[#161c28] flex flex-col justify-between gap-4 shadow-xs hover:border-[#0050c8] dark:hover:border-blue-500 transition-all"
                >
                  {/* Top: Avatar, Role, Jurisdiction, Quick Actions */}
                  <div className="flex items-start gap-3.5">
                    <img
                      src={official.avatar}
                      alt={official.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-100 dark:border-gray-700 shadow-xs shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold text-[#0050c8] dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-800 truncate">
                          {official.jurisdiction || 'City-Wide'}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {onUpdateOfficial && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOfficial(official);
                                setEditOfficialForm({ ...official });
                              }}
                              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-[#0050c8] hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                              title="Edit official details and appointments"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteOfficial && (
                            <button
                              type="button"
                              onClick={() => setDeletingOfficial(official)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                              title="Remove official from registry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <h3 className="text-sm font-black text-[#121c28] dark:text-white mt-1 leading-tight">
                        {official.name}
                      </h3>
                      <p className="text-xs font-bold text-[#f88400] dark:text-amber-400">{official.role}</p>
                      <p className="text-[11px] text-[#737686] dark:text-gray-400 truncate">{official.department}</p>
                    </div>
                  </div>

                  {/* Contact Details Grid */}
                  <div className="bg-[#f8f9ff] dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 space-y-1.5 text-xs">
                    <div className="font-bold text-[11px] uppercase tracking-wider text-[#0050c8] dark:text-blue-400 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>Contact Information</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 text-[#424655] dark:text-gray-300">
                      <div className="truncate flex items-center gap-1">
                        <span className="font-semibold text-gray-500 dark:text-gray-400">Direct:</span>
                        <a href={`tel:${official.phone}`} className="hover:text-[#0050c8] hover:underline font-medium text-[#121c28] dark:text-white">
                          {official.phone}
                        </a>
                      </div>
                      {official.alternatePhone && (
                        <div className="truncate flex items-center gap-1">
                          <span className="font-semibold text-gray-500 dark:text-gray-400">Alt/WhatsApp:</span>
                          <span className="font-medium text-[#121c28] dark:text-white">{official.alternatePhone}</span>
                        </div>
                      )}
                      <div className="truncate sm:col-span-2 flex items-center gap-1">
                        <span className="font-semibold text-gray-500 dark:text-gray-400">Email:</span>
                        <a href={`mailto:${official.email}`} className="hover:text-[#0050c8] hover:underline font-medium text-[#0050c8] dark:text-blue-400">
                          {official.email}
                        </a>
                      </div>
                      <div className="truncate sm:col-span-2 flex items-center gap-1 text-[11px]">
                        <span className="font-semibold text-gray-500 dark:text-gray-400">Office:</span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {official.officeLocation} {official.roomNumber ? `(${official.roomNumber})` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Appointments & Schedule Information */}
                  <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/40 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Appointment & Visiting Hours</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                        Next: {official.nextAvailableSlot}
                      </span>
                    </div>

                    <div className="text-[#424655] dark:text-gray-300 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500 dark:text-gray-400">Visiting Hours:</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {official.officeHours || 'Mon - Fri, 10:00 AM - 1:30 PM'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">Modes:</span>
                        {official.availableModes?.map((mode) => (
                          <span
                            key={mode}
                            className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                          >
                            {mode === 'in-person' ? '🏛 In-Person' : mode === 'video' ? '📹 Video' : '📞 Phone'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Appointments List Drawer / Roster */}
                  {isApptsExpanded && (
                    <div className="p-3 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl border border-blue-200/60 dark:border-blue-900/40 space-y-2 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between pb-1 border-b border-blue-100 dark:border-blue-900/50">
                        <span className="font-bold text-[#0050c8] dark:text-blue-300 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          Citizen Bookings ({officialAppts.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedOfficialAppointments(null)}
                          className="text-[10px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        >
                          Close
                        </button>
                      </div>

                      {officialAppts.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-2 text-xs italic">
                          No appointments currently scheduled with this authority.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {officialAppts.map((appt) => (
                            <div
                              key={appt.id}
                              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span className="text-gray-800 dark:text-white">{appt.citizenName}</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                                    appt.status === 'confirmed'
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                                      : appt.status === 'completed'
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                                  }`}
                                >
                                  {appt.status}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                                <span>📅 {appt.date} at {appt.timeSlot}</span>
                                <span>{appt.mode === 'in-person' ? '🏛 Chamber' : appt.mode === 'video' ? '📹 Video' : '📞 Call'}</span>
                              </div>
                              <p className="text-[11px] text-gray-600 dark:text-gray-300 italic truncate">
                                "{appt.agenda || appt.purpose}"
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedOfficialAppointments(
                          isApptsExpanded ? null : official.id
                        )
                      }
                      className="text-xs font-bold text-[#0050c8] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {officialAppts.length} Citizen Appointment{officialAppts.length !== 1 ? 's' : ''}
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSchedulingOfficial(official);
                          setScheduleAppointmentForm((prev) => ({
                            ...prev,
                            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                            timeSlot: official.appointmentSlots?.[0] || '11:00 AM',
                          }));
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[#0050c8] dark:text-blue-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book Appointment</span>
                      </button>

                      {onUpdateOfficial && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingOfficial(official);
                            setEditOfficialForm({ ...official });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ADD HIGHER-UP OFFICIAL MODAL */}
          {showAddOfficialModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-[#151c28] rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                  <div className="flex items-center gap-2.5 text-[#0050c8] dark:text-blue-400">
                    <Building2 className="w-6 h-6" />
                    <div>
                      <h3 className="text-base font-black text-[#121c28] dark:text-white">
                        Add Higher-Up Official (Admin Registry)
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Register new municipal authority with full contact and appointment settings
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddOfficialModal(false)}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newOfficialForm.name.trim()) return;
                    if (onAddOfficial) {
                      onAddOfficial(newOfficialForm);
                    }
                    setShowAddOfficialModal(false);
                    setNewOfficialForm({
                      name: '',
                      role: 'Ward Councilor',
                      title: 'Councilor',
                      department: 'Urban Governance & Public Infrastructure',
                      jurisdiction: 'Bengaluru Central (Ward 112)',
                      avatar:
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                      phone: '+91 80 2297 5500',
                      alternatePhone: '+91 80 2297 5599',
                      email: 'councilor@civicfix.gov.in',
                      officeLocation: 'BBMP Ward 112 Office, MG Road',
                      roomNumber: 'Room 304, 3rd Floor',
                      officeHours: 'Mon - Fri, 10:00 AM - 1:30 PM',
                      availableModes: ['in-person', 'video', 'phone'],
                      nextAvailableSlot: 'Tomorrow at 11:00 AM',
                      appointmentSlots: ['10:00 AM', '11:00 AM', '12:00 PM', '02:30 PM', '03:30 PM'],
                      escalationSpecialties: ['Road Redressal', 'Drainage', 'Sanitation Disputes'],
                      rating: 4.8,
                      bio: 'Dedicated municipal representative addressing civic escalations and citizen petitions.',
                    });
                  }}
                  className="space-y-4 text-xs"
                >
                  {/* Section 1: Identity */}
                  <div className="space-y-2 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl border border-gray-200/60 dark:border-gray-700">
                    <span className="font-extrabold text-[11px] text-[#0050c8] dark:text-blue-400 uppercase tracking-wider block">
                      1. Official Profile & Department
                    </span>

                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300 block">Official Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. K. Rajesh, IAS"
                        value={newOfficialForm.name}
                        onChange={(e) => setNewOfficialForm({ ...newOfficialForm, name: e.target.value })}
                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 block">Designation / Role *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Commissioner / Ward Councilor"
                          value={newOfficialForm.role}
                          onChange={(e) =>
                            setNewOfficialForm({ ...newOfficialForm, role: e.target.value, title: e.target.value })
                          }
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 block">Department *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Urban Governance / PWD"
                          value={newOfficialForm.department}
                          onChange={(e) => setNewOfficialForm({ ...newOfficialForm, department: e.target.value })}
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 block">Jurisdiction Wards</label>
                        <input
                          type="text"
                          placeholder="e.g. Wards 110-125 / City-Wide"
                          value={newOfficialForm.jurisdiction}
                          onChange={(e) => setNewOfficialForm({ ...newOfficialForm, jurisdiction: e.target.value })}
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 block">Avatar Photo URL</label>
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/..."
                          value={newOfficialForm.avatar}
                          onChange={(e) => setNewOfficialForm({ ...newOfficialForm, avatar: e.target.value })}
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Contact Details */}
                  <div className="space-y-2 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl border border-gray-200/60 dark:border-gray-700">
                    <span className="font-extrabold text-[11px] text-[#0050c8] dark:text-blue-400 uppercase tracking-wider block">
                      2. Direct Contact Details
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 block">Direct Official Phone *</label>
                        <input
                          type="tel"
                          required
                          placeholder="+91 80 2297 5000"
                          value={newOfficialForm.phone}
                          onChange={(e) => setNewOfficialForm({ ...newOfficialForm, phone: e.target.value })}
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 block">Alternate / WhatsApp Phone</label>
                        <input
                          type="tel"
                          placeholder="+91 80 2297 5099"
                          value={newOfficialForm.alternatePhone || ''}
                          onChange={(e) => setNewOfficialForm({ ...newOfficialForm, alternatePhone: e.target.value })}
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 block">Official Government Email *</label>
                        <input
                          type="email"
                          required
                          placeholder="official@civicfix.gov.in"
                          value={newOfficialForm.email}
                          onChange={(e) => setNewOfficialForm({ ...newOfficialForm, email: e.target.value })}
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 block">Room / Floor Number</label>
                        <input
                          type="text"
                          placeholder="e.g. Room 304, 3rd Floor"
                          value={newOfficialForm.roomNumber || ''}
                          onChange={(e) => setNewOfficialForm({ ...newOfficialForm, roomNumber: e.target.value })}
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300 block">Office Building / Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Corporation Circle, Head Office, Bangalore"
                        value={newOfficialForm.officeLocation}
                        onChange={(e) => setNewOfficialForm({ ...newOfficialForm, officeLocation: e.target.value })}
                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Section 3: Appointments & Visiting Hours */}
                  <div className="space-y-2 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl border border-gray-200/60 dark:border-gray-700">
                    <span className="font-extrabold text-[11px] text-[#0050c8] dark:text-blue-400 uppercase tracking-wider block">
                      3. Appointment Schedule & Visiting Hours
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 block">Visiting Hours</label>
                        <input
                          type="text"
                          placeholder="e.g. Mon - Fri, 10:00 AM - 1:30 PM"
                          value={newOfficialForm.officeHours || ''}
                          onChange={(e) => setNewOfficialForm({ ...newOfficialForm, officeHours: e.target.value })}
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 block">Next Available Slot</label>
                        <input
                          type="text"
                          placeholder="e.g. Tomorrow at 11:00 AM"
                          value={newOfficialForm.nextAvailableSlot}
                          onChange={(e) => setNewOfficialForm({ ...newOfficialForm, nextAvailableSlot: e.target.value })}
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300 block">
                        Appointment Time Slots (comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder="10:00 AM, 11:00 AM, 12:00 PM, 02:30 PM, 03:30 PM"
                        value={newOfficialForm.appointmentSlots?.join(', ') || ''}
                        onChange={(e) =>
                          setNewOfficialForm({
                            ...newOfficialForm,
                            appointmentSlots: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300 block">Brief Bio & Portfolios</label>
                    <textarea
                      rows={2}
                      value={newOfficialForm.bio}
                      onChange={(e) => setNewOfficialForm({ ...newOfficialForm, bio: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => setShowAddOfficialModal(false)}
                      className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#0050c8] hover:bg-[#1d68f2] text-white font-bold shadow-md transition-all cursor-pointer"
                    >
                      Save Official to Registry
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EDIT HIGHER-UP OFFICIAL MODAL */}
          {editingOfficial && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-[#151c28] rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                  <div className="flex items-center gap-2.5 text-[#0050c8] dark:text-blue-400">
                    <Edit2 className="w-5 h-5" />
                    <div>
                      <h3 className="text-base font-black text-[#121c28] dark:text-white">
                        Edit Official & Appointment Settings
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Update contact details, hours, and appointment slots for {editingOfficial.name}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingOfficial(null)}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (onUpdateOfficial && editingOfficial) {
                      onUpdateOfficial(editingOfficial.id, editOfficialForm);
                    }
                    setEditingOfficial(null);
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="space-y-2 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl border border-gray-200/60 dark:border-gray-700">
                    <span className="font-extrabold text-[11px] text-[#0050c8] dark:text-blue-400 uppercase tracking-wider block">
                      Official Information
                    </span>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300 block">Full Name</label>
                      <input
                        type="text"
                        required
                        value={editOfficialForm.name || ''}
                        onChange={(e) => setEditOfficialForm({ ...editOfficialForm, name: e.target.value })}
                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 block">Designation / Role</label>
                        <input
                          type="text"
                          required
                          value={editOfficialForm.role || ''}
                          onChange={(e) => setEditOfficialForm({ ...editOfficialForm, role: e.target.value })}
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 block">Department</label>
                        <input
                          type="text"
                          required
                          value={editOfficialForm.department || ''}
                          onChange={(e) => setEditOfficialForm({ ...editOfficialForm, department: e.target.value })}
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl border border-gray-200/60 dark:border-gray-700">
                    <span className="font-extrabold text-[11px] text-[#0050c8] dark:text-blue-400 uppercase tracking-wider block">
                      Direct Contact Details
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 block">Direct Official Phone</label>
                        <input
                          type="tel"
                          required
                          value={editOfficialForm.phone || ''}
                          onChange={(e) => setEditOfficialForm({ ...editOfficialForm, phone: e.target.value })}
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 block">Alternate / WhatsApp Phone</label>
                        <input
                          type="tel"
                          value={editOfficialForm.alternatePhone || ''}
                          onChange={(e) => setEditOfficialForm({ ...editOfficialForm, alternatePhone: e.target.value })}
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 block">Official Email</label>
                        <input
                          type="email"
                          required
                          value={editOfficialForm.email || ''}
                          onChange={(e) => setEditOfficialForm({ ...editOfficialForm, email: e.target.value })}
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 block">Room / Floor</label>
                        <input
                          type="text"
                          value={editOfficialForm.roomNumber || ''}
                          onChange={(e) => setEditOfficialForm({ ...editOfficialForm, roomNumber: e.target.value })}
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300 block">Office Location Address</label>
                      <input
                        type="text"
                        value={editOfficialForm.officeLocation || ''}
                        onChange={(e) => setEditOfficialForm({ ...editOfficialForm, officeLocation: e.target.value })}
                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl border border-gray-200/60 dark:border-gray-700">
                    <span className="font-extrabold text-[11px] text-[#0050c8] dark:text-blue-400 uppercase tracking-wider block">
                      Appointments & Visiting Hours
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 block">Visiting Hours</label>
                        <input
                          type="text"
                          value={editOfficialForm.officeHours || ''}
                          onChange={(e) => setEditOfficialForm({ ...editOfficialForm, officeHours: e.target.value })}
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-gray-700 dark:text-gray-300 block">Next Available Slot</label>
                        <input
                          type="text"
                          value={editOfficialForm.nextAvailableSlot || ''}
                          onChange={(e) => setEditOfficialForm({ ...editOfficialForm, nextAvailableSlot: e.target.value })}
                          className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300 block">
                        Appointment Time Slots (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={editOfficialForm.appointmentSlots?.join(', ') || ''}
                        onChange={(e) =>
                          setEditOfficialForm({
                            ...editOfficialForm,
                            appointmentSlots: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => setEditingOfficial(null)}
                      className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#0050c8] hover:bg-[#1d68f2] text-white font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SCHEDULE CITIZEN APPOINTMENT WITH OFFICIAL MODAL */}
          {schedulingOfficial && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-[#151c28] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                  <div className="flex items-center gap-2.5 text-[#0050c8] dark:text-blue-400">
                    <Calendar className="w-5 h-5" />
                    <div>
                      <h3 className="text-base font-black text-[#121c28] dark:text-white">
                        Book Appointment for Citizen
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Official: {schedulingOfficial.name} ({schedulingOfficial.role})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSchedulingOfficial(null)}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!scheduleAppointmentForm.citizenName.trim()) return;
                    if (onBookOfficialAppointment && schedulingOfficial) {
                      onBookOfficialAppointment({
                        citizenName: scheduleAppointmentForm.citizenName,
                        citizenEmail: scheduleAppointmentForm.citizenEmail,
                        citizenPhone: scheduleAppointmentForm.citizenPhone,
                        officialId: schedulingOfficial.id,
                        officialName: schedulingOfficial.name,
                        officialRole: schedulingOfficial.role,
                        department: schedulingOfficial.department,
                        date: scheduleAppointmentForm.date,
                        timeSlot: scheduleAppointmentForm.timeSlot,
                        mode: scheduleAppointmentForm.mode,
                        meetingMode: scheduleAppointmentForm.mode,
                        locationOrLink: schedulingOfficial.officeLocation || 'BBMP Main Chamber',
                        purpose: scheduleAppointmentForm.purpose,
                        agenda: scheduleAppointmentForm.agenda,
                        status: 'confirmed',
                      });
                    }
                    setSchedulingOfficial(null);
                  }}
                  className="space-y-3.5 text-xs"
                >
                  <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex items-center gap-3">
                    <img
                      src={schedulingOfficial.avatar}
                      alt={schedulingOfficial.name}
                      className="w-11 h-11 rounded-xl object-cover border border-blue-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white text-xs">{schedulingOfficial.name}</h4>
                      <p className="text-[11px] text-[#0050c8] dark:text-blue-400 font-semibold">{schedulingOfficial.role}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        Visiting: {schedulingOfficial.officeHours || 'Mon - Fri, 10:00 AM - 1:30 PM'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300 block">Citizen Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Narayan"
                      value={scheduleAppointmentForm.citizenName}
                      onChange={(e) =>
                        setScheduleAppointmentForm({ ...scheduleAppointmentForm, citizenName: e.target.value })
                      }
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300 block">Citizen Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="citizen@example.com"
                        value={scheduleAppointmentForm.citizenEmail}
                        onChange={(e) =>
                          setScheduleAppointmentForm({ ...scheduleAppointmentForm, citizenEmail: e.target.value })
                        }
                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300 block">Citizen Phone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98450 12345"
                        value={scheduleAppointmentForm.citizenPhone}
                        onChange={(e) =>
                          setScheduleAppointmentForm({ ...scheduleAppointmentForm, citizenPhone: e.target.value })
                        }
                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300 block">Appointment Date *</label>
                      <input
                        type="date"
                        required
                        value={scheduleAppointmentForm.date}
                        onChange={(e) =>
                          setScheduleAppointmentForm({ ...scheduleAppointmentForm, date: e.target.value })
                        }
                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 dark:text-gray-300 block">Time Slot *</label>
                      <select
                        value={scheduleAppointmentForm.timeSlot}
                        onChange={(e) =>
                          setScheduleAppointmentForm({ ...scheduleAppointmentForm, timeSlot: e.target.value })
                        }
                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        {(schedulingOfficial.appointmentSlots || [
                          '10:00 AM',
                          '10:30 AM',
                          '11:00 AM',
                          '11:30 AM',
                          '12:00 PM',
                          '02:30 PM',
                          '03:00 PM',
                          '03:30 PM',
                        ]).map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300 block">Meeting Mode</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'in-person', label: '🏛 Chamber', desc: 'In-Person' },
                        { id: 'video', label: '📹 Video', desc: 'Video Call' },
                        { id: 'phone', label: '📞 Phone', desc: 'Direct Call' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            setScheduleAppointmentForm({
                              ...scheduleAppointmentForm,
                              mode: m.id as 'in-person' | 'video' | 'phone',
                            })
                          }
                          className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                            scheduleAppointmentForm.mode === m.id
                              ? 'border-[#0050c8] bg-blue-50 dark:bg-blue-900/40 text-[#0050c8] dark:text-blue-300 ring-2 ring-blue-500/20'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="text-xs">{m.label}</div>
                          <div className="text-[10px] font-normal text-gray-500">{m.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300 block">
                      Grievance Agenda / Reason for Meeting *
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Specify the civic escalation, ward issue, or petition details..."
                      value={scheduleAppointmentForm.agenda}
                      onChange={(e) =>
                        setScheduleAppointmentForm({ ...scheduleAppointmentForm, agenda: e.target.value })
                      }
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => setSchedulingOfficial(null)}
                      className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#0050c8] hover:bg-[#1d68f2] text-white font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Confirm & Schedule</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: ADMIN ID PROVISIONING & GOVERNANCE */}
      {activeSection === 'admin_provisioning' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Statutory Authority Header Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-slate-700 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Administrative Access Governance Protocol</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Admin ID Minting & Provisioning Center
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Per municipal statutory guidelines, <strong>Admin IDs cannot be self-registered</strong>. If any officer, department head, or inspector requires an administrative ID, it must be officially created, provisioned, and distributed by the active Administrator.
                </p>
              </div>

              {/* Master Admin Identity Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-center gap-3.5 shrink-0">
                <div className="relative">
                  <img
                    src={adminUser?.avatar || DEDICATED_ADMIN_ACCOUNT.avatar}
                    alt={adminUser?.name || 'Administrator'}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-400"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-extrabold flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    <span>Active Master Administrator</span>
                  </div>
                  <h4 className="text-sm font-bold text-white leading-tight">
                    {adminUser?.name || DEDICATED_ADMIN_ACCOUNT.name}
                  </h4>
                  <p className="text-[11px] text-slate-300 font-mono">
                    saikatkoner4@gmail.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Provisioning Success Credential Slip Modal / Banner */}
          {provisionSuccessSlip && (
            <div className="bg-emerald-950/80 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-7 text-white shadow-xl space-y-4 animate-in zoom-in-95">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      Official Municipal Admin Credentials Slip Generated
                    </h3>
                    <p className="text-xs text-emerald-200">
                      Successfully minted and authorized new City Official credentials. Hand over these details to the designated official.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const slip = provisionSuccessSlip;
                      const text = `=========================================\nCIVICFIX MUNICIPAL DISPATCH - ADMIN PASS\n=========================================\nAuthorized Official: ${slip.name}\nPermanent Admin ID:   ${slip.permanentUserId || slip.id}\nDepartment:           ${slip.district}\nOfficial Email:       ${slip.email}\nInitial Password:     ${slip.password}\nMaster 4-Digit PIN:   ${slip.adminPin || slip.pin || '2264'}\nLogin URL:            ${window.location.origin}\nProvisioned By:       ${adminUser?.name || 'Saikat Koner (Executive Admin)'}\n=========================================`;
                      navigator.clipboard?.writeText(text);
                      setCopiedSlip(true);
                      setTimeout(() => setCopiedSlip(false), 2500);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    {copiedSlip ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSlip ? 'Copied Slip to Clipboard!' : 'Copy Official Slip'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProvisionSuccessSlip(null)}
                    className="w-8 h-8 rounded-xl bg-emerald-900/50 hover:bg-emerald-900 text-emerald-300 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Credential Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-black/30 p-4 rounded-2xl border border-emerald-500/20 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-emerald-400 font-sans uppercase font-bold block">Permanent Admin ID</span>
                  <span className="text-amber-300 font-extrabold text-sm">{provisionSuccessSlip.permanentUserId || provisionSuccessSlip.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 font-sans uppercase font-bold block">Official Login Email</span>
                  <span className="text-white font-bold">{provisionSuccessSlip.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 font-sans uppercase font-bold block">Initial Password</span>
                  <span className="text-amber-200 font-extrabold text-sm bg-black/40 px-2 py-0.5 rounded">{provisionSuccessSlip.password}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 font-sans uppercase font-bold block">Security Master PIN</span>
                  <span className="text-emerald-300 font-extrabold text-sm bg-black/40 px-2 py-0.5 rounded">{provisionSuccessSlip.adminPin || '2264'}</span>
                </div>
              </div>

              <div className="text-[11px] text-emerald-300 bg-emerald-900/40 p-3 rounded-xl border border-emerald-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>
                  The designated official can immediately switch to the <strong>"City Official (Admin)"</strong> portal and sign in with the email & password above.
                </span>
              </div>
            </div>
          )}

          {/* Grid Layout: Provisioning Form (Left) & Active Admin Roster (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* FORM: Provision New Admin ID */}
            <div className="lg:col-span-5 bg-white dark:bg-[#151c28] rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 space-y-5">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-[#0050c8] dark:text-blue-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">
                    Provision New Admin ID
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Authorize a new Municipal Commissioner, Engineer, or Zonal Director
                  </p>
                </div>
              </div>

              {provisionError && (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{provisionError}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setProvisionError(null);
                  setIsProvisioning(true);

                  const res = provisionNewAdminByPreviousAdmin({
                    name: provisionName.trim(),
                    email: provisionEmail.trim(),
                    password: provisionPassword.trim(),
                    pin: provisionPin.trim(),
                    department: provisionDepartment.trim(),
                    district: provisionDistrict.trim(),
                    phone: provisionPhone.trim(),
                  });

                  setIsProvisioning(false);
                  if (!res.success || !res.adminAccount) {
                    setProvisionError(res.error || 'Failed to provision admin account.');
                    return;
                  }

                  confetti({ particleCount: 50, spread: 60 });
                  setProvisionSuccessSlip(res.adminAccount);
                  setAdminUsersList(getRegisteredUsers().filter((u) => u.role === 'admin'));
                  setProvisionName('');
                  setProvisionEmail('');
                }}
                className="space-y-4 text-xs"
              >
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300 block">
                    Official Full Name & Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Priya Varma (Zonal Health Officer)"
                    value={provisionName}
                    onChange={(e) => setProvisionName(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300 block">
                    Official Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="official.name@civicfix.gov"
                    value={provisionEmail}
                    onChange={(e) => setProvisionEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <p className="text-[10px] text-gray-500">This email will be used as the administrator login identifier.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300 block">
                      Initial Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showProvisionPassword ? 'text' : 'password'}
                        required
                        value={provisionPassword}
                        onChange={(e) => setProvisionPassword(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowProvisionPassword(!showProvisionPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 text-[11px] font-bold cursor-pointer"
                      >
                        {showProvisionPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300 block">
                      Admin Security PIN *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={provisionPin}
                      onChange={(e) => setProvisionPin(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-center tracking-widest font-black"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300 block">
                    Department / Directorate
                  </label>
                  <select
                    value={provisionDepartment}
                    onChange={(e) => setProvisionDepartment(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="Public Works & Urban Infrastructure Directorate">Public Works & Urban Infrastructure Directorate</option>
                    <option value="Solid Waste Management & City Sanitation Division">Solid Waste Management & City Sanitation Division</option>
                    <option value="Water Supply, Stormwater & Sewerage Board">Water Supply, Stormwater & Sewerage Board</option>
                    <option value="Zonal Revenue & Regulatory Enforcement">Zonal Revenue & Regulatory Enforcement</option>
                    <option value="Smart City Operations & Command Center">Smart City Operations & Command Center</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300 block">Jurisdiction Ward</label>
                    <input
                      type="text"
                      value={provisionDistrict}
                      onChange={(e) => setProvisionDistrict(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300 block">Official Contact Line</label>
                    <input
                      type="text"
                      value={provisionPhone}
                      onChange={(e) => setProvisionPhone(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProvisioning}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isProvisioning ? 'Authorizing & Minting...' : 'Mint & Authorize Official Admin ID'}</span>
                </button>
              </form>
            </div>

            {/* ROSTER: Authorized Municipal Administrators */}
            <div className="lg:col-span-7 bg-white dark:bg-[#151c28] rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white">
                      Authorized Administrators Roster ({adminUsersList.length})
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      All provisioned municipal admin identities holding dispatch privileges
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAdminUsersList(getRegisteredUsers().filter((u) => u.role === 'admin'))}
                  className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  title="Refresh Roster"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Administrator Cards */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {adminUsersList.map((adm) => {
                  const isMasterAdmin =
                    adm.email.toLowerCase() === 'saikatkoner4@gmail.com' || adm.id === 'CFX-ADM-0001-HQ';

                  return (
                    <div
                      key={adm.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isMasterAdmin
                          ? 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                          : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={adm.avatar}
                            alt={adm.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-gray-300 dark:border-gray-700 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
                                {adm.name}
                              </h4>
                              {isMasterAdmin ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white uppercase tracking-wider">
                                  Primary Admin
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                                  Provisioned Admin
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {adm.district || 'Municipal Executive Directorate'}
                            </p>
                          </div>
                        </div>

                        <div className="text-left sm:text-right space-y-1">
                          <div className="inline-block px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300 font-mono text-xs font-black">
                            {adm.permanentUserId || adm.id}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                            {adm.email}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200/60 dark:border-gray-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3 text-emerald-500" />
                            <span>Security PIN: <strong>{adm.adminPin || adm.pin || '2264'}</strong></span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{adm.phone || '+91 80 2297 5500'}</span>
                          </span>
                        </div>

                        <span className="text-[10px] text-gray-400">
                          Authorized: {new Date(adm.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESOLVE / REPAIR PHOTO MODAL FOR ADMIN */}
      {selectedIssueForAction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#c2c6d7] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[#10B981]">
                <CheckCircle2 className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-bold text-[#121c28]">Mark Case Fixed & Verified</h3>
                  <p className="text-xs text-[#737686]">{selectedIssueForAction.code}: {selectedIssueForAction.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedIssueForAction(null)}
                className="p-2 rounded-full text-[#737686] hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-1">
                  Official Municipal Work Log
                </label>
                <textarea
                  rows={3}
                  required
                  value={officialNote}
                  onChange={(e) => setOfficialNote(e.target.value)}
                  placeholder="e.g. Crew #4 hot-asphalt sealed and leveled road surface. Traffic cleared."
                  className="w-full px-3 py-2 rounded-xl border border-[#c2c6d7] text-xs focus:ring-2 focus:ring-[#10B981]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-1">
                  Repaired Proof Image URL
                </label>
                <input
                  type="url"
                  required
                  value={repairImageUrl}
                  onChange={(e) => setRepairImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#c2c6d7] text-xs"
                />
                <img
                  src={repairImageUrl}
                  alt="Repaired preview"
                  className="w-full h-32 object-cover rounded-xl mt-2 border border-[#c2c6d7]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIssueForAction(null)}
                  className="px-4 py-2 rounded-xl border border-[#c2c6d7] text-xs font-bold text-[#424655]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold shadow-md transition-colors"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Field Crew Contractor Dispatch Modal */}
      {dispatchingIssue && (
        <CrewDispatchModal
          issue={dispatchingIssue}
          onClose={() => setDispatchingIssue(null)}
          onConfirmDispatch={handleConfirmDispatch}
        />
      )}

      {/* Work Order Batch & Audit Manifest Export Modal */}
      {showBatchExportModal && (
        <WorkOrderBatchExportModal
          issues={issues}
          onClose={() => setShowBatchExportModal(false)}
        />
      )}

      {/* Admin Direct Issue Database Modification Modal */}
      {editingIssueForDb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Modify Issue in PostgreSQL: {editingIssueForDb.code || editingIssueForDb.id}
                  </h3>
                  <p className="text-xs text-slate-400">Directly commit record updates to Cloud SQL table 'issues'</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingIssueForDb(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDb} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Issue Title</label>
                <input
                  type="text"
                  required
                  value={editDbForm.title || ''}
                  onChange={(e) => setEditDbForm({ ...editDbForm, title: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">Category</label>
                  <select
                    value={editDbForm.category || 'Roads'}
                    onChange={(e) => setEditDbForm({ ...editDbForm, category: e.target.value as any })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Roads">Roads</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Sanitation">Sanitation</option>
                    <option value="Parks">Parks</option>
                    <option value="Safety">Safety</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">Severity</label>
                  <select
                    value={editDbForm.severity || 'Medium'}
                    onChange={(e) => setEditDbForm({ ...editDbForm, severity: e.target.value as any })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">Status</label>
                  <select
                    value={editDbForm.status || 'open'}
                    onChange={(e) => setEditDbForm({ ...editDbForm, status: e.target.value as any })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    <option value="open">Open (Active Ticket)</option>
                    <option value="investigating">Investigating (Dispatched)</option>
                    <option value="fixed">Fixed (Certified Resolved)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">Citizen Upvotes</label>
                  <input
                    type="number"
                    min="0"
                    value={editDbForm.upvotes ?? 0}
                    onChange={(e) => setEditDbForm({ ...editDbForm, upvotes: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Address / Location</label>
                <input
                  type="text"
                  value={editDbForm.address || ''}
                  onChange={(e) => setEditDbForm({ ...editDbForm, address: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Description</label>
                <textarea
                  rows={3}
                  value={editDbForm.description || ''}
                  onChange={(e) => setEditDbForm({ ...editDbForm, description: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="px-2 py-2 bg-blue-50 text-blue-800 rounded-xl border border-blue-200 text-[11px] flex items-center gap-2">
                <Database className="w-4 h-4 shrink-0 text-blue-600" />
                <span>Submitting this form executes an SQL <code>UPDATE</code> statement in Cloud SQL PostgreSQL.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingIssueForDb(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDbIssue}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingDbIssue ? 'Saving...' : 'Save to PostgreSQL'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN DELETE ISSUE CONFIRMATION MODAL */}
      {deletingIssue && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center border border-red-200 shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#121c28]">Delete Issue from Database</h3>
                <p className="text-xs text-red-600 font-bold">Cloud SQL PostgreSQL Action</p>
              </div>
            </div>

            <div className="bg-red-50/60 p-3.5 rounded-xl border border-red-100 text-xs text-[#424655] space-y-1.5">
              <p>
                Are you sure you want to permanently delete{' '}
                <span className="font-black text-[#121c28]">
                  #{deletingIssue.code || deletingIssue.title}
                </span>?
              </p>
              <p className="text-[11px] text-gray-500">
                Title: &ldquo;{deletingIssue.title}&rdquo; &bull; Category: {deletingIssue.category}
              </p>
              <p className="text-[11px] text-red-700 font-semibold">
                This will delete the issue record along with all associated comments and verification upvotes. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingIssue(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting from DB...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP CONFIRM MODAL: DELETE OFFICIAL */}
      {deletingOfficial && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 dark:border-red-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center border border-red-200 dark:border-red-800 shrink-0">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#121c28] dark:text-white">Remove Official from Directory</h3>
                <p className="text-xs text-red-600 dark:text-red-400 font-bold">Municipal Council & Officer Registry</p>
              </div>
            </div>

            <div className="bg-red-50/60 dark:bg-red-950/30 p-3.5 rounded-xl border border-red-100 dark:border-red-900 text-xs text-[#424655] dark:text-gray-300 space-y-1.5">
              <p>
                Are you sure you want to remove <span className="font-black text-[#121c28] dark:text-white">{deletingOfficial.name}</span> ({deletingOfficial.role}) from the official municipal contact directory?
              </p>
              <p className="text-[11px] text-gray-500">
                Department: {deletingOfficial.department} &bull; Jurisdiction: {deletingOfficial.jurisdiction}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingOfficial(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteOfficial && deletingOfficial) {
                    onDeleteOfficial(deletingOfficial.id);
                    setDeletingOfficial(null);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP CONFIRM MODAL: ADMIN RESEED DATABASE */}
      {showAdminReseedConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 dark:border-amber-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center border border-amber-200 dark:border-amber-800 shrink-0">
                <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#121c28] dark:text-white">Reseed PostgreSQL Database</h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">Cloud SQL Reset Action</p>
              </div>
            </div>

            <div className="bg-amber-50/60 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900 text-xs text-[#424655] dark:text-gray-300 space-y-1.5">
              <p>
                Reset and re-seed the PostgreSQL database with fresh verified civic defect records, GPS coordinates, and historical timelines?
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                User accounts and registered login credentials will remain intact.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdminReseedConfirm(false)}
                disabled={reseedLoading}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onReseedDatabase) {
                    setReseedLoading(true);
                    try {
                      await onReseedDatabase();
                    } finally {
                      setReseedLoading(false);
                      setShowAdminReseedConfirm(false);
                    }
                  }
                }}
                disabled={reseedLoading}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${reseedLoading ? 'animate-spin' : ''}`} />
                <span>{reseedLoading ? 'Reseeding...' : 'Confirm Reseed'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
