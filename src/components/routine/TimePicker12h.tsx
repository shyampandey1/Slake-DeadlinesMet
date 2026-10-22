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

  // Generate 5-minute increments, ensuring current minute is included
  const minuteOptions = useMemo(() => {
    const standard = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    const currentM = parseInt(minutes, 10);
    const set = new Set(standard);
    if (!isNaN(currentM)) set.add(currentM);
    return Array.from(set).sort((a, b) => a - b).map((m) => m.toString().padStart(2, '0'));
  }, [minutes]);

  return (
    <div
      id={id}
      className={cn(
        'flex items-center gap-2 p-2 rounded-2xl bg-card/90 border border-border/80 focus-within:border-emerald-500/80 transition-all shadow-sm',
        className
      )}
    >
      <div className="flex items-center gap-1 pl-1">
        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>

      {/* Hour Select (01 - 12) */}
      <div className="relative">
        <select
          value={hour12}
          onChange={handleHourChange}
          className="appearance-none bg-muted/40 hover:bg-muted/70 text-base sm:text-lg font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50 cursor-pointer py-1.5 px-3 rounded-xl min-w-[52px] text-center"
          aria-label="Hour"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
            const val = h.toString().padStart(2, '0');
            return (
              <option key={val} value={val} className="bg-background text-foreground text-base">
                {val}
              </option>
            );
          })}
        </select>
      </div>

      <span className="font-mono font-extrabold text-muted-foreground text-base">:</span>

      {/* Minute Select */}
      <div className="relative">
        <select
          value={minutes}
          onChange={handleMinuteChange}
          className="appearance-none bg-muted/40 hover:bg-muted/70 text-base sm:text-lg font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50 cursor-pointer py-1.5 px-3 rounded-xl min-w-[52px] text-center"
          aria-label="Minute"
        >
          {minuteOptions.map((val) => (
            <option key={val} value={val} className="bg-background text-foreground text-base">
              {val}
            </option>
          ))}
        </select>
      </div>

      {/* Explicit AM / PM Toggle Pills */}
      <div className="flex items-center ml-auto bg-muted/70 p-1 rounded-xl border border-border/60 shrink-0 gap-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => togglePeriod('AM')}
          className={cn(
            'h-9 px-3.5 text-xs font-black rounded-lg transition-all',
            period === 'AM'
              ? 'bg-amber-500 text-black shadow-md font-black hover:bg-amber-400'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
            'h-9 px-3.5 text-xs font-black rounded-lg transition-all',
            period === 'PM'
              ? 'bg-indigo-600 text-white shadow-md font-black hover:bg-indigo-500'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          PM
        </Button>
      </div>
    </div>
  );
}
