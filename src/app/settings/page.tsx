
"use client";

import { useState, useEffect } from "react";
import AuthWrapper from "@/components/AuthWrapper";
import HamburgerMenu from "@/components/HamburgerMenu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useFirestore";
import { useAudioSettings } from "@/hooks/useAudioSettings";
import { useWeather } from "@/hooks/useWeather";
import { Sun, Moon, Bell, Volume2, Trash2, Cloud, CloudOff, User, Edit, Check, X, Loader2, LocateFixed, Save } from "lucide-react";

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
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

function SettingsPageComponent() {
    const { theme, setTheme } = useTheme();
    const { user, updateUserDisplayName, isSyncEnabled, setIsSyncEnabled } = useAuth();
    const { clearTasks } = useTasks();
    const { isAudioEnabled, setAudioEnabled, sounds, selectedSound, setSelectedSound, volume, setVolume, testSound } = useAudioSettings();
    const { location, setLocation, unit, setUnit, loading: weatherLoading, fetchWeatherForCurrentUserLocation } = useWeather();
    
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [displayName, setDisplayName] = useState(user?.displayName || "");
    const [isSavingName, setIsSavingName] = useState(false);
    const { toast } = useToast();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [tempLocation, setTempLocation] = useState(location);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotificationsEnabled(Notification.permission === 'granted');
        }
    }, []);

    const handleClearHistory = () => {
        clearTasks();
        setIsClearDialogOpen(false);
    }
    
    const handleNameSave = async () => {
        if (!displayName.trim()) {
            toast({ title: "Name cannot be empty.", variant: "destructive" });
            return;
        }
        setIsSavingName(true);
        try {
            await updateUserDisplayName(displayName);
            toast({ title: "Name updated successfully!" });
            setIsEditingName(false);
        } catch (error: any) {
            toast({ title: "Failed to update name.", description: error.message, variant: "destructive" });
        } finally {
            setIsSavingName(false);
        }
    };

    const handleLocationSave = () => {
        if (tempLocation.trim()) {
            setLocation(tempLocation);
            toast({ title: "Location updated", description: `Weather will now be shown for ${tempLocation}.` });
        }
    }

    const handleDetectLocation = () => {
        fetchWeatherForCurrentUserLocation();
        setTempLocation("Current Location");
    }

    const handleNotificationToggle = async (enabled: boolean) => {
        if (enabled) {
            if (Notification.permission === 'granted') {
                setNotificationsEnabled(true);
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    setNotificationsEnabled(true);
                    toast({ title: "Notifications enabled!" });
                } else {
                    setNotificationsEnabled(false);
                    toast({ title: "Notifications permission denied.", variant: 'destructive' });
                }
            } else {
                // Permission is denied, so we can't enable.
                // The switch state should already be false.
                toast({ title: "Notifications are blocked by your browser.", description: "You'll need to change the setting in your browser to enable them." });
            }
        } else {
            // User is turning the switch off
            setNotificationsEnabled(false);
        }
    };

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
                            <CardTitle className="font-headline text-lg">Weather</CardTitle>
                            <CardDescription>Manage location and units for the home screen.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="location-input">Location</Label>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        id="location-input"
                                        value={tempLocation}
                                        onChange={(e) => setTempLocation(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLocationSave()}
                                        placeholder="e.g., Delhi, India"
                                    />
                                    <Button size="icon" variant="outline" onClick={handleDetectLocation}>
                                        <LocateFixed className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" onClick={handleLocationSave} disabled={weatherLoading}>
                                        {weatherLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label>Unit</Label>
                                <RadioGroup value={unit} onValueChange={(value) => setUnit(value as 'C' | 'F')} className="flex items-center gap-4">
                                    <Label htmlFor="celsius" className="flex items-center gap-2 rounded-md border p-2 px-3 cursor-pointer hover:bg-accent data-[state=checked]:border-primary">
                                        <RadioGroupItem value="C" id="celsius"/>
                                        Celsius (°C)
                                    </Label>
                                    <Label htmlFor="fahrenheit" className="flex items-center gap-2 rounded-md border p-2 px-3 cursor-pointer hover:bg-accent data-[state=checked]:border-primary">
                                        <RadioGroupItem value="F" id="fahrenheit"/>
                                        Fahrenheit (°F)
                                    </Label>
                                </RadioGroup>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-lg">Notifications</CardTitle>
                            <CardDescription>Manage how you receive alerts for tasks.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <label htmlFor="notifications-switch" className="font-medium flex items-center gap-2">
                                    <Bell className="h-4 w-4" />
                                    Push Notifications
                                </label>
                                <Switch
                                    id="notifications-switch"
                                    checked={notificationsEnabled}
                                    onCheckedChange={handleNotificationToggle}
                                />
                            </div>
                             <p className="text-sm text-muted-foreground -mt-2">
                                Stay updated with task reminders and motivational messages.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-lg">Audio</CardTitle>
                            <CardDescription>Manage audio cues and volume for the timer.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <label htmlFor="audio-switch" className="font-medium flex items-center gap-2">
                                    <Bell className="h-4 w-4" />
                                    Timer Cues
                                </label>
                                <Switch
                                    id="audio-switch"
                                    checked={isAudioEnabled}
                                    onCheckedChange={setAudioEnabled}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Sound</Label>
                                <RadioGroup value={selectedSound} onValueChange={setSelectedSound} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {sounds.map((sound) => (
                                        <Label key={sound.name} htmlFor={sound.name} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-accent data-[state=checked]:border-primary">
                                            <RadioGroupItem value={sound.name} id={sound.name}/>
                                            {sound.name}
                                        </Label>
                                    ))}
                                </RadioGroup>
                            </div>

                             <div className="space-y-2">
                                <Label>Volume</Label>
                                <Slider
                                    value={[volume]}
                                    onValueChange={setVolume}
                                    max={1}
                                    step={0.1}
                                />
                            </div>
                            
                            <Button variant="outline" onClick={testSound}>
                                <Volume2 className="mr-2 h-4 w-4" />
                                Test Sound
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-lg">Account</CardTitle>
                            <CardDescription>Manage your account information and data sync.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div>
                                <div className="flex items-center justify-between">
                                    <label htmlFor="sync-switch" className="font-medium flex items-center gap-2">
                                        {isSyncEnabled ? <Cloud className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
                                        Cloud Sync
                                    </label>
                                    <Switch
                                        id="sync-switch"
                                        checked={isSyncEnabled}
                                        onCheckedChange={setIsSyncEnabled}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    When enabled, your data is securely stored and encrypted in the cloud, ensuring your privacy and safety.
                                </p>
                             </div>
                            {user && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Name</span>
                                        {isEditingName ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    value={displayName}
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                    className="h-9"
                                                />
                                                <Button size="icon" onClick={handleNameSave} disabled={isSavingName} className="h-9 w-9">
                                                    {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => setIsEditingName(false)} className="h-9 w-9">
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <span>{user.displayName || "Guest"}</span>
                                                <Button size="icon" variant="ghost" onClick={() => setIsEditingName(true)} className="h-8 w-8">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Email</span>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                           <User className="h-4 w-4" />
                                           <span className="truncate max-w-[150px] sm:max-w-xs">{user.email}</span>
                                        </div>
                                    </div>
                                </>
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
