
"use client";

import { useState, useEffect, useCallback } from 'react';

const WEATHER_LOCATION_KEY = 'weather_location';
const WEATHER_UNIT_KEY = 'weather_unit';
const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

type Unit = 'C' | 'F';

export function useWeather() {
  const [location, setLocationState] = useState('Delhi, India');
  const [unit, setUnitState] = useState<Unit>('C');
  const [weatherData, setWeatherData] = useState<{ temp: number; code: number; } | null>(null);
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
    if (!API_KEY) {
        console.error("OpenWeatherMap API key is missing.");
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      const units = unit === 'C' ? 'metric' : 'imperial';
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setWeatherData({
          temp: Math.round(data.main.temp),
          code: data.weather[0].id,
        });
      } else {
        console.error("Failed to fetch weather data:", data.message);
      }
    } catch (error) {
      console.error("Failed to fetch weather data:", error);
    } finally {
      setLoading(false);
    }
  }, [unit]);

  const fetchCoordinates = useCallback(async (loc: string) => {
    if (!API_KEY) {
        console.error("OpenWeatherMap API key is missing.");
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(loc)}&limit=1&appid=${API_KEY}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        fetchWeather(lat, lon);
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
