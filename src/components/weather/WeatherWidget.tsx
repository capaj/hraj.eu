import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  Cloud, 
  CloudRain, 
  Sun, 
  CloudSnow, 
  Wind, 
  Droplets, 
  Thermometer,
  Eye,
  AlertTriangle,
  RefreshCw,
  Sunset
} from 'lucide-react';

interface WeatherData {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy';
  humidity: number;
  windSpeed: number;
  visibility: number;
  precipitation: number;
  description: string;
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
  sunsetTime: string;
}

interface WeatherWidgetProps {
  date: Date;
  location: string;
  sport: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ date, location, sport }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate sunset time based on date and approximate location
  const calculateSunsetTime = (date: Date, location: string): string => {
    // This is a simplified calculation for demo purposes
    // In a real app, you'd use a proper sunset calculation library or API
    
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
    
    // Base sunset time around 18:00, varying by season
    let baseHour = 18;
    let baseMinute = 0;
    
    // Adjust for season (simplified)
    const seasonalAdjustment = Math.sin((dayOfYear - 81) * 2 * Math.PI / 365) * 2; // +/- 2 hours
    baseHour += seasonalAdjustment;
    
    // Adjust for approximate location (very simplified)
    if (location.toLowerCase().includes('stockholm') || location.toLowerCase().includes('copenhagen')) {
      baseHour += 1; // Northern cities
    } else if (location.toLowerCase().includes('madrid') || location.toLowerCase().includes('rome')) {
      baseHour -= 0.5; // Southern cities
    }
    
    // Convert to proper time format
    const hour = Math.floor(baseHour);
    const minute = Math.floor((baseHour - hour) * 60);
    
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // Mock weather data generator
  const generateMockWeather = (): WeatherData => {
    const conditions: WeatherData['condition'][] = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    let temperature = Math.floor(Math.random() * 30) + 5; // 5-35°C
    let precipitation = 0;
    let recommendation: WeatherData['recommendation'] = 'excellent';
    
    // Adjust based on condition
    switch (condition) {
      case 'rainy':
        temperature = Math.floor(Math.random() * 15) + 10; // 10-25°C
        precipitation = Math.floor(Math.random() * 80) + 20; // 20-100%
        recommendation = precipitation > 60 ? 'poor' : 'fair';
        break;
      case 'snowy':
        temperature = Math.floor(Math.random() * 10) - 5; // -5 to 5°C
        precipitation = Math.floor(Math.random() * 60) + 40; // 40-100%
        recommendation = 'poor';
        break;
      case 'windy':
        recommendation = sport === 'tennis' || sport === 'badminton' ? 'fair' : 'good';
        break;
      case 'cloudy':
        recommendation = 'good';
        break;
      default:
        recommendation = 'excellent';
    }

    return {
      temperature,
      condition,
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
      visibility: Math.floor(Math.random() * 5) + 8, // 8-13 km
      precipitation,
      description: getWeatherDescription(condition, temperature),
      recommendation,
      sunsetTime: calculateSunsetTime(date, location)
    };
  };

  const getWeatherDescription = (condition: WeatherData['condition'], temp: number): string => {
    const descriptions = {
      sunny: temp > 25 ? 'Hot and sunny' : temp > 15 ? 'Pleasant and sunny' : 'Cool but sunny',
      cloudy: 'Overcast with clouds',
      rainy: temp > 15 ? 'Warm with rain showers' : 'Cool and rainy',
      snowy: 'Cold with snow',
      windy: 'Breezy conditions'
    };
    return descriptions[condition];
  };

  const getWeatherIcon = (condition: WeatherData['condition']) => {
    const icons = {
      sunny: <Sun className="text-yellow-500" size={24} />,
      cloudy: <Cloud className="text-gray-500" size={24} />,
      rainy: <CloudRain className="text-blue-500" size={24} />,
      snowy: <CloudSnow className="text-blue-300" size={24} />,
      windy: <Wind className="text-gray-600" size={24} />
    };
    return icons[condition];
  };

  const getRecommendationBadge = (recommendation: WeatherData['recommendation']) => {
    const variants = {
      excellent: { variant: 'success' as const, text: 'Perfect for sports!' },
      good: { variant: 'info' as const, text: 'Good conditions' },
      fair: { variant: 'warning' as const, text: 'Playable conditions' },
      poor: { variant: 'error' as const, text: 'Challenging conditions' }
    };
    return variants[recommendation];
  };

  const getSportSpecificAdvice = (weather: WeatherData, sport: string): string[] => {
    const advice: string[] = [];
    
    if (weather.condition === 'rainy' && weather.precipitation > 30) {
      advice.push('Consider bringing waterproof gear');
      if (sport === 'football' || sport === 'tennis') {
        advice.push('Field/court may be slippery');
      }
    }
    
    if (weather.condition === 'windy' && weather.windSpeed > 15) {
      if (sport === 'tennis' || sport === 'badminton') {
        advice.push('Wind may affect ball/shuttlecock trajectory');
      }
    }
    
    if (weather.temperature > 28) {
      advice.push('Stay hydrated - bring extra water');
      advice.push('Consider sun protection');
    }
    
    if (weather.temperature < 10) {
      advice.push('Dress warmly and allow extra warm-up time');
    }
    
    if (weather.humidity > 70) {
      advice.push('High humidity - take breaks as needed');
    }

    return advice;
  };

  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // In a real app, you'd call a weather API here
        // const response = await fetch(`/api/weather?location=${location}&date=${date.toISOString()}`);
        // const data = await response.json();
        
        const mockData = generateMockWeather();
        setWeather(mockData);
      } catch (err) {
        setError('Failed to load weather data');
        console.error('Weather fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [date, location]);

  const handleRefresh = () => {
    setWeather(null);
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setWeather(generateMockWeather());
      setIsLoading(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Cloud size={18} className="mr-2" />
              Weather Forecast
            </h3>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
            <span className="text-gray-600">Loading weather data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Cloud size={18} className="mr-2" />
              Weather Forecast
            </h3>
            <button
              onClick={handleRefresh}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-4">
            <AlertTriangle className="mx-auto mb-2 text-yellow-500" size={24} />
            <p className="text-gray-600 mb-3">{error || 'Weather data unavailable'}</p>
            <button
              onClick={handleRefresh}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recommendation = getRecommendationBadge(weather.recommendation);
  const sportAdvice = getSportSpecificAdvice(weather, sport);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Cloud size={18} className="mr-2" />
            Weather Forecast
          </h3>
          <button
            onClick={handleRefresh}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
        <p className="text-sm text-gray-600">
          {date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </CardHeader>
      <CardContent className="p-6">
        {/* Main Weather Display */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {getWeatherIcon(weather.condition)}
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {weather.temperature}°C
              </div>
              <div className="text-sm text-gray-600">
                {weather.description}
              </div>
            </div>
          </div>
          <Badge variant={recommendation.variant} size="md">
            {recommendation.text}
          </Badge>
        </div>

        {/* Weather Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center space-x-2 text-sm">
            <Droplets size={16} className="text-blue-500" />
            <span className="text-gray-600">Humidity:</span>
            <span className="font-medium">{weather.humidity}%</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Wind size={16} className="text-gray-500" />
            <span className="text-gray-600">Wind:</span>
            <span className="font-medium">{weather.windSpeed} km/h</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Eye size={16} className="text-gray-500" />
            <span className="text-gray-600">Visibility:</span>
            <span className="font-medium">{weather.visibility} km</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Sunset size={16} className="text-orange-500" />
            <span className="text-gray-600">Sunset:</span>
            <span className="font-medium">{weather.sunsetTime}</span>
          </div>
          {weather.precipitation > 0 && (
            <div className="flex items-center space-x-2 text-sm col-span-2">
              <CloudRain size={16} className="text-blue-500" />
              <span className="text-gray-600">Rain chance:</span>
              <span className="font-medium">{weather.precipitation}%</span>
            </div>
          )}
        </div>

        {/* Sport-Specific Advice */}
        {sportAdvice.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <Thermometer size={16} className="mr-2 text-blue-600" />
              Tips for {sport}
            </h4>
            <ul className="space-y-1">
              {sportAdvice.map((tip, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 text-center">
          Weather data is estimated and may change
        </div>
      </CardContent>
    </Card>
  );
};