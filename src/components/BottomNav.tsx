
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const navItems = [
  { href: "/history", label: "History", icon: History },
  { href: "/", label: "Home", icon: Home },
  { href: "/timer", label: "New Timer", icon: Timer },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) {
    return null;
  }
  
  const timerLink = navItems.find(item => item.label === 'New Timer');
  if (timerLink) {
    // A new timer is started from the home page
    timerLink.href = "/";
  }


  return (
    <div className="fixed bottom-4 inset-x-0 z-50 flex justify-center">
        <TooltipProvider>
            <nav className="flex items-center gap-2 p-2 rounded-full bg-slate-900 text-white shadow-lg w-auto mx-4">
                {navItems.map(({ href, label, icon: Icon }) => (
                    <Tooltip key={label}>
                        <TooltipTrigger asChild>
                            <Link
                                href={href}
                                className={cn(
                                    "flex items-center justify-center gap-2 rounded-full transition-all duration-300 ease-in-out",
                                    (pathname === href && label === 'Home') || (pathname === href && label === 'History')
                                    ? "bg-white text-slate-900 font-semibold px-4 py-2"
                                    : "w-10 h-10 hover:bg-white/10"
                                )}
                                >
                                <Icon className={cn("h-5 w-5")} />
                                {(pathname === href && label !== 'New Timer') && <span className="hidden sm:inline">{label}</span>}
                                {label === 'Home' && (pathname === href) && <span className="sm:hidden">{label}</span>}
                                {label === 'Home' && <span className="hidden sm:inline">{label}</span>}


                            </Link>
                        </TooltipTrigger>
                        {pathname !== href && (
                             <TooltipContent>
                                <p>{label}</p>
                            </TooltipContent>
                        )}
                         {(pathname === href && label === 'New Timer') && (
                             <TooltipContent>
                                <p>{label}</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                ))}
            </nav>
        </TooltipProvider>
    </div>
  );
}
