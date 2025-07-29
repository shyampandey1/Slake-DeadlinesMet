
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
  const activeTask = false; // Placeholder for when timer is active

  if (!user) {
    return null;
  }
  
  // A new timer is started from the home page, so the timer icon links to home unless a task is active.
  const getTimerHref = () => {
    // In a real scenario, you'd have global state to know if a timer is running
    return activeTask ? "/timer" : "/";
  }


  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border shadow-lg">
        <div className="flex justify-around items-center h-16">
            {navItems.map(({ href, label, icon: Icon }) => {
                const effectiveHref = label === 'Timer' ? getTimerHref() : href;
                const isActive = (pathname === effectiveHref) || (pathname === '/timer' && label === 'Timer') || (pathname === '/' && label === 'Home' && !activeTask);
                
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
