export type UserRole = 'citizen' | 'admin';
export type IssueStatus = 'open' | 'investigating' | 'fixed';
export type IssueCategory =
  | 'Roads'
  | 'Utilities'
  | 'Parks'
  | 'Traffic'
  | 'Sanitation'
  | 'Safety'
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

export interface LocationCoordinates {
  lat: number;
  lng: number;
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
  code: string;
  title: string;
  description: string;
  category: IssueCategory;
  district: string;
  address: string;
  location: LocationCoordinates;
  status: IssueStatus;
  reportedDaysAgo: string;
  reportedDate: string;
  imageUrl: string;
  repairedImageUrl?: string;
  severity: 'Low' | 'Medium' | 'High';
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
  escalationStatus?: 'none' | 'reopened' | 'appointment_booked' | 'escalated_to_higher_up';
  activePetitionId?: string;
  assignedCrew?: string;
  appointmentDetails?: {
    date: string;
    time: string;
    officerName: string;
    department: string;
    meetingMode?: 'in-person' | 'video' | 'phone';
  };
}

export interface Contributor {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  civicCredits: number;
  issuesReported: number;
  issuesResolved: number;
  badge: string;
  isCurrentUser?: boolean;
}

export interface HigherUpOfficial {
  id: string;
  name: string;
  role: string;
  title: string;
  department: string;
  jurisdiction: string;
  avatar: string;
  phone: string;
  email: string;
  officeLocation: string;
  availableModes: ('in-person' | 'video' | 'phone')[];
  nextAvailableSlot: string;
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
  meetingMode: 'in-person' | 'video' | 'phone';
  locationOrLink: string;
  agenda: string;
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

export interface CreateIssueDTO {
  title: string;
  description: string;
  category: IssueCategory;
  district: string;
  address: string;
  location: LocationCoordinates;
  imageUrl?: string;
  severity?: 'Low' | 'Medium' | 'High';
  reporterName?: string;
  reporterAvatar?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: Record<string, any>;
  timestamp: string;
}
