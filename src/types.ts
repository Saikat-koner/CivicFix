export type UserRole = 'citizen' | 'admin';

export type IssueStatus = 'open' | 'investigating' | 'fixed';

export type IssueCategory =
  | 'Roads'
  | 'Utilities'
  | 'Parks'
  | 'Traffic'
  | 'Sanitation'
  | 'Safety'
  // 22+ Comprehensive Real Civic Need Categories:
  | 'Roads & Potholes'
  | 'Water Supply & Leakages'
  | 'Sewage & Drain Overflows'
  | 'Garbage & Solid Waste'
  | 'Street Lighting & Electrical'
  | 'Traffic Signals & Signage'
  | 'Public Parks & Playgrounds'
  | 'Fallen Trees & Forestry'
  | 'Stray Animals & Animal Control'
  | 'Public Health & Sanitation'
  | 'Air & Noise Pollution'
  | 'Illegal Construction & Encroachment'
  | 'Pedestrian Sidewalks & Crosswalks'
  | 'Public Transport & Bus Shelters'
  | 'Fire Hazards & Emergency Safety'
  | 'Stormwater Drainage & Flooding'
  | 'Public Restrooms & Toilets'
  | 'Vandalism & Graffiti'
  | 'Bridges & Flyovers Structure'
  | 'Public School & Library Facilities'
  | 'Cemetery & Crematorium Maintenance'
  | 'Cyber & Smart City Infrastructure';

export interface CivicCategoryMeta {
  id: IssueCategory;
  name: string;
  emoji: string;
  department: string;
  group: 'Infrastructure' | 'Utilities & Water' | 'Environment & Waste' | 'Safety & Transit' | 'Civic Facilities';
  slaHours: number;
}

export const CIVIC_CATEGORIES_CATALOG: CivicCategoryMeta[] = [
  { id: 'Roads & Potholes', name: 'Roads & Potholes', emoji: '🕳️', department: 'Public Works Asphalt & Pavement Cell', group: 'Infrastructure', slaHours: 24 },
  { id: 'Water Supply & Leakages', name: 'Water Supply & Leakages', emoji: '🚰', department: 'Municipal Water Supply & Sewerage Board', group: 'Utilities & Water', slaHours: 12 },
  { id: 'Sewage & Drain Overflows', name: 'Sewage & Drain Overflows', emoji: '🚽', department: 'Stormwater & Underground Sewer Cell', group: 'Utilities & Water', slaHours: 18 },
  { id: 'Garbage & Solid Waste', name: 'Garbage & Solid Waste', emoji: '🗑️', department: 'Solid Waste Management & Sanitation Dept', group: 'Environment & Waste', slaHours: 12 },
  { id: 'Street Lighting & Electrical', name: 'Street Lighting & Electrical', emoji: '💡', department: 'Municipal Electrical & Grid Division', group: 'Utilities & Water', slaHours: 24 },
  { id: 'Traffic Signals & Signage', name: 'Traffic Signals & Signage', emoji: '🚦', department: 'Traffic Engineering & Signal Ops', group: 'Safety & Transit', slaHours: 24 },
  { id: 'Public Parks & Playgrounds', name: 'Public Parks & Playgrounds', emoji: '🛝', department: 'Horticulture & Public Parks Dept', group: 'Environment & Waste', slaHours: 48 },
  { id: 'Fallen Trees & Forestry', name: 'Fallen Trees & Forestry', emoji: '🌳', department: 'Urban Forestry & Disaster Tree Cell', group: 'Environment & Waste', slaHours: 12 },
  { id: 'Stray Animals & Animal Control', name: 'Stray Animals & Animal Control', emoji: '🐕', department: 'Animal Husbandry & Vet Rapid Unit', group: 'Civic Facilities', slaHours: 36 },
  { id: 'Public Health & Sanitation', name: 'Public Health & Sanitation', emoji: '🏥', department: 'Public Health Vector & Disease Control', group: 'Civic Facilities', slaHours: 24 },
  { id: 'Air & Noise Pollution', name: 'Air & Noise Pollution', emoji: '💨', department: 'Pollution Control & Air Quality Board', group: 'Environment & Waste', slaHours: 48 },
  { id: 'Illegal Construction & Encroachment', name: 'Illegal Construction & Encroachment', emoji: '🏗️', department: 'Town Planning & Encroachment Squad', group: 'Infrastructure', slaHours: 72 },
  { id: 'Pedestrian Sidewalks & Crosswalks', name: 'Pedestrian Sidewalks & Crosswalks', emoji: '🚶', department: 'Sidewalk & Vision Zero Pedestrian Cell', group: 'Safety & Transit', slaHours: 36 },
  { id: 'Public Transport & Bus Shelters', name: 'Public Transport & Bus Shelters', emoji: '🚌', department: 'Urban Transport & Transit Authority', group: 'Safety & Transit', slaHours: 48 },
  { id: 'Fire Hazards & Emergency Safety', name: 'Fire Hazards & Emergency Safety', emoji: '🔥', department: 'Fire Safety & Disaster Response Ops', group: 'Safety & Transit', slaHours: 6 },
  { id: 'Stormwater Drainage & Flooding', name: 'Stormwater Drainage & Flooding', emoji: '🌊', department: 'Flood Mitigation & Drain Clearance Unit', group: 'Utilities & Water', slaHours: 12 },
  { id: 'Public Restrooms & Toilets', name: 'Public Restrooms & Toilets', emoji: '🚻', department: 'Public Convenience Maintenance Cell', group: 'Civic Facilities', slaHours: 24 },
  { id: 'Vandalism & Graffiti', name: 'Vandalism & Graffiti', emoji: '🎨', department: 'City Aesthetics & Anti-Vandalism Taskforce', group: 'Civic Facilities', slaHours: 48 },
  { id: 'Bridges & Flyovers Structure', name: 'Bridges & Flyovers Structure', emoji: '🌉', department: 'Major Infrastructure & Bridges Cell', group: 'Infrastructure', slaHours: 24 },
  { id: 'Public School & Library Facilities', name: 'Public School & Library Facilities', emoji: '📚', department: 'Education & Civic Facilities Cell', group: 'Civic Facilities', slaHours: 72 },
  { id: 'Cemetery & Crematorium Maintenance', name: 'Cemetery & Crematorium Maintenance', emoji: '🕊️', department: 'Cemetery Operations & Public Grounds', group: 'Civic Facilities', slaHours: 36 },
  { id: 'Cyber & Smart City Infrastructure', name: 'Cyber & Smart City Infrastructure', emoji: '📡', department: 'Smart City Data & Optical Fiber Cell', group: 'Infrastructure', slaHours: 24 },
  // Legacy aliases mapped
  { id: 'Roads', name: 'Roads & Potholes (Legacy)', emoji: '🕳️', department: 'Public Works Department', group: 'Infrastructure', slaHours: 24 },
  { id: 'Utilities', name: 'Utilities & Power (Legacy)', emoji: '💡', department: 'Municipal Utilities', group: 'Utilities & Water', slaHours: 24 },
  { id: 'Parks', name: 'Parks & Greenery (Legacy)', emoji: '🌳', department: 'Horticulture Department', group: 'Environment & Waste', slaHours: 48 },
  { id: 'Traffic', name: 'Traffic & Mobility (Legacy)', emoji: '🚦', department: 'Traffic Safety Cell', group: 'Safety & Transit', slaHours: 24 },
  { id: 'Sanitation', name: 'Sanitation & Waste (Legacy)', emoji: '🗑️', department: 'Sanitation Bureau', group: 'Environment & Waste', slaHours: 12 },
  { id: 'Safety', name: 'Safety Hazard (Legacy)', emoji: '⚠️', department: 'Public Safety Unit', group: 'Safety & Transit', slaHours: 12 },
];

export interface HigherUpOfficial {
  id: string;
  name: string;
  role: string;
  title: string;
  department: string;
  jurisdiction: string;
  avatar: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  officeLocation: string;
  roomNumber?: string;
  availableModes: ('in-person' | 'video' | 'phone')[];
  nextAvailableSlot: string;
  officeHours?: string;
  appointmentSlots?: string[];
  escalationSpecialties: string[];
  rating: number;
  bio: string;
}

export interface MunicipalAppointment {
  id: string;
  issueId?: string;
  issueCode?: string;
  issueTitle?: string;
  citizenName: string;
  citizenEmail: string;
  citizenPhone: string;
  officialId: string;
  officialName: string;
  officialRole: string;
  department: string;
  date: string;
  timeSlot: string;
  meetingMode?: 'in-person' | 'video' | 'phone';
  mode?: 'in-person' | 'video' | 'phone';
  locationOrLink?: string;
  agenda: string;
  purpose?: string;
  status: 'confirmed' | 'rescheduled' | 'completed' | 'canceled';
  createdAt: string;
  grievanceReferenceCode?: string;
  adminNotes?: string;
}

export interface GrievancePetition {
  id: string;
  petitionNumber: string;
  issueId: string;
  issueCode: string;
  issueTitle: string;
  citizenName: string;
  targetHigherUpId: string;
  targetHigherUpName: string;
  targetHigherUpRole: string;
  dissatisfactionReason: string;
  escalationType: 'unresolved_delay' | 'poor_quality_fix' | 'disputed_closure' | 'safety_hazard';
  severity: 'Urgent' | 'High' | 'Critical';
  status: 'under_review' | 'action_ordered' | 'resolved';
  filedAt: string;
  adminRemarks?: string;
}

export interface TimelineStep {
  id: string;
  title: string;
  timestamp: string;
  actor: string;
  description?: string;
  completed: boolean;
  isCurrent?: boolean;
}

export interface IssueComment {
  id: string;
  author: string;
  avatar: string;
  timestamp: string;
  text: string;
  isOfficial?: boolean;
  department?: string;
  upvotes: number;
  hasUpvoted?: boolean;
}

export interface CivicIssue {
  id: string;
  code: string; // e.g. #CFX-8921
  title: string;
  description: string;
  category: IssueCategory;
  district: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  status: IssueStatus;
  reportedDaysAgo: string;
  reportedDate: string;
  imageUrl: string;
  repairedImageUrl?: string;
  severity: 'Low' | 'Medium' | 'High';
  severityLevel?: 'S1' | 'S2' | 'S3' | 'S4' | 'S5';
  severityScore?: number;
  slaHours?: number;
  groundModifier?: number;
  rapidSurveyExpiresAt?: string;
  upvotes: number;
  hasUpvoted?: boolean;
  mergedReportsCount: number;
  reportedBy: {
    name: string;
    avatar: string;
  };
  timeElapsed: string;
  timeline: TimelineStep[];
  comments?: IssueComment[];
  verificationVotes: {
    stillThere: number;
    isFixed: number;
    userVote?: 'stillThere' | 'isFixed';
  };
  isOfflineQueued?: boolean;
  queuedAt?: string;
  escalationStatus?: 'none' | 'reopened' | 'appointment_booked' | 'escalated_to_higher_up';
  activePetitionId?: string;
  assignedCrew?: string;
  assignedCrewDetails?: {
    crewName: string;
    headEngineer: string;
    budgetCode?: string;
    estimatedCost?: string;
    assignedAt?: string;
    targetDate?: string;
    equipment?: string;
  };
  slaHoursLimit?: number;
  slaDeadlineTimestamp?: number;
  appointmentDetails?: {
    date: string;
    time: string;
    officerName: string;
    department: string;
    meetingMode?: 'in-person' | 'video' | 'phone';
  };
}

export interface RedeemedPerkVoucher {
  id: string;
  perkName: string;
  category: string;
  voucherCode: string;
  qrData: string;
  redeemedAt: string;
  validUntil: string;
  status: 'active' | 'used';
  instructions: string;
  costCC: number;
  recipientName: string;
}

export interface ContractorCrew {
  id: string;
  name: string;
  department: string;
  headEngineer: string;
  contactPhone: string;
  status: 'available' | 'dispatched' | 'standby';
  currentLoad: number;
  capacity: number;
  specialties: string[];
  vehiclePlate: string;
}

export interface CivicQuest {
  id: string;
  title: string;
  description: string;
  rewardCC: number;
  current: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  iconType: 'camera' | 'check' | 'navigation' | 'shield';
}

export interface AppNotification {
  id: string;
  type: 'status_change' | 'reward' | 'community' | 'dispatch';
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  issueId?: string;
  ccAmount?: number;
}

export interface Contributor {
  rank: number;
  id: string; // Permanent Unique User ID (e.g. CFX-CID-4921-7A9B)
  permanentUserId?: string; // Permanent Unique ID assigned at registration
  name: string;
  avatar: string;
  issuesResolved: number;
  civicCredits: number;
  impactPoints?: number;
  district?: string;
  isCurrentUser?: boolean;
  badges: string[];
  email?: string;
  phone?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  contactVerified?: boolean;
  firstReportSubmitted?: boolean;
}

export interface NavStep {
  instruction: string;
  distance: string;
  turnIcon: 'straight' | 'left' | 'right' | 'u-turn' | 'destination';
  distanceMeters: number;
}

export interface ActiveNavigation {
  targetIssue: CivicIssue;
  distanceRemainingMeters: number;
  estimatedTimeSeconds: number;
  currentStepIndex: number;
  steps: NavStep[];
  isNavigating: boolean;
  isSimulating: boolean;
  currentPos: { lat: number; lng: number };
}

export interface QueuedOfflineReport {
  id: string;
  code: string;
  title: string;
  description: string;
  category: IssueCategory;
  district: string;
  address: string;
  location: { lat: number; lng: number };
  imageUrl: string;
  severity: 'Low' | 'Medium' | 'High';
  queuedAt: string;
  reporterName?: string;
  notes?: string;
}

export interface CivicDefectItem {
  id: string;
  name: string;
  category: IssueCategory;
  severity: 'Low' | 'Medium' | 'High';
  urgency?: 'Routine' | 'Priority' | 'Critical';
  department: string;
  description: string;
  clues: string[];
  confidence: number;
  reticle: {
    top: string;
    left: string;
    width: string;
    height: string;
    label: string;
  };
  whatsThatSummary?: string;
  audioSpeechText?: string;
  isManual?: boolean;
  wordCount?: number;
}

export interface CivicImageScanResult {
  issueType: string;
  category: IssueCategory;
  severity: 'Low' | 'Medium' | 'High';
  title: string;
  description: string;
  whatsThatSummary: string;
  audioSpeechText: string;
  department: string;
  confidence: number;
  clues: string[];
  reticle: {
    top: string;
    left: string;
    width: string;
    height: string;
    label: string;
  };
  defects: CivicDefectItem[];
  totalDefectsFound: number;
  multiDefectSummary?: string;

  // Strict Moderation, NSFW & Civic Domain Relevance Flags
  isSafe?: boolean;
  isNsfw?: boolean;
  isCivicRelated?: boolean;
  rejectionCategory?: 'NSFW_OR_EXPLICIT' | 'NON_CIVIC_IMAGE' | 'LOW_QUALITY_OR_UNREADABLE';
  rejectionReason?: string;
  suggestedAction?: string;
  detectedNonCivicObjects?: string[];
}

export interface SmartWasteBin {
  id: string;
  code: string;
  ward: string;
  address: string;
  location: { lat: number; lng: number };
  type: 'wet' | 'dry' | 'hazardous' | 'mixed';
  fillPercent: number; // 0 - 100
  capacityLiters: number;
  lastEmptied: string;
  status: 'normal' | 'near_full' | 'overflowing';
  batteryPercent: number;
  sensorStatus: 'online' | 'offline';
}

export interface GarbageTruck {
  id: string;
  registrationNumber: string;
  driverName: string;
  driverPhone: string;
  supervisorName: string;
  ward: string;
  route: string;
  status: 'on-route' | 'dumping' | 'idle' | 'maintenance';
  location: { lat: number; lng: number };
  heading: number;
  speedKmH: number;
  completionPercent: number;
  nextStop: string;
  estimatedArrivalMinutes: number;
  capacityTonnes: number;
  loadPercent: number;
}

export interface WasteCollectionSchedule {
  day: string;
  wasteType: 'Wet Organic' | 'Dry Recyclables' | 'Sanitary & Domestic Hazardous' | 'E-Waste & Bulky';
  timings: string;
  frequency: string;
  vehicleType: string;
  instructions: string[];
  statusToday: 'Completed' | 'In Progress' | 'Upcoming' | 'Tomorrow';
}

export interface EmergencyHotlinePlace {
  id: string;
  name: string;
  hotlineNumber: string; // '112', '1533', '1916', '1912', '103', '1033', etc.
  category: string;
  agency: string;
  address: string;
  ward: string;
  city?: string;
  state?: string;
  region?: string;
  phone?: string;
  location: { lat: number; lng: number };
  responseTimeMinutes: number;
  is24x7: boolean;
  status: 'active' | 'busy' | 'standby';
  description: string;
  vehiclesAvailable: string[];
}

export interface EmailVerificationResult {
  valid: boolean;
  email: string;
  normalizedEmail: string;
  domain: string;
  status: 'valid' | 'invalid' | 'risky' | 'catch-all' | 'unknown' | 'already_registered';
  subStatus?: string;
  provider: string;
  mxFound: boolean;
  mxRecord?: string;
  smtpProvider?: string;
  isDisposable: boolean;
  isFreeEmail: boolean;
  isAlreadyRegistered?: boolean;
  didYouMean?: string | null;
  qualityScore: number;
  reason?: string;
  verifiedAt: string;
}

export interface TrafficSegment {
  id: string;
  corridorName: string;
  city: string;
  level: 'smooth' | 'moderate' | 'congested' | 'blocked';
  speedKmh: number;
  freeFlowSpeedKmh: number;
  delayMinutes: number;
  incident?: string;
  coordinates: [number, number][];
  lastUpdated: string;
}

export interface InfrastructureHotspot {
  id: string;
  name: string;
  category: 'electrical_substation' | 'water_pumping' | 'stormwater_sluice' | 'transit_hub' | 'waste_compactor' | 'bridge_flyover';
  categoryLabel: string;
  location: { lat: number; lng: number };
  ward: string;
  city: string;
  healthScore: number; // 0 - 100
  status: 'nominal' | 'warning' | 'critical';
  telemetry: {
    primaryMetric: string;
    metricValue: string;
    secondaryMetric?: string;
    secondaryValue?: string;
    lastServiced: string;
    monitoringAgency: string;
    emergencyContact: string;
  };
  alert?: string;
}

export interface WardBoundary {
  id: string;
  wardNumber: string;
  wardName: string;
  corporation: string;
  city: string;
  state: string;
  color: string;
  boundary: [number, number][];
  centroid: { lat: number; lng: number };
  population: number;
  areaSqKm: number;
  executiveOfficer: string;
  officerContact: string;
  activeGrievances: number;
  resolutionRate: number;
  keyLandmarks: string[];
}

export interface MapOverlayVisibilityState {
  traffic: boolean;
  infrastructure: boolean;
  wardBoundaries: boolean;
  hazardHeatmap: boolean;
  emergencyStations: boolean;
  proximityRadar: boolean;
  civicIssues: boolean;
}

