export const SPORTS = [
  { id: 'soccer', name: 'Soccer' },
  { id: 'futsal', name: 'Futsal' },
  { id: 'basketball', name: 'Basketball' },
  { id: 'volleyball', name: 'Volleyball' },
  { id: 'beach-volleyball', name: 'Beach Volleyball' },
  { id: 'football-tennis', name: 'Football Tennis' },
  { id: 'handball', name: 'Handball' },
  { id: 'rugby-union', name: 'Rugby Union' },
  { id: 'rugby-league', name: 'Rugby League' },
  { id: 'ice-hockey', name: 'Ice Hockey' },
  { id: 'field-hockey', name: 'Field Hockey' },
  { id: 'water-polo', name: 'Water Polo' },
  { id: 'cricket', name: 'Cricket' },
  { id: 'netball', name: 'Netball' },
  { id: 'korfball', name: 'Korfball' },
  { id: 'floorball', name: 'Floorball' }
] as const

export const FACILITIES = [
  { id: 'parking', name: 'Parking', icon: '🚗' },
  { id: 'restrooms', name: 'Restrooms', icon: '🚻' },
  { id: 'food', name: 'Café/Restaurant', icon: '☕' },
  { id: 'lounge', name: 'Lounge', icon: '🛋️' },
  { id: 'wifi', name: 'WiFi', icon: '📶' },
  { id: 'locker_room', name: 'Locker Room', icon: '🔒' },
  { id: 'shower', name: 'Showers', icon: '🚿' },
  { id: 'dressing_room', name: 'Changing Rooms', icon: '👕' }
] as const

export const SKILL_LEVELS = [
  { id: 'beginner', name: 'Beginner', color: 'bg-green-100 text-green-800' },
  {
    id: 'intermediate',
    name: 'Intermediate',
    color: 'bg-yellow-100 text-yellow-800'
  },
  { id: 'advanced', name: 'Advanced', color: 'bg-red-100 text-red-800' }
] as const

export const EU_CURRENCIES = [
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    countries: [
      'Austria',
      'Belgium',
      'Cyprus',
      'Estonia',
      'Finland',
      'France',
      'Germany',
      'Greece',
      'Ireland',
      'Italy',
      'Latvia',
      'Lithuania',
      'Luxembourg',
      'Malta',
      'Netherlands',
      'Portugal',
      'Slovakia',
      'Slovenia',
      'Spain'
    ]
  },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', countries: ['Bulgaria'] },
  {
    code: 'CZK',
    name: 'Czech Koruna',
    symbol: 'Kč',
    countries: ['Czech Republic']
  },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', countries: ['Denmark'] },
  {
    code: 'HUF',
    name: 'Hungarian Forint',
    symbol: 'Ft',
    countries: ['Hungary']
  },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł', countries: ['Poland'] },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', countries: ['Romania'] },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', countries: ['Sweden'] },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', countries: ['Croatia'] }
] as const
