"use client";

import { useEffect, useState } from "react";
import { Bell, Sparkles, Gift, ShieldAlert, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getLocalDateString, getCachedDailyCoins } from "@/lib/dailyCoins";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function NotificationBell() {
    const { profileData } = useProfile();
    const { user } = useAuth();

    const [dailyCoins, setDailyCoins] = useState(0);
    const [hasNewEarnings, setHasNewEarnings] = useState(false);
    const [shake, setShake] = useState(false);
    const [adminNotifications, setAdminNotifications] = useState<any[]>([]);

    const isAdmin = profileData?.displayName?.toLowerCase().includes("shyam pandey") ||
                    profileData?.email?.toLowerCase() === "shyamp028@gmail.com" ||
                    user?.email?.toLowerCase() === "shyamp028@gmail.com" ||
                    profileData?.isReformersAdmin;

    useEffect(() => {
        const updateCoins = () => {
            const todayStr = getLocalDateString();
            const { amount, date } = getCachedDailyCoins();
            if (date === todayStr) {
                setDailyCoins(amount);
                if (amount > 0) {
                    setHasNewEarnings(true);
                    setShake(true);
                    const t = setTimeout(() => setShake(false), 1000);
                    return () => clearTimeout(t);
                }
            } else {
                setDailyCoins(0);
                setHasNewEarnings(false);
            }
        };

        updateCoins();

        // Listen for optimistic updates and snapshot events in real-time
        window.addEventListener('slake-daily-coins-updated', updateCoins);
        
        // Setup clock sync to ensure automatic midnight resets
        const interval = setInterval(updateCoins, 30000); // Check every 30 seconds

        return () => {
            window.removeEventListener('slake-daily-coins-updated', updateCoins);
            clearInterval(interval);
        };
    }, []);

    // Listen for admin redemption notifications if logged in as Shyam Pandey / Admin
    useEffect(() => {
        if (!isAdmin) return;

        try {
            const q = query(collection(db, "admin_notifications"), orderBy("timestamp", "desc"), limit(10));
            const unsub = onSnapshot(q, (snapshot) => {
                const notifications: any[] = [];
                let unreadCount = 0;
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    if (!data.read) unreadCount++;
                    notifications.push({ id: doc.id, ...data });
                });
                setAdminNotifications(notifications);
                if (unreadCount > 0) {
                    setShake(true);
                    const t = setTimeout(() => setShake(false), 1200);
                    return () => clearTimeout(t);
                }
            }, (err) => {
                console.error("Error subscribing to admin_notifications:", err);
            });

            return () => unsub();
        } catch (e) {
            console.error("Failed to setup admin notification listener:", e);
        }
    }, [isAdmin]);

    const markNotificationAsRead = async (notifId: string) => {
        try {
            await updateDoc(doc(db, "admin_notifications", notifId), { read: true });
        } catch (e) {
            console.error("Failed to mark notification as read:", e);
        }
    };

    const hasUnreadAdmin = adminNotifications.some(n => !n.read);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    className={`relative p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer flex items-center justify-center backdrop-blur-md outline-none ${shake ? 'animate-bell-shake' : ''} hover:scale-105 active:scale-95`}
                >
                    <Bell className="w-5 h-5 text-white" />
                    {(hasNewEarnings || hasUnreadAdmin) && (
                        <span className={`absolute top-1 right-1 w-2.5 h-2.5 ${hasUnreadAdmin ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'} rounded-full border border-slate-900 animate-pulse`} />
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-88 p-4 bg-slate-950/95 border border-white/10 text-white rounded-2xl shadow-2xl backdrop-blur-xl z-50 max-h-[85vh] overflow-y-auto no-scrollbar">
                <div className="space-y-4">
                    {/* Admin Alerts Section if Shyam Pandey */}
                    {isAdmin && adminNotifications.length > 0 && (
                        <div className="space-y-2 border-b border-white/10 pb-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-xs tracking-tight flex items-center gap-1.5 font-headline text-red-400 uppercase">
                                    <ShieldAlert className="w-4 h-4 text-red-400" />
                                    Admin Alerts (Redemptions)
                                </h4>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500/20 text-red-300 rounded-full border border-red-500/30">
                                    {adminNotifications.filter(n => !n.read).length} Unread
                                </span>
                            </div>

                            <div className="space-y-2 pt-1">
                                {adminNotifications.slice(0, 5).map((n) => (
                                    <div key={n.id} className={`p-2.5 rounded-xl border text-xs space-y-1 transition-all ${n.read ? 'bg-white/5 border-white/5 opacity-75' : 'bg-red-500/10 border-red-500/30'}`}>
                                        <div className="flex items-center justify-between font-bold text-white">
                                            <span className="flex items-center gap-1.5 text-amber-300">
                                                <Gift className="w-3.5 h-3.5" />
                                                {n.rewardName}
                                            </span>
                                            {!n.read && (
                                                <button onClick={() => markNotificationAsRead(n.id)} className="text-[10px] text-gray-400 hover:text-emerald-400 flex items-center gap-1">
                                                    <Check className="w-3 h-3" /> Mark read
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-gray-300 text-[11px] leading-snug">
                                            <span className="font-semibold text-white">{n.userName}</span> ({n.userEmail || 'No email'}) redeemed <span className="text-amber-400 font-bold">{n.creditsRedeemed?.toLocaleString() || n.credits?.toLocaleString()} Coins</span>.
                                        </p>
                                        {n.upiId && (
                                            <div className="bg-black/30 p-1.5 rounded text-[10px] font-mono text-emerald-400 border border-emerald-500/20 flex justify-between">
                                                <span>UPI ID: {n.upiId}</span>
                                                <span className="text-gray-400 uppercase">{n.status || 'Pending'}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <h4 className="font-bold text-sm tracking-tight flex items-center gap-1.5 font-headline">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            Daily Rewards
                        </h4>
                        {dailyCoins > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                                Active Today
                            </span>
                        )}
                    </div>

                    <div className="py-1">
                        {dailyCoins > 0 ? (
                            <div className="flex items-start gap-3 bg-white/5 border border-white/5 p-3 rounded-xl">
                                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 text-lg">
                                    🪙
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold leading-relaxed text-white">
                                        Great job! You've earned {dailyCoins} Slake Coins today.
                                    </p>
                                    <p className="text-[11px] text-white/50">
                                        Keep completing tasks to secure more discipline coins!
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-white/60 space-y-2">
                                <p className="text-sm font-medium">No rewards earned today yet.</p>
                                <p className="text-xs text-white/45">
                                    Conquer deep focus, hydration, fitness, or meditation blocks to secure Slake Coins.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
            <style jsx global>{`
                @keyframes bell-shake {
                    0%, 100% { transform: rotate(0deg); }
                    15% { transform: rotate(10deg); }
                    30% { transform: rotate(-10deg); }
                    45% { transform: rotate(5deg); }
                    60% { transform: rotate(-5deg); }
                    75% { transform: rotate(2deg); }
                    90% { transform: rotate(-2deg); }
                }
                .animate-bell-shake {
                    animation: bell-shake 0.8s ease-in-out;
                }
            `}</style>
        </Popover>
    );
}
