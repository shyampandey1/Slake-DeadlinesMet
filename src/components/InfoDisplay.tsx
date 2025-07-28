
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { getWeatherForLocation, GetWeatherForLocationOutput } from "@/ai/flows/get-weather-for-location";
import { MapPin, Cloud, Thermometer, Clock } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

export default function InfoDisplay() {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<GetWeatherForLocationOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000 * 60); // Update time every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const result = await getWeatherForLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setWeather(result);
          } catch (error) {
            console.error("Failed to fetch weather:", error);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLoading(false); // Stop loading even if location is denied
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
            <span>{Math.round(weather.temperature)}°C</span>
        </div>
        <div className="flex items-center gap-1">
            <Cloud className="h-4 w-4" />
            <span>{weather.condition}</span>
        </div>
        </>
      )}
    </div>
  );
}
