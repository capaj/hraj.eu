import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EventCard } from '../components/events/EventCard';
import { mockEvents } from '../lib/mock-data';
import { Plus, MapPin, Users, Trophy, Search } from 'lucide-react';

interface HomeProps {
  onViewEvent: (eventId: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onViewEvent }) => {
  const [userLocation, setUserLocation] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const upcomingEvents = mockEvents.slice(0, 3);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // In a real app, you'd use a reverse geocoding service
            // For demo purposes, we'll simulate getting the city name
            const { latitude, longitude } = position.coords;
            
            // Simulate reverse geocoding API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mock city based on approximate coordinates
            let city = 'Prague'; // Default
            if (latitude > 52 && latitude < 53 && longitude > 13 && longitude < 14) {
              city = 'Berlin';
            } else if (latitude > 48 && latitude < 49 && longitude > 16 && longitude < 17) {
              city = 'Vienna';
            } else if (latitude > 47 && latitude < 48 && longitude > 19 && longitude < 20) {
              city = 'Budapest';
            }
            
            setUserLocation(city);
          } catch (error) {
            console.error('Error getting location name:', error);
            setUserLocation('your area');
          } finally {
            setIsLoadingLocation(false);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setUserLocation('your area');
          setIsLoadingLocation(false);
        },
        {
          timeout: 30000,
          enableHighAccuracy: false,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      setUserLocation('your area');
      setIsLoadingLocation(false);
    }
  }, []);

  const handleJoinEvent = (eventId: string) => {
    console.log('Join event:', eventId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600">
      {/* Hero Section */}
      <section className="text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Let's Play Together
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto animate-slide-up">
              Join the largest community of amateur sports enthusiasts across Europe. 
              Organize games, discover events, and make new friends through sport.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-bounce-gentle">
              <Button size="lg" variant="secondary" className="text-lg">
                <Plus size={20} className="mr-2" />
                Create Event
              </Button>
              <Button size="lg" variant="outline" className="text-lg bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Search size={20} className="mr-2" />
                Discover Games
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Events in Your Area */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white">
                Popular Events {userLocation && `in ${userLocation}`}
              </h2>
              {isLoadingLocation ? (
                <div className="flex items-center mt-2 text-white/80">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="text-sm">Finding events near you...</span>
                </div>
              ) : (
                <p className="text-white/80 mt-2 flex items-center">
                  <MapPin size={16} className="mr-1" />
                  Showing events near your location
                </p>
              )}
            </div>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              View All Events
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onJoin={handleJoinEvent}
                onView={onViewEvent}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">2,547</div>
              <div className="text-white/80">Events Created</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">8,423</div>
              <div className="text-white/80">Active Players</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">15</div>
              <div className="text-white/80">Countries</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">95%</div>
              <div className="text-white/80">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why Choose hraj.eu?</h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              We make organizing and joining sports events simple, social, and secure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-8">
                <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <MapPin size={24} className="text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Find Local Games</h3>
                <p className="text-gray-600">
                  Discover sports events near you with advanced filtering by sport, skill level, and location.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <div className="bg-secondary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users size={24} className="text-secondary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Build Community</h3>
                <p className="text-gray-600">
                  Connect with like-minded players, earn karma points, and climb the leaderboards.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <div className="bg-accent-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Trophy size={24} className="text-accent-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Easy Organization</h3>
                <p className="text-gray-600">
                  Create events with payment integration, team balancing, and automated notifications.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};