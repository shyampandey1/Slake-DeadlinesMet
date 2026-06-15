import type {Config} from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'bg-slate-800', 'text-slate-100',
    'bg-blue-800', 'text-blue-100', 'hover:border-blue-500/80',
    'bg-green-800', 'text-green-100', 'hover:border-green-500/80',
    'bg-orange-800', 'text-orange-100', 'hover:border-orange-500/80',
    'bg-indigo-800', 'text-indigo-100', 'hover:border-indigo-500/80',
    'bg-rose-800', 'text-rose-100', 'hover:border-rose-500/80',
    'bg-purple-800', 'text-purple-100', 'hover:border-purple-500/80',
    'bg-sky-800', 'text-sky-100', 'bg-sky-900',
    'bg-amber-800', 'text-amber-100', 'bg-amber-900',
    'bg-emerald-800', 'text-emerald-100', 'bg-emerald-900',
    'bg-teal-800', 'text-teal-100', 'bg-teal-900',
    'bg-rose-800', 'text-rose-100', 'bg-rose-900',
    'bg-pink-800', 'text-pink-100', 'bg-pink-900',
    'bg-cyan-800', 'text-cyan-100', 'bg-cyan-900',
    'bg-fuchsia-800', 'text-fuchsia-100', 'bg-fuchsia-900',
    'bg-violet-800', 'text-violet-100', 'bg-violet-900',
    'bg-blue-800', 'bg-blue-900',
    'bg-indigo-800', 'bg-indigo-900',
    'bg-purple-800', 'bg-purple-900',
    'bg-slate-800', 'bg-slate-900',
    'text-white',
  ],
  theme: {
    extend: {
      transitionDuration: {
        '3000': '3000ms',
      },
      fontFamily: {
        body: ['var(--font-nunito)', 'sans-serif'],
        headline: ['var(--font-space-grotesk)', 'sans-serif'],
        code: ['var(--font-orbitron)', 'monospace'],
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
            '0%, 100%': { opacity: '0.15' },
            '50%': { opacity: '0.95' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'flash-continuous': 'flash 2s ease-in-out infinite',
        'flash-breathing': 'flash 3s ease-in-out infinite',
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