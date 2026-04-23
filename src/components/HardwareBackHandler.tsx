
"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function HardwareBackHandler() {
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();
    const lastPressRef = useRef<number>(0);

    useEffect(() => {
        // Double-back to exit logic ONLY for the root home page
        if (pathname !== '/') {
            return;
        }

        // Trap the initial push for the root page to catch the first back press
        // We use a slight timeout to ensure it doesn't fire during navigation
        const timer = setTimeout(() => {
            window.history.pushState(null, '', window.location.href);
        }, 100);

        const handlePopState = (event: PopStateEvent) => {
            const now = Date.now();
            if (now - lastPressRef.current < 2000) {
                // Secondary check: Are they really trying to exit?
                // In a PWA standalone mode, this will properly exit to the launcher.
                window.history.back();
            } else {
                lastPressRef.current = now;
                toast({
                    title: "Exiting DeadlinesMet?",
                    description: "Tap back again to close the app.",
                    duration: 3000,
                });
                // Re-push state so we can trap the NEXT back button as well!
                window.history.pushState(null, '', window.location.href);
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
