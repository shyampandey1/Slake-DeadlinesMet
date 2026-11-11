"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function ServiceWorkerRegistrar() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const [isVisible, setIsVisible] = useState(true);
  const { user } = useAuth();
  const { requestPermissionAndToken, forceSyncToken } = useNotifications();
  const { toast } = useToast();

  useEffect(() => {
    // 1. Register Unified Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch(console.error);
    }

    try {
      if ("Notification" in window) {
        setPermissionState(Notification.permission);
      }
      if (sessionStorage.getItem("slake_sw_banner_dismissed") === "true") {
        setIsVisible(false);
      }
    } catch {
      console.warn("Notifications not supported in this PWA context");
    }

    // 2. Capture native install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  // Sync FCM token once user finishes logging in if permission is already granted
  useEffect(() => {
    if (!user || "isMockUser" in user) return;
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionState(Notification.permission);
      if (Notification.permission === "granted") {
        forceSyncToken().catch(() => {});
      }
    }
  }, [user, forceSyncToken]);

  const dismissBanner = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem("slake_sw_banner_dismissed", "true");
    } catch {}
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  };

  const attemptToRequestNotifications = async () => {
    try {
      await requestPermissionAndToken();
      if ("Notification" in window) {
        setPermissionState(Notification.permission);
      }
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        const res = await forceSyncToken();
        if (res?.token) {
          toast({
            title: "Background Alerts Enabled!",
            description: "You'll receive reminders for scheduled tasks even when the app is closed.",
          });
        } else {
          toast({
            title: "Alerts Partially Enabled",
            description:
              res?.userFriendlyError ||
              "We couldn't connect this device for closed-app reminders yet. Try opening Settings to refresh.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Notifications Not Enabled",
          description: "Allow notifications in your browser settings to receive closed-app alerts.",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.warn("Notification request failed in this PWA environment", e);
    }
  };

  const needsNotificationPrompt =
    Boolean(user) && permissionState !== "granted" && permissionState !== "denied";

  if (!showInstall && !needsNotificationPrompt) return null;

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
                dismissBanner();
              }
            }}
            className="relative mx-auto flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-white/10 bg-black/90 p-4 pr-8 shadow-2xl backdrop-blur-xl pointer-events-auto cursor-grab active:cursor-grabbing"
          >
            <button
              type="button"
              onClick={dismissBanner}
              aria-label="Dismiss notification prompt"
              className="absolute right-2.5 top-2.5 rounded-full p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Install Prompt Panel */}
            {showInstall && (
              <div className="flex items-center justify-between pb-2 border-b border-white/5 gap-2">
                <div className="flex flex-col">
                  <span className="font-headline font-semibold text-white">Install DeadlinesMet</span>
                  <span className="text-xs text-zinc-400">Launch cleanly from your home screen</span>
                </div>
                <Button onClick={handleInstallClick} size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shrink-0">
                  <Download className="mr-2 h-4 w-4" /> Install
                </Button>
              </div>
            )}

            {/* Notifications Prompt Panel if ungranted */}
            {needsNotificationPrompt && (
              <div className="flex items-center justify-between pt-1 gap-2">
                <div className="flex flex-col">
                  <span className="font-headline font-semibold text-white text-sm">Enable Task & Routine Alerts</span>
                  <span className="text-[11px] text-zinc-400 leading-tight mt-1">
                    Get reminders to launch your scheduled tasks even when the app is closed.
                  </span>
                </div>
                <Button onClick={attemptToRequestNotifications} size="sm" variant="secondary" className="rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm shrink-0">
                  <Bell className="mr-1.5 h-4 w-4 text-emerald-400" /> Enable
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
