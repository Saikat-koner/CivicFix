import React, { useState } from 'react';
import { CivicIssue, HigherUpOfficial } from '../types';
import {
  X,
  RefreshCw,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  Building2,
  AlertCircle,
  ShieldAlert,
  Send,
  Video,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { HIGHER_UP_OFFICIALS } from '../data/mockData';

interface EscalateModalProps {
  issue: CivicIssue;
  mode: 'reopen' | 'appointment' | 'higher_up';
  onClose: () => void;
  onConfirmReopen: (issueId: string, reason: string) => void;
  onConfirmAppointment: (
    issueId: string,
    appt: { date: string; time: string; department: string; officerName: string; meetingMode?: 'in-person' | 'video' | 'phone' }
  ) => void;
  onConfirmHigherUpEscalation?: (
    issueId: string,
    data: { officialId: string; officialName: string; reason: string; severity: 'Urgent' | 'High' | 'Critical' }
  ) => void;
}

export const EscalateModal: React.FC<EscalateModalProps> = ({
  issue,
  mode: initialMode,
  onClose,
  onConfirmReopen,
  onConfirmAppointment,
  onConfirmHigherUpEscalation,
}) => {
  const [activeTab, setActiveTab] = useState<'reopen' | 'higher_up' | 'appointment'>(initialMode);
  const [reopenReason, setReopenReason] = useState(
    'The road surface patch is uneven and already crumbling under heavy vehicle traffic.'
  );
  const [selectedOfficialId, setSelectedOfficialId] = useState<string>(HIGHER_UP_OFFICIALS[0].id);
  const [selectedDate, setSelectedDate] = useState('2026-10-25');
  const [selectedTime, setSelectedTime] = useState('10:30 AM');
  const [meetingMode, setMeetingMode] = useState<'in-person' | 'video' | 'phone'>('in-person');
  const [department, setDepartment] = useState('Public Works - Street Quality Assurance');
  const [severity, setSeverity] = useState<'Urgent' | 'High' | 'Critical'>('High');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const selectedOfficial = HIGHER_UP_OFFICIALS.find((o) => o.id === selectedOfficialId) || HIGHER_UP_OFFICIALS[0];

  const handleReopenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmReopen(issue.id, reopenReason);
    setSuccessMessage('Case flagged back to Investigating status and routed to supervisor.');
    setSubmittedSuccess(true);
    confetti({ particleCount: 50, spread: 40 });
    setTimeout(onClose, 1600);
  };

  const handleHigherUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onConfirmHigherUpEscalation) {
      onConfirmHigherUpEscalation(issue.id, {
        officialId: selectedOfficial.id,
        officialName: selectedOfficial.name,
        reason: reopenReason,
        severity,
      });
    }
    setSuccessMessage(`Formal Grievance Petition registered with ${selectedOfficial.name} (${selectedOfficial.role}).`);
    setSubmittedSuccess(true);
    confetti({ particleCount: 70, spread: 50 });
    setTimeout(onClose, 1800);
  };

  const handleApptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmAppointment(issue.id, {
      date: selectedDate,
      time: selectedTime,
      department: selectedOfficial.department,
      officerName: selectedOfficial.name,
      meetingMode,
    });
    setSuccessMessage(`Consultation scheduled with ${selectedOfficial.name} on ${selectedDate} at ${selectedTime}.`);
    setSubmittedSuccess(true);
    confetti({ particleCount: 70, spread: 60 });
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-[#c2c6d7] relative my-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#737686] hover:text-[#121c28] hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedSuccess ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#10B981] text-white flex items-center justify-center mx-auto shadow-lg ring-8 ring-[#10B981]/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-extrabold text-[#121c28]">Escalation Action Processed!</h3>
            <p className="text-xs text-[#424655]">{successMessage}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header info */}
            <div>
              <span className="text-[10px] font-bold text-[#737686] uppercase tracking-wider">
                Case #{issue.code} Redressal Desk
              </span>
              <h2 className="text-xl font-black text-[#121c28] mt-0.5">
                Dissatisfied or Unresolved Problem?
              </h2>
              <p className="text-xs text-[#56596e] mt-1">
                Choose the appropriate municipal recourse level below:
              </p>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-[#f8f9ff] p-1 rounded-xl border border-[#c2c6d7]">
              <button
                type="button"
                onClick={() => setActiveTab('reopen')}
                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  activeTab === 'reopen'
                    ? 'bg-white text-[#0050c8] shadow-xs'
                    : 'text-[#56596e] hover:text-[#121c28]'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-Open Case</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('higher_up')}
                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  activeTab === 'higher_up'
                    ? 'bg-white text-[#f88400] shadow-xs'
                    : 'text-[#56596e] hover:text-[#121c28]'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Higher-Up Petition</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('appointment')}
                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  activeTab === 'appointment'
                    ? 'bg-white text-[#0050c8] shadow-xs'
                    : 'text-[#56596e] hover:text-[#121c28]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Hearing</span>
              </button>
            </div>

            {/* MODE 1: REOPEN */}
            {activeTab === 'reopen' && (
              <form onSubmit={handleReopenSubmit} className="space-y-4">
                <div className="p-3 bg-[#ffdcc4]/30 rounded-xl border border-[#f88400]/30 text-xs text-[#924c00] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Reopening an issue flags it back to "Investigating" status and requires the department to dispatch a re-audit team.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-1">
                    Reason for Dissatisfaction / Reopening
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="Explain why the current resolution is insufficient..."
                    className="w-full px-3 py-2 rounded-xl border border-[#c2c6d7] text-xs focus:ring-2 focus:ring-[#0050c8] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-[#c2c6d7] text-xs font-bold text-[#424655]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-[#0050c8] hover:bg-[#1d68f2] text-white text-xs font-bold shadow-md transition-colors"
                  >
                    Confirm Reopen
                  </button>
                </div>
              </form>
            )}

            {/* MODE 2: HIGHER-UP PETITION */}
            {activeTab === 'higher_up' && (
              <form onSubmit={handleHigherUpSubmit} className="space-y-4">
                <div className="p-3 bg-[#fff7ed] rounded-xl border border-[#ffedd5] text-xs text-[#ea580c] flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Direct petition to the City Ombudsman / Municipal Commissioner with guaranteed 24-hour executive review.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-1">
                    Target Higher Authority
                  </label>
                  <select
                    value={selectedOfficialId}
                    onChange={(e) => setSelectedOfficialId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#c2c6d7] text-xs font-bold bg-white"
                  >
                    {HIGHER_UP_OFFICIALS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-1">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['High', 'Urgent', 'Critical'] as const).map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`py-1.5 rounded-lg border text-xs font-bold ${
                          severity === sev ? 'bg-[#0050c8] text-white border-[#0050c8]' : 'bg-white text-[#424655]'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-1">
                    Dissatisfaction & Escalation Details
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="Specify why the solution failed or why the delay is unacceptable..."
                    className="w-full px-3 py-2 rounded-xl border border-[#c2c6d7] text-xs focus:ring-2 focus:ring-[#0050c8]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-[#c2c6d7] text-xs font-bold text-[#424655]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-[#f88400] hover:bg-[#ea580c] text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Petition
                  </button>
                </div>
              </form>
            )}

            {/* MODE 3: BOOK APPOINTMENT */}
            {activeTab === 'appointment' && (
              <form onSubmit={handleApptSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-1">
                    Select Official
                  </label>
                  <select
                    value={selectedOfficialId}
                    onChange={(e) => setSelectedOfficialId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#c2c6d7] text-xs font-bold bg-white"
                  >
                    {HIGHER_UP_OFFICIALS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} — {o.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#c2c6d7] text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-1">
                      Time Slot
                    </label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#c2c6d7] text-xs font-medium bg-white"
                    >
                      <option>09:30 AM</option>
                      <option>10:30 AM</option>
                      <option>02:00 PM</option>
                      <option>03:45 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-1">
                    Meeting Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setMeetingMode('in-person')}
                      className={`py-1.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 ${
                        meetingMode === 'in-person' ? 'bg-[#0050c8] text-white border-[#0050c8]' : 'bg-white text-[#424655]'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>In-Person</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMeetingMode('video')}
                      className={`py-1.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 ${
                        meetingMode === 'video' ? 'bg-[#0050c8] text-white border-[#0050c8]' : 'bg-white text-[#424655]'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Video Call</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMeetingMode('phone')}
                      className={`py-1.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 ${
                        meetingMode === 'phone' ? 'bg-[#0050c8] text-white border-[#0050c8]' : 'bg-white text-[#424655]'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Phone</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-[#f0f5ff] rounded-xl border border-[#dae2ff] text-xs text-[#0050c8]">
                  <strong>Venue / Channel:</strong> {selectedOfficial.officeLocation}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-[#c2c6d7] text-xs font-bold text-[#424655]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-[#0050c8] hover:bg-[#1d68f2] text-white text-xs font-bold shadow-md transition-colors"
                  >
                    Confirm Hearing
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

