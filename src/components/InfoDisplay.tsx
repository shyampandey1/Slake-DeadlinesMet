
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { MapPin, Cloud, Thermometer, Clock, Sun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Haze, CloudFog } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  icon: React.ReactNode;
}

const weatherCodeMapping: { [key: number]: { condition: string, icon: React.ReactNode } } = {
    0: { condition: 'Clear sky', icon: <Sun /> },
    1: { condition: 'Mainly clear', icon: <Sun /> },
    2: { condition: 'Partly cloudy', icon: <Cloud /> },
    3: { condition: 'Overcast', icon: <Cloud /> },
    45: { condition: 'Fog', icon: <CloudFog /> },
    48: { condition: 'Depositing rime fog', icon: <CloudFog /> },
    51: { condition: 'Light drizzle', icon: <CloudDrizzle /> },
    53: { condition: 'Moderate drizzle', icon: <CloudDrizzle /> },
    55: { condition: 'Dense drizzle', icon: <CloudDrizzle /> },
    61: { condition: 'Slight rain', icon: <CloudRain /> },
    63: { condition: 'Moderate rain', icon: <CloudRain /> },
    65: { condition: 'Heavy rain', icon: <CloudRain /> },
    80: { condition: 'Slight rain showers', icon: <CloudRain /> },
    81: { condition: 'Moderate rain showers', icon: <CloudRain /> },
    82: { condition: 'Violent rain showers', icon: <CloudRain /> },
    71: { condition: 'Slight snow fall', icon: <CloudSnow /> },
    73: { condition: 'Moderate snow fall', icon: <CloudSnow /> },
    75: { condition: 'Heavy snow fall', icon: <CloudSnow /> },
    85: { condition: 'Slight snow showers', icon: <CloudSnow /> },
    86: { condition: 'Heavy snow showers', icon: <CloudSnow /> },
    95: { condition: 'Thunderstorm', icon: <CloudLightning /> },
};


export default function InfoDisplay() {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000 * 60); // Update time every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchWeather(latitude: number, longitude: number) {
        try {
            const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            const weatherData = await weatherResponse.json();
            
            const locationResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const locationData = await locationResponse.json();

            const { temperature, weathercode } = weatherData.current_weather;
            const { condition, icon } = weatherCodeMapping[weathercode] || { condition: 'Clear', icon: <Sun /> };
            const locationName = locationData.address?.city || locationData.address?.town || 'Current Location';

            setWeather({
                location: locationName,
                temperature: Math.round(temperature),
                condition,
                icon,
            });

        } catch (error) {
            console.error("Failed to fetch weather data:", error);
        } finally {
            setLoading(false);
        }
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLoading(false); 
        }
      );
    } else {
        setLoading(false);
    }
  }, []);

  const renderSkeleton = () => (
    <div className="flex items-center gap-4 p-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-6 w-24" />
    </div>
  )

  if (loading) {
    return renderSkeleton();
  }

  return (
    <div className="flex items-center gap-4 text-sm p-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
      <div className="flex items-center gap-1">
        <Clock className="h-4 w-4" />
        <span>{format(time, "p")}</span>
      </div>
      {weather && (
        <>
        <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{weather.location}</span>
        </div>
        <div className="flex items-center gap-1">
            <Thermometer className="h-4 w-4" />
            <span>{weather.temperature}°C</span>
        </div>
        <div className="flex items-center gap-1">
            <div className="h-4 w-4">{weather.icon}</div>
            <span>{weather.condition}</span>
        </div>
        </>
      )}
    </div>
  );
}
