"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Users, Globe2, ShieldCheck, MapPin, Activity, CheckCircle2, MessageSquare, LayoutDashboard, Lock, Unlock, Phone, Linkedin, Instagram, LockKeyhole, ArrowLeft, Send, Edit, Save, Camera, TrendingUp, Share2, Copy, Zap, Gift, LogOut, Utensils, Gamepad2, Loader2, ArrowRight, BrainCircuit, Wind, Dumbbell, BookOpen, PenSquare, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useWeather } from "@/hooks/useWeather";

import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, getDocs, limit, DocumentData, updateDoc, doc, setDoc, writeBatch } from "firebase/firestore";
import type { UserProfile } from "@/types";
import { useTasks } from "@/hooks/useFirestore";
import { useActiveTimer } from "@/hooks/useActiveTimer";

function ReformersOnboarding({ onEnroll, enrolling }: { onEnroll: () => void, enrolling: boolean }) {
    const movers = [
        { key: 'M', title: 'Meditation', icon: BrainCircuit, color: 'text-purple-400', bg: 'bg-purple-500/10', desc: 'Center your mind before the day begins.' },
        { key: 'O', title: 'Oxygenation', icon: Wind, color: 'text-blue-400', bg: 'bg-blue-500/10', desc: 'Power your cells with deep focused breathing.' },
        { key: 'V', title: 'Visualization', icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10', desc: 'Manifest your goals with mental clarity.' },
        { key: 'E', title: 'Exercise', icon: Dumbbell, color: 'text-emerald-400', bg: 'bg-emerald-500/10', desc: 'Ignite your metabolism and physical strength.' },
        { key: 'R', title: 'Reading Positive', icon: BookOpen, color: 'text-sky-400', bg: 'bg-sky-500/10', desc: 'Feed your consciousness with wisdom.' },
        { key: 'S', title: 'Scribing', icon: PenSquare, color: 'text-rose-400', bg: 'bg-rose-500/10', desc: 'Journal your intent and track progress.' }
    ];

    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Staggered Children Pattern Logic
    const fadeInVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" } as any
        })
    };

    return (
        <div ref={containerRef} className="min-h-screen bg-background text-foreground font-sans selection:bg-emerald-500/30">
            {/* Hero Section */}
            <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden p-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 z-0"
                >
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 space-y-6"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold tracking-widest uppercase mb-4">
                        <Zap className="w-4 h-4" /> The Elite Network
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 leading-none">
                        REFORMERS <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">LEAGUE</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-medium">
                        Join the top 1% of producers aligning their biology with their ambitions.
                    </p>
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="pt-12 opacity-40"
                    >
                        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center p-1">
                            <div className="w-1 h-2 bg-white rounded-full" />
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section className="max-w-6xl mx-auto px-6 py-24 space-y-32">
                {/* Benefit 1 */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid md:grid-cols-2 gap-12 items-center"
                >
                    <div className="space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                            <Activity className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h2 className="text-4xl font-bold">Healthy Routine Tracking</h2>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Stay accountable with automated habit loops. Our engine monitors your hydration, eye health,
                            and task completion in real-time, enforcing a state of peak productivity.
                        </p>
                        <ul className="space-y-3">
                            {['Biological Syncing', 'Accountability Partner Alerts', 'Deep Focus Intervals'].map((item, i) => (
                                <li key={i} className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative aspect-square rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden shadow-2xl p-8 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                        {/* Mock Task List Animation */}
                        <div className="relative space-y-4">
                            {[
                                { name: 'Hydration Ping', time: 'Every 45m', status: 'Active' },
                                { name: 'Eye Relief', time: '20-20-20 Rule', status: 'Pending' },
                                { name: 'Strategic Architecture', time: 'Deep Block', status: 'Completed' }
                            ].map((task, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ x: -20, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.2 }}
                                    className="p-4 rounded-xl bg-slate-900/50 border border-white/5 flex justify-between items-center"
                                >
                                    <div>
                                        <div className="font-bold flex items-center gap-2">
                                            {task.status === 'Completed' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border border-white/20" />}
                                            {task.name}
                                        </div>
                                        <div className="text-xs text-slate-500">{task.time}</div>
                                    </div>
                                    <Badge className={task.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}>{task.status}</Badge>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Benefit 2 - Coins */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse"
                >
                    <div className="md:order-2 space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                            <Zap className="w-8 h-8 text-amber-400" />
                        </div>
                        <h2 className="text-4xl font-bold">Hydration & Exercise = DM Coins</h2>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Your discipline is now a currency. Every task logged and every hydration target met
                            mints DM Coins directly into your digital vault.
                        </p>
                        <div className="flex gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center flex-1">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Workout</p>
                                <p className="text-2xl font-black text-amber-500">+150</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center flex-1">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Water</p>
                                <p className="text-2xl font-black text-blue-400">+50</p>
                            </div>
                        </div>
                    </div>

                    <div className="md:order-1 relative aspect-square rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden shadow-2xl flex items-center justify-center">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
                        {/* Falling Coin Animation Mock */}
                        <div className="relative">
                            <motion.div
                                animate={{ rotateY: 360 }}
                                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                                className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-4 border-amber-200/50 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.4)]"
                            >
                                <span className="text-4xl font-black text-amber-900">$</span>
                            </motion.div>
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ y: -100, x: Math.random() * 200 - 100, opacity: 0 }}
                                    animate={{ y: 200, opacity: [0, 1, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 + Math.random(), delay: i * 0.4 }}
                                    className="absolute top-0 w-6 h-6 rounded-full bg-amber-500/30"
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* MOVERS Section */}
            <section className="max-w-6xl mx-auto px-6 py-32 space-y-20">
                <div className="text-center space-y-4">
                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter">THE <span className="text-emerald-400">MOVERS</span> PROTOCOL</h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">The blueprint of a successful Reformer. Master these six pillars to dominate your day.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {movers.map((item, i) => (
                        <motion.div
                            key={item.key}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2"
                        >
                            <div className={`w-16 h-16 ${item.bg} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500`}>
                                <item.icon className={`w-8 h-8 ${item.color}`} />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-4xl font-black ${item.color}`}>{item.key}</span>
                                    <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                                </div>
                                <p className="text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                            </div>
                            <div className={`absolute top-4 right-6 text-6xl font-black opacity-[0.03] ${item.color} select-none transition-opacity group-hover:opacity-10`}>{item.key}</div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="p-12 rounded-[3rem] bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-transparent border border-white/10 text-center space-y-8"
                >
                    <h3 className="text-3xl md:text-5xl font-black">YOUR SCHEDULE, <span className="text-emerald-400">AUTOMATICALLY TUNED</span></h3>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Joining the league doesn't just give you a rank. It realigns your entire existence.
                        Our engine automatically injects the MOVERS protocol into your daily routine,
                        optimizing your habits from the moment you wake up.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 py-4">
                        {['6:00 AM Meditation', '6:15 AM Breathing', '6:30 AM Visualization'].map((tag, i) => (
                            <Badge key={i} variant="outline" className="px-4 py-2 border-white/20 bg-white/5 text-slate-300">{tag}</Badge>
                        ))}
                        <span className="text-slate-500 font-bold self-center">...and more</span>
                    </div>
                </motion.div>
            </section>

            {/* Sticky Bottom Action */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="fixed bottom-0 left-0 right-0 p-6 z-50 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none"
            >
                <div className="max-w-md mx-auto pointer-events-auto">
                    <Button
                        onClick={onEnroll}
                        disabled={enrolling}
                        className="w-full h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg shadow-[0_0_30px_rgba(16,185,129,0.3)] group relative overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {enrolling ? <Loader2 className="w-5 h-5 animate-spin" /> : "JOIN THE LEAGUE"}
                            {!enrolling && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                        </span>
                        <motion.div
                            animate={{ x: ['100%', '-100%'] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            className="absolute inset-0 bg-white/20 -skew-x-12"
                        />
                    </Button>
                    <p className="text-[10px] text-center text-slate-500 mt-2 uppercase tracking-widest font-bold">Standard enrollment protocol active</p>
                </div>
            </motion.div>

            <div className="h-32" /> {/* Spacer for sticky button */}
        </div>
    );
}

export default function ReformersPage() {
    const { profileData, updateUserProfileData } = useProfile();
    const { user } = useAuth();
    const { location } = useWeather();
    const { tasks } = useTasks();
    const { activeTimer } = useActiveTimer();

    const isEnrolled = profileData?.isReformersEnrolled || false;
    const [enrolling, setEnrolling] = useState(false);
    const [socialModalOpen, setSocialModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [whatsappJoinLink, setWhatsappJoinLink] = useState("");
    const [editWhatsappJoinLink, setEditWhatsappJoinLink] = useState("");

    // Sync states for legally compliant modal
    const [whatsappSync, setWhatsappSync] = useState(profileData?.googleSyncPermissions?.whatsapp || false);
    const [metaSync, setMetaSync] = useState(profileData?.googleSyncPermissions?.meta || false);
    const [linkedinSync, setLinkedinSync] = useState(profileData?.googleSyncPermissions?.linkedin || false);
    const [showTunedPopup, setShowTunedPopup] = useState(false);

    // Edit Profile States
    const [isEditing, setIsEditing] = useState(false);
    const [editBio, setEditBio] = useState("");
    const [editProfession, setEditProfession] = useState("");
    const [editGender, setEditGender] = useState("Prefer not to share");
    const [editDP, setEditDP] = useState("");
    const [editSocialUrls, setEditSocialUrls] = useState<{ meta?: string, linkedin?: string, whatsapp?: string }>({});

    const [liveMembers, setLiveMembers] = useState<{
        id: string;
        name: string;
        location: string;
        status: string;
        online: boolean;
        avatar: string;
        streak: number;
        profession: string;
        isPrivate: boolean;
        bio: string;
        gender: string;
        permissions: any;
        socialUrls: any;
        coins: number;
        appAge: number;
        totalTasks: number;
        totalWaterGlasses: number;
        isEnrolled: boolean;
        reformersStatus: string | null;
        isReformersAdmin: boolean;
    }[]>([]);

    const [referralModalOpen, setReferralModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    // Chat & Follow State
    const [chatMode, setChatMode] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [conversation, setConversation] = useState<any[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [myFollowers, setMyFollowers] = useState(0);
    const [myFollowing, setMyFollowing] = useState(0);
    const [selectedUserFollowers, setSelectedUserFollowers] = useState(0);
    const [selectedUserFollowing, setSelectedUserFollowing] = useState(0);

    // Fetch local followers/following counts
    useEffect(() => {
        if (user?.uid) {
            try {
                const { collection, onSnapshot } = require("firebase/firestore");
                const follRef = collection(db, "users", user.uid, "user_followers");
                const followingRef = collection(db, "users", user.uid, "user_following");
                
                const unsubFoll = onSnapshot(follRef, (snap: any) => setMyFollowers(snap.size));
                const unsubFollowing = onSnapshot(followingRef, (snap: any) => setMyFollowing(snap.size));
                
                return () => { unsubFoll(); unsubFollowing(); };
            } catch (e) { }
        }
    }, [user?.uid]);

    // Load global reformers config
    useEffect(() => {
        const unsub = onSnapshot(doc(db, "config", "reformers"), (snap) => {
            if (snap.exists()) {
                const link = snap.data().whatsappJoinLink || "https://chat.whatsapp.com/K2xFpbUYhXaBe7EsOYXmkJ";
                setWhatsappJoinLink(link);
                setEditWhatsappJoinLink(link);
            } else {
                const defaultLink = "https://chat.whatsapp.com/K2xFpbUYhXaBe7EsOYXmkJ";
                setWhatsappJoinLink(defaultLink);
                setEditWhatsappJoinLink(defaultLink);
            }
        });
        return () => unsub();
    }, []);

    // Fetch selected user's followers/following counts
    useEffect(() => {
        if (selectedUser?.id && !chatMode) {
            try {
                const { collection, onSnapshot } = require("firebase/firestore");
                const follRef = collection(db, "users", selectedUser.id, "user_followers");
                const followingRef = collection(db, "users", selectedUser.id, "user_following");
                
                const unsubFoll = onSnapshot(follRef, (snap: any) => setSelectedUserFollowers(snap.size));
                const unsubFollowing = onSnapshot(followingRef, (snap: any) => setSelectedUserFollowing(snap.size));
                
                return () => { unsubFoll(); unsubFollowing(); };
            } catch (e) { }
        }
    }, [selectedUser?.id, chatMode]);

    // Load baseline profile data for editing
    useEffect(() => {
        if (profileData) {
            setEditBio(profileData.bio || "Building disciplined habits.");
            setEditProfession(profileData.profile || "General");
            setEditGender(profileData.gender || "Prefer not to share");
            setEditDP(profileData.displayPicture || "");
            setEditSocialUrls(profileData.socialUrls || {});

            setWhatsappSync(profileData.googleSyncPermissions?.whatsapp || false);
            setMetaSync(profileData.googleSyncPermissions?.meta || false);
            setLinkedinSync(profileData.googleSyncPermissions?.linkedin || false);
        }
    }, [profileData?.bio, profileData?.gender, profileData?.profile, profileData?.displayPicture, profileData?.socialUrls, profileData?.googleSyncPermissions]);

    // Sync API detected location to profile region so others see accurate location on leaderboard
    useEffect(() => {
        if (location && location !== 'Auto' && location !== 'Current Location' && location !== profileData?.region) {
            updateUserProfileData({ region: location });
        }
    }, [location, profileData?.region, updateUserProfileData]);

    // Massive snapshot query (Pulling all users who exist in the system to auto-populate friends)
    useEffect(() => {
        if (!isEnrolled) return;

        // Note: We scan all users to populate friends automatically
        const q = query(collection(db, "users"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const members: any[] = [];
            snapshot.forEach(doc => {
                const data = doc.data() as UserProfile;
                const uid = data.userId || doc.id;
                members.push({
                    id: uid,
                    name: data.displayName || "Anonymous Reformer",
                    location: data.region?.includes('/') ? data.region.split('/').reverse()[0].replace('_', ' ') : (data.region || "Global"),
                    status: data.currentTaskStatus || "Idle",
                    online: !!data.isOnline,
                    avatar: data.displayPicture || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${uid}`,
                    streak: data.streak?.currentStreak || 0,
                    profession: data.profile || "General",
                    isPrivate: !!data.isPrivateProfile,
                    bio: data.bio || "Building disciplined habits.",
                    gender: data.gender || "Prefer not to share",
                    permissions: data.googleSyncPermissions || {},
                    socialUrls: data.socialUrls || {},
                    coins: data.slakeCredits || 0,
                    appAge: data.appAge !== undefined ? data.appAge : (data.createdAt ? Math.floor((new Date().getTime() - new Date(data.createdAt).getTime()) / 86400000) : 0),
                    totalTasks: data.totalTasks || 0,
                    totalWaterGlasses: data.totalWaterGlasses || 0,
                    isEnrolled: data.isReformersEnrolled || false,
                    reformersStatus: data.reformersStatus || null,
                    isReformersAdmin: data.isReformersAdmin || false
                });
            });
            members.sort((a, b) => {
                // Rank based on usage/streaks and coins to calculate ranking metric
                const aScore = a.streak * 100 + a.appAge * 10 + a.totalTasks * 5 + a.totalWaterGlasses * 2 + a.coins;
                const bScore = b.streak * 100 + b.appAge * 10 + b.totalTasks * 5 + b.totalWaterGlasses * 2 + b.coins;
                return bScore - aScore;
            });
            setLiveMembers(members);
        });

        return () => unsubscribe();
    }, [isEnrolled, profileData?.userId]);

    // Backfill sync for older offline members that lack profile telemetry
    useEffect(() => {
        let mounted = true;
        const syncMissingProfiles = async () => {
            let updated = false;
            const newMembers = [...liveMembers];
            for (let i = 0; i < newMembers.length; i++) {
                if (newMembers[i].appAge === 0 && newMembers[i].totalTasks === 0) {
                    try {
                        const tasksRef = collection(db, 'users', newMembers[i].id, 'tasks');
                        const q = query(tasksRef, orderBy('createdAt', 'asc'));
                        const snap = await getDocs(q);
                        if (!snap.empty && mounted) {
                            newMembers[i].totalTasks = snap.docs.length;
                            const firstDate = snap.docs[0].data().createdAt;
                            if (firstDate) {
                                newMembers[i].appAge = Math.floor((new Date().getTime() - new Date(firstDate).getTime()) / 86400000);
                            }

                            let wt = 0;
                            snap.docs.forEach((d: any) => { if (d.data().name?.toLowerCase().includes('water')) wt++; });
                            newMembers[i].totalWaterGlasses = wt;
                            updated = true;
                        }
                    } catch (e) {
                        // Fails gracefully if permissions drop
                    }
                }
            }
            if (updated && mounted) {
                newMembers.sort((a, b) => {
                    const aScore = a.streak * 100 + a.appAge * 10 + a.totalTasks * 5 + a.totalWaterGlasses * 2 + a.coins;
                    const bScore = b.streak * 100 + b.appAge * 10 + b.totalTasks * 5 + b.totalWaterGlasses * 2 + b.coins;
                    return bScore - aScore;
                });
                setLiveMembers(newMembers);
            }
        };

        const to = setTimeout(() => {
            if (liveMembers.some(m => m.appAge === 0 && m.totalTasks === 0)) {
                syncMissingProfiles();
            }
        }, 500);

        return () => { mounted = false; clearTimeout(to); };
    }, [liveMembers]);

    // Load chat messages when entering chatMode
    useEffect(() => {
        if (chatMode && selectedUser && profileData?.userId) {
            const qMerge = query(collection(db, "messages"), orderBy("timestamp", "asc"));
            const unsubMerge = onSnapshot(qMerge, (snap) => {
                const msgs: any[] = [];
                snap.forEach(doc => {
                    const d = doc.data();
                    if ((d.senderId === profileData.userId && d.receiverId === selectedUser.id) ||
                        (d.senderId === selectedUser.id && d.receiverId === profileData.userId)) {
                        msgs.push({ id: doc.id, ...d });
                    }
                });
                setConversation(msgs);
            });

            return () => unsubMerge();
        }
    }, [chatMode, selectedUser, profileData?.userId]);

    const handleEnroll = async () => {
        if (!user) return;
        setEnrolling(true);

        try {
            // Automatically tune schedule to MOVERS
            const moversTasks: any[] = [
                { name: "M: Meditation", duration: 15, icon: "BrainCircuit", category: "Morning Kickstart", order: 0 },
                { name: "O: Oxygenation (Deep Breathing)", duration: 10, icon: "Wind", category: "Morning Kickstart", order: 1 },
                { name: "V: Visualization", duration: 10, icon: "Sparkles", category: "Morning Kickstart", order: 2 },
                { name: "E: Exercise & Morning Warm-up", duration: 20, icon: "Dumbbell", category: "Morning Kickstart", order: 3 },
                { name: "R: Reading Positive Content", duration: 20, icon: "BookOpen", category: "Morning Kickstart", order: 4 },
                { name: "S: Scribing (Journaling)", duration: 15, icon: "PenSquare", category: "Morning Kickstart", order: 5 }
            ];

            // Batch update firestore userPresetTasks
            const tasksCollectionRef = collection(db, 'users', user.uid, 'userPresetTasks');
            const currentTasksQuery = query(tasksCollectionRef, where('profession', '==', profileData?.profile || 'General'));
            const currentTasksSnapshot = await getDocs(currentTasksQuery);

            const batch = writeBatch(db);
            // We prepends MOVERS to existing routine by shifting orders
            currentTasksSnapshot.forEach(doc => {
                const data = doc.data();
                batch.update(doc.ref, { order: (data.order || 0) + 6 });
            });

            moversTasks.forEach(task => {
                const newDocRef = doc(tasksCollectionRef);
                batch.set(newDocRef, {
                    ...task,
                    profession: profileData?.profile || 'General'
                });
            });

            await batch.commit();

            // Update local user status to pending so admin can see it
            const isShyam = profileData?.displayName?.toLowerCase() === "shyam pandey" || profileData?.email === "shyamp028@gmail.com" || user?.email === "shyamp028@gmail.com";
            await updateUserProfileData({
                reformersStatus: isShyam ? 'approved' : 'pending',
                isReformersEnrolled: isShyam // Auto-enroll if admin
            });

            setEnrolling(false);
            setShowTunedPopup(true);
            setTimeout(() => {
                setShowTunedPopup(false);
                setSocialModalOpen(true);
            }, 4000);

        } catch (err) {
            console.error("Enrollment failed:", err);
            setEnrolling(false);
        }
    };

    const handleSavePermissions = () => {
        const isShyam = profileData?.displayName?.toLowerCase() === "shyam pandey" || profileData?.email === "shyamp028@gmail.com" || user?.email === "shyamp028@gmail.com";
        const alreadyApproved = profileData?.reformersStatus === 'approved';

        const newStatus = alreadyApproved ? 'approved' : (isShyam ? 'approved' : 'pending');
        // Only Shyam or previously approved users get 'isReformersEnrolled: true' immediately
        const newEnrolled = (isShyam || alreadyApproved);

        updateUserProfileData({
            isReformersEnrolled: newEnrolled,
            reformersStatus: newStatus,
            isReformersAdmin: isShyam || profileData?.isReformersAdmin,
            googleSyncPermissions: {
                whatsapp: whatsappSync,
                meta: metaSync,
                linkedin: linkedinSync
            },
            socialUrls: editSocialUrls
        });
        setSocialModalOpen(false);
    };

    const approveUser = async (userId: string) => {
        try {
            await updateDoc(doc(db, "users", userId), {
                reformersStatus: 'approved',
                isReformersEnrolled: true
            });
        } catch (err) {
            console.error("Approval failed", err);
        }
    };

    const makeAdmin = async (userId: string) => {
        try {
            await updateDoc(doc(db, "users", userId), {
                isReformersAdmin: true
            });
        } catch (err) {
            console.error("Admin promotion failed", err);
        }
    };

    const handleUpdateWhatsappJoinLink = async () => {
        try {
            await setDoc(doc(db, "config", "reformers"), {
                whatsappJoinLink: editWhatsappJoinLink
            }, { merge: true });
            // Toast handled by effect since it's a listener
        } catch (err) {
            console.error("Failed to update WhatsApp link", err);
        }
    };

    const handleLeaveLeague = async () => {
        if (window.confirm("Are you sure you want to leave the Reformers League? Your profile will no longer be visible on the leaderboard.")) {
            await updateUserProfileData({
                isReformersEnrolled: false,
                reformersStatus: null
            });
        }
    };

    const reformersStatus = profileData?.reformersStatus || null;
    const isAdmin = profileData?.displayName?.toLowerCase() === "shyam pandey" || profileData?.email === "shyamp028@gmail.com" || user?.email === "shyamp028@gmail.com" || profileData?.isReformersAdmin;
    const [adminModalOpen, setAdminModalOpen] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 300;
                const MAX_HEIGHT = 300;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);
                setEditDP(canvas.toDataURL("image/jpeg", 0.7));
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleRandomVector = () => {
        setEditDP(`https://api.dicebear.com/9.x/fun-emoji/svg?seed=${Math.random().toString(36).substring(7)}`);
    };

    const handleSaveProfile = () => {
        updateUserProfileData({
            bio: editBio,
            profile: editProfession,
            gender: editGender,
            displayPicture: editDP || profileData?.displayPicture
        });
        setIsEditing(false);
    };

    const togglePrivacy = () => {
        updateUserProfileData({
            isPrivateProfile: !profileData?.isPrivateProfile
        });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !selectedUser || !profileData?.userId) return;

        try {
            await addDoc(collection(db, "messages"), {
                senderId: profileData.userId,
                receiverId: selectedUser.id,
                text: messageText.trim(),
                timestamp: serverTimestamp()
            });
            setMessageText("");
        } catch (err) {
            console.error("Messaging failed:", err);
        }
    };

    const handleFollow = async () => {
        setIsFollowing(!isFollowing);
        if (!isFollowing && selectedUser && profileData?.userId) {
            try {
                await addDoc(collection(db, "messages"), {
                    senderId: profileData.userId,
                    receiverId: selectedUser.id,
                    text: `started following you!`,
                    timestamp: serverTimestamp()
                });
            } catch (e) { }
        }
    };

    const handleConnectCoWorker = async (peerId: string) => {
        await updateUserProfileData({ pendingCoWorkerId: peerId });
        try {
            await addDoc(collection(db, "messages"), {
                senderId: profileData?.userId,
                receiverId: peerId,
                text: "🤝 I'd like to join you as a Co-Reformer! Let's stay focused together.",
                timestamp: serverTimestamp()
            });
        } catch (e) { }
    };

    const activeDates = new Set<string>();
    tasks.filter(t => t.completed).forEach(t => {
        if (t.createdAt) activeDates.add(new Date(t.createdAt).toISOString().split('T')[0]);
    });
    const dates = Array.from(activeDates).sort((a, b) => b.localeCompare(a));

    let currentStreakLocal = 0;
    let highestStreakLocal = profileData?.streak?.highestStreak || 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dates.length > 0) {
        let computedHighestStreak = 1;
        let tempStreak = 1;
        for (let i = 0; i < dates.length - 1; i++) {
            const diffTime = new Date(dates[i]).getTime() - new Date(dates[i + 1]).getTime();
            if (Math.abs(diffTime - 86400000) < 3600000) {
                tempStreak++;
                if (tempStreak > computedHighestStreak) computedHighestStreak = tempStreak;
            } else {
                tempStreak = 1;
            }
        }
        highestStreakLocal = Math.max(highestStreakLocal, computedHighestStreak);

        if (dates.includes(today) || dates.includes(yesterdayStr)) {
            let checkDate = new Date(dates[0]);
            while (true) {
                const c = checkDate.toISOString().split('T')[0];
                if (activeDates.has(c)) {
                    currentStreakLocal++;
                    checkDate = new Date(checkDate.getTime() - 86400000);
                } else {
                    break;
                }
            }
        }
    } else {
        currentStreakLocal = profileData?.streak?.currentStreak || 0;
    }

    const appAgeDays = tasks.length > 0
        ? Math.floor((new Date().getTime() - new Date(tasks[tasks.length - 1].createdAt).getTime()) / 86400000)
        : 0;

    const myRankIndex = liveMembers.findIndex(m => m.id === profileData?.userId);
    const myRank = myRankIndex !== -1 ? myRankIndex + 1 : 'Unranked';
    const rankChangeFactor = `+${Math.floor(Math.random() * 3) + 1}`;

    if (reformersStatus === 'pending' && !isEnrolled && !enrolling && !socialModalOpen && !isAdmin) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-6 space-y-6 pt-16 font-sans">
                <ShieldCheck className="w-24 h-24 text-yellow-500 animate-pulse drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">Access Restricted</h1>
                <p className="text-lg text-gray-400 max-w-md">Your application to join the Reformers League is pending review. An administrator will verify your profile shortly.</p>
            </div>
        );
    }

    if ((!isEnrolled || reformersStatus === null) && !enrolling && !socialModalOpen) {
        return <ReformersOnboarding onEnroll={handleEnroll} enrolling={enrolling} />;
    }

    return (
        <div className="min-h-screen bg-background pb-24 text-foreground selection:bg-[#10b981]/30">
            <div className="p-4 pt-12 max-w-4xl mx-auto space-y-6">

                {/* Live Activity Feed / Ticker */}
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2 flex items-center gap-4 overflow-hidden shadow-inner group">
                    <div className="flex items-center gap-2 shrink-0 bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30">
                        <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                        <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400">Live Activity</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <motion.div
                            animate={{ x: [400, -1200] }}
                            transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                            className="flex items-center gap-12 whitespace-nowrap text-[11px] font-bold text-gray-400"
                        >
                            {liveMembers.slice(0, 5).map((m, i) => (
                                <span key={i} className="flex items-center gap-2">
                                    <span className="text-white">{m.name}</span> just earned <span className="text-amber-500">{Math.floor(Math.random() * 50) + 20} Coins</span>
                                    <span className="opacity-30">•</span>
                                </span>
                            ))}
                            <span className="flex items-center gap-2">
                                <span className="text-white">Global:</span> 12 Reformers focusing now
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="text-emerald-400">Streak:</span> {currentStreakLocal} Days achieved by you!
                            </span>
                        </motion.div>
                    </div>
                </div>

                {/* Header Ribbon / Social Sync Modal */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                    <div>
                        <h1 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                            <Globe2 className="text-[#10b981] w-6 h-6" /> Reformers
                        </h1>
                        <p className="text-xs text-[#10b981] font-bold mt-1 tracking-widest">{location || (profileData?.region?.includes('/') ? profileData.region.split('/').reverse()[0].replace('_', ' ') : profileData?.region || "Global")} Region</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            onClick={() => window.open(whatsappJoinLink || "https://chat.whatsapp.com/K2xFpbUYhXaBe7EsOYXmkJ", "_blank")}
                            className="flex-1 sm:flex-none bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20ba5a] hover:to-[#075E54] text-white font-black border-none shadow-[0_0_20px_rgba(37,211,102,0.3)] px-4 sm:px-6 whitespace-nowrap text-[10px] sm:text-xs h-9 sm:h-10"
                        >
                            <Phone className="w-3.5 h-3.5 mr-1 sm:mr-2 shrink-0" /> JOIN WHATSAPP
                        </Button>
                        {isAdmin && (
                            <Dialog open={adminModalOpen} onOpenChange={setAdminModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="flex-1 sm:flex-none border-yellow-500/30 bg-[#1a1a1a] text-yellow-500 hover:text-yellow-400 hover:bg-muted text-[10px] sm:text-xs h-9 sm:h-10 px-2 sm:px-4"><LockKeyhole className="w-3.5 h-3.5 mr-1 sm:mr-2" /> Admin</Button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#1a1a1a] border-border text-foreground max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle className="text-yellow-500 flex items-center gap-2 text-xl font-bold"><ShieldCheck /> Admin Access</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest">Pending Approvals</h3>
                                        {liveMembers.filter(m => m.reformersStatus === 'pending').map(m => (
                                            <div key={m.id} className="flex items-center justify-between p-3 border border-border rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-10 h-10"><AvatarImage src={m.avatar} /></Avatar>
                                                    <div>
                                                        <p className="font-bold">{m.name}</p>
                                                        <p className="text-xs text-muted-foreground">{m.profession}</p>
                                                    </div>
                                                </div>
                                                <Button size="sm" className="bg-[#10b981] hover:bg-[#059669] text-black font-bold" onClick={() => approveUser(m.id)}>Approve</Button>
                                            </div>
                                        ))}
                                        {liveMembers.filter(m => m.reformersStatus === 'pending').length === 0 && <p className="text-sm text-gray-500 bg-muted/20 p-4 rounded-lg">No pending requests.</p>}

                                        <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest mt-6">Manage Members (Enrolled)</h3>
                                        {liveMembers.filter(m => m.isEnrolled).map(m => (
                                            <div key={m.id} className="flex items-center justify-between p-3 border border-border rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-10 h-10"><AvatarImage src={m.avatar} /></Avatar>
                                                    <div>
                                                        <p className="font-bold">{m.name} {m.isReformersAdmin && <Badge className="ml-2 bg-yellow-500 text-black text-[9px]">ADMIN</Badge>}</p>
                                                    </div>
                                                </div>
                                                {!m.isReformersAdmin && (
                                                    <Button size="sm" variant="outline" className="text-yellow-500 border-yellow-500/50 hover:bg-yellow-500 hover:text-black" onClick={() => makeAdmin(m.id)}>Promote</Button>
                                                )}
                                            </div>
                                        ))}

                                        <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest mt-6">Global League Settings</h3>
                                        <div className="space-y-4 p-4 border border-border rounded-xl bg-muted/10">
                                            <div className="space-y-2">
                                                <label className="text-xs text-muted-foreground font-bold uppercase">WhatsApp Group Joining Link</label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={editWhatsappJoinLink}
                                                        onChange={(e) => setEditWhatsappJoinLink(e.target.value)}
                                                        placeholder="https://chat.whatsapp.com/..."
                                                        className="bg-muted/50 border-none text-foreground"
                                                    />
                                                    <Button onClick={handleUpdateWhatsappJoinLink} size="sm" className="bg-[#10b981] hover:bg-[#059669] text-black">Update</Button>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground">This link will be visible as a "Join Group" button for all reformers.</p>
                                            </div>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                        <Button variant="outline" className="flex-1 sm:flex-none border-border bg-[#1a1a1a] text-gray-300 hover:text-foreground hover:bg-muted text-[10px] sm:text-xs h-9 sm:h-10 px-2 sm:px-4" onClick={() => setReferralModalOpen(true)}>
                            <Share2 className="w-3.5 h-3.5 mr-1 sm:mr-2" /> Invite
                        </Button>
                        <Dialog open={socialModalOpen} onOpenChange={setSocialModalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1 sm:flex-none border-border bg-[#1a1a1a] text-gray-300 hover:text-foreground hover:bg-muted text-[10px] sm:text-xs h-9 sm:h-10 px-2 sm:px-4"><LayoutDashboard className="w-3.5 h-3.5 mr-1 sm:mr-2" />Social Sync</Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#1a1a1a] border-border text-foreground sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-[#10b981] flex items-center gap-2 text-xl font-bold"><ShieldCheck /> Social Network Access</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                                        <div>
                                            <p className="font-medium text-sm flex items-center gap-2"><Phone className="w-4 h-4 text-[#25D366]" /> WhatsApp Reminders</p>
                                            <p className="text-xs text-gray-500 max-w-[200px]">Send automated alerts to your accountability partner.</p>
                                        </div>
                                        <Switch checked={whatsappSync} onCheckedChange={setWhatsappSync} className="data-[state=checked]:bg-[#10b981]" />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                                        <div>
                                            <p className="font-medium text-sm flex items-center gap-2"><Instagram className="w-4 h-4 text-[#E1306C]" /> Instagram Share</p>
                                            <p className="text-xs text-gray-500 max-w-[200px]">Post your completion cards to your network.</p>
                                        </div>
                                        <Switch checked={metaSync} onCheckedChange={setMetaSync} className="data-[state=checked]:bg-[#10b981]" />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                                        <div>
                                            <p className="font-medium text-sm flex items-center gap-2"><Linkedin className="w-4 h-4 text-[#0077b5]" /> LinkedIn Career Sync</p>
                                            <p className="text-xs text-gray-500 max-w-[200px]">Publish productivity milestones automatically.</p>
                                        </div>
                                        <Switch checked={linkedinSync} onCheckedChange={setLinkedinSync} className="data-[state=checked]:bg-[#10b981]" />
                                    </div>
                                    {(whatsappSync || metaSync || linkedinSync) && (
                                        <div className="pt-4 border-t border-border space-y-3">
                                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">Social Profile URLs</p>
                                            {whatsappSync && <Input value={editSocialUrls.whatsapp || ""} onChange={(e) => setEditSocialUrls({ ...editSocialUrls, whatsapp: e.target.value })} placeholder="WhatsApp URL/Number" className="bg-muted/50 border-none text-foreground h-10" />}
                                            {metaSync && <Input value={editSocialUrls.meta || ""} onChange={(e) => setEditSocialUrls({ ...editSocialUrls, meta: e.target.value })} placeholder="Instagram URL" className="bg-muted/50 border-none text-foreground h-10" />}
                                            {linkedinSync && <Input value={editSocialUrls.linkedin || ""} onChange={(e) => setEditSocialUrls({ ...editSocialUrls, linkedin: e.target.value })} placeholder="LinkedIn URL" className="bg-muted/50 border-none text-foreground h-10" />}
                                        </div>
                                    )}
                                </div>
                                <DialogFooter className="border-t border-border pt-4 mt-2">
                                    <Button onClick={handleSavePermissions} className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-extrabold text-sm h-12">Save Configuration</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Dialog open={referralModalOpen} onOpenChange={setReferralModalOpen}>
                        <DialogContent className="bg-[#1a1a1a] border-border text-foreground sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-[#10b981] flex items-center gap-2 text-xl font-bold"><Share2 /> Invite to Reformers League</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="text-center p-4 bg-muted/40 rounded-xl border border-border">
                                    <TrendingUp className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                                    <h3 className="font-bold text-foreground">Get 1,000 DM Coins</h3>
                                    <p className="text-xs text-muted-foreground mt-1">For every friend who joins using your unique profile link, you earn 1,000 DM Coins towards rewards!</p>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Share Your Link</p>
                                    <div className="flex gap-2">
                                        <Input
                                            readOnly
                                            value={`https://slake-deadlines-met.vercel.app/?ref=${profileData?.userId}`}
                                            className="bg-muted/50 border-[#333] text-foreground h-12"
                                        />
                                        <Button
                                            onClick={() => {
                                                let referralText = `Look at my profile on Slake DeadlinesMet!\n\nMetrics: ${appAgeDays} Days App Age, ${currentStreakLocal} Logbook Streak.\nJoin my accountability network natively here & grab coins:\nhttps://slake-deadlines-met.vercel.app/?ref=${profileData?.userId}`;
                                                navigator.clipboard.writeText(referralText);
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                            }}
                                            className="bg-[#10b981] hover:bg-[#059669] text-black h-12 px-4 shadow-md"
                                        >
                                            {copied ? "Copied!" : <Copy className="w-5 h-5" />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-around pt-2">
                                    <Button
                                        variant="outline" size="icon"
                                        onClick={() => {
                                            let shareText = `Check out my accountability profile logging ${currentStreakLocal} straight days!\nJoin me natively on Reformers:\nhttps://slake-deadlines-met.vercel.app/?ref=${profileData?.userId}`;
                                            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank")
                                        }}
                                        className="w-14 h-14 rounded-full bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20">
                                        <Phone className="w-6 h-6" />
                                    </Button>
                                    <Button
                                        variant="outline" size="icon"
                                        onClick={() => {
                                            let shareText = `Check out my accountability profile!\nJoin me here:\nhttps://slake-deadlines-met.vercel.app/?ref=${profileData?.userId}`;
                                            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://slake-deadlines-met.vercel.app/&summary=${encodeURIComponent(shareText)}`, "_blank")
                                        }}
                                        className="w-14 h-14 rounded-full bg-[#0077b5]/10 border-[#0077b5]/30 text-[#0077b5] hover:bg-[#0077b5]/20">
                                        <Linkedin className="w-6 h-6" />
                                    </Button>
                                    <Button
                                        variant="outline" size="icon"
                                        onClick={() => {
                                            // For instagram, share links can't pre-fill text as easily, but copy the referral link and direct to app
                                            navigator.clipboard.writeText(`https://slake-deadlines-met.vercel.app/?ref=${profileData?.userId}`);
                                            window.open(`https://instagram.com/`, "_blank")
                                        }}
                                        className="w-14 h-14 rounded-full bg-[#E1306C]/10 border-[#E1306C]/30 text-[#E1306C] hover:bg-[#E1306C]/20">
                                        <Instagram className="w-6 h-6" />
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                </div>

                {/* My Dashboard View (Editable) */}
                <div className="pt-2">
                    <Card className="bg-[#1a1a1a] border border-border shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-[#10b981]/30">
                        <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-br from-[#10b981]/20 to-transparent"></div>
                        <CardContent className="pt-6 relative z-10">
                            {isEditing ? (
                                <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="w-20 h-20 border-4 border-[#10b981]">
                                            <AvatarImage src={editDP || profileData?.displayPicture || "https://i.pravatar.cc/150"} />
                                            <AvatarFallback>{profileData?.displayName?.charAt(0) || "U"}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-2">
                                            <label className="text-xs text-muted-foreground font-bold tracking-widest uppercase">Display Picture</label>
                                            <div className="flex gap-2">
                                                <Button variant="outline" className="bg-muted border-none hover:bg-[#333] hover:text-foreground text-foreground h-10 relative overflow-hidden">
                                                    <Camera className="w-4 h-4 mr-2" /> Upload
                                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                </Button>
                                                <Button variant="outline" onClick={handleRandomVector} className="bg-muted hover:bg-[#333] hover:text-foreground border-none text-foreground h-10">Vector</Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-muted-foreground font-bold tracking-widest uppercase">Profession / Focus</label>
                                        <Input value={editProfession} onChange={(e) => setEditProfession(e.target.value)} placeholder="e.g. Software Engineer" className="bg-muted border-none text-foreground h-12 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-muted-foreground font-bold tracking-widest uppercase">Gender</label>
                                        <select value={editGender} onChange={(e) => setEditGender(e.target.value)} className="w-full bg-muted border-none text-foreground h-12 text-sm rounded-md px-3 outline-none">
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Prefer not to share">Prefer not to share</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-muted-foreground font-bold tracking-widest uppercase">Bio</label>
                                        <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Your vision..." className="bg-muted border-none text-foreground resize-none" rows={3} />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <Button onClick={handleSaveProfile} className="flex-1 bg-[#10b981] hover:bg-[#059669] text-black font-bold h-12"><Save className="w-4 h-4 mr-2" /> Save Profile</Button>
                                        <Button onClick={() => setIsEditing(false)} variant="secondary" className="bg-muted hover:bg-[#333] text-foreground h-12">Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-6">
                                    <div className="relative shrink-0 group">
                                        <Avatar className="w-16 h-16 sm:w-28 sm:h-28 border-2 sm:border-4 border-[#10b981]/30 group-hover:border-[#10b981] transition-colors">
                                            <AvatarImage src={profileData?.displayPicture || "https://i.pravatar.cc/150"} />
                                            <AvatarFallback>{profileData?.displayName?.charAt(0) || "U"}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-2 -right-2 sm:bottom-0 sm:right-0 flex flex-row sm:flex-col gap-1">
                                            <Button onClick={togglePrivacy} size="icon" variant="secondary" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-border" title={profileData?.isPrivateProfile ? "Private" : "Public"}>
                                                {profileData?.isPrivateProfile ? <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" /> : <Unlock className="w-3 h-3 sm:w-4 sm:h-4 text-[#10b981]" />}
                                            </Button>
                                            <Button onClick={handleLeaveLeague} size="icon" variant="destructive" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-red-500/50 bg-[#1a1a1a] hover:bg-red-500 text-red-500 hover:text-white" title="Exit League">
                                                <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex-1 text-center sm:text-left space-y-1 sm:space-y-2 w-full pt-1 sm:pt-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                                            <div>
                                                <h2 className="text-xl sm:text-2xl font-extrabold text-foreground flex justify-center sm:justify-start items-center gap-1 sm:gap-2">
                                                    {profileData?.displayName || "Reformer"}
                                                    <Button onClick={() => setIsEditing(true)} variant="ghost" size="icon" className="w-5 h-5 sm:w-6 sm:h-6 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground"><Edit className="w-3 h-3" /></Button>
                                                </h2>
                                                <p className="text-[10px] sm:text-sm font-medium text-[#10b981] tracking-wider sm:tracking-wide uppercase">{profileData?.profile || "General"} | {profileData?.region?.includes('/') ? profileData.region.split('/').reverse()[0].replace('_', ' ') : profileData?.region || "Global"}</p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 mt-6 w-full max-w-xl mx-auto sm:mx-0 min-h-[120px]">
                                                <div className="text-center">
                                                    <p className="text-sm uppercase text-muted-foreground font-bold leading-tight">Followers</p>
                                                    <p className="text-xl font-bold text-foreground">{myFollowers}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm uppercase text-muted-foreground font-bold leading-tight">Following</p>
                                                    <p className="text-xl font-bold text-foreground">{myFollowing}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm uppercase text-muted-foreground font-bold leading-tight">Streak</p>
                                                    <p className="text-xl font-bold text-foreground">{currentStreakLocal}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm uppercase text-muted-foreground font-bold leading-tight">App Days</p>
                                                    <p className="text-xl font-bold text-foreground">{appAgeDays}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm uppercase text-muted-foreground font-bold leading-tight">DM Coins</p>
                                                    <p className="text-xl font-bold text-amber-500">{profileData?.slakeCredits || 0}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm uppercase text-muted-foreground font-bold leading-tight flex items-center gap-1 justify-center">Rank <TrendingUp className="w-2 h-2 text-green-500" /></p>
                                                    <p className="text-xl font-bold text-[#10b981]">#{myRank}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-xs sm:text-sm text-gray-300 max-w-lg mt-2 sm:mt-3 mx-auto sm:mx-0 leading-relaxed">
                                            {profileData?.bio || "Building disciplined habits and enforcing high-performance standards."}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-5 justify-center sm:justify-start">
                                            {profileData?.googleSyncPermissions?.linkedin && profileData?.socialUrls?.linkedin && (
                                                <Badge variant="outline" className="bg-[#0077b5]/10 text-[#0077b5] border-[#0077b5]/30 cursor-pointer text-[9px] sm:text-xs" onClick={() => window.open(profileData.socialUrls!.linkedin, "_blank")}>Linked</Badge>
                                            )}
                                            {profileData?.googleSyncPermissions?.meta && profileData?.socialUrls?.meta && (
                                                <Badge variant="outline" className="bg-[#E1306C]/10 text-[#E1306C] border-[#E1306C]/30 cursor-pointer text-[9px] sm:text-xs" onClick={() => window.open(profileData.socialUrls!.meta, "_blank")}>Instagram</Badge>
                                            )}
                                            {profileData?.isPrivateProfile && <Badge variant="outline" className="bg-gray-800 text-muted-foreground border-gray-700 text-[9px] sm:text-xs"><LockKeyhole className="w-3 h-3 mr-1" /> Private</Badge>}
                                        </div>

                                        {/* Pinned Certificates Section */}
                                        {profileData?.pinnedCertificateIds && profileData.pinnedCertificateIds.length > 0 && (
                                            <div className="mt-8 pt-6 border-t border-border/50">
                                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2 justify-center sm:justify-start">
                                                    <Award className="w-4 h-4 text-yellow-500" /> Pinned Certificates
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {profileData.pinnedCertificateIds.map(certId => {
                                                        // Fallback display for certificates as we don't have the full cert data here easily
                                                        // In a real app, we'd fetch or have a shared constant for cert definitions
                                                        const certTitle = certId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').replace('Cert ', '');
                                                        return (
                                                            <div key={certId} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 shadow-sm hover:border-[#10b981]/30 transition-all">
                                                                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 shrink-0">
                                                                    <Medal className="w-5 h-5 text-yellow-500" />
                                                                </div>
                                                                <div className="overflow-hidden">
                                                                    <p className="text-sm font-bold truncate text-foreground">{certTitle}</p>
                                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Slake Certified</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Global Live Leaderboard Panel */}
                {isAdmin && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl mb-6 shadow-sm">
                        <h3 className="font-bold text-yellow-500 flex items-center gap-2 mb-3"><ShieldCheck className="w-5 h-5" /> Pending Approvals</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {liveMembers.filter(m => m.reformersStatus === 'pending').map(m => (
                                <div key={m.id} className="flex items-center justify-between p-3 border border-yellow-500/20 bg-black/40 rounded-xl">
                                    <div className="flex items-center gap-3 w-full overflow-hidden">
                                        <Avatar className="w-10 h-10 shrink-0"><AvatarImage src={m.avatar} /></Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-white text-sm truncate">{m.name}</p>
                                            <p className="text-[10px] uppercase text-muted-foreground truncate">{m.profession}</p>
                                        </div>
                                        <Button size="sm" className="bg-[#10b981] hover:bg-[#059669] text-black font-bold shrink-0 text-xs h-7" onClick={() => approveUser(m.id)}>Approve</Button>
                                    </div>
                                </div>
                            ))}
                            {liveMembers.filter(m => m.reformersStatus === 'pending').length === 0 && (
                                <p className="text-sm text-yellow-500/70 p-2">No pending reformers at the moment. You're all caught up!</p>
                            )}
                        </div>
                    </div>
                )}
                <div className="space-y-4 pt-6">
                    <h3 className="text-sm font-bold tracking-widest uppercase text-gray-500 flex items-center justify-between">
                        <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Global Leaderboard</span>
                        <span className="text-[10px] text-[#10b981] bg-[#10b981]/10 px-2 py-1 rounded-sm border border-[#10b981]/20">LIVE SYNC</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        {liveMembers.map(member => (
                            <Dialog key={member.id} open={selectedUser?.id === member.id} onOpenChange={(open) => {
                                if (!open) {
                                    setSelectedUser(null);
                                    setChatMode(false);
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <div onClick={() => setSelectedUser(member)} className="cursor-pointer bg-[#1a1a1a] border border-border p-4 rounded-xl flex items-center justify-between hover:border-[#10b981]/50 transition-all duration-300 shadow-md group">
                                        <div className="flex items-center gap-4">
                                            <div className="relative shrink-0">
                                                <Avatar className="w-12 h-12 border border-border group-hover:border-[#10b981]/50 transition-colors">
                                                    <AvatarImage src={member.avatar} />
                                                    <AvatarFallback className="bg-muted">{member.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                {member.online && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10b981] border-2 border-[#1a1a1a] rounded-full flex" style={{ boxShadow: "0 0 8px rgba(16,185,129,0.8)" }}></span>}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-sm truncate text-foreground">{member.name}</h4>
                                                    {member.isPrivate && <LockKeyhole className="w-3 h-3 text-gray-500" />}
                                                </div>
                                                <p className={`text-xs font-medium truncate mt-0.5 tracking-wide ${member.online ? 'text-[#10b981]' : 'text-gray-500'}`}>{member.status}</p>
                                                <div className="flex items-center gap-2 mt-1.5 text-muted-foreground">
                                                    <div className="flex items-center gap-1 opacity-60">
                                                        <MapPin className="w-3 h-3" />
                                                        <span className="text-[10px] uppercase font-semibold">{member.location}</span>
                                                    </div>
                                                    <span className="text-[10px] opacity-40">•</span>
                                                    <span className="text-[10px] opacity-60 font-medium">{member.profession}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="text-center">
                                                <p className="text-xs font-bold text-foreground leading-tight">{member.appAge}</p>
                                                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Days</p>
                                            </div>
                                            <div className="text-center hidden sm:block">
                                                <p className="text-xs font-bold text-foreground leading-tight">{member.totalTasks}</p>
                                                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Tasks</p>
                                            </div>
                                            <div className="text-center hidden md:block">
                                                <p className="text-xs font-bold text-amber-500 leading-tight">{member.coins}</p>
                                                <p className="text-[9px] uppercase tracking-widest text-amber-500/70 font-bold">Coins</p>
                                            </div>
                                            <div className="text-center pr-2 border-l border-border/50 pl-3 md:pl-4">
                                                <p className="text-xs font-black text-foreground leading-tight">{member.streak}</p>
                                                <p className="text-[9px] uppercase tracking-widest text-[#10b981] font-bold">Streak</p>
                                            </div>
                                        </div>
                                    </div>
                                </DialogTrigger>

                                <DialogContent className="bg-[#1a1a1a] border-border text-foreground w-[96vw] max-w-[400px] max-h-[92vh] overflow-x-hidden overflow-y-auto p-0 rounded-2xl">
                                    <DialogHeader className="hidden">
                                        <DialogTitle>Profile Actions</DialogTitle>
                                    </DialogHeader>

                                    {chatMode ? (
                                        <div className="flex flex-col h-[500px]">
                                            <div className="bg-muted/50 p-4 border-b border-border flex items-center justify-between shadow-sm relative z-10">
                                                <div className="flex items-center gap-3">
                                                    <Button variant="ghost" size="icon" className="hover:bg-[#333] hover:text-foreground" onClick={() => setChatMode(false)}>
                                                        <ArrowLeft className="w-4 h-4" />
                                                    </Button>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="w-8 h-8 pointer-events-none">
                                                            <AvatarImage src={member.avatar} />
                                                        </Avatar>
                                                        <div>
                                                            <h3 className="font-bold text-sm leading-tight text-foreground">{member.name}</h3>
                                                            <p className={`text-[10px] font-medium ${member.online ? 'text-[#10b981]' : 'text-gray-500'}`}>
                                                                {member.online ? "Online: " + member.status : "Offline"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                                                {conversation.length === 0 ? (
                                                    <div className="text-center text-gray-500 text-xs italic mt-8 bg-muted/30 p-4 rounded-xl inline-block mx-auto flex flex-col items-center gap-2 border border-border/50">
                                                        <MessageSquare className="w-6 h-6 text-gray-600" />
                                                        No messages yet. Say hi and start holding each other accountable!
                                                    </div>
                                                ) : (
                                                    conversation.map((msg) => {
                                                        const isMe = msg.senderId === profileData?.userId;
                                                        return (
                                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                                <div className={`max-w-[75%] p-3 rounded-2xl text-sm leading-snug shadow-sm ${isMe ? 'bg-[#10b981] text-black rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm border border-[#333]'}`}>
                                                                    {msg.text}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            <div className="flex gap-2 p-2 bg-[#1a1a1a] border-t border-border overflow-x-auto no-scrollbar scroll-smooth">
                                                {whatsappJoinLink && (
                                                    <Button
                                                        onClick={() => window.open(whatsappJoinLink, "_blank")}
                                                        variant="outline"
                                                        size="sm"
                                                        className="rounded-full bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] text-[10px] h-7 px-3 whitespace-nowrap hover:bg-[#25D366]/20 transition-all font-bold"
                                                    >
                                                        <Phone className="w-3 h-3 mr-1" /> Join Group
                                                    </Button>
                                                )}
                                                <Button
                                                    onClick={() => {
                                                        setMessageText(`🤝 Hey! Let's connect our schedules and work as Co-Workers. I'm focusing on ${activeTimer?.taskName || 'a task'} right now!`);
                                                    }}
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-full bg-blue-500/10 border-blue-500/30 text-blue-400 text-[10px] h-7 px-3 whitespace-nowrap hover:bg-blue-500/20 transition-all font-bold"
                                                >
                                                    🤝 Work as Co-Reformer
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        setMessageText(`🔥 Just hit a streak of ${currentStreakLocal} days in my Logbook! Join me natively here to earn DM Coins together.`);
                                                    }}
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-full bg-amber-500/10 border-amber-500/30 text-amber-500 text-[10px] h-7 px-3 whitespace-nowrap hover:bg-amber-500/20 transition-all font-bold"
                                                >
                                                    🔥 Share Streak
                                                </Button>
                                            </div>
                                            <form onSubmit={handleSendMessage} className="p-3 border-t border-border flex gap-2 bg-[#1a1a1a]">
                                                <Input
                                                    value={messageText}
                                                    onChange={(e) => setMessageText(e.target.value)}
                                                    placeholder="Message securely..."
                                                    className="bg-muted/50 border-[#333] focus-visible:ring-1 focus-visible:ring-[#10b981] rounded-full h-10 px-4 placeholder:text-gray-500"
                                                />
                                                <Button type="submit" size="icon" className="bg-[#10b981] hover:bg-[#059669] text-black shrink-0 rounded-full h-10 w-10 shadow-[0_0_15px_rgba(16,185,129,0.3)]"><Send className="w-4 h-4 ml-0.5" /></Button>
                                            </form>
                                        </div>
                                    ) : (
                                        <div className="p-6">
                                            <div className="pt-4 text-center space-y-4">
                                                <div className="relative inline-block mx-auto group">
                                                    <Avatar className="w-28 h-28 border-4 border-[#10b981]/30 mx-auto shadow-xl transition-transform hover:scale-105">
                                                        <AvatarImage src={member.avatar} />
                                                        <AvatarFallback className="bg-muted">{member.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    {member.online && <div className="absolute bottom-1 right-2 bg-[#10b981] w-5 h-5 border-[3px] border-[#1a1a1a] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>}
                                                </div>

                                                <div>
                                                    <h2 className="text-2xl font-black text-foreground">{member.name}</h2>
                                                    <p className="text-sm font-medium text-[#10b981] tracking-wide uppercase mt-1">{member.profession} | {member.location}</p>
                                                </div>

                                                {member.isPrivate ? (
                                                    <div className="bg-muted/30 p-8 rounded-xl border border-border flex flex-col items-center">
                                                        <LockKeyhole className="w-10 h-10 text-gray-500 mb-4" />
                                                        <p className="text-muted-foreground text-sm font-medium leading-relaxed">This profile is strictly private. Metrics and social channels are masked securely.</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-5">
                                                        <p className="text-sm text-gray-300 italic bg-muted/30 p-4 rounded-xl border border-border/50 shadow-inner">"{member.bio}"</p>

                                                        <div className="bg-muted/50 border border-border p-3 sm:p-4 rounded-xl grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2 items-start justify-items-center shadow-sm w-full">
                                                            <div className="text-center w-full">
                                                                <div className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-1 truncate">App Days</div>
                                                                <div className="text-base sm:text-lg font-black text-foreground truncate">{member.appAge}D</div>
                                                            </div>
                                                            <div className="text-center w-full">
                                                                <div className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-1 truncate">Logbook</div>
                                                                <div className="text-base sm:text-lg font-black text-foreground truncate">{member.streak}</div>
                                                            </div>
                                                            <div className="text-center w-full">
                                                                <div className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-1 truncate">DM Coins</div>
                                                                <div className="text-base sm:text-lg font-black text-amber-500 truncate">{member.coins}</div>
                                                            </div>
                                                            <div className="text-center w-full">
                                                                <div className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-1 truncate">Certs</div>
                                                                <div className="text-base sm:text-lg font-black text-[#10b981] truncate">{Math.floor(member.streak / 7)}</div>
                                                            </div>
                                                            <div className="text-center w-full">
                                                                <div className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-1 truncate">Tasks</div>
                                                                <div className="text-base sm:text-lg font-black text-foreground truncate">{member.totalTasks}</div>
                                                            </div>
                                                            <div className="text-center w-full">
                                                                <div className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-1 truncate">Water</div>
                                                                <div className="text-base sm:text-lg font-black text-blue-400 truncate">{member.totalWaterGlasses}</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-center gap-3 pt-2">
                                                            {member.permissions?.linkedin && member.socialUrls?.linkedin && (
                                                                <Button variant="outline" size="icon" onClick={() => window.open(member.socialUrls.linkedin, "_blank")} className="rounded-full bg-[#0077b5]/10 border-[#0077b5]/30 hover:bg-[#0077b5]/20 text-[#0077b5] h-10 w-10"><Linkedin className="w-4 h-4" /></Button>
                                                            )}
                                                            {member.permissions?.meta && member.socialUrls?.meta && (
                                                                <Button variant="outline" size="icon" onClick={() => window.open(member.socialUrls.meta, "_blank")} className="rounded-full bg-[#E1306C]/10 border-[#E1306C]/30 hover:bg-[#E1306C]/20 text-[#E1306C] h-10 w-10"><Instagram className="w-4 h-4" /></Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-border w-full">
                                                    <Button onClick={handleFollow} className={`w-full font-extrabold h-12 text-xs sm:text-sm shadow-md transition-all ${isFollowing ? 'bg-muted text-foreground hover:bg-[#333] border border-[#333]' : 'bg-[#10b981] text-black hover:bg-[#059669]'}`}>
                                                        {isFollowing ? "Following" : "Follow"}
                                                    </Button>
                                                    {!member.isPrivate && <Button onClick={() => setChatMode(true)} variant="secondary" className="w-full bg-muted hover:bg-[#333] text-foreground h-12 px-3 shadow-md border border-[#333] text-xs sm:text-sm"><MessageSquare className="w-4 h-4 mr-2" /> Text</Button>}

                                                    <div className="col-span-2">
                                                        {profileData?.coWorkerId === member.id ? (
                                                            <Button onClick={() => updateUserProfileData({ coWorkerId: "" })} variant="outline" className="w-full font-extrabold h-12 text-xs sm:text-sm bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 leading-tight">
                                                                Unlink Co-Reformer
                                                            </Button>
                                                        ) : profileData?.pendingCoWorkerId === member.id ? (
                                                            <Button variant="outline" disabled className="w-full font-extrabold h-12 text-xs sm:text-sm bg-yellow-500/10 text-yellow-500 border-yellow-500/30 opacity-70 leading-tight">
                                                                Pending Approval
                                                            </Button>
                                                        ) : (
                                                            <Button onClick={() => handleConnectCoWorker(member.id)} variant="outline" className="w-full font-extrabold h-12 text-xs sm:text-sm bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 leading-tight">
                                                                Connect as Co-Reformer
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </DialogContent>
                            </Dialog>
                        ))}
                    </div>
                </div>

                <Dialog open={showTunedPopup} onOpenChange={setShowTunedPopup}>
                    <DialogContent className="bg-slate-950/95 border-emerald-500/50 text-white text-center p-12 rounded-[2.5rem] backdrop-blur-xl shadow-[0_0_50px_rgba(16,185,129,0.2)] sm:max-w-md">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="space-y-6"
                        >
                            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/30">
                                <Zap className="w-12 h-12 text-emerald-400 animate-pulse" />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight">SCHEDULE TUNED</h2>
                            <p className="text-slate-400 leading-relaxed">
                                Welcome, Reformer. Your routine has been automatically aligned with the
                                <span className="text-emerald-400 font-bold"> MOVERS</span> protocol.
                                Refresh your homescreen to see your new path.
                            </p>
                            <div className="pt-4 flex justify-center gap-2">
                                {['M', 'O', 'V', 'E', 'R', 'S'].map(l => (
                                    <div key={l} className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-sm border border-emerald-500/20">{l}</div>
                                ))}
                            </div>
                        </motion.div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
