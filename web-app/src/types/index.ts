export interface User {
  id: string
  email: string
  name: string
  image?: string
  bio?: string
  karmaPoints: number
  skillLevels: Record<string, 'beginner' | 'intermediate' | 'advanced'>
  notificationPreferences: Record<string, boolean> // sportId -> enabled
  preferredCurrency: string
  location?: string
  revTag?: string
  bankAccount?: string
  createdAt: Date
}

export interface Venue {
  id: string
  name: string
  address: string
  city: string
  country: string
  lat: number
  lng: number
  type: 'outdoor' | 'indoor' | 'mixed'
  sports: string[] // Array of sport IDs that can be played at this venue
  facilities: string[] // e.g., ['parking', 'changing_rooms', 'showers', 'equipment_rental']
  photos: string[] // Array of image URLs
  orientationPlan?: string // URL to orientation/access plan image
  description?: string
  accessInstructions?: string // How to find/access the field/gym
  openingHours?: {
    [key: string]: { open: string; close: string } | null // e.g., { monday: { open: '06:00', close: '22:00' }, sunday: null }
  }
  price: number
  currency: string
  priceRange?: {
    min: number
    max: number
    currency: string
  }
  contactInfo?: {
    phone?: string
    email?: string
    website?: string
  }
  rating?: number // Average rating from 1-5
  totalRatings?: number
  createdBy: string // User ID who added the venue
  isVerified: boolean // Whether the venue has been verified by admins
  createdAt: Date
  updatedAt: Date
}

export interface Event {
  id: string
  title: string
  description: string
  sport: string
  venueId: string // Changed from location object to venue ID
  date: Date
  startTime: string
  duration: number
  minParticipants: number
  idealParticipants?: number
  maxParticipants: number
  cancellationDeadlineHours?: number
  price?: number
  currency?: string
  paymentDetails?: string
  gameRules?: string
  cutoffTime: Date
  isPublic: boolean
  organizerId: string
  participants: string[]
  waitlist: string[]
  participantPlusOnes: Record<string, string[]>
  status: 'draft' | 'open' | 'confirmed' | 'cancelled' | 'completed'
  allowedSkillLevels?: string[]
  requireSkillLevel?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  id: string
  userId: string
  type:
    | 'event_invitation'
    | 'event_confirmed'
    | 'event_cancelled'
    | 'moved_from_waitlist'
    | 'event_reminder'
    | 'karma_received'
    | 'event_joined'
    | 'payment_received'
  title: string
  message: string
  eventId?: string
  fromUserId?: string
  isRead: boolean
  createdAt: Date
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'
export type SportType =
  | 'football'
  | 'basketball'
  | 'volleyball'
  | 'handball'
  | 'rugby-union'
  | 'rugby-league'
  | 'ice-hockey'
  | 'field-hockey'
  | 'water-polo'
  | 'cricket'
  | 'netball'
  | 'korfball'
  | 'floorball'
