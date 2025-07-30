
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, User, X, BookText, Sun, Moon, ClipboardList, Calendar, Sparkles, WandSparkles, Palette, StickyNote, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { ScrollArea } from "./ui/scroll-area";
import { useTheme } from "@/hooks/useTheme";
import { Badge } from "./ui/badge";

const changelog = [
  {
    version: "v1.0",
    date: "Day 1",
    features: [
        { name: "Log Book", description: "Renamed 'History' to 'Log Book' and added task completion time and duration.", icon: BookText },
        { name: "AI Routine Generation", description: "Generate personalized task routines based on your profession.", icon: WandSparkles },
        { name: "UI/UX Enhancements", description: "Improved visual feedback for AI generation and added scroll indicators.", icon: Palette },
    ]
  },
  {
      version: "v1.1",
      date: "Day 2",
      features: [
        { name: "Calendar Scheduling", description: "Added an event calendar to schedule tasks for specific days, which sync with the daily routine.", icon: Calendar },
        { name: "Bug Fixes & Stability", description: "Resolved several Firestore indexing errors and improved guest mode fallback.", icon: StickyNote },
      ]
  }
];

export default function HamburgerMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/auth');
  };
  
  const navigateTo = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
  }

  const openChangelog = () => {
    setIsMenuOpen(false);
    setIsChangelogOpen(true);
  }

  return (
    <>
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
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
              <Button variant="outline" className="w-full justify-start gap-3 h-auto p-3" onClick={() => navigateTo('/settings')}>
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground truncate">
                  {user.email}
                </span>
              </Button>
            )}
          </div>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
                <Button variant="ghost" onClick={() => navigateTo('/history')} className="w-full justify-start gap-2">
                    <BookText className="h-5 w-5" />
                    <span>Task Log Book</span>
                </Button>
                <Button variant="ghost" onClick={() => navigateTo('/routine')} className="w-full justify-start gap-2">
                    <ClipboardList className="h-5 w-5" />
                    <span>Customize Routine</span>
                </Button>
                <Button variant="ghost" onClick={() => navigateTo('/calendar')} className="w-full justify-start gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>Event Calendar</span>
                </Button>
                <Button variant="ghost" onClick={() => navigateTo('/settings')} className="w-full justify-start gap-2">
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                </Button>
                
                <Button variant="ghost" onClick={openChangelog} className="w-full justify-start gap-2">
                  <Sparkles className="h-5 w-5" />
                  <span>What's New</span>
                </Button>

            </div>
          </ScrollArea>
          <SheetFooter className="mt-auto pt-4">
            <Button onClick={handleLogout} variant="outline" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      <Dialog open={isChangelogOpen} onOpenChange={setIsChangelogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl flex items-center gap-2">
                  <Sparkles className="text-primary"/>
                  What's New
              </DialogTitle>
              <DialogDescription>
                A timeline of all the awesome features we've added to the app.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {changelog.map((entry) => (
                  <div key={entry.version}>
                      <div className="flex items-center gap-3 mb-3">
                          <Badge variant="secondary">{entry.version}</Badge>
                          <p className="text-sm text-muted-foreground">{entry.date}</p>
                      </div>
                      <div className="space-y-3">
                          {entry.features.map(feature => {
                              const Icon = feature.icon;
                              return (
                              <div key={feature.name} className="flex gap-4 p-3 rounded-lg border bg-card/50">
                                  <Icon className="h-5 w-5 text-primary mt-1" />
                                  <div>
                                      <p className="font-semibold">{feature.name}</p>
                                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                                  </div>
                              </div>
                              )
                          })}
                      </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
