"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";

export default function ServiceWorkerRegistrar() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const [isVisible, setIsVisible] = useState(true);
  const { requestPermissionAndToken } = useNotifications();

  useEffect(() => {
    // 1. Instantly register Service Worker to handle incoming pushes
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then(() => console.log("Service Worker formally registered."))
        .catch(console.error);
    }

    try {
      if ("Notification" in window) {
        setPermissionState(Notification.permission);
      }
    } catch (e) {
      console.warn("Notifications not supported in this PWA context");
    }

    // 2. Intercept the Android/Chrome completely native install popup mechanism so we can elegantly design our own modal!
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); // Pause the native prompt!
      setDeferredPrompt(e);
      setShowInstall(true); // Spin up our custom shiny button instead!
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  // Auto hide after 8 seconds (longer for better visibility)
  useEffect(() => {
    if (isVisible && (showInstall || (permissionState !== "granted" && permissionState !== "denied"))) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, showInstall, permissionState]);

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
    try {
      const token = await requestPermissionAndToken();
      if ("Notification" in window) {
        setPermissionState(Notification.permission);
      }
      if (token) {
        console.log("We now have permission to push timer URLs via Service Worker and got FCM token!");
      }
    } catch (e) {
      console.warn("Notification request failed in this PWA environment", e);
    }
  };

  // Gracefully hide the entire banner if they've either installed it AND granted/denied permissions
  if (!showInstall && (permissionState === "granted" || permissionState === "denied")) return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 z-[100] mx-4 pointer-events-none flex justify-center">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={(e, { offset, velocity }) => {
              if (Math.abs(offset.x) > 50 || Math.abs(velocity.x) > 500) {
                setIsVisible(false);
              }
            }}
            className="mx-auto flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-white/10 bg-black/90 p-4 shadow-2xl backdrop-blur-xl pointer-events-auto cursor-grab active:cursor-grabbing"
          >

            {/* Install Prompt Panel */}
            {showInstall && (
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="font-headline font-semibold text-white">Install DeadlinesMet</span>
                  <span className="text-xs text-zinc-400">Launch cleanly from your home screen</span>
                </div>
                <Button onClick={handleInstallClick} size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg">
                  <Download className="mr-2 h-4 w-4" /> Install
                </Button>
              </div>
            )}

            {/* Notifications Prompt Panel if ungranted */}
            {permissionState !== "granted" && permissionState !== "denied" && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex flex-col">
                  <span className="font-headline font-semibold text-white">Enable Alerts</span>
                  <span className="text-[10px] text-zinc-500 max-w-[150px] leading-tight mt-1">Receive automated AI suggestions that physically start your timer natively</span>
                </div>
                <Button onClick={attemptToRequestNotifications} size="sm" variant="secondary" className="rounded-full bg-white/10 hover:bg-white/20 text-white">
                  <Bell className="mr-2 h-4 w-4 text-emerald-400" /> Allow
                </Button>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
