import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  PhoneCall,
  Flame,
  Droplets,
  Zap,
  ShieldAlert,
  AlertTriangle,
  Building2,
  PhoneForwarded,
  LifeBuoy,
  MapPin,
  Navigation,
  Search,
  Globe2,
  HeartPulse,
  UserCheck,
  LocateFixed,
  Loader2,
  Compass,
  CheckCircle2,
  Car
} from 'lucide-react';
import { soundFX } from '../utils/audioFeedback';
import { EMERGENCY_HOTLINE_PLACES } from '../data/emergencyPlaces';
import { EmergencyHotlinePlace } from '../types';
import { getCurrentLivePosition, LiveLocationData } from '../utils/liveLocation';
import { reverseGeocodeWardAndDistrict } from '../utils/geocoding';

interface EmergencyHotlinesModalProps {
  onClose: () => void;
  onNavigateToMapWithPlace?: (place: EmergencyHotlinePlace) => void;
}

interface HotlineDef {
  name: string;
  number: string;
  category: string;
  desc: string;
  jurisdiction: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  isImmediateEmergency?: boolean;
}

interface RegionalServiceGroup {
  id: string;
  name: string;
  aliases: string[];
  capitalCity: string;
  municipalAgency: string;
  municipalNumber: string;
  powerDiscom: string;
  powerNumber: string;
  waterAgency: string;
  waterNumber: string;
  trafficPoliceNumber: string;
  disasterReliefNumber: string;
  specialHelpline?: string;
  description: string;
}

// =========================================================================
// PAN-INDIA UNIFIED LIFELINES (OPERATIONAL IN ALL 28 STATES & 8 UTs)
// =========================================================================
const PAN_INDIA_HOTLINES: HotlineDef[] = [
  {
    name: 'National Emergency Response Support System (ERSS - Police / Fire / Medical)',
    number: '112',
    category: 'Immediate Emergency (ERSS - All India)',
    jurisdiction: 'Pan-India (All 28 States & 8 UTs)',
    desc: 'Unified national single emergency number (112) integrated across all states for active fire outbreaks, road accidents, violent crime, and life-safety hazards.',
    icon: <ShieldAlert className="w-5 h-5 text-red-600" />,
    bgColor: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50',
    textColor: 'text-red-700 dark:text-red-400',
    isImmediateEmergency: true,
  },
  {
    name: 'National Ambulance & Emergency Medical Services (NHM / EMRI)',
    number: '108',
    category: 'Medical Trauma & Ambulance (All India)',
    jurisdiction: 'Pan-India Free Public Ambulance',
    desc: 'Free 24x7 Advanced & Basic Life Support (ALS/BLS) ambulance dispatch for cardiac arrest, road collision victims, acute respiratory distress, and maternal emergency transit.',
    icon: <HeartPulse className="w-5 h-5 text-rose-600" />,
    bgColor: 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50',
    textColor: 'text-rose-700 dark:text-rose-400',
    isImmediateEmergency: true,
  },
  {
    name: 'Fire & Emergency Rescue Services',
    number: '101',
    category: 'Fire & Rescue (All India)',
    jurisdiction: 'Pan-India Fire Control',
    desc: 'Direct fire brigade command dispatch for commercial and residential structure fires, gas cylinder leaks, high-rise collapse rescue, and chemical industrial fires.',
    icon: <Flame className="w-5 h-5 text-amber-600" />,
    bgColor: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50',
    textColor: 'text-amber-700 dark:text-amber-300',
    isImmediateEmergency: true,
  },
  {
    name: 'National Power Grid & Snapped Live Wire Hazard (Ministry of Power)',
    number: '1912',
    category: 'Power Grid Hazard (All India)',
    jurisdiction: 'Pan-India Electricity Discoms',
    desc: 'Toll-free 24/7 hotline across all state electricity boards for sparking wires, blown transformers, open feeder pillars, and power safety hazards.',
    icon: <Zap className="w-5 h-5 text-yellow-600" />,
    bgColor: 'bg-yellow-50 border-yellow-200 dark:bg-amber-950/30 dark:border-amber-900/50',
    textColor: 'text-yellow-800 dark:text-amber-300',
  },
  {
    name: 'Municipal Disaster & Public Grievance Helpline (Smart Cities & ULBs)',
    number: '1533',
    category: 'Municipal Grievance (All India)',
    jurisdiction: 'Urban Local Bodies & Municipalities',
    desc: '24/7 public civic helpline for clearing fallen storm trees, road cave-ins, deep pothole hazards, blocked storm drains, and municipal sanitation breakdowns.',
    icon: <Building2 className="w-5 h-5 text-[#0050c8]" />,
    bgColor: 'bg-[#EDF4FF] border-[#dae2ff] dark:bg-blue-950/30 dark:border-blue-900/50',
    textColor: 'text-[#0050c8] dark:text-blue-300',
  },
  {
    name: 'Water Supply Breach & Open Sewerage Overflow Helpline',
    number: '1916',
    category: 'Water & Sanitation (All India)',
    jurisdiction: 'Jal Boards & Water Supply Corporations',
    desc: 'Emergency response for potable water pipeline fractures, missing or open manhole covers, contaminated water supply lines, and sewer backflow.',
    icon: <Droplets className="w-5 h-5 text-blue-600" />,
    bgColor: 'bg-blue-50 border-blue-200 dark:bg-sky-950/30 dark:border-sky-900/50',
    textColor: 'text-blue-700 dark:text-sky-300',
  },
  {
    name: 'National Highway Roadside Emergency & Accident Helpline (NHAI)',
    number: '1033',
    category: 'Highway Rescue & Incident (All India)',
    jurisdiction: 'National Highways & Expressways',
    desc: 'Operated by National Highways Authority of India for rapid route clearing, heavy hydraulic towing, route patrol ambulances, and accident extraction on expressways.',
    icon: <Car className="w-5 h-5 text-indigo-600" />,
    bgColor: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900/50',
    textColor: 'text-indigo-700 dark:text-indigo-300',
  },
  {
    name: 'National Cyber Crime & Financial Fraud Reporting Helpline (MHA)',
    number: '1930',
    category: 'Cyber Safety & Fraud (All India)',
    jurisdiction: 'Ministry of Home Affairs & State Cyber Cells',
    desc: 'Golden-hour financial freeze and reporting for UPI payment frauds, banking phishing scams, unauthorized transactions, and cyber harassment.',
    icon: <ShieldAlert className="w-5 h-5 text-purple-600" />,
    bgColor: 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-900/50',
    textColor: 'text-purple-700 dark:text-purple-300',
  },
  {
    name: 'National Women Helpline & Emergency Distress Line (NCW)',
    number: '1091',
    category: 'Women Safety (All India)',
    jurisdiction: 'Pan-India 24x7 Special Cell',
    desc: '24/7 confidential crisis counselling, PCR police interceptor dispatch, domestic abuse support, and immediate legal assistance for women.',
    icon: <UserCheck className="w-5 h-5 text-pink-600" />,
    bgColor: 'bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-900/50',
    textColor: 'text-pink-700 dark:text-pink-300',
  },
  {
    name: 'National Disaster Management Authority (NDMA / NDRF HQ)',
    number: '1078',
    category: 'Disaster Relief (All India)',
    jurisdiction: 'National & State Disaster Response Teams',
    desc: 'Rapid disaster deployment for cyclone warnings, flood evacuations, earthquake response, and structural collapse operations.',
    icon: <LifeBuoy className="w-5 h-5 text-cyan-600" />,
    bgColor: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-950/30 dark:border-cyan-900/50',
    textColor: 'text-cyan-700 dark:text-cyan-300',
  },
];

// =========================================================================
// NATIONWIDE REGIONAL SERVICES ACROSS ALL MAJOR STATES & TERRITORIES
// =========================================================================
const ALL_INDIA_REGIONAL_SERVICES: RegionalServiceGroup[] = [
  {
    id: 'delhi',
    name: 'Delhi NCR (National Capital Region)',
    aliases: ['delhi', 'new delhi', 'noida', 'gurugram', 'ghaziabad', 'faridabad', 'nct'],
    capitalCity: 'New Delhi',
    municipalAgency: 'Municipal Corporation of Delhi (MCD) & NDMC',
    municipalNumber: '155304',
    powerDiscom: 'BSES Rajdhani / Yamuna & Tata Power DDL',
    powerNumber: '1912',
    waterAgency: 'Delhi Jal Board (DJB Emergency)',
    waterNumber: '1916',
    trafficPoliceNumber: '1095',
    disasterReliefNumber: '1077',
    specialHelpline: 'Delhi Women Commission: 181',
    description: 'Serving North, South, East, West Delhi, NDMC Central Zone, and NCR industrial belts.',
  },
  {
    id: 'maharashtra',
    name: 'Maharashtra (Mumbai, Pune, Nagpur, Thane)',
    aliases: ['maharashtra', 'mumbai', 'pune', 'nagpur', 'thane', 'nashik', 'navi mumbai', 'bombay'],
    capitalCity: 'Mumbai',
    municipalAgency: 'Brihanmumbai Municipal Corp (BMC) Disaster Control',
    municipalNumber: '1916',
    powerDiscom: 'BEST / Adani Electricity / MSEDCL Mahavitaran',
    powerNumber: '1912',
    waterAgency: 'BMC Hydraulic Engineering & Water Dept',
    waterNumber: '022-22694727',
    trafficPoliceNumber: '8454999999',
    disasterReliefNumber: '1070',
    specialHelpline: 'Pune PMC Disaster: 1800-1030-222',
    description: 'Serving Mumbai Metropolitan Region, Pune Corporation, Pimpri-Chinchwad, and Western Ghats zones.',
  },
  {
    id: 'karnataka',
    name: 'Karnataka (Bengaluru, Mysuru, Hubballi, Mangaluru)',
    aliases: ['karnataka', 'bengaluru', 'bangalore', 'mysuru', 'mysore', 'hubballi', 'mangaluru', 'belagavi'],
    capitalCity: 'Bengaluru',
    municipalAgency: 'Bruhat Bengaluru Mahanagara Palike (BBMP Sahaya)',
    municipalNumber: '1533',
    powerDiscom: 'BESCOM / HESCOM / MESCOM / GESCOM',
    powerNumber: '1912',
    waterAgency: 'Bangalore Water Supply and Sewerage Board (BWSSB)',
    waterNumber: '1916',
    trafficPoliceNumber: '103',
    disasterReliefNumber: '1070',
    specialHelpline: 'BTP WhatsApp Grievance: 9480801000',
    description: 'Serving Bengaluru Urban/Rural, Mysuru MCC, Hubballi-Dharwad, and coastal Karnataka districts.',
  },
  {
    id: 'west_bengal',
    name: 'West Bengal (Kolkata, Howrah, Siliguri, Asansol)',
    aliases: ['west bengal', 'bengal', 'kolkata', 'calcutta', 'howrah', 'siliguri', 'asansol', 'durgapur'],
    capitalCity: 'Kolkata',
    municipalAgency: 'Kolkata Municipal Corp (KMC Central / Mayor-on-Call)',
    municipalNumber: '1599',
    powerDiscom: 'Calcutta Electric Supply Corp (CESC) & WBSEDCL',
    powerNumber: '1912',
    waterAgency: 'KMC Water Supply & Sewerage Drainage Dept',
    waterNumber: '033-22861212',
    trafficPoliceNumber: '1073',
    disasterReliefNumber: '1070',
    specialHelpline: 'Kolkata Police Radio Control: 033-22143024',
    description: 'Serving Kolkata 144 wards, Howrah HMC, Bidhannagar, North 24 Parganas, and Siliguri corridor.',
  },
  {
    id: 'tamil_nadu',
    name: 'Tamil Nadu (Chennai, Coimbatore, Madurai, Trichy)',
    aliases: ['tamil nadu', 'tamilnadu', 'chennai', 'madras', 'coimbatore', 'madurai', 'tiruchirappalli', 'salem'],
    capitalCity: 'Chennai',
    municipalAgency: 'Greater Chennai Corporation (GCC Ripon Building)',
    municipalNumber: '1913',
    powerDiscom: 'TANGEDCO Tamil Nadu Electricity Board',
    powerNumber: '1912',
    waterAgency: 'Chennai Metro Water (CMWSSB Hotline)',
    waterNumber: '044-45674567',
    trafficPoliceNumber: '103',
    disasterReliefNumber: '1070',
    specialHelpline: 'GCC WhatsApp Control: 9445477205',
    description: 'Serving Greater Chennai 15 zones, Coimbatore CMC, Madurai, and coastal Tamil Nadu districts.',
  },
  {
    id: 'telangana',
    name: 'Telangana (Hyderabad, Warangal, Nizamabad)',
    aliases: ['telangana', 'hyderabad', 'secunderabad', 'cyberabad', 'warangal', 'nizamabad', 'karimnagar'],
    capitalCity: 'Hyderabad',
    municipalAgency: 'Greater Hyderabad Municipal Corp (GHMC DRF Cell)',
    municipalNumber: '040-21111111',
    powerDiscom: 'TSSPDCL / TSNPDCL Southern Power',
    powerNumber: '1912',
    waterAgency: 'Hyderabad Metro Water (HMWSSB Customer Care)',
    waterNumber: '155313',
    trafficPoliceNumber: '040-27852482',
    disasterReliefNumber: '1070',
    specialHelpline: 'Cyberabad Police WhatsApp: 9490617100',
    description: 'Serving GHMC 30 circles, Cyberabad IT corridors, Secunderabad Cantonment, and Telangana districts.',
  },
  {
    id: 'gujarat',
    name: 'Gujarat (Ahmedabad, Surat, Vadodara, Rajkot)',
    aliases: ['gujarat', 'ahmedabad', 'surat', 'vadodara', 'rajkot', 'gandhinagar', 'bhavnagar'],
    capitalCity: 'Gandhinagar / Ahmedabad',
    municipalAgency: 'Ahmedabad Municipal Corporation (AMC Civic Control)',
    municipalNumber: '155303',
    powerDiscom: 'Torrent Power & UGVCL / PGVCL',
    powerNumber: '1912',
    waterAgency: 'AMC Water Supply & Drainage Operations',
    waterNumber: '079-25391811',
    trafficPoliceNumber: '1095',
    disasterReliefNumber: '1070',
    specialHelpline: 'Surat SMC Disaster: 0261-2423751',
    description: 'Serving AMC 7 zones, Surat Diamond City, Vadodara VMC, and Saurashtra industrial corridors.',
  },
  {
    id: 'uttar_pradesh',
    name: 'Uttar Pradesh (Lucknow, Kanpur, Noida, Varanasi)',
    aliases: ['uttar pradesh', 'lucknow', 'kanpur', 'varanasi', 'agra', 'prayagraj', 'meerut', 'up'],
    capitalCity: 'Lucknow',
    municipalAgency: 'Lucknow Municipal Corp (LMC) & State ULBs',
    municipalNumber: '1533',
    powerDiscom: 'UPPCL (Madhyanchal, Dakshinanchal, Paschimanchal)',
    powerNumber: '1912',
    waterAgency: 'UP Jal Nigam & City Water Works',
    waterNumber: '1800-180-5500',
    trafficPoliceNumber: '1090',
    disasterReliefNumber: '1070',
    specialHelpline: 'UP 112 State Emergency Center',
    description: 'Serving Lucknow, Kanpur Nagar, Varanasi Smart City, Agra Heritage Zone, and Awadh regions.',
  },
  {
    id: 'rajasthan',
    name: 'Rajasthan (Jaipur, Jodhpur, Kota, Udaipur)',
    aliases: ['rajasthan', 'jaipur', 'jodhpur', 'kota', 'udaipur', 'bikaner', 'ajmer'],
    capitalCity: 'Jaipur',
    municipalAgency: 'Jaipur Municipal Corp (JMC Heritage & Greater)',
    municipalNumber: '1800-180-6688',
    powerDiscom: 'Jaipur Vidyut Vitran Nigam (JVVNL) & Jodhpur Discom',
    powerNumber: '1912',
    waterAgency: 'Public Health Engineering Dept (PHED Rajasthan)',
    waterNumber: '181',
    trafficPoliceNumber: '1095',
    disasterReliefNumber: '1070',
    specialHelpline: 'Rajasthan Sampark Public Grievance: 181',
    description: 'Serving Jaipur Pink City, Jodhpur Sun City, Mewar Lake districts, and Marwar regions.',
  },
  {
    id: 'kerala',
    name: 'Kerala (Kochi, Thiruvananthapuram, Kozhikode)',
    aliases: ['kerala', 'kochi', 'cochin', 'thiruvananthapuram', 'trivandrum', 'kozhikode', 'calicut', 'thrissur'],
    capitalCity: 'Thiruvananthapuram',
    municipalAgency: 'Kochi & Thiruvananthapuram City Corporations',
    municipalNumber: '0484-2369007',
    powerDiscom: 'Kerala State Electricity Board (KSEB Central)',
    powerNumber: '1912',
    waterAgency: 'Kerala Water Authority (KWA Emergency Cell)',
    waterNumber: '1916',
    trafficPoliceNumber: '1099',
    disasterReliefNumber: '1077',
    specialHelpline: 'KSDMA State Disaster Management: 1070',
    description: 'Serving Kochi Metro, Trivandrum Capital Zone, Malabar coast, and Central Travancore.',
  },
  {
    id: 'punjab_haryana',
    name: 'Punjab, Haryana & Chandigarh',
    aliases: ['punjab', 'haryana', 'chandigarh', 'ludhiana', 'amritsar', 'jalandhar', 'panchkula', 'mohali'],
    capitalCity: 'Chandigarh',
    municipalAgency: 'Municipal Corporation Chandigarh (MCC) & ULBs',
    municipalNumber: '0172-2787200',
    powerDiscom: 'PSPCL Punjab & DHBVN / UHBVN Haryana',
    powerNumber: '1912',
    waterAgency: 'Chandigarh Public Health & Water Works',
    waterNumber: '0172-2740224',
    trafficPoliceNumber: '1073',
    disasterReliefNumber: '1070',
    specialHelpline: 'Gurugram MCG Control: 1800-180-1817',
    description: 'Serving Tri-City (Chandigarh, Mohali, Panchkula), Ludhiana, Amritsar, and GT Road corridor.',
  },
  {
    id: 'andhra_pradesh',
    name: 'Andhra Pradesh (Visakhapatnam, Vijayawada, Guntur)',
    aliases: ['andhra pradesh', 'andhra', 'visakhapatnam', 'vizag', 'vijayawada', 'guntur', 'tirupati'],
    capitalCity: 'Amaravati / Visakhapatnam',
    municipalAgency: 'Greater Visakhapatnam Municipal Corp (GVMC)',
    municipalNumber: '1800-425-00009',
    powerDiscom: 'APEPDCL / APSPDCL Eastern & Southern Power',
    powerNumber: '1912',
    waterAgency: 'AP Urban Water Supply & Municipal Engineering',
    waterNumber: '1800-425-1899',
    trafficPoliceNumber: '103',
    disasterReliefNumber: '1070',
    specialHelpline: 'AP Spandana Citizen Helpline: 1902',
    description: 'Serving Visakhapatnam Port Zone, Krishna-Godavari Delta, and Rayalaseema districts.',
  },
  {
    id: 'madhya_pradesh',
    name: 'Madhya Pradesh (Bhopal, Indore, Jabalpur, Gwalior)',
    aliases: ['madhya pradesh', 'bhopal', 'indore', 'jabalpur', 'gwalior', 'ujjain', 'mp'],
    capitalCity: 'Bhopal',
    municipalAgency: 'Bhopal Municipal Corp (BMC) & Indore IMC',
    municipalNumber: '155304',
    powerDiscom: 'MPPKVVCL (Madhya, Paschim, Poorv Kshetra)',
    powerNumber: '1912',
    waterAgency: 'Bhopal & Indore Water Supply Operations',
    waterNumber: '0755-2540220',
    trafficPoliceNumber: '1095',
    disasterReliefNumber: '1070',
    specialHelpline: 'Indore Smart City 311: 1800-233-1311',
    description: 'Serving Bhopal City of Lakes, Indore cleanest city zone, Malwa plateau, and Mahakoshal.',
  },
  {
    id: 'bihar_jharkhand',
    name: 'Bihar & Jharkhand (Patna, Ranchi, Jamshedpur)',
    aliases: ['bihar', 'jharkhand', 'patna', 'ranchi', 'jamshedpur', 'dhanbad', 'gaya', 'muzaffarpur'],
    capitalCity: 'Patna / Ranchi',
    municipalAgency: 'Patna Municipal Corp (PMC) & Ranchi RMC',
    municipalNumber: '155304',
    powerDiscom: 'SBPDCL / NBPDCL Bihar & JBVNL Jharkhand',
    powerNumber: '1912',
    waterAgency: 'Bihar Urban Water & Sanitation Board (BUIDCO)',
    waterNumber: '1800-345-6180',
    trafficPoliceNumber: '103',
    disasterReliefNumber: '1070',
    specialHelpline: 'Bihar State Disaster Authority: 1070',
    description: 'Serving Patna Greater Capital, Chota Nagpur plateau, and Industrial steel zones.',
  },
  {
    id: 'odisha',
    name: 'Odisha (Bhubaneswar, Cuttack, Rourkela)',
    aliases: ['odisha', 'orissa', 'bhubaneswar', 'cuttack', 'rourkela', 'puri', 'sambalpur'],
    capitalCity: 'Bhubaneswar',
    municipalAgency: 'Bhubaneswar Municipal Corporation (BMC Control)',
    municipalNumber: '1800-345-0061',
    powerDiscom: 'TP Central / Western / Southern Odisha Distribution (Tata Power)',
    powerNumber: '1912',
    waterAgency: 'WATCO Odisha Potable 24x7 Water Supply',
    waterNumber: '1800-345-7482',
    trafficPoliceNumber: '1095',
    disasterReliefNumber: '1070',
    specialHelpline: 'ODRAF Rapid Storm & Cyclone Team: 1070',
    description: 'Serving Temple City Bhubaneswar, Silver City Cuttack, Puri coastal belt, and mining belts.',
  },
  {
    id: 'assam_northeast',
    name: 'Assam & North East (Guwahati, Shillong, Agartala)',
    aliases: ['assam', 'northeast', 'guwahati', 'shillong', 'agartala', 'imphal', 'aizawl', 'kohima', 'itanagar', 'gangtok'],
    capitalCity: 'Guwahati / Dispur',
    municipalAgency: 'Guwahati Municipal Corporation (GMC Disaster Cell)',
    municipalNumber: '8811007000',
    powerDiscom: 'Assam Power Distribution (APDCL) & State Electricity',
    powerNumber: '1912',
    waterAgency: 'Guwahati Jal Board (GMDW&SB)',
    waterNumber: '0361-2600000',
    trafficPoliceNumber: '103',
    disasterReliefNumber: '1070',
    specialHelpline: 'ASDMA Assam Flood & Disaster Management: 1070',
    description: 'Serving Brahmaputra Valley, Kamrup Metropolitan, and Seven Sister states of the North East.',
  },
];

// Distance calculation using Haversine formula
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const EmergencyHotlinesModal: React.FC<EmergencyHotlinesModalProps> = ({
  onClose,
  onNavigateToMapWithPlace,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('delhi');
  const [activeTab, setActiveTab] = useState<'pan_india' | 'regional' | 'stations'>('pan_india');

  // Automatic Location Detection State
  const [detectedLoc, setDetectedLoc] = useState<{
    lat: number;
    lng: number;
    state: string;
    city: string;
    ward: string;
    accuracy: number;
    isDetecting: boolean;
    detectedAt?: number;
    error?: string;
  }>({
    lat: 28.6139,
    lng: 77.2090,
    state: 'Delhi NCR',
    city: 'New Delhi',
    ward: 'NDMC Central Ward',
    accuracy: 50,
    isDetecting: true,
  });

  // Automatically detect user's nationwide location on modal open
  const runAutoDetect = async () => {
    setDetectedLoc((prev) => ({ ...prev, isDetecting: true, error: undefined }));
    try {
      const pos = await getCurrentLivePosition();
      let stateName = 'National Capital';
      let cityName = 'Metro City';
      let wardName = 'Administrative Ward';

      try {
        const wardInfo = await reverseGeocodeWardAndDistrict(pos.lat, pos.lng);
        stateName = wardInfo.state || stateName;
        cityName = wardInfo.city || cityName;
        wardName = wardInfo.ward || wardName;
      } catch {
        // Reverse geocoding failed, use raw lat/lng
        wardName = `GPS Location (${pos.lat.toFixed(3)}, ${pos.lng.toFixed(3)})`;
      }

      setDetectedLoc({
        lat: pos.lat,
        lng: pos.lng,
        state: stateName,
        city: cityName,
        ward: wardName,
        accuracy: pos.accuracy || 100,
        isDetecting: false,
        detectedAt: Date.now(),
      });

      // Match state / city to available regional service group
      const queryStr = `${stateName} ${cityName}`.toLowerCase();
      const matched = ALL_INDIA_REGIONAL_SERVICES.find((reg) =>
        reg.aliases.some((alias) => queryStr.includes(alias))
      );
      if (matched) {
        setSelectedRegionId(matched.id);
      }
    } catch (err: any) {
      setDetectedLoc((prev) => ({
        ...prev,
        isDetecting: false,
        error: 'Location unavailable, defaulted to Pan-India center.',
      }));
    }
  };

  useEffect(() => {
    runAutoDetect();
  }, []);

  const activeRegion = useMemo(() => {
    return (
      ALL_INDIA_REGIONAL_SERVICES.find((r) => r.id === selectedRegionId) ||
      ALL_INDIA_REGIONAL_SERVICES[0]
    );
  }, [selectedRegionId]);

  // Filtered Pan-India Hotlines
  const filteredPanIndia = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return PAN_INDIA_HOTLINES;
    return PAN_INDIA_HOTLINES.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.number.includes(q) ||
        h.category.toLowerCase().includes(q) ||
        h.desc.toLowerCase().includes(q) ||
        h.jurisdiction.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Command Stations Sorted by Distance from User's Current Location
  const sortedStations = useMemo(() => {
    const list = EMERGENCY_HOTLINE_PLACES.map((place) => {
      const dist = calculateDistanceKm(
        detectedLoc.lat,
        detectedLoc.lng,
        place.location.lat,
        place.location.lng
      );
      return { ...place, distanceKm: dist };
    });

    list.sort((a, b) => a.distanceKm - b.distanceKm);

    const q = searchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.ward.toLowerCase().includes(q) ||
        p.agency.toLowerCase().includes(q) ||
        p.hotlineNumber.includes(q)
    );
  }, [detectedLoc.lat, detectedLoc.lng, searchQuery]);

  const handlePlaceClick = (place: EmergencyHotlinePlace) => {
    soundFX.playClick();
    if (onNavigateToMapWithPlace) {
      onNavigateToMapWithPlace(place);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#131b26] text-[#121c28] dark:text-gray-100 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-red-100 dark:border-[#2d3748] flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center shadow-xs">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-[#121c28] dark:text-white">
                  Pan-India Emergency Response & Regional Hotline Network
                </h2>
                <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  24x7 Live
                </span>
              </div>
              <p className="text-xs text-[#56596e] dark:text-gray-400">
                Nationwide 112 emergency routing + {ALL_INDIA_REGIONAL_SERVICES.length} state jurisdictions & {EMERGENCY_HOTLINE_PLACES.length} GPS stations
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-[#737686] transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Location Detector Bar */}
        <div className="mt-3 p-2.5 sm:p-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100/70 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-900/30 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              {detectedLoc.isDetecting ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <LocateFixed className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase text-blue-900 dark:text-blue-300">
                  {detectedLoc.isDetecting ? 'Detecting Live Location...' : 'Your Detected Location in India:'}
                </span>
                {!detectedLoc.isDetecting && (
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold px-2 py-0.2 rounded-md border border-emerald-300 dark:border-emerald-800">
                    GPS Accurate (±{detectedLoc.accuracy}m)
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">
                📍 {detectedLoc.city}, {detectedLoc.state} <span className="text-gray-500 dark:text-gray-400 font-normal">({detectedLoc.ward})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                runAutoDetect();
              }}
              disabled={detectedLoc.isDetecting}
              className="px-3 py-1 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:bg-blue-50 text-[11px] font-extrabold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Refresh GPS Location"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Re-Detect Location</span>
            </button>
          </div>
        </div>

        {/* Search & Navigation Bar */}
        <div className="mt-2.5 space-y-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search emergency services (e.g. 112, fire, police, water, power, trauma, highway)..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm focus:bg-white dark:focus:bg-gray-800 focus:border-[#0050c8] outline-hidden text-[#121c28] dark:text-white placeholder-gray-400"
              />
            </div>

            {/* Quick State/Territory Dropdown Picker */}
            <div className="sm:w-64">
              <select
                value={selectedRegionId}
                onChange={(e) => {
                  soundFX.playClick();
                  setSelectedRegionId(e.target.value);
                  setActiveTab('regional');
                }}
                className="w-full py-2 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 focus:border-blue-500 outline-hidden cursor-pointer"
                title="Select State or Union Territory"
              >
                {ALL_INDIA_REGIONAL_SERVICES.map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    🏛️ {reg.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setActiveTab('pan_india');
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'pan_india'
                  ? 'bg-white dark:bg-gray-700 text-[#0050c8] dark:text-blue-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
              <span>National Unified (112 / 108 / 101)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setActiveTab('regional');
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'regional'
                  ? 'bg-white dark:bg-gray-700 text-[#0050c8] dark:text-blue-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>State & Municipal Helplines</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setActiveTab('stations');
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'stations'
                  ? 'bg-white dark:bg-gray-700 text-[#0050c8] dark:text-blue-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nearby Command Stations ({sortedStations.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Pan-India Master Hotlines */}
        {activeTab === 'pan_india' && (
          <div className="mt-2.5 space-y-2.5 overflow-y-auto pr-1 flex-1">
            {/* Warning Banner */}
            <div className="p-2.5 bg-red-50/90 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/50 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-900 dark:text-red-200 leading-relaxed font-medium">
                <strong className="font-bold">Life-Threatening Emergency?</strong> For active building fires, sparking live wires, or severe accidents with injuries, call <strong className="font-extrabold text-red-700 dark:text-red-300">112</strong> immediately. It operates 24/7 across all states and union territories of India.
              </p>
            </div>

            {filteredPanIndia.map((h, i) => {
              const placesForHotline = EMERGENCY_HOTLINE_PLACES.filter(
                (p) => p.hotlineNumber === h.number
              );

              return (
                <div
                  key={i}
                  className={`p-3.5 rounded-2xl border ${h.bgColor} transition-all hover:shadow-xs space-y-2`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-xs flex-shrink-0 mt-0.5">
                        {h.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-xs sm:text-sm text-[#121c28] dark:text-white">{h.name}</h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                            {h.jurisdiction}
                          </span>
                        </div>
                        <p className="text-xs text-[#56596e] dark:text-gray-300 mt-0.5 leading-relaxed">{h.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end sm:flex-shrink-0 gap-2">
                      <a
                        href={`tel:${h.number.replace(/[^0-9]/g, '')}`}
                        onClick={() => soundFX.playAlert()}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-transform hover:scale-105 active:scale-95 ${
                          h.isImmediateEmergency
                            ? 'bg-red-600 text-white hover:bg-red-700 ring-2 ring-red-200'
                            : 'bg-white dark:bg-gray-800 text-[#121c28] dark:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <PhoneForwarded className="w-3.5 h-3.5" />
                        <span>Call {h.number}</span>
                      </a>
                    </div>
                  </div>

                  {placesForHotline.length > 0 && (
                    <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[10px] text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1 font-bold">
                        <MapPin className="w-3 h-3 text-blue-600" />
                        <span>{placesForHotline.length} command bases plotted across India</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('stations');
                        }}
                        className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>View nearby bases</span>
                        <span>→</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: State & Municipal Jurisdiction Helplines */}
        {activeTab === 'regional' && (
          <div className="mt-2.5 space-y-3 overflow-y-auto pr-1 flex-1">
            <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/40">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-blue-950 dark:text-blue-200 flex items-center gap-2">
                    <span>🏛️</span>
                    <span>{activeRegion.name}</span>
                  </h3>
                  <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                    {activeRegion.description}
                  </p>
                </div>
                <span className="text-[10px] bg-blue-600 text-white font-black px-2 py-0.5 rounded-full shrink-0">
                  {activeRegion.capitalCity}
                </span>
              </div>
            </div>

            {/* Regional Service Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Municipal Corporation Disaster & Grievance */}
              <div className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-gray-900 dark:text-white">Municipal Disaster & ULB</span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">
                  {activeRegion.municipalAgency}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-mono font-black text-blue-700 dark:text-blue-400">
                    {activeRegion.municipalNumber}
                  </span>
                  <a
                    href={`tel:${activeRegion.municipalNumber.replace(/[^0-9]/g, '')}`}
                    onClick={() => soundFX.playAlert()}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 shadow-2xs"
                  >
                    <PhoneForwarded className="w-3 h-3" />
                    <span>Call ULB</span>
                  </a>
                </div>
              </div>

              {/* State Power DISCOM Live Wire Emergency */}
              <div className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-gray-900 dark:text-white">State Electricity Grid Hazard</span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">
                  {activeRegion.powerDiscom}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-mono font-black text-yellow-700 dark:text-yellow-400">
                    {activeRegion.powerNumber}
                  </span>
                  <a
                    href={`tel:${activeRegion.powerNumber.replace(/[^0-9]/g, '')}`}
                    onClick={() => soundFX.playAlert()}
                    className="px-2.5 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 shadow-2xs"
                  >
                    <PhoneForwarded className="w-3 h-3" />
                    <span>Call Power</span>
                  </a>
                </div>
              </div>

              {/* Water Board & Sewerage Breach */}
              <div className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 flex items-center justify-center">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-gray-900 dark:text-white">Potable Water & Open Drain</span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">
                  {activeRegion.waterAgency}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-mono font-black text-cyan-700 dark:text-cyan-400">
                    {activeRegion.waterNumber}
                  </span>
                  <a
                    href={`tel:${activeRegion.waterNumber.replace(/[^0-9]/g, '')}`}
                    onClick={() => soundFX.playAlert()}
                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 shadow-2xs"
                  >
                    <PhoneForwarded className="w-3 h-3" />
                    <span>Call Water</span>
                  </a>
                </div>
              </div>

              {/* Traffic Police & Disaster Management */}
              <div className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 flex items-center justify-center">
                    <Car className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-gray-900 dark:text-white">Traffic Control & SDMA</span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">
                  Traffic: {activeRegion.trafficPoliceNumber} | SDMA: {activeRegion.disasterReliefNumber}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-mono font-black text-orange-700 dark:text-orange-400">
                    SDMA: {activeRegion.disasterReliefNumber}
                  </span>
                  <a
                    href={`tel:${activeRegion.disasterReliefNumber.replace(/[^0-9]/g, '')}`}
                    onClick={() => soundFX.playAlert()}
                    className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 shadow-2xs"
                  >
                    <PhoneForwarded className="w-3 h-3" />
                    <span>Call Disaster</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Quick State Switcher Pills */}
            <div className="pt-2">
              <span className="text-[11px] font-extrabold uppercase text-gray-500 dark:text-gray-400 block mb-1.5">
                Switch State or Union Territory:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {ALL_INDIA_REGIONAL_SERVICES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setSelectedRegionId(r.id);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      selectedRegionId === r.id
                        ? 'bg-[#0050c8] text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {r.name.split('(')[0].trim()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Nearest Physical Command Stations across India */}
        {activeTab === 'stations' && (
          <div className="mt-2.5 space-y-2.5 overflow-y-auto pr-1 flex-1">
            <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
              <span className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>GPS distance sorted from your coordinates ({detectedLoc.city}, {detectedLoc.state})</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToMapWithPlace && sortedStations.length > 0) {
                    onNavigateToMapWithPlace(sortedStations[0]);
                  }
                }}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Navigation className="w-3 h-3" />
                <span>Fly to Closest Station</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sortedStations.map((place, idx) => (
                <div
                  key={place.id}
                  className={`p-3 rounded-2xl border transition-all space-y-1.5 ${
                    idx === 0
                      ? 'bg-blue-50/50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800 ring-1 ring-blue-300'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                          Dial {place.hotlineNumber}
                        </span>
                        {idx === 0 && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                            ★ Nearest Base
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-gray-900 dark:text-white mt-1 leading-tight">
                        {place.name}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400 block">
                        ~{place.distanceKm} km
                      </span>
                      <span className="text-[9px] text-gray-500 dark:text-gray-400">
                        ~{place.responseTimeMinutes}m response
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                    📍 {place.address}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[150px]">
                      {place.ward}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${place.hotlineNumber}`}
                        onClick={() => soundFX.playAlert()}
                        className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-800 dark:text-gray-200 text-[10px] font-bold rounded-lg flex items-center gap-1"
                      >
                        <PhoneCall className="w-2.5 h-2.5" />
                        <span>Call</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handlePlaceClick(place)}
                        className="px-2 py-0.5 bg-[#0050c8] hover:bg-[#003da1] text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <MapPin className="w-2.5 h-2.5" />
                        <span>View on Map</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-[#737686] dark:text-gray-400">
          <span className="flex items-center gap-1">
            <LifeBuoy className="w-3.5 h-3.5 text-[#0050c8] dark:text-blue-400" />
            <span>Pan-India verified toll-free emergency network</span>
          </span>
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl font-bold bg-gray-100 dark:bg-gray-800 text-[#121c28] dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
