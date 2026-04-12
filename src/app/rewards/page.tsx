"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from "recharts";
import { Award, Zap, Trophy, TrendingUp, Medal, Flame, Star, Crown, Gift, Share2, Download, Droplet, Mail, Coffee, Dumbbell, Wind, Eye, Heart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import html2canvas from "html2canvas";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

const streakData = [
  { day: "Mon", percent: 100 },
  { day: "Tue", percent: 80 },
  { day: "Wed", percent: 100 },
  { day: "Thu", percent: 40 },
  { day: "Fri", percent: 100 },
  { day: "Sat", percent: 60 },
  { day: "Sun", percent: 90 },
];

const certificates = [
  { id: "cert-hydro", title: "Master of Hydration", desc: "Logged 100% water intake for 7 straight days.", icon: Droplet, color: "from-blue-400 to-cyan-500", text: "text-blue-500", label: "Hydration Streak" },
  { id: "cert-mail", title: "Inbox Zero Hero", desc: "Checked & cleared mail precisely on time.", icon: Mail, color: "from-purple-400 to-indigo-500", text: "text-purple-500", label: "Productivity" },
  { id: "cert-meals", title: "Nutritional Consistency", desc: "Breakfast, lunch, snacks, & dinner logged on point.", icon: Coffee, color: "from-orange-400 to-red-500", text: "text-orange-500", label: "Diet Tracker" },
  { id: "cert-exercise", title: "Iron Commitment", desc: "Hit all exercise tasks without a single skip.", icon: Dumbbell, color: "from-gray-700 to-gray-900", text: "text-gray-800", label: "Body Fitness" },
  { id: "cert-breath", title: "Zen Mindset", desc: "Dedicated sessions to deep breathing.", icon: Wind, color: "from-teal-400 to-emerald-500", text: "text-teal-500", label: "Mental Health" },
  { id: "cert-eye", title: "Digital Defender", desc: "Protected vision with scheduled eye strain exercises.", icon: Eye, color: "from-pink-400 to-rose-500", text: "text-rose-500", label: "Eye Care" },
];

export default function RewardsPage() {
  const { profileData } = useProfile();
  const { user } = useAuth();
  
  // Realtime Integration
  const credits = profileData?.slakeCredits || 1450;
  const userCurrency = (profileData?.currency || "INR").toUpperCase();
  const cSym = userCurrency === "USD" ? "$" : userCurrency === "EUR" ? "€" : "₹";
  const userAvatar = profileData?.displayPicture || "https://i.pravatar.cc/150?u=you";
  const userName = profileData?.displayName || user?.displayName || "You";
  
  const [downloading, setDownloading] = useState<string | null>(null);

  // Dynamic reward items based on currency
  const rewardItems = [
    { id: 1, name: "Direct App Payout", desc: `Transfer directly to back in ${userCurrency}`, credits: 5000, img: cSym },
    { id: 2, name: `Amazon Voucher (${cSym}10+)`, desc: "Shop online instantly", credits: 8000, img: "🛒" },
    { id: 3, name: "NimkiThekua Box", desc: "Authentic local treats", credits: 4000, img: "🍪" },
    { id: 4, name: "Solana Crypto Drop", desc: "0.05 SOL to your wallet", credits: 10000, img: "💎" },
  ];

  // Dynamic Leaderboard (inserting realtime user naturally)
  const leaderboard = [
    { id: 1, name: "Alice K.", streak: 45, avatar: "https://i.pravatar.cc/150?u=1", isMe: false },
    { id: 2, name: "Bob M.", streak: 38, avatar: "https://i.pravatar.cc/150?u=2", isMe: false },
    { id: 3, name: userName, streak: profileData?.streak?.currentStreak || 21, avatar: userAvatar, isMe: true },
    { id: 4, name: "Zara L.", streak: 15, avatar: "https://i.pravatar.cc/150?u=4", isMe: false },
    { id: 5, name: "David O.", streak: 12, avatar: "https://i.pravatar.cc/150?u=5", isMe: false },
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

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-background to-background/50 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 space-y-6 pt-12">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2 mb-8"
        >
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center justify-center gap-3">
                <Trophy className="w-10 h-10 text-yellow-500 fill-current drop-shadow-md" />
                Achievement Center
            </h1>
            <p className="text-muted-foreground text-lg">Earn credits, redeem rewards, and share your success.</p>
        </motion.div>

        <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-card/80 backdrop-blur-md h-14 rounded-2xl shadow-sm border border-border/50">
                <TabsTrigger value="dashboard" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">Dashboard</TabsTrigger>
                <TabsTrigger value="redeem" className="rounded-xl data-[state=active]:bg-indigo-500 data-[state=active]:text-white font-bold">Redeem</TabsTrigger>
                <TabsTrigger value="certificates" className="rounded-xl data-[state=active]:bg-yellow-500 data-[state=active]:text-white font-bold">Certificates</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
                {/* Slake Credits Card */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                    <Card className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none mix-blend-overlay">
                            <Zap className="w-40 h-40" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-lg font-medium text-white/90">Slake Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-3 z-10 relative">
                                <span className="text-6xl font-black tracking-tighter drop-shadow-md">{credits.toLocaleString()}</span>
                                <span className="text-2xl pb-1 font-bold text-white/90">SC</span>
                            </div>
                            <p className="mt-4 text-sm text-white/80 max-w-[280px] relative z-10 font-medium">
                                Complete daily tasks without breaking your combo to earn multipliers!
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Weekly Progress Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-lg relative overflow-hidden flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                                Weekly Streak
                            </CardTitle>
                            <CardDescription>Your daily task completion percentage</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="h-[200px] w-full mt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={streakData}>
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 12, fontWeight: 600 }} />
                                        <RechartsTooltip 
                                            cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-popover text-popover-foreground border border-border p-2 rounded-lg shadow-xl text-sm font-bold">
                                                            {payload[0].value}% Completed
                                                        </div>
                                                    )
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="percent" radius={[6, 6, 6, 6]}>
                                            {streakData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.percent === 100 ? '#10b981' : entry.percent > 50 ? '#3b82f6' : '#ef4444'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Leaderboard Section */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <Card className="h-full border-border/50 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Crown className="w-5 h-5 text-yellow-500" />
                                    Global Leaderboard ({profileData?.region || "Local"})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {leaderboard.map((u, idx) => (
                                        <div key={u.id} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${u.isMe ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}`}>
                                            <span className={`w-6 text-center font-bold text-sm ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                                                #{idx + 1}
                                            </span>
                                            <Avatar className="w-8 h-8 border border-border">
                                                <AvatarImage src={u.avatar} />
                                                <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className={`font-medium flex-1 text-sm ${u.isMe ? 'text-primary' : ''}`}>
                                                {u.name} {u.isMe && "(You)"}
                                            </span>
                                            <Badge variant="secondary" className="flex items-center gap-1 font-bold">
                                                <Flame className="w-3 h-3 text-orange-500" />
                                                {u.streak}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                    
                    {/* Badges Section */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card className="h-full border-border/50 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Medal className="w-5 h-5 text-purple-500" />
                                    Recent Gamification Sets
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="p-2 rounded-full bg-emerald-500/20 shrink-0">
                                        <Heart className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">Bio-Metric Synced</h4>
                                        <p className="text-xs text-muted-foreground mt-1">Google Fit connected! {(profileData?.weight || 0) > 0 ? "Analyzing metrics..." : ""}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                    <div className="p-2 rounded-full bg-orange-500/20 shrink-0">
                                        <Flame className="w-6 h-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">Morning-to-Evening</h4>
                                        <p className="text-xs text-muted-foreground mt-1">Completed the first and last task with no missing blocks in between.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 opacity-50 grayscale">
                                    <div className="p-2 rounded-full bg-blue-500/20 shrink-0">
                                        <Star className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">Perfect Week</h4>
                                        <p className="text-xs text-muted-foreground mt-1">Hit 100% completion for 7 days straight. (Locked)</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </TabsContent>

            <TabsContent value="redeem" className="space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {rewardItems.map((item, idx) => (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                            <Card className="border-border/50 shadow-md hover:shadow-xl transition-all duration-300">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 bg-muted rounded-xl text-3xl font-bold flex items-center justify-center">{item.img}</div>
                                        <Badge variant={credits >= item.credits ? "default" : "secondary"}>
                                            {item.credits.toLocaleString()} SC
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-lg mt-4">{item.name}</CardTitle>
                                    <CardDescription>{item.desc}</CardDescription>
                                </CardHeader>
                                <CardFooter>
                                    <Button className="w-full font-bold" variant={credits >= item.credits ? "default" : "secondary"} disabled={credits < item.credits}>
                                        {credits >= item.credits ? "Redeem Now" : "Not Enough Credits"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                 </div>
            </TabsContent>

            <TabsContent value="certificates" className="space-y-6">
                <p className="text-muted-foreground text-center mb-6">Complete streaks to unlock and showcase your discipline visually.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {certificates.map((cert, idx) => {
                        const IconComponent = cert.icon;
                        return (
                            <motion.div key={cert.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} className="flex flex-col gap-3">
                                {/* The Certificate Element to be captured */}
                                <div id={cert.id} className={`relative overflow-hidden rounded-2xl p-6 border-2 border-primary/10 shadow-2xl bg-gradient-to-br ${cert.color} text-white flex flex-col justify-between min-h-[220px]`}>
                                    <div className="absolute top-0 right-0 -mt-6 -mr-6 opacity-20 rotate-12 pointer-events-none mix-blend-overlay">
                                        <IconComponent className="w-48 h-48" />
                                    </div>
                                    <div className="relative z-10">
                                        <Badge className="bg-white/20 text-white hover:bg-white/30 border-none font-bold tracking-widest uppercase text-[10px] mb-4">
                                            {cert.label}
                                        </Badge>
                                        <h3 className="text-2xl font-black mb-2 leading-tight drop-shadow-md">{cert.title}</h3>
                                        <p className="text-sm text-white/90 font-medium max-w-[80%] drop-shadow-sm">{cert.desc}</p>
                                    </div>
                                    <div className="relative z-10 flex border-t border-white/20 pt-4 mt-6 items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Award className="w-5 h-5 text-yellow-300 fill-yellow-300/50" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Slake Certified {userName}</span>
                                        </div>
                                        <span className="text-[10px] font-bold opacity-70">DATE: {new Date().toLocaleDateString('en-GB')}</span>
                                    </div>
                                </div>
                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button variant="outline" className={`flex-1 ${cert.text} border-border/50 shadow-sm`} onClick={() => exportCertificate(cert.id, cert.title)}>
                                        {downloading === cert.id ? <span className="animate-pulse">Rendering...</span> : <><Download className="w-4 h-4 mr-2" /> Export Hub</>}
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
