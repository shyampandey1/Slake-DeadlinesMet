
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/history", label: "History", icon: History },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex justify-around items-center z-50">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full text-sm",
            pathname === href
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <Icon className="h-6 w-6 mb-1" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
