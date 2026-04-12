"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Globe2, ShieldCheck, MapPin, Activity, CheckCircle2, MessageSquare, LayoutDashboard, Lock, Unlock, Phone, Linkedin, Instagram, LockKeyhole, ArrowLeft, Send, Edit, Save, Camera } from "lucide-react";
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

import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import type { UserProfile } from "@/types";

export default function ReformersPage() {
  const { profileData, updateUserProfileData } = useProfile();
  const { user } = useAuth();
  
  const isEnrolled = profileData?.isReformersEnrolled || false;
  const [enrolling, setEnrolling] = useState(false);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Sync states for legally compliant modal
  const [whatsappSync, setWhatsappSync] = useState(profileData?.googleSyncPermissions?.whatsapp || false);
  const [metaSync, setMetaSync] = useState(profileData?.googleSyncPermissions?.meta || false);
  const [linkedinSync, setLinkedinSync] = useState(profileData?.googleSyncPermissions?.linkedin || false);

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editProfession, setEditProfession] = useState("");
  const [editDP, setEditDP] = useState("");

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

  // Chat & Follow State
  const [chatMode, setChatMode] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [conversation, setConversation] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  // Load baseline profile data for editing
  useEffect(() => {
     if (profileData) {
        setEditBio(profileData.bio || "Building disciplined habits.");
        setEditProfession(profileData.profile || "General");
        setEditDP(profileData.displayPicture || "");
     }
  }, [profileData?.bio, profileData?.profile, profileData?.displayPicture]);

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
             if (uid !== profileData?.userId) {
                 members.push({
                     id: uid,
                     name: data.displayName || "Anonymous Reformer",
                     location: data.region || "Global",
                     status: data.currentTaskStatus || "Idle",
                     online: !!data.isOnline,
                     avatar: data.displayPicture || `https://api.dicebear.com/9.x/avataaars/svg?seed=${uid}`,
                     streak: data.streak?.currentStreak || 0,
                     profession: data.profile || "General",
                     isPrivate: !!data.isPrivateProfile,
                     bio: data.bio || "Building disciplined habits.",
                     permissions: data.googleSyncPermissions || {}
                 });
             }
         });
         members.sort((a, b) => {
             if (a.online !== b.online) return a.online ? -1 : 1;
             return b.streak - a.streak;
         });
         setLiveMembers(members);
     });
     
     return () => unsubscribe();
  }, [isEnrolled, profileData?.userId]);

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
    setEnrolling(true);
    setTimeout(() => {
       setEnrolling(false);
       setSocialModalOpen(true);
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
     setSocialModalOpen(false);
  };

  const handleSaveProfile = () => {
     updateUserProfileData({
         bio: editBio,
         profile: editProfession,
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
      // Native Follow Hook
  };

  if (!isEnrolled && !enrolling && !socialModalOpen) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] pb-24 text-white p-4 pt-16 font-sans">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto space-y-6">
          <div className="text-center py-10">
            <div className="mx-auto w-24 h-24 mb-6 rounded-full bg-[#10b981]/20 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)]">
               <Globe2 className="w-12 h-12 text-[#10b981]" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-white">Reformers League</h1>
            <p className="text-gray-400 text-lg leading-relaxed">Join the global network of discipline. See your real friends, logbook syncs, and chat securely in real-time.</p>
          </div>
          <Card className="bg-[#1a1a1a] border-[#262626] shadow-2xl">
             <CardHeader>
                <CardTitle className="text-[#10b981] flex items-center gap-2"><ShieldCheck /> Access Requirements</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4 text-gray-300">
               <div className="flex items-start gap-3">
                 <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />
                 <p className="text-sm">Public Profile listing displaying your logbook streaks to your friends.</p>
               </div>
               <div className="flex items-start gap-3">
                 <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />
                 <p className="text-sm">Social Sync bindings to securely transmit your public milestones to LinkedIn and WhatsApp.</p>
               </div>
             </CardContent>
             <CardFooter>
                 <Button className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-extrabold py-6 rounded-xl text-lg transition-transform hover:scale-[1.02]" onClick={handleEnroll}>
                    {enrolling ? "Enrolling User..." : "Enable Reformers Network"}
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
        
        {/* Header Ribbon / Social Sync Modal */}
        <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                  <Globe2 className="text-[#10b981] w-6 h-6" /> Reformers
              </h1>
              <p className="text-xs text-[#10b981] font-bold mt-1 tracking-widest">{profileData?.region ? profileData.region.split('/').reverse().join(', ').replace('_', ' ') : "India"} Region</p>
            </div>
            <Dialog open={socialModalOpen} onOpenChange={setSocialModalOpen}>
              <DialogTrigger asChild>
                  <Button variant="outline" className="border-[#262626] bg-[#1a1a1a] text-gray-300 hover:text-white hover:bg-[#262626]"><LayoutDashboard className="w-4 h-4 mr-2" />Social Sync</Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-[#262626] text-white sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-[#10b981] flex items-center gap-2 text-xl font-bold"><ShieldCheck /> Social Network Access</DialogTitle>
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
                      <p className="text-xs text-gray-500 max-w-[200px]">Post your completion cards to your network.</p>
                    </div>
                    <Switch checked={metaSync} onCheckedChange={setMetaSync} className="data-[state=checked]:bg-[#10b981]" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#262626]/30 border border-[#262626]">
                    <div>
                      <p className="font-medium text-sm flex items-center gap-2"><Linkedin className="w-4 h-4 text-[#0077b5]" /> LinkedIn Career Sync</p>
                      <p className="text-xs text-gray-500 max-w-[200px]">Publish productivity milestones automatically.</p>
                    </div>
                    <Switch checked={linkedinSync} onCheckedChange={setLinkedinSync} className="data-[state=checked]:bg-[#10b981]" />
                  </div>
                </div>
                <DialogFooter className="border-t border-[#262626] pt-4 mt-2">
                  <Button onClick={handleSavePermissions} className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-extrabold text-sm h-12">Save Configuration</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>

        {/* My Dashboard View (Editable) */}
        <div className="pt-2">
            <Card className="bg-[#1a1a1a] border border-[#262626] shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-[#10b981]/30">
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
                                  <label className="text-xs text-gray-400 font-bold tracking-widest uppercase">Display Picture URL</label>
                                  <Input value={editDP} onChange={(e) => setEditDP(e.target.value)} placeholder="https://..." className="bg-[#262626] border-none text-white h-10 w-full" />
                               </div>
                           </div>
                           <div className="space-y-2">
                               <label className="text-xs text-gray-400 font-bold tracking-widest uppercase">Profession / Focus</label>
                               <Input value={editProfession} onChange={(e) => setEditProfession(e.target.value)} placeholder="e.g. Software Engineer" className="bg-[#262626] border-none text-white h-12 text-sm" />
                           </div>
                           <div className="space-y-2">
                               <label className="text-xs text-gray-400 font-bold tracking-widest uppercase">Bio</label>
                               <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Your vision..." className="bg-[#262626] border-none text-white resize-none" rows={3}/>
                           </div>
                           <div className="flex gap-3 pt-2">
                               <Button onClick={handleSaveProfile} className="flex-1 bg-[#10b981] hover:bg-[#059669] text-black font-bold h-12"><Save className="w-4 h-4 mr-2" /> Save Profile</Button>
                               <Button onClick={() => setIsEditing(false)} variant="secondary" className="bg-[#262626] hover:bg-[#333] text-white h-12">Cancel</Button>
                           </div>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            <div className="relative shrink-0 group">
                                <Avatar className="w-28 h-28 border-4 border-[#10b981]/30 group-hover:border-[#10b981] transition-colors">
                                    <AvatarImage src={profileData?.displayPicture || "https://i.pravatar.cc/150"} />
                                    <AvatarFallback>{profileData?.displayName?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <Button onClick={togglePrivacy} size="icon" variant="secondary" className="absolute bottom-0 right-0 w-8 h-8 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-[#262626]" title={profileData?.isPrivateProfile ? "Private" : "Public"}>
                                    {profileData?.isPrivateProfile ? <Lock className="w-4 h-4 text-gray-400" /> : <Unlock className="w-4 h-4 text-[#10b981]" />}
                                </Button>
                            </div>
                            
                            <div className="flex-1 text-center sm:text-left space-y-2 w-full pt-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                                    <div>
                                        <h2 className="text-2xl font-extrabold text-white flex justify-center sm:justify-start items-center gap-2">
                                           {profileData?.displayName || "Reformer"} 
                                           <Button onClick={() => setIsEditing(true)} variant="ghost" size="icon" className="w-6 h-6 hover:bg-[#262626] rounded-full text-gray-400 hover:text-white"><Edit className="w-3 h-3" /></Button>
                                        </h2>
                                        <p className="text-sm font-medium text-[#10b981] tracking-wide uppercase">{profileData?.profile || "General"} | {profileData?.region ? profileData.region.split('/').reverse()[0].replace('_', ' ') : "Global"}</p>
                                    </div>
                                    <div className="bg-[#262626]/50 border border-[#262626] px-4 py-2 rounded-xl text-center flex gap-4 mt-4 sm:mt-0 mx-auto sm:mx-0 w-fit shrink-0 shadow-inner">
                                        <div>
                                            <p className="text-[10px] uppercase text-gray-400 font-bold">Logbook Streak</p>
                                            <p className="text-xl font-black text-white">{profileData?.streak?.currentStreak || 0}</p>
                                        </div>
                                        <div className="border-l border-[#262626] pl-4">
                                            <p className="text-[10px] uppercase text-gray-400 font-bold">Certificates</p>
                                            <p className="text-xl font-black text-white">{Math.floor((profileData?.streak?.highestStreak || 0) / 7)}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <p className="text-sm text-gray-300 max-w-lg mt-3 mx-auto sm:mx-0 leading-relaxed">
                                    {profileData?.bio || "Building disciplined habits and enforcing high-performance standards."}
                                </p>
                                
                                <div className="flex items-center gap-2 mt-5 justify-center sm:justify-start">
                                    {profileData?.googleSyncPermissions?.linkedin && <Badge variant="outline" className="bg-[#0077b5]/10 text-[#0077b5] border-[#0077b5]/30">Linked</Badge>}
                                    {profileData?.googleSyncPermissions?.meta && <Badge variant="outline" className="bg-[#E1306C]/10 text-[#E1306C] border-[#E1306C]/30">Instagram</Badge>}
                                    {profileData?.googleSyncPermissions?.whatsapp && <Badge variant="outline" className="bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30">WhatsApp</Badge>}
                                    {profileData?.isPrivateProfile && <Badge variant="outline" className="bg-gray-800 text-gray-400 border-gray-700"><LockKeyhole className="w-3 h-3 mr-1"/> Private</Badge>}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Global Live Leaderboard Panel */}
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
                        <div onClick={() => setSelectedUser(member)} className="cursor-pointer bg-[#1a1a1a] border border-[#262626] p-4 rounded-xl flex items-center justify-between hover:border-[#10b981]/50 transition-all duration-300 shadow-md group">
                            <div className="flex items-center gap-4">
                                <div className="relative shrink-0">
                                    <Avatar className="w-12 h-12 border border-[#262626] group-hover:border-[#10b981]/50 transition-colors">
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback className="bg-[#262626]">{member.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {member.online && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10b981] border-2 border-[#1a1a1a] rounded-full flex" style={{boxShadow: "0 0 8px rgba(16,185,129,0.8)"}}></span>}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                   <div className="flex items-center gap-2">
                                       <h4 className="font-bold text-sm truncate text-white">{member.name}</h4>
                                       {member.isPrivate && <LockKeyhole className="w-3 h-3 text-gray-500" />}
                                   </div>
                                   <p className={`text-xs font-medium truncate mt-0.5 tracking-wide ${member.online ? 'text-[#10b981]' : 'text-gray-500'}`}>{member.status}</p>
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
                                <div className="text-center pr-2">
                                    <p className="text-xs font-bold text-white leading-tight">{member.streak}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-[#10b981] font-bold">Days</p>
                                </div>
                            </div>
                        </div>
                    </DialogTrigger>
                    
                    <DialogContent className="bg-[#1a1a1a] border-[#262626] text-white sm:max-w-md overflow-hidden p-0">
                       <DialogHeader className="hidden">
                          <DialogTitle>Profile Actions</DialogTitle>
                       </DialogHeader>

                       {chatMode ? (
                           <div className="flex flex-col h-[500px]">
                               <div className="bg-[#262626]/50 p-4 border-b border-[#262626] flex items-center justify-between shadow-sm relative z-10">
                                  <div className="flex items-center gap-3">
                                      <Button variant="ghost" size="icon" className="hover:bg-[#333] hover:text-white" onClick={() => setChatMode(false)}>
                                          <ArrowLeft className="w-4 h-4" />
                                      </Button>
                                      <div className="flex items-center gap-2">
                                          <Avatar className="w-8 h-8 pointer-events-none">
                                              <AvatarImage src={member.avatar} />
                                          </Avatar>
                                          <div>
                                              <h3 className="font-bold text-sm leading-tight text-white">{member.name}</h3>
                                              <p className={`text-[10px] font-medium ${member.online ? 'text-[#10b981]' : 'text-gray-500'}`}>
                                                  {member.online ? "Online: " + member.status : "Offline"}
                                              </p>
                                          </div>
                                      </div>
                                  </div>
                               </div>
                               
                               <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0d0d0d]">
                                   {conversation.length === 0 ? (
                                       <div className="text-center text-gray-500 text-xs italic mt-8 bg-[#262626]/30 p-4 rounded-xl inline-block mx-auto flex flex-col items-center gap-2 border border-[#262626]/50">
                                          <MessageSquare className="w-6 h-6 text-gray-600" />
                                          No messages yet. Say hi and start holding each other accountable!
                                       </div>
                                   ) : (
                                       conversation.map((msg) => {
                                           const isMe = msg.senderId === profileData?.userId;
                                           return (
                                               <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                   <div className={`max-w-[75%] p-3 rounded-2xl text-sm leading-snug shadow-sm ${isMe ? 'bg-[#10b981] text-black rounded-tr-sm' : 'bg-[#262626] text-white rounded-tl-sm border border-[#333]'}`}>
                                                       {msg.text}
                                                   </div>
                                               </div>
                                           );
                                       })
                                   )}
                               </div>

                               <form onSubmit={handleSendMessage} className="p-3 border-t border-[#262626] flex gap-2 bg-[#1a1a1a]">
                                   <Input 
                                      value={messageText}
                                      onChange={(e) => setMessageText(e.target.value)}
                                      placeholder="Message securely..."
                                      className="bg-[#262626]/50 border-[#333] focus-visible:ring-1 focus-visible:ring-[#10b981] rounded-full h-10 px-4 placeholder:text-gray-500"
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
                                           <AvatarFallback className="bg-[#262626]">{member.name.charAt(0)}</AvatarFallback>
                                       </Avatar>
                                       {member.online && <div className="absolute bottom-1 right-2 bg-[#10b981] w-5 h-5 border-[3px] border-[#1a1a1a] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>}
                                   </div>
                                   
                                   <div>
                                       <h2 className="text-2xl font-black text-white">{member.name}</h2>
                                       <p className="text-sm font-medium text-[#10b981] tracking-wide uppercase mt-1">{member.profession} | {member.location}</p>
                                   </div>

                                   {member.isPrivate ? (
                                       <div className="bg-[#262626]/30 p-8 rounded-xl border border-[#262626] flex flex-col items-center">
                                           <LockKeyhole className="w-10 h-10 text-gray-500 mb-4" />
                                           <p className="text-gray-400 text-sm font-medium leading-relaxed">This profile is strictly private. Metrics and social channels are masked securely.</p>
                                       </div>
                                   ) : (
                                       <div className="space-y-5">
                                           <p className="text-sm text-gray-300 italic bg-[#262626]/30 p-4 rounded-xl border border-[#262626]/50 shadow-inner">"{member.bio}"</p>
                                           
                                           <div className="bg-[#262626]/50 border border-[#262626] p-4 rounded-xl flex justify-around items-center shadow-sm">
                                               <div className="text-center">
                                                   <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Logbook Streak</div>
                                                   <div className="text-3xl font-black text-white">{member.streak}</div>
                                               </div>
                                               <div className="w-px h-12 bg-[#333]"></div>
                                               <div className="text-center">
                                                   <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Certificates</div>
                                                   <div className="text-3xl font-black text-[#10b981]">{Math.floor(member.streak / 7)}</div>
                                               </div>
                                           </div>

                                           <div className="flex items-center justify-center gap-3 pt-2">
                                               {member.permissions?.linkedin && <Button variant="outline" size="icon" className="rounded-full bg-[#0077b5]/10 border-[#0077b5]/30 hover:bg-[#0077b5]/20 text-[#0077b5] h-10 w-10"><Linkedin className="w-4 h-4" /></Button>}
                                               {member.permissions?.meta && <Button variant="outline" size="icon" className="rounded-full bg-[#E1306C]/10 border-[#E1306C]/30 hover:bg-[#E1306C]/20 text-[#E1306C] h-10 w-10"><Instagram className="w-4 h-4" /></Button>}
                                               {member.permissions?.whatsapp && <Button variant="outline" size="icon" className="rounded-full bg-[#25D366]/10 border-[#25D366]/30 hover:bg-[#25D366]/20 text-[#25D366] h-10 w-10"><Phone className="w-4 h-4" /></Button>}
                                           </div>
                                       </div>
                                   )}
                                   
                                   <div className="flex items-center gap-3 pt-6 border-t border-[#262626]">
                                       <Button onClick={handleFollow} className={`flex-1 font-extrabold h-12 text-sm shadow-md transition-all ${isFollowing ? 'bg-[#262626] text-white hover:bg-[#333] border border-[#333]' : 'bg-[#10b981] text-black hover:bg-[#059669]'}`}>
                                          {isFollowing ? "Following" : "Follow"}
                                       </Button>
                                       {!member.isPrivate && <Button onClick={() => setChatMode(true)} variant="secondary" className="bg-[#262626] hover:bg-[#333] text-white h-12 px-6 shadow-md border border-[#333]"><MessageSquare className="w-4 h-4 mr-2"/> Text</Button>}
                                   </div>
                               </div>
                           </div>
                       )}
                    </DialogContent>
                </Dialog>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
}
