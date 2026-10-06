"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function HardwareBackHandler() {
    const pathname = usePathname();
    const { toast } = useToast();
    const lastPressRef = useRef<number>(0);

    useEffect(() => {
        // Only run if installed as PWA or in standalone mobile mode
        if (typeof window === 'undefined') return;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;
        if (!isStandalone) return;

        // Double-back to exit logic ONLY for the root home page in standalone app
        if (pathname !== '/') {
            return;
        }

        // Trap the initial push for the root page to catch the first back press
        const timer = setTimeout(() => {
            try {
                window.history.pushState({ isHomeTrap: true }, '', window.location.href);
            } catch (e) {
                // Ignore history push errors
            }
        }, 300);

        const handlePopState = (event: PopStateEvent) => {
            const now = Date.now();
            if (now - lastPressRef.current < 2000) {
                window.history.back();
            } else {
                lastPressRef.current = now;
                toast({
                    title: "Exiting DeadlinesMet?",
                    description: "Tap back again to close the app.",
                    duration: 3000,
                });
                try {
                    window.history.pushState({ isHomeTrap: true }, '', window.location.href);
                } catch (e) {
                    // Ignore
                }
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [pathname, toast]);

    return null;
}
