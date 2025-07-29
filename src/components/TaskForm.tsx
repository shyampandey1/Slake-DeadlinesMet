
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Coffee, Droplets, BrainCircuit, Mail, ListChecks, Users, Utensils, Bed, Footprints, Dumbbell, StretchHorizontal, Wind, BookOpen, Plus, Wrench, Target, ShoppingBag, LucideIcon, Clock4 } from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback } from "react";
import { add, format, set } from "date-fns";

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
import { Badge } from "./ui/badge";
import { Slider } from "./ui/slider";


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

type TimedTask = UserPresetTask & {
    category: string;
    color: string;
    startTime: Date;
    endTime: Date;
};

export default function TaskForm() {
  const router = useRouter();
  const { presetTasks, addPresetTask, updatePresetTask, deletePresetTask } = usePresetTasks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<(UserPresetTask & { category: string }) | undefined>(undefined);
  const customTaskFormRef = useRef<HTMLDivElement>(null);
  const { requestAudioPermission } = useAudio();
  
  const [timedTasks, setTimedTasks] = useState<TimedTask[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const activeTaskRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskName: "",
      duration: 25,
    },
  });

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
    <div className="space-y-8">
        <div>
            <div className="px-1 mb-4">
                <h2 className="font-headline text-2xl">Today's Routine</h2>
                <p className="text-muted-foreground">Your daily schedule at a glance. Click a task to start.</p>
            </div>
            
            <div className="relative space-y-4">
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
                          <Button
                              onClick={() => selectQuickStartTask(task, task.category, task.color)}
                              onDoubleClick={() => handleOpenDialog(task, task.category)}
                              variant="outline"
                              className={cn(
                                "h-auto py-2 px-3 justify-start gap-2.5 whitespace-normal w-full mt-1",
                                is_active && "border-primary shadow-lg"
                              )}
                          >
                              <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                              <span className="flex-1 text-left text-sm">{task.name}</span>
                              <Badge variant={is_active ? "default" : "secondary"}>
                                <Clock4 className="w-3 h-3 mr-1.5"/>
                                {task.duration}m
                              </Badge>
                          </Button>
                      </div>
                  </div>
                )
              })}
            </div>
        </div>

        <Separator />

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
