// Service area data for MowList
// Status:
//   'live'        - pros are actively serving customers
//   'launching'   - active local promotion, recruiting first pros
//   'coming_soon' - on the public roadmap, no active launch yet

export type ServiceStatus = 'live' | 'launching' | 'coming_soon'

export interface StateInfo {
  code: string
  name: string
  status: ServiceStatus
  /** Number of cities active in this state */
  cityCount: number
}

export interface CityInfo {
  city: string
  stateCode: string
  status: ServiceStatus
  /** First 3 digits of zip codes that match this city */
  zipPrefixes: string[]
  /** Human-readable note (e.g. "1 pro available" or "Be the first") */
  note?: string
}

// All 50 US states + DC
export const ALL_STATES: StateInfo[] = [
  { code: 'AL', name: 'Alabama', status: 'coming_soon', cityCount: 0 },
  { code: 'AK', name: 'Alaska', status: 'coming_soon', cityCount: 0 },
  { code: 'AZ', name: 'Arizona', status: 'coming_soon', cityCount: 0 },
  { code: 'AR', name: 'Arkansas', status: 'coming_soon', cityCount: 0 },
  { code: 'CA', name: 'California', status: 'coming_soon', cityCount: 0 },
  { code: 'CO', name: 'Colorado', status: 'coming_soon', cityCount: 0 },
  { code: 'CT', name: 'Connecticut', status: 'coming_soon', cityCount: 0 },
  { code: 'DE', name: 'Delaware', status: 'coming_soon', cityCount: 0 },
  { code: 'DC', name: 'District of Columbia', status: 'coming_soon', cityCount: 0 },
  { code: 'FL', name: 'Florida', status: 'coming_soon', cityCount: 0 },
  { code: 'GA', name: 'Georgia', status: 'coming_soon', cityCount: 0 },
  { code: 'HI', name: 'Hawaii', status: 'coming_soon', cityCount: 0 },
  { code: 'ID', name: 'Idaho', status: 'coming_soon', cityCount: 0 },
  { code: 'IL', name: 'Illinois', status: 'coming_soon', cityCount: 0 },
  { code: 'IN', name: 'Indiana', status: 'coming_soon', cityCount: 0 },
  { code: 'IA', name: 'Iowa', status: 'coming_soon', cityCount: 0 },
  { code: 'KS', name: 'Kansas', status: 'coming_soon', cityCount: 0 },
  { code: 'KY', name: 'Kentucky', status: 'coming_soon', cityCount: 0 },
  { code: 'LA', name: 'Louisiana', status: 'coming_soon', cityCount: 0 },
  { code: 'ME', name: 'Maine', status: 'coming_soon', cityCount: 0 },
  { code: 'MD', name: 'Maryland', status: 'coming_soon', cityCount: 0 },
  { code: 'MA', name: 'Massachusetts', status: 'coming_soon', cityCount: 0 },
  { code: 'MI', name: 'Michigan', status: 'coming_soon', cityCount: 0 },
  { code: 'MN', name: 'Minnesota', status: 'coming_soon', cityCount: 0 },
  { code: 'MS', name: 'Mississippi', status: 'coming_soon', cityCount: 0 },
  { code: 'MO', name: 'Missouri', status: 'coming_soon', cityCount: 0 },
  { code: 'MT', name: 'Montana', status: 'coming_soon', cityCount: 0 },
  { code: 'NE', name: 'Nebraska', status: 'coming_soon', cityCount: 0 },
  { code: 'NV', name: 'Nevada', status: 'coming_soon', cityCount: 0 },
  { code: 'NH', name: 'New Hampshire', status: 'coming_soon', cityCount: 0 },
  { code: 'NJ', name: 'New Jersey', status: 'coming_soon', cityCount: 0 },
  { code: 'NM', name: 'New Mexico', status: 'coming_soon', cityCount: 0 },
  { code: 'NY', name: 'New York', status: 'coming_soon', cityCount: 0 },
  { code: 'NC', name: 'North Carolina', status: 'coming_soon', cityCount: 0 },
  { code: 'ND', name: 'North Dakota', status: 'coming_soon', cityCount: 0 },
  { code: 'OH', name: 'Ohio', status: 'coming_soon', cityCount: 0 },
  { code: 'OK', name: 'Oklahoma', status: 'coming_soon', cityCount: 0 },
  { code: 'OR', name: 'Oregon', status: 'coming_soon', cityCount: 0 },
  { code: 'PA', name: 'Pennsylvania', status: 'launching', cityCount: 1 },
  { code: 'RI', name: 'Rhode Island', status: 'coming_soon', cityCount: 0 },
  { code: 'SC', name: 'South Carolina', status: 'coming_soon', cityCount: 0 },
  { code: 'SD', name: 'South Dakota', status: 'coming_soon', cityCount: 0 },
  { code: 'TN', name: 'Tennessee', status: 'coming_soon', cityCount: 0 },
  { code: 'TX', name: 'Texas', status: 'live', cityCount: 6 },
  { code: 'UT', name: 'Utah', status: 'coming_soon', cityCount: 0 },
  { code: 'VT', name: 'Vermont', status: 'coming_soon', cityCount: 0 },
  { code: 'VA', name: 'Virginia', status: 'coming_soon', cityCount: 0 },
  { code: 'WA', name: 'Washington', status: 'coming_soon', cityCount: 0 },
  { code: 'WV', name: 'West Virginia', status: 'coming_soon', cityCount: 0 },
  { code: 'WI', name: 'Wisconsin', status: 'coming_soon', cityCount: 0 },
  { code: 'WY', name: 'Wyoming', status: 'coming_soon', cityCount: 0 },
]

// Live + launching cities (the ones with real status)
export const ACTIVE_CITIES: CityInfo[] = [
  // === LIVE: Austin metro ===
  { city: 'Austin', stateCode: 'TX', status: 'live', zipPrefixes: ['787', '733'], note: 'Pros available now' },
  { city: 'Round Rock', stateCode: 'TX', status: 'live', zipPrefixes: ['78664', '78665', '78681'], note: 'Pros available now' },
  { city: 'Cedar Park', stateCode: 'TX', status: 'live', zipPrefixes: ['78613'], note: 'Pros available now' },
  { city: 'Pflugerville', stateCode: 'TX', status: 'live', zipPrefixes: ['78660'], note: 'Pros available now' },
  { city: 'Lakeway', stateCode: 'TX', status: 'live', zipPrefixes: ['78734'], note: 'Pros available now' },
  { city: 'Georgetown', stateCode: 'TX', status: 'live', zipPrefixes: ['78626', '78628'], note: 'Pros available now' },

  // === LAUNCHING: Wilkes-Barre / NE Pennsylvania (Rachel's local promotion) ===
  { city: 'Wilkes-Barre', stateCode: 'PA', status: 'launching', zipPrefixes: ['187', '18702', '18705', '18706', '18711'], note: 'Be the first pro here' },
  { city: 'Scranton', stateCode: 'PA', status: 'launching', zipPrefixes: ['185', '18503', '18504', '18505', '18508', '18509', '18510'], note: 'Be the first pro here' },
  { city: 'Kingston', stateCode: 'PA', status: 'launching', zipPrefixes: ['18704'], note: 'Be the first pro here' },
  { city: 'Mountain Top', stateCode: 'PA', status: 'launching', zipPrefixes: ['18707'], note: 'Be the first pro here' },
  { city: 'Pittston', stateCode: 'PA', status: 'launching', zipPrefixes: ['18640', '18641', '18642', '18643', '18644'], note: 'Be the first pro here' },
  { city: 'Hazleton', stateCode: 'PA', status: 'launching', zipPrefixes: ['18201', '18202'], note: 'Be the first pro here' },
]

// Major US metros organized by region — used for the "coming soon" sections
// and the all-states grid
export const UPCOMING_METROS: { region: string; cities: { city: string; stateCode: string }[] }[] = [
  {
    region: 'Texas (expanding)',
    cities: [
      { city: 'Houston', stateCode: 'TX' },
      { city: 'Dallas', stateCode: 'TX' },
      { city: 'San Antonio', stateCode: 'TX' },
      { city: 'Fort Worth', stateCode: 'TX' },
      { city: 'Plano', stateCode: 'TX' },
      { city: 'Arlington', stateCode: 'TX' },
      { city: 'El Paso', stateCode: 'TX' },
      { city: 'Corpus Christi', stateCode: 'TX' },
    ],
  },
  {
    region: 'Northeast',
    cities: [
      { city: 'New York', stateCode: 'NY' },
      { city: 'Brooklyn', stateCode: 'NY' },
      { city: 'Buffalo', stateCode: 'NY' },
      { city: 'Philadelphia', stateCode: 'PA' },
      { city: 'Pittsburgh', stateCode: 'PA' },
      { city: 'Boston', stateCode: 'MA' },
      { city: 'Newark', stateCode: 'NJ' },
      { city: 'Baltimore', stateCode: 'MD' },
      { city: 'Washington', stateCode: 'DC' },
    ],
  },
  {
    region: 'Southeast',
    cities: [
      { city: 'Miami', stateCode: 'FL' },
      { city: 'Orlando', stateCode: 'FL' },
      { city: 'Tampa', stateCode: 'FL' },
      { city: 'Jacksonville', stateCode: 'FL' },
      { city: 'Atlanta', stateCode: 'GA' },
      { city: 'Charlotte', stateCode: 'NC' },
      { city: 'Raleigh', stateCode: 'NC' },
      { city: 'Nashville', stateCode: 'TN' },
    ],
  },
  {
    region: 'Midwest',
    cities: [
      { city: 'Chicago', stateCode: 'IL' },
      { city: 'Detroit', stateCode: 'MI' },
      { city: 'Indianapolis', stateCode: 'IN' },
      { city: 'Columbus', stateCode: 'OH' },
      { city: 'Cleveland', stateCode: 'OH' },
      { city: 'Cincinnati', stateCode: 'OH' },
      { city: 'Milwaukee', stateCode: 'WI' },
      { city: 'Minneapolis', stateCode: 'MN' },
      { city: 'Kansas City', stateCode: 'MO' },
      { city: 'St. Louis', stateCode: 'MO' },
    ],
  },
  {
    region: 'South Central',
    cities: [
      { city: 'New Orleans', stateCode: 'LA' },
      { city: 'Baton Rouge', stateCode: 'LA' },
      { city: 'Oklahoma City', stateCode: 'OK' },
      { city: 'Tulsa', stateCode: 'OK' },
      { city: 'Little Rock', stateCode: 'AR' },
    ],
  },
  {
    region: 'Mountain West',
    cities: [
      { city: 'Denver', stateCode: 'CO' },
      { city: 'Colorado Springs', stateCode: 'CO' },
      { city: 'Phoenix', stateCode: 'AZ' },
      { city: 'Tucson', stateCode: 'AZ' },
      { city: 'Salt Lake City', stateCode: 'UT' },
      { city: 'Albuquerque', stateCode: 'NM' },
      { city: 'Las Vegas', stateCode: 'NV' },
    ],
  },
  {
    region: 'West Coast',
    cities: [
      { city: 'Los Angeles', stateCode: 'CA' },
      { city: 'San Diego', stateCode: 'CA' },
      { city: 'San Francisco', stateCode: 'CA' },
      { city: 'San Jose', stateCode: 'CA' },
      { city: 'Sacramento', stateCode: 'CA' },
      { city: 'Portland', stateCode: 'OR' },
      { city: 'Seattle', stateCode: 'WA' },
      { city: 'Spokane', stateCode: 'WA' },
    ],
  },
]

/**
 * Look up a zip code and return its status.
 * Returns the matched city, state, and a status flag.
 * Falls back to "coming_soon" with the inferred state for unknown zips.
 */
export function lookupZip(zip: string): {
  status: ServiceStatus
  city?: string
  stateCode: string
  stateName: string
  matched: boolean
} {
  const cleaned = zip.replace(/\D/g, '').slice(0, 5)
  if (cleaned.length < 3) {
    return { status: 'coming_soon', stateCode: '', stateName: '', matched: false }
  }

  // Try matching each known city by zip prefix
  for (const c of ACTIVE_CITIES) {
    for (const prefix of c.zipPrefixes) {
      if (cleaned.startsWith(prefix.slice(0, Math.min(prefix.length, cleaned.length)))) {
        const state = ALL_STATES.find(s => s.code === c.stateCode)
        return {
          status: c.status,
          city: c.city,
          stateCode: c.stateCode,
          stateName: state?.name ?? c.stateCode,
          matched: true,
        }
      }
    }
  }

  // Fall back to state-level mapping by first digit
  const stateByFirstDigit = inferStateFromZip(cleaned)
  return {
    status: 'coming_soon',
    stateCode: stateByFirstDigit?.code ?? '',
    stateName: stateByFirstDigit?.name ?? '',
    matched: false,
  }
}

/**
 * Very approximate state lookup by zip code prefix.
 * First 3 digits of US zip codes are regional.
 * This is intentionally rough — for unknown zips we just show the state name
 * and "coming soon" status.
 */
function inferStateFromZip(zip: string): { code: string; name: string } | null {
  const prefix = zip.slice(0, 3)
  const num = parseInt(prefix, 10)

  // Map of zip-prefix ranges to states
  // This is a rough approximation; many ranges are shared between states.
  const ranges: { min: number; max: number; code: string }[] = [
    { min: 100, max: 279, code: 'MA' },   // MA, NH, VT, ME, RI, CT, parts of NY/NJ
    { min: 280, max: 299, code: 'RI' },
    { min: 300, max: 399, code: 'NH' },
    { min: 400, max: 499, code: 'ME' },
    { min: 1000, max: 1969, code: 'MA' },
    { min: 1970, max: 1999, code: 'DE' },  // DE
    { min: 1000, max: 1499, code: 'NY' },  // NY metro
    { min: 1500, max: 1969, code: 'PA' },  // PA
    { min: 2000, max: 2059, code: 'DC' },  // DC
    { min: 2060, max: 2199, code: 'MD' },  // MD
    { min: 2200, max: 2469, code: 'VA' },  // VA
    { min: 2470, max: 2699, code: 'WV' },  // WV
    { min: 2700, max: 2899, code: 'NC' },  // NC
    { min: 2900, max: 2999, code: 'SC' },  // SC
    { min: 3000, max: 3199, code: 'GA' },  // GA
    { min: 3200, max: 3499, code: 'FL' },  // FL
    { min: 3500, max: 3699, code: 'AL' },  // AL
    { min: 3700, max: 3859, code: 'TN' },  // TN
    { min: 3860, max: 3999, code: 'MS' },  // MS
    { min: 4000, max: 4199, code: 'KY' },  // KY
    { min: 4200, max: 4799, code: 'OH' },  // OH
    { min: 4800, max: 4999, code: 'MI' },  // MI
    { min: 5000, max: 5299, code: 'IA' },  // IA
    { min: 5300, max: 5499, code: 'WI' },  // WI
    { min: 5500, max: 5679, code: 'MN' },  // MN
    { min: 5700, max: 5799, code: 'SD' },  // SD
    { min: 5800, max: 5899, code: 'ND' },  // ND
    { min: 5900, max: 5999, code: 'MT' },  // MT
    { min: 6000, max: 6299, code: 'IL' },  // IL
    { min: 6300, max: 6599, code: 'MO' },  // MO
    { min: 6600, max: 6799, code: 'KS' },  // KS
    { min: 6800, max: 6999, code: 'NE' },  // NE
    { min: 7000, max: 7149, code: 'LA' },  // LA
    { min: 7150, max: 7199, code: 'AR' },  // AR
    { min: 7200, max: 7499, code: 'OK' },  // OK
    { min: 7500, max: 7999, code: 'TX' },  // TX
    { min: 8000, max: 8199, code: 'CO' },  // CO
    { min: 8200, max: 8319, code: 'WY' },  // WY
    { min: 8320, max: 8399, code: 'ID' },  // ID
    { min: 8400, max: 8499, code: 'UT' },  // UT
    { min: 8500, max: 8659, code: 'AZ' },  // AZ
    { min: 8700, max: 8849, code: 'NM' },  // NM
    { min: 8850, max: 8999, code: 'NV' },  // NV
    { min: 9000, max: 9619, code: 'CA' },  // CA
    { min: 9620, max: 9669, code: 'CA' },  // CA (military)
    { min: 9670, max: 9679, code: 'HI' },  // HI
    { min: 9700, max: 9799, code: 'OR' },  // OR
    { min: 9800, max: 9949, code: 'WA' },  // WA
    { min: 9950, max: 9999, code: 'AK' },  // AK
  ]

  for (const r of ranges) {
    if (num >= r.min && num <= r.max) {
      const state = ALL_STATES.find(s => s.code === r.code)
      return state ? { code: state.code, name: state.name } : null
    }
  }

  return null
}
