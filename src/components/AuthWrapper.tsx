"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Terminal, ShieldCheck } from "lucide-react";

interface AuthWrapperProps {
  children: ReactNode;
}

const statusMessages = [
  "Synchronizing biometrics...",
  "Loading Slake profiles...",
  "Warming up off-thread gaze engines...",
  "Initializing environments...",
  "System ready. Preparing launch...",
];

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [statusIndex, setStatusIndex] = useState(0);
  const isLoadedRef = useRef(false);

  // Status message rotation
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusMessages.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [loading]);

  // Load and Update notifications
  useEffect(() => {
    if (!loading && user && !isLoadedRef.current) {
      isLoadedRef.current = true;

      // 2. App Updates Notification
      const currentVersion = "v1.9";
      const storedVersion = localStorage.getItem("slake_app_version");
      if (storedVersion !== currentVersion) {
        localStorage.setItem("slake_app_version", currentVersion);
        setTimeout(() => {
          toast({
            title: "Application Upgraded 🎉",
            description: `DeadlinesMet successfully updated to ${currentVersion}! Check "What's New" in the menu.`,
            className: "bg-gradient-to-r from-blue-600 to-indigo-600 border-none text-white font-bold rounded-2xl shadow-2xl",
          });
        }, 1500);
      }
    }
  }, [loading, user, toast]);

  // 3. App Quits / Close tab Notification
  useEffect(() => {
    const handleQuit = () => {
      // Trigger a light tactile vibration failsafe
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate([80, 50, 80]);
      }
      
      // Dispatch background push alert via Service Worker for closure reminder
      if (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification("Session Closed", {
            body: "Keep track of your goals and daily routines. See you soon!",
            icon: "/icon.svg",
            badge: "/icon.svg",
            silent: true,
            tag: "session-quit",
          });
        });
      }
    };

    window.addEventListener("beforeunload", handleQuit);
    return () => window.removeEventListener("beforeunload", handleQuit);
  }, []);

  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center bg-radial from-slate-950 via-slate-900 to-black p-4 overflow-hidden">
        {/* Soft background ambient glows */}
        <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-[80px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-indigo-500/10 blur-[80px] animate-pulse pointer-events-none" style={{ animationDelay: "2s" }} />

        {/* Premium Glassmorphic Card */}
        <div className="relative flex w-full max-w-sm flex-col items-center justify-center rounded-[2.5rem] border border-white/10 bg-slate-950/40 p-8 shadow-2xl shadow-black/40 backdrop-blur-2xl text-center z-10 animate-fade-in">
          
          {/* Glowing Animated Radial Loader Core */}
          <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
            {/* Pulsing Outer Neon Glow Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30 animate-spin" style={{ animationDuration: "12s" }} />
            
            {/* Sliding Breathing Loader Arc */}
            <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-t-primary border-r-primary/40 animate-spin" style={{ animationDuration: "1.5s" }} />

            {/* Glowing Inner Central Emblem */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary/30 to-indigo-500/20 flex items-center justify-center border border-white/5 shadow-inner animate-pulse">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-xl font-black font-headline tracking-wider text-white mb-2 flex items-center gap-1.5 justify-center">
            <Terminal className="h-4.5 w-4.5 text-primary" />
            SLAKE ENGINE
          </h2>

          {/* Dynamic Status message text with fade keyframe */}
          <p className="text-xs uppercase font-bold tracking-[0.2em] text-primary/60 mb-6 min-h-[16px] animate-pulse">
            {statusMessages[statusIndex]}
          </p>

          {/* Bottom Security verification tag */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] text-muted-foreground uppercase tracking-widest">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Secure Initialization
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
