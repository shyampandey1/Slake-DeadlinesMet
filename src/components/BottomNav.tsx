
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/history", label: "History", icon: History },
  { href: "/", label: "Home", icon: Home },
  { href: "/timer", label: "Timer", icon: Timer },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // In a real app, you might get this from a global state
  const isTimerActive = pathname === '/timer';

  if (!user) {
    return null;
  }
  
  // The timer icon links to the active timer page if it's running, otherwise it links to the home page to start a new one.
  const getTimerHref = () => {
    return isTimerActive ? "/timer" : "/";
  }


  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border shadow-lg">
        <div className="flex justify-around items-center h-16">
            {navItems.map(({ href, label, icon: Icon }) => {
                const effectiveHref = label === 'Timer' ? getTimerHref() : href;
                // A link is active if the current path matches its href.
                // Special case for 'Home': it should NOT be active if the timer page is active.
                // Special case for 'Timer': it should BE active if the timer page is active.
                let isActive = pathname === href;
                if (label === 'Home') {
                    isActive = pathname === '/' && !isTimerActive;
                }
                if (label === 'Timer') {
                    isActive = isTimerActive;
                }

                return (
                    <Link
                        key={label}
                        href={effectiveHref}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 text-muted-foreground w-full h-full",
                            isActive && "text-primary"
                        )}
                        >
                        <Icon className={cn("h-6 w-6")} />
                        <span className="text-xs">{label}</span>
                    </Link>
                )
            })}
        </div>
    </nav>
  );
}
