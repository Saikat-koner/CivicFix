export interface AreaCivicAlert {
  id: string;
  title: string;
  category: 'public_work' | 'dispute' | 'utility_disruption' | 'traffic_diversion';
  severity: 'high' | 'moderate' | 'advisory';
  area: string;
  city: string;
  location: { lat: number; lng: number };
  description: string;
  executingAgency: string;
  disputeDetails?: string;
  startDate: string;
  estimatedCompletion: string;
  daysRemaining: number;
  alternateRouteOrAdvice: string;
  contactHelpline: string;
  status: 'In Progress' | 'Under Adjudication' | 'Active Diversion' | 'Emergency Notice';
  affectedServices: string[];
}

export const AREA_CIVIC_ALERTS: AreaCivicAlert[] = [
  {
    id: 'ALERT-PW-2026-01',
    title: 'Metro Phase-2B Girder Erection & Road Widening',
    category: 'public_work',
    severity: 'high',
    area: 'Indiranagar 100ft Road Corridor',
    city: 'Bengaluru',
    location: { lat: 12.9784, lng: 77.6408 },
    description:
      'Heavy crane operations underway for nocturnal girder launching and deep pier foundations. Two of three lanes cordoned off between 10 PM and 6 AM daily.',
    executingAgency: 'Bangalore Metro Rail Corporation (BMRCL) & BBMP Infrastructure',
    startDate: '2026-08-15',
    estimatedCompletion: '2026-10-30',
    daysRemaining: 49,
    alternateRouteOrAdvice:
      'Commuters advised to take Old Airport Road via HAL or 12th Main Road to bypass 100ft Road junction.',
    contactHelpline: '080-22969300',
    status: 'In Progress',
    affectedServices: ['Vehicular Traffic', 'Bus Feeder Route 201', 'Street Parking'],
  },
  {
    id: 'ALERT-DISP-2026-02',
    title: 'Right-of-Way Commercial Encroachment Dispute & Court Stay',
    category: 'dispute',
    severity: 'high',
    area: 'Connaught Place Outer Circle & Barakhamba Road',
    city: 'New Delhi',
    location: { lat: 28.6315, lng: 77.2167 },
    description:
      'High Court interim status quo ordered on municipal pedestrian plaza extension following trader union petition. Demolition paused; perimeter barricaded pending joint demarcation survey.',
    executingAgency: 'New Delhi Municipal Council (NDMC) Enforcement & Land Revenue',
    disputeDetails: 'Civil Writ Petition No. 4482/2026 before High Court regarding pavement hawker rehabilitation and designated green corridor width.',
    startDate: '2026-09-02',
    estimatedCompletion: '2026-09-28',
    daysRemaining: 17,
    alternateRouteOrAdvice:
      'Pedestrian foot traffic routed through inner radial corridors. Vehicle parking restricted at Blocks E & F.',
    contactHelpline: '1533 (NDMC Civic Command)',
    status: 'Under Adjudication',
    affectedServices: ['Pedestrian Walkway', 'Parking Lot F', 'Commercial Loading Bays'],
  },
  {
    id: 'ALERT-PW-2026-03',
    title: 'Stormwater RCC Drain Box Culvert Construction',
    category: 'public_work',
    severity: 'moderate',
    area: 'Koramangala 80 Feet Road (Sony World Jn)',
    city: 'Bengaluru',
    location: { lat: 12.9352, lng: 77.6245 },
    description:
      'Excavation for high-capacity pre-cast stormwater culvert to eliminate perennial monsoon waterlogging at Sony World intersection.',
    executingAgency: 'BBMP Major Stormwater Drain Division (SWD)',
    startDate: '2026-08-20',
    estimatedCompletion: '2026-10-10',
    daysRemaining: 29,
    alternateRouteOrAdvice:
      'Light vehicles diverted via 5th Block inner roads; heavy commercial vehicles barred from 7 AM to 10 PM.',
    contactHelpline: '080-22221188',
    status: 'In Progress',
    affectedServices: ['Stormwater Flow', 'Road Crossings', 'Local Bicycle Lane'],
  },
  {
    id: 'ALERT-DISP-2026-04',
    title: 'Public Land Demarcation & Lake Buffer Zone Boundary Dispute',
    category: 'dispute',
    severity: 'moderate',
    area: 'Bellandur Lake Foreshore & Yemalur',
    city: 'Bengaluru',
    location: { lat: 12.9372, lng: 77.6744 },
    description:
      'Survey department carrying out digital drone demarcation following allegations of buffer zone encroachment by private developers. Police presence maintained during physical boundary pegging.',
    executingAgency: 'Karnataka Revenue Dept & Lake Development Authority (KTCDA)',
    disputeDetails: 'Disputed 75-meter eco-sensitive buffer zone mapping; tribunal hearing scheduled for 24 September 2026.',
    startDate: '2026-09-04',
    estimatedCompletion: '2026-09-25',
    daysRemaining: 14,
    alternateRouteOrAdvice:
      'Avoid lake peripheral service roads during drone survey hours (9 AM - 1 PM).',
    contactHelpline: '080-22660000',
    status: 'Under Adjudication',
    affectedServices: ['Lakeside Trail', 'Service Road Access'],
  },
  {
    id: 'ALERT-UT-2026-05',
    title: 'Main Drinking Water Pipeline Replacement (Cauvery Phase V)',
    category: 'utility_disruption',
    severity: 'high',
    area: 'Whitefield - ITPL Main Road',
    city: 'Bengaluru',
    location: { lat: 12.9856, lng: 77.7289 },
    description:
      'Emergency interconnection of 1200mm MS pipeline. Low water pressure and scheduled 18-hour disruption on alternate days.',
    executingAgency: 'Bangalore Water Supply and Sewerage Board (BWSSB)',
    startDate: '2026-09-08',
    estimatedCompletion: '2026-09-18',
    daysRemaining: 7,
    alternateRouteOrAdvice:
      'Residents requested to store 24 hours of potable water. Free municipal water tankers deployed on dial-in request at 1916.',
    contactHelpline: '1916 (BWSSB 24x7)',
    status: 'Emergency Notice',
    affectedServices: ['Piped Municipal Water Supply', 'Road Shoulder Parking'],
  },
  {
    id: 'ALERT-TR-2026-06',
    title: 'Flyover Deck Resurfacing & Expansion Joint Replacement',
    category: 'traffic_diversion',
    severity: 'moderate',
    area: 'South Extension Flyover (Ring Road)',
    city: 'New Delhi',
    location: { lat: 28.5684, lng: 77.2215 },
    description:
      'Mastic asphalt resurfacing and hydraulic expansion joint replacement on the southbound carriageway toward AIIMS.',
    executingAgency: 'Public Works Department (PWD Delhi) & Delhi Traffic Police',
    startDate: '2026-09-05',
    estimatedCompletion: '2026-09-22',
    daysRemaining: 11,
    alternateRouteOrAdvice:
      'Single lane operational on flyover. Surface road under flyover recommended for local traffic towards Kotla Mubarakpur.',
    contactHelpline: '1095 / 011-25844444 (Delhi Traffic Helpline)',
    status: 'Active Diversion',
    affectedServices: ['Ring Road Expressway Lane', 'Bus Rapid Transit Access'],
  },
];

/**
 * Filter alerts by city or coordinates proximity
 */
export function getNearbyAreaAlerts(userLat?: number, userLng?: number, city?: string): AreaCivicAlert[] {
  if (city) {
    const cityMatches = AREA_CIVIC_ALERTS.filter(
      (a) => a.city.toLowerCase().includes(city.toLowerCase()) || city.toLowerCase().includes(a.city.toLowerCase())
    );
    if (cityMatches.length > 0) return cityMatches;
  }

  // If coordinates provided, sort by distance
  if (userLat && userLng) {
    return [...AREA_CIVIC_ALERTS].sort((a, b) => {
      const distA = Math.hypot(a.location.lat - userLat, a.location.lng - userLng);
      const distB = Math.hypot(b.location.lat - userLat, b.location.lng - userLng);
      return distA - distB;
    });
  }

  return AREA_CIVIC_ALERTS;
}
