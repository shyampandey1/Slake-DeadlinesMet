
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/history", label: "History", icon: History },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/auth');
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex justify-around items-center z-50">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} legacyBehavior>
          <a
            className={cn(
              "flex flex-col items-center justify-center w-full h-full text-sm",
              pathname === href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-6 w-6 mb-1" />
            <span>{label}</span>
          </a>
        </Link>
      ))}
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="flex flex-col items-center justify-center w-full h-full text-sm text-muted-foreground"
      >
        <LogOut className="h-6 w-6 mb-1" />
        <span>Logout</span>
      </Button>
    </nav>
  );
}
