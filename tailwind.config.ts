import type {Config} from 'tailwindcss';

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
    'border-red-500/80', 'text-red-400', 'hover:border-red-500/80',
    'border-blue-500/80', 'text-blue-400',
    'border-orange-500/80', 'text-orange-400',
    'border-purple-500/80', 'text-purple-400', 'hover:border-purple-500/80',
    'border-cyan-500/80', 'text-cyan-400', 'hover:border-cyan-500/80',
    'border-amber-500/80', 'text-amber-400', 'hover:border-amber-500/80',
    'border-lime-500/80', 'text-lime-400', 'hover:border-lime-500/80',
    'border-gray-500/80', 'text-gray-400', 'hover:border-gray-500/80',
    'border-emerald-500/80', 'text-emerald-400', 'hover:border-emerald-500/80',
    'border-sky-500/80', 'text-sky-400', 'hover:border-sky-500/80',
    'border-indigo-500/80', 'text-indigo-400',
    'border-rose-500/80', 'text-rose-400',
    'border-teal-500/80', 'text-teal-400', 'hover:border-teal-500/80',
    'border-green-500/80', 'text-green-400',
    'border-fuchsia-500/80', 'text-fuchsia-400', 'hover:border-fuchsia-500/80',
    'border-yellow-500/80', 'text-yellow-400', 'hover:border-yellow-500/80',
    'border-stone-500/80', 'text-stone-400', 'hover:border-stone-500/80',
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
            '50%': { backgroundColor: 'hsl(var(--primary) / 0.5)' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'flash-continuous': 'flash 0.5s ease-in-out infinite',
        'flash-three-times': 'flash 0.5s ease-in-out 3',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('tailwind-scrollbar-hide')],
} satisfies Config;
