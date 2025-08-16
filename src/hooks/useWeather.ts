
"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchWeatherApi } from 'openmeteo';

const WEATHER_LOCATION_KEY = 'weather_location';
const WEATHER_UNIT_KEY = 'weather_unit';
const WEATHER_CACHE_KEY = 'weather_data';
const WEATHER_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export interface WeatherData {
  temp: number;
  main: string;
  description: string;
  location: string;
  unit: 'C' | 'F';
  timestamp: number;
}

// See https://open-meteo.com/en/docs for WMO codes
function wmoCodeToWeatherMain(code: number | undefined): string {
    if (code === undefined) return "Clear";
    if (code === 0) return "Clear"; // Clear sky
    if (code >= 1 && code <= 3) return "Clouds"; // Mainly clear, partly cloudy, and overcast
    if (code >= 45 && code <= 48) return "Haze"; // Fog and depositing rime fog
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "Rain"; // Drizzle, Rain, Showers
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "Snow"; // Snow, Snow grains, Snow showers
    if (code >= 95 && code <= 99) return "Thunderstorm"; // Thunderstorm
    return "Clear";
}

async function getCoordsForLocation(locationName: string): Promise<{ latitude: number; longitude: number; name: string } | null> {
    if (locationName.trim().toLowerCase() === 'current location') return null;
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=1&language=en&format=json`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const { latitude, longitude, name, country } = data.results[0];
            return { latitude, longitude, name: `${name}, ${country}` };
        }
        return null;
    } catch (error) {
        console.error("Geocoding API error:", error);
        return null;
    }
}

async function fetchWeather(latitude: number, longitude: number, unit: 'C' | 'F'): Promise<Omit<WeatherData, 'location' | 'timestamp'> | null> {
    const params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": ["temperature_2m", "weather_code"],
        "temperature_unit": unit === 'F' ? 'fahrenheit' : 'celsius',
    };
    const url = "https://api.open-meteo.com/v1/forecast";

    try {
        const responses = await fetchWeatherApi(url, params);
        const response = responses[0];
        const current = response.current();

        const weatherData = {
            temp: Math.round(current!.variables(0)!.value()),
            main: wmoCodeToWeatherMain(current!.variables(1)!.value()),
            description: wmoCodeToWeatherMain(current!.variables(1)!.value()).toLowerCase(),
            unit: unit,
        };
        return weatherData;

    } catch (error) {
        console.error("Failed to fetch weather from Open-Meteo:", error);
        return null;
    }
}


export function useWeather() {
  const [location, setLocationState] = useState('Delhi, India');
  const [unit, setUnitState] = useState<'C' | 'F'>('C');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAndSetWeather = useCallback(async (lat: number, lon: number, locName: string, unit: 'C' | 'F') => {
      setLoading(true);
      const weatherData = await fetchWeather(lat, lon, unit);
      if (weatherData) {
          const finalData: WeatherData = {
              ...weatherData,
              location: locName,
              timestamp: Date.now()
          };
          setWeather(finalData);
          try {
            localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(finalData));
          } catch (e) {}
      }
      setLoading(false);
  }, []);

  const fetchWeatherForLocation = useCallback(async (loc: string, u: 'C' | 'F' = unit) => {
    setLoading(true);
    const coords = await getCoordsForLocation(loc);
    if (coords) {
        setLocationState(coords.name);
        await fetchAndSetWeather(coords.latitude, coords.longitude, coords.name, u);
    } else {
        alert(`Could not find location: ${loc}`);
        setLoading(false);
    }
  }, [unit, fetchAndSetWeather]);


  const fetchWeatherForCurrentUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const autoLocation = "Current Location";
        setLocationState(autoLocation);
        fetchAndSetWeather(latitude, longitude, autoLocation, unit);
      },
      () => {
        alert("Unable to retrieve your location.");
        setLoading(false);
      }
    );
  }, [unit, fetchAndSetWeather]);

  useEffect(() => {
    let initialLocation = 'Delhi, India';
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
        if (Date.now() - data.timestamp < WEATHER_CACHE_TTL && data.location === initialLocation && data.unit === initialUnit) {
          setWeather(data);
          setLoading(false);
        } else {
            if (initialLocation.toLowerCase() === 'current location') {
                fetchWeatherForCurrentUserLocation();
            } else {
                fetchWeatherForLocation(initialLocation, initialUnit);
            }
        }
      } else {
        if (initialLocation.toLowerCase() === 'current location') {
            fetchWeatherForCurrentUserLocation();
        } else {
            fetchWeatherForLocation(initialLocation, initialUnit);
        }
      }
    } catch (error) {
        console.warn("Could not access localStorage for weather cache.");
        fetchWeatherForLocation(initialLocation, initialUnit);
    }
  }, []); // Run only once on mount

  const setLocation = useCallback((newLocation: string) => {
    try {
      localStorage.setItem(WEATHER_LOCATION_KEY, newLocation);
    } catch (error) {
      console.warn("Could not save location to localStorage.");
    }

    if (newLocation.toLowerCase() === 'current location') {
        fetchWeatherForCurrentUserLocation();
    } else {
        fetchWeatherForLocation(newLocation);
    }
  }, [fetchWeatherForLocation, fetchWeatherForCurrentUserLocation]);

  const setUnit = useCallback((newUnit: 'C' | 'F') => {
    setUnitState(newUnit);
    try {
      localStorage.setItem(WEATHER_UNIT_KEY, newUnit);
      if (weather) {
          if (location.toLowerCase() === 'current location') {
              fetchWeatherForCurrentUserLocation();
          } else {
            fetchWeatherForLocation(weather.location, newUnit);
          }
      }
    } catch (error) {
      console.warn("Could not save unit to localStorage.");
    }
  }, [weather, location, fetchWeatherForLocation, fetchWeatherForCurrentUserLocation]);


  return { location, setLocation, unit, setUnit, weather, loading, fetchWeatherForLocation, fetchWeatherForCurrentUserLocation };
}
