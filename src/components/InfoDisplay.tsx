
"use client";

import { useState, useEffect } from 'react';
import { Calendar, Clock, Cloud, MapPin, LocateFixed } from 'lucide-react';

type GeolocationStatus = 'prompt' | 'granted' | 'denied' | 'loading' | 'error';

export default function InfoDisplay() {
  const [dateTime, setDateTime] = useState(new Date());
  const [location, setLocation] = useState<{ city: string; country: string } | null>(null);
  const [weather, setWeather] = useState<{ temp: number; description: string } | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>('prompt');

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const requestLocation = () => {
    setStatus('loading');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you would use these coords to call a weather API
          // and a reverse geocoding API.
          // For this example, we'll use mock data.
          console.log('Latitude:', position.coords.latitude, 'Longitude:', position.coords.longitude);
          setLocation({ city: 'San Francisco', country: 'USA' });
          setWeather({ temp: 18, description: 'Cloudy' });
          setStatus('granted');
        },
        (error) => {
          console.error("Geolocation error:", error);
          if (error.code === error.PERMISSION_DENIED) {
            setStatus('denied');
          } else {
            setStatus('error');
          }
        }
      );
    } else {
      setStatus('error');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString();
  };

  const renderLocationWeather = () => {
    switch (status) {
      case 'prompt':
        return (
          <button onClick={requestLocation} className="flex items-center gap-2 text-sm hover:text-foreground transition-colors">
            <LocateFixed className="h-4 w-4" />
            <span>Show Local Weather</span>
          </button>
        );
      case 'loading':
        return <span>Loading location...</span>;
      case 'denied':
        return <span>Location access denied.</span>;
      case 'error':
        return <span>Could not fetch location.</span>;
      case 'granted':
        return (
          <>
            {weather && (
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                <span>{weather.description}, {weather.temp}°C</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{location.city}, {location.country}</span>
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  }

  return (
    <div className="absolute top-4 right-4 flex items-center gap-6 text-sm text-muted-foreground p-2 rounded-md bg-card/50 backdrop-blur-sm border border-border">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        <span>{formatDate(dateTime)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span>{formatTime(dateTime)}</span>
      </div>
      {renderLocationWeather()}
    </div>
  );
}
