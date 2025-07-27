
"use client";

import { useState, useEffect } from "react";
import { useRouter, redirect } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, UserPlus, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import LoginForm from "@/components/LoginForm";
import SignupForm from "@/components/SignupForm";

type AuthView = "initial" | "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [view, setView] = useState<AuthView>("initial");

  useEffect(() => {
    if (!loading && user) {
      redirect('/');
    }
  }, [user, loading]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  
  if (user) {
    return null;
  }

  const contentVariants = {
    hidden: { opacity: 0, x: 300, position: 'absolute', width: '100%' },
    visible: { opacity: 1, x: 0, position: 'relative', width: '100%' },
    exit: { opacity: 0, x: -300, position: 'absolute', width: '100%' },
  };

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card className="w-full max-w-sm text-center overflow-hidden relative" style={{ minHeight: '420px' }}>
          {view !== 'initial' && (
            <Button variant="ghost" className="absolute top-4 left-4 z-10" onClick={() => setView('initial')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <div className="relative flex flex-col justify-center items-center h-full">
            <AnimatePresence mode="wait">
              {view === "initial" && (
                <motion.div
                  key="initial"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={contentVariants}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <CardHeader>
                    <div className="flex justify-center items-center mb-4 text-primary">
                      <Clock className="w-16 h-16" />
                    </div>
                    <CardTitle className="font-headline text-3xl">DeadlinesMet</CardTitle>
                    <CardDescription>Your personal space to conquer tasks and achieve goals.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col space-y-4">
                    <Button onClick={() => setView("login")} size="lg">
                      <LogIn className="mr-2" />
                      Login
                    </Button>
                    <Button onClick={() => setView("signup")} size="lg" variant="secondary">
                      <UserPlus className="mr-2" />
                      Sign Up
                    </Button>
                  </CardContent>
                </motion.div>
              )}

              {view === "login" && (
                <motion.div
                  key="login"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={contentVariants}
                  transition={{ duration: 0.3 }}
                   className="w-full"
                >
                  <LoginForm />
                </motion.div>
              )}

              {view === "signup" && (
                <motion.div
                  key="signup"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={contentVariants}
                  transition={{ duration: 0.3 }}
                   className="w-full"
                >
                  <SignupForm />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </div>
    </main>
  );
}
