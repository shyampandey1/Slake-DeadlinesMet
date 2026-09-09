
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
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { ScrollArea } from "./ui/scroll-area";
import { useTheme } from "@/hooks/useTheme";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Menu, User, BookText, ClipboardList, Calendar, Settings, Sparkles, Info, LogOut, X, Layers, Zap, StickyNote, Users2, Cloud, Palette, Bug, Sun, PieChart, Trophy, HeartPulse, BrainCircuit, Camera } from 'lucide-react';

const changelog = [
  {
      version: "v1.8",
      date: "Day 9",
      features: [
        { name: "Admin Redemption Alerts", description: "Real-time FCM push & system notifications sent to Shyam Pandey upon reward redemption.", icon: "trophy" },
        { name: "Native App UI Feel", description: "Disabled webpage-style text selection and drag callouts for a clean native app experience.", icon: "palette" },
        { name: "Timer Interface Refinement", description: "Streamlined timer screen interface and optimized control bindings.", icon: "layers" },
      ]
  },
  {
      version: "v1.7",
      date: "Day 8",
      features: [
        { name: "Off-Thread Gaze Control", description: "Hands-free navigation powered by a background Web Worker and BlazeFace camera eye-tracking.", icon: "camera" },
        { name: "Native Tactile Haptics", description: "Physical device vibrations for milestones, final 10s heartbeat, and expiration bursts.", icon: "zap" },
        { name: "Hydration & Breathing Ambient Synth", description: "Draining wave canvas backgrounds and Web Audio API synthesized liquid and meditation chimes.", icon: "brain-circuit" },
      ]
  },
  {
      version: "v1.6",
      date: "Day 7",
      features: [
        { name: "Gaming & Leisure Sync", description: "Daily routines now automatically include specialized 'Entertainment & Gaming' sessions to keep you refreshed throughout the day.", icon: "zap" },
        { name: "Clean Timer Experience", description: "Removed live status distractions from the timer screen to keep your focus sessions minimal and clean.", icon: "layers" },
      ]
  },

  {
      version: "v1.5",
      date: "Day 6",
      features: [
        { name: "Rewards & Gamification", description: "Earn Slake Credits and view your global leaderboard position in the new Achievement Center.", icon: "trophy" },
        { name: "Shareable Certificates", description: "Export high-quality achievement cards for hydration, diet, and productivity streaks directly to your phone.", icon: "palette" },
        { name: "Health & Biometrics", description: "Added BMI tracking and Google Fit bindings inside settings to contextualize your physical data.", icon: "heart-pulse" },
        { name: "Gemini 1.5 Flash Engine", description: "Upgraded our core Genkit AI engine to Gemini 1.5 for faster, smarter weekly insight generation.", icon: "brain-circuit" },
      ]
  },
  {
      version: "v1.4",
      date: "Day 5",
      features: [
        { name: "Expert-Tuned Routines", description: "Completely overhauled all professional routines based on extensive research for maximum effectiveness.", icon: "clipboard-list" },
        { name: "Dashboard Redesign", description: "The Log Book dashboard now features a cleaner side-by-side layout for stats and charts.", icon: "pie-chart" },
        { name: "Brighter Days Ahead", description: "The home page header is now bigger, brighter, and sunnier on clear-weather days.", icon: "sun" },
        { name: "Final Bug Squash", description: "Implemented a definitive fix to permanently eliminate the task duplication bug.", icon: "bug" },
      ]
  },
    {
      version: "v1.3",
      date: "Day 4",
      features: [
        { name: "Modern Header Redesign", description: "The home page header now seamlessly blends with the content for a more modern, stacked appearance.", icon: "layers" },
        { name: "Enhanced Visuals", description: "Increased the visibility and animation speed of the clouds in the header for a more dynamic feel.", icon: "zap" },
        { name: "Core Stability Fix", description: "Resolved a persistent and critical bug that could cause task duplication, ensuring a stable and reliable routine.", icon: "sticky-note" },
      ]
  },
  {
      version: "v1.2",
      date: "Day 3",
      features: [
        { name: "Google Sign-In", description: "Users can now sign in using their Google accounts for a faster and more secure login experience.", icon: "users-2" },
        { name: "Cloud Sync Control", description: "Added a 'Cloud Sync' toggle in settings to give users control over their data synchronization.", icon: "cloud" },
        { name: "Mobile UX Overhaul", description: "Disabled text selection and fixed horizontal scrolling to provide a more native app-like feel on mobile devices.", icon: "palette" },
      ]
  },
  {
      version: "v1.1",
      date: "Day 2",
      features: [
        { name: "Calendar Scheduling", description: "Added an event calendar to schedule tasks for specific days, which sync with the daily routine.", icon: "calendar" },
        { name: "Bug Fixes & Stability", description: "Resolved several Firestore indexing errors and improved guest mode fallback.", icon: "sticky-note" },
      ]
  },
  {
    version: "v1.0",
    date: "Day 1",
    features: [
        { name: "Log Book", description: "Renamed 'History' to 'Log Book' and added task completion time and duration.", icon: "book-text" },
        { name: "AI Routine Generation", description: "Generate personalized task routines based on your profession.", icon: "wand-sparkles" },
        { name: "UI/UX Enhancements", description: "Improved visual feedback for AI generation and added scroll indicators.", icon: "palette" },
    ]
  },
];

const iconMap: { [key: string]: React.ElementType } = {
  "clipboard-list": ClipboardList,
  "pie-chart": PieChart,
  sun: Sun,
  bug: Bug,
  layers: Layers,
  zap: Zap,
  "sticky-note": StickyNote,
  "users-2": Users2,
  cloud: Cloud,
  palette: Palette,
  calendar: Calendar,
  "book-text": BookText,
  "wand-sparkles": Sparkles,
  "trophy": Trophy,
  "heart-pulse": HeartPulse,
  "brain-circuit": BrainCircuit,
  camera: Camera,
};


export default function HamburgerMenu({ white = false }: { white?: boolean }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth');
    } catch (error) {
      console.error("Logout failed:", error);
      router.push('/auth');
    }
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
            <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                    "transition-colors",
                    white 
                        ? "text-white/80 hover:text-white hover:bg-white/10" 
                        : "text-foreground/80 hover:text-foreground hover:bg-accent"
                )}
            >
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
              <Button variant="outline" className="w-full justify-start gap-3 h-auto p-3 hover:border-primary/50 transition-all" onClick={() => navigateTo('/reformers')}>
                <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <User className="h-5 w-5 text-primary" />
                  <span className="text-sm font-bold text-foreground truncate">
                    {user.displayName || "My Profile"}
                  </span>
                </div>
                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-none">REFORMER</Badge>
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
                <Button variant="ghost" onClick={() => navigateTo('/about')} className="w-full justify-start gap-2">
                    <Info className="h-5 w-5" />
                    <span>About</span>
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
                              const IconComponent = iconMap[feature.icon];
                              return (
                                <div key={feature.name} className="flex gap-4 p-3 rounded-lg border bg-card/50">
                                    {IconComponent && <IconComponent className="h-5 w-5 text-primary mt-1" />}
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
