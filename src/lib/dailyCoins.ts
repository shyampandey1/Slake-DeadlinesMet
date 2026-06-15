"use client";

/**
 * Returns a YYYY-MM-DD date string based strictly on local user timezones
 */
export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns the cached amount of daily coins and the corresponding local date
 */
export const getCachedDailyCoins = (): { amount: number; date: string } => {
  if (typeof window === 'undefined') return { amount: 0, date: '' };
  
  const todayStr = getLocalDateString();
  const date = localStorage.getItem('slake_daily_coins_date') || todayStr;
  const amountStr = localStorage.getItem('slake_daily_coins_amount');
  
  // If the date in local storage is old, this indicates midnight has passed
  if (date !== todayStr) {
    localStorage.setItem('slake_daily_coins_date', todayStr);
    localStorage.setItem('slake_daily_coins_amount', '0');
    return { amount: 0, date: todayStr };
  }
  
  const amount = amountStr ? parseInt(amountStr, 10) : 0;
  return { amount, date };
};

/**
 * Sets the cached daily coins amount and notifies listeners via a custom window event
 */
export const setCachedDailyCoins = (amount: number, date: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('slake_daily_coins_amount', String(amount));
  localStorage.setItem('slake_daily_coins_date', date);
  window.dispatchEvent(new Event('slake-daily-coins-updated'));
};
