
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
    0: { condition: 'Clear sky', icon: <Sun className="h-4 w-4" /> },
    1: { condition: 'Mainly clear', icon: <Sun className="h-4 w-4" /> },
    2: { condition: 'Partly cloudy', icon: <Cloud className="h-4 w-4" /> },
    3: { condition: 'Overcast', icon: <Cloud className="h-4 w-4" /> },
    45: { condition: 'Fog', icon: <CloudFog className="h-4 w-4" /> },
    48: { condition: 'Depositing rime fog', icon: <CloudFog className="h-4 w-4" /> },
    51: { condition: 'Light drizzle', icon: <CloudDrizzle className="h-4 w-4" /> },
    53: { condition: 'Moderate drizzle', icon: <CloudDrizzle className="h-4 w-4" /> },
    55: { condition: 'Dense drizzle', icon: <CloudDrizzle className="h-4 w-4" /> },
    61: { condition: 'Slight rain', icon: <CloudRain className="h-4 w-4" /> },
    63: { condition: 'Moderate rain', icon: <CloudRain className="h-4 w-4" /> },
    65: { condition: 'Heavy rain', icon: <CloudRain className="h-4 w-4" /> },
    80: { condition: 'Slight rain showers', icon: <CloudRain className="h-4 w-4" /> },
    81: { condition: 'Moderate rain showers', icon: <CloudRain className="h-4 w-4" /> },
    82: { condition: 'Violent rain showers', icon: <CloudRain className="h-4 w-4" /> },
    71: { condition: 'Slight snow fall', icon: <CloudSnow className="h-4 w-4" /> },
    73: { condition: 'Moderate snow fall', icon: <CloudSnow className="h-4 w-4" /> },
    75: { condition: 'Heavy snow fall', icon: <CloudSnow className="h-4 w-4" /> },
    85: { condition: 'Slight snow showers', icon: <CloudSnow className="h-4 w-4" /> },
    86: { condition: 'Heavy snow showers', icon: <CloudSnow className="h-4 w-4" /> },
    95: { condition: 'Thunderstorm', icon: <CloudLightning className="h-4 w-4" /> },
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
            
            const locationResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
                headers: {
                    'User-Agent': 'DeadlinesMet'
                }
            });
            const locationData = await locationResponse.json();

            if (weatherData?.current_weather) {
              const { temperature, weathercode } = weatherData.current_weather;
              const { condition, icon } = weatherCodeMapping[weathercode] || { condition: 'Clear', icon: <Sun className="h-4 w-4" /> };
              const locationName = locationData.address?.city;

              if (locationName) {
                setWeather({
                    location: locationName,
                    temperature: Math.round(temperature),
                    condition,
                    icon,
                });
              }
            }
        } catch (error) {
            console.error("Failed to fetch weather data:", error);
            setWeather(null); // Clear weather on error
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
                console.error("Geolocation error:", error.message);
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
    <div className="hidden sm:flex items-center gap-x-3 text-xs p-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
      <div className="flex items-center gap-1.5">
        <Clock className="h-4 w-4" />
        <span>{format(time, "p")}</span>
      </div>
      {weather && (
        <>
        <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span>{weather.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
            <Thermometer className="h-4 w-4" />
            <span>{weather.temperature}°C</span>
        </div>
        <div className="flex items-center gap-1.5">
            {weather.icon}
            <span>{weather.condition}</span>
        </div>
        </>
      )}
    </div>
  );
}
