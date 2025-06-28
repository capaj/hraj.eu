export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  karmaPoints: number;
  skillLevels: Record<string, 'beginner' | 'intermediate' | 'advanced'>;
  preferredCurrency: string;
  location?: string;
  revTag?: string;
  bankAccount?: string;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  sport: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  date: Date;
  startTime: string;
  duration: number;
  minParticipants: number;
  idealParticipants?: number;
  maxParticipants: number;
  cancellationDeadlineHours?: number;
  price?: number;
  paymentDetails?: string;
  gameRules?: string;
  cutoffTime: Date;
  isPublic: boolean;
  organizerId: string;
  participants: string[];
  waitlist: string[];
  status: 'draft' | 'open' | 'confirmed' | 'cancelled' | 'completed';
  allowedSkillLevels?: string[]; // New field for skill level restrictions
  requireSkillLevel?: boolean; // New field to enforce skill level restrictions
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'event_invitation' | 'event_confirmed' | 'event_cancelled' | 'moved_from_waitlist' | 'event_reminder' | 'karma_received' | 'event_joined' | 'payment_received';
  title: string;
  message: string;
  eventId?: string;
  fromUserId?: string;
  isRead: boolean;
  createdAt: Date;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type SportType = 'football' | 'basketball' | 'volleyball' | 'handball' | 'rugby-union' | 'rugby-league' | 'ice-hockey' | 'field-hockey' | 'water-polo' | 'cricket' | 'netball' | 'korfball' | 'floorball';