# hraj.eu - Sports Community Platform Specifications

## Overview

**hraj.eu** is a comprehensive European sports community platform that connects amateur sports enthusiasts across Europe. The platform enables users to organize, discover, and participate in sports events while building a community through karma-based reputation system.

## Core Features

### 1. User Management & Authentication

#### User Profiles

- **Personal Information**: Name, email, city, country, avatar
- **Karma System**: Points-based reputation system (±5 to ±10 points per action)
- **Skill Levels**: Sport-specific skill ratings (Beginner, Intermediate, Advanced)
- **Payment Information**: Revolut tags, domestic bank accounts, preferred currency
- **Account Security**: Password management, account deletion with multi-step confirmation

#### Authentication & Security

- Email/password authentication (no magic links or social login)
- Password change functionality with current password verification
- Account deletion with typed confirmation ("DELETE")
- Secure payment information storage

### 2. Event Management

#### Event Creation

- **Basic Information**: Title, sport selection, description/game rules
- **Venue Integration**: Select from existing venues or add new ones
- **Date & Time**: Date picker, start time, duration (15-minute increments)
- **Participant Management**:
  - Minimum players (required for confirmation)
  - Ideal players (optimal game size)
  - Maximum players (with waitlist overflow)
- **Cancellation Policy**: Configurable deadline (hours + minutes before event)
- **Payment Integration**: Optional pricing with payment details
- **Skill Level Restrictions**: Optional enforcement of skill level requirements
- **Visibility**: Public (discoverable) or Private (invite-only)

#### Event Discovery

- **Advanced Filtering**: By sport, skill level, location, date
- **Multiple Views**: List view and interactive map view
- **Sorting Options**: By date/time, distance from user, available spots
- **Real-time Updates**: Live participant counts and status changes

#### Event Participation

- **Join/Waitlist System**: Automatic waitlist when events are full
- **Status Tracking**: Open, confirmed, cancelled, completed states
- **Notifications**: Event updates, confirmations, reminders
- **Calendar Integration**: Export to calendar (.ics files)

### 3. Venue Management

#### Venue Database

- **Comprehensive Information**: Name, address, coordinates, type (indoor/outdoor/mixed)
- **Sports Support**: Multi-sport venue capabilities
- **Facilities**: Parking, changing rooms, showers, equipment rental, café, WiFi, accessibility
- **Visual Documentation**: Multiple photos, orientation/access plans
- **Contact Information**: Phone, email, website
- **Pricing**: Hourly rate ranges with currency support
- **Operating Hours**: Day-specific opening/closing times

#### Venue Features

- **User-Generated Content**: Community can add new venues
- **Verification System**: Admin review process for new venues
- **Rating System**: User reviews and ratings (1-5 stars)
- **Access Instructions**: Detailed directions and access information

### 4. Sports & Skill System

#### Supported Sports

- **Team Sports**: Football (Soccer), Basketball, Volleyball, Handball, Rugby (Union/League)
- **Ice Sports**: Ice Hockey, Field Hockey
- **Water Sports**: Water Polo
- **Other Sports**: Cricket, Netball, Korfball, Floorball

#### Skill Level System

- **Beginner**: New to sport or casual players
- **Intermediate**: Regular players with some experience
- **Advanced**: Experienced competitive players
- **Sport-Specific**: Individual skill levels per sport
- **Auto-Save**: Instant updates when skill levels change

### 5. Payment & Currency System

#### Multi-Currency Support

- **European Focus**: Support for all EU currencies (EUR, CZK, PLN, SEK, etc.)
- **User Preferences**: Individual currency selection
- **Payment Methods**:
  - Revolut integration (@username tags)
  - Czech bank accounts (account/bank code format)
  - Cash on-site option

#### Event Pricing

- **Optional Pricing**: Events can be free or paid
- **Cost Splitting**: Total cost divided by participant count
- **Payment Details**: Flexible payment instruction field

### 6. Community & Social Features

#### Karma System

- **Earning Points**:
  - Organizing successful events (+10 points)
  - Attending events (+5 points)
  - Positive player feedback (+3 points)
  - Helping new players (+2 points)
- **Losing Points**:
  - No-shows without notice (-5 points)
  - Last-minute event cancellations (-3 points)
  - Negative behavior reports (-10 points)

#### Post-Event Feedback

- **Player Rating**: 1-5 star rating system
- **Behavior Reporting**: No-show and bad behavior reporting
- **Comments**: Optional feedback comments
- **Community Building**: Encourages good sportsmanship

#### Leaderboards

- **Multiple Categories**: Overall karma, events organized, events joined, monthly performance
- **Sport-Specific Rankings**: Filter by individual sports
- **Visual Recognition**: Crown, medal, and trophy icons for top performers

### 7. Notification System

#### Real-Time Updates

- **Event Notifications**: Joins, confirmations, cancellations, reminders, new events in your area
- **Karma Notifications**: Points received, feedback from other players
- **System Notifications**: Moved from waitlist, payment confirmations
- **Smart Timing**: Contextual notification timing

#### Notification Management

- **Mark as Read**: Individual and bulk actions
- **Delete Options**: Remove unwanted notifications
- **Rich Content**: Event details, user information, timestamps

### 8. Weather Integration

#### Event Weather Forecasting

- **Location-Based**: Weather for specific venue locations
- **Sport-Specific Advice**: Tailored recommendations per sport
- **Detailed Metrics**: Temperature, humidity, wind speed, visibility, precipitation
- **Sunset Times**: Calculated for event planning
- **Recommendations**: Excellent/Good/Fair/Poor conditions rating

### 9. Map & Location Features

#### Interactive Maps

- **Event Visualization**: Sports events displayed on map with sport icons
- **User Location**: GPS-based location detection
- **Venue Mapping**: Precise venue coordinates and directions
- **Distance Calculations**: Haversine formula for accurate distances

#### Location Services

- **Offline Geocoding**: City detection without external API calls
- **European Focus**: Optimized for European cities and locations
- **Multi-Language**: Support for local address formats

## Technical Specifications

### Frontend Architecture

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4 with custom design system
- **Icons**: Lucide React icon library
- **State Management**: React hooks and local state
- **Date Handling**: date-fns library for date manipulation
- **Build Tool**: Vite for development and building

### Design System

- **Color Palette**: Primary (green), Secondary (blue), Accent (orange) with full shade ranges
- **Typography**: Inter font family with 3 weight maximum
- **Spacing**: 8px grid system for consistent layouts
- **Components**: Reusable Card, Button, Badge, Toggle components
- **Animations**: Fade-in, slide-up, gentle bounce effects

### Data Models

- **User**: Profile, karma, skills, payment info, preferences
- **Event**: Details, participants, status, pricing, restrictions
- **Venue**: Location, facilities, sports, ratings, verification
- **Notification**: Type, content, read status, timestamps

### File Organization

- **Modular Architecture**: Separation of concerns with dedicated files
- **Component Structure**: UI components, page components, utility functions
- **Type Safety**: Comprehensive TypeScript interfaces
- **Asset Management**: Optimized image handling and external URLs

## User Experience Features

### Responsive Design

- **Mobile-First**: Optimized for all screen sizes
- **Breakpoints**: sm, md, lg, xl responsive breakpoints
- **Touch-Friendly**: Appropriate touch targets and interactions
- **Performance**: Optimized loading and smooth animations

### Accessibility

- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: WCAG compliant color combinations
- **Focus Management**: Clear focus indicators

### Progressive Enhancement

- **Offline Capabilities**: Offline geocoding and cached data
- **Error Handling**: Graceful degradation and error recovery
- **Loading States**: Comprehensive loading indicators
- **Optimistic Updates**: Immediate UI feedback

## Security & Privacy

### Data Protection

- **Encrypted Storage**: Secure payment information handling
- **Privacy Controls**: User control over profile visibility
- **Data Minimization**: Only collect necessary information
- **GDPR Compliance**: European privacy regulation compliance

### Account Security

- **Password Requirements**: Minimum 8 characters
- **Secure Deletion**: Multi-step account deletion process
- **Session Management**: Secure authentication handling
- **Input Validation**: Comprehensive form validation

## Deployment & Infrastructure

### Development Environment

- **Local Development**: Vite dev server with hot reload
- **Package Management**: PNPM for efficient dependency management
- **Code Quality**: ESLint configuration with TypeScript rules
- **Version Control**: Git-based workflow

### Production Considerations

- **Build Optimization**: Vite production builds
- **Asset Optimization**: Image compression and CDN integration
- **Performance Monitoring**: Core Web Vitals optimization
- **SEO**: Meta tags and Open Graph integration

## Future Enhancements

### Planned Features

- **Real-time Chat**: Event-specific messaging
- **Team Formation**: Automatic team balancing
- **Tournament System**: Multi-event competitions
- **Mobile App**: Native iOS/Android applications
- **API Integration**: Third-party calendar and payment services

### Scalability Considerations

- **Database Optimization**: Efficient data queries and indexing
- **Caching Strategy**: Redis for session and data caching
- **CDN Integration**: Global content delivery
- **Microservices**: Service-oriented architecture for growth
