
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Coffee, Droplets, BrainCircuit, Mail, ListChecks, Users, Utensils, Bed, Footprints, Dumbbell, StretchHorizontal, Wind, BookOpen, Plus, Wrench, Target, ShoppingBag, LucideIcon } from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback } from "react";
import useEmblaCarousel from 'embla-carousel-react';

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "./ui/separator";
import { usePresetTasks } from "@/hooks/useFirestore";
import AddTaskDialog from "./AddTaskDialog";
import type { UserPresetTask } from "@/types";
import { cn } from "@/lib/utils";
import { useAudio } from "@/hooks/useAudio";


const formSchema = z.object({
  taskName: z.string().min(1, {
    message: "Task name cannot be empty.",
  }),
  duration: z.coerce.number().min(1, {
    message: "Duration must be at least 1 minute.",
  }),
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
  const { isAudioEnabled, requestAudioPermission } = useAudio();
  const revolverSoundRef = useRef<HTMLAudioElement>(null);

  const allTasks = Object.entries(presetTasks).flatMap(([category, { tasks, color }]) =>
    tasks.map(task => ({ ...task, category, color }))
  );
  
  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: 'y',
    loop: true,
  });


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskName: "",
      duration: 25,
    },
  });
  
  const playRevolverSound = useCallback(() => {
    if (revolverSoundRef.current && isAudioEnabled) {
      revolverSoundRef.current.currentTime = 0;
      revolverSoundRef.current.play().catch(e => console.error("Sound play failed", e));
    }
  }, [isAudioEnabled]);


  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const selectedTask = allTasks[emblaApi.selectedScrollSnap()];
    if (selectedTask) {
        form.setValue("taskName", selectedTask.name);
        form.setValue("duration", selectedTask.duration);
        playRevolverSound();
    }
  }, [emblaApi, allTasks, form, playRevolverSound]);

  useEffect(() => {
    if (emblaApi) {
        emblaApi.on('select', onSelect);
        // Set initial task
        onSelect();
    }
  }, [emblaApi, onSelect]);

  const handleOpenDialog = (task?: UserPresetTask, category?: string) => {
    const initialTask = task && category ? { ...task, category } : undefined;
    setTaskToEdit(initialTask);
    setIsDialogOpen(true);
  };
  
  const handleSaveTask = async (
    taskData: Omit<UserPresetTask, 'id'> & { category: string },
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
    // Request audio permission on the first user interaction
    requestAudioPermission();
    const params = new URLSearchParams({
      task: values.taskName,
      duration: values.duration.toString(),
    });
    router.push(`/timer?${params.toString()}`);
  }
  
  const categoriesWithColors = Object.entries(presetTasks).map(([name, { color }]) => ({ name, color }));


  return (
    <>
    <Card className="overflow-hidden">
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Quick Start Tasks</CardTitle>
            <CardDescription>Spin the wheel to select a task and get started.</CardDescription>
        </CardHeader>
        <CardContent>
            <audio ref={revolverSoundRef} src="https://cdn.pixabay.com/download/audio/2021/08/04/audio_96c21e72e3.mp3" preload="auto" />
            <div className="relative h-48 overflow-hidden" ref={emblaRef}>
                <div className="flex flex-col h-full">
                    {allTasks.map((task, index) => {
                         const Icon = iconMap[task.icon] || BrainCircuit;
                        return (
                        <div key={`${task.name}-${index}`} className="flex-shrink-0 h-16 flex items-center justify-center">
                            <Button
                                variant="ghost"
                                className={cn("justify-start gap-4 h-auto py-3 px-6 whitespace-normal w-64 text-lg", task.color)}
                            >
                                <Icon className="w-5 h-5 shrink-0" />
                                <span className="flex-1 text-left font-semibold">{task.name}</span>
                                <span className="text-sm opacity-80">{task.duration}m</span>
                            </Button>
                        </div>
                    )})}
                </div>
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-16 border-y-2 border-primary/50" />
                </div>
            </div>

            <Separator className="my-8" />

            <div ref={customTaskFormRef}>
                <h3 className="font-headline text-lg mb-4">Or create a custom task</h3>
                <Form {...form}>
                <form id="custom-task-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
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
                        </div>
                        <div>
                            <FormField
                                control={form.control}
                                name="duration"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Duration (min)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={120}
                                            {...field}
                                            className="text-center font-bold"
                                            onChange={(e) => {
                                                const value = e.target.value === '' ? 1 : parseInt(e.target.value, 10);
                                                field.onChange(value);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                        Start
                    </Button>
                </form>
                </Form>
            </div>
        </CardContent>
    </Card>
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
