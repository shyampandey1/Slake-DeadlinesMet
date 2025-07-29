
"use client";

import { useState } from "react";
import { usePresetTasks } from "@/hooks/useFirestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, BrainCircuit, LucideIcon, ListChecks, Bed, StretchHorizontal, Dumbbell, Mail, Users, Coffee, Footprints, Wind, Droplets, BookOpen, Utensils, Target, Wrench, ShoppingBag, WandSparkles, Loader2, ArrowUp, ArrowDown, Paintbrush, Briefcase, Camera, PenTool, BookUser, Lightbulb, Laptop, User, Stethoscope, Server, Megaphone, FlaskConical, TrendingUp, Code, GraduationCap, Feather } from "lucide-react";
import AddTaskDialog from "@/components/AddTaskDialog";
import type { UserPresetTask } from "@/types";
import AuthWrapper from "@/components/AuthWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import HamburgerMenu from "@/components/HamburgerMenu";
import { Textarea } from "@/components/ui/textarea";
import { organizeRoutine } from "@/ai/flows/organize-routine";
import { generateRoutineByProfession } from "@/ai/flows/generate-routine-by-profession";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useProfile } from "@/hooks/useProfile";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const iconMap: { [key: string]: LucideIcon } = {
    ListChecks: ListChecks,
    Bed: Bed,
    StretchHorizontal: StretchHorizontal,
    Dumbbell: Dumbbell,
    BrainCircuit: BrainCircuit,
    Mail: Mail,
    Users: Users,
    Coffee: Coffee,
    Footprints: Footprints,
    Utensils: Utensils,
    Wind: Wind,
    Droplets: Droplets,
    BookOpen: BookOpen,
    Plus: Plus,
    Wrench: Wrench,
    Target: Target,
    ShoppingBag: ShoppingBag,
};

const iconNames = Object.keys(iconMap);

const professionConfig: { [key: string]: { icon: LucideIcon, color: string } } = {
    "Artist": { icon: Paintbrush, color: "bg-red-500/10 text-red-400 border-red-500/30" },
    "Consultant": { icon: Briefcase, color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    "Content Creator": { icon: Camera, color: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
    "Designer": { icon: PenTool, color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
    "Educator": { icon: BookUser, color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
    "Entrepreneur": { icon: Lightbulb, color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
    "Freelancer": { icon: Laptop, color: "bg-lime-500/10 text-lime-400 border-lime-500/30" },
    "General": { icon: User, color: "bg-gray-500/10 text-gray-400 border-gray-500/30" },
    "Healthcare Professional": { icon: Stethoscope, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    "IT Professional": { icon: Server, color: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
    "Manager": { icon: Users, color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" },
    "Marketer": { icon: Megaphone, color: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
    "Researcher": { icon: FlaskConical, color: "bg-teal-500/10 text-teal-400 border-teal-500/30" },
    "Sales": { icon: TrendingUp, color: "bg-green-500/10 text-green-400 border-green-500/30" },
    "Software Engineer": { icon: Code, color: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30" },
    "Student": { icon: GraduationCap, color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
    "Writer": { icon: Feather, color: "bg-stone-500/10 text-stone-400 border-stone-500/30" },
};

function RoutineCustomizationPage() {
  const { presetTasks, addPresetTask, updatePresetTask, deletePresetTask, reorderPresetTask, loading: presetTasksLoading, clearAndSetPresetTasks, getAvailableCategories, getAvailableIcons } = usePresetTasks();
  const { profile, setProfile, customProfession, setCustomProfession, loading: profileLoading } = useProfile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<(UserPresetTask & { category: string }) | undefined>(undefined);
  const [routineDescription, setRoutineDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleOpenDialog = (task?: UserPresetTask, category?: string) => {
    const initialTask = task && category ? { ...task, category } : category ? { category } as any : undefined;
    setTaskToEdit(initialTask);
    setIsDialogOpen(true);
  };

  const handleSaveTask = async (
    taskData: Omit<UserPresetTask, 'id' | 'order'> & { category: string },
    taskId?: string
  ) => {
    if (taskId) {
      await updatePresetTask(taskId, taskData);
    } else {
      await addPresetTask(taskData);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    await deletePresetTask(taskId);
    setIsDialogOpen(false);
  };
  
  const categoriesWithColors = Object.entries(presetTasks).map(([name, { color }]) => ({ name, color }));
  const categoryNames = categoriesWithColors.map(c => c.name);

  const handleGenerateFromDescription = async () => {
    if (!routineDescription.trim()) {
        toast({ title: "Please describe your routine.", variant: "destructive" });
        return;
    }
    setIsGenerating(true);
    try {
        const result = await organizeRoutine({
            description: routineDescription,
            availableIcons: iconNames,
            availableCategories: categoryNames,
        });

        if (result.tasks && result.tasks.length > 0) {
            for (const task of result.tasks) {
                await addPresetTask(task);
            }
            toast({
                title: "Routine Generated!",
                description: `${result.tasks.length} tasks have been added to your routine.`,
            });
            setRoutineDescription("");
        } else {
            toast({
                title: "No tasks were generated.",
                description: "Try describing your routine in more detail.",
                variant: "destructive",
            });
        }
    } catch (error) {
        console.error("Failed to generate routine:", error);
        toast({
            title: "Generation Failed",
            description: "An error occurred while generating the routine.",
            variant: "destructive"
        });
    } finally {
        setIsGenerating(false);
    }
  };

  const handleGenerateByProfession = async () => {
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


  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
            <Card key={i} className="rounded-xl overflow-hidden">
                <CardHeader className="p-3">
                    <Skeleton className="h-5 w-1/2" />
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        ))}
    </div>
  );

  return (
    <div className="flex flex-col h-screen">
         <header className="fixed top-0 left-0 right-0 w-full bg-background/80 backdrop-blur-sm border-b border-border/50 z-10">
          <div className="container mx-auto flex h-16 max-w-4xl items-center justify-between p-4 sm:p-6 md:p-8">
            <div>
              <h1 className="text-xl font-bold font-headline text-foreground/80">Customize Routine</h1>
              <p className="text-sm text-muted-foreground">Tailor your daily tasks from morning to night.</p>
            </div>
            <HamburgerMenu />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pt-16 pb-20">
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl flex items-center gap-2">
                            <BrainCircuit className="text-primary" />
                            Productivity Profile
                        </CardTitle>
                        <CardDescription>
                            Select a default profile to get started or create a new routine below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="profile-select">Choose a Profile</Label>
                             <RadioGroup 
                                value={profile} 
                                onValueChange={(value) => setProfile(value as any)}
                                className="flex flex-wrap gap-2"
                                disabled={profileLoading || isGenerating}
                            >
                                {Object.entries(professionConfig).map(([prof, {icon: Icon, color}]) => (
                                    <div key={prof}>
                                        <RadioGroupItem value={prof} id={prof} className="sr-only" />
                                        <Label htmlFor={prof}
                                            className={cn(
                                                "flex items-center gap-2 rounded-lg p-2 border-2 cursor-pointer w-32 transition-all",
                                                profile === prof ? 'border-primary shadow-lg' : 'border-muted/20 hover:border-muted/50',
                                                color
                                            )}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="text-xs font-medium text-center">{prof}</span>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl flex items-center gap-2">
                            <WandSparkles className="text-primary" />
                            AI-Powered Generation
                        </CardTitle>
                        <CardDescription>
                            Let AI craft a personalized routine for you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                                <Button onClick={handleGenerateByProfession} disabled={isGenerating || !customProfession.trim()}>
                                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="relative">
                            <Separator />
                            <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-card px-2 text-xs text-muted-foreground">OR</span>
                        </div>

                        <div className="space-y-2">
                             <Label htmlFor="custom-profession">Generate from Description</Label>
                            <Textarea
                                placeholder="e.g., 'I wake up, meditate for 10 mins, then do a 90-minute deep work session...'"
                                value={routineDescription}
                                onChange={(e) => setRoutineDescription(e.target.value)}
                                rows={4}
                                className="rounded-md"
                                disabled={isGenerating}
                            />
                            <Button onClick={handleGenerateFromDescription} disabled={isGenerating || !routineDescription.trim()} className="mt-2 w-full">
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    "Generate from Description"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Separator />

                 {presetTasksLoading ? renderSkeleton() : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(presetTasks).map(([category, { tasks, color }]) => (
                        <Card key={category} className="overflow-hidden flex flex-col rounded-xl">
                            <CardHeader className={`${color} p-3`}>
                                <CardTitle className="font-headline text-base">{category}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-3 space-y-2 flex-grow">
                                {tasks.map((task, index) => {
                                const Icon = iconMap[task.icon] || BrainCircuit;
                                return (
                                    <div key={task.id || task.name} className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-3 h-10 px-3 flex-grow"
                                            onClick={() => handleOpenDialog(task, category)}
                                            >
                                            <Icon className="w-5 h-5 text-muted-foreground" />
                                            <span className="flex-1 text-left">{task.name}</span>
                                            <span className="text-sm text-muted-foreground">{task.duration}m</span>
                                        </Button>
                                        {task.id && (
                                            <div className="flex flex-col">
                                                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => reorderPresetTask(task.id!, 'up')} disabled={index === 0}>
                                                    <ArrowUp className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => reorderPresetTask(task.id!, 'down')} disabled={index === tasks.length - 1}>
                                                    <ArrowDown className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                                })}
                            </CardContent>
                            <div className="p-3 pt-0 mt-auto">
                                <Button variant="ghost" className="w-full border-dashed border-2" onClick={() => handleOpenDialog(undefined, category)}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Task
                                </Button>
                            </div>
                        </Card>
                    ))}
                    </div>
                 )}
            </div>
        </main>
        <AddTaskDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onSaveTask={handleSaveTask}
            onDeleteTask={handleDeleteTask}
            initialTask={taskToEdit}
            categories={categoriesWithColors}
        />
    </div>
  );
}


export default function WrappedRoutinePage() {
    return (
        <AuthWrapper>
            <RoutineCustomizationPage />
        </AuthWrapper>
    )
}

    

    

