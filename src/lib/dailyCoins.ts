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
  return { amount: isNaN(amount) ? 0 : amount, date };
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

export const DAILY_COIN_CAP = 5000;

/**
 * Calculates task-based DM Coin rewards based on task type, category, duration,
 * full-session completion bonus, and active streak. Guarantees a non-zero reward
 * for every legitimately completed task.
 */
export const calculateTaskCoins = (params: {
  taskName: string;
  category?: string;
  actualDurationMinutes: number;
  initialDurationMinutes: number;
  streakDays?: number;
}): number => {
  const {
    taskName,
    category = 'Productivity',
    actualDurationMinutes,
    initialDurationMinutes,
    streakDays = 0,
  } = params;

  const nameLower = (taskName || '').toLowerCase();
  const catLower = (category || '').toLowerCase();

  // 1. Task-specific & Category-based base reward
  let baseReward = 25;

  if (
    /\([movers]\)/i.test(taskName) ||
    catLower.includes('protocol') ||
    catLower.includes('primer') ||
    catLower.includes('restorer')
  ) {
    // MOVERS Protocol core habits
    baseReward = 50;
  } else if (
    nameLower.includes('water') ||
    nameLower.includes('hydrat') ||
    nameLower.includes('rehydrat') ||
    catLower === 'hydration'
  ) {
    // Hydration micro-habit
    baseReward = 30;
  } else if (
    nameLower.includes('eye') ||
    nameLower.includes('20-20-20') ||
    nameLower.includes('visual rest')
  ) {
    // Eye strain relief & ocular health
    baseReward = 35;
  } else if (
    nameLower.includes('breath') ||
    nameLower.includes('oxygen') ||
    nameLower.includes('meditat') ||
    nameLower.includes('mindful') ||
    nameLower.includes('journal') ||
    nameLower.includes('scrib') ||
    catLower === 'meditation'
  ) {
    // Mindfulness, oxygenation & journaling
    baseReward = 40;
  } else if (
    nameLower.includes('workout') ||
    nameLower.includes('exercise') ||
    nameLower.includes('warm-up') ||
    nameLower.includes('stretch') ||
    nameLower.includes('gym') ||
    catLower === 'fitness'
  ) {
    // Physical fitness & movement
    baseReward = 45;
  } else if (
    catLower === 'productivity' ||
    catLower === 'creativity' ||
    nameLower.includes('deep') ||
    nameLower.includes('coding') ||
    nameLower.includes('sprint') ||
    nameLower.includes('strategy') ||
    nameLower.includes('study')
  ) {
    // Deep work & cognitive execution
    baseReward = 40;
  } else if (catLower === 'hygiene') {
    baseReward = 25;
  }

  // 2. Duration-based focus reward (10 DM Coins per minute)
  const effectiveMinutes = Math.max(1, Math.round(actualDurationMinutes));
  const durationReward = effectiveMinutes * 10;

  // 3. Full-completion mastery bonus (+15 DM Coins when completing >= 80% of target duration)
  const completionRatio =
    initialDurationMinutes > 0 ? effectiveMinutes / initialDurationMinutes : 1;
  const fullCompletionBonus = completionRatio >= 0.8 ? 15 : 5;

  // 4. Active Streak multiplier bonus (+5 per streak day, up to +50)
  const streakBonus = Math.min(50, Math.max(0, streakDays) * 5);

  const rawTotal = baseReward + durationReward + fullCompletionBonus + streakBonus;

  // Apply daily cap while ALWAYS guaranteeing at least 25 DM Coins for any completed task
  try {
    const { amount: cachedToday } = getCachedDailyCoins();
    const remainingAllowance = Math.max(0, DAILY_COIN_CAP - cachedToday);
    if (remainingAllowance <= 0) {
      return 25; // Minimum completion reward so user never sees +0 DM Coins
    }
    return Math.max(25, Math.min(rawTotal, remainingAllowance));
  } catch {
    return Math.max(25, rawTotal);
  }
};

