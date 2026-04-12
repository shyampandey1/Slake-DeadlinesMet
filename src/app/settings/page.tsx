
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
import { useProfile } from "@/hooks/useProfile";
import { Sun, Moon, Bell, Volume2, Trash2, Cloud, CloudOff, User, Edit, Check, X, Loader2, LocateFixed, Save, Award, Activity, Heart, Globe } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

function SettingsPageComponent() {
    const { theme, setTheme } = useTheme();
    const { user, updateUserDisplayName, isSyncEnabled, setIsSyncEnabled } = useAuth();
    const { profileData, updateUserProfileData } = useProfile();
    const { clearTasks } = useTasks();
    const { isAudioEnabled, setAudioEnabled, sounds, selectedSound, setSelectedSound, volume, setVolume, testSound } = useAudioSettings();
    const { location, setLocation, unit, setUnit, loading: weatherLoading, fetchWeatherForCurrentUserLocation } = useWeather();
    
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [displayName, setDisplayName] = useState(user?.displayName || "");
    const [isSavingName, setIsSavingName] = useState(false);
    const { toast } = useToast();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [offlineNotificationsEnabled, setOfflineNotificationsEnabled] = useState(false);
    const [tempLocation, setTempLocation] = useState(location);
    const [mounted, setMounted] = useState(false);
    
    // Elite Streak State
    const [elitePhone, setElitePhone] = useState(profileData?.phone || "");
    const [eliteInsta, setEliteInsta] = useState(profileData?.instagramLink || "");
    const [isSavingElite, setIsSavingElite] = useState(false);

    // Health & Regional Dashboard State
    const [region, setRegion] = useState(profileData?.region || "Asia/Kolkata");
    const [country, setCountry] = useState(profileData?.country || "India");
    const [currency, setCurrency] = useState(profileData?.currency || "INR");
    const [weight, setWeight] = useState(profileData?.weight || 0);
    const [height, setHeight] = useState(profileData?.height || 0);
    const [avgBP, setAvgBP] = useState(profileData?.averageBP || "120/80");
    const [googleFitConnected, setGoogleFitConnected] = useState(profileData?.googleFitConnected || false);
    const [isSavingHealth, setIsSavingHealth] = useState(false);

    useEffect(() => {
        if (profileData) {
            setElitePhone(profileData.phone || "");
            setEliteInsta(profileData.instagramLink || "");
            setRegion(profileData.region || "Asia/Kolkata");
            setCountry(profileData.country || "India");
            setCurrency(profileData.currency || "INR");
            setWeight(profileData.weight || 0);
            setHeight(profileData.height || 0);
            setAvgBP(profileData.averageBP || "120/80");
            setGoogleFitConnected(profileData.googleFitConnected || false);
        }
    }, [profileData]);

    const calculateBMI = (w: number, h: number) => {
        if (w > 0 && h > 0) {
            const heightInMeters = h / 100;
            return (w / (heightInMeters * heightInMeters)).toFixed(1);
        }
        return "N/A";
    };

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotificationsEnabled(Notification.permission === 'granted');
        }
        
        const savedOffline = localStorage.getItem('deadlinesmet_offline_notifications');
        if (savedOffline) {
            setOfflineNotificationsEnabled(savedOffline === 'true');
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
                import('@/lib/fcm').then(({ requestFirebaseNotificationPermission }) => {
                     if(user && !('isMockUser' in user)) requestFirebaseNotificationPermission(user.uid);
                });
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    setNotificationsEnabled(true);
                    toast({ title: "Notifications enabled!" });
                    import('@/lib/fcm').then(({ requestFirebaseNotificationPermission }) => {
                         if(user && !('isMockUser' in user)) requestFirebaseNotificationPermission(user.uid);
                    });
                } else {
                    setNotificationsEnabled(false);
                    toast({ title: "Notifications permission denied.", variant: 'destructive' });
                }
            } else {
                setNotificationsEnabled(false);
                toast({ title: "Notifications are blocked by your browser.", description: "You'll need to change the setting in your browser to enable them." });
            }
        } else {
            setNotificationsEnabled(false);
            setOfflineNotificationsEnabled(false);
            localStorage.setItem('deadlinesmet_offline_notifications', 'false');
        }
    };

    const handleOfflineNotificationToggle = (enabled: boolean) => {
        if (enabled && !notificationsEnabled) {
            toast({ 
                title: "Enable Push Notifications first", 
                description: "Offline reminders require notification permissions.",
                variant: "destructive" 
            });
            return;
        }
        setOfflineNotificationsEnabled(enabled);
        localStorage.setItem('deadlinesmet_offline_notifications', enabled.toString());
        if (enabled) {
            toast({ 
                title: "Offline Reminders Enabled", 
                description: "You'll receive alerts even if you're offline or the app is closed." 
            });
        }
    };

    const handleSaveEliteData = async () => {
        setIsSavingElite(true);
        try {
            await updateUserProfileData({ phone: elitePhone, instagramLink: eliteInsta });
            toast({ title: "Elite Data Saved!", description: "You are now fully participating in the Elite Streak." });
        } catch(e: any) {
            toast({ title: "Error Saving", description: e.message, variant: "destructive" });
        } finally {
            setIsSavingElite(false);
        }
    }

    const handleSaveHealthRegional = async () => {
        setIsSavingHealth(true);
        try {
            await updateUserProfileData({ 
                region, country, currency, 
                weight, height, averageBP: avgBP, 
                bmi: parseFloat(calculateBMI(weight, height)) || 0,
                googleFitConnected 
            });
            toast({ title: "Profile Updated", description: "Your bio-data and region preferences are synced." });
        } catch(e: any) {
            toast({ title: "Error Updating", description: e.message, variant: "destructive" });
        } finally {
            setIsSavingHealth(false);
        }
    }

    const connectGoogleFit = async () => {
        // Mocking OAuth flow success
        setGoogleFitConnected(true);
        setAvgBP("118/79"); // Mock fetch from Fit
        toast({ 
            title: "Google Fit Connected", 
            description: "Average BP imported. By connecting, you agree to our generalized data privacy policy for health metrics." 
        });
        await handleSaveHealthRegional();
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
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                                    className="relative flex items-center justify-center border-primary/20 hover:bg-primary/5"
                                >
                                    {mounted && (
                                        <>
                                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
                                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
                                        </>
                                    )}
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

                            <div className="pt-4 border-t border-border/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="offline-notifications-switch" className="font-medium flex items-center gap-2">
                                            <CloudOff className="h-4 w-4 text-amber-500" />
                                            Offline Reminders
                                        </label>
                                        <p className="text-[10px] text-muted-foreground">
                                            Get notified exactly when tasks end, even without internet.
                                        </p>
                                    </div>
                                    <Switch
                                        id="offline-notifications-switch"
                                        checked={offlineNotificationsEnabled}
                                        onCheckedChange={handleOfflineNotificationToggle}
                                    />
                                </div>
                            </div>
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
                                    value={volume}
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

                    <Card className="border-amber-500/50 shadow-amber-500/10">
                        <CardHeader>
                            <CardTitle className="font-headline text-lg flex items-center gap-2">
                                <Award className="h-5 w-5 text-amber-500" />
                                Elite Streak Program
                            </CardTitle>
                            <CardDescription>Enroll with your details to receive streak rescues and social callouts.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="elite-phone">Phone Number (For WhatsApp/SMS fallback)</Label>
                                <Input 
                                    id="elite-phone"
                                    value={elitePhone}
                                    onChange={(e) => setElitePhone(e.target.value)}
                                    placeholder="+1 555-0199"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="elite-insta">Instagram Link (For Streak Share Tagging)</Label>
                                <Input 
                                    id="elite-insta"
                                    value={eliteInsta}
                                    onChange={(e) => setEliteInsta(e.target.value)}
                                    placeholder="https://instagram.com/yourhandle"
                                />
                            </div>
                            <Button className="w-full" onClick={handleSaveEliteData} disabled={isSavingElite}>
                                {isSavingElite ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Elite Profile
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/20 shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline text-lg flex items-center gap-2">
                                <Globe className="h-5 w-5 text-blue-500" />
                                Regional & Health Profile
                            </CardTitle>
                            <CardDescription>Setup your display currency, BMI trackers, and smart-watch vitals.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="India" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency Code (Rewards)</Label>
                                    <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="INR / USD" />
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="weight">Weight (kg)</Label>
                                    <Input id="weight" type="number" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="height">Height (cm)</Label>
                                    <Input id="height" type="number" value={height} onChange={(e) => setHeight(parseFloat(e.target.value))} />
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                                <span className="font-bold">Estimated BMI</span>
                                <Badge variant={calculateBMI(weight, height) !== "N/A" && parseFloat(calculateBMI(weight, height)) < 25 ? "default" : "destructive"}>
                                    {calculateBMI(weight, height)}
                                </Badge>
                            </div>

                            <div className="pt-4 border-t border-border/50 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <Label className="font-bold flex items-center gap-2"><Heart className="text-rose-500 w-4 h-4" /> Google Fit Vitals</Label>
                                        <p className="text-xs text-muted-foreground mt-1">Avg BP: {avgBP}</p>
                                    </div>
                                    <Button size="sm" variant={googleFitConnected ? "outline" : "default"} onClick={connectGoogleFit}>
                                        {googleFitConnected ? "Fit Connected" : "Link Google Fit"}
                                    </Button>
                                </div>
                                {!googleFitConnected && <p className="text-[10px] text-muted-foreground">Privacy Note: Slake stores biometrics locally and encrypted in Firestore purely for display and streak analytics. Fit data requires Google OAuth consent.</p>}
                            </div>

                            <Button className="w-full mt-4" onClick={handleSaveHealthRegional} disabled={isSavingHealth}>
                                {isSavingHealth ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Update Profile Data
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
