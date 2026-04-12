"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Globe2, ShieldCheck, MapPin, Activity, CheckCircle2, MessageSquare, LayoutDashboard, Award, Lock, Unlock, Phone, Linkedin, Instagram, LockKeyhole } from "lucide-react";
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
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Sync states for legally compliant modal
  const [whatsappSync, setWhatsappSync] = useState(profileData?.googleSyncPermissions?.whatsapp || false);
  const [metaSync, setMetaSync] = useState(profileData?.googleSyncPermissions?.meta || false);
  const [linkedinSync, setLinkedinSync] = useState(profileData?.googleSyncPermissions?.linkedin || false);

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
      permissions: any;
  }[]>([]);

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
                     avatar: data.displayPicture || `https://api.dicebear.com/9.x/avataaars/svg?seed=${data.userId}`,
                     streak: data.streak?.currentStreak || 0,
                     profession: data.profile || "General",
                     isPrivate: !!data.isPrivateProfile,
                     bio: data.bio || "Building disciplined habits.",
                     permissions: data.googleSyncPermissions || {}
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

  const togglePrivacy = () => {
      updateUserProfileData({
          isPrivateProfile: !profileData?.isPrivateProfile
      });
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
        
        {/* Header Ribbon / API Bindings Modal */}
        <div className="flex items-center justify-between pb-2">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                  <Globe2 className="text-[#10b981] w-6 h-6" /> Reformers
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
                      <p className="font-medium text-sm flex items-center gap-2"><Phone className="w-4 h-4 text-[#25D366]" /> WhatsApp Reminders</p>
                      <p className="text-xs text-gray-500 max-w-[200px]">Send automated alerts to your accountability partner.</p>
                    </div>
                    <Switch checked={whatsappSync} onCheckedChange={setWhatsappSync} className="data-[state=checked]:bg-[#10b981]" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#262626]/30 border border-[#262626]">
                    <div>
                      <p className="font-medium text-sm flex items-center gap-2"><Instagram className="w-4 h-4 text-[#E1306C]" /> Instagram Share</p>
                      <p className="text-xs text-gray-500 max-w-[200px]">Post your completion cards to your stories.</p>
                    </div>
                    <Switch checked={metaSync} onCheckedChange={setMetaSync} className="data-[state=checked]:bg-[#10b981]" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#262626]/30 border border-[#262626]">
                    <div>
                      <p className="font-medium text-sm flex items-center gap-2"><Linkedin className="w-4 h-4 text-[#0077b5]" /> LinkedIn Career Sync</p>
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
        <div className="pt-2 hidden">
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

        {/* My Dashboard View */}
        <div className="pt-2">
            <Card className="bg-[#1a1a1a] border border-[#262626] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-[#10b981]/20 to-transparent"></div>
                <CardContent className="pt-6 relative z-10">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="relative shrink-0">
                            <Avatar className="w-24 h-24 border-4 border-[#10b981]/30">
                                <AvatarImage src={profileData?.displayPicture || "https://i.pravatar.cc/150"} />
                                <AvatarFallback>{profileData?.displayName?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <Button 
                                onClick={togglePrivacy} 
                                size="icon" 
                                variant="secondary" 
                                className="absolute bottom-0 right-0 w-8 h-8 rounded-full shadow-lg border border-[#262626]"
                                title={profileData?.isPrivateProfile ? "Private" : "Public"}
                            >
                                {profileData?.isPrivateProfile ? <Lock className="w-4 h-4 text-gray-400" /> : <Unlock className="w-4 h-4 text-[#10b981]" />}
                            </Button>
                        </div>
                        
                        <div className="flex-1 text-center sm:text-left space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                                <div>
                                    <h2 className="text-2xl font-extrabold text-white">{profileData?.displayName || "Reformer"}</h2>
                                    <p className="text-sm font-medium text-[#10b981] tracking-wide uppercase">{profileData?.profile || "General"} | {profileData?.region || "Global"} Node</p>
                                </div>
                                <div className="bg-[#262626]/50 border border-[#262626] px-4 py-2 rounded-xl text-center flex gap-4 ml-auto sm:ml-0 inline-flex mx-auto">
                                    <div>
                                        <p className="text-[10px] uppercase text-gray-400 font-bold">Streak</p>
                                        <p className="text-lg font-black text-white">{profileData?.streak?.currentStreak || 0}</p>
                                    </div>
                                    <div className="border-l border-[#262626] pl-4">
                                        <p className="text-[10px] uppercase text-gray-400 font-bold">Certificates</p>
                                        <p className="text-lg font-black text-white">{Math.floor((profileData?.streak?.highestStreak || 0) / 7)}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <p className="text-sm text-gray-400 max-w-md italic mt-2">
                                "{profileData?.bio || "Building disciplined habits and enforcing high-performance standards."}"
                            </p>
                            
                            <div className="flex items-center gap-2 mt-4 justify-center sm:justify-start">
                                {profileData?.googleSyncPermissions?.linkedin && <Badge variant="outline" className="bg-[#0077b5]/10 text-[#0077b5] border-[#0077b5]/30">Linked</Badge>}
                                {profileData?.googleSyncPermissions?.meta && <Badge variant="outline" className="bg-[#E1306C]/10 text-[#E1306C] border-[#E1306C]/30">Instagram</Badge>}
                                {profileData?.googleSyncPermissions?.whatsapp && <Badge variant="outline" className="bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30">WhatsApp</Badge>}
                                {profileData?.isPrivateProfile && <Badge variant="outline" className="bg-gray-800 text-gray-400 border-gray-700"><LockKeyhole className="w-3 h-3 mr-1"/> Private</Badge>}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Live Members Panel */}
        <div className="space-y-4 pt-6">
          <h3 className="text-sm font-bold tracking-widest uppercase text-gray-500 flex items-center justify-between">
             <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Global Reformers Pipeline</span>
             <span className="text-[10px] text-[#10b981]">LEADERBOARD</span>
          </h3>
          <div className="grid grid-cols-1 gap-3">
             {liveMembers.map(member => (
                <Dialog key={member.id} open={selectedUser?.id === member.id} onOpenChange={(open) => !open && setSelectedUser(null)}>
                    <DialogTrigger asChild>
                        <div onClick={() => setSelectedUser(member)} className="cursor-pointer bg-[#1a1a1a] border border-[#262626] p-4 rounded-xl flex items-center justify-between hover:border-[#10b981]/50 transition-all duration-300 shadow-md group">
                            <div className="flex items-center gap-4">
                                <div className="relative shrink-0">
                                    <Avatar className="w-12 h-12 border-2 border-[#10b981]/10 group-hover:border-[#10b981]/50 transition-colors">
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {member.online && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10b981] border-2 border-[#1a1a1a] rounded-full flex" style={{boxShadow: "0 0 8px rgba(16,185,129,0.8)"}}></span>}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                   <div className="flex items-center gap-2">
                                       <h4 className="font-bold text-sm truncate text-white">{member.name}</h4>
                                       {member.isPrivate && <LockKeyhole className="w-3 h-3 text-gray-500" />}
                                   </div>
                                   <p className="text-xs text-[#10b981] font-medium truncate mt-0.5 tracking-wide">{member.status}</p>
                                   <div className="flex items-center gap-2 mt-1.5 text-gray-400">
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
                                <div className="text-center pr-4">
                                    <p className="text-xs font-bold text-white">{member.streak}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-[#10b981]">Days</p>
                                </div>
                            </div>
                        </div>
                    </DialogTrigger>
                    
                    <DialogContent className="bg-[#1a1a1a] border-[#262626] text-white sm:max-w-md">
                       <DialogHeader>
                          <DialogTitle className="hidden">Profile Details</DialogTitle>
                       </DialogHeader>
                       
                       <div className="pt-4 text-center space-y-4">
                           <div className="relative inline-block mx-auto">
                               <Avatar className="w-28 h-28 border-4 border-[#10b981]/30 mx-auto">
                                   <AvatarImage src={member.avatar} />
                                   <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                               </Avatar>
                               {member.online && <div className="absolute bottom-1 right-2 bg-[#10b981] w-5 h-5 border-[3px] border-[#1a1a1a] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>}
                           </div>
                           
                           <div>
                               <h2 className="text-2xl font-black text-white">{member.name}</h2>
                               <p className="text-sm font-medium text-[#10b981] tracking-wide uppercase mt-1">{member.profession} | {member.location}</p>
                           </div>

                           {member.isPrivate ? (
                               <div className="bg-[#262626]/30 p-6 rounded-xl border border-[#262626] flex flex-col items-center">
                                   <LockKeyhole className="w-8 h-8 text-gray-500 mb-2" />
                                   <p className="text-gray-400 text-sm font-medium">This profile is strictly private. Metrics and social channels are masked.</p>
                               </div>
                           ) : (
                               <div className="space-y-4">
                                   <p className="text-sm text-gray-400 italic">"{member.bio}"</p>
                                   
                                   <div className="bg-[#262626]/50 border border-[#262626] p-4 rounded-xl flex justify-around items-center">
                                       <div className="text-center">
                                           <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Streak</div>
                                           <div className="text-2xl font-black text-white">{member.streak}</div>
                                       </div>
                                       <div className="w-px h-10 bg-[#262626]"></div>
                                       <div className="text-center">
                                           <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Certificates</div>
                                           <div className="text-2xl font-black text-white">{Math.floor(member.streak / 7)}</div>
                                       </div>
                                   </div>

                                   <div className="flex items-center justify-center gap-3 pt-2">
                                       {member.permissions?.linkedin && <Button variant="outline" size="icon" className="rounded-full bg-[#0077b5]/10 border-[#0077b5]/30 hover:bg-[#0077b5]/20 text-[#0077b5]"><Linkedin className="w-4 h-4" /></Button>}
                                       {member.permissions?.meta && <Button variant="outline" size="icon" className="rounded-full bg-[#E1306C]/10 border-[#E1306C]/30 hover:bg-[#E1306C]/20 text-[#E1306C]"><Instagram className="w-4 h-4" /></Button>}
                                       {member.permissions?.whatsapp && <Button variant="outline" size="icon" className="rounded-full bg-[#25D366]/10 border-[#25D366]/30 hover:bg-[#25D366]/20 text-[#25D366]"><Phone className="w-4 h-4" /></Button>}
                                   </div>
                               </div>
                           )}
                           
                           <div className="flex items-center gap-3 pt-4 border-t border-[#262626]">
                               <Button className="flex-1 bg-[#10b981] hover:bg-[#059669] text-black font-extrabold h-12">Follow</Button>
                               {!member.isPrivate && <Button variant="secondary" className="bg-[#262626] hover:bg-[#333] text-white h-12 px-6"><MessageSquare className="w-4 h-4 mr-2"/> Text</Button>}
                           </div>
                       </div>
                    </DialogContent>
                </Dialog>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
}
