
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Coffee, Droplets, BrainCircuit, Mail, ListChecks, Users, Utensils, Bed, Footprints, Dumbbell, StretchHorizontal, Wind, BookOpen, Plus, Wrench, Target, ShoppingBag, LucideIcon, Clock } from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback } from "react";
import type { EmblaCarouselType } from 'embla-carousel-react'

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
import { useAudio } from "@/hooks/useAudio";
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";
import { Slider } from "./ui/slider";
import { Badge } from "./ui/badge";


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
};


export default function TaskForm() {
  const router = useRouter();
  const { presetTasks, addPresetTask, updatePresetTask, deletePresetTask } = usePresetTasks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<(UserPresetTask & { category: string }) | undefined>(undefined);
  const customTaskFormRef = useRef<HTMLDivElement>(null);
  const { requestAudioPermission } = useAudio();
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
    carouselApi.on('reInit', onSelect)
    return () => {
        carouselApi.off('select', onSelect)
    }
  }, [carouselApi, setScrollSnaps, onSelect]);


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

  function onSubmit(values: z.infer<typeof formSchema>) {
    requestAudioPermission();
    const params = new URLSearchParams({
      task: values.taskName,
      duration: values.duration.toString(),
    });
    if (values.category) {
        params.append("category", values.category);
    }
    if (values.color) {
        params.append("color", values.color);
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
                const totalDuration = tasks.reduce((acc, task) => acc + task.duration, 0);
                return (
                <CarouselItem key={category} className="basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                    <Card className="overflow-hidden flex flex-col rounded-xl h-full">
                        <CardHeader className={cn("p-4 flex flex-row items-center justify-between", color)}>
                            <CardTitle className="font-headline text-lg">{category}</CardTitle>
                            <Badge variant="secondary" className="gap-1.5">
                                <Clock className="w-3.5 h-3.5"/>
                                {totalDuration} min
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-3 pt-3 space-y-2 flex-grow">
                            {tasks.map((task) => {
                                const Icon = iconMap[task.icon] || BrainCircuit;
                                return (
                                    <Button
                                        key={task.name}
                                        variant="outline"
                                        className="w-full justify-start gap-3 h-auto py-2 px-3 whitespace-normal"
                                        onClick={() => selectQuickStartTask(task, category, color)}
                                        onDoubleClick={() => handleOpenDialog(task, category)}
                                    >
                                        <Icon className="w-5 h-5 text-muted-foreground" />
                                        <span className="flex-1 text-left font-normal">{task.name}</span>
                                        <span className="text-sm text-muted-foreground">{task.duration}m</span>
                                    </Button>
                                );
                            })}
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


        <Separator className="my-6" />

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
