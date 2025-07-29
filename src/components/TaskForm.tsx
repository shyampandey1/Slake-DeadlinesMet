
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Coffee, Droplets, BrainCircuit, Mail, ListChecks, Users, Utensils, Bed, Footprints, Dumbbell, StretchHorizontal, Wind, BookOpen, Plus, Wrench, Target, ShoppingBag, LucideIcon } from 'lucide-react';
import React, { useState, useRef } from "react";

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
import { Rocket } from "lucide-react";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePresetTasks } from "@/hooks/useFirestore";
import AddTaskDialog from "./AddTaskDialog";
import type { UserPresetTask } from "@/types";
import { cn } from "@/lib/utils";


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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskName: "",
      duration: 25,
    },
  });
  
  const handlePresetClick = (preset: UserPresetTask) => {
    form.setValue("taskName", preset.name);
    form.setValue("duration", preset.duration);
    
    customTaskFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
  }

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
    const params = new URLSearchParams({
      task: values.taskName,
      duration: values.duration.toString(),
    });
    router.push(`/timer?${params.toString()}`);
  }
  
  const categories = Object.keys(presetTasks);
  const categoriesWithColors = Object.entries(presetTasks).map(([name, { color }]) => ({ name, color }));


  return (
    <>
    <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between">
            <div>
                <CardTitle className="font-headline text-2xl">Start a Task</CardTitle>
                <CardDescription>Choose a preset task or create a new one.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(undefined, categoriesWithColors[0]?.name)}>
                <Plus className="h-4 w-4 mr-2" />
                New Task
            </Button>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue={categories[0]} className="w-full">
                <TabsList className="mb-4 w-full overflow-x-auto justify-start">
                    {categories.map((category) => (
                        <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                    ))}
                </TabsList>
                {Object.entries(presetTasks).map(([category, { tasks, color }]) => (
                    <TabsContent key={category} value={category}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {tasks.map((task) => {
                                const Icon = iconMap[task.icon] || BrainCircuit;
                                return (
                                    <Card
                                        key={task.id || task.name}
                                        onClick={() => handlePresetClick(task)}
                                        className={cn("cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1")}
                                    >
                                        <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                                            <Icon className="w-8 h-8 mb-3" />
                                            <p className="font-semibold text-sm leading-tight">{task.name}</p>
                                            <p className="text-xs opacity-80 mt-1">{task.duration} min</p>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            <Separator className="my-8" />

            <div ref={customTaskFormRef}>
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
        categories={categoriesWithColors}
      />
    </>
  );
}
