
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

type AuthView = "initial" | "login" | "signup";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        <path fill="none" d="M1 1h22v22H1z"/>
    </svg>
);

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, setMockUser, signInWithGoogle, mockLogin } = useAuth();
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
        toast({
            title: "Google Login Failed",
            description: error.message,
            variant: "destructive",
        });
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  
  if (user) {
    return null;
  }

  const renderInitialView = () => (
    <>
        <CardHeader>
          <div className="flex justify-center items-center mb-4 text-primary">
            <Clock className="w-16 h-16" />
          </div>
          <CardTitle className="font-headline text-3xl">DeadlinesMet</CardTitle>
          <CardDescription>Your personal space to conquer tasks and achieve goals.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
            <Button onClick={handleGoogleLogin} variant="outline" size="lg">
                <GoogleIcon className="mr-2 h-5 w-5" />
                Sign in with Google
            </Button>
            <div className="relative">
                <Separator />
                <div className="absolute inset-0 flex items-center">
                    <span className="bg-card px-2 text-xs text-muted-foreground mx-auto">OR</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => setView("login")} size="lg">
                    <LogIn className="mr-2" />
                    Login
                </Button>
                <Button onClick={() => setView("signup")} size="lg" variant="secondary">
                    <UserPlus className="mr-2" />
                    Sign Up
                </Button>
            </div>
            <Button onClick={handleGuestLogin} size="lg" variant="ghost" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500">
                <UserCheck className="mr-2" />
                Login as Guest
            </Button>
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
