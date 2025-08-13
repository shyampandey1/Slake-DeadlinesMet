

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
    'bg-blue-800', 'text-blue-100', 'hover:border-blue-500/80',
    'bg-green-800', 'text-green-100', 'hover:border-green-500/80',
    'bg-orange-800', 'text-orange-100', 'hover:border-orange-500/80',
    'bg-indigo-800', 'text-indigo-100', 'hover:border-indigo-500/80',
    'bg-rose-800', 'text-rose-100', 'hover:border-rose-500/80',
    'bg-purple-800', 'text-purple-100', 'hover:border-purple-500/80',
    'bg-sky-800', 'text-sky-100',
    'bg-amber-800', 'text-amber-100',
    'border-red-500/80', 'text-red-400', 'hover:border-red-500/80', 'bg-red-800', 'text-red-100',
    'border-blue-500/80', 'text-blue-400',
    'border-orange-500/80', 'text-orange-400',
    'border-purple-500/80', 'text-purple-400',
    'border-cyan-500/80', 'text-cyan-400', 'hover:border-cyan-500/80', 'bg-cyan-800', 'text-cyan-100',
    'border-amber-500/80', 'text-amber-400', 'hover:border-amber-500/80',
    'border-lime-500/80', 'text-lime-400', 'hover:border-lime-500/80', 'bg-lime-800', 'text-lime-100',
    'border-gray-500/80', 'text-gray-400', 'hover:border-gray-500/80', 'bg-gray-800', 'text-gray-100',
    'border-emerald-500/80', 'text-emerald-400', 'hover:border-emerald-500/80', 'bg-emerald-800', 'text-emerald-100',
    'border-sky-500/80', 'text-sky-400', 'hover:border-sky-500/80',
    'border-indigo-500/80', 'text-indigo-400',
    'border-rose-500/80', 'text-rose-400',
    'border-teal-500/80', 'text-teal-400', 'hover:border-teal-500/80', 'bg-teal-800', 'text-teal-100',
    'border-green-500/80', 'text-green-400',
    'border-fuchsia-500/80', 'text-fuchsia-400', 'hover:border-fuchsia-500/80', 'bg-fuchsia-800', 'text-fuchsia-100',
    'border-yellow-500/80', 'text-yellow-400', 'hover:border-yellow-500/80', 'bg-yellow-800', 'text-yellow-100',
    'border-stone-500/80', 'text-stone-400', 'hover:border-stone-500/80', 'bg-stone-800', 'text-stone-100',
    'border-pink-500/80', 'text-pink-400', 'hover:border-pink-500/80',
    'bg-slate-800', 'border-slate-500/80', 'text-slate-100',
    'hover:bg-rose-800', 'hover:border-rose-500/80', 'hover:text-rose-100',
    'hover:bg-orange-800', 'hover:border-orange-500/80', 'hover:text-orange-100',
    'hover:bg-purple-800', 'hover:border-purple-500/80', 'hover:text-purple-100',
    'hover:bg-blue-800', 'hover:border-blue-500/80', 'hover:text-blue-100',
    'hover:bg-cyan-800', 'hover:border-cyan-500/80', 'hover:text-cyan-100',
    'hover:bg-amber-800', 'hover:border-amber-500/80', 'hover:text-amber-100',
    'hover:bg-lime-800', 'hover:border-lime-500/80', 'hover:text-lime-100',
    'hover:bg-red-800', 'hover:border-red-500/80', 'hover:text-red-100',
    'hover:bg-green-800', 'hover:border-green-500/80', 'hover:text-green-100',
    'hover:bg-stone-800', 'hover:border-stone-500/80', 'hover:text-stone-100',
    'hover:bg-teal-800', 'hover:border-teal-500/80', 'hover:text-teal-100',
    'hover:bg-indigo-800', 'hover:border-indigo-500/80', 'hover:text-indigo-100',
    'hover:bg-fuchsia-800', 'hover:border-fuchsia-500/80', 'hover:text-fuchsia-100',
    'hover:bg-sky-800', 'hover:border-sky-500/80', 'hover:text-sky-100',
    'hover:bg-yellow-800', 'hover:border-yellow-500/80', 'hover:text-yellow-100',
    'hover:bg-gray-800', 'hover:border-gray-500/80', 'hover:text-gray-100',
    'hover:bg-slate-800', 'hover:border-slate-500/80', 'hover:text-slate-100',
    'text-emerald-400', 'bg-emerald-800', 'hover:bg-emerald-800',
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
        sky: { 800: 'hsl(var(--sky-800))'},
        blue: { 800: 'hsl(var(--blue-800))'},
        indigo: { 800: 'hsl(var(--indigo-800))'},
        green: { 800: 'hsl(var(--green-800))'},
        purple: { 800: 'hsl(var(--purple-800))'},
        amber: { 800: 'hsl(var(--amber-800))'},
        orange: { 800: 'hsl(var(--orange-800))'},
        rose: { 800: 'hsl(var(--rose-800))'},
        slate: { 800: 'hsl(var(--slate-800))'},
        cyan: { 800: 'hsl(190 90% 30%)' },
        lime: { 800: 'hsl(80 90% 30%)' },
        red: { 800: 'hsl(0 80% 40%)' },
        teal: { 800: 'hsl(170 80% 30%)' },
        fuchsia: { 800: 'hsl(290 80% 40%)' },
        yellow: { 800: 'hsl(50 80% 40%)' },
        stone: { 800: 'hsl(30 20% 40%)' },
        gray: { 800: 'hsl(210 10% 40%)' },
        emerald: { 800: 'hsl(150 70% 30%)' },
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
