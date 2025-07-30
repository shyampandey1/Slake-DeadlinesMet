
"use client";

import { useState } from "react";
import AuthWrapper from "@/components/AuthWrapper";
import HamburgerMenu from "@/components/HamburgerMenu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Trash2, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useFirestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


function SettingsPageComponent() {
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();
    const { clearTasks } = useTasks();
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

    const handleClearHistory = () => {
        clearTasks();
        setIsClearDialogOpen(false);
    }

    return (
        <div className="flex flex-col h-screen">
            <header className="fixed top-0 left-0 right-0 w-full bg-background/80 backdrop-blur-sm border-b border-border/50 z-10">
                <div className="container mx-auto flex h-20 max-w-4xl items-center justify-between p-4 sm:p-6 md:p-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-xl font-bold font-headline text-foreground/80">Settings</h1>
                        <p className="text-sm text-muted-foreground">Manage your account and app preferences.</p>
                    </div>
                    <HamburgerMenu />
                </div>
            </header>
            <main className="flex-1 overflow-y-auto pt-24 pb-20">
                <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-lg">Appearance</CardTitle>
                            <CardDescription>Customize the look and feel of the app.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Theme</span>
                                <Button variant="outline" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="relative">
                                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                    <span className="sr-only">Toggle theme</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-lg">Account</CardTitle>
                            <CardDescription>Manage your account information.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {user && (
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Email</span>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                       <User className="h-4 w-4" />
                                       <span>{user.email}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-lg">Data Management</CardTitle>
                            <CardDescription>Manage your application data.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                             <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Clear Task Log
                                </Button>
                             </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your entire task history.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleClearHistory} className="bg-destructive hover:bg-destructive/90">
                                        Yes, delete my history
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                             </AlertDialogContent>
                           </AlertDialog>
                        </CardContent>
                    </Card>

                </div>
            </main>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <AuthWrapper>
            <SettingsPageComponent />
        </AuthWrapper>
    );
}
