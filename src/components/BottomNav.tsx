
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTimerUI } from "@/hooks/useTimerUI";

const navItems = [
  { href: "/history", label: "Log Book", icon: "book-text" },
  { href: "/", label: "Home", icon: "home" },
  { href: "/routine", label: "Routine", icon: "clipboard-list" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

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
            {navItems.map(({ href, label, icon }) => {
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
                        <Icon name={icon} className={cn("h-6 w-6")} />
                        <span className="text-xs">{label}</span>
                    </Link>
                )
            })}
        </div>
    </nav>
  );
}
