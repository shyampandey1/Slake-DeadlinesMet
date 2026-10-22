"use client";

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface NativeTimePickerProps {
  id?: string;
  value: string; // 24-hour "HH:mm", e.g. "06:30" or "13:00"
  onChange: (val24h: string) => void;
  className?: string;
  label?: string;
}

/**
 * Converts 24-hour "HH:mm" to 12-hour formatted display string (e.g. "08:30 AM").
 */
function formatTo12hBadge(time24: string): string {
  if (!time24) return '12:00 AM';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) h = 0;
  const m = parseInt(mStr, 10);
  const validM = isNaN(m) ? 0 : Math.max(0, Math.min(59, m));

  const period = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;

  return `${h12.toString().padStart(2, '0')}:${validM.toString().padStart(2, '0')} ${period}`;
}

export function NativeTimePicker({
  id,
  value,
  onChange,
  className,
}: NativeTimePickerProps) {
  const formatted12h = useMemo(() => formatTo12hBadge(value), [value]);

  return (
    <div
      className={cn(
        'group relative flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-card/90 border border-border/80 hover:border-emerald-500/50 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/40 shadow-sm transition-all',
        className
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <Clock className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 shrink-0 transition-colors" />
        
        {/* Native Mobile & Desktop Clock Picker */}
        <input
          id={id}
          type="time"
          value={value || '08:00'}
          onChange={(e) => {
            if (e.target.value) {
              onChange(e.target.value);
            }
          }}
          onClick={(e) => {
            try {
              (e.target as any).showPicker?.();
            } catch {
              // Browser may not support showPicker programmatically
            }
          }}
          className="w-full bg-transparent text-base sm:text-lg font-mono font-bold text-foreground focus:outline-none cursor-pointer [color-scheme:dark] tracking-wide"
          aria-label={id || "Select time"}
        />
      </div>

      {/* 12-Hour Formatted Badge */}
      <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl shrink-0 select-none pointer-events-none">
        {formatted12h}
      </span>
    </div>
  );
}
