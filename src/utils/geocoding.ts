// OpenStreetMap Nominatim Geocoding Services for Real-World Address Resolution

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  district?: string;
  city?: string;
}

export interface WardGeocodeResult {
  formattedAddress: string;
  ward: string;
  district: string;
  city: string;
  state: string;
  postcode: string;
}

/**
 * Standard Pan-India Municipal Wards, Corporations and City Districts
 * Covers Metros, Tier-1, Tier-2, and State Capitals across India
 */
export const PAN_INDIA_MUNICIPAL_DISTRICTS: string[] = [
  // Delhi NCR
  'New Delhi Municipal Council (NDMC Central)',
  'Connaught Place / Barakhamba, New Delhi (110001)',
  'Rohini Sector 7 / Ward 24, North West Delhi (110085)',
  'Dwarka Sector 10 / Ward 136, South West Delhi (110075)',
  'Lajpat Nagar / Ward 142, South Delhi (110024)',
  'Karol Bagh / Ward 83, Central Delhi (110005)',
  'Chandni Chowk / Ward 77, North Delhi (110006)',
  'Noida Sector 18, Gautam Buddha Nagar, UP (201301)',
  'Gurugram Ward 15 / Cyber City, Haryana (122002)',

  // Maharashtra / Mumbai & Pune
  'Bandra West / Ward H-West, BMC, Mumbai (400050)',
  'Andheri West / Ward K-West, BMC, Mumbai (400058)',
  'Nariman Point & Colaba / Ward A, BMC, Mumbai (400001)',
  'Dadar & Shivaji Park / Ward G-North, BMC, Mumbai (400028)',
  'Borivali West / Ward R-Central, BMC, Mumbai (400092)',
  'Thane West / Majiwada Ward, TMC, Maharashtra (400601)',
  'Shivajinagar / Ward 12, Pune Municipal Corp (411005)',
  'Kothrud / Ward 28, Pune Municipal Corp (411038)',
  'Viman Nagar / Ward 5, Pune Municipal Corp (411014)',
  'Hinjawadi / PCMC Ward 34, Pimpri-Chinchwad (411057)',

  // Karnataka / Bengaluru & Mysuru
  'Bengaluru Central / Ward 111 (Shantala Nagar) (560001)',
  'Indiranagar / Ward 82 (Hoysala Nagar), Bengaluru (560038)',
  'Koramangala / Ward 151, Bengaluru (560095)',
  'Whitefield / Ward 84 (Kadugodi), Bengaluru (560066)',
  'Jayanagar / Ward 153, Bengaluru (560011)',
  'Malleshwaram / Ward 65, Bengaluru (560003)',
  'HSR Layout / Ward 174, Bengaluru (560102)',
  'Yelahanka New Town / Ward 4, Bengaluru (560064)',
  'Hebbal / Ward 21, Bengaluru (560024)',
  'Jayalakshmipuram / Ward 18, Mysuru MCC (570012)',

  // West Bengal / Kolkata
  'Salt Lake Sector 5 / Bidhannagar Municipal Corp (700091)',
  'Park Street & Bhowanipore / Borough 8, KMC Kolkata (700016)',
  'New Town Action Area 1 / NKDA, Kolkata (700156)',
  'Alipore / Borough 9, KMC Kolkata (700027)',
  'Shyambazar / Borough 1, KMC Kolkata (700004)',
  'Howrah Central / Ward 29, Howrah Municipal Corp (711101)',

  // Tamil Nadu / Chennai & Coimbatore
  'T. Nagar / Zone 10 (Kodambakkam), GCC Chennai (600017)',
  'Adyar / Zone 13, Greater Chennai Corp (600020)',
  'Anna Nagar / Zone 8, Greater Chennai Corp (600040)',
  'Mylapore / Zone 9, Greater Chennai Corp (600004)',
  'Velachery / Zone 13, Greater Chennai Corp (600042)',
  'RS Puram / West Zone, Coimbatore Municipal Corp (641002)',

  // Telangana & AP / Hyderabad & Vizag
  'Banjara Hills & Jubilee Hills / Circle 18, GHMC Hyderabad (500034)',
  'Hitec City & Madhapur / Serilingampally Zone, GHMC (500081)',
  'Gachibowli / Circle 20, GHMC Hyderabad (500032)',
  'Secunderabad / Begumpet Circle 30, GHMC (500003)',
  'Dwaraka Nagar / Zone 3, GVMC Visakhapatnam (530016)',

  // Gujarat / Ahmedabad & Surat
  'Navrangpura & CG Road / West Zone, AMC Ahmedabad (380009)',
  'Bodakdev & SG Highway / North West Zone, AMC (380054)',
  'Athwa Lines / Athwa Zone, SMC Surat (395007)',
  'Alkapuri / Central Zone, VMC Vadodara (390007)',

  // Rajasthan / Jaipur
  'C-Scheme & Civil Lines / Zone 1, JMC Heritage, Jaipur (302001)',
  'Malviya Nagar & Vaishali Nagar / JMC Greater, Jaipur (302017)',

  // Uttar Pradesh / Lucknow & Kanpur
  'Hazratganj / Zone 1, Lucknow Municipal Corp (226001)',
  'Gomti Nagar / Zone 4, Lucknow Municipal Corp (226010)',
  'Civil Lines / Zone 3, Kanpur Municipal Corp (208001)',

  // Madhya Pradesh / Bhopal & Indore
  'Vijay Nagar / Zone 7, Indore Municipal Corp (452010)',
  'Arera Colony & MP Nagar / Zone 10, BMC Bhopal (462016)',

  // Kerala / Kochi & Thiruvananthapuram
  'Marine Drive & MG Road / Central Zone, Kochi Corp (682011)',
  'Kowdiar & Palayam / Central Ward, Trivandrum Corp (695003)',

  // Bihar & Jharkhand
  'Boring Road / Ward 22, Patna Municipal Corp (800001)',
  'Harmu & Morabadi / Ward 15, Ranchi Municipal Corp (834001)',

  // Punjab, Haryana & Chandigarh
  'Sector 17 / Municipal Corporation Chandigarh (160017)',
  'Model Town / Zone D, Ludhiana Municipal Corp (141002)',

  // Odisha & North East
  'Saheed Nagar & Chandrasekharpur / Zone 2, BMC Bhubaneswar (751007)',
  'Paltan Bazaar & GS Road / Ward 14, GMC Guwahati (781008)',
];

/**
 * High-accuracy reverse geocoding tailored for ward, resident district,
 * and municipal jurisdiction across India and worldwide.
 */
export async function reverseGeocodeWardAndDistrict(lat: number, lng: number): Promise<WardGeocodeResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'CivicFix-Community-App/1.0',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const road = addr.road || addr.pedestrian || addr.street || '';
        const houseNumber = addr.house_number ? `${addr.house_number} ` : '';
        const suburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.subdivision || '';
        const cityDistrict = addr.city_district || addr.district || '';
        const city = addr.city || addr.town || addr.municipality || addr.village || '';
        const state = addr.state || '';
        const postcode = addr.postcode || '';

        // Formulate a recognizable Ward / Resident string
        const primaryLocality = suburb || road || cityDistrict || city || 'Local Area';
        const administrativeUnit = cityDistrict && cityDistrict !== suburb ? cityDistrict : city;
        
        let wardStr = '';
        if (suburb && city) {
          wardStr = `${suburb}, ${city}${postcode ? ` (${postcode})` : ''}`;
        } else if (suburb && state) {
          wardStr = `${suburb}, ${state}${postcode ? ` (${postcode})` : ''}`;
        } else if (city && state) {
          wardStr = `${city}, ${state}${postcode ? ` (${postcode})` : ''}`;
        } else {
          wardStr = `${primaryLocality}, ${administrativeUnit || state}`;
        }

        const formattedAddress = [
          `${houseNumber}${road}`.trim(),
          suburb,
          city,
          state,
          postcode,
        ].filter(Boolean).join(', ');

        return {
          formattedAddress: formattedAddress || data.display_name,
          ward: wardStr,
          district: cityDistrict || city || 'Municipal District',
          city: city || 'City',
          state: state || 'State',
          postcode: postcode || '',
        };
      }
    }
  } catch {
    // Network or timeout fallback
  }

  return {
    formattedAddress: `GPS Spot (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    ward: `Local Ward (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
    district: 'Municipal Ward',
    city: 'Local Area',
    state: '',
    postcode: '',
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'CivicFix-Community-App/1.0',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.display_name) {
        // Build a concise human-friendly address
        const addr = data.address || {};
        const road = addr.road || addr.pedestrian || addr.street || '';
        const houseNumber = addr.house_number ? `${addr.house_number} ` : '';
        const suburb = addr.suburb || addr.neighbourhood || addr.city_district || '';
        const city = addr.city || addr.town || addr.village || '';

        if (road) {
          const parts = [
            `${houseNumber}${road}`.trim(),
            suburb,
            city,
          ].filter(Boolean);
          return parts.join(', ');
        }
        return data.display_name.split(',').slice(0, 3).join(',').trim();
      }
    }
  } catch {
    // Network or timeout fallback
  }

  // Graceful coordinate fallback
  return `GPS Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

export async function searchAddress(query: string): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 3) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'CivicFix-Community-App/1.0',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const list = await response.json();
      if (Array.isArray(list)) {
        return list.map((item) => {
          const addr = item.address || {};
          const road = addr.road || addr.pedestrian || '';
          const houseNumber = addr.house_number ? `${addr.house_number} ` : '';
          const suburb = addr.suburb || addr.neighbourhood || addr.city_district || '';
          const city = addr.city || addr.town || addr.village || '';
          
          let display = item.display_name;
          if (road) {
            display = [
              `${houseNumber}${road}`.trim(),
              suburb,
              city,
            ].filter(Boolean).join(', ');
          }

          return {
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            formattedAddress: display || item.display_name,
            district: suburb || city || 'Metro District',
            city: city || 'City',
          };
        });
      }
    }
  } catch {
    // Fallback
  }

  return [];
}
