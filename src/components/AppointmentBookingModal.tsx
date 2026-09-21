import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Video,
  Building2,
  Phone,
  CheckCircle2,
  Download,
  AlertTriangle,
  Send
} from 'lucide-react';
import { HigherUpOfficial, CivicIssue, MunicipalAppointment } from '../types';
import confetti from 'canvas-confetti';

interface AppointmentBookingModalProps {
  isOpen?: boolean;
  onClose: () => void;
  officials: HigherUpOfficial[];
  selectedOfficial?: HigherUpOfficial | null;
  issues: CivicIssue[];
  preselectedIssueId?: string;
  relatedIssue?: CivicIssue | null;
  onBookAppointment?: (appointment: Omit<MunicipalAppointment, 'id' | 'createdAt' | 'status'>) => void;
  onConfirmBooking?: (data: any) => void;
}

const TIME_SLOTS = [
  '09:30 AM',
  '10:30 AM',
  '11:15 AM',
  '01:45 PM',
  '02:30 PM',
  '03:45 PM',
  '04:30 PM',
];

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen = true,
  onClose,
  officials,
  selectedOfficial: initialOfficial,
  issues,
  preselectedIssueId,
  relatedIssue,
  onBookAppointment,
  onConfirmBooking,
}) => {
  const [selectedOfficialId, setSelectedOfficialId] = useState<string>(
    initialOfficial?.id || (officials.length > 0 ? officials[0].id : '')
  );
  const [selectedIssueId, setSelectedIssueId] = useState<string>(preselectedIssueId || '');
  const [meetingMode, setMeetingMode] = useState<'in-person' | 'video' | 'phone'>('in-person');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-25');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('10:30 AM');
  const [citizenName, setCitizenName] = useState<string>('Alex Rivera');
  const [citizenEmail, setCitizenEmail] = useState<string>('alex.rivera@email.com');
  const [citizenPhone, setCitizenPhone] = useState<string>('+1 (555) 018-9922');
  const [agenda, setAgenda] = useState<string>(
    'Escalation regarding unresolved civic hazard / dissatisfaction with recent repair quality.'
  );
  const [confirmedAppointment, setConfirmedAppointment] = useState<MunicipalAppointment | null>(null);

  if (!isOpen) return null;

  const currentOfficial = officials.find((o) => o.id === selectedOfficialId) || officials[0];
  const selectedIssue = issues.find((i) => i.id === selectedIssueId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOfficial) return;

    let locationOrLink = '';
    if (meetingMode === 'in-person') {
      locationOrLink = currentOfficial.officeLocation;
    } else if (meetingMode === 'video') {
      locationOrLink = `https://meet.civicfix.citygov.org/room-${Math.random().toString(36).substring(2, 7)}`;
    } else {
      locationOrLink = `Direct Call from ${currentOfficial.phone}`;
    }

    const apptData: Omit<MunicipalAppointment, 'id' | 'createdAt' | 'status'> = {
      officialId: currentOfficial.id,
      officialName: currentOfficial.name,
      officialRole: currentOfficial.role,
      department: currentOfficial.department,
      issueId: selectedIssue?.id,
      issueCode: selectedIssue?.code,
      issueTitle: selectedIssue?.title,
      citizenName,
      citizenEmail,
      citizenPhone,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      meetingMode,
      locationOrLink,
      agenda,
      grievanceReferenceCode: selectedIssue ? `#GRV-2026-${Math.floor(100 + Math.random() * 900)}` : undefined,
    };

    if (onConfirmBooking) {
      onConfirmBooking(apptData);
    } else if (onBookAppointment) {
      onBookAppointment(apptData);
    }

    const fullAppt: MunicipalAppointment = {
      ...apptData,
      id: `appt-${Date.now()}`,
      status: 'confirmed',
      createdAt: 'Just now',
    };

    setConfirmedAppointment(fullAppt);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  const handleDownloadCalendar = () => {
    if (!confirmedAppointment) return;
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CivicFix Municipal Redressal//EN
BEGIN:VEVENT
SUMMARY:Municipal Briefing: ${confirmedAppointment.officialName} (${confirmedAppointment.officialRole})
DESCRIPTION:Agenda: ${confirmedAppointment.agenda}\\nCase Ref: ${confirmedAppointment.issueCode || 'General Consultation'}
LOCATION:${confirmedAppointment.locationOrLink}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `CivicFix_Appointment_${confirmedAppointment.date}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-[#c2c6d7] relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#737686] hover:text-[#121c28] hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {confirmedAppointment ? (
          /* Confirmation View */
          <div className="text-center py-4 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#10B981] text-white flex items-center justify-center mx-auto shadow-lg ring-8 ring-[#10B981]/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#dcfce7] text-[#15803d] font-bold text-xs rounded-full uppercase tracking-wider mb-2">
                Official Appointment Confirmed
              </span>
              <h3 className="text-2xl font-extrabold text-[#121c28]">
                Meeting Scheduled with {confirmedAppointment.officialName}
              </h3>
              <p className="text-xs text-[#56596e] mt-1">
                A formal calendar invitation and civic grievance briefing package has been generated.
              </p>
            </div>

            {/* Appointment Pass Card */}
            <div className="bg-[#f8f9ff] border border-[#c2c6d7] rounded-xl p-5 text-left space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#e2e5f1] pb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#737686]">
                    Higher Municipal Authority
                  </p>
                  <p className="text-sm font-extrabold text-[#121c28]">
                    {confirmedAppointment.officialName}
                  </p>
                  <p className="text-xs text-[#0050c8] font-semibold">{confirmedAppointment.officialRole}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#c2c6d7] rounded-lg text-xs font-bold text-[#121c28]">
                    {confirmedAppointment.meetingMode === 'in-person' && <Building2 className="w-3.5 h-3.5 text-[#0050c8]" />}
                    {confirmedAppointment.meetingMode === 'video' && <Video className="w-3.5 h-3.5 text-[#10B981]" />}
                    {confirmedAppointment.meetingMode === 'phone' && <Phone className="w-3.5 h-3.5 text-[#f88400]" />}
                    <span className="capitalize">{confirmedAppointment.meetingMode}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#737686] block font-medium">Date & Time:</span>
                  <span className="font-bold text-[#121c28]">
                    {confirmedAppointment.date} at {confirmedAppointment.timeSlot}
                  </span>
                </div>
                <div>
                  <span className="text-[#737686] block font-medium">Location / Link:</span>
                  <span className="font-bold text-[#121c28] truncate block">
                    {confirmedAppointment.locationOrLink}
                  </span>
                </div>
                {confirmedAppointment.issueCode && (
                  <div>
                    <span className="text-[#737686] block font-medium">Case Attachment:</span>
                    <span className="font-bold text-[#0050c8]">
                      {confirmedAppointment.issueCode} — {confirmedAppointment.issueTitle}
                    </span>
                  </div>
                )}
                {confirmedAppointment.grievanceReferenceCode && (
                  <div>
                    <span className="text-[#737686] block font-medium">Grievance Ref:</span>
                    <span className="font-mono font-bold text-[#f88400]">
                      {confirmedAppointment.grievanceReferenceCode}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white p-3 rounded-lg border border-[#e2e5f1] text-xs">
                <span className="font-bold text-[#121c28]">Citizen Briefing Agenda:</span>
                <p className="text-[#424655] mt-0.5 italic">"{confirmedAppointment.agenda}"</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleDownloadCalendar}
                className="px-4 py-2.5 rounded-xl bg-white border border-[#c2c6d7] hover:bg-gray-50 text-xs font-bold text-[#121c28] flex items-center gap-2 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4 text-[#0050c8]" />
                Download Calendar (.ICS)
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#0050c8] hover:bg-[#1d68f2] text-white text-xs font-bold shadow-md transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center gap-2.5 text-[#0050c8]">
                <div className="w-9 h-9 rounded-xl bg-[#EDF4FF] flex items-center justify-center text-[#0050c8]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#121c28]">
                    Schedule Appointment with Higher Authority
                  </h2>
                  <p className="text-xs text-[#56596e]">
                    Direct consultation with Municipal Commissioners, Councilors & the City Ombudsman.
                  </p>
                </div>
              </div>
            </div>

            {/* Official Selector */}
            <div>
              <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-2">
                1. Select Higher Municipal Official
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {officials.map((official) => {
                  const isSelected = official.id === selectedOfficialId;
                  return (
                    <div
                      key={official.id}
                      onClick={() => setSelectedOfficialId(official.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-[#0050c8] bg-[#f0f5ff] ring-2 ring-[#0050c8]/20 shadow-xs'
                          : 'border-[#c2c6d7] bg-white hover:border-[#a0a5b8]'
                      }`}
                    >
                      <img
                        src={official.avatar}
                        alt={official.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#c2c6d7] flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-[#121c28] truncate">{official.name}</p>
                        <p className="text-[11px] font-semibold text-[#0050c8] truncate">{official.role}</p>
                        <p className="text-[10px] text-[#737686] truncate">{official.department}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Case Reference & Dissatisfaction Context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-1.5">
                  2. Link Civic Issue / Problem (Optional)
                </label>
                <select
                  value={selectedIssueId}
                  onChange={(e) => setSelectedIssueId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#c2c6d7] text-xs font-medium focus:ring-2 focus:ring-[#0050c8] bg-white"
                >
                  <option value="">-- General Civic Grievance --</option>
                  {issues.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.code} - {i.title} ({i.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-1.5">
                  3. Meeting Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMeetingMode('in-person')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      meetingMode === 'in-person'
                        ? 'bg-[#0050c8] text-white border-[#0050c8] shadow-xs'
                        : 'bg-white border-[#c2c6d7] text-[#424655] hover:bg-gray-50'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>In-Person</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetingMode('video')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      meetingMode === 'video'
                        ? 'bg-[#0050c8] text-white border-[#0050c8] shadow-xs'
                        : 'bg-white border-[#c2c6d7] text-[#424655] hover:bg-gray-50'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video Call</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetingMode('phone')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      meetingMode === 'phone'
                        ? 'bg-[#0050c8] text-white border-[#0050c8] shadow-xs'
                        : 'bg-white border-[#c2c6d7] text-[#424655] hover:bg-gray-50'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Phone Call</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Date & Time Slot */}
            <div>
              <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-1.5">
                4. Select Date & Time Slot
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min="2026-10-20"
                    max="2026-11-30"
                    className="w-full px-3 py-2 rounded-xl border border-[#c2c6d7] text-xs font-medium focus:ring-2 focus:ring-[#0050c8]"
                  />
                </div>
                <div className="sm:col-span-2 flex flex-wrap gap-1.5">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        selectedTimeSlot === slot
                          ? 'bg-[#0050c8] text-white border-[#0050c8]'
                          : 'bg-white text-[#424655] border-[#c2c6d7] hover:bg-gray-50'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Citizen Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#121c28] uppercase tracking-wider mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#c2c6d7] text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#121c28] uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={citizenEmail}
                  onChange={(e) => setCitizenEmail(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#c2c6d7] text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#121c28] uppercase tracking-wider mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  required
                  value={citizenPhone}
                  onChange={(e) => setCitizenPhone(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#c2c6d7] text-xs"
                />
              </div>
            </div>

            {/* Agenda / Reason for Grievance */}
            <div>
              <label className="block text-xs font-bold text-[#121c28] uppercase tracking-wider mb-1">
                5. Briefing Agenda / Dissatisfaction Statement
              </label>
              <textarea
                rows={3}
                required
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                placeholder="State the core reason for meeting, why previous solutions failed, or how safety is compromised..."
                className="w-full px-3 py-2 rounded-xl border border-[#c2c6d7] text-xs focus:ring-2 focus:ring-[#0050c8] focus:outline-none"
              />
            </div>

            {/* Location Notice */}
            <div className="p-3 bg-[#eef4ff] rounded-xl border border-[#dae2ff] text-xs text-[#0050c8] flex items-start gap-2.5">
              <Building2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#0050c8]" />
              <div>
                <span className="font-bold">Official Venue:</span> {currentOfficial?.officeLocation}
                <span className="block text-[11px] text-[#424655]">
                  Official Contact: {currentOfficial?.phone} | {currentOfficial?.email}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#c2c6d7] text-xs font-bold text-[#424655] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#0050c8] hover:bg-[#1d68f2] text-white text-xs font-bold shadow-md transition-colors flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                Book Official Appointment
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
