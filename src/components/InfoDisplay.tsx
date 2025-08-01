
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { MapPin, Cloud, Thermometer, Clock, Sun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Haze, CloudFog, Calendar, LocateFixed } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface WeatherData {
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
  const [permissionDenied, setPermissionDenied] = useState(false);

  async function fetchWeather(latitude: number, longitude: number) {
      setLoading(true);
      setPermissionDenied(false);
      try {
          const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
          const weatherData = await weatherResponse.json();
          
          if (weatherData?.current_weather) {
            const { temperature, weathercode } = weatherData.current_weather;
            const { condition, icon } = weatherCodeMapping[weathercode] || { condition: 'Clear', icon: <Sun className="h-4 w-4" /> };

            setWeather({
                temperature: Math.round(temperature),
                condition,
                icon,
            });
          }
      } catch (error) {
          console.error("Failed to fetch weather data:", error);
          setWeather(null); // Clear weather on error
      } finally {
          setLoading(false);
      }
  }

  const requestGeolocation = () => {
    setLoading(true);
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeather(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                console.error("Geolocation error:", error.message);
                setPermissionDenied(true);
                setLoading(false);
            }
        );
    } else {
        setPermissionDenied(true);
        setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000 * 60); // Update time every minute
    
    requestGeolocation();

    return () => clearInterval(timer);
  }, []);

  const renderSkeleton = () => (
    <div className="flex items-center gap-4 p-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-6 w-24" />
    </div>
  )

  if (loading && !weather && !permissionDenied) {
    return (
        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
            <div className="overflow-x-auto scrollbar-hide">
                {renderSkeleton()}
            </div>
        </div>
    );
  }

  return (
    <div className={cn(
        "relative before:absolute before:inset-y-0 before:left-0 before:w-8 before:bg-gradient-to-r before:from-[var(--timer-background-color)] before:to-transparent before:pointer-events-none before:z-10",
        "after:absolute after:inset-y-0 after:right-0 after:w-8 after:bg-gradient-to-l after:from-[var(--timer-background-color)] after:to-transparent after:pointer-events-none after:z-10"
    )}>
        <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center justify-start gap-x-4 text-xs p-3 rounded-lg bg-card/50 backdrop-blur-sm border border-border whitespace-nowrap">
                <div className="flex items-center gap-1.5 shrink-0">
                    <Calendar className="h-4 w-4" />
                    <span>{format(time, "PPP")}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <Clock className="h-4 w-4" />
                    <span>{format(time, "p")}</span>
                </div>
                {weather ? (
                    <>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Thermometer className="h-4 w-4" />
                        <span>{weather.temperature}°C</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {weather.icon}
                        <span className="truncate">{weather.condition}</span>
                    </div>
                    </>
                ) : (
                    <Button variant="ghost" size="sm" onClick={requestGeolocation} className="text-xs h-auto py-1 px-2 gap-2 shrink-0">
                        <LocateFixed className="h-4 w-4" />
                        {permissionDenied ? 'Location denied' : 'Show Weather'}
                    </Button>
                )}
            </div>
        </div>
    </div>
  );
}
