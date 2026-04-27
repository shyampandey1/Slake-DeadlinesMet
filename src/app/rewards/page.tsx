"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { RewardsContent } from "@/components/RewardsContent";

export default function RewardsPage() {
  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-background to-background/50 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 space-y-6 pt-12">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8"
        >
            <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight flex items-center justify-center sm:justify-start gap-3">
                    <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500 fill-current drop-shadow-md" />
                    Achievement Center
                </h1>
                <p className="text-muted-foreground text-sm sm:text-lg">Earn credits, redeem rewards, and share your success.</p>
            </div>
        </motion.div>

        <RewardsContent />
      </div>
    </div>
  );
}
