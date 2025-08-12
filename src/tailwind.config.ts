

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
    'bg-slate-800', 'text-slate-100', 'dark:text-slate-100', 'text-slate-800', 'bg-slate-100',
    'bg-blue-800', 'text-blue-100', 'dark:text-blue-100', 'text-blue-800', 'bg-blue-100',
    'bg-green-800', 'text-green-100', 'dark:text-green-100', 'text-green-800', 'bg-green-100',
    'bg-orange-800', 'text-orange-100', 'dark:text-orange-100', 'text-orange-800', 'bg-orange-100',
    'bg-indigo-800', 'text-indigo-100', 'dark:text-indigo-100', 'text-indigo-800', 'bg-indigo-100',
    'bg-rose-800', 'text-rose-100', 'dark:text-rose-100', 'text-rose-800', 'bg-rose-100',
    'bg-purple-800', 'text-purple-100', 'dark:text-purple-100', 'text-purple-800', 'bg-purple-100',
    'bg-sky-800', 'text-sky-100', 'dark:text-sky-100', 'text-sky-800', 'bg-sky-100',
    'bg-amber-800', 'text-amber-100', 'dark:text-amber-100', 'text-amber-800', 'bg-amber-100',
    'text-red-800', 'bg-red-100', 'dark:text-red-100',
    'text-cyan-800', 'bg-cyan-100', 'dark:text-cyan-100',
    'text-lime-800', 'bg-lime-100', 'dark:text-lime-100',
    'text-gray-800', 'bg-gray-100', 'dark:text-gray-100',
    'text-teal-800', 'bg-teal-100', 'dark:text-teal-100',
    'text-fuchsia-800', 'bg-fuchsia-100', 'dark:text-fuchsia-100',
    'text-yellow-800', 'bg-yellow-100', 'dark:text-yellow-100',
    'text-stone-800', 'bg-stone-100', 'dark:text-stone-100',
    'hover:bg-rose-100', 'hover:dark:bg-rose-800', 'hover:text-rose-800', 'hover:dark:text-rose-100',
    'hover:bg-orange-100', 'hover:dark:bg-orange-800', 'hover:text-orange-800', 'hover:dark:text-orange-100',
    'hover:bg-purple-100', 'hover:dark:bg-purple-800', 'hover:text-purple-800', 'hover:dark:text-purple-100',
    'hover:bg-blue-100', 'hover:dark:bg-blue-800', 'hover:text-blue-800', 'hover:dark:text-blue-100',
    'hover:bg-cyan-100', 'hover:dark:bg-cyan-800', 'hover:text-cyan-800', 'hover:dark:text-cyan-100',
    'hover:bg-amber-100', 'hover:dark:bg-amber-800', 'hover:text-amber-800', 'hover:dark:text-amber-100',
    'hover:bg-lime-100', 'hover:dark:bg-lime-800', 'hover:text-lime-800', 'hover:dark:text-lime-100',
    'hover:bg-red-100', 'hover:dark:bg-red-800', 'hover:text-red-800', 'hover:dark:text-red-100',
    'hover:bg-green-100', 'hover:dark:bg-green-800', 'hover:text-green-800', 'hover:dark:text-green-100',
    'hover:bg-stone-100', 'hover:dark:bg-stone-800', 'hover:text-stone-800', 'hover:dark:text-stone-100',
    'hover:bg-teal-100', 'hover:dark:bg-teal-800', 'hover:text-teal-800', 'hover:dark:text-teal-100',
    'hover:bg-indigo-100', 'hover:dark:bg-indigo-800', 'hover:text-indigo-800', 'hover:dark:text-indigo-100',
    'hover:bg-fuchsia-100', 'hover:dark:bg-fuchsia-800', 'hover:text-fuchsia-800', 'hover:dark:text-fuchsia-100',
    'hover:bg-sky-100', 'hover:dark:bg-sky-800', 'hover:text-sky-800', 'hover:dark:text-sky-100',
    'hover:bg-yellow-100', 'hover:dark:bg-yellow-800', 'hover:text-yellow-800', 'hover:dark:text-yellow-100',
    'hover:bg-gray-100', 'hover:dark:bg-gray-800', 'hover:text-gray-800', 'hover:dark:text-gray-100',
    'hover:bg-slate-100', 'hover:dark:bg-slate-800', 'hover:text-slate-800', 'hover:dark:text-slate-100',
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
