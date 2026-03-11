'use client';

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const variants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    zIndex: 1
  }),
  center: {
    x: 0,
    opacity: 1,
    zIndex: 2,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 }
    }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    zIndex: 0,
    transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
  }),
};

// Define the logical order of routes for swipe direction
const routeOrder = ['/history', '/', '/routine', '/settings', '/calendar', '/about'];

export default function PageTransitionWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [direction, setDirection] = useState(0);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    const getIndex = (path: string) => {
        // Find exact match first
        const exact = routeOrder.indexOf(path);
        if (exact !== -1) return exact;
        // Fallback to startsWith for nested routes
        return routeOrder.findIndex(route => path.startsWith(route) && route !== '/');
    };

    const prevIndex = getIndex(prevPathname.current);
    const currentIndex = getIndex(pathname);

    if (currentIndex !== prevIndex) {
        setDirection(currentIndex > prevIndex ? -1 : 1);
    }
    prevPathname.current = pathname;
  }, [pathname]);

  return (
    <div className="relative w-full overflow-hidden min-h-screen">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
                key={pathname}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className={cn('w-full min-h-screen bg-background')}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    </div>
  );
}
