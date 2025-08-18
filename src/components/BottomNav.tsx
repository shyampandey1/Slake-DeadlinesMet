
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookText, Home, ClipboardList, Settings, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTimerUI } from "@/hooks/useTimerUI";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/history", label: "Log Book", icon: BookText },
  { href: "/", label: "Home", icon: Home },
  { href: "/routine", label: "Routine", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isUIVisible } = useTimerUI();

  const isTimerPage = pathname === '/timer';

  if (!user) {
    return null;
  }

  return (
    <nav className={cn(
        "fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border shadow-lg transition-transform duration-300",
        isTimerPage && !isUIVisible && "translate-y-full"
    )}>
        <div className="flex justify-around items-center h-16">
            {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;

                return (
                    <Link
                        key={label}
                        href={href}
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
