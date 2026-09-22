import { TrafficSegment, InfrastructureHotspot, WardBoundary } from '../types';

// ==========================================
// 1. CURATED REAL-WORLD TRAFFIC CORRIDORS
// ==========================================
export const CURATED_TRAFFIC_SEGMENTS: TrafficSegment[] = [
  // Delhi NCR
  {
    id: 'trf-del-01',
    corridorName: 'Connaught Place Outer Circle',
    city: 'New Delhi',
    level: 'moderate',
    speedKmh: 28,
    freeFlowSpeedKmh: 45,
    delayMinutes: 6,
    incident: 'Signal synchronization delay at Barakhamba intersection',
    coordinates: [
      [28.6345, 77.2165],
      [28.6341, 77.2215],
      [28.6315, 77.2242],
      [28.6282, 77.2218],
      [28.6275, 77.2170],
      [28.6300, 77.2140],
      [28.6345, 77.2165],
    ],
    lastUpdated: 'Live (2 mins ago)',
  },
  {
    id: 'trf-del-02',
    corridorName: 'Ring Road • AIIMS to Moolchand Flyover',
    city: 'New Delhi',
    level: 'congested',
    speedKmh: 14,
    freeFlowSpeedKmh: 50,
    delayMinutes: 18,
    incident: 'Emergency road maintenance near South Extension',
    coordinates: [
      [28.5682, 77.2075],
      [28.5695, 77.2178],
      [28.5698, 77.2285],
      [28.5665, 77.2372],
    ],
    lastUpdated: 'Live (Just now)',
  },
  {
    id: 'trf-del-03',
    corridorName: 'Barapullah Elevated Corridor',
    city: 'New Delhi',
    level: 'smooth',
    speedKmh: 58,
    freeFlowSpeedKmh: 60,
    delayMinutes: 0,
    coordinates: [
      [28.5830, 77.2320],
      [28.5855, 77.2480],
      [28.5890, 77.2620],
    ],
    lastUpdated: 'Live (1 min ago)',
  },

  // Bengaluru
  {
    id: 'trf-blr-01',
    corridorName: '100 Feet Road • Indiranagar Corridor',
    city: 'Bengaluru',
    level: 'congested',
    speedKmh: 16,
    freeFlowSpeedKmh: 40,
    delayMinutes: 14,
    incident: 'High vehicle volume near 12th Main junction',
    coordinates: [
      [12.9815, 77.6418],
      [12.9719, 77.6412],
      [12.9645, 77.6405],
      [12.9575, 77.6398],
    ],
    lastUpdated: 'Live (3 mins ago)',
  },
  {
    id: 'trf-blr-02',
    corridorName: 'Outer Ring Road • Silk Board to Marathahalli',
    city: 'Bengaluru',
    level: 'blocked',
    speedKmh: 8,
    freeFlowSpeedKmh: 50,
    delayMinutes: 28,
    incident: 'Metro line lane constriction & water drain trenching',
    coordinates: [
      [12.9175, 77.6235],
      [12.9238, 77.6520],
      [12.9360, 77.6835],
      [12.9565, 77.7010],
    ],
    lastUpdated: 'Live (Just now)',
  },
  {
    id: 'trf-blr-03',
    corridorName: 'MG Road to Trinity Circle',
    city: 'Bengaluru',
    level: 'smooth',
    speedKmh: 42,
    freeFlowSpeedKmh: 45,
    delayMinutes: 2,
    coordinates: [
      [12.9752, 77.6045],
      [12.9740, 77.6140],
      [12.9725, 77.6210],
    ],
    lastUpdated: 'Live (4 mins ago)',
  },

  // Mumbai
  {
    id: 'trf-mum-01',
    corridorName: 'Western Express Highway • Bandra to Andheri',
    city: 'Mumbai',
    level: 'congested',
    speedKmh: 18,
    freeFlowSpeedKmh: 60,
    delayMinutes: 22,
    incident: 'Heavy evening commute surge at Airport flyover',
    coordinates: [
      [19.0600, 77.8480],
      [19.0780, 72.8520],
      [19.0980, 72.8540],
      [19.1190, 72.8560],
    ],
    lastUpdated: 'Live (1 min ago)',
  },
  {
    id: 'trf-mum-02',
    corridorName: 'Bandra-Worli Sea Link',
    city: 'Mumbai',
    level: 'smooth',
    speedKmh: 75,
    freeFlowSpeedKmh: 80,
    delayMinutes: 0,
    coordinates: [
      [19.0430, 72.8180],
      [19.0300, 72.8150],
      [19.0120, 72.8130],
      [18.9980, 72.8140],
    ],
    lastUpdated: 'Live (Just now)',
  },

  // Chennai
  {
    id: 'trf-chn-01',
    corridorName: 'Anna Salai (Mount Road) • Gemini to Guindy',
    city: 'Chennai',
    level: 'moderate',
    speedKmh: 31,
    freeFlowSpeedKmh: 50,
    delayMinutes: 8,
    incident: 'Bus breakdown cleared, lingering queue',
    coordinates: [
      [13.0520, 80.2510],
      [13.0330, 80.2310],
      [13.0110, 80.2110],
    ],
    lastUpdated: 'Live (5 mins ago)',
  },

  // Hyderabad
  {
    id: 'trf-hyd-01',
    corridorName: 'Hitec City Main Road • Cyber Towers to Bio-Diversity',
    city: 'Hyderabad',
    level: 'congested',
    speedKmh: 15,
    freeFlowSpeedKmh: 45,
    delayMinutes: 16,
    incident: 'IT park shift change traffic bottleneck',
    coordinates: [
      [17.4505, 78.3810],
      [17.4410, 78.3750],
      [17.4310, 78.3730],
    ],
    lastUpdated: 'Live (Just now)',
  },
];

// ==========================================
// 2. CURATED INFRASTRUCTURE HOTSPOTS
// ==========================================
export const CURATED_INFRASTRUCTURE_HOTSPOTS: InfrastructureHotspot[] = [
  // Delhi NCR
  {
    id: 'inf-del-01',
    name: 'NDMC 66kV Substation Sub-Grid Hub',
    category: 'electrical_substation',
    categoryLabel: 'Power Grid Substation',
    location: { lat: 28.6328, lng: 77.2205 },
    ward: 'Zone 1 (Connaught Place)',
    city: 'New Delhi',
    healthScore: 68,
    status: 'warning',
    telemetry: {
      primaryMetric: 'Transformer Load',
      metricValue: '88% Peak Capacity',
      secondaryMetric: 'Core Temp',
      secondaryValue: '64°C (Normal <60°)',
      lastServiced: '14 days ago',
      monitoringAgency: 'NDMC Electrical Transmission Division',
      emergencyContact: '1912 / 011-23340000',
    },
    alert: 'High thermal load during peak afternoon HVAC cycle. Phase 2 backup standby engaged.',
  },
  {
    id: 'inf-del-02',
    name: 'Delhi Jal Board Booster Pumping Station #4',
    category: 'water_pumping',
    categoryLabel: 'Municipal Water Station',
    location: { lat: 28.5520, lng: 77.2050 },
    ward: 'Hauz Khas Ward 48',
    city: 'New Delhi',
    healthScore: 94,
    status: 'nominal',
    telemetry: {
      primaryMetric: 'Flow Rate',
      metricValue: '192 MLD Discharge',
      secondaryMetric: 'Pipeline Pressure',
      secondaryValue: '4.6 bar',
      lastServiced: '3 days ago',
      monitoringAgency: 'Delhi Jal Board (DJB)',
      emergencyContact: '1916 / 011-23527699',
    },
  },
  {
    id: 'inf-del-03',
    name: 'Barapullah Stormwater Sluice & Silt Trap',
    category: 'stormwater_sluice',
    categoryLabel: 'Storm Drainage & Sluice',
    location: { lat: 28.5840, lng: 77.2420 },
    ward: 'Defence Colony Ward 54',
    city: 'New Delhi',
    healthScore: 52,
    status: 'critical',
    telemetry: {
      primaryMetric: 'Silt Blockage Level',
      metricValue: '76% Accumulation',
      secondaryMetric: 'Drain Velocity',
      secondaryValue: '0.4 m/s (Sub-optimal)',
      lastServiced: '28 days ago',
      monitoringAgency: 'Irrigation & Flood Control Dept',
      emergencyContact: '011-23860525',
    },
    alert: 'Critical sediment build-up risking monsoon waterlogging backflow along ring road.',
  },

  // Bengaluru
  {
    id: 'inf-blr-01',
    name: 'Indiranagar 66/11kV Substation & Power Station',
    category: 'electrical_substation',
    categoryLabel: 'Power Grid Substation',
    location: { lat: 12.9735, lng: 77.6432 },
    ward: 'Indiranagar (Ward 112)',
    city: 'Bengaluru',
    healthScore: 91,
    status: 'nominal',
    telemetry: {
      primaryMetric: 'Feed Voltage',
      metricValue: '66.2 kV Steady',
      secondaryMetric: 'Feeder Outages',
      secondaryValue: '0 Active',
      lastServiced: '5 days ago',
      monitoringAgency: 'BESCOM East Circle',
      emergencyContact: '1912',
    },
  },
  {
    id: 'inf-blr-02',
    name: 'BWSSB Koramangala 100 MLD Sewage & Sluice Gate',
    category: 'stormwater_sluice',
    categoryLabel: 'SWD Sluice & Pumping',
    location: { lat: 12.9380, lng: 77.6295 },
    ward: 'Koramangala (Ward 151)',
    city: 'Bengaluru',
    healthScore: 59,
    status: 'warning',
    telemetry: {
      primaryMetric: 'SWD Basin Depth',
      metricValue: '2.8m / 4.0m Max',
      secondaryMetric: 'Trash Rack Blockage',
      secondaryValue: '48% Debris Trapped',
      lastServiced: '11 days ago',
      monitoringAgency: 'BBMP Stormwater Drain Wing',
      emergencyContact: '1533 / 080-22221188',
    },
    alert: 'Screen debris accumulation detected by ultrasonic IoT depth sensor.',
  },
  {
    id: 'inf-blr-03',
    name: 'Majestic Kempegowda Multi-Modal Transit Interchange',
    category: 'transit_hub',
    categoryLabel: 'Transit Mega-Hub',
    location: { lat: 12.9774, lng: 77.5724 },
    ward: 'Subhash Nagar (Ward 95)',
    city: 'Bengaluru',
    healthScore: 89,
    status: 'nominal',
    telemetry: {
      primaryMetric: 'Passenger Throughput',
      metricValue: '46,000 / hr',
      secondaryMetric: 'BMTC Bus Turnaround',
      secondaryValue: '96% on schedule',
      lastServiced: 'Yesterday',
      monitoringAgency: 'BMRCL & BMTC Joint Command',
      emergencyContact: '080-22942222',
    },
  },
  {
    id: 'inf-blr-04',
    name: 'Whitefield Automated Smart Solid Waste Compactor',
    category: 'waste_compactor',
    categoryLabel: 'IoT Waste Compactor',
    location: { lat: 12.9690, lng: 77.7485 },
    ward: 'Whitefield (Ward 84)',
    city: 'Bengaluru',
    healthScore: 48,
    status: 'critical',
    telemetry: {
      primaryMetric: 'Hydraulic Compaction',
      metricValue: '93% Filled Capacity',
      secondaryMetric: 'Odor Scrubber',
      secondaryValue: 'Filter replacement due',
      lastServiced: '18 days ago',
      monitoringAgency: 'Solid Waste Management Cell BBMP',
      emergencyContact: '1533',
    },
    alert: 'Compactor chamber reached 93% volume; evacuation hauler dispatch overdue.',
  },

  // Mumbai
  {
    id: 'inf-mum-01',
    name: 'Bandra Reclamation Stormwater Pumping Station (SWD)',
    category: 'stormwater_sluice',
    categoryLabel: 'Tidal Sluice & Pumping',
    location: { lat: 19.0490, lng: 72.8250 },
    ward: 'Ward H-West (Bandra)',
    city: 'Mumbai',
    healthScore: 85,
    status: 'nominal',
    telemetry: {
      primaryMetric: 'Pumping Capacity',
      metricValue: '6,000 m³/hr',
      secondaryMetric: 'Tidal Flap Gates',
      secondaryValue: 'Operational',
      lastServiced: '6 days ago',
      monitoringAgency: 'BMC Stormwater Drainage Dept',
      emergencyContact: '1916',
    },
  },
  {
    id: 'inf-mum-02',
    name: 'Mahim Creek Rail & Road Bridge Span',
    category: 'bridge_flyover',
    categoryLabel: 'Critical Bridge Infrastructure',
    location: { lat: 19.0410, lng: 72.8420 },
    ward: 'Ward G-North (Dharavi / Mahim)',
    city: 'Mumbai',
    healthScore: 64,
    status: 'warning',
    telemetry: {
      primaryMetric: 'Vibration Sensors',
      metricValue: '0.18 mm/s² RMS',
      secondaryMetric: 'Expansion Joints',
      secondaryValue: 'Minor misalignment',
      lastServiced: '22 days ago',
      monitoringAgency: 'MMRDA Infrastructure Cell',
      emergencyContact: '022-26594000',
    },
    alert: 'Expansion joint seal requires mastic re-caulking before monsoon.',
  },

  // Chennai
  {
    id: 'inf-chn-01',
    name: 'T. Nagar 110kV Substation & Distribution Loop',
    category: 'electrical_substation',
    categoryLabel: 'Power Grid Substation',
    location: { lat: 13.0425, lng: 80.2335 },
    ward: 'Zone 10 (Kodambakkam / T. Nagar)',
    city: 'Chennai',
    healthScore: 87,
    status: 'nominal',
    telemetry: {
      primaryMetric: 'Grid Load',
      metricValue: '72% Nominal',
      secondaryMetric: 'Earthing Resistance',
      secondaryValue: '0.8 Ohm',
      lastServiced: '8 days ago',
      monitoringAgency: 'TANGEDCO South Division',
      emergencyContact: '1912',
    },
  },

  // Hyderabad
  {
    id: 'inf-hyd-01',
    name: 'Durgam Cheruvu Sluice & Aeration Plant',
    category: 'water_pumping',
    categoryLabel: 'Lake Inflow & Water Plant',
    location: { lat: 17.4330, lng: 78.3880 },
    ward: 'Circle 20 (Serilingampally / Hitec)',
    city: 'Hyderabad',
    healthScore: 92,
    status: 'nominal',
    telemetry: {
      primaryMetric: 'Dissolved Oxygen',
      metricValue: '5.8 mg/L',
      secondaryMetric: 'Aerator Units',
      secondaryValue: '12 / 12 Active',
      lastServiced: '2 days ago',
      monitoringAgency: 'GHMC Lakes Wing & HMWSSB',
      emergencyContact: '155313',
    },
  },
];

// ==========================================
// 3. CURATED WARD BOUNDARIES OVERLAYS
// ==========================================
export const CURATED_WARD_BOUNDARIES: WardBoundary[] = [
  // Delhi
  {
    id: 'wrd-del-01',
    wardNumber: 'Zone 1',
    wardName: 'Connaught Place & Chanakyapuri Diplomatic Enclave',
    corporation: 'New Delhi Municipal Council (NDMC)',
    city: 'New Delhi',
    state: 'Delhi',
    color: '#0050c8',
    centroid: { lat: 28.6250, lng: 77.2100 },
    population: 185000,
    areaSqKm: 14.2,
    executiveOfficer: 'Er. Rajesh Bhargava (Superintending Engineer)',
    officerContact: '011-23360155',
    activeGrievances: 14,
    resolutionRate: 93.5,
    keyLandmarks: ['Connaught Place', 'Rashtrapati Bhavan Perimeter', 'India Gate lawns', 'Chanakyapuri'],
    boundary: [
      [28.6390, 77.2020],
      [28.6410, 77.2250],
      [28.6280, 77.2340],
      [28.6110, 77.2300],
      [28.6050, 77.2050],
      [28.6140, 77.1950],
      [28.6310, 77.1980],
      [28.6390, 77.2020],
    ],
  },
  {
    id: 'wrd-del-02',
    wardNumber: 'Ward 48',
    wardName: 'Hauz Khas, Green Park & Safdarjung Enclave',
    corporation: 'Municipal Corporation of Delhi (South Zone)',
    city: 'New Delhi',
    state: 'Delhi',
    color: '#10B981',
    centroid: { lat: 28.5520, lng: 77.2060 },
    population: 242000,
    areaSqKm: 11.8,
    executiveOfficer: 'Shri Vikramaditya Saxena (Zonal Commissioner)',
    officerContact: '011-26514332',
    activeGrievances: 29,
    resolutionRate: 86.4,
    keyLandmarks: ['AIIMS Medical District', 'Hauz Khas Village', 'Green Park Main', 'Deer Park'],
    boundary: [
      [28.5680, 77.1950],
      [28.5720, 77.2200],
      [28.5550, 77.2260],
      [28.5380, 77.2180],
      [28.5340, 77.1980],
      [28.5490, 77.1880],
      [28.5680, 77.1950],
    ],
  },

  // Bengaluru
  {
    id: 'wrd-blr-01',
    wardNumber: 'Ward 112',
    wardName: 'Indiranagar & HAL 2nd Stage',
    corporation: 'Bruhat Bengaluru Mahanagara Palike (East Zone)',
    city: 'Bengaluru',
    state: 'Karnataka',
    color: '#1d68f2',
    centroid: { lat: 12.9719, lng: 77.6412 },
    population: 78500,
    areaSqKm: 6.4,
    executiveOfficer: 'Er. Anand Gowda (Assistant Executive Engineer)',
    officerContact: '080-22975812',
    activeGrievances: 22,
    resolutionRate: 89.2,
    keyLandmarks: ['100 Feet Road', '12th Main Commerce Hub', 'Indiranagar Metro', 'BDA Complex'],
    boundary: [
      [12.9840, 77.6320],
      [12.9850, 77.6520],
      [12.9720, 77.6560],
      [12.9590, 77.6490],
      [12.9580, 77.6330],
      [12.9690, 77.6280],
      [12.9840, 77.6320],
    ],
  },
  {
    id: 'wrd-blr-02',
    wardNumber: 'Ward 151',
    wardName: 'Koramangala 1st to 8th Blocks',
    corporation: 'Bruhat Bengaluru Mahanagara Palike (South Zone)',
    city: 'Bengaluru',
    state: 'Karnataka',
    color: '#8b5cf6',
    centroid: { lat: 12.9352, lng: 77.6245 },
    population: 94000,
    areaSqKm: 7.9,
    executiveOfficer: 'Smt. Kavitha Reddy (Ward Revenue Officer)',
    officerContact: '080-25531144',
    activeGrievances: 34,
    resolutionRate: 84.8,
    keyLandmarks: ['80 Feet Road', 'Koramangala Indoor Stadium', 'Sony World Junction', 'Wipro Park'],
    boundary: [
      [12.9480, 77.6110],
      [12.9510, 77.6380],
      [12.9330, 77.6450],
      [12.9210, 77.6320],
      [12.9220, 77.6140],
      [12.9360, 77.6080],
      [12.9480, 77.6110],
    ],
  },
  {
    id: 'wrd-blr-03',
    wardNumber: 'Ward 84',
    wardName: 'Whitefield & ITPL Tech Corridor',
    corporation: 'Bruhat Bengaluru Mahanagara Palike (Mahadevapura)',
    city: 'Bengaluru',
    state: 'Karnataka',
    color: '#ea580c',
    centroid: { lat: 12.9698, lng: 77.7499 },
    population: 135000,
    areaSqKm: 18.5,
    executiveOfficer: 'Er. Ramesh Babu (Zonal Executive Engineer)',
    officerContact: '080-28452277',
    activeGrievances: 41,
    resolutionRate: 81.6,
    keyLandmarks: ['ITPB Technology Park', 'Hope Farm Junction', 'Kadugodi Metro', 'Forum South'],
    boundary: [
      [12.9880, 77.7300],
      [12.9910, 77.7700],
      [12.9650, 77.7780],
      [12.9490, 77.7550],
      [12.9510, 77.7280],
      [12.9730, 77.7210],
      [12.9880, 77.7300],
    ],
  },

  // Mumbai
  {
    id: 'wrd-mum-01',
    wardNumber: 'Ward H-West',
    wardName: 'Bandra West, Khar & Santacruz West',
    corporation: 'Brihanmumbai Municipal Corporation (BMC)',
    city: 'Mumbai',
    state: 'Maharashtra',
    color: '#0284c7',
    centroid: { lat: 19.0590, lng: 72.8350 },
    population: 320000,
    areaSqKm: 12.5,
    executiveOfficer: 'Shri Vinayak Vispute (Assistant Municipal Commissioner)',
    officerContact: '022-26422311',
    activeGrievances: 38,
    resolutionRate: 91.2,
    keyLandmarks: ['Carter Road Promenade', 'Bandra Bandstand', 'Linking Road', 'Hill Road'],
    boundary: [
      [19.0750, 72.8220],
      [19.0780, 72.8460],
      [19.0550, 72.8520],
      [19.0390, 72.8380],
      [19.0420, 72.8180],
      [19.0620, 72.8150],
      [19.0750, 72.8220],
    ],
  },

  // Chennai
  {
    id: 'wrd-chn-01',
    wardNumber: 'Zone 10',
    wardName: 'T. Nagar, Kodambakkam & Vadapalani',
    corporation: 'Greater Chennai Corporation (GCC)',
    city: 'Chennai',
    state: 'Tamil Nadu',
    color: '#059669',
    centroid: { lat: 13.0420, lng: 80.2280 },
    population: 290000,
    areaSqKm: 13.2,
    executiveOfficer: 'Er. S. Radhakrishnan (Zonal Officer)',
    officerContact: '044-24340555',
    activeGrievances: 26,
    resolutionRate: 88.0,
    keyLandmarks: ['Pondy Bazaar Pedestrian Plaza', 'Panagal Park', 'Usman Road Flyover'],
    boundary: [
      [13.0600, 80.2120],
      [13.0640, 80.2450],
      [13.0380, 80.2520],
      [13.0220, 80.2310],
      [13.0280, 80.2080],
      [13.0490, 80.2020],
      [13.0600, 80.2120],
    ],
  },

  // Hyderabad
  {
    id: 'wrd-hyd-01',
    wardNumber: 'Circle 20',
    wardName: 'Hitec City, Madhapur, Gachibowli & Serilingampally',
    corporation: 'Greater Hyderabad Municipal Corporation (GHMC)',
    city: 'Hyderabad',
    state: 'Telangana',
    color: '#d97706',
    centroid: { lat: 17.4420, lng: 78.3780 },
    population: 360000,
    areaSqKm: 24.6,
    executiveOfficer: 'Shri N. Ravi Kumar (Zonal Commissioner)',
    officerContact: '040-21111111',
    activeGrievances: 31,
    resolutionRate: 90.1,
    keyLandmarks: ['Cyber Towers', 'Durgam Cheruvu Cable Bridge', 'Inorbit Mall', 'Gachibowli Stadium'],
    boundary: [
      [17.4650, 78.3550],
      [17.4680, 78.4020],
      [17.4320, 78.4110],
      [17.4150, 78.3850],
      [17.4180, 78.3520],
      [17.4450, 78.3420],
      [17.4650, 78.3550],
    ],
  },
];

// =======================================================
// 4. DYNAMIC ADAPTIVE GENERATORS FOR ANY LOCATION IN INDIA
// =======================================================

// Approximate distance helper (Euclidean in degrees for quick geospatial radius)
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * 111;
  const dLng = (lng2 - lng1) * 111 * Math.cos((lat1 * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Returns relevant traffic segments:
 * Always returns curated segments within 40km of the target center,
 * or dynamically synthesizes realistic arterial traffic segments around the center point!
 */
export function getActiveTrafficSegments(centerLat: number = 28.6139, centerLng: number = 77.2090): TrafficSegment[] {
  const nearbyCurated = CURATED_TRAFFIC_SEGMENTS.filter((seg) => {
    if (!seg.coordinates[0]) return false;
    const [cLat, cLng] = seg.coordinates[0];
    return getDistanceKm(centerLat, centerLng, cLat, cLng) <= 50;
  });

  if (nearbyCurated.length > 0) {
    return nearbyCurated;
  }

  // Generate dynamic arterial corridors around current center
  const dLat = 0.015;
  const dLng = 0.02;

  return [
    {
      id: `dyn-trf-arterial-1`,
      corridorName: 'Main Municipal Arterial Corridor',
      city: 'Local Ward Zone',
      level: 'congested',
      speedKmh: 19,
      freeFlowSpeedKmh: 45,
      delayMinutes: 12,
      incident: 'Peak hour transit volume near central junction',
      coordinates: [
        [centerLat - dLat * 1.4, centerLng - dLng * 1.1],
        [centerLat - dLat * 0.5, centerLng - dLng * 0.3],
        [centerLat + dLat * 0.4, centerLng + dLng * 0.5],
        [centerLat + dLat * 1.3, centerLng + dLng * 1.2],
      ],
      lastUpdated: 'Live (Just now)',
    },
    {
      id: `dyn-trf-ring-2`,
      corridorName: 'Circumferential Ring Link Road',
      city: 'Local Ward Zone',
      level: 'moderate',
      speedKmh: 34,
      freeFlowSpeedKmh: 50,
      delayMinutes: 5,
      coordinates: [
        [centerLat + dLat * 1.1, centerLng - dLng * 1.3],
        [centerLat + dLat * 0.6, centerLng - dLng * 0.4],
        [centerLat - dLat * 0.3, centerLng + dLng * 0.7],
        [centerLat - dLat * 1.2, centerLng + dLng * 1.4],
      ],
      lastUpdated: 'Live (1 min ago)',
    },
    {
      id: `dyn-trf-express-3`,
      corridorName: 'Express Transit Flyover By-pass',
      city: 'Local Ward Zone',
      level: 'smooth',
      speedKmh: 56,
      freeFlowSpeedKmh: 60,
      delayMinutes: 0,
      coordinates: [
        [centerLat - dLat * 0.1, centerLng - dLng * 1.8],
        [centerLat, centerLng],
        [centerLat + dLat * 0.1, centerLng + dLng * 1.8],
      ],
      lastUpdated: 'Live (3 mins ago)',
    },
  ];
}

/**
 * Returns active infrastructure hotspots around current map center
 */
export function getActiveInfrastructureHotspots(centerLat: number = 28.6139, centerLng: number = 77.2090): InfrastructureHotspot[] {
  const nearbyCurated = CURATED_INFRASTRUCTURE_HOTSPOTS.filter((hotspot) => {
    return getDistanceKm(centerLat, centerLng, hotspot.location.lat, hotspot.location.lng) <= 50;
  });

  if (nearbyCurated.length > 0) {
    return nearbyCurated;
  }

  // Generate localized infrastructure hotspots
  return [
    {
      id: 'dyn-inf-substation',
      name: 'Central 66/11kV Power Substation',
      category: 'electrical_substation',
      categoryLabel: 'Power Grid Substation',
      location: { lat: centerLat + 0.007, lng: centerLng + 0.009 },
      ward: 'Central Ward Division',
      city: 'Municipal Zone',
      healthScore: 78,
      status: 'nominal',
      telemetry: {
        primaryMetric: 'Grid Load',
        metricValue: '82% Nominal',
        secondaryMetric: 'Feeders',
        secondaryValue: '12 / 12 Active',
        lastServiced: '4 days ago',
        monitoringAgency: 'State Power Transmission Corp',
        emergencyContact: '1912',
      },
    },
    {
      id: 'dyn-inf-pump',
      name: 'Primary Water Booster & Reservoir Station',
      category: 'water_pumping',
      categoryLabel: 'Municipal Water Station',
      location: { lat: centerLat - 0.008, lng: centerLng - 0.007 },
      ward: 'Ward Water Supply Wing',
      city: 'Municipal Zone',
      healthScore: 92,
      status: 'nominal',
      telemetry: {
        primaryMetric: 'Flow Rate',
        metricValue: '145 MLD Main',
        secondaryMetric: 'Pump Pressure',
        secondaryValue: '4.2 bar',
        lastServiced: '1 day ago',
        monitoringAgency: 'Water Supply & Sewerage Board',
        emergencyContact: '1916',
      },
    },
    {
      id: 'dyn-inf-drain',
      name: 'Stormwater Culvert & Sluice Gate #3',
      category: 'stormwater_sluice',
      categoryLabel: 'SWD Sluice Gate',
      location: { lat: centerLat - 0.006, lng: centerLng + 0.012 },
      ward: 'Stormwater Drainage Div',
      city: 'Municipal Zone',
      healthScore: 58,
      status: 'warning',
      telemetry: {
        primaryMetric: 'Silt Blockage',
        metricValue: '62% Silt Bed',
        secondaryMetric: 'Flow Clearance',
        secondaryValue: '1.2 m/s',
        lastServiced: '16 days ago',
        monitoringAgency: 'Municipal Engineering Cell',
        emergencyContact: '1533',
      },
      alert: 'Pre-monsoon desilting recommended by IoT canal depth telemetry.',
    },
    {
      id: 'dyn-inf-transit',
      name: 'Multi-Modal Metro & Bus Terminal',
      category: 'transit_hub',
      categoryLabel: 'Transit Mega-Hub',
      location: { lat: centerLat + 0.009, lng: centerLng - 0.011 },
      ward: 'Transit Mobility Zone',
      city: 'Municipal Zone',
      healthScore: 94,
      status: 'nominal',
      telemetry: {
        primaryMetric: 'Ridership Throughput',
        metricValue: '28,000 / hr',
        secondaryMetric: 'Feeder Buses',
        secondaryValue: '98% on-time',
        lastServiced: 'Yesterday',
        monitoringAgency: 'Metropolitan Urban Transport Auth',
        emergencyContact: '1033',
      },
    },
  ];
}

/**
 * Returns active municipal ward boundary polygons around current map center
 */
export function getActiveWardBoundaries(centerLat: number = 28.6139, centerLng: number = 77.2090): WardBoundary[] {
  const nearbyCurated = CURATED_WARD_BOUNDARIES.filter((ward) => {
    return getDistanceKm(centerLat, centerLng, ward.centroid.lat, ward.centroid.lng) <= 50;
  });

  if (nearbyCurated.length > 0) {
    return nearbyCurated;
  }

  // Generate localized ward polygons around center
  const dLat = 0.014;
  const dLng = 0.016;

  return [
    {
      id: 'dyn-wrd-north',
      wardNumber: 'Ward 101',
      wardName: 'Civil Lines & Sector 1 Jurisdiction',
      corporation: 'Metropolitan Municipal Corporation',
      city: 'City Administration',
      state: 'State',
      color: '#0050c8',
      centroid: { lat: centerLat + dLat * 0.6, lng: centerLng },
      population: 86000,
      areaSqKm: 8.4,
      executiveOfficer: 'Er. Rajesh K. (Ward Executive Engineer)',
      officerContact: '011-23300000',
      activeGrievances: 19,
      resolutionRate: 91.5,
      keyLandmarks: ['Ward Council Office', 'Primary Health Centre', 'Civic Park'],
      boundary: [
        [centerLat + dLat * 1.2, centerLng - dLng * 1.1],
        [centerLat + dLat * 1.3, centerLng + dLng * 1.1],
        [centerLat + dLat * 0.1, centerLng + dLng * 1.2],
        [centerLat + dLat * 0.05, centerLng - dLng * 1.15],
        [centerLat + dLat * 1.2, centerLng - dLng * 1.1],
      ],
    },
    {
      id: 'dyn-wrd-south',
      wardNumber: 'Ward 102',
      wardName: 'Commercial Hub & Market Zone',
      corporation: 'Metropolitan Municipal Corporation',
      city: 'City Administration',
      state: 'State',
      color: '#10B981',
      centroid: { lat: centerLat - dLat * 0.6, lng: centerLng },
      population: 112000,
      areaSqKm: 9.8,
      executiveOfficer: 'Smt. Ananya Sen (Assistant Commissioner)',
      officerContact: '011-23311111',
      activeGrievances: 31,
      resolutionRate: 87.2,
      keyLandmarks: ['Market Complex', 'Central Bus Depot', 'Sports Arena'],
      boundary: [
        [centerLat + dLat * 0.05, centerLng - dLng * 1.15],
        [centerLat + dLat * 0.1, centerLng + dLng * 1.2],
        [centerLat - dLat * 1.2, centerLng + dLng * 1.15],
        [centerLat - dLat * 1.25, centerLng - dLng * 1.1],
        [centerLat + dLat * 0.05, centerLng - dLng * 1.15],
      ],
    },
  ];
}
