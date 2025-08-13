

import type {Config} from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'bg-slate-800', 'text-slate-100',
    'bg-blue-800', 'text-blue-100',
    'bg-green-800', 'text-green-100',
    'bg-orange-800', 'text-orange-100',
    'bg-indigo-800', 'text-indigo-100',
    'bg-rose-800', 'text-rose-100',
    'bg-purple-800', 'text-purple-100',
    'bg-sky-800', 'text-sky-100',
    'bg-amber-800', 'text-amber-100',
    'bg-red-800', 'text-red-100',
    'bg-cyan-800', 'text-cyan-100',
    'bg-lime-800', 'text-lime-100',
    'bg-gray-800', 'text-gray-100',
    'bg-teal-800', 'text-teal-100',
    'bg-fuchsia-800', 'text-fuchsia-100',
    'bg-yellow-800', 'text-yellow-100',
    'bg-stone-800', 'text-stone-100',
    'hover:bg-rose-800',
    'hover:bg-orange-800',
    'hover:bg-purple-800',
    'hover:bg-blue-800',
    'hover:bg-cyan-800',
    'hover:bg-amber-800',
    'hover:bg-lime-800',
    'hover:bg-red-800',
    'hover:bg-green-800',
    'hover:bg-stone-800',
    'hover:bg-teal-800',
    'hover:bg-indigo-800',
    'hover:bg-fuchsia-800',
    'hover:bg-sky-800',
    'hover:bg-yellow-800',
    'hover:bg-gray-800',
    'hover:bg-slate-800',
    'hover:text-white', 'dark:hover:text-white',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Nunito', 'sans-serif'],
        headline: ['Space Grotesk', 'sans-serif'],
        code: ['Orbitron', 'monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        sky: { 100: 'hsl(197 89% 90%)', 800: 'hsl(var(--sky-800))'},
        blue: { 100: 'hsl(221 83% 90%)', 800: 'hsl(var(--blue-800))'},
        indigo: { 100: 'hsl(243 83% 90%)', 800: 'hsl(var(--indigo-800))'},
        green: { 100: 'hsl(142 76% 90%)', 800: 'hsl(var(--green-800))'},
        purple: { 100: 'hsl(269 84% 90%)', 800: 'hsl(var(--purple-800))'},
        amber: { 100: 'hsl(38 92% 90%)', 800: 'hsl(var(--amber-800))'},
        orange: { 100: 'hsl(25 95% 90%)', 800: 'hsl(var(--orange-800))'},
        rose: { 100: 'hsl(347 87% 90%)', 800: 'hsl(var(--rose-800))'},
        slate: { 100: 'hsl(222 47% 90%)', 800: 'hsl(var(--slate-800))'},
        cyan: { 100: 'hsl(190 90% 90%)', 800: 'hsl(190 90% 30%)' },
        lime: { 100: 'hsl(80 90% 90%)', 800: 'hsl(80 90% 30%)' },
        red: { 100: 'hsl(0 80% 90%)', 800: 'hsl(0 80% 40%)' },
        teal: { 100: 'hsl(170 80% 90%)', 800: 'hsl(170 80% 30%)' },
        fuchsia: { 100: 'hsl(290 80% 90%)', 800: 'hsl(290 80% 40%)' },
        yellow: { 100: 'hsl(50 80% 90%)', 800: 'hsl(50 80% 40%)' },
        stone: { 100: 'hsl(30 20% 90%)', 800: 'hsl(30 20% 40%)' },
        gray: { 100: 'hsl(210 10% 90%)', 800: 'hsl(210 10% 40%)' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        flash: {
            '0%, 100%': { backgroundColor: 'var(--timer-background-color)' },
            '50%': { backgroundColor: 'var(--flash-color)' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'flash-continuous': 'flash 0.5s ease-in-out infinite',
        'flash-breathing': 'flash 2s ease-in-out infinite',
        'flash-three-times': 'flash 1s ease-in-out 3',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'), 
    require('tailwind-scrollbar-hide'),
    plugin(function({ addVariant }) {
        addVariant('before', '&::before');
        addVariant('after', '&::after');
    })
  ],
} satisfies Config;
