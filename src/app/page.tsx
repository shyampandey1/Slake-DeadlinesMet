"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Globe2, ArrowRight } from "lucide-react";
import DynamicHeader from "@/components/DynamicHeader";
import TaskForm from "@/components/TaskForm";
import AuthWrapper from "@/components/AuthWrapper";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";

export default function Home() {
  const { profileData } = useProfile();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (typeof window !== "undefined") {
       const urlParams = new URLSearchParams(window.location.search);
       const refId = urlParams.get('ref');
       if (refId) {
           localStorage.setItem('slake_referral_id', refId);
       }
    }
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  return (
    <AuthWrapper>
      <div className="flex flex-col min-h-screen bg-background pb-20">
        <DynamicHeader currentDate={currentDate} />
        <main className="flex-1 w-full max-w-4xl mx-auto px-6 sm:px-8 md:px-10 pt-2 -mt-36 sm:-mt-44 relative z-10">
          {profileData?.slakeCredits === 0 && (
            <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 shadow-xl shadow-orange-500/20 border border-white/10 overflow-hidden relative group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <Globe2 className="w-24 h-24 text-white" />
               </div>
               <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Level Up Your Discipline</h3>
               <p className="text-white/80 text-sm mb-6 max-w-md leading-relaxed">
                 You have 0 DM Coins. Join the Reformers League to turn your daily hydration, 
                 exercise, and tasks into real rewards and crypto payouts.
               </p>
               <Button asChild className="bg-white text-red-600 hover:bg-white/90 font-bold px-8 h-12 rounded-xl transition-all hover:translate-x-1 shadow-lg">
                  <Link href="/reformers" className="flex items-center gap-2">
                    Join the League <ArrowRight className="w-4 h-4" />
                  </Link>
               </Button>
            </div>
          )}
          <TaskForm />
        </main>
      </div>
    </AuthWrapper>
  );
}
