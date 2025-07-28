
"use client";

import { useState, useEffect } from 'react';
import { Calendar, Clock, Cloud, MapPin, LocateFixed } from 'lucide-react';
import { getLocationFromCoords, GetLocationFromCoordsOutput } from '@/ai/flows/get-location-from-coords';
import { cn } from '@/lib/utils';

type GeolocationStatus = 'prompt' | 'granted' | 'denied' | 'loading' | 'error';

export default function InfoDisplay() {
  const [dateTime, setDateTime] = useState(new Date());
  const [locationInfo, setLocationInfo] = useState<GetLocationFromCoordsOutput | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>('prompt');

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const requestLocation = () => {
    setStatus('loading');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const locationData = await getLocationFromCoords({ latitude, longitude });
            setLocationInfo(locationData);
            setStatus('granted');
          } catch (error) {
            console.error("Failed to get location from coords:", error);
            setStatus('error');
          }
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
    return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
    });
  };
  
  const iconSize = "h-3.5 w-3.5";

  const renderLocationWeather = () => {
    switch (status) {
      case 'prompt':
        return (
          <button onClick={requestLocation} className="flex items-center gap-1.5 text-xs hover:text-foreground transition-colors">
            <LocateFixed className={cn(iconSize)} />
            <span>Weather</span>
          </button>
        );
      case 'loading':
        return <span className="text-xs">Loading...</span>;
      case 'denied':
        return <span className="text-xs">Location access denied.</span>;
      case 'error':
        return <span className="text-xs">Could not fetch location.</span>;
      case 'granted':
        return (
          <>
            {locationInfo?.weather && (
              <div className="flex items-center gap-1.5">
                <Cloud className={cn(iconSize)} />
                <span>{locationInfo.weather.description}, {locationInfo.weather.temp}°C</span>
              </div>
            )}
            {locationInfo && (
              <div className="flex items-center gap-1.5">
                <MapPin className={cn(iconSize)} />
                <span>{locationInfo.city}</span>
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  }

  return (
    <div className="absolute top-2 right-2 flex items-center gap-4 text-xs text-muted-foreground p-1.5 rounded-md bg-card/50 backdrop-blur-sm border border-border">
      <div className="flex items-center gap-1.5">
        <Calendar className={cn(iconSize)} />
        <span>{formatDate(dateTime)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Clock className={cn(iconSize)} />
        <span>{formatTime(dateTime)}</span>
      </div>
      {renderLocationWeather()}
    </div>
  );
}
