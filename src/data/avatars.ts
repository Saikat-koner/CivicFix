// Curated Face Avatars and Face Icons for CivicFix Citizen & Official Profiles

export interface FaceAvatarOption {
  id: string;
  name: string;
  roleDescription: string;
  imageUrl: string;
  category: 'citizen' | 'official' | 'youth' | 'senior';
}

export interface FaceIconOption {
  id: string;
  name: string;
  label: string;
  iconName: 'smile' | 'shield' | 'sparkles' | 'wrench' | 'heart' | 'user' | 'award' | 'zap';
  gradient: string;
  textColor: string;
}

export const PRESET_FACE_AVATARS: FaceAvatarOption[] = [
  {
    id: 'face-1',
    name: 'Aarav Patel',
    roleDescription: 'Tech Resident & Ward Mitra',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    category: 'citizen',
  },
  {
    id: 'face-2',
    name: 'Priya Sharma',
    roleDescription: 'Community Lead & Fixer',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    category: 'citizen',
  },
  {
    id: 'face-3',
    name: 'Vikram Malhotra',
    roleDescription: 'Ward Mitra & Reporter',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    category: 'citizen',
  },
  {
    id: 'face-4',
    name: 'Er. R. Venkatesh',
    roleDescription: 'Municipal Road Engineer',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    category: 'official',
  },
  {
    id: 'face-5',
    name: 'Smt. Ananya Sharma',
    roleDescription: 'Ward Committee Councilor',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    category: 'official',
  },
  {
    id: 'face-6',
    name: 'Rohan Iyer',
    roleDescription: 'Daily Commuter & Cyclist',
    imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
    category: 'youth',
  },
  {
    id: 'face-7',
    name: 'Ananya Sen',
    roleDescription: 'Student Campus Volunteer',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    category: 'youth',
  },
  {
    id: 'face-8',
    name: 'Suresh Murthy',
    roleDescription: 'Public Works Inspector',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    category: 'official',
  },
  {
    id: 'face-9',
    name: 'Meera Rao',
    roleDescription: 'Green Ward Eco Guardian',
    imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    category: 'citizen',
  },
  {
    id: 'face-10',
    name: 'Aditya Hegde',
    roleDescription: 'Smart City Data Mitra',
    imageUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
    category: 'citizen',
  },
  {
    id: 'face-11',
    name: 'Dr. R. S. Chauhan',
    roleDescription: 'Senior Resident & Ombudsman',
    imageUrl: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=300&q=80',
    category: 'senior',
  },
  {
    id: 'face-12',
    name: 'Neha Roy',
    roleDescription: 'Neighborhood Watch Leader',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    category: 'citizen',
  },
];

export const PRESET_FACE_ICONS: FaceIconOption[] = [
  {
    id: 'icon-smile',
    name: 'Smiling Citizen',
    label: 'Citizen Mitra',
    iconName: 'smile',
    gradient: 'from-amber-400 to-orange-500',
    textColor: 'text-white',
  },
  {
    id: 'icon-shield',
    name: 'Ward Guardian',
    label: 'Guardian',
    iconName: 'shield',
    gradient: 'from-blue-600 to-indigo-700',
    textColor: 'text-white',
  },
  {
    id: 'icon-sparkles',
    name: 'Star Fixer',
    label: 'Civic Star',
    iconName: 'sparkles',
    gradient: 'from-purple-500 to-pink-600',
    textColor: 'text-white',
  },
  {
    id: 'icon-wrench',
    name: 'Infra Inspector',
    label: 'City Works',
    iconName: 'wrench',
    gradient: 'from-emerald-500 to-teal-700',
    textColor: 'text-white',
  },
  {
    id: 'icon-heart',
    name: 'Community Mitra',
    label: 'Kindness Mitra',
    iconName: 'heart',
    gradient: 'from-rose-500 to-red-600',
    textColor: 'text-white',
  },
  {
    id: 'icon-zap',
    name: 'Rapid Responder',
    label: 'Fast Action',
    iconName: 'zap',
    gradient: 'from-amber-500 to-yellow-600',
    textColor: 'text-white',
  },
];

export const DEFAULT_CITIZEN_AVATAR = PRESET_FACE_AVATARS[0].imageUrl;
export const DEFAULT_OFFICIAL_AVATAR = PRESET_FACE_AVATARS[2].imageUrl;
