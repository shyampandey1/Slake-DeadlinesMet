
"use client";

import { useState } from "react";
import { usePresetTasks } from "@/hooks/useFirestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, BrainCircuit, LucideIcon, ListChecks, Bed, StretchHorizontal, Dumbbell, Mail, Users, Coffee, Footprints, Wind, Droplets, BookOpen, Utensils, Target, Wrench, ShoppingBag, WandSparkles, Loader2, ArrowUp, ArrowDown } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
                            Select a default profile or generate a new one based on a profession to get started.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                        <div className="relative">
                            <Separator />
                            <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-background px-2 text-xs text-muted-foreground">OR</span>
                        </div>
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl flex items-center gap-2">
                            <WandSparkles className="text-primary" />
                            Generate from Description
                        </CardTitle>
                        <CardDescription>
                            Describe your daily routine in the text box below, and let AI organize it for you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder="e.g., 'I wake up, meditate for 10 mins, then do a 90-minute deep work session...'"
                            value={routineDescription}
                            onChange={(e) => setRoutineDescription(e.target.value)}
                            rows={4}
                            className="rounded-md"
                            disabled={isGenerating}
                        />
                        <Button onClick={handleGenerateFromDescription} disabled={isGenerating || !routineDescription.trim()}>
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                "Generate Routine"
                            )}
                        </Button>
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
