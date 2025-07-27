"use client";

import { useEffect, useState } from 'react';
import { getWeather, GetWeatherOutput } from '@/ai/flows/get-weather';
import { Sun, Cloud, CloudRain, Snowflake, Zap, HelpCircle, Loader } from 'lucide-react';

export default function WeatherDisplay() {
  const [dateTime, setDateTime] = useState(new Date());
  const [weather, setWeather] = useState<GetWeatherOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const weatherData = await getWeather({ location: `${latitude},${longitude}` });
          setWeather(weatherData);
        } catch (e) {
          console.error(e);
          setError('Could not fetch weather data.');
        } finally {
            setIsLoading(false);
        }
      },
      () => {
        setError('Unable to retrieve your location. Please enable location services.');
        setIsLoading(false);
      }
    );
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString();
  };
  
  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('rain')) return <CloudRain className="w-6 h-6" />;
    if (desc.includes('cloud')) return <Cloud className="w-6 h-6" />;
    if (desc.includes('snow')) return <Snowflake className="w-6 h-6" />;
    if (desc.includes('storm') || desc.includes('thunder')) return <Zap className="w-6 h-6" />;
    if (desc.includes('sun') || desc.includes('clear')) return <Sun className="w-6 h-6" />;
    return <HelpCircle className="w-6 h-6" />;
  };

  return (
    <div className="p-4 rounded-lg shadow-md bg-card text-card-foreground text-right">
      <div className="font-semibold">{formatDate(dateTime)}</div>
      <div className="text-2xl font-bold">{formatTime(dateTime)}</div>
      <div className="mt-2">
        {isLoading ? (
          <div className="flex items-center justify-end gap-2">
            <Loader className="w-5 h-5 animate-spin" />
            <span>Loading weather...</span>
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : weather ? (
          <div className="flex items-center justify-end gap-2">
            {getWeatherIcon(weather.description)}
            <span>{weather.temperature}°C, {weather.description}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
