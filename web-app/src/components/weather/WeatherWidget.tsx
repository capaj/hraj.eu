import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSnow,
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  RefreshCw,
  Sunset,
  CloudFog,
  CloudLightning
} from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { msg } from '@lingui/core/macro'
import type { MessageDescriptor } from '@lingui/core'

type WeatherCondition =
  | 'clear'
  | 'cloudy'
  | 'fog'
  | 'rainy'
  | 'snowy'
  | 'thunder'
type Recommendation = 'excellent' | 'good' | 'fair' | 'poor'

interface WeatherData {
  temperature: number
  condition: WeatherCondition
  humidity: number
  windSpeed: number
  precipitation: number
  description: MessageDescriptor
  recommendation: Recommendation
  sunsetTime: string
}

interface WeatherWidgetProps {
  date: Date
  location: string
  sport: string
}

interface GeocodeResult {
  results?: Array<{
    latitude: number
    longitude: number
    name: string
  }>
}

interface ForecastResult {
  daily?: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: number[]
    sunset: string[]
    wind_speed_10m_max: number[]
  }
  hourly?: {
    time: string[]
    relative_humidity_2m: number[]
  }
}

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

function wmoToCondition(code: number): WeatherCondition {
  if (code === 0 || code === 1) return 'clear'
  if (code === 2 || code === 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 71 && code <= 77) return 'snowy'
  if (code === 85 || code === 86) return 'snowy'
  if (code >= 95 && code <= 99) return 'thunder'
  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82)
  )
    return 'rainy'
  return 'cloudy'
}

function describeCondition(
  condition: WeatherCondition,
  temp: number
): MessageDescriptor {
  switch (condition) {
    case 'clear':
      if (temp > 25) return msg`Hot and sunny`
      if (temp > 15) return msg`Pleasant and sunny`
      return msg`Cool but sunny`
    case 'cloudy':
      return msg`Overcast with clouds`
    case 'fog':
      return msg`Foggy conditions`
    case 'rainy':
      return temp > 15 ? msg`Warm with rain showers` : msg`Cool and rainy`
    case 'snowy':
      return msg`Cold with snow`
    case 'thunder':
      return msg`Thunderstorm expected`
  }
}

function scoreRecommendation(
  condition: WeatherCondition,
  precipitation: number,
  windSpeed: number,
  sport: string
): Recommendation {
  if (condition === 'thunder') return 'poor'
  if (condition === 'snowy') return 'poor'
  if (condition === 'rainy') return precipitation > 60 ? 'poor' : 'fair'
  if (condition === 'fog') return 'fair'
  if (windSpeed > 25) {
    return sport === 'tennis' || sport === 'badminton' ? 'fair' : 'good'
  }
  if (condition === 'cloudy') return 'good'
  return 'excellent'
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  date,
  location,
  sport
}) => {
  const { i18n, t } = useLingui()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWeather = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const searchTerm = location.split(',')[0]?.trim() || location
      const geoRes = await fetch(
        `${GEOCODE_URL}?name=${encodeURIComponent(searchTerm)}&count=1&language=${i18n.locale}&format=json`
      )
      if (!geoRes.ok) throw new Error('geocode_failed')
      const geo = (await geoRes.json()) as GeocodeResult
      const place = geo.results?.[0]
      if (!place) {
        setError(i18n._(msg`Could not find location for weather forecast`))
        setWeather(null)
        return
      }

      const dateStr = date.toISOString().slice(0, 10)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const targetDay = new Date(date)
      targetDay.setHours(0, 0, 0, 0)
      const daysAhead = Math.round(
        (targetDay.getTime() - today.getTime()) / 86_400_000
      )

      if (daysAhead < 0 || daysAhead > 15) {
        setError(i18n._(msg`Weather forecast is not available for this date`))
        setWeather(null)
        return
      }

      const forecastRes = await fetch(
        `${FORECAST_URL}?latitude=${place.latitude}&longitude=${place.longitude}` +
          `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunset,wind_speed_10m_max` +
          `&hourly=relative_humidity_2m` +
          `&start_date=${dateStr}&end_date=${dateStr}&timezone=auto`
      )
      if (!forecastRes.ok) throw new Error('forecast_failed')
      const forecast = (await forecastRes.json()) as ForecastResult

      const daily = forecast.daily
      const hourly = forecast.hourly
      if (!daily || daily.time.length === 0) {
        setError(i18n._(msg`Weather forecast is not available for this date`))
        setWeather(null)
        return
      }

      const code = daily.weather_code[0]
      const tempMax = daily.temperature_2m_max[0]
      const tempMin = daily.temperature_2m_min[0]
      const temperature = Math.round((tempMax + tempMin) / 2)
      const windSpeed = Math.round(daily.wind_speed_10m_max[0])
      const precipitation = daily.precipitation_probability_max[0] ?? 0
      const sunsetIso = daily.sunset[0]
      const sunsetDate = new Date(sunsetIso)
      const sunsetTime = sunsetDate.toLocaleTimeString(i18n.locale, {
        hour: '2-digit',
        minute: '2-digit'
      })

      const humidity = hourly?.relative_humidity_2m?.length
        ? Math.round(
            hourly.relative_humidity_2m.reduce((a, b) => a + b, 0) /
              hourly.relative_humidity_2m.length
          )
        : 0

      const condition = wmoToCondition(code)
      const recommendation = scoreRecommendation(
        condition,
        precipitation,
        windSpeed,
        sport
      )

      setWeather({
        temperature,
        condition,
        humidity,
        windSpeed,
        precipitation,
        description: describeCondition(condition, temperature),
        recommendation,
        sunsetTime
      })
    } catch (err) {
      console.error('Weather fetch error:', err)
      setError(i18n._(msg`Failed to load weather data`))
      setWeather(null)
    } finally {
      setIsLoading(false)
    }
  }, [date, location, sport, i18n])

  useEffect(() => {
    fetchWeather()
  }, [fetchWeather])

  const getWeatherIcon = (condition: WeatherCondition) => {
    switch (condition) {
      case 'clear':
        return <Sun className="text-yellow-500" size={24} />
      case 'cloudy':
        return <Cloud className="text-gray-500" size={24} />
      case 'fog':
        return <CloudFog className="text-gray-400" size={24} />
      case 'rainy':
        return <CloudRain className="text-blue-500" size={24} />
      case 'snowy':
        return <CloudSnow className="text-blue-300" size={24} />
      case 'thunder':
        return <CloudLightning className="text-purple-500" size={24} />
    }
  }

  const getRecommendationBadge = (recommendation: Recommendation) => {
    switch (recommendation) {
      case 'excellent':
        return {
          variant: 'success' as const,
          text: t`Perfect for sports!`
        }
      case 'good':
        return { variant: 'info' as const, text: t`Good conditions` }
      case 'fair':
        return {
          variant: 'warning' as const,
          text: t`Playable conditions`
        }
      case 'poor':
        return {
          variant: 'error' as const,
          text: t`Challenging conditions`
        }
    }
  }

  const getSportSpecificAdvice = (
    data: WeatherData,
    sport: string
  ): string[] => {
    const advice: string[] = []

    if (data.condition === 'rainy' && data.precipitation > 30) {
      advice.push(t`Consider bringing waterproof gear`)
      if (sport === 'football' || sport === 'tennis') {
        advice.push(t`Field/court may be slippery`)
      }
    }

    if (data.windSpeed > 20) {
      if (sport === 'tennis' || sport === 'badminton') {
        advice.push(t`Wind may affect ball/shuttlecock trajectory`)
      }
    }

    if (data.temperature > 28) {
      advice.push(t`Stay hydrated - bring extra water`)
      advice.push(t`Consider sun protection`)
    }

    if (data.temperature < 10) {
      advice.push(t`Dress warmly and allow extra warm-up time`)
    }

    if (data.humidity > 70) {
      advice.push(t`High humidity - take breaks as needed`)
    }

    if (data.condition === 'thunder') {
      advice.push(t`Avoid outdoor play during thunderstorms`)
    }

    return advice
  }

  const formattedDate = date.toLocaleDateString(i18n.locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Cloud size={18} className="mr-2" />
              <Trans>Weather Forecast</Trans>
            </h3>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
            <span className="text-gray-600">
              <Trans>Loading weather data...</Trans>
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !weather) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Cloud size={18} className="mr-2" />
              <Trans>Weather Forecast</Trans>
            </h3>
            <button
              onClick={fetchWeather}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={t`Refresh`}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-4">
            <AlertTriangle
              className="mx-auto mb-2 text-yellow-500"
              size={24}
            />
            <p className="text-gray-600 mb-3">
              {error || t`Weather data unavailable`}
            </p>
            <button
              onClick={fetchWeather}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              <Trans>Try again</Trans>
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const recommendation = getRecommendationBadge(weather.recommendation)
  const sportAdvice = getSportSpecificAdvice(weather, sport)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Cloud size={18} className="mr-2" />
            <Trans>Weather Forecast</Trans>
          </h3>
          <button
            onClick={fetchWeather}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label={t`Refresh`}
          >
            <RefreshCw size={16} />
          </button>
        </div>
        <p className="text-sm text-gray-600">{formattedDate}</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {getWeatherIcon(weather.condition)}
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {weather.temperature}°C
              </div>
              <div className="text-sm text-gray-600">
                {i18n._(weather.description)}
              </div>
            </div>
          </div>
          <Badge variant={recommendation.variant} size="md">
            {recommendation.text}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center space-x-2 text-sm">
            <Droplets size={16} className="text-blue-500" />
            <span className="text-gray-600">
              <Trans>Humidity:</Trans>
            </span>
            <span className="font-medium">{weather.humidity}%</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Wind size={16} className="text-gray-500" />
            <span className="text-gray-600">
              <Trans>Wind:</Trans>
            </span>
            <span className="font-medium">
              <Trans>{weather.windSpeed} km/h</Trans>
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Sunset size={16} className="text-orange-500" />
            <span className="text-gray-600">
              <Trans>Sunset:</Trans>
            </span>
            <span className="font-medium">{weather.sunsetTime}</span>
          </div>
          {weather.precipitation > 0 && (
            <div className="flex items-center space-x-2 text-sm">
              <CloudRain size={16} className="text-blue-500" />
              <span className="text-gray-600">
                <Trans>Rain chance:</Trans>
              </span>
              <span className="font-medium">{weather.precipitation}%</span>
            </div>
          )}
        </div>

        {sportAdvice.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <Thermometer size={16} className="mr-2 text-blue-600" />
              <Trans>Tips for {sport}</Trans>
            </h4>
            <ul className="space-y-1">
              {sportAdvice.map((tip, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-700 flex items-start"
                >
                  <span className="text-blue-600 mr-2">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 text-center">
          <Trans>Weather data provided by Open-Meteo</Trans>
        </div>
      </CardContent>
    </Card>
  )
}
