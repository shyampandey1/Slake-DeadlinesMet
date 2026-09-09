"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from "recharts";
import { Award, Zap, Trophy, TrendingUp, Medal, Flame, Star, Crown, Gift, Share2, Download, Droplet, Mail, Coffee, Dumbbell, Wind, Eye, Heart, Pin, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useFirestore";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot } from "firebase/firestore";
import type { UserProfile } from "@/types";

export function RewardsContent() {
  const { profileData, updateUserProfileData } = useProfile();
  const { user } = useAuth();
  const router = useRouter();
  
  const [credits, setCredits] = useState(profileData?.slakeCredits || 0);
  
  useEffect(() => {
    if (profileData) {
        const streak = profileData.streak?.highestStreak || 0;
        const tasksDone = (profileData as any).totalTasks || 0;
        const water = (profileData as any).totalWaterGlasses || 0;
        const age = (profileData as any).appAge || 0;
        
        const base = 1000;
        const taskScore = tasksDone * 250;
        const waterScore = water * 500;
        const streakScore = streak * 1000;
        const ageScore = age * 200;
        
        const newCredits = base + taskScore + waterScore + streakScore + ageScore;
        
        if (profileData.slakeCredits !== newCredits) {
             updateUserProfileData({ slakeCredits: newCredits });
             setCredits(newCredits);
        } else {
             setCredits(profileData.slakeCredits);
        }
    }
  }, [profileData?.streak?.highestStreak, (profileData as any)?.totalTasks, (profileData as any)?.totalWaterGlasses, (profileData as any)?.appAge, profileData?.slakeCredits, updateUserProfileData]);

  const userCurrency = (profileData?.currency || "INR").toUpperCase();
  const cSym = userCurrency === "USD" ? "$" : userCurrency === "EUR" ? "€" : "₹";
  const userAvatar = profileData?.displayPicture || "https://i.pravatar.cc/150?u=you";
  const userName = profileData?.displayName || user?.displayName || "You";
  
  const [downloading, setDownloading] = useState<string | null>(null);
  const [liveLeaderboard, setLiveLeaderboard] = useState<any[]>([]);
  
  const [redemptionModalOpen, setRedemptionModalOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [upiId, setUpiId] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionSuccess, setRedemptionSuccess] = useState(false);

  useEffect(() => {
     const q = query(collection(db, "users"));
     const unsubscribe = onSnapshot(q, (snapshot) => {
         const members: any[] = [];
         snapshot.forEach(doc => {
             const data = doc.data() as UserProfile;
             const uid = data.userId || doc.id;
             members.push({
                 id: uid,
                 name: data.displayName || "Anonymous Reformer",
                 avatar: data.displayPicture || `https://api.dicebear.com/9.x/avataaars/svg?seed=${uid}`,
                 streak: data.streak?.currentStreak || 0,
                 coins: data.slakeCredits || 0,
                 daysElapsed: data.streak?.highestStreak || 0,
                 certificates: Math.floor((data.streak?.highestStreak || 0) / 3) + Math.floor(((data as any).totalTasks || 0) / 10),
                 city: data.region?.includes('/') ? data.region.split('/').reverse()[0].replace('_', ' ') : (data.region || "Global"),
                 routine: data.profile || "General",
                 isMe: uid === profileData?.userId
             });
         });
         members.sort((a, b) => b.streak - a.streak || b.coins - a.coins);
         setLiveLeaderboard(members);
     });
     
     return () => unsubscribe();
  }, [profileData?.userId]);

  const rewardItems = [
    { id: 1, name: "Direct Payout", desc: "₹10 transferred directly", credits: 10000, img: cSym },
    { id: 2, name: `Riderz Hub Cafe Coins`, desc: "₹59 value. Follow hydration goals for first 3 days", credits: 60000, img: "☕" },
    { id: 3, name: "Amazon Voucher", desc: "Minimum ₹99 voucher", credits: 100000, img: "🛒" },
    { id: 4, name: "NimkiThekua Box", desc: "For 1 Week Hydration Master", credits: 1000000, img: "🍪" },
    { id: 5, name: "Solana Crypto (INR 500)", desc: "5M Coins redeemed to ₹500 Solana", credits: 5000000, img: "💎" },
    { id: 6, name: "Bitcoin (INR 500)", desc: "5M Coins redeemed to ₹500 BTC", credits: 5000000, img: "₿" },
    { id: 7, name: "Ethereum (INR 500)", desc: "5M Coins redeemed to ₹500 ETH", credits: 5000000, img: "Ξ" },
  ];

  const { tasks } = useTasks();

  const activeDates = new Set<string>();
  tasks.filter(t => t.completed).forEach(t => {
      if (t.createdAt) activeDates.add(new Date(t.createdAt).toISOString().split('T')[0]);
  });
  const dates = Array.from(activeDates).sort((a,b) => b.localeCompare(a));
  
  let highestStreakLocal = profileData?.streak?.highestStreak || 1;
  if (dates.length > 0) {
      let computedHighestStreak = 1;
      let tempStreak = 1;
      for (let i = 0; i < dates.length - 1; i++) {
          const diffTime = new Date(dates[i]).getTime() - new Date(dates[i+1]).getTime();
          if (Math.abs(diffTime - 86400000) < 3600000) { 
              tempStreak++;
              if (tempStreak > computedHighestStreak) computedHighestStreak = tempStreak;
          } else {
              tempStreak = 1;
          }
      }
      highestStreakLocal = Math.max(highestStreakLocal, computedHighestStreak);
  }
  const highestStreak = highestStreakLocal;
  
  const waterGlasses = tasks.filter(t => t.completed && t.name.toLowerCase().includes('water')).length;
  const emailsChecked = tasks.filter(t => t.completed && t.name.toLowerCase().includes('mail')).length;
  const mealsLogged = tasks.filter(t => t.completed && ['breakfast', 'lunch', 'dinner', 'snack'].some(m => t.name.toLowerCase().includes(m))).length;
  const workouts = tasks.filter(t => t.completed && ['workout', 'exercise', 'gym'].some(w => t.name.toLowerCase().includes(w))).length;
  const totalAllTasks = tasks.filter(t => t.completed).length;
  const appAgeDays = (profileData as any)?.appAge || 0;

  const certificates = [
    { id: "cert-basic-hydro", title: "Basic Hydration", desc: "Drinking a glass of water 3 times.", progress: Math.min((waterGlasses / 3) * 100, 100), current: Math.min(waterGlasses, 3), total: 3, icon: Droplet, color: "from-blue-200 to-blue-400", label: "Starter" },
    { id: "cert-master-hydro", title: "Master Hydration", desc: "Maintaining an 8-glass weekly streak.", progress: Math.min((waterGlasses / 56) * 100, 100), current: Math.min(waterGlasses, 56), total: 56, icon: Droplet, color: "from-blue-500 to-cyan-600", label: "Master" },
    { id: "cert-legendary-hydro", title: "Hydration Legend", desc: "Consumed 100 glasses of water.", progress: Math.min((waterGlasses / 100) * 100, 100), current: Math.min(waterGlasses, 100), total: 100, icon: Droplet, color: "from-cyan-400 to-teal-400", label: "Legend" },
    { id: "cert-inbox", title: "Inbox Zero Starter", desc: "Checking mail for the first time with the app timer.", progress: Math.min((emailsChecked / 1) * 100, 100), current: Math.min(emailsChecked, 1), total: 1, icon: Mail, color: "from-purple-400 to-indigo-500", label: "Productivity" },
    { id: "cert-task-master", title: "Task Mastery", desc: "Completed 50 diverse tasks.", progress: Math.min((totalAllTasks / 50) * 100, 100), current: Math.min(totalAllTasks, 50), total: 50, icon: Star, color: "from-yellow-400 to-orange-500", label: "Elite Achiever" },
    { id: "cert-focus-titan", title: "Deep Focus Titan", desc: "Completed 100 diverse tasks.", progress: Math.min((totalAllTasks / 100) * 100, 100), current: Math.min(totalAllTasks, 100), total: 100, icon: Flame, color: "from-red-500 to-rose-700", label: "Titan" },
    { id: "cert-nutrition-base", title: "Nutritional Consistency (Basic)", desc: "Breakfast, lunch, snacks, & dinner logged on point.", progress: Math.min((mealsLogged / 3) * 100, 100), current: Math.min(mealsLogged, 3), total: 3, icon: Coffee, color: "from-orange-300 to-orange-500", label: "Starter Tracker" },
    { id: "cert-commitment", title: "Iron Commitment Chaser", desc: "Logging in and exercising 3 times.", progress: Math.min((workouts / 3) * 100, 100), current: Math.min(workouts, 3), total: 3, icon: Dumbbell, color: "from-gray-600 to-gray-800", label: "Body Fitness" },
    { id: "cert-legacy", title: "Legacy Reformer", desc: "30 Days of App usage.", progress: Math.min((appAgeDays / 30) * 100, 100), current: Math.min(appAgeDays, 30), total: 30, icon: Crown, color: "from-amber-300 to-yellow-600", label: "Veteran" },
  ];

  const exportCertificate = async (id: string, name: string) => {
    setDownloading(id);
    const element = document.getElementById(id);
    if (!element) { setDownloading(null); return; }
    try {
      const canvas = await html2canvas(element, { scale: 3, backgroundColor: null });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Slake_${name.replace(/\s+/g, "_")}_Certificate.png`;
      link.click();
    } catch(e) {
      console.error(e);
    } finally {
      setDownloading(null);
    }
  };

  const pinCertificate = async (certId: string, certTitle: string) => {
      if (!user) return;
      const currentPins = profileData?.pinnedCertificateIds || [];
      const isPinned = currentPins.includes(certId);
      try {
          const { arrayUnion, arrayRemove, doc, updateDoc } = await import("firebase/firestore");
          const userRef = doc(db, "users", user.uid);
          if (!isPinned) {
              await updateDoc(userRef, { pinnedCertificateIds: arrayUnion(certId) });
              updateUserProfileData({ pinnedCertificateIds: [...currentPins, certId] });
              alert(`Successfully Pinned ${certTitle} to your Reformers Profile!`);
          } else {
              await updateDoc(userRef, { pinnedCertificateIds: arrayRemove(certId) });
              updateUserProfileData({ pinnedCertificateIds: currentPins.filter(id => id !== certId) });
              alert(`Removed ${certTitle} from your Profile.`);
          }
      } catch (error) {
          console.error("Error pinning certificate:", error);
      }
  };

  const handleRedeemClick = (item: any) => {
      setSelectedReward(item);
      setRedemptionModalOpen(true);
      setRedemptionSuccess(false);
      setUpiId("");
  };

  const submitRedemption = async () => {
      if (!user || !selectedReward || !upiId.trim()) return;
      setIsRedeeming(true);
      try {
          const { addDoc, collection, serverTimestamp, doc, updateDoc, increment } = await import("firebase/firestore");
          
          const userName = profileData?.displayName || user.displayName || "Anonymous";
          const userEmail = profileData?.email || user.email || "No Email";

          await addDoc(collection(db, "redemption_requests"), {
              userId: user.uid,
              userName,
              userEmail,
              amount: selectedReward.credits / 1000,
              creditsRedeemed: selectedReward.credits,
              upiId: upiId.trim(),
              status: 'pending',
              timestamp: serverTimestamp(),
              rewardName: selectedReward.name
          });

          // Add to admin_notifications collection in Firestore
          try {
              await addDoc(collection(db, "admin_notifications"), {
                  type: "REDEMPTION_REQUEST",
                  title: `🎁 Redemption: ${selectedReward.name}`,
                  message: `${userName} (${userEmail}) redeemed ${selectedReward.name} for ${selectedReward.credits.toLocaleString()} DM Coins. UPI ID: ${upiId.trim()}`,
                  userId: user.uid,
                  userName,
                  userEmail,
                  rewardName: selectedReward.name,
                  creditsRedeemed: selectedReward.credits,
                  amount: selectedReward.credits / 1000,
                  upiId: upiId.trim(),
                  timestamp: serverTimestamp(),
                  read: false
              });
          } catch (e) {
              console.error("Error creating admin_notification doc:", e);
          }

          // Trigger server API to send FCM Push Notification & chat message to Admin Shyam Pandey
          try {
              fetch("/api/notify-admin-redemption", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                      userId: user.uid,
                      userName,
                      userEmail,
                      rewardName: selectedReward.name,
                      amount: selectedReward.credits / 1000,
                      creditsRedeemed: selectedReward.credits,
                      upiId: upiId.trim()
                  })
              }).catch(err => console.error("API notification error:", err));
          } catch (apiErr) {
              console.error("Failed to trigger admin notification API:", apiErr);
          }

          const newBalance = credits - selectedReward.credits;
          setCredits(newBalance);
          updateUserProfileData({ slakeCredits: newBalance, slakeBalance: newBalance });
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, {
              slakeCredits: increment(-selectedReward.credits),
              slakeBalance: increment(-selectedReward.credits)
          });
          setRedemptionSuccess(true);
          setTimeout(() => {
              setRedemptionModalOpen(false);
              setIsRedeeming(false);
          }, 2000);
      } catch (error) {
          console.error("Redemption failed:", error);
          setIsRedeeming(false);
      }
  };

  return (
    <div className="space-y-6">
        <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="flex w-full mb-8 bg-card/80 backdrop-blur-md h-14 rounded-2xl shadow-sm border border-border/50 overflow-x-auto no-scrollbar justify-start sm:justify-center p-1">
                <TabsTrigger value="dashboard" className="flex-1 sm:flex-none sm:px-8 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold whitespace-nowrap">Dashboard</TabsTrigger>
                <TabsTrigger value="redeem" className="flex-1 sm:flex-none sm:px-8 rounded-xl data-[state=active]:bg-indigo-500 data-[state=active]:text-white font-bold whitespace-nowrap">Redeem</TabsTrigger>
                <TabsTrigger value="certificates" className="flex-1 sm:flex-none sm:px-8 rounded-xl data-[state=active]:bg-yellow-500 data-[state=active]:text-white font-bold whitespace-nowrap">Certificates</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none mix-blend-overlay">
                            <Zap className="w-40 h-40" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-lg font-medium text-white/90">DM Coins</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-3 z-10 relative">
                                <span className="text-6xl font-black tracking-tighter drop-shadow-md">{credits.toLocaleString()}</span>
                                <span className="text-2xl pb-1 font-bold text-white/90">DM Coins</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-card/40 border-white/5 backdrop-blur-md shadow-lg rounded-2xl hover:border-white/10 transition-all duration-300">
                        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="w-5 h-5 text-purple-500" /> Goal Progress</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-4 p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/15 transition-all">
                                <Flame className="w-6 h-6 text-orange-500 flex-shrink-0" />
                                <div className="w-full min-w-0">
                                    <div className="flex justify-between items-center">
                                       <h4 className="font-bold text-sm text-white/95">Consistent Login</h4>
                                       <span className="text-xs font-bold text-orange-500 flex-shrink-0">{highestStreak} / 30 Days</span>
                                    </div>
                                    <Progress value={Math.min((highestStreak / 30)*100, 100)} className="h-1.5 mt-2 bg-background" />
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition-all">
                                <Droplet className="w-6 h-6 text-blue-400 flex-shrink-0" />
                                <div className="w-full min-w-0">
                                    <div className="flex justify-between items-center">
                                       <h4 className="font-bold text-sm text-white/95">Hydration Target</h4>
                                       <span className="text-xs font-bold text-blue-400 flex-shrink-0">{waterGlasses} / 100 Glasses</span>
                                    </div>
                                    <Progress value={Math.min((waterGlasses / 100)*100, 100)} className="h-1.5 mt-2 bg-background" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/40 border-white/5 backdrop-blur-md shadow-lg rounded-2xl hover:border-white/10 transition-all duration-300">
                        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Award className="w-5 h-5 text-yellow-500" /> Quick Stats</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="bg-muted/30 p-3 rounded-xl flex items-center justify-between gap-2 border border-white/5 hover:bg-muted/40 transition-all">
                                <div className="space-y-1 min-w-0">
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider truncate">Tasks Done</p>
                                    <p className="text-xl font-black text-white">{totalAllTasks}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20 flex-shrink-0">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-xl flex items-center justify-between gap-2 border border-white/5 hover:bg-muted/40 transition-all">
                                <div className="space-y-1 min-w-0">
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider truncate">Hydration</p>
                                    <p className="text-xl font-black text-blue-400">{waterGlasses}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex-shrink-0">
                                    <Droplet className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-xl flex items-center justify-between gap-2 border border-white/5 hover:bg-muted/40 transition-all">
                                <div className="space-y-1 min-w-0">
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider truncate">Days Active</p>
                                    <p className="text-xl font-black text-purple-400">{appAgeDays}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex-shrink-0">
                                    <Zap className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-xl flex items-center justify-between gap-2 border border-white/5 hover:bg-muted/40 transition-all">
                                <div className="space-y-1 min-w-0">
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider truncate">Badges</p>
                                    <p className="text-xl font-black text-yellow-500">{certificates.filter(c => c.progress >= 100).length}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex-shrink-0">
                                    <Trophy className="w-4 h-4" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="redeem" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rewardItems.map((item, idx) => {
                    const isUnlocked = credits >= item.credits;
                    const progress = Math.min((credits / item.credits) * 100, 100);
                    return (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                            <Card className={`bg-card/40 border-white/5 backdrop-blur-md shadow-lg rounded-2xl hover:border-white/10 transition-all duration-300 h-full flex flex-col ${isUnlocked ? 'border-primary/40 bg-primary/5' : ''}`}>
                                <CardHeader className="pb-2 flex-grow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-muted/40 border border-white/5 shadow-sm rounded-xl text-3xl font-bold flex items-center justify-center w-14 h-14">{item.img}</div>
                                        <Badge variant={isUnlocked ? "default" : "secondary"} className="font-mono font-bold bg-white/5 border-white/5 text-foreground">{item.credits.toLocaleString()} DM</Badge>
                                    </div>
                                    <CardTitle className="text-lg leading-tight font-bold">{item.name}</CardTitle>
                                    <CardDescription className="text-sm mt-1 text-muted-foreground">{item.desc}</CardDescription>
                                </CardHeader>
                                <CardFooter className="pt-2">
                                    <Button className="w-full font-bold h-11 rounded-xl transition-all" variant={isUnlocked ? "default" : "secondary"} disabled={!isUnlocked} onClick={() => handleRedeemClick(item)}>
                                        {isUnlocked ? "Redeem Now" : `Progress: ${Math.floor(progress)}%`}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    )
                })}
            </TabsContent>

            <TabsContent value="certificates" className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {certificates.map((cert, idx) => {
                    const IconComponent = cert.icon;
                    const isUnlocked = cert.progress >= 100;
                    return (
                        <motion.div key={cert.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} className="flex flex-col gap-3">
                            <div id={cert.id} className={`relative overflow-hidden rounded-2xl p-6 border-2 shadow-2xl flex flex-col justify-between min-h-[200px] ${isUnlocked ? `border-transparent bg-gradient-to-br ${cert.color} text-white` : 'border-white/5 bg-card/40 backdrop-blur-md text-muted-foreground grayscale'}`}>
                                <div className="absolute top-0 right-0 -mt-6 -mr-6 opacity-20 rotate-12 pointer-events-none mix-blend-overlay">
                                    <IconComponent className="w-48 h-48" />
                                </div>
                                <div className="relative z-10 flex flex-col h-full">
                                    <h3 className="text-xl font-black mb-1 drop-shadow-md">{cert.title}</h3>
                                    <p className="text-xs font-medium mb-4">{cert.desc}</p>
                                    <div className="mt-auto space-y-1">
                                        <div className="flex justify-between items-end">
                                            <p className="text-[10px] font-black uppercase tracking-widest">{isUnlocked ? 'UNLOCKED' : 'IN PROGRESS'}</p>
                                            <p className="text-xs font-bold">{cert.current} / {cert.total}</p>
                                        </div>
                                        <Progress value={cert.progress} className={`h-1.5 ${isUnlocked ? '[&>div]:bg-white bg-black/20' : ''}`} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" disabled={!isUnlocked} className="flex-1 font-bold text-xs h-10 rounded-xl bg-card/40 border-white/5 hover:bg-card/60 hover:text-white" onClick={() => exportCertificate(cert.id, cert.title)}>
                                    {downloading === cert.id ? "Rendering..." : "Export"}
                                </Button>
                                <Button variant="outline" disabled={!isUnlocked} className="flex-1 font-bold text-xs h-10 rounded-xl bg-card/40 border-white/5 hover:bg-card/60 hover:text-white" onClick={() => pinCertificate(cert.id, cert.title)}>
                                    {(profileData?.pinnedCertificateIds || []).includes(cert.id) ? 'Pinned' : 'Pin to Profile'}
                                </Button>
                            </div>
                        </motion.div>
                    )
                })}
            </TabsContent>
        </Tabs>

        {selectedReward && (
            <Dialog open={redemptionModalOpen} onOpenChange={setRedemptionModalOpen}>
                <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Gift className="w-5 h-5 text-indigo-500" /> Redeem {selectedReward.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {redemptionSuccess ? (
                            <div className="flex flex-col items-center justify-center py-6 space-y-4">
                                <CheckCircle2 className="w-12 h-12 text-green-500" />
                                <h3 className="text-xl font-bold">Redemption Sent!</h3>
                            </div>
                        ) : (
                            <>
                                <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="UPI ID (e.g. name@ybl)" className="h-12 bg-muted/50 border-none" disabled={isRedeeming} />
                                <Button onClick={submitRedemption} disabled={!upiId.trim() || isRedeeming} className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                                    {isRedeeming ? "Processing..." : "Confirm Redemption"}
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        )}
    </div>
  );
}
