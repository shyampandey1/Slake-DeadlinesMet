
"use client";

import { useState, useEffect } from "react";
import { useRouter, redirect } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, UserPlus, ArrowLeft, Clock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LoginForm from "@/components/LoginForm";
import SignupForm from "@/components/SignupForm";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/components/SocialIcons";


type AuthView = "initial" | "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, setMockUser, signInWithGoogle, mockLogin, setIsOffline } = useAuth();
  const [view, setView] = useState<AuthView>("initial");

  useEffect(() => {
    if (!loading && user) {
      redirect('/');
    }
  }, [user, loading, router]);
  
  const handleGuestLogin = () => {
    const mockUser = mockLogin("user@test.com", "password123");
    if (mockUser) {
        setMockUser(mockUser);
        setIsOffline(true);
        router.push("/");
        toast({
            title: "Logged in as Guest",
            description: "You are logged in with a temporary local account.",
        });
    }
  };

  const handleGoogleLogin = async () => {
    try {
        await signInWithGoogle();
        router.push("/");
        toast({
            title: "Logged in Successfully",
            description: "Welcome back!",
        });
    } catch(error: any) {
        // Don't show an error if the user closes the popup
        if (error.code === 'auth/popup-closed-by-user') {
            return;
        }
        toast({
            title: "Google Login Failed",
            description: error.message,
            variant: "destructive",
        });
    }
  }

  if (loading) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-16 h-16 text-primary">
                <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="256" cy="256" r="240" stroke="currentColor" strokeWidth="20" />
                    <path d="M256 40V120" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
                    <path d="M256 472V392" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
                    <path d="M472 256H392" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
                    <path d="M120 256H40" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
                    <path d="M256 256L358 154" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
                </svg>
            </div>
        </div>
    );
  }
  
  if (user) {
    return null;
  }

  const renderInitialView = () => (
    <>
        <CardHeader>
          <div className="flex justify-center items-center mb-4 text-primary">
            <div className="w-16 h-16">
                <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="256" cy="256" r="240" stroke="currentColor" strokeWidth="20" />
                    <path d="M256 40V120" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
                    <path d="M256 472V392" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
                    <path d="M472 256H392" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
                    <path d="M120 256H40" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
                    <path d="M256 256L358 154" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
                </svg>
            </div>
          </div>
          <CardTitle className="font-headline text-3xl">DeadlinesMet</CardTitle>
          <CardDescription>Your personal space to conquer tasks and achieve goals.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
            <Button onClick={handleGoogleLogin} size="lg" variant="outline">
                <GoogleIcon className="mr-2 h-5 w-5" />
                Login with Google
            </Button>
            
            <div className="flex items-center gap-2">
                <Separator className="flex-1"/>
                <span className="text-xs text-muted-foreground">OR</span>
                <Separator className="flex-1"/>
            </div>

            <Button onClick={() => setView("login")} size="lg">
                <LogIn className="mr-2" />
                Login with Email
            </Button>
            
            <div className="text-center">
                <p className="text-sm text-muted-foreground">
                    New to DeadlinesMet?{' '}
                    <Button variant="link" className="p-0 h-auto" onClick={() => setView("signup")}>
                       Create an account
                    </Button>
                </p>
                <Button variant="link" className="p-0 h-auto text-xs" onClick={handleGuestLogin}>
                    Continue as Guest
                </Button>
            </div>
        </CardContent>
    </>
  );


  const renderContent = () => {
    switch (view) {
      case "login":
        return <LoginForm onBack={() => setView('initial')}/>;
      case "signup":
        return <SignupForm onBack={() => setView('initial')}/>;
      case "initial":
      default:
        return renderInitialView();
    }
  };

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card className="w-full max-w-sm text-center overflow-hidden relative flex flex-col justify-center" style={{ minHeight: '520px' }}>
          {view !== 'initial' && (
            <Button variant="ghost" className="absolute top-4 left-4 z-10" onClick={() => setView('initial')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          {renderContent()}
        </Card>
      </div>
    </main>
  );
}
