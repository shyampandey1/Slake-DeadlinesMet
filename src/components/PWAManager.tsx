"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Bell } from "lucide-react";

export default function PWAManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");

  useEffect(() => {
    // 1. Instantly register Service Worker to handle incoming pushes
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then(() => console.log("Service Worker formally registered."))
        .catch(console.error);
    }

    if ("Notification" in window) {
      setPermissionState(Notification.permission);
    }

    // 2. Intercept the Android/Chrome completely native install popup mechanism so we can elegantly design our own modal!
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); // Pause the native prompt!
      setDeferredPrompt(e);
      setShowInstall(true); // Spin up our custom shiny button instead!
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    // Once they hit install, gracefully hide the button
    if (outcome === "accepted") {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  };

  const attemptToRequestNotifications = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      if (permission === "granted") {
        console.log("We now have permission to push timer URLs via Service Worker!");
      }
    }
  };

  if (!showInstall && (permissionState === "granted" || permissionState === "denied")) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[100] mx-4 pointer-events-none">
      <div className="mx-auto flex max-w-sm flex-col gap-3 rounded-2xl border border-white/10 bg-black/80 p-4 shadow-2xl backdrop-blur-xl pointer-events-auto">
        
        {/* Install Prompt Panel */}
        {showInstall && (
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex flex-col">
              <span className="font-headline font-semibold text-white">Install DeadlinesMet</span>
              <span className="text-xs text-zinc-400">Launch cleanly from your home screen</span>
            </div>
            <Button onClick={handleInstallClick} size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-white font-semibold">
              <Download className="mr-2 h-4 w-4" /> Install
            </Button>
          </div>
        )}

        {/* Notifications Prompt Panel if ungranted */}
        {permissionState !== "granted" && (
           <div className="flex items-center justify-between pt-1">
             <div className="flex flex-col">
               <span className="font-headline font-semibold text-white">Enable Alerts</span>
               <span className="text-[10px] text-zinc-500 max-w-[150px] leading-tight mt-1">Receive automated AI suggestions that start your timer natively</span>
             </div>
             <Button onClick={attemptToRequestNotifications} size="sm" variant="secondary" className="rounded-full bg-white/10 hover:bg-white/20 text-white">
               <Bell className="mr-2 h-4 w-4" /> Allowed
             </Button>
           </div>
        )}

      </div>
    </div>
  );
}
