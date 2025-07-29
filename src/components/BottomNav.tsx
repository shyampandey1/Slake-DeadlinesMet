
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/history", label: "History", icon: History },
  { href: "/", label: "Home", icon: Home },
  { href: "/routine", label: "Routine", icon: ClipboardList },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }
  
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border shadow-lg">
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
