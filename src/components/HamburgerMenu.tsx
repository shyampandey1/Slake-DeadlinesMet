
"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, User, X, History, Sun, Moon, ClipboardList, WandSparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { ScrollArea } from "./ui/scroll-area";
import { useTheme } from "@/hooks/useTheme";
import { useProfile } from "@/hooks/useProfile";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { useToast } from "@/hooks/use-toast";
import { generateRoutineByProfession } from "@/ai/flows/generate-routine-by-profession";
import { usePresetTasks } from "@/hooks/useFirestore";


export default function HamburgerMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { profile, setProfile, customProfession, setCustomProfession, loading: profileLoading } = useProfile();
  const { clearAndSetPresetTasks, getAvailableCategories, getAvailableIcons } = usePresetTasks();
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/auth');
  };
  
  const navigateToHistory = () => {
    router.push('/history');
  }
  
  const navigateToRoutine = () => {
    router.push('/routine');
  }

  const handleGenerateRoutine = async () => {
    if (!customProfession.trim()) {
        toast({ title: "Please enter a profession.", variant: "destructive" });
        return;
    }
    setIsGenerating(true);
    try {
        const result = await generateRoutineByProfession({
            profession: customProfession,
            availableIcons: getAvailableIcons(),
            availableCategories: getAvailableCategories(),
        });
        
        if (result.tasks && result.tasks.length > 0) {
            await clearAndSetPresetTasks(result.tasks);
            setProfile("Custom");
            toast({
                title: `Routine for ${customProfession} Generated!`,
                description: `${result.tasks.length} tasks have been added.`,
            });
        } else {
            toast({
                title: "No tasks were generated.",
                description: "The AI couldn't generate a routine. Please try a different profession.",
                variant: "destructive",
            });
        }
    } catch (error) {
        console.error("Failed to generate custom routine:", error);
        toast({
            title: "Generation Failed",
            description: "An error occurred while generating the routine.",
            variant: "destructive"
        });
    } finally {
        setIsGenerating(false);
    }
  };


  return (
      <Sheet>
        <SheetTrigger asChild>
            <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
            </Button>
        </SheetTrigger>
        <SheetContent side="right" className="flex flex-col">
          <SheetHeader className="flex flex-row justify-between items-center">
            <SheetTitle className="font-headline text-2xl">Menu</SheetTitle>
            <SheetClose asChild>
                <Button variant="ghost" size="icon">
                    <X className="h-6 w-6" />
                </Button>
            </SheetClose>
          </SheetHeader>
          <div className="py-4">
            {user && (
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3 mb-4">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground truncate">
                  {user.email}
                </span>
              </div>
            )}
          </div>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
                <Button variant="ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full justify-start gap-2">
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    <span>Toggle Theme</span>
                </Button>
                <SheetClose asChild>
                  <Button variant="ghost" onClick={navigateToHistory} className="w-full justify-start gap-2">
                      <History className="h-5 w-5" />
                      <span>Task History</span>
                  </Button>
                </SheetClose>
                 <SheetClose asChild>
                  <Button variant="ghost" onClick={navigateToRoutine} className="w-full justify-start gap-2">
                      <ClipboardList className="h-5 w-5" />
                      <span>Customize Routine</span>
                  </Button>
                </SheetClose>

                <Separator />
                
                <div className="space-y-4 px-1">
                    <h4 className="font-semibold text-foreground">Productivity Profile</h4>
                    <div className="space-y-2">
                        <Label htmlFor="profile-select">Choose a Profile</Label>
                         <Select onValueChange={(value) => setProfile(value as any)} value={profile} disabled={profileLoading || isGenerating}>
                            <SelectTrigger id="profile-select">
                                <SelectValue placeholder="Select a profile..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                                <SelectItem value="Student">Student</SelectItem>
                                <SelectItem value="General">General</SelectItem>
                                {profile === 'Custom' && <SelectItem value="Custom" disabled>Custom</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="text-center text-xs text-muted-foreground">OR</div>

                    <div className="space-y-2">
                        <Label htmlFor="custom-profession">Generate for a Profession</Label>
                        <div className="flex gap-2">
                            <Input 
                                id="custom-profession"
                                placeholder="e.g., Doctor, Artist"
                                value={customProfession}
                                onChange={(e) => setCustomProfession(e.target.value)}
                                disabled={isGenerating}
                            />
                            <Button onClick={handleGenerateRoutine} disabled={isGenerating || !customProfession.trim()}>
                                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>

            </div>
          </ScrollArea>
          <SheetFooter className="mt-auto pt-4">
            <SheetClose asChild>
                <Button onClick={handleLogout} variant="outline" className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
                </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
  );
}
