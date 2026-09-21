export interface CivicNewsItem {
  id: string;
  headline: string;
  summary: string;
  category: 'infrastructure' | 'sanitation' | 'water_supply' | 'environment' | 'transport' | 'community_redressal';
  city: string;
  area: string;
  date: string;
  source: string;
  relatedGrievanceCategory?: string;
  relatedIssueCount: number;
  upvotes: number;
  officialActionTaken: string;
  tags: string[];
}

export const CIVIC_NEWS_ITEMS: CivicNewsItem[] = [
  {
    id: 'NEWS-BLR-2026-01',
    headline: 'Monsoon Readiness: 18 Low-Lying Underpasses Upgraded with High-Capacity Dewatering Pumps',
    summary:
      'Following multiple citizen complaints on civic water-logging, BBMP and Traffic Police completed installation of automated dewatering submersible pumps across major underpasses including Domlur, Okalipuram, and Marathahalli.',
    category: 'infrastructure',
    city: 'Bengaluru',
    area: 'Domlur & Inner Ring Road',
    date: '10 September 2026',
    source: 'Urban Infrastructure Gazette',
    relatedGrievanceCategory: 'Waterlogging & Stormwater Drainage',
    relatedIssueCount: 19,
    upvotes: 248,
    officialActionTaken: 'Sensors linked to 24x7 control room; automatic dewatering starts when water depth hits 5cm.',
    tags: ['Underpass Drainage', 'Monsoon Ready', 'Domlur', 'BBMP'],
  },
  {
    id: 'NEWS-DEL-2026-02',
    headline: 'Citizen Petition Sparks Immediate Cleanliness Drive Across South Delhi Market Alleys',
    summary:
      'A community petition filed through the civic portal regarding uncleared waste near Greater Kailash M-Block commercial zone prompted MCD to deploy mobile compactors and levy spot fines on improper waste dumping.',
    category: 'sanitation',
    city: 'New Delhi',
    area: 'Greater Kailash & South Extension',
    date: '09 September 2026',
    source: 'Delhi Civic Times',
    relatedGrievanceCategory: 'Garbage Dump & Waste Clearance',
    relatedIssueCount: 14,
    upvotes: 312,
    officialActionTaken: 'Two fixed compactors commissioned; night sanitation patrol deployed from 10 PM to 4 AM.',
    tags: ['Waste Management', 'Citizen Redressal', 'MCD', 'GK Market'],
  },
  {
    id: 'NEWS-BLR-2026-03',
    headline: 'Cauvery Water Pipeline Interconnection Completed Ahead of Schedule in East Zone',
    summary:
      'BWSSB engineering division has completed the critical tie-in of the 1000mm trunk line in Whitefield, restoring normal supply pressures across 18 residential apartment societies that had reported acute shortages.',
    category: 'water_supply',
    city: 'Bengaluru',
    area: 'Whitefield - Hope Farm Junction',
    date: '08 September 2026',
    source: 'Bengaluru Water Bulletin',
    relatedGrievanceCategory: 'Water Supply Pipeline Leaks',
    relatedIssueCount: 22,
    upvotes: 189,
    officialActionTaken: 'Pressure monitors activated; water delivery logs published openly on municipal dashboard.',
    tags: ['Cauvery Water', 'BWSSB', 'Whitefield', 'Pipe Redressal'],
  },
  {
    id: 'NEWS-BLR-2026-04',
    headline: 'Smart LED Streetlight Transition Yields 35% Energy Saving and Eliminates Dark Stretches',
    summary:
      'Over 4,200 faulty sodium vapor lamps across HSR Layout and Bellandur replaced with smart IoT-enabled LED fittings capable of auto-dimming and failure self-reporting directly into the citizen grievance queue.',
    category: 'transport',
    city: 'Bengaluru',
    area: 'HSR Layout Sectors 1-7',
    date: '06 September 2026',
    source: 'Municipal Power & Energy Board',
    relatedGrievanceCategory: 'Streetlights & Electrical Hazards',
    relatedIssueCount: 31,
    upvotes: 420,
    officialActionTaken: 'Centralized dashboard monitors burning hours and triggers automatic repair crew tickets.',
    tags: ['Smart Streetlights', 'HSR Layout', 'Safety', 'BESCOM'],
  },
  {
    id: 'NEWS-DEL-2026-05',
    headline: 'Air Quality Sensor Network Expanded with 50 Hyper-Local Monitoring Pods in Residential Parks',
    summary:
      'To identify localized pollution hotspots, low-cost optical particle counters have been installed at public parks in Rohini, Dwarka, and Model Town. Live AQI readings now integrate into the civic hazard dashboard.',
    category: 'environment',
    city: 'New Delhi',
    area: 'Dwarka & Rohini Sectors',
    date: '05 September 2026',
    source: 'Delhi Pollution Control Committee',
    relatedGrievanceCategory: 'Open Garbage Burning & Air Quality',
    relatedIssueCount: 16,
    upvotes: 275,
    officialActionTaken: 'Instant alerts sent to ward health inspectors when PM2.5 spikes indicate localized waste burning.',
    tags: ['Air Quality', 'Green Delhi', 'Dwarka', 'Pollution Control'],
  },
  {
    id: 'NEWS-BLR-2026-06',
    headline: 'Pothole War Room Dispatches Rapid Jet-Patcher Units to Fill 320 Road Craters in 48 Hours',
    summary:
      'Prompted by high citizen upvoting on the civic map, the municipal road maintenance wing activated automatic jet-patching machines that fill potholes with cold-mix emulsion in under 15 minutes per spot without disrupting traffic.',
    category: 'community_redressal',
    city: 'Bengaluru',
    area: 'Outer Ring Road (Silk Board to Marathahalli)',
    date: '04 September 2026',
    source: 'Urban Mobility & Roads Authority',
    relatedGrievanceCategory: 'Potholes & Damaged Roads',
    relatedIssueCount: 47,
    upvotes: 560,
    officialActionTaken: 'Quality audit photographs uploaded to citizen tickets for community sign-off.',
    tags: ['Pothole Repair', 'Outer Ring Road', 'Quick Redressal'],
  },
];
