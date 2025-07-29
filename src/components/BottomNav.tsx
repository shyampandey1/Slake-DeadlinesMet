
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChartHorizontal, History, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const navItems = [
  { href: "/", label: "Dashboard", icon: BarChartHorizontal },
  { href: "/history", label: "History", icon: History },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) {
    return null;
  }
  
  // A link to start a new timer should go to the homepage where the task form is
  const newTimerHref = "/";

  return (
    <div className="fixed bottom-4 inset-x-0 z-50 flex justify-center">
        <TooltipProvider>
            <nav className="flex items-center gap-2 p-2 rounded-full bg-slate-900 text-white shadow-lg w-auto mx-4">
                {navItems.map(({ href, label, icon: Icon }) => (
                    <Tooltip key={href}>
                        <TooltipTrigger asChild>
                            <Link
                                href={href}
                                className={cn(
                                    "flex items-center justify-center gap-2 rounded-full transition-all duration-300 ease-in-out",
                                    pathname === href
                                    ? "bg-white text-slate-900 font-semibold px-4 py-2"
                                    : "w-10 h-10 hover:bg-white/10"
                                )}
                                >
                                <Icon className={cn("h-5 w-5", 
                                    label === 'Dashboard' && '-rotate-90'
                                )} />
                                {pathname === href && <span className="hidden sm:inline">{label}</span>}
                            </Link>
                        </TooltipTrigger>
                        {pathname !== href && (
                             <TooltipContent>
                                <p>{label}</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                ))}
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Link
                            href={newTimerHref}
                            className={cn(
                                "flex items-center justify-center gap-2 rounded-full transition-all duration-300 ease-in-out w-10 h-10 hover:bg-white/10"
                            )}
                            >
                            <Timer className="h-5 w-5" />
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>New Timer</p>
                    </TooltipContent>
                </Tooltip>
            </nav>
        </TooltipProvider>
    </div>
  );
}
