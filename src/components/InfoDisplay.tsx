
"use client";

import { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, Cloud, MapPin } from 'lucide-react';

export default function InfoDisplay() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
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

  return (
    <div className="absolute top-4 right-4 flex items-center gap-6 text-sm text-muted-foreground p-2 rounded-md bg-card/50 backdrop-blur-sm border border-border">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4" />
        <span>USD</span>
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        <span>{formatDate(dateTime)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span>{formatTime(dateTime)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Cloud className="h-4 w-4" />
        <span>Sunny, 24°C</span>
      </div>
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        <span>New York, USA</span>
      </div>
    </div>
  );
}
