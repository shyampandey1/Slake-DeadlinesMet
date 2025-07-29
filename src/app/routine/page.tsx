
"use client";

import { useState, useEffect, useRef } from "react";
import { usePresetTasks } from "@/hooks/useFirestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, BrainCircuit, LucideIcon, ListChecks, Bed, StretchHorizontal, Dumbbell, Mail, Users, Coffee, Footprints, Wind, Droplets, BookOpen, Utensils, Target, Wrench, ShoppingBag, WandSparkles, Loader2, ArrowUp, ArrowDown, Paintbrush, Briefcase, Camera, PenTool, BookUser, Lightbulb, Laptop, User, Stethoscope, Server, Megaphone, FlaskConical, TrendingUp, Code, GraduationCap, Feather, Clock4, ChevronDown } from "lucide-react";
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
import { add, format, set } from "date-fns";
import { Badge } from "@/components/ui/badge";

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
    "Artist": { icon: Paintbrush, color: "border-red-500/80 text-red-400" },
    "Consultant": { icon: Briefcase, color: "border-blue-500/80 text-blue-400" },
    "Content Creator": { icon: Camera, color: "border-orange-500/80 text-orange-400" },
    "Designer": { icon: PenTool, color: "border-purple-500/80 text-purple-400" },
    "Educator": { icon: BookUser, color: "border-cyan-500/80 text-cyan-400" },
    "Entrepreneur": { icon: Lightbulb, color: "border-amber-500/80 text-amber-400" },
    "Freelancer": { icon: Laptop, color: "border-lime-500/80 text-lime-400" },
    "General": { icon: User, color: "border-gray-500/80 text-gray-400" },
    "Healthcare Professional": { icon: Stethoscope, color: "border-emerald-500/80 text-emerald-400" },
    "IT Professional": { icon: Server, color: "border-sky-500/80 text-sky-400" },
    "Manager": { icon: Users, color: "border-indigo-500/80 text-indigo-400" },
    "Marketer": { icon: Megaphone, color: "border-rose-500/80 text-rose-400" },
    "Researcher": { icon: FlaskConical, color: "border-teal-500/80 text-teal-400" },
    "Sales": { icon: TrendingUp, color: "border-green-500/80 text-green-400" },
    "Software Engineer": { icon: Code, color: "border-fuchsia-500/80 text-fuchsia-400" },
    "Student": { icon: GraduationCap, color: "border-yellow-500/80 text-yellow-400" },
    "Writer": { icon: Feather, color: "border-stone-500/80 text-stone-400" },
};

const profileCategories = {
    "Creative & Media": ["Artist", "Content Creator", "Designer", "Writer"],
    "Business & Management": ["Consultant", "Entrepreneur", "Manager", "Marketer", "Sales"],
    "Technical & Health": ["Healthcare Professional", "IT Professional", "Software Engineer", "Researcher"],
    "General & Freelance": ["Educator", "Freelancer", "Student", "General"],
};

type TimedTask = UserPresetTask & {
    category: string;
    color: string;
    startTime: Date;
    endTime: Date;
};

function RoutineCustomizationPage() {
  const { presetTasks, addPresetTask, updatePresetTask, deletePresetTask, reorderPresetTask, loading: presetTasksLoading, clearAndSetPresetTasks, getAvailableCategories, getAvailableIcons } = usePresetTasks();
  const { profile, setProfile, customProfession, setCustomProfession, loading: profileLoading } = useProfile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<(UserPresetTask & { category: string }) | undefined>(undefined);
  const [routineDescription, setRoutineDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  const [timedTasks, setTimedTasks] = useState<TimedTask[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const activeTaskRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Calculate start and end times for each task
    const calculateTimes = () => {
        let cumulativeTime = set(new Date(), { hours: 7, minutes: 0, seconds: 0, milliseconds: 0 });
        const allTasks: TimedTask[] = [];

        Object.entries(presetTasks).forEach(([category, { tasks, color }]) => {
            tasks.forEach(task => {
                const startTime = cumulativeTime;
                const endTime = add(startTime, { minutes: task.duration });
                allTasks.push({ ...task, category, color, startTime, endTime });
                cumulativeTime = endTime;
            });
        });
        setTimedTasks(allTasks);
    };

    if (Object.keys(presetTasks).length > 0) {
        calculateTimes();
    }
  }, [presetTasks]);
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Scroll to active task on initial load
    if (timedTasks.length > 0 && activeTaskRef.current) {
      activeTaskRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [timedTasks]);

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
                
                <div>
                  <div className="flex items-center justify-between px-1 mb-4 group">
                      <div>
                        <h2 className="font-headline text-2xl">Today's Routine</h2>
                        <p className="text-muted-foreground">Your daily schedule at a glance.</p>
                      </div>
                  </div>
                  <div className="relative space-y-4 max-h-[400px] overflow-y-auto pr-4">
                    {timedTasks.map((task, index) => {
                      const Icon = iconMap[task.icon] || BrainCircuit;
                      const is_active = currentTime >= task.startTime && currentTime < task.endTime;
                      const is_past = currentTime >= task.endTime;

                      return (
                        <div key={task.id || task.name} className="flex items-start gap-3 relative pl-6" ref={is_active ? activeTaskRef : null}>
                            <div className="absolute left-0 top-0 flex flex-col items-center h-full">
                                <div className={cn("w-3.5 h-3.5 rounded-full mt-1.5 border-2", 
                                  is_active ? "border-primary bg-primary/20" : "border-border",
                                  is_past ? "border-primary bg-primary" : ""
                                )}></div>
                                {index < timedTasks.length - 1 && (
                                  <div className={cn("w-px h-full my-1", is_past ? "bg-primary" : "bg-border")}></div>
                                )}
                            </div>

                            <div className="flex-1 -mt-0.5">
                                <p className="text-xs text-muted-foreground">
                                  {format(task.startTime, 'p')}
                                </p>
                                <div
                                    className={cn(
                                      "h-auto py-2 px-3 justify-start gap-2.5 whitespace-normal w-full mt-1 border rounded-lg flex items-center",
                                      is_active && "border-primary shadow-lg"
                                    )}
                                >
                                    <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                                    <span className="flex-1 text-left text-sm">{task.name}</span>
                                    <Badge variant={is_active ? "default" : "secondary"}>
                                      <Clock4 className="w-3 h-3 mr-1.5"/>
                                      {task.duration}m
                                    </Badge>
                                </div>
                            </div>
                        </div>
                      )
                    })}
                  </div>
                </div>


                <Separator />
                
                <div className="space-y-2">
                    <h2 className="font-headline text-2xl">Choose a Profile</h2>
                    <RadioGroup 
                        value={profile} 
                        onValueChange={(value) => setProfile(value as any)}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        disabled={profileLoading || isGenerating}
                    >
                        {Object.entries(profileCategories).map(([category, professions]) => (
                            <Card key={category} className="overflow-hidden rounded-xl">
                                <CardHeader className="bg-muted/30 p-3">
                                    <CardTitle className="font-headline text-base">{category}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 flex flex-wrap gap-2">
                                    {professions.map(prof => {
                                        const { icon: Icon, color } = professionConfig[prof];
                                        return (
                                            <div key={prof}>
                                                <RadioGroupItem value={prof} id={prof} className="sr-only" />
                                                <Label htmlFor={prof}
                                                    className={cn(
                                                        "flex items-center gap-2 rounded-full p-2 border-2 cursor-pointer transition-all bg-card hover:bg-muted/50",
                                                        profile === prof ? `shadow-lg ${color}` : 'border-transparent text-muted-foreground',
                                                        color.replace('border', 'hover:border')
                                                    )}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                    <span className="text-xs font-medium">{prof}</span>
                                                </Label>
                                            </div>
                                        )
                                    })}
                                </CardContent>
                            </Card>
                        ))}
                    </RadioGroup>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl flex items-center gap-2">
                            <WandSparkles className="text-primary" />
                            AI-Powered Customization
                        </CardTitle>
                        <CardDescription>
                            Let AI craft a personalized routine for you or edit your current one.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="custom-profession">Generate for a New Profession</Label>
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
                             <Label htmlFor="custom-profession">Generate from a Description</Label>
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
                
                <div>
                     <h2 className="font-headline text-2xl mb-4">Edit Current Routine</h2>
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

    