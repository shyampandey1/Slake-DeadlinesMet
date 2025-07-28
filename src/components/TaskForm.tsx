
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Coffee, Droplets, BrainCircuit, Mail, ListChecks, Users, Utensils, Bed, Footprints, Dumbbell, StretchHorizontal, Wind, BookOpen, Plus, Wrench, Target, ShoppingBag, ListX } from 'lucide-react';
import React, { useState } from "react";

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
import { Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";
import { usePresetTasks } from "@/hooks/useFirestore";
import AddTaskDialog from "./AddTaskDialog";
import type { UserPresetTask } from "@/types";


const formSchema = z.object({
  taskName: z.string().min(1, {
    message: "Task name cannot be empty.",
  }),
  duration: z.coerce.number().min(1, {
    message: "Duration must be at least 1 minute.",
  }),
});

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


export default function TaskForm() {
  const router = useRouter();
  const { presetTasks, addPresetTask, updatePresetTask, deletePresetTask, isDefaultTask } = usePresetTasks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<(UserPresetTask & { category: string }) | undefined>(undefined);
  const [editModes, setEditModes] = useState<Record<string, boolean>>({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskName: "",
      duration: 25,
    },
  });

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
  
  const handleStartTaskFromPreset = (preset: UserPresetTask) => {
    const params = new URLSearchParams({
        task: preset.name,
        duration: preset.duration.toString(),
    });
    router.push(`/timer?${params.toString()}`);
  }
  
  const toggleEditMode = (category: string) => {
    setEditModes(prev => ({...prev, [category]: !prev[category]}));
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    const params = new URLSearchParams({
      task: values.taskName,
      duration: values.duration.toString(),
    });
    router.push(`/timer?${params.toString()}`);
  }

  return (
    <>
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Start a Task</CardTitle>
        <CardDescription>Choose a preset task or create a new one to begin your focus session.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
            {Object.entries(presetTasks).map(([category, { tasks, color }]) => (
                <div key={category}>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-foreground">{category}</h3>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenDialog(undefined, category)}>
                                <Plus className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleEditMode(category)}>
                                <ListX className={cn("h-4 w-4 text-muted-foreground", editModes[category] && "text-destructive")} />
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tasks.map((preset) => (
                           <div key={preset.id || preset.name} className="relative group">
                                <button
                                    className={cn(
                                        "w-full text-sm justify-between py-3 px-4 border rounded-lg flex items-center transition-all duration-200",
                                        color,
                                        "hover:shadow-md hover:-translate-y-1"
                                    )}
                                    onClick={() => handleStartTaskFromPreset(preset)}
                                >
                                    <div className="flex items-center flex-1 min-w-0">
                                        {iconMap[preset.icon] || <BrainCircuit className="mr-2 h-4 w-4" />}
                                        <span className="truncate font-medium">{preset.name}</span>
                                    </div>
                                    <span className="text-xs opacity-75 ml-2 shrink-0">{preset.duration} min</span>
                                </button>
                                {editModes[category] && !isDefaultTask(preset) && (
                                     <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border border-border shadow-md"
                                        onClick={() => handleOpenDialog(preset, category)}
                                     >
                                         <Wrench className="h-3 w-3 text-muted-foreground" />
                                     </Button>
                                )}
                           </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
        
        <Separator className="my-8" />

        <div>
            <h3 className="font-headline text-xl mb-4">Or Create a Custom One-Off Task</h3>
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
                <Rocket className="mr-2 h-4 w-4" />
                Start Custom Timer
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
        categories={Object.keys(presetTasks)}
      />
    </>
  );
}
