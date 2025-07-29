
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
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.92 1.62-3.03 0-5.48-2.45-5.48-5.48s2.45-5.48 5.48-5.48c1.73 0 2.92.62 3.88 1.5l2.53-2.53C18.13 3.18 15.82 2 12.48 2c-5.48 0-9.92 4.45-9.92 9.92s4.44 9.92 9.92 9.92c5.28 0 9.6-3.45 9.6-9.6 0-.62-.05-1.22-.16-1.8z" />
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
            <Button onClick={handleGuestLogin} size="lg" variant="ghost" className="text-muted-foreground">
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
