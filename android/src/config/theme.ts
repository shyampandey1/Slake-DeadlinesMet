export const COLORS = {
  // Always dark for Timer Screen
  timerDark: {
    background: '#020617', // Slate 950
    card: '#090d16',       // Slate 900 custom
    cardBorder: 'rgba(16, 185, 129, 0.25)', // Emerald 500 border
    cardBorderActive: '#10b981',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8', // Slate 400
    textMuted: '#64748b',     // Slate 500
    emerald: '#10b981',
    emeraldGlow: 'rgba(16, 185, 129, 0.15)',
    surfaceMuted: '#1e293b',
  },

  // General App Theme (Dark Mode)
  dark: {
    background: '#020617',
    surface: '#0f172a',
    card: '#1e293b',
    border: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    primary: '#10b981',
    primaryForeground: '#ffffff',
    accent: '#6366f1', // Indigo
    warning: '#f59e0b',
    danger: '#ef4444',
  },

  // General App Theme (Light Mode)
  light: {
    background: '#f8fafc',
    surface: '#ffffff',
    card: '#ffffff',
    border: 'rgba(0, 0, 0, 0.08)',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    primary: '#059669',
    primaryForeground: '#ffffff',
    accent: '#4f46e5',
    warning: '#d97706',
    danger: '#dc2626',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  full: 9999,
};
