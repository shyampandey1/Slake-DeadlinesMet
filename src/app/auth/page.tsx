
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { redirect } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (user) {
    redirect('/');
  }

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Welcome to DeadlinesMet</CardTitle>
          <CardDescription>Your personal space to conquer tasks and achieve goals.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <Button onClick={() => router.push('/login')} size="lg">
            <LogIn className="mr-2" />
            Login
          </Button>
          <Button onClick={() => router.push('/signup')} size="lg" variant="secondary">
            <UserPlus className="mr-2" />
            Sign Up
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
