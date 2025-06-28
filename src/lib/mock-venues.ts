import { Venue } from '../types';

export const mockVenues: Venue[] = [
  {
    id: '1',
    name: 'Letná Park Football Field',
    address: 'Letná Park, Holešovice',
    city: 'Prague',
    country: 'Czech Republic',
    lat: 50.0983,
    lng: 14.4172,
    type: 'outdoor',
    sports: ['football', 'rugby-union'],
    facilities: ['parking', 'changing_rooms', 'equipment_rental'],
    images: [
      'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1171084/pexels-photo-1171084.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    orientationPlan: 'https://images.pexels.com/photos/8828/map-navigation-hands-fingers.jpg?auto=compress&cs=tinysrgb&w=600',
    description: 'Large outdoor football field in the heart of Prague with great views of the city.',
    accessInstructions: 'Enter through the main gate near the metronome. Walk 200m towards the river, field is on your left.',
    openingHours: {
      monday: { open: '06:00', close: '22:00' },
      tuesday: { open: '06:00', close: '22:00' },
      wednesday: { open: '06:00', close: '22:00' },
      thursday: { open: '06:00', close: '22:00' },
      friday: { open: '06:00', close: '22:00' },
      saturday: { open: '08:00', close: '20:00' },
      sunday: { open: '08:00', close: '20:00' }
    },
    priceRange: {
      min: 10,
      max: 25,
      currency: 'EUR'
    },
    contactInfo: {
      phone: '+420 123 456 789',
      email: 'info@letnapark.cz'
    },
    rating: 4.5,
    totalRatings: 127,
    createdBy: '1',
    isVerified: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: '2',
    name: 'Karlín Sports Hall',
    address: 'Thámova 18, Karlín',
    city: 'Prague',
    country: 'Czech Republic',
    lat: 50.0950,
    lng: 14.4500,
    type: 'indoor',
    sports: ['basketball', 'volleyball', 'handball', 'floorball'],
    facilities: ['parking', 'changing_rooms', 'showers', 'equipment_rental', 'cafe'],
    images: [
      'https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1263426/pexels-photo-1263426.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    orientationPlan: 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpg?auto=compress&cs=tinysrgb&w=600',
    description: 'Modern indoor sports hall with professional courts and excellent facilities.',
    accessInstructions: 'Enter through the main entrance on Thámova street. Reception is on the ground floor.',
    openingHours: {
      monday: { open: '06:00', close: '23:00' },
      tuesday: { open: '06:00', close: '23:00' },
      wednesday: { open: '06:00', close: '23:00' },
      thursday: { open: '06:00', close: '23:00' },
      friday: { open: '06:00', close: '23:00' },
      saturday: { open: '08:00', close: '22:00' },
      sunday: { open: '08:00', close: '22:00' }
    },
    priceRange: {
      min: 15,
      max: 40,
      currency: 'EUR'
    },
    contactInfo: {
      phone: '+420 234 567 890',
      email: 'booking@karlinsports.cz',
      website: 'https://karlinsports.cz'
    },
    rating: 4.8,
    totalRatings: 89,
    createdBy: '2',
    isVerified: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '3',
    name: 'Wenceslas Square Basketball Court',
    address: 'Wenceslas Square',
    city: 'Prague',
    country: 'Czech Republic',
    lat: 50.0813,
    lng: 14.4269,
    type: 'outdoor',
    sports: ['basketball'],
    facilities: ['parking'],
    images: [
      'https://images.pexels.com/photos/1080882/pexels-photo-1080882.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    description: 'Public outdoor basketball court in the city center.',
    accessInstructions: 'Located at the lower end of Wenceslas Square, near the National Museum.',
    openingHours: {
      monday: { open: '06:00', close: '22:00' },
      tuesday: { open: '06:00', close: '22:00' },
      wednesday: { open: '06:00', close: '22:00' },
      thursday: { open: '06:00', close: '22:00' },
      friday: { open: '06:00', close: '22:00' },
      saturday: { open: '06:00', close: '22:00' },
      sunday: { open: '06:00', close: '22:00' }
    },
    priceRange: {
      min: 0,
      max: 0,
      currency: 'EUR'
    },
    rating: 3.8,
    totalRatings: 45,
    createdBy: '3',
    isVerified: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: '4',
    name: 'Winter Stadium Štvanice',
    address: 'Ostrov Štvanice 1125, Holešovice',
    city: 'Prague',
    country: 'Czech Republic',
    lat: 50.0900,
    lng: 14.4300,
    type: 'indoor',
    sports: ['ice-hockey'],
    facilities: ['parking', 'changing_rooms', 'showers', 'equipment_rental', 'cafe'],
    images: [
      'https://images.pexels.com/photos/1263348/pexels-photo-1263348.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    orientationPlan: 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpg?auto=compress&cs=tinysrgb&w=600',
    description: 'Professional ice hockey rink with excellent ice quality and full facilities.',
    accessInstructions: 'Take tram to Štvanice stop. The stadium is a 2-minute walk from the tram stop.',
    openingHours: {
      monday: { open: '06:00', close: '23:00' },
      tuesday: { open: '06:00', close: '23:00' },
      wednesday: { open: '06:00', close: '23:00' },
      thursday: { open: '06:00', close: '23:00' },
      friday: { open: '06:00', close: '23:00' },
      saturday: { open: '08:00', close: '22:00' },
      sunday: { open: '08:00', close: '22:00' }
    },
    priceRange: {
      min: 20,
      max: 50,
      currency: 'EUR'
    },
    contactInfo: {
      phone: '+420 345 678 901',
      email: 'ice@stvanice.cz'
    },
    rating: 4.6,
    totalRatings: 73,
    createdBy: '1',
    isVerified: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  }
];