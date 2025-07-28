
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Coffee, Droplets, BrainCircuit, Mail, ListChecks, Users, Utensils, Bed, Footprints, Dumbbell, StretchHorizontal, Wind, BookOpen, Plus, ChevronDown, Wrench, Target, ShoppingBag, X } from 'lucide-react';
import { isToday, parseISO } from 'date-fns';
import React, { useMemo, useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Rocket } from "lucide-react";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import { useTasks } from "@/hooks/useFirestore";
import AddTaskDialog from "./AddTaskDialog";
import type { Preset, PresetTask } from "@/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

const formSchema = z.object({
  taskName: z.string().min(1, {
    message: "Task name cannot be empty.",
  }),
  duration: z.coerce.number().min(1, {
    message: "Duration must be at least 1 minute.",
  }),
});

const initialPresetTasks: Preset = {
    'Morning Routine': {
        color: "bg-sky-200/80 text-sky-900 hover:bg-sky-200 dark:bg-sky-800/60 dark:text-sky-100 dark:hover:bg-sky-800",
        tasks: [
            { name: 'Plan Day', duration: 15, icon: 'ListChecks' },
            { name: 'Meditate', duration: 10, icon: 'Bed' },
            { name: 'Stretching', duration: 10, icon: 'StretchHorizontal' },
        ]
    },
    'Work & Focus': {
        color: "bg-blue-200/80 text-blue-900 hover:bg-blue-200 dark:bg-blue-800/60 dark:text-blue-100 dark:hover:bg-blue-800",
        tasks: [
            { name: 'Deep Work', duration: 90, icon: 'BrainCircuit' },
            { name: 'Focus Session', duration: 50, icon: 'BrainCircuit' },
            { name: 'Check Emails', duration: 15, icon: 'Mail' },
            { name: 'Stand-up', duration: 15, icon: 'Users' },
        ]
    },
    'Health & Wellness': {
        color: "bg-green-200/80 text-green-900 hover:bg-green-200 dark:bg-green-800/60 dark:text-green-100 dark:hover:bg-green-800",
        tasks: [
            { name: 'Workout', duration: 45, icon: 'Dumbbell' },
            { name: 'Stretching', duration: 10, icon: 'StretchHorizontal' },
            { name: 'Drink Water', duration: 1, icon: 'Droplets', recurring: true },
        ]
    },
    'Breaks & Meals': {
        color: "bg-amber-200/80 text-amber-900 hover:bg-amber-200 dark:bg-amber-800/60 dark:text-amber-100 dark:hover:bg-amber-800",
        tasks: [
            { name: 'Short Break', duration: 5, icon: 'Coffee', recurring: true },
            { name: 'Walk', duration: 15, icon: 'Footprints' },
            { name: 'Lunch Break', duration: 45, icon: 'Utensils' },
            { name: 'Breathing Practice', duration: 5, icon: 'Wind', recurring: true },
        ]
    },
    'Evening Wind-down': {
        color: "bg-indigo-200/80 text-indigo-900 hover:bg-indigo-200 dark:bg-indigo-800/60 dark:text-indigo-100 dark:hover:bg-indigo-800",
        tasks: [
            { name: 'Read a book', duration: 30, icon: 'BookOpen' },
            { name: 'Journal', duration: 15, icon: 'ListChecks' },
        ]
    }
};

const iconMap: { [key: string]: React.ReactNode } = {
    ListChecks: <ListChecks className="mr-2 h-4 w-4" />,
    Bed: <Bed className="mr-2 h-4 w-4" />,
    StretchHorizontal: <StretchHorizontal className="mr-2 h-4 w-4" />,
    Dumbbell: <Dumbbell className="mr-2 h-4 w-4" />,
    BrainCircuit: <BrainCircuit className="mr-2 h-4 w-4" />,
    Mail: <Mail className="mr-2 h-4 w-4" />,
    Users: <Users className="mr-2 h-4 w-4" />,
    Coffee: <Coffee className="mr-2 h-4 w-4" />,
    Footprints: <Footprints className="mr-2 h-4 w-4" />,
    Utensils: <Utensils className="mr-2 h-4 w-4" />,
    Wind: <Wind className="mr-2 h-4 w-4" />,
    Droplets: <Droplets className="mr-2 h-4 w-4" />,
    BookOpen: <BookOpen className="mr-2 h-4 w-4" />,
    Plus: <Plus className="mr-2 h-4 w-4" />,
    Wrench: <Wrench className="mr-2 h-4 w-4" />,
    Target: <Target className="mr-2 h-4 w-4" />,
    ShoppingBag: <ShoppingBag className="mr-2 h-4 w-4" />,
};

// Helper function to check if a task is one of the initial default tasks.
const isDefaultTask = (task: PresetTask, category: string): boolean => {
    return initialPresetTasks[category]?.tasks.some(
      (initialTask) =>
        initialTask.name === task.name &&
        initialTask.duration === task.duration &&
        initialTask.icon === task.icon
    ) ?? false;
};

export default function TaskForm() {
  const router = useRouter();
  const { tasks: completedTasks } = useTasks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Work & Focus');
  const [presetTasks, setPresetTasks] = useState<Preset>(initialPresetTasks);
  const [isCustomTaskOpen, setIsCustomTaskOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<PresetTask | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskName: "",
      duration: 25,
    },
  });

  const handleOpenDialog = (category: string) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  const handleAddTask = (newTask: PresetTask, category: string) => {
    setPresetTasks(prev => {
        const updatedCategory = {
            ...prev[category],
            tasks: [...prev[category].tasks, newTask]
        };
        return {
            ...prev,
            [category]: updatedCategory
        };
    });
  };

  const handleDeleteTask = (taskToDelete: PresetTask, category: string) => {
    setPresetTasks(prev => {
        const updatedTasks = prev[category].tasks.filter(task => task.name !== taskToDelete.name);
        return {
            ...prev,
            [category]: {
                ...prev[category],
                tasks: updatedTasks
            }
        };
    });
    setTaskToDelete(null);
  };

  const visiblePresetTasks = useMemo(() => {
    const completedToday = completedTasks
      .filter(task => task.completed && task.createdAt && isToday(parseISO(task.createdAt)))
      .map(task => task.name);
  
    const filteredTasks: Preset = {};
  
    for (const category in presetTasks) {
      const { tasks, color } = presetTasks[category as keyof typeof presetTasks];
      const remaining = tasks.filter(task => !completedToday.includes(task.name) || task.recurring);
  
      if (remaining.length > 0) {
        filteredTasks[category as keyof typeof presetTasks] = { tasks: remaining, color };
      }
    }
    return filteredTasks;
  }, [completedTasks, presetTasks]);
  
  const handlePresetClick = (preset: PresetTask, category: string) => {
    const isCustom = !isDefaultTask(preset, category);
    if (isCustom) {
        if (taskToDelete?.name === preset.name) {
            // If already selected, deselect it
            setTaskToDelete(null);
        } else {
            // Select for deletion
            setTaskToDelete(preset);
        }
        return; 
    }
    
    // Default task behavior
    setIsCustomTaskOpen(true);
    form.setValue('taskName', preset.name);
    form.setValue('duration', preset.duration);
    
    setTimeout(() => {
        const formElement = document.querySelector('form');
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
  };


  function onSubmit(values: z.infer<typeof formSchema>) {
    const params = new URLSearchParams({
      task: values.taskName,
      duration: values.duration.toString(),
    });
    router.push(`/timer?${params.toString()}`);
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Quick Start Tasks</CardTitle>
        <CardDescription>Choose from a list of common tasks to get started quickly.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-8">
            <Carousel opts={{
                align: "start",
                loop: false,
            }}
            variant="subtle"
            >
                <CarouselContent>
                    {Object.entries(visiblePresetTasks).map(([category, {tasks, color}]) => (
                        <CarouselItem key={category} className="basis-auto md:basis-1/2 lg:basis-1/3">
                            <div className="p-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">{category}</h3>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleOpenDialog(category)}>
                                        <Plus className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground" />
                                    </Button>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {tasks.map((preset) => (
                                        <div key={preset.name} className="relative group">
                                            <Badge
                                                variant="secondary"
                                                className={cn("w-full text-sm justify-between py-2 px-3 border-transparent cursor-pointer", color)}
                                                onClick={() => handlePresetClick(preset, category)}
                                            >
                                                <div className="flex items-center flex-1 min-w-0">
                                                    {iconMap[preset.icon] || <BrainCircuit className="mr-2 h-4 w-4" />}
                                                    <span className="truncate">{preset.name}</span>
                                                </div>
                                                <span className="text-xs opacity-75 ml-2 shrink-0">{preset.duration} min</span>
                                            </Badge>
                                             {taskToDelete?.name === preset.name && !isDefaultTask(preset, category) && (
                                                <button
                                                    onClick={() => handleDeleteTask(preset, category)}
                                                    className="absolute -top-2 -right-2 z-20 flex items-center justify-center h-6 w-6 rounded-full bg-destructive text-destructive-foreground transition-opacity"
                                                >
                                                    <X className="h-4 w-4" />
                                                    <span className="sr-only">Delete task</span>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        </div>
        
        <Separator />

        <Collapsible open={isCustomTaskOpen} onOpenChange={setIsCustomTaskOpen}>
            <CollapsibleTrigger asChild>
                <div className="flex justify-center items-center cursor-pointer py-4 text-sm text-muted-foreground hover:text-foreground">
                    <span>Or create a custom task</span>
                    <ChevronDown className={cn("h-4 w-4 ml-1 transition-transform", isCustomTaskOpen && "rotate-180")} />
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                    control={form.control}
                    name="taskName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Task Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Design the main page" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Duration (in minutes)</FormLabel>
                        <FormControl>
                            <div className="flex items-center gap-4">
                            <Slider
                                min={1}
                                max={120}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                            />
                            <Input
                                type="number"
                                min={1}
                                max={120}
                                {...field}
                                className="w-24 text-center font-bold text-primary text-lg"
                                onChange={(e) => {
                                    const value = e.target.value === '' ? 1 : parseInt(e.target.value, 10);
                                    field.onChange(value);
                                }}
                            />
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    <Rocket className="mr-2 h-4 w-4" />
                    Start Custom Timer
                    </Button>
                </form>
                </Form>
            </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
    <AddTaskDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAddTask={handleAddTask}
        initialCategory={selectedCategory}
        categories={Object.keys(presetTasks)}
      />
    </>
  );
}
