
"use client";

import { useState, useEffect, useMemo } from "react";
import { usePresetTasks } from "@/hooks/useFirestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, BrainCircuit, LucideIcon, ListChecks, Bed, StretchHorizontal, Dumbbell, Mail, Users, Coffee, Footprints, Wind, Droplets, BookOpen, Utensils, Target, Wrench, ShoppingBag, WandSparkles, Loader2, ArrowUp, ArrowDown, Paintbrush, Briefcase, Camera, PenTool, BookUser, Lightbulb, Laptop, User, Stethoscope, Server, Megaphone, FlaskConical, TrendingUp, Code, GraduationCap, Feather, Clock4, ChevronDown, ChevronRight, ChevronsUpDown, BookCopy } from "lucide-react";
import AddTaskDialog from "@/components/AddTaskDialog";
import type { UserPresetTask } from "@/types";
import AuthWrapper from "@/components/AuthWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import HamburgerMenu from "@/components/HamburgerMenu";
import { generateRoutineByProfession } from "@/ai/flows/generate-routine-by-profession";
import { organizeRoutine } from "@/ai/flows/organize-routine";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useProfile } from "@/hooks/useProfile";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

const initialIconMap: { [key: string]: LucideIcon } = {
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

const iconNames = Object.keys(initialIconMap);

const initialProfessionConfig: { [key: string]: { icon: LucideIcon, color: string } } = {
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

const initialProfileCategories: { [key: string]: string[] } = {
    "Creative & Media": ["Artist", "Content Creator", "Designer", "Writer"],
    "Business & Management": ["Consultant", "Entrepreneur", "Manager", "Marketer", "Sales"],
    "Technical & Health": ["Healthcare Professional", "IT Professional", "Software Engineer", "Researcher"],
    "General & Freelance": ["Educator", "Freelancer", "Student", "General"],
};

type GeneratingStatus = "idle" | "generating" | "saving" | "done";

const examplePrompts = [
    "Add a 30 min workout in the morning.",
    "Read for 20 mins at night.",
    "Schedule 'Team Sync' for 45 minutes in the afternoon.",
    "Plan my day for 15 mins",
    "Work on presentation for 1 hour"
];

function RoutineCustomizationPage() {
  const { presetTasks, addPresetTask, updatePresetTask, deletePresetTask, reorderPresetTask, loading: presetTasksLoading, clearAndSetPresetTasks, getAvailableCategories, getAvailableIcons } = usePresetTasks();
  const { profile, setProfile, loading: profileLoading, customProfessions, addCustomProfession, addTasksToCurrentProfile } = useProfile();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<(UserPresetTask & { category: string }) | undefined>(undefined);
  const [generatingStatus, setGeneratingStatus] = useState<GeneratingStatus>("idle");
  const { toast } = useToast();
  const [routineDescription, setRoutineDescription] = useState("");

  const [professionConfig, setProfessionConfig] = useState(initialProfessionConfig);
  const [profileCategories, setProfileCategories] = useState(initialProfileCategories);
  const [iconMap, setIconMap] = useState(initialIconMap);
  
  const isGenerating = generatingStatus === 'generating' || generatingStatus === 'saving';

  const generateButtonText: { [key in GeneratingStatus]: string } = {
      idle: "Enhance",
      generating: "Enhancing...",
      saving: "Saving tasks...",
      done: "Done!",
  };

  useEffect(() => {
    const newConfig = { ...initialProfessionConfig };
    const newCats = JSON.parse(JSON.stringify(initialProfileCategories));
    const newIcons = { ...initialIconMap, BookCopy: BookCopy };

    customProfessions.forEach(prof => {
        newConfig[prof.name] = { icon: BookCopy, color: "border-slate-500/80 text-slate-400" };
        if (newCats[prof.categoryGroup]) {
            if (!newCats[prof.categoryGroup].includes(prof.name)) {
                newCats[prof.categoryGroup].push(prof.name);
            }
        } else {
            newCats[prof.categoryGroup] = [prof.name];
        }
    });

    setProfessionConfig(newConfig);
    setProfileCategories(newCats);
    setIconMap(newIcons);

  }, [customProfessions]);


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

  const handleEnhanceSchedule = async () => {
    const description = routineDescription.trim();
    if (!description) {
        toast({ title: "Please describe the tasks you want to add.", variant: "destructive" });
        return;
    }
    setGeneratingStatus("generating");

    try {
        const result = await organizeRoutine({
            description,
            availableIcons: getAvailableIcons(),
            availableCategories: getAvailableCategories(profile),
        });
        
        if (result.tasks && result.tasks.length > 0) {
            setGeneratingStatus("saving");
            await addTasksToCurrentProfile(result.tasks);
            setRoutineDescription("");
            toast({
                title: `Routine Enhanced!`,
                description: `${result.tasks.length} new tasks have been added to your schedule.`,
            });
        } else {
            toast({
                title: "No tasks were generated.",
                description: "The AI couldn't understand the description. Please try rephrasing.",
                variant: "destructive"
            });
        }
    } catch (error) {
        console.error("Failed to enhance routine:", error);
        toast({
            title: "Enhancement Failed",
            description: "An error occurred while adding tasks.",
            variant: "destructive"
        });
    } finally {
        setGeneratingStatus("idle");
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
    <div>
        <header className="sticky top-0 left-0 right-0 w-full bg-background/80 backdrop-blur-sm border-b border-border/50 z-10">
          <div className="container mx-auto flex h-16 max-w-4xl items-center justify-between p-4 sm:p-6 md:p-8">
            <div>
              <h1 className="text-xl font-bold font-headline text-foreground/80">Customize Routine</h1>
              <p className="text-sm text-muted-foreground">Tailor your daily tasks from morning to night.</p>
            </div>
            <HamburgerMenu />
          </div>
        </header>

        <main className="pb-20">
            <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl space-y-8">

                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-base flex items-center gap-2">
                            <WandSparkles className="text-primary"/>
                            Enhance my schedule
                        </CardTitle>
                        <CardDescription>Describe tasks you want to add and AI will organize them into your routine.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2">
                            <Textarea 
                                placeholder="Type here..." 
                                value={routineDescription}
                                onChange={(e) => setRoutineDescription(e.target.value)}
                                disabled={isGenerating}
                                rows={3}
                            />
                            <div className="flex flex-wrap gap-2 mt-2">
                                {examplePrompts.map((prompt, index) => (
                                    <Badge 
                                        key={index}
                                        variant="outline" 
                                        className="cursor-pointer hover:bg-muted"
                                        onClick={() => setRoutineDescription(prompt)}
                                    >
                                        {prompt}
                                    </Badge>
                                ))}
                            </div>
                            <Button onClick={handleEnhanceSchedule} disabled={isGenerating || !routineDescription.trim()} className="w-full sm:w-48 self-end mt-2">
                                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {generateButtonText[generatingStatus]}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                
                <Separator />
                
                 <Collapsible defaultOpen={true}>
                    <CollapsibleTrigger className="flex items-center gap-2 text-2xl font-headline w-full">
                        <ChevronDown className="h-6 w-6 transition-transform [&[data-state=open]]:-rotate-180" />
                        1. Choose Your Base Routine
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-6 pt-4">
                        <RadioGroup 
                            value={profile} 
                            onValueChange={(value) => setProfile(value as any)}
                            className="space-y-4"
                            disabled={profileLoading || isGenerating}
                        >
                            {Object.entries(profileCategories).map(([category, professions]) => (
                                <Card key={category} className="overflow-hidden rounded-xl">
                                    <CardHeader className="bg-muted/30 p-3">
                                        <CardTitle className="font-headline text-base">{category}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3 flex flex-wrap gap-2">
                                        {professions.map(prof => {
                                            const config = professionConfig[prof];
                                            if (!config) return null;
                                            const { icon: Icon, color } = config;
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
                    </CollapsibleContent>
                </Collapsible>
                
                <Collapsible defaultOpen={true}>
                     <CollapsibleTrigger className="flex items-center gap-2 text-2xl font-headline w-full">
                        <ChevronDown className="h-6 w-6 transition-transform [&[data-state=open]]:-rotate-180" />
                        2. Customize Your Tasks
                    </CollapsibleTrigger>
                     <CollapsibleContent className="space-y-6 pt-4">
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
                                            <div key={task.id || `${task.name}-${index}`} className="flex items-center gap-1">
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
                     </CollapsibleContent>
                </Collapsible>
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

    

    

    