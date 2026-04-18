"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Phone, ExternalLink, ShieldAlert, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function RedirectPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<"phone" | "group" | "other" | null>(null);

  useEffect(() => {
    const resolveRedirect = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      // 1. Check if it's a phone number (10 digits or more)
      const cleanSlug = slug.replace(/\D/g, "");
      if (cleanSlug.length >= 10 && !slug.includes("-")) {
        setTargetUrl(`https://wa.me/${cleanSlug}`);
        setType("phone");
        setLoading(false);
        return;
      }

      // 2. Check if it's "group"
      if (slug.toLowerCase() === "group") {
        try {
          const configDoc = await getDoc(doc(db, "config", "reformers"));
          if (configDoc.exists() && configDoc.data().whatsappJoinLink) {
            setTargetUrl(configDoc.data().whatsappJoinLink);
            setType("group");
          } else {
            // If no group link configured, go home
            router.push("/");
          }
        } catch (e) {
          router.push("/");
        }
        setLoading(false);
        return;
      }

      // 3. Fallback
      setLoading(false);
      router.push("/");
    };

    resolveRedirect();
  }, [slug, router]);

  const handleProceed = () => {
    if (targetUrl) {
      window.location.href = targetUrl;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!targetUrl) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900/50 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl text-center space-y-6 relative z-10"
      >
        <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/30">
          {type === "phone" ? <Phone className="w-10 h-10 text-emerald-400" /> : <ExternalLink className="w-10 h-10 text-emerald-400" />}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight uppercase">External Gateway</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            {type === "phone" 
              ? "Establishing a secure connection to WhatsApp for an external conversation." 
              : "Verifying credentials for the Reformers League official WhatsApp portal."}
          </p>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-left">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200/80 leading-snug uppercase font-bold tracking-wider">
            This will open WhatsApp externally. Ensure you trust the destination before proceeding.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <Button 
            onClick={handleProceed}
            className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] group transition-all"
          >
            PROCEED TO WHATSAPP
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <Button 
            onClick={() => router.push("/")}
            variant="ghost" 
            className="w-full h-12 text-slate-500 hover:text-white hover:bg-white/5 font-bold"
          >
            CANCEL
          </Button>
        </div>
      </motion.div>

      <p className="mt-8 text-[10px] text-slate-600 uppercase tracking-widest font-black">
        DeadlinesMet Secure Redirect
      </p>
    </div>
  );
}
