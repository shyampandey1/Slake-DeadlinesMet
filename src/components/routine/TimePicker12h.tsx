"use client";

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface TimePicker12hProps {
  id?: string;
  value: string; // 24-hour "HH:mm", e.g. "06:30" or "13:00"
  onChange: (val24h: string) => void;
  className?: string;
  label?: string;
}

export function TimePicker12h({ id, value, onChange, className }: TimePicker12hProps) {
  // Parse 24-hour time "HH:mm" into 12-hour components
  const { hour12, minutes, period } = useMemo(() => {
    const [hStr, mStr] = (value || '06:00').split(':');
    let h = parseInt(hStr, 10);
    if (isNaN(h)) h = 6;
    const m = parseInt(mStr, 10);
    const validM = isNaN(m) ? 0 : Math.max(0, Math.min(59, m));

    const p: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;

    return {
      hour12: h12.toString().padStart(2, '0'),
      minutes: validM.toString().padStart(2, '0'),
      period: p,
    };
  }, [value]);

  const updateTime = (newH12: number, newM: number, newPeriod: 'AM' | 'PM') => {
    let h24 = newH12 % 12;
    if (newPeriod === 'PM') {
      h24 += 12;
    }
    const hStr = h24.toString().padStart(2, '0');
    const mStr = Math.max(0, Math.min(59, newM)).toString().padStart(2, '0');
    onChange(`${hStr}:${mStr}`);
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const h12 = parseInt(e.target.value, 10) || 12;
    updateTime(h12, parseInt(minutes, 10), period);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = parseInt(e.target.value, 10) || 0;
    updateTime(parseInt(hour12, 10), m, period);
  };

  const togglePeriod = (p: 'AM' | 'PM') => {
    if (p === period) return;
    updateTime(parseInt(hour12, 10), parseInt(minutes, 10), p);
  };

  return (
    <div
      id={id}
      className={cn(
        'flex items-center gap-2 p-1.5 rounded-xl bg-background/60 border border-border/80 focus-within:border-emerald-500/80 transition-all shadow-sm',
        className
      )}
    >
      <Clock className="w-4 h-4 ml-1.5 text-muted-foreground shrink-0" />

      {/* Hour Select (01 - 12) */}
      <select
        value={hour12}
        onChange={handleHourChange}
        className="bg-transparent text-base font-mono font-bold text-foreground focus:outline-none cursor-pointer py-1 px-1 rounded-md hover:bg-muted/40"
        aria-label="Hour"
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
          const val = h.toString().padStart(2, '0');
          return (
            <option key={val} value={val} className="bg-background text-foreground">
              {val}
            </option>
          );
        })}
      </select>

      <span className="font-mono font-bold text-muted-foreground text-sm">:</span>

      {/* Minute Select (00, 05, 10, ..., 55) */}
      <select
        value={minutes}
        onChange={handleMinuteChange}
        className="bg-transparent text-base font-mono font-bold text-foreground focus:outline-none cursor-pointer py-1 px-1 rounded-md hover:bg-muted/40"
        aria-label="Minute"
      >
        {Array.from({ length: 60 }, (_, i) => i).map((m) => {
          const val = m.toString().padStart(2, '0');
          return (
            <option key={val} value={val} className="bg-background text-foreground">
              {val}
            </option>
          );
        })}
      </select>

      {/* Explicit AM / PM Toggle Pills */}
      <div className="flex items-center ml-auto bg-muted/60 p-0.5 rounded-lg border border-border/50 shrink-0">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => togglePeriod('AM')}
          className={cn(
            'h-7 px-2.5 text-xs font-black rounded-md transition-all',
            period === 'AM'
              ? 'bg-amber-500 text-black shadow-sm font-black'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          AM
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => togglePeriod('PM')}
          className={cn(
            'h-7 px-2.5 text-xs font-black rounded-md transition-all',
            period === 'PM'
              ? 'bg-indigo-600 text-white shadow-sm font-black'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          PM
        </Button>
      </div>
    </div>
  );
}
