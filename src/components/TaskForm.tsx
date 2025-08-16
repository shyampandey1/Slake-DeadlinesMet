

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Coffee, Droplets, BrainCircuit, Mail, ListChecks, Users, Utensils, Bed, Footprints, Dumbbell, StretchHorizontal, Wind, BookOpen, Plus, Wrench, Target, ShoppingBag, LucideIcon, Clock, Calendar, FolderSearch, Gamepad2, Eye, PenTool, Smartphone, Car, Tv, Apple, ShowerHead, Truck, FileCode, PenSquare, Puzzle, Lightbulb, Presentation, BarChart, ShoppingCart } from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { EmblaCarouselType } from 'embla-carousel-react'
import { format, isToday, parseISO } from "date-fns";
import Link from "next/link";

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "./ui/separator";
import { usePresetTasks, useCalendarEvents } from "@/hooks/useFirestore";
import AddTaskDialog from "./AddTaskDialog";
import type { UserPresetTask, Preset } from "@/types";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import { Slider } from "./ui/slider";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { useProfile } from "@/hooks/useProfile";
import { Skeleton } from "./ui/skeleton";


const formSchema = z.object({
  taskName: z.string().min(1, {
    message: "Task name cannot be empty.",
  }),
  duration: z.coerce.number().min(1, {
    message: "Duration must be at least 1 minute.",
  }),
  category: z.string().optional(),
});

const iconMap: { [key: string]: LucideIcon } = {
    ListChecks,
    Bed,
    StretchHorizontal,
    Dumbbell,
    BrainCircuit,
    Mail,
    Users,
    Coffee,
    Footprints,
    Utensils,
    Wind,
    Droplets,
    BookOpen,
    Plus,
    Wrench,
    Target,
    ShoppingBag,
    Calendar,
    Gamepad: Gamepad2,
    Eye,
    PenTool,
    Smartphone,
    Car,
    Tv,
    Apple,
    ShowerHead,
    Truck,
    FileCode,
    PenSquare,
    Puzzle,
    Lightbulb,
    Presentation,
    BarChart,
    ShoppingCart
};

function formatDuration(minutes: number): string {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
}

export default function TaskForm() {
  const router = useRouter();
  const { presetTasks, loading, addPresetTask, updatePresetTask, deletePresetTask, categoryTimeRanges, activeCategory } = usePresetTasks();
  const { events } = useCalendarEvents();
  const { profile } = useProfile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<(UserPresetTask & { category: string }) | undefined>(undefined);
  const customTaskFormRef = useRef<HTMLDivElement>(null);
  const [carouselApi, setCarouselApi] = useState<EmblaCarouselType | undefined>()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskName: "",
      duration: 25,
    },
  });

  const mergedTasks = useMemo(() => {
    const newPresetTasks: Preset = JSON.parse(JSON.stringify(presetTasks));
    const todaysEvents = events.filter(e => e.date && isToday(parseISO(e.date)));

    if (todaysEvents.length > 0) {
        const eventCategory = "Today's Events";
        if (!newPresetTasks[eventCategory]) {
            newPresetTasks[eventCategory] = { color: 'bg-amber-800 text-amber-100', tasks: [] };
        }

        todaysEvents.forEach(event => {
            const eventDate = parseISO(event.date);
            const eventAsTask: UserPresetTask = {
                id: event.id,
                name: event.name,
                duration: event.duration,
                icon: event.icon,
                isEvent: true,
                category: eventCategory,
                order: eventDate.getHours() * 100 + eventDate.getMinutes(), // Sort by time
            };
            const existingIndex = newPresetTasks[eventCategory].tasks.findIndex(t => t.id === event.id);
            if (existingIndex > -1) {
                newPresetTasks[eventCategory].tasks[existingIndex] = eventAsTask;
            } else {
                newPresetTasks[eventCategory].tasks.push(eventAsTask);
            }
        });
    }
    
    // Create a sorted array of categories, ensuring "Today's Events" is first if it exists
    const sortedCategoryNames = Object.keys(newPresetTasks).sort((a, b) => {
        if (a === "Today's Events") return -1;
        if (b === "Today's Events") return 1;
        return (categoryTimeRanges[a]?.start.getTime() || 0) - (categoryTimeRanges[b]?.start.getTime() || 0);
    });

    const sortedPreset: Preset = {};
    sortedCategoryNames.forEach(categoryName => {
        sortedPreset[categoryName] = newPresetTasks[categoryName];
        sortedPreset[categoryName].tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    return sortedPreset;
  }, [presetTasks, events, categoryTimeRanges]);
  
  const scrollTo = useCallback(
    (index: number) => carouselApi && carouselApi.scrollTo(index),
    [carouselApi]
  )

  const onSelect = useCallback(() => {
    if (!carouselApi) return
    setSelectedIndex(carouselApi.selectedScrollSnap())
  }, [carouselApi, setSelectedIndex])


  useEffect(() => {
    if (!carouselApi) return
    onSelect()
    setScrollSnaps(carouselApi.scrollSnapList())
    carouselApi.on('select', onSelect)
    carouselApi.on('reInit', () => {
        onSelect();
        setScrollSnaps(carouselApi.scrollSnapList());
    });
    return () => {
        if (carouselApi) {
          carouselApi.off('select', onSelect)
          carouselApi.off('reInit', onSelect)
        }
    }
  }, [carouselApi, setScrollSnaps, onSelect]);

  useEffect(() => {
    if (carouselApi) {
      carouselApi.reInit();
    }
  }, [mergedTasks, carouselApi]);

  useEffect(() => {
    if (!carouselApi || Object.keys(mergedTasks).length === 0) return;
    
    const categoryKeys = Object.keys(mergedTasks);
    // If "Today's Events" exists and it's today, make it active. Otherwise use the time-based active category.
    const activeKey = categoryKeys.includes("Today's Events") ? "Today's Events" : activeCategory;

    if (activeKey) {
        const activeIndex = categoryKeys.findIndex(category => category === activeKey);
        if (activeIndex !== -1) {
            scrollTo(activeIndex);
        }
    } else {
        // Default to the first category if no active one is determined
        scrollTo(0);
    }
  }, [carouselApi, mergedTasks, activeCategory, scrollTo]);


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
      await addPresetTask(taskData, profile);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    await deletePresetTask(taskId);
    setIsDialogOpen(false);
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const params = new URLSearchParams({
      task: values.taskName,
      duration: values.duration.toString(),
    });
    if (values.category) {
        params.append("category", values.category);
    }
    router.push(`/timer?${params.toString()}`);
  }
  
  const categoriesWithColors = Object.entries(mergedTasks).map(([name, { color }]) => ({ name, color }));

  const selectQuickStartTask = (task: UserPresetTask, category: string) => {
    form.setValue("taskName", task.name);
    form.setValue("duration", task.duration);
    form.setValue("category", category);
    if (customTaskFormRef.current) {
        customTaskFormRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const hasTasks = Object.keys(mergedTasks).length > 0 && Object.values(mergedTasks).some(cat => cat.tasks.length > 0);

  const renderSkeleton = () => (
    <div className="p-1">
      <Card className="flex flex-col rounded-xl h-[280px]">
          <CardHeader className="p-4 flex flex-row items-center justify-between">
              <div className="w-1/2 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-6 w-20" />
          </CardHeader>
          <CardContent className="p-3 pt-3 flex-grow overflow-hidden space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
          </CardContent>
           <CardFooter className="p-3 pt-0 mt-auto">
              <Skeleton className="h-10 w-full" />
          </CardFooter>
      </Card>
    </div>
  );

  return (
    <>
    <div className="space-y-4">
       <div>
            <h2 className="font-headline text-2xl text-white">Quick Start Tasks</h2>
            <p className="text-white/80">Select a preset task or add your own.</p>
        </div>
        
        {loading ? renderSkeleton() : hasTasks ? (
            <Carousel
                setApi={setCarouselApi}
                opts={{
                    align: "start",
                }}
                className="w-full"
                >
                <CarouselContent>
                    {Object.entries(mergedTasks).map(([category, { tasks, color }]) => {
                        const timeRange = categoryTimeRanges[category];
                        const isCurrent = category === activeCategory;
                        return (
                        <CarouselItem key={category} className="basis-full">
                            <div className="p-1">
                            <Card className={cn("overflow-hidden flex flex-col rounded-xl h-[280px]", isCurrent && "shadow-lg")}>
                                <CardHeader className={cn("p-4 flex flex-row items-center justify-between", color)}>
                                    <div>
                                        <CardTitle className="font-headline text-lg">{category}</CardTitle>
                                        {timeRange && (
                                        <CardDescription className="text-xs text-inherit opacity-80">
                                            {format(timeRange.start, 'p')} - {format(timeRange.end, 'p')}
                                        </CardDescription>
                                        )}
                                    </div>
                                    <Badge variant="secondary" className="gap-1.5">
                                        <Clock className="w-3.5 h-3.5"/>
                                        {formatDuration(tasks.reduce((acc, task) => acc + task.duration, 0))}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-3 pt-3 flex-grow overflow-hidden">
                                <ScrollArea className="h-full pr-3">
                                    <div className="space-y-2">
                                    {tasks.map((task, index) => {
                                        const Icon = iconMap[task.icon] || BrainCircuit;
                                        const isEventTask = task.isEvent;
                                        return (
                                            <Button
                                                key={task.id || `${task.name}-${index}`}
                                                variant="outline"
                                                className={cn("w-full justify-start gap-3 h-auto py-2 px-3 whitespace-normal", { "bg-primary/20 hover:bg-primary/30 border-primary/50": isEventTask })}
                                                onClick={() => selectQuickStartTask(task, category)}
                                                onDoubleClick={() => task.id && !isEventTask && handleOpenDialog(task, category)}
                                            >
                                                <Icon className="w-5 h-5 text-muted-foreground" />
                                                <span className="flex-1 text-left font-normal">{task.name}</span>
                                                <span className="text-sm text-muted-foreground">{formatDuration(task.duration)}</span>
                                            </Button>
                                        );
                                    })}
                                    </div>
                                </ScrollArea>
                                </CardContent>
                                {category !== "Today's Events" && (
                                  <CardFooter className="p-3 pt-0 mt-auto">
                                      <Button variant="ghost" className="w-full border-dashed border-2" onClick={() => handleOpenDialog(undefined, category)}>
                                          <Plus className="w-4 h-4 mr-2" /> Add Task
                                      </Button>
                                  </CardFooter>
                                )}
                            </Card>
                            </div>
                        </CarouselItem>
                        )
                    })}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        ) : (
            <div className="py-16 text-center text-muted-foreground border-2 border-dashed rounded-lg flex flex-col items-center justify-center h-[280px]">
                <FolderSearch className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No Tasks Found</h3>
                <p className="mt-1 text-sm max-w-xs mx-auto">This routine is empty. Go to the 'Routine' page to add tasks.</p>
                <Button variant="secondary" className="mt-4" asChild>
                   <Link href="/routine">Customize Routine</Link>
                </Button>
            </div>
        )}

      {hasTasks && (
        <div className="flex justify-center gap-2 mt-4">
            {scrollSnaps.map((_, index) => (
            <button
                key={index}
                onClick={() => scrollTo(index)}
                className={cn(
                "h-2 w-2 rounded-full transition-all duration-300",
                index === selectedIndex ? "w-4 bg-primary" : "bg-muted"
                )}
                aria-label={`Go to slide ${index + 1}`}
            />
            ))}
        </div>
      )}

        <div className="my-2" />
        <Separator />
        <div className="my-2" />

        <div ref={customTaskFormRef} className="mt-4">
            <h3 className="font-headline text-2xl mb-2">Or Create a Custom Task</h3>
            <p className="text-muted-foreground mb-4">Set a name and duration for a one-off task.</p>
            <Form {...form}>
            <form id="custom-task-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardContent className="pt-6 grid gap-6">
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
                                    <div className="flex justify-between items-center mb-2">
                                        <FormLabel>Duration (min)</FormLabel>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={120}
                                            className="w-20 text-center font-bold"
                                            value={field.value}
                                            onChange={(e) => {
                                                const value = e.target.value === '' ? 1 : parseInt(e.target.value, 10);
                                                field.onChange(value);
                                            }}
                                        />
                                    </div>
                                    <FormControl>
                                        <Slider
                                            value={[field.value]}
                                            onValueChange={(value) => field.onChange(value[0])}
                                            min={1}
                                            max={120}
                                            step={1}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Button type="submit" size="lg" className="w-full">
                    Start
                </Button>
            </form>
            </Form>
        </div>
    </div>
    <AddTaskDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSaveTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
        initialTask={taskToEdit}
        categories={categoriesWithColors}
      />
    </>
  );
}
