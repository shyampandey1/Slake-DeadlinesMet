"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Globe2, ShieldCheck, MapPin, Activity, CheckCircle2, MessageSquare, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import type { UserProfile } from "@/types";

export default function ReformersPage() {
  const { profileData, updateUserProfileData } = useProfile();
  const { user } = useAuth();
  
  const isEnrolled = profileData?.isReformersEnrolled || false;
  const [enrolling, setEnrolling] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);

  // Sync states for legally compliant modal
  const [whatsappSync, setWhatsappSync] = useState(profileData?.googleSyncPermissions?.whatsapp || false);
  const [metaSync, setMetaSync] = useState(profileData?.googleSyncPermissions?.meta || false);
  const [linkedinSync, setLinkedinSync] = useState(profileData?.googleSyncPermissions?.linkedin || false);

  const [liveMembers, setLiveMembers] = useState<{ id: string; name: string; location: string; status: string; online: boolean; avatar: string; streak: number }[]>([]);

  useEffect(() => {
     if (!isEnrolled) return;
     
     const q = query(collection(db, "users"), where("isReformersEnrolled", "==", true));
     const unsubscribe = onSnapshot(q, (snapshot) => {
         const members: any[] = [];
         snapshot.forEach(doc => {
             const data = doc.data() as UserProfile;
             if (data.userId !== profileData?.userId) {
                 members.push({
                     id: data.userId,
                     name: data.displayName || "Anonymous Reformer",
                     location: data.region || "Global",
                     status: data.currentTaskStatus || "Idle",
                     online: !!data.isOnline,
                     avatar: data.displayPicture || "https://i.pravatar.cc/150",
                     streak: data.streak?.currentStreak || 0,
                 });
             }
         });
         // Sort online first, then by highest streak
         members.sort((a, b) => {
             if (a.online !== b.online) return a.online ? -1 : 1;
             return b.streak - a.streak;
         });
         setLiveMembers(members);
     });
     
     return () => unsubscribe();
  }, [isEnrolled, profileData?.userId]);

  const handleEnroll = async () => {
    setEnrolling(true);
    setTimeout(() => {
       setEnrolling(false);
       setPermissionsModalOpen(true);
    }, 1500);
  };

  const handleSavePermissions = () => {
     updateUserProfileData({
        isReformersEnrolled: true,
        googleSyncPermissions: {
            whatsapp: whatsappSync,
            meta: metaSync,
            linkedin: linkedinSync
        }
     });
     setPermissionsModalOpen(false);
  };

  if (!isEnrolled && !enrolling && !permissionsModalOpen) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] pb-24 text-white p-4 pt-16 font-sans">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto space-y-6">
          <div className="text-center py-10">
            <div className="mx-auto w-24 h-24 mb-6 rounded-full bg-[#10b981]/20 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)]">
               <Globe2 className="w-12 h-12 text-[#10b981]" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white">Reformers League</h1>
            <p className="text-gray-400 text-lg leading-relaxed">Join an elite network of high-performers. Compete, collaborate, and sync your streak across platforms to stay hyper-accountable.</p>
          </div>
          
          <Card className="bg-[#1a1a1a] border-[#262626] shadow-2xl">
             <CardHeader>
                <CardTitle className="text-[#10b981] flex items-center gap-2"><ShieldCheck /> League Requirements</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4 text-gray-300">
               <div className="flex items-start gap-3">
                 <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />
                 <p className="text-sm">Public Profile listing displaying your streaks and custom Bio to your regional "node".</p>
               </div>
               <div className="flex items-start gap-3">
                 <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />
                 <p className="text-sm">Group Challenge Mode: Pool your achievements with local members for physical rewards (e.g., NimkiThekua vouchers).</p>
               </div>
               <div className="flex items-start gap-3">
                 <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />
                 <p className="text-sm">API Bindings to securely transmit your public milestones to LinkedIn and WhatsApp.</p>
               </div>
             </CardContent>
             <CardFooter>
                 <Button className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-extrabold py-6 rounded-xl text-lg transition-transform hover:scale-[1.02]" onClick={handleEnroll}>
                    {enrolling ? "Enrolling..." : "Become a Reformer"}
                 </Button>
             </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] pb-24 text-white">
      <div className="p-4 pt-12 max-w-4xl mx-auto space-y-6">
        
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-4">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                  <Globe2 className="text-[#10b981] w-6 h-6" /> League Feed
              </h1>
              <p className="text-xs text-[#10b981] font-bold mt-1 tracking-widest">{profileData?.region || "Gaya"} Node Server</p>
            </div>
            
            <Dialog open={permissionsModalOpen} onOpenChange={setPermissionsModalOpen}>
              <DialogTrigger asChild>
                  <Button variant="outline" className="border-[#262626] bg-[#1a1a1a] text-gray-300 hover:text-white hover:bg-[#262626]"><LayoutDashboard className="w-4 h-4 mr-2" />API Bindings</Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-[#262626] text-white sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-[#10b981] flex items-center gap-2 text-xl font-bold"><ShieldCheck /> Legal & API Consent</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    DeadlinesMet requires explicit consent to utilize OAuth payloads for exporting your data securely to third-party endpoints.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#262626]/30 border border-[#262626]">
                    <div>
                      <p className="font-medium text-sm">WhatsApp Reminders</p>
                      <p className="text-xs text-gray-500 max-w-[200px]">Send automated alerts to your accountability partner.</p>
                    </div>
                    <Switch checked={whatsappSync} onCheckedChange={setWhatsappSync} className="data-[state=checked]:bg-[#10b981]" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#262626]/30 border border-[#262626]">
                    <div>
                      <p className="font-medium text-sm">Instagram Share</p>
                      <p className="text-xs text-gray-500 max-w-[200px]">Post your completion cards to your stories.</p>
                    </div>
                    <Switch checked={metaSync} onCheckedChange={setMetaSync} className="data-[state=checked]:bg-[#10b981]" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#262626]/30 border border-[#262626]">
                    <div>
                      <p className="font-medium text-sm">LinkedIn Career Sync</p>
                      <p className="text-xs text-gray-500 max-w-[200px]">Publish productivity milestones to validate your discipline.</p>
                    </div>
                    <Switch checked={linkedinSync} onCheckedChange={setLinkedinSync} className="data-[state=checked]:bg-[#10b981]" />
                  </div>
                  
                  <div className="bg-[#10b981]/10 p-4 rounded-xl border border-[#10b981]/30 mt-4 space-y-2">
                    <h4 className="text-xs font-black text-[#10b981] uppercase tracking-wider">Privacy & Compliance Binding</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-medium">By enabling these connections, you authorize Slake-DeadlinesMet to issue temporary short-lived OAuth 2.0 access tokens. No PII (Personally Identifiable Information) out of scope of your generated 'Reward Certificates' will be transmitted. All requests adhere strictly to Meta App Policy limits and LinkedIn Developer Agreements.</p>
                  </div>
                </div>
                <DialogFooter className="border-t border-[#262626] pt-4 mt-2">
                  <Button onClick={handleSavePermissions} className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-extrabold text-sm h-12">Agree to Privacy Rules & Save Enclave</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>

        {/* Global Post Feed / Group Reward Engine Placeholder */}
        <div className="pt-2">
           <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#10b981]/30 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 mix-blend-overlay opacity-10">
                 <Globe2 className="w-48 h-48" />
              </div>
              <CardHeader className="relative z-10 pb-2">
                  <CardTitle className="text-[#10b981] flex items-center gap-2 text-xl font-black uppercase tracking-tight">Active Campaign: Regional Hydration</CardTitle>
                  <CardDescription className="text-gray-300 font-medium">[{profileData?.region || 'Gaya'} Local Node] - 14 Participants Engaged</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 relative z-10">
                  <div className="p-4 bg-[#262626]/50 rounded-xl border border-[#262626] shadow-inner">
                      <p className="text-sm leading-relaxed text-gray-200">
                        <span className="font-bold text-white">Objective:</span> If 10 Reformers in your local cluster complete their 8-glass water blocks consistently this week, the whole group unlocks a shared, fully funded voucher box for <span className="text-[#10b981]">NimkiThekua.in!</span>
                      </p>
                  </div>
                  <div className="space-y-2">
                      <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-gray-400 uppercase">Synchronized Progress</span>
                          <span className="text-xs font-bold text-[#10b981]">7 / 10 Target Met</span>
                      </div>
                      <div className="flex space-x-1 h-3">
                          <div className="h-full bg-gradient-to-r from-[#10b981] to-emerald-400 rounded-l-full w-[70%]" style={{boxShadow: "0 0 10px rgba(16,185,129,0.5)"}}></div>
                          <div className="h-full bg-[#262626] rounded-r-full w-[30%]"></div>
                      </div>
                  </div>
              </CardContent>
           </Card>
        </div>

        {/* Live Members Panel */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-bold tracking-widest uppercase text-gray-500 flex items-center justify-between">
             <span className="flex items-center gap-2"><Activity className="w-4 h-4" /> Live Network Feed</span>
             <span className="text-[10px] text-[#10b981]">LEADERBOARD</span>
          </h3>
          <div className="grid grid-cols-1 gap-4">
             {liveMembers.map(member => (
                <div key={member.id} className="bg-[#1a1a1a] border border-[#262626] p-4 rounded-xl flex items-center justify-between hover:border-[#10b981] transition-all duration-300 shadow-md group">
                    <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                            <Avatar className="w-12 h-12 border-2 border-[#10b981]/10 group-hover:border-[#10b981]/50 transition-colors">
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {member.online && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10b981] border-2 border-[#1a1a1a] rounded-full flex" style={{boxShadow: "0 0 8px rgba(16,185,129,0.8)"}}></span>}
                        </div>
                        <div className="flex-1 overflow-hidden">
                           <h4 className="font-bold text-sm truncate text-white">{member.name}</h4>
                           <p className="text-xs text-[#10b981] font-medium truncate mt-0.5 tracking-wide">{member.status}</p>
                           <div className="flex items-center gap-2 mt-1.5 text-gray-400">
                               <div className="flex items-center gap-1 opacity-60">
                                   <MapPin className="w-3 h-3" />
                                   <span className="text-[10px] uppercase font-semibold">{member.location}</span>
                               </div>
                           </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="text-center pr-4 border-r border-[#262626]">
                            <p className="text-xs font-bold text-white">{member.streak}</p>
                            <p className="text-[10px] uppercase tracking-widest text-[#10b981]">Days</p>
                        </div>
                        <Button variant="ghost" size="sm" className="hidden sm:flex text-xs font-bold hover:text-black hover:bg-[#10b981] rounded-lg bg-[#262626]/50 border border-[#262626] h-8 px-4">
                           Follow
                        </Button>
                        <Button variant="ghost" size="icon" className="sm:hidden hover:text-black hover:bg-[#10b981] h-8 w-8 rounded-lg bg-[#262626]/50 border border-[#262626]">
                           <Users className="w-3.5 h-3.5 text-gray-300" />
                        </Button>
                    </div>
                </div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
}
