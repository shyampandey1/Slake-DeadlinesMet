
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Coffee, Droplets, BrainCircuit, Mail, ListChecks, Users, Utensils, Bed, Footprints, Dumbbell, StretchHorizontal, Wind, BookOpen, Plus, Wrench, Target, ShoppingBag, LucideIcon, Clock, Calendar } from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback } from "react";
import type { EmblaCarouselType } from 'embla-carousel-react'
import { add, set, isBefore, isAfter, format } from "date-fns";

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
import { usePresetTasks } from "@/hooks/useFirestore";
import AddTaskDialog from "./AddTaskDialog";
import type { UserPresetTask } from "@/types";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import { Slider } from "./ui/slider";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { useProfile } from "@/hooks/useProfile";


const formSchema = z.object({
  taskName: z.string().min(1, {
    message: "Task name cannot be empty.",
  }),
  duration: z.coerce.number().min(1, {
    message: "Duration must be at least 1 minute.",
  }),
  category: z.string().optional(),
  color: z.string().optional(),
});

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
    Calendar: Calendar,
};


export default function TaskForm() {
  const router = useRouter();
  const { presetTasks, addPresetTask, updatePresetTask, deletePresetTask } = usePresetTasks();
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
  }, [presetTasks, carouselApi]);

  useEffect(() => {
    if (!carouselApi || Object.keys(presetTasks).length === 0) return;

    const now = new Date();
    let cumulativeTime = set(now, { hours: 7, minutes: 0, seconds: 0, milliseconds: 0 }); 
    const categories = Object.keys(presetTasks);

    let foundIndex = -1;

    for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        const { tasks } = presetTasks[category];
        const categoryDuration = tasks.reduce((acc, task) => acc + task.duration, 0);

        const startTime = cumulativeTime;
        const endTime = add(startTime, { minutes: categoryDuration });

        if (isAfter(now, startTime) && isBefore(now, endTime)) {
            foundIndex = i;
            break;
        }

        cumulativeTime = endTime;
    }

    if (foundIndex !== -1) {
        scrollTo(foundIndex);
    }

  }, [carouselApi, presetTasks, scrollTo]);



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
    if (values.color) {
        const colorName = values.color.split(' ')[0].replace('bg-', '');
        params.append("color", colorName);
    }
    router.push(`/timer?${params.toString()}`);
  }
  
  const categoriesWithColors = Object.entries(presetTasks).map(([name, { color }]) => ({ name, color }));

  const selectQuickStartTask = (task: UserPresetTask, category: string, color: string) => {
    form.setValue("taskName", task.name);
    form.setValue("duration", task.duration);
    form.setValue("category", category);
    form.setValue("color", color);
    if (customTaskFormRef.current) {
        customTaskFormRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const categoryTimeRanges = useMemo(() => {
    const ranges: { [category: string]: { start: Date, end: Date, isCurrent: boolean } } = {};
    let cumulativeTime = set(new Date(), { hours: 7, minutes: 0, seconds: 0, milliseconds: 0 });
    const now = new Date();

    for (const category in presetTasks) {
        const { tasks } = presetTasks[category];
        const totalDuration = tasks.reduce((acc, task) => acc + task.duration, 0);
        
        const startTime = cumulativeTime;
        const endTime = add(startTime, { minutes: totalDuration });

        ranges[category] = {
            start: startTime,
            end: endTime,
            isCurrent: isAfter(now, startTime) && isBefore(now, endTime)
        };

        cumulativeTime = endTime;
    }
    return ranges;
  }, [presetTasks]);

  return (
    <>
    <div className="space-y-4">
      <div>
        <h2 className="font-headline text-2xl">Quick Start Tasks</h2>
        <p className="text-muted-foreground">
            Select a preset task or add your own. Double-click to edit.
        </p>
      </div>
      <Carousel
        setApi={setCarouselApi}
        opts={{
            align: "start",
        }}
        className="w-full"
        >
        <CarouselContent>
            {Object.entries(presetTasks).map(([category, { tasks, color }]) => {
                const timeRange = categoryTimeRanges[category];
                return (
                <CarouselItem key={category} className="basis-full">
                    <div className="p-1">
                    <Card className={cn("overflow-hidden flex flex-col rounded-xl h-[280px]", timeRange?.isCurrent && "border-primary ring-2 ring-primary shadow-lg")}>
                        <CardHeader className={cn("p-4 flex flex-row items-center justify-between", color)}>
                            <div>
                                <CardTitle className="font-headline text-lg">{category}</CardTitle>
                                {timeRange && (
                                    <p className="text-xs font-mono opacity-80">
                                        {format(timeRange.start, 'p')} - {format(timeRange.end, 'p')}
                                    </p>
                                )}
                            </div>
                            <Badge variant="secondary" className="gap-1.5">
                                <Clock className="w-3.5 h-3.5"/>
                                {tasks.reduce((acc, task) => acc + task.duration, 0)} min
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-3 pt-3 flex-grow overflow-hidden">
                           <ScrollArea className="h-full pr-3">
                            <div className="space-y-2">
                            {tasks.map((task) => {
                                const Icon = iconMap[task.icon] || BrainCircuit;
                                const isEventTask = task.isEvent;
                                return (
                                    <Button
                                        key={task.id || task.name}
                                        variant={isEventTask ? "default" : "outline"}
                                        className={cn("w-full justify-start gap-3 h-auto py-2 px-3 whitespace-normal", { "bg-primary/20 border-primary/50 hover:bg-primary/30": isEventTask })}
                                        onClick={() => selectQuickStartTask(task, category, color)}
                                        onDoubleClick={() => task.id && !isEventTask && handleOpenDialog(task, category)}
                                    >
                                        <Icon className="w-5 h-5 text-muted-foreground" />
                                        <span className="flex-1 text-left font-normal">{task.name}</span>
                                        <span className="text-sm text-muted-foreground">{task.duration}m</span>
                                    </Button>
                                );
                            })}
                            </div>
                           </ScrollArea>
                        </CardContent>
                        <CardFooter className="p-3 pt-0 mt-auto">
                            <Button variant="ghost" className="w-full border-dashed border-2" onClick={() => handleOpenDialog(undefined, category)}>
                                <Plus className="w-4 h-4 mr-2" /> Add Task
                            </Button>
                        </CardFooter>
                    </Card>
                    </div>
                </CarouselItem>
                )
            })}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      <div className="flex justify-center gap-2">
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


        <div className="my-2" />
        <Separator />
        <div className="my-2" />

        <div ref={customTaskFormRef}>
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

    