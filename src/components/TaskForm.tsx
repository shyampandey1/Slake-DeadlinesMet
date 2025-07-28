
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Coffee, Droplets, BrainCircuit, Mail, ListChecks, Users, Utensils, Bed, Footprints, Dumbbell, StretchHorizontal, Wind, BookOpen } from 'lucide-react';
import { isToday, parseISO } from 'date-fns';

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
import { useMemo } from "react";

const formSchema = z.object({
  taskName: z.string().min(1, {
    message: "Task name cannot be empty.",
  }),
  duration: z.coerce.number().min(1, {
    message: "Duration must be at least 1 minute.",
  }),
});

const presetTasks = {
    'Morning Routine': {
        color: "bg-sky-200/80 text-sky-900 hover:bg-sky-200 dark:bg-sky-800/60 dark:text-sky-100 dark:hover:bg-sky-800",
        tasks: [
            { name: 'Plan Day', duration: 15, icon: <ListChecks className="mr-2 h-4 w-4" /> },
            { name: 'Meditate', duration: 10, icon: <Bed className="mr-2 h-4 w-4" /> },
            { name: 'Stretching', duration: 10, icon: <StretchHorizontal className="mr-2 h-4 w-4" /> },
            { name: 'Workout', duration: 45, icon: <Dumbbell className="mr-2 h-4 w-4" /> },
        ]
    },
    'Work & Focus': {
        color: "bg-blue-200/80 text-blue-900 hover:bg-blue-200 dark:bg-blue-800/60 dark:text-blue-100 dark:hover:bg-blue-800",
        tasks: [
            { name: 'Deep Work', duration: 90, icon: <BrainCircuit className="mr-2 h-4 w-4" /> },
            { name: 'Focus Session', duration: 50, icon: <BrainCircuit className="mr-2 h-4 w-4" /> },
            { name: 'Check Emails', duration: 15, icon: <Mail className="mr-2 h-4 w-4" /> },
            { name: 'Stand-up', duration: 15, icon: <Users className="mr-2 h-4 w-4" /> },
        ]
    },
    'Breaks & Meals': {
        color: "bg-amber-200/80 text-amber-900 hover:bg-amber-200 dark:bg-amber-800/60 dark:text-amber-100 dark:hover:bg-amber-800",
        tasks: [
            { name: 'Short Break', duration: 5, icon: <Coffee className="mr-2 h-4 w-4" /> },
            { name: 'Walk', duration: 15, icon: <Footprints className="mr-2 h-4 w-4" /> },
            { name: 'Lunch Break', duration: 45, icon: <Utensils className="mr-2 h-4 w-4" /> },
            { name: 'Breathing Practice', duration: 5, icon: <Wind className="mr-2 h-4 w-4" /> },
        ]
    },
    'Health Reminders': {
        color: "bg-green-200/80 text-green-900 hover:bg-green-200 dark:bg-green-800/60 dark:text-green-100 dark:hover:bg-green-800",
        tasks: [
            { name: 'Drink Water', duration: 1, icon: <Droplets className="mr-2 h-4 w-4" /> },
        ]
    },
    'Evening Wind-down': {
        color: "bg-indigo-200/80 text-indigo-900 hover:bg-indigo-200 dark:bg-indigo-800/60 dark:text-indigo-100 dark:hover:bg-indigo-800",
        tasks: [
            { name: 'Read a book', duration: 30, icon: <BookOpen className="mr-2 h-4 w-4" /> },
            { name: 'Journal', duration: 15, icon: <ListChecks className="mr-2 h-4 w-4" /> },
        ]
    }
};

export default function TaskForm() {
  const router = useRouter();
  const { tasks: completedTasks } = useTasks();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskName: "",
      duration: 25,
    },
  });

  const visiblePresetTasks = useMemo(() => {
    const completedToday = completedTasks
      .filter(task => task.completed && task.createdAt && isToday(parseISO(task.createdAt)))
      .map(task => task.name);
  
    const filteredTasks: typeof presetTasks = {};
  
    for (const category in presetTasks) {
      const { tasks, color } = presetTasks[category as keyof typeof presetTasks];
      const remaining = tasks.filter(task => !completedToday.includes(task.name));
  
      if (remaining.length > 0) {
        filteredTasks[category as keyof typeof presetTasks] = { tasks: remaining, color };
      }
    }
    return filteredTasks;
  }, [completedTasks]);
  
  const handlePresetClick = (preset: {name: string, duration: number}) => {
    form.setValue('taskName', preset.name);
    form.setValue('duration', preset.duration);
    
    const formElement = document.querySelector('form');
    if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };


  function onSubmit(values: z.infer<typeof formSchema>) {
    const params = new URLSearchParams({
      task: values.taskName,
      duration: values.duration.toString(),
    });
    router.push(`/timer?${params.toString()}`);
  }

  return (
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
                                <h3 className="mb-2 text-sm font-medium text-muted-foreground">{category}</h3>
                                <div className="flex flex-col gap-2">
                                    {tasks.map((preset) => (
                                    <Badge
                                        key={preset.name}
                                        variant="secondary"
                                        className={cn("cursor-pointer text-sm justify-between py-2 px-3 border-transparent", color)}
                                        onClick={() => handlePresetClick(preset)}
                                    >
                                        <div className="flex items-center">
                                            {preset.icon}
                                            <span>{preset.name}</span>
                                        </div>
                                        <span className="text-xs opacity-75">{preset.duration}m</span>
                                    </Badge>
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8">
             <CardDescription className="text-center">Or create a custom task</CardDescription>
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
      </CardContent>
    </Card>
  );
}
