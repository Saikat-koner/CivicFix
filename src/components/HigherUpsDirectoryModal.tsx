import React, { useState } from 'react';
import {
  X,
  Building2,
  Phone,
  Mail,
  Calendar,
  ShieldAlert,
  Award,
  Clock,
  CheckCircle2,
  FileText,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Filter,
  Plus,
  Send,
  Video
} from 'lucide-react';
import {
  HigherUpOfficial,
  CivicIssue,
  MunicipalAppointment,
  GrievancePetition
} from '../types';
import confetti from 'canvas-confetti';

interface HigherUpsDirectoryModalProps {
  isOpen?: boolean;
  onClose: () => void;
  officials: HigherUpOfficial[];
  issues: CivicIssue[];
  appointments: MunicipalAppointment[];
  grievances: GrievancePetition[];
  onOpenBookAppointment?: (official?: HigherUpOfficial, issueId?: string) => void;
  onBookAppointment?: (official?: any, issue?: any) => void;
  onSubmitGrievance?: (grievance: any) => void;
  onFileGrievance?: (issueId: any, data: any) => void;
}

export const HigherUpsDirectoryModal: React.FC<HigherUpsDirectoryModalProps> = ({
  isOpen = true,
  onClose,
  officials,
  issues,
  appointments,
  grievances,
  onOpenBookAppointment,
  onBookAppointment,
  onSubmitGrievance,
  onFileGrievance,
}) => {
  const handleBookingTrigger = (official?: HigherUpOfficial, issueId?: string) => {
    if (onBookAppointment) {
      const matchedIssue = issues.find((i) => i.id === issueId);
      onBookAppointment(official, matchedIssue);
    } else if (onOpenBookAppointment) {
      onOpenBookAppointment(official, issueId);
    }
  };

  const handleGrievanceSubmitTrigger = (payload: any) => {
    if (onFileGrievance) {
      onFileGrievance(payload.issueId, payload);
    } else if (onSubmitGrievance) {
      onSubmitGrievance(payload);
    }
  };

  const [activeTab, setActiveTab] = useState<'directory' | 'petitions' | 'my_appointments' | 'file_grievance'>('directory');
  const [selectedOfficialForGrievance, setSelectedOfficialForGrievance] = useState<string>(
    officials.length > 0 ? officials[0].id : ''
  );
  const [selectedIssueId, setSelectedIssueId] = useState<string>(issues[0]?.id || '');
  const [escalationType, setEscalationType] = useState<GrievancePetition['escalationType']>('poor_quality_fix');
  const [severity, setSeverity] = useState<'Urgent' | 'High' | 'Critical'>('High');
  const [dissatisfactionReason, setDissatisfactionReason] = useState<string>(
    'The initial repair work has degraded within 48 hours and the area remains hazardous for pedestrians and road users.'
  );
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGrievanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetOfficial = officials.find((o) => o.id === selectedOfficialForGrievance) || officials[0];
    const targetIssue = issues.find((i) => i.id === selectedIssueId) || issues[0];

    handleGrievanceSubmitTrigger({
      issueId: targetIssue.id,
      issueCode: targetIssue.code,
      issueTitle: targetIssue.title,
      citizenName: 'Alex Rivera',
      targetHigherUpId: targetOfficial.id,
      targetHigherUpName: targetOfficial.name,
      targetHigherUpRole: targetOfficial.role,
      dissatisfactionReason,
      escalationType,
      severity,
      adminRemarks: 'Petition automatically routed to the Higher Authority Executive Desk for 24-hr review.',
    });

    setSubmittedSuccess(true);
    confetti({ particleCount: 80, spread: 60 });
    setTimeout(() => {
      setSubmittedSuccess(false);
      setActiveTab('petitions');
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-[#c2c6d7] relative my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#c2c6d7] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0050c8] text-white flex items-center justify-center shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-[#121c28]">
                  Municipal Higher-Ups & Grievance Redressal
                </h2>
                <span className="px-2 py-0.5 bg-[#dcfce7] text-[#15803d] font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                  Direct City Access
                </span>
              </div>
              <p className="text-xs text-[#56596e]">
                Contact executive authorities, dispute unsatisfactory repairs, and book official hearings.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#737686] hover:text-[#121c28] hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-gray-100 flex-shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'directory'
                ? 'bg-[#0050c8] text-white shadow-xs'
                : 'text-[#424655] hover:bg-gray-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Higher Authorities ({officials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('file_grievance')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'file_grievance'
                ? 'bg-[#0050c8] text-white shadow-xs'
                : 'text-[#424655] hover:bg-gray-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#f88400]" />
            <span>File Grievance Petition</span>
          </button>

          <button
            onClick={() => setActiveTab('petitions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'petitions'
                ? 'bg-[#0050c8] text-white shadow-xs'
                : 'text-[#424655] hover:bg-gray-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Active Petitions ({grievances.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('my_appointments')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'my_appointments'
                ? 'bg-[#0050c8] text-white shadow-xs'
                : 'text-[#424655] hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Booked Hearings ({appointments.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* TAB 1: DIRECTORY OF HIGHER AUTHORITIES */}
          {activeTab === 'directory' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#eef4ff] rounded-xl border border-[#dae2ff] text-xs text-[#0050c8] flex items-center justify-between">
                <span>
                  <strong>Need Direct Action?</strong> If your civic problem remains unresolved after 3 days or you are unsatisfied with the repair quality, escalate directly below.
                </span>
                <button
                  onClick={() => onOpenBookAppointment()}
                  className="px-3 py-1.5 bg-[#0050c8] hover:bg-[#1d68f2] text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors shrink-0 ml-2"
                >
                  Book Hearing
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {officials.map((official) => (
                  <div
                    key={official.id}
                    className="p-4 rounded-xl border border-[#c2c6d7] bg-white hover:border-[#0050c8] transition-all shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start gap-3">
                        <img
                          src={official.avatar}
                          alt={official.name}
                          className="w-14 h-14 rounded-xl object-cover border border-[#c2c6d7] shadow-xs"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-black text-[#121c28] truncate">{official.name}</h3>
                          </div>
                          <p className="text-xs font-bold text-[#0050c8]">{official.role}</p>
                          <p className="text-[11px] text-[#737686] truncate">{official.department}</p>
                          <p className="text-[10px] text-[#424655] font-medium mt-0.5">
                            📍 {official.officeLocation}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-[#424655] mt-2.5 line-clamp-2 italic">
                        "{official.bio}"
                      </p>

                      {/* Escalation Specialties */}
                      <div className="mt-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#737686] block mb-1">
                          Escalation Jurisdiction:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {official.escalationSpecialties.map((spec, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-[#f0f2f8] text-[#121c28] text-[10px] font-semibold rounded-md border border-[#e2e5f1]"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <a
                          href={`tel:${official.phone}`}
                          className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[#121c28] hover:bg-[#0050c8] hover:text-white transition-colors"
                          title="Call Hotline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`mailto:${official.email}`}
                          className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[#121c28] hover:bg-[#0050c8] hover:text-white transition-colors"
                          title="Direct Official Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                        <span className="text-[10px] text-[#15803d] font-bold bg-[#dcfce7] px-2 py-0.5 rounded-full">
                          Slot: {official.nextAvailableSlot}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedOfficialForGrievance(official.id);
                            setActiveTab('file_grievance');
                          }}
                          className="px-2.5 py-1.5 bg-white border border-[#f88400] text-[#f88400] hover:bg-[#fff7ed] text-xs font-bold rounded-lg transition-colors"
                        >
                          File Petition
                        </button>
                        <button
                          onClick={() => handleBookingTrigger(official)}
                          className="px-3 py-1.5 bg-[#0050c8] hover:bg-[#1d68f2] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Book Meeting</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: FILE GRIEVANCE PETITION */}
          {activeTab === 'file_grievance' && (
            <div className="bg-white rounded-xl border border-[#c2c6d7] p-5">
              {submittedSuccess ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-[#10B981] text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-extrabold text-[#121c28]">Grievance Petition Submitted!</h3>
                  <p className="text-xs text-[#56596e]">
                    Your case has been flagged with Critical Priority and assigned to the Municipal Ombudsman.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleGrievanceSubmit} className="space-y-4">
                  <div className="flex items-center gap-2.5 text-[#f88400]">
                    <div className="w-8 h-8 rounded-lg bg-[#fff7ed] text-[#ea580c] flex items-center justify-center">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-[#121c28]">
                        Submit Expedited Grievance Petition to Higher Authority
                      </h3>
                      <p className="text-xs text-[#737686]">
                        Formally challenge a dismissed report, deficient repair, or unattended civic hazard.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-1">
                        Select Target Higher Authority
                      </label>
                      <select
                        value={selectedOfficialForGrievance}
                        onChange={(e) => setSelectedOfficialForGrievance(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#c2c6d7] text-xs font-medium focus:ring-2 focus:ring-[#0050c8] bg-white"
                      >
                        {officials.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name} — {o.role}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-1">
                        Link Problem / Civic Case
                      </label>
                      <select
                        value={selectedIssueId}
                        onChange={(e) => setSelectedIssueId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#c2c6d7] text-xs font-medium focus:ring-2 focus:ring-[#0050c8] bg-white"
                      >
                        {issues.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.code}: {i.title} ({i.status.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-1">
                        Grievance Category
                      </label>
                      <select
                        value={escalationType}
                        onChange={(e) => setEscalationType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-[#c2c6d7] text-xs font-medium focus:ring-2 focus:ring-[#0050c8] bg-white"
                      >
                        <option value="poor_quality_fix">Deficient / Substandard Repair Quality</option>
                        <option value="unresolved_delay">Unresolved Delay Exceeding Municipal SLA</option>
                        <option value="disputed_closure">Disputed "Fixed" Status (Hazard Still Present)</option>
                        <option value="safety_hazard">Critical Public Safety & Emergency Risk</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-1">
                        Urgency Level
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['High', 'Urgent', 'Critical'] as const).map((sev) => (
                          <button
                            key={sev}
                            type="button"
                            onClick={() => setSeverity(sev)}
                            className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                              severity === sev
                                ? sev === 'Critical'
                                  ? 'bg-[#dc2626] text-white border-[#dc2626]'
                                  : 'bg-[#0050c8] text-white border-[#0050c8]'
                                : 'bg-white border-[#c2c6d7] text-[#424655]'
                            }`}
                          >
                            {sev}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-1">
                      Dissatisfaction Evidence & Detailed Petition Statement
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={dissatisfactionReason}
                      onChange={(e) => setDissatisfactionReason(e.target.value)}
                      placeholder="Detail why the issue is not solved or why you are dissatisfied with the crew's solution..."
                      className="w-full px-3 py-2.5 rounded-xl border border-[#c2c6d7] text-xs focus:ring-2 focus:ring-[#0050c8] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('directory')}
                      className="px-4 py-2 rounded-xl border border-[#c2c6d7] text-xs font-bold text-[#424655] hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-[#0050c8] hover:bg-[#1d68f2] text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Submit Formal Petition
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: ACTIVE PETITIONS */}
          {activeTab === 'petitions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#737686] uppercase tracking-wider">
                  Citizen Grievances & Higher-Up Inquiries ({grievances.length})
                </span>
                <button
                  onClick={() => setActiveTab('file_grievance')}
                  className="px-3 py-1 bg-[#0050c8] text-white text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Petition</span>
                </button>
              </div>

              {grievances.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <p className="text-sm font-bold text-[#121c28]">No active grievance petitions</p>
                  <p className="text-xs text-[#737686]">All municipal reports are currently operating normally.</p>
                </div>
              ) : (
                grievances.map((grv) => (
                  <div
                    key={grv.id}
                    className="p-4 rounded-xl border border-[#c2c6d7] bg-white space-y-2.5 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-[#0050c8] bg-[#EDF4FF] px-2 py-0.5 rounded-md border border-[#dae2ff]">
                          {grv.petitionNumber}
                        </span>
                        <span className="text-xs font-bold text-[#121c28]">
                          Case {grv.issueCode}: {grv.issueTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            grv.status === 'action_ordered'
                              ? 'bg-[#dcfce7] text-[#15803d]'
                              : grv.status === 'under_review'
                              ? 'bg-[#fff7ed] text-[#ea580c]'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {grv.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-[#737686]">{grv.filedAt}</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="text-[#424655]">
                        <strong>Addressed to:</strong> {grv.targetHigherUpName} ({grv.targetHigherUpRole})
                      </p>
                      <p className="text-[#121c28] bg-gray-50 p-2 rounded-lg border border-gray-200 italic">
                        "{grv.dissatisfactionReason}"
                      </p>
                    </div>

                    {grv.adminRemarks && (
                      <div className="p-2.5 bg-[#f0f5ff] rounded-lg border border-[#dae2ff] text-xs text-[#0050c8] flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Official Executive Directive:</strong> {grv.adminRemarks}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: BOOKED HEARINGS / APPOINTMENTS */}
          {activeTab === 'my_appointments' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#737686] uppercase tracking-wider">
                  Upcoming Municipal Consultations ({appointments.length})
                </span>
                <button
                  onClick={() => onOpenBookAppointment()}
                  className="px-3 py-1 bg-[#0050c8] text-white text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book New Hearing</span>
                </button>
              </div>

              {appointments.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <p className="text-sm font-bold text-[#121c28]">No scheduled appointments</p>
                  <p className="text-xs text-[#737686]">Select an authority above to schedule an official briefing.</p>
                </div>
              ) : (
                appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-4 rounded-xl border border-[#c2c6d7] bg-white space-y-2.5 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                      <div>
                        <span className="text-sm font-extrabold text-[#121c28]">
                          {appt.officialName}
                        </span>
                        <span className="text-xs text-[#0050c8] block font-medium">
                          {appt.officialRole} • {appt.department}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#dcfce7] text-[#15803d] text-xs font-bold rounded-lg capitalize">
                        {appt.meetingMode === 'in-person' && <Building2 className="w-3.5 h-3.5" />}
                        {appt.meetingMode === 'video' && <Video className="w-3.5 h-3.5" />}
                        {appt.meetingMode === 'phone' && <Phone className="w-3.5 h-3.5" />}
                        <span>{appt.status} • {appt.meetingMode}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[#737686] block">Date & Time:</span>
                        <span className="font-bold text-[#121c28]">
                          📅 {appt.date} at {appt.timeSlot}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#737686] block">Meeting Venue / Link:</span>
                        <span className="font-bold text-[#0050c8] truncate block">
                          📍 {appt.locationOrLink}
                        </span>
                      </div>
                      {appt.issueCode && (
                        <div className="sm:col-span-2">
                          <span className="text-[#737686] block">Subject Case:</span>
                          <span className="font-semibold text-[#121c28]">
                            {appt.issueCode} — {appt.issueTitle}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-[#f8f9ff] p-2.5 rounded-lg border border-[#dae2ff] text-xs">
                      <span className="font-bold text-[#121c28]">Agenda:</span>
                      <p className="text-[#424655] mt-0.5">{appt.agenda}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
