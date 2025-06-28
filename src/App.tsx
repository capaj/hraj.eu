import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { Home } from './pages/Home';
import { Discover } from './pages/Discover';
import { CreateEvent } from './pages/CreateEvent';
import { Profile } from './pages/Profile';
import { UserProfile } from './pages/UserProfile';
import { Leaderboard } from './pages/Leaderboard';
import { EventDetailsPage } from './pages/EventDetails';
import { mockEvents } from './lib/mock-data';

type Page = 'home' | 'discover' | 'create' | 'profile' | 'user-profile' | 'leaderboard' | 'event-details';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const handleViewEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentPage('event-details');
  };

  const handleBackFromEvent = () => {
    setCurrentPage('discover');
    setSelectedEventId(null);
  };

  const handleJoinEvent = (eventId: string) => {
    console.log('Join event:', eventId);
    // In a real app, this would make an API call
    // For now, just go back to discover page
    setCurrentPage('discover');
    setSelectedEventId(null);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
    if (page !== 'event-details') {
      setSelectedEventId(null);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onViewEvent={handleViewEvent} />;
      case 'discover':
        return <Discover onViewEvent={handleViewEvent} />;
      case 'create':
        return <CreateEvent />;
      case 'profile':
        return <Profile />;
      case 'user-profile':
        return <UserProfile />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'event-details':
        if (selectedEventId) {
          const event = mockEvents.find(e => e.id === selectedEventId);
          if (event) {
            return (
              <EventDetailsPage
                event={event}
                onBack={handleBackFromEvent}
                onJoin={handleJoinEvent}
              />
            );
          }
        }
        // Fallback to home if event not found
        setCurrentPage('home');
        return <Home onViewEvent={handleViewEvent} />;
      default:
        return <Home onViewEvent={handleViewEvent} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />
      {renderPage()}
    </div>
  );
}

export default App;