
"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchWeatherApi } from '@openmeteo/sdk';

const WEATHER_LOCATION_KEY = 'weather_location';
const WEATHER_UNIT_KEY = 'weather_unit';

type Unit = 'C' | 'F';

export function useWeather() {
  const [location, setLocationState] = useState('Delhi, India');
  const [unit, setUnitState] = useState<Unit>('C');
  const [weatherData, setWeatherData] =useState<{ temp: number; code: number; } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on initial render
  useEffect(() => {
    try {
        const storedLocation = localStorage.getItem(WEATHER_LOCATION_KEY);
        if (storedLocation) setLocationState(storedLocation);

        const storedUnit = localStorage.getItem(WEATHER_UNIT_KEY) as Unit;
        if (storedUnit) setUnitState(storedUnit);
    } catch (e) {
        console.warn("Could not access localStorage for weather settings.");
    }
  }, []);
  
  const setLocation = useCallback((newLocation: string) => {
    setLocationState(newLocation);
    try {
        localStorage.setItem(WEATHER_LOCATION_KEY, newLocation);
    } catch (e) {
        console.warn("Could not access localStorage for weather settings.");
    }
  }, []);

  const setUnit = useCallback((newUnit: Unit) => {
    setUnitState(newUnit);
    try {
        localStorage.setItem(WEATHER_UNIT_KEY, newUnit);
    } catch (e) {
        console.warn("Could not access localStorage for weather settings.");
    }
  }, []);

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const params = {
        "latitude": lat,
        "longitude": lon,
        "current": ["temperature_2m", "weather_code"],
        "temperature_unit": unit === 'C' ? 'celsius' : 'fahrenheit',
      };
      const url = "https://api.open-meteo.com/v1/forecast";
      const responses = await fetchWeatherApi(url, params);
      const response = responses[0];
      
      const current = response.current();
      if (current) {
        setWeatherData({
          temp: Math.round(current.variables(0)!.value()),
          code: current.variables(1)!.value(),
        });
      }
    } catch (error) {
      console.error("Failed to fetch weather data:", error);
    } finally {
      setLoading(false);
    }
  }, [unit]);

  const fetchCoordinates = useCallback(async (loc: string) => {
    setLoading(true);
    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1`);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const { latitude, longitude } = data.results[0];
        fetchWeather(latitude, longitude);
      } else {
          setLoading(false);
          console.error("Location not found");
      }
    } catch (error) {
      setLoading(false);
      console.error("Failed to fetch coordinates:", error);
    }
  }, [fetchWeather]);

  const fetchWeatherForCurrentUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation('Current Location');
          fetchWeather(latitude, longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Fallback to default location if permission is denied
          fetchCoordinates(location);
        }
      );
    } else {
        fetchCoordinates(location);
    }
  }, [fetchWeather, fetchCoordinates, location]);

  useEffect(() => {
    if (location && location !== 'Current Location') {
      fetchCoordinates(location);
    } else if (location === 'Current Location') {
      fetchWeatherForCurrentUserLocation();
    }
  }, [location, unit, fetchCoordinates, fetchWeatherForCurrentUserLocation]);

  return { location, setLocation, unit, setUnit, weatherData, loading, fetchWeatherForCurrentUserLocation };
}
