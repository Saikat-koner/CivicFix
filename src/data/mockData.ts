import {
  CivicIssue,
  Contributor,
  CivicQuest,
  AppNotification,
  HigherUpOfficial,
  MunicipalAppointment,
  GrievancePetition
} from '../types';

// Fully clean initial datasets - No sample/mock issues
export const INITIAL_ISSUES: CivicIssue[] = [];

export const INITIAL_CONTRIBUTORS: Contributor[] = [];

export const INITIAL_QUESTS: CivicQuest[] = [
  {
    id: 'q-1',
    title: 'Pothole Patrol',
    description: 'Report 2 road hazards or potholes in your municipal ward',
    rewardCC: 60,
    current: 0,
    target: 2,
    completed: false,
    claimed: false,
    iconType: 'camera',
  },
  {
    id: 'q-2',
    title: 'Ward Verification Guardian',
    description: 'Verify 3 municipal work repairs in your ward',
    rewardCC: 50,
    current: 0,
    target: 3,
    completed: false,
    claimed: false,
    iconType: 'check',
  },
  {
    id: 'q-3',
    title: 'Ward Explorer GPS',
    description: 'Complete 1 real-time GPS navigation to an open issue',
    rewardCC: 40,
    current: 0,
    target: 1,
    completed: false,
    claimed: false,
    iconType: 'navigation',
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const HIGHER_UP_OFFICIALS: HigherUpOfficial[] = [
  {
    id: 'official-1',
    name: 'Shri Tushar Giri Nath, IAS',
    role: 'Chief Municipal Commissioner',
    title: 'Executive Head of City Administration',
    department: 'Office of the Chief Commissioner, BBMP Central HQ',
    jurisdiction: 'Metropolitan City-Wide & Smart Cities Mission Coordination',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    phone: '+91 (080) 2222-1188',
    email: 'commissioner.bbmp@karnataka.gov.in',
    officeLocation: 'BBMP Central Head Office, Corporation Circle, Bengaluru 560002',
    availableModes: ['in-person', 'video', 'phone'],
    nextAvailableSlot: 'Tomorrow at 10:30 AM',
    escalationSpecialties: [
      'Unresolved Delays > 7 Days',
      'Inter-Agency Deadlocks (BBMP / BWSSB / BESCOM)',
      'Major Infrastructure Sanction',
      'Emergency Hazard Escalations'
    ],
    rating: 4.9,
    bio: 'Oversees municipal administration, Smart Cities initiatives, and enforces direct accountability for civic infrastructure delivery and citizen redressal guarantees.'
  },
  {
    id: 'official-2',
    name: 'Smt. Ananya Sharma',
    role: 'District Ward Councilor & Public Works Chair',
    title: 'Ward 112 Public Representative',
    department: 'Ward Committee & Citizen Redressal Board',
    jurisdiction: 'Indiranagar, Domlur & Old Airport Road Zone',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    phone: '+91 (080) 2297-5530',
    email: 'councilor.sharma@bbmpwards.gov.in',
    officeLocation: 'Ward 112 Helpdesk, 12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru 560008',
    availableModes: ['in-person', 'video', 'phone'],
    nextAvailableSlot: 'Thursday at 02:00 PM',
    escalationSpecialties: [
      'Disputed Repair Quality',
      'Neighborhood Road Safety & Footpaths',
      'Pedestrian Crossings & Streetlighting',
      'Ward Committee Community Petitions'
    ],
    rating: 4.8,
    bio: 'Elected ward representative actively addressing recurring neighborhood civic problems, footpath encroachments, and citizen grievances.'
  },
  {
    id: 'official-3',
    name: 'Er. R. Venkatesh',
    role: 'Chief Engineer (Road Infrastructure & Stormwater)',
    title: 'Director General of Municipal Engineering',
    department: 'BBMP Road Infrastructure & Stormwater Drain (SWD) Cell',
    jurisdiction: 'Metropolitan Arterial Roads, Flyovers, Stormwater Raja Kaluves',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    phone: '+91 (080) 2223-7400',
    email: 'chiefengineer.roads@bbmp.gov.in',
    officeLocation: 'BBMP Engineering Annex, N.R. Square, Bengaluru 560002',
    availableModes: ['in-person', 'video', 'phone'],
    nextAvailableSlot: 'Friday at 11:15 AM',
    escalationSpecialties: [
      'Arterial Road Structural Cracking',
      'Major Stormwater Drain & Raja Kaluve Blockages',
      'Defective Asphalt Quality Audits',
      'Urgent Heavy Machinery Dispatch'
    ],
    rating: 4.7,
    bio: 'Directly commands field engineer divisions, specialized jetting and asphalt paving machinery, and contractor quality audit inspectors.'
  },
  {
    id: 'official-4',
    name: 'Justice R. S. Chauhan (Retd.)',
    role: 'Municipal Lokayukta / Citizen Ombudsman',
    title: 'Chief Citizen Grievance & Integrity Officer',
    department: 'Independent Municipal Integrity & Lokayukta Redressal Tribunal',
    jurisdiction: 'Autonomous Public Inquiry, Audit & Statutory Redressal Authority',
    avatar: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=400&q=80',
    phone: '+91 (080) 2225-7013',
    email: 'ombudsman.lokayukta@karnataka.gov.in',
    officeLocation: 'Multi-Storeyed (M.S.) Building, Dr. B.R. Ambedkar Veedhi, Bengaluru 560001',
    availableModes: ['in-person', 'video', 'phone'],
    nextAvailableSlot: 'Next Monday at 09:30 AM',
    escalationSpecialties: [
      'Unsatisfied or False "Fixed" Claims',
      'Ignored Appeals & Complaint Reopenings',
      'Contractor Quality Non-Compliance',
      'Direct Public Statutory Hearings'
    ],
    rating: 5.0,
    bio: 'Independent judicial authority with statutory powers to order immediate site re-inspections, summon department heads, and sanction corrective action.'
  }
];

export const INITIAL_APPOINTMENTS: MunicipalAppointment[] = [];

export const INITIAL_GRIEVANCES: GrievancePetition[] = [];

export const ADMIN_USER_PROFILE: Contributor = {
  rank: 1,
  id: 'user-admin',
  name: 'Commissioner Tushar Giri Nath, IAS (Admin)',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  issuesResolved: 0,
  civicCredits: 15400,
  isCurrentUser: true,
  badges: ['Chief Commissioner', 'Master Dispatcher', 'City Hall Executive', 'Smart Cities Director'],
};
