'use client';

// 1. Import the 'Variants' type from framer-motion
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode, useRef } from 'react';
import { cn } from '@/lib/utils';

// 2. Apply the 'Variants' type to the constant
const variants: Variants = {
  initial: (direction: number) => ({
    x: direction > 0 ? '100vw' : '-100vw',
    opacity: 0,
    transition: { type: 'tween', ease: 'easeInOut', duration: 0.3 }
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: { type: 'tween', ease: 'easeInOut', duration: 0.3 }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100vw' : '-100vw',
    opacity: 0,
    transition: { type: 'tween', ease: 'easeInOut', duration: 0.3 }
  }),
};

const routeOrder = ['/history', '/', '/routine', '/settings', '/calendar', '/about'];

export default function PageTransitionWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const directionRef = useRef(0);

  const newIndex = routeOrder.findIndex((path) => pathname.startsWith(path));
  
  let oldIndex = 0;
  if(typeof window !== 'undefined'){
    const storedIndex = sessionStorage.getItem('routeIndex');
    oldIndex = storedIndex ? Number(storedIndex) : routeOrder.findIndex(path => path === '/');
  }
  
  if (newIndex !== oldIndex) {
    directionRef.current = newIndex > oldIndex ? 1 : -1;
  }
  
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('routeIndex', String(newIndex));
  }


  return (
    <AnimatePresence initial={false} custom={directionRef.current} mode="wait">
        <motion.div
            key={pathname}
            custom={directionRef.current}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
                'absolute top-0 left-0 w-full'
            )}
        >
            {children}
        </motion.div>
    </AnimatePresence>
  );
}
