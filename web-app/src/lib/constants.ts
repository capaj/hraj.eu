export const SPORTS = [
  { id: 'soccer', name: 'Soccer', icon: '🥅' },
  { id: 'futsal', name: 'Futsal', icon: '⚽' },
  { id: 'basketball', name: 'Basketball', icon: '🏀' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
  { id: 'beach-volleyball', name: 'Beach Volleyball', icon: '🏖️' },
  { id: 'football-tennis', name: 'Football Tennis', icon: '🎾' },
  { id: 'handball', name: 'Handball', icon: '🤾' },
  { id: 'rugby-union', name: 'Rugby Union', icon: '🏉' },
  { id: 'rugby-league', name: 'Rugby League', icon: '🏉' },
  { id: 'ice-hockey', name: 'Ice Hockey', icon: '🏒' },
  { id: 'field-hockey', name: 'Field Hockey', icon: '🏑' },
  { id: 'water-polo', name: 'Water Polo', icon: '🤽' },
  { id: 'cricket', name: 'Cricket', icon: '🏏' },
  { id: 'netball', name: 'Netball', icon: '🥅' },
  { id: 'korfball', name: 'Korfball', icon: '🗑️' },
  { id: 'floorball', name: 'Floorball', icon: '🏒' }
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

export const CITIES = [
  'Prague',
  'Vienna',
  'Budapest',
  'Warsaw',
  'Berlin',
  'Amsterdam',
  'Brussels',
  'Paris',
  'Madrid',
  'Rome',
  'Stockholm',
  'Copenhagen'
] as const
