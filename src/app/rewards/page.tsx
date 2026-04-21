"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from "recharts";
import { Award, Zap, Trophy, TrendingUp, Medal, Flame, Star, Crown, Gift, Share2, Download, Droplet, Mail, Coffee, Dumbbell, Wind, Eye, Heart, Pin, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useFirestore";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import type { UserProfile } from "@/types";

const streakData = [
  { day: "Mon", percent: 100 },
  { day: "Tue", percent: 80 },
  { day: "Wed", percent: 100 },
  { day: "Thu", percent: 40 },
  { day: "Fri", percent: 100 },
  { day: "Sat", percent: 60 },
  { day: "Sun", percent: 90 },
];

export default function RewardsPage() {
  const { profileData, updateUserProfileData } = useProfile();
  const { user } = useAuth();
  const router = useRouter();
  
  const [credits, setCredits] = useState(profileData?.slakeCredits || 0);
  
  useEffect(() => {
    if (profileData) {
        // Eager Calculation Algorithm to reward active, long-term users
        const streak = profileData.streak?.highestStreak || 0;
        const tasksDone = (profileData as any).totalTasks || 0;
        const water = (profileData as any).totalWaterGlasses || 0;
        const age = (profileData as any).appAge || 0;
        
        // Generous point system based on retro logs
        const base = 1000;
        const taskScore = tasksDone * 250;     // 250 coins per task
        const waterScore = water * 500;        // 500 coins per water
        const streakScore = streak * 1000;     // 1000 coins per streak day
        const ageScore = age * 200;            // 200 coins per day since joining
        
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
         // Rank based on usage/streaks and coins
         members.sort((a, b) => b.streak - a.streak || b.coins - a.coins);
         setLiveLeaderboard(members);
     });
     
     return () => unsubscribe();
  }, [profileData?.userId]);

  // Simplify redemption options
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
  
  let currentStreakLocal = 0;
  let highestStreakLocal = profileData?.streak?.highestStreak || 1;
  const today = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

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

  const highestStreak = highestStreakLocal;
  
  // Custom tracking for specific certificates
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
      const currentPins = profileData?.pinnedCertificates || [];
      if (!currentPins.includes(certId)) {
          await updateUserProfileData({ pinnedCertificates: [...currentPins, certId] });
          alert(`Successfully Pinned ${certTitle} to your Reformers Profile!`);
      } else {
          alert(`${certTitle} is already pinned!`);
      }
  };

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-background to-background/50 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 space-y-6 pt-12">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8"
        >
            <div className="flex-1 text-center sm:text-left">
                <h1 className="text-4xl font-extrabold tracking-tight flex items-center justify-center sm:justify-start gap-3">
                    <Trophy className="w-10 h-10 text-yellow-500 fill-current drop-shadow-md" />
                    Achievement Center
                </h1>
                <p className="text-muted-foreground text-lg">Earn credits, redeem rewards, and share your success.</p>
            </div>
            <Button 
                variant="ghost" 
                onClick={() => router.push('/reformers')}
                className="flex items-center gap-3 p-2 h-auto rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/50 transition-all group"
            >
                <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-foreground">{userName}</p>
                    <p className="text-[10px] text-primary font-black uppercase tracking-tighter">View Profile</p>
                </div>
                <Avatar className="w-12 h-12 border-2 border-transparent group-hover:border-primary/50 transition-all">
                    <AvatarImage src={userAvatar} />
                    <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                </Avatar>
            </Button>
        </motion.div>

        <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-card/80 backdrop-blur-md h-14 rounded-2xl shadow-sm border border-border/50">
                <TabsTrigger value="dashboard" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">Dashboard</TabsTrigger>
                <TabsTrigger value="redeem" className="rounded-xl data-[state=active]:bg-indigo-500 data-[state=active]:text-white font-bold">Redeem</TabsTrigger>
                <TabsTrigger value="certificates" className="rounded-xl data-[state=active]:bg-yellow-500 data-[state=active]:text-white font-bold">Certificates</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
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
                                <span className="text-2xl pb-1 font-bold text-white/90">SC</span>
                            </div>
                            <p className="mt-4 text-sm text-white/80 max-w-[280px] relative z-10 font-medium">
                                Keep grinding your daily tasks to unlock more rewards!
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <div className="grid grid-cols-1 gap-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <Card className="h-full border-border/50 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Crown className="w-5 h-5 text-yellow-500" />
                                    Global Leaderboard (Real-Time)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {liveLeaderboard.length === 0 && <p className="text-sm text-muted-foreground text-center">Syncing players...</p>}
                                    {liveLeaderboard.map((u, idx) => (
                                        <div 
                                            key={u.id} 
                                            onClick={() => router.push('/reformers')}
                                            className={`cursor-pointer flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl transition-all duration-300 transform hover:scale-[1.01] ${u.isMe ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30 hover:bg-muted/50 border border-transparent'}`}
                                        >
                                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                                <span className={`w-8 text-center font-black text-xl flex-shrink-0 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-muted-foreground/50'}`}>
                                                    #{idx + 1}
                                                </span>
                                                <Avatar className="w-10 h-10 border border-border">
                                                    <AvatarImage src={u.avatar} />
                                                    <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col flex-grow">
                                                    <span className={`font-bold text-base flex items-center gap-2 ${u.isMe ? 'text-primary' : ''}`}>
                                                        {u.name} {u.isMe && "(You)"}
                                                    </span>
                                                    <span className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" /> {u.city} • <span className="text-primary">{u.routine}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 sm:ml-auto w-full sm:w-auto overflow-x-auto pb-1 mt-2 sm:mt-0">
                                                <Badge variant="secondary" className="flex items-center gap-1 font-bold whitespace-nowrap bg-background">
                                                    <Flame className="w-3 h-3 text-orange-500" />
                                                    {u.streak} Days
                                                </Badge>
                                                <Badge variant="secondary" className="flex items-center gap-1 font-bold whitespace-nowrap bg-background">
                                                    <Zap className="w-3 h-3 text-indigo-500" />
                                                    {u.coins.toLocaleString()} SC
                                                </Badge>
                                                <Badge variant="secondary" className="flex items-center gap-1 font-bold whitespace-nowrap bg-background">
                                                    <Medal className="w-3 h-3 text-yellow-500" />
                                                    {u.certificates} Ctd
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                    
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card className="h-full border-border/50 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-purple-500" />
                                    Recent Gamification Progress
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                    <div className="p-2 rounded-full bg-orange-500/20 shrink-0">
                                        <Flame className="w-6 h-6 text-orange-500" />
                                    </div>
                                    <div className="w-full">
                                        <div className="flex justify-between items-center">
                                           <h4 className="font-bold text-sm">Consistent Login</h4>
                                           <span className="text-xs font-bold text-orange-500">{highestStreak} / 30 Days</span>
                                        </div>
                                        <Progress value={Math.min((highestStreak / 30)*100, 100)} className="h-1.5 mt-2 bg-background" />
                                        <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-tight">On track for Solana Crypto Redemptions</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </TabsContent>

            <TabsContent value="redeem" className="space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {rewardItems.map((item, idx) => {
                        const isUnlocked = credits >= item.credits;
                        const progress = Math.min((credits / item.credits) * 100, 100);
                        return (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                            <Card className={`border-border/50 shadow-md transition-all duration-300 h-full flex flex-col ${isUnlocked ? 'border-primary/50 bg-primary/5' : ''}`}>
                                <CardHeader className="pb-2 flex-grow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-card border shadow-sm rounded-xl text-3xl font-bold flex items-center justify-center">{item.img}</div>
                                        <Badge variant={isUnlocked ? "default" : "secondary"} className="font-mono font-bold">
                                            {item.credits.toLocaleString()} SC
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg leading-tight">{item.name}</CardTitle>
                                    <CardDescription className="text-sm mt-1">{item.desc}</CardDescription>
                                </CardHeader>
                                <CardContent className="pb-2">
                                    <div className="space-y-1 mt-2">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                           <span>Progress</span>
                                           <span>{Math.floor(progress)}%</span>
                                        </div>
                                        <Progress value={progress} className={`h-2 ${isUnlocked ? '[&>div]:bg-primary' : '[&>div]:bg-muted-foreground'}`} />
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-2">
                                    <Button className="w-full font-bold" variant={isUnlocked ? "default" : "secondary"} disabled={!isUnlocked}>
                                        {isUnlocked ? "Redeem Now" : "Keep Grinding"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    )})}
                 </div>
            </TabsContent>

            <TabsContent value="certificates" className="space-y-6">
                <p className="text-muted-foreground text-center mb-6">Complete milestones to unlock master tiers and pin them to your Reformers Dashboard.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {certificates.map((cert, idx) => {
                        const IconComponent = cert.icon;
                        const isUnlocked = cert.progress >= 100;
                        return (
                            <motion.div key={cert.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} className="flex flex-col gap-3">
                                <div id={cert.id} className={`relative overflow-hidden rounded-2xl p-6 border-2 shadow-2xl flex flex-col justify-between min-h-[220px] transition-all ${isUnlocked ? `border-transparent bg-gradient-to-br ${cert.color} text-white` : 'border-border bg-card/60 text-muted-foreground grayscale-[0.8]'}`}>
                                    <div className="absolute top-0 right-0 -mt-6 -mr-6 opacity-20 rotate-12 pointer-events-none mix-blend-overlay">
                                        <IconComponent className="w-48 h-48" />
                                    </div>
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex justify-between items-start">
                                            <Badge className={`border-none font-bold tracking-widest uppercase text-[10px] mb-4 ${isUnlocked ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-muted text-muted-foreground'}`}>
                                                {cert.label}
                                            </Badge>
                                        </div>
                                        
                                        <h3 className={`text-2xl font-black mb-2 leading-tight drop-shadow-md ${!isUnlocked && 'text-foreground/70'}`}>{cert.title}</h3>
                                        <p className={`text-sm font-medium max-w-[80%] drop-shadow-sm mb-4 ${!isUnlocked ? 'text-muted-foreground' : 'text-white/90'}`}>{cert.desc}</p>
                                        
                                        <div className="mt-auto space-y-1">
                                            <div className="flex justify-between items-end">
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${isUnlocked ? 'text-white/70' : 'text-muted-foreground'}`}>
                                                    {isUnlocked ? 'UNLOCKED' : 'IN PROGRESS'}
                                                </p>
                                                <p className={`text-xs font-bold ${isUnlocked ? 'text-white' : 'text-foreground'}`}>
                                                    {cert.current} / {cert.total}
                                                </p>
                                            </div>
                                            <Progress value={cert.progress} className={`h-1.5 ${isUnlocked ? '[&>div]:bg-white bg-black/20' : ''}`} />
                                        </div>
                                    </div>
                                    {isUnlocked && (
                                        <div className="relative z-10 flex border-t border-white/20 pt-4 mt-6 items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Award className="w-5 h-5 text-yellow-300 fill-yellow-300/50" />
                                                <span className="text-xs font-bold uppercase tracking-wider drop-shadow-sm">Slake Certified {userName}</span>
                                            </div>
                                            <span className="text-[10px] font-bold opacity-70">DATE: {new Date().toLocaleDateString('en-GB')}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" disabled={!isUnlocked} className="flex-1 border-border/50 shadow-sm font-bold bg-muted/30" onClick={() => exportCertificate(cert.id, cert.title)}>
                                        {downloading === cert.id ? <span className="animate-pulse">Rendering...</span> : <><Download className="w-4 h-4 mr-2" /> Export</>}
                                    </Button>
                                    <Button variant="outline" disabled={!isUnlocked} className="flex-1 border-border/50 shadow-sm font-bold bg-muted/30 text-primary hover:text-primary" onClick={() => pinCertificate(cert.id, cert.title)}>
                                        <Pin className="w-4 h-4 mr-2" /> Pin to Profile
                                    </Button>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
