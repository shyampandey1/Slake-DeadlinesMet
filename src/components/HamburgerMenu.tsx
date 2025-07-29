
"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, User, X, History, Sun, Moon, ClipboardList } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { ScrollArea } from "./ui/scroll-area";
import { useTheme } from "@/hooks/useTheme";
import { Separator } from "./ui/separator";

export default function HamburgerMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/auth');
  };
  
  const navigateToHistory = () => {
    router.push('/history');
  }
  
  const navigateToRoutine = () => {
    router.push('/routine');
  }

  return (
      <Sheet>
        <SheetTrigger asChild>
            <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
            </Button>
        </SheetTrigger>
        <SheetContent side="right" className="flex flex-col">
          <SheetHeader className="flex flex-row justify-between items-center">
            <SheetTitle className="font-headline text-2xl">Menu</SheetTitle>
            <SheetClose asChild>
                <Button variant="ghost" size="icon">
                    <X className="h-6 w-6" />
                </Button>
            </SheetClose>
          </SheetHeader>
          <div className="py-4">
            {user && (
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3 mb-4">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground truncate">
                  {user.email}
                </span>
              </div>
            )}
          </div>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
                <Button variant="ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full justify-start gap-2">
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    <span>Toggle Theme</span>
                </Button>
                <SheetClose asChild>
                  <Button variant="ghost" onClick={navigateToHistory} className="w-full justify-start gap-2">
                      <History className="h-5 w-5" />
                      <span>Task History</span>
                  </Button>
                </SheetClose>
                 <SheetClose asChild>
                  <Button variant="ghost" onClick={navigateToRoutine} className="w-full justify-start gap-2">
                      <ClipboardList className="h-5 w-5" />
                      <span>Customize Routine</span>
                  </Button>
                </SheetClose>

            </div>
          </ScrollArea>
          <SheetFooter className="mt-auto pt-4">
            <SheetClose asChild>
                <Button onClick={handleLogout} variant="outline" className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
                </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
  );
}
