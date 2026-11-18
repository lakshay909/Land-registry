/**
 * Complete Registry of Indian States and Union Territories for Bhūmi Ledger.
 * Under Entry 18 of List II (State List), land tenure is administered at state level.
 * Currently, Uttar Pradesh (UP) is the active pilot jurisdiction.
 */

export const INDIAN_STATES = [
  // Active Pilot State
  {
    code: 'UP',
    nameEn: 'Uttar Pradesh',
    nameHi: 'उत्तर प्रदेश',
    status: 'ACTIVE_PILOT',
    portalName: 'UP Bhulekh & IGRSUP',
    governingCode: 'Uttar Pradesh Revenue Code, 2006',
    districtsCount: 75,
    pilotDistricts: ['Lucknow', 'Gautam Buddha Nagar'],
    flagBg: 'bg-emerald-500',
    description: 'Active digital land registry, 16-digit UPIC verification, Rule 34 SLA tracking, and circle rate valuation.'
  },
  // Upcoming States (Northern Region)
  {
    code: 'UK',
    nameEn: 'Uttarakhand',
    nameHi: 'उत्तराखंड',
    status: 'COMING_SOON',
    portalName: 'Devbhoomi (UK Bhulekh)',
    governingCode: 'UP Zamindari Abolition Act (as adapted in UK)',
    districtsCount: 13,
    description: 'Digital land records integration under phase 2 expansion.'
  },
  {
    code: 'HR',
    nameEn: 'Haryana',
    nameHi: 'हरियाणा',
    status: 'COMING_SOON',
    portalName: 'Jamabandi Haryana',
    governingCode: 'Punjab Land Revenue Act, 1887 (as applicable in Haryana)',
    districtsCount: 22,
    description: 'Jamabandi and Web-HALRIS synchronization in preparation.'
  },
  {
    code: 'DL',
    nameEn: 'Delhi (NCT)',
    nameHi: 'दिल्ली',
    status: 'COMING_SOON',
    portalName: 'Delhi Land Records (DORIS)',
    governingCode: 'Delhi Land Reforms Act, 1954',
    districtsCount: 11,
    description: 'NCT revenue sub-division records integration scheduled.'
  },
  {
    code: 'PB',
    nameEn: 'Punjab',
    nameHi: 'पंजाब',
    status: 'COMING_SOON',
    portalName: 'PLRS (Punjab Land Records Society)',
    governingCode: 'Punjab Land Revenue Act, 1887',
    districtsCount: 23,
    description: 'Fard / Jamabandi workflow adapters under development.'
  },
  {
    code: 'RJ',
    nameEn: 'Rajasthan',
    nameHi: 'राजस्थान',
    status: 'COMING_SOON',
    portalName: 'Apna Khata (E-Dharti)',
    governingCode: 'Rajasthan Land Revenue Act, 1956',
    districtsCount: 50,
    description: 'E-Dharti mutation and DLC rate calculation models in research.'
  },
  {
    code: 'HP',
    nameEn: 'Himachal Pradesh',
    nameHi: 'हिमाचल प्रदेश',
    status: 'COMING_SOON',
    portalName: 'Himbhoomi',
    governingCode: 'HP Land Revenue Act, 1954 & Section 118 restrictions',
    districtsCount: 12,
    description: 'Section 118 non-agriculturist purchase vetting adapter planned.'
  },
  {
    code: 'JK',
    nameEn: 'Jammu & Kashmir',
    nameHi: 'जम्मू और कश्मीर',
    status: 'COMING_SOON',
    portalName: 'Aapki Zameen Aapki Nigrani',
    governingCode: 'J&K Land Revenue Act, 1996',
    districtsCount: 20,
    description: 'Land records modernization programme onboarding in planning.'
  },
  // Western Region
  {
    code: 'MH',
    nameEn: 'Maharashtra',
    nameHi: 'महाराष्ट्र',
    status: 'COMING_SOON',
    portalName: 'MahaBhulekh (7/12 & 8A)',
    governingCode: 'Maharashtra Land Revenue Code, 1966',
    districtsCount: 36,
    description: 'Satbara (7/12) extract and IGR Maharashtra readiness review.'
  },
  {
    code: 'GJ',
    nameEn: 'Gujarat',
    nameHi: 'गुजरात',
    status: 'COMING_SOON',
    portalName: 'AnyRoR Anywhere',
    governingCode: 'Gujarat Land Revenue Code, 1879',
    districtsCount: 33,
    description: 'AnyRoR 7/12 & 8A and Garvi IGR registration adapter.'
  },
  {
    code: 'MP',
    nameEn: 'Madhya Pradesh',
    nameHi: 'मध्य प्रदेश',
    status: 'COMING_SOON',
    portalName: 'MP Bhulekh',
    governingCode: 'Madhya Pradesh Land Revenue Code, 1959',
    districtsCount: 55,
    description: 'Khasra / Khatoni extraction and Sampada registration adapter.'
  },
  {
    code: 'GA',
    nameEn: 'Goa',
    nameHi: 'गोवा',
    status: 'COMING_SOON',
    portalName: 'Goa Land Records (Form I & XIV)',
    governingCode: 'Goa Land Revenue Code, 1968',
    districtsCount: 2,
    description: 'Form I & XIV title search automation.'
  },
  // Southern Region
  {
    code: 'KA',
    nameEn: 'Karnataka',
    nameHi: 'कर्नाटक',
    status: 'COMING_SOON',
    portalName: 'Bhoomi & Kaveri 2.0',
    governingCode: 'Karnataka Land Revenue Act, 1964',
    districtsCount: 31,
    description: 'Bhoomi RTC and Kaveri 2.0 deed synchronization in design.'
  },
  {
    code: 'TN',
    nameEn: 'Tamil Nadu',
    nameHi: 'तमिलनाडु',
    status: 'COMING_SOON',
    portalName: 'Patta Chitta (e-Services)',
    governingCode: 'Tamil Nadu Land Revenue Rules & STAR 2.0',
    districtsCount: 38,
    description: 'Patta/Chitta extraction and STAR 2.0 guideline value calculator.'
  },
  {
    code: 'TG',
    nameEn: 'Telangana',
    nameHi: 'तेलंगाना',
    status: 'COMING_SOON',
    portalName: 'Dharani Portal',
    governingCode: 'Telangana Rights in Land and Pattadar Passbooks Act, 2020',
    districtsCount: 33,
    description: 'Dharani integrated land record management review.'
  },
  {
    code: 'AP',
    nameEn: 'Andhra Pradesh',
    nameHi: 'आंध्र प्रदेश',
    status: 'COMING_SOON',
    portalName: 'Meebhoomi & CARD',
    governingCode: 'AP Rights in Land and Pattadar Passbooks Act, 1971',
    districtsCount: 26,
    description: 'Meebhoomi 1B Adangal and CARD registration framework.'
  },
  {
    code: 'KL',
    nameEn: 'Kerala',
    nameHi: 'केरल',
    status: 'COMING_SOON',
    portalName: 'E-Rekhakal (BHOOMI Kerala)',
    governingCode: 'Kerala Land Reforms Act, 1963',
    districtsCount: 14,
    description: 'Thandaper and digital cadastral map integration.'
  },
  // Eastern & Central Region
  {
    code: 'BR',
    nameEn: 'Bihar',
    nameHi: 'बिहार',
    status: 'COMING_SOON',
    portalName: 'Bihar Bhumi (Biharbhumi.bihar.gov.in)',
    governingCode: 'Bihar Tenancy Act, 1885',
    districtsCount: 38,
    description: 'Dakhil Kharij mutation and Jamabandi register digitization.'
  },
  {
    code: 'JH',
    nameEn: 'Jharkhand',
    nameHi: 'झारखंड',
    status: 'COMING_SOON',
    portalName: 'Jharbhoomi',
    governingCode: 'Chota Nagpur Tenancy (CNT) & Santhal Parganas Tenancy (SPT) Acts',
    districtsCount: 24,
    description: 'CNT/SPT tribal land transfer restriction guards.'
  },
  {
    code: 'WB',
    nameEn: 'West Bengal',
    nameHi: 'पश्चिम बंगाल',
    status: 'COMING_SOON',
    portalName: 'Banglarbhumi',
    governingCode: 'West Bengal Land Reforms Act, 1955',
    districtsCount: 23,
    description: 'Khatian / Dag plot information workflow.'
  },
  {
    code: 'OD',
    nameEn: 'Odisha',
    nameHi: 'ओडिशा',
    status: 'COMING_SOON',
    portalName: 'Bhulekh Odisha',
    governingCode: 'Odisha Land Reforms Act, 1960',
    districtsCount: 30,
    description: 'RoR (Record of Rights) and e-Registration system sync.'
  },
  {
    code: 'CG',
    nameEn: 'Chhattisgarh',
    nameHi: 'छत्तीसगढ़',
    status: 'COMING_SOON',
    portalName: 'Bhuiyan',
    governingCode: 'Chhattisgarh Land Revenue Code, 1959',
    districtsCount: 33,
    description: 'Bhuiyan Khasra/Khatoni and B1 PII extraction.'
  },
  {
    code: 'AS',
    nameEn: 'Assam',
    nameHi: 'असम',
    status: 'COMING_SOON',
    portalName: 'Dharitree (ILRMS Assam)',
    governingCode: 'Assam Land and Revenue Regulation, 1886',
    districtsCount: 35,
    description: 'Jamabandi and Mission Basundhara integration.'
  }
];

export const DEFAULT_STATE_CODE = 'UP';

export function getAllStates() {
  return INDIAN_STATES;
}

export function getActiveStates() {
  return INDIAN_STATES.filter(s => s.status === 'ACTIVE_PILOT');
}

export function getComingSoonStates() {
  return INDIAN_STATES.filter(s => s.status === 'COMING_SOON');
}

export function getStateByCode(code) {
  if (!code) return INDIAN_STATES.find(s => s.code === DEFAULT_STATE_CODE);
  const found = INDIAN_STATES.find(s => s.code.toUpperCase() === code.toUpperCase());
  return found || INDIAN_STATES.find(s => s.code === DEFAULT_STATE_CODE);
}
