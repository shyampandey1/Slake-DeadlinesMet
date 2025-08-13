
"use client";

import { useState, useEffect, useCallback } from 'react';

const WEATHER_LOCATION_KEY = 'weather_location';
const WEATHER_UNIT_KEY = 'weather_unit';
const WEATHER_CACHE_KEY = 'weather_data';
const WEATHER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export interface WeatherData {
  temp: number;
  main: string;
  description: string;
  location: string;
  unit: 'C' | 'F';
  timestamp: number;
}

export function useWeather() {
  const [location, setLocationState] = useState('London');
  const [unit, setUnitState] = useState<'C' | 'F'>('C');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeatherForLocation = useCallback(async (loc: string, u: 'C' | 'F' = unit) => {
    setLoading(true);
    // This is a placeholder for a real weather API call.
    // In a real app, you would use fetch() to call a weather service.
    // For this example, we'll return mock data.
    setTimeout(() => {
      const mockWeather: WeatherData = {
        temp: u === 'C' ? 18 : 64,
        main: "Clouds",
        description: "overcast clouds",
        location: loc,
        unit: u,
        timestamp: Date.now(),
      };
      setWeather(mockWeather);
      try {
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(mockWeather));
      } catch (error) {
        console.warn("Could not cache weather data.");
      }
      setLoading(false);
    }, 500); // Simulate network delay
  }, [unit]);

  useEffect(() => {
    let initialLocation = 'London';
    let initialUnit: 'C' | 'F' = 'C';
    
    try {
      const storedLocation = localStorage.getItem(WEATHER_LOCATION_KEY);
      if (storedLocation) initialLocation = storedLocation;

      const storedUnit = localStorage.getItem(WEATHER_UNIT_KEY);
      if (storedUnit && (storedUnit === 'C' || storedUnit === 'F')) {
          initialUnit = storedUnit;
      }
    } catch (error) {
        console.warn("Could not access localStorage for weather settings.");
    }
    
    setLocationState(initialLocation);
    setUnitState(initialUnit);

    try {
      const cachedWeather = localStorage.getItem(WEATHER_CACHE_KEY);
      if (cachedWeather) {
        const data: WeatherData = JSON.parse(cachedWeather);
        if (Date.now() - data.timestamp < WEATHER_CACHE_TTL) {
          setWeather(data);
          setLoading(false);
        } else {
          fetchWeatherForLocation(initialLocation, initialUnit);
        }
      } else {
        fetchWeatherForLocation(initialLocation, initialUnit);
      }
    } catch (error) {
        console.warn("Could not access localStorage for weather cache.");
        fetchWeatherForLocation(initialLocation, initialUnit);
    }
  }, [fetchWeatherForLocation]);

  const setLocation = useCallback((newLocation: string) => {
    setLocationState(newLocation);
    try {
      localStorage.setItem(WEATHER_LOCATION_KEY, newLocation);
    } catch (error) {
      console.warn("Could not save location to localStorage.");
    }
  }, []);

  const setUnit = useCallback((newUnit: 'C' | 'F') => {
    setUnitState(newUnit);
    try {
      localStorage.setItem(WEATHER_UNIT_KEY, newUnit);
      if (weather) {
          fetchWeatherForLocation(weather.location, newUnit);
      }
    } catch (error) {
      console.warn("Could not save unit to localStorage.");
    }
  }, [weather, fetchWeatherForLocation]);


  return { location, setLocation, unit, setUnit, weather, loading, fetchWeatherForLocation };
}

    