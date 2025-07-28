
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Coffee, Droplets, BrainCircuit, Mail, ListChecks, Users, Utensils, Bed, Footprints } from 'lucide-react';

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket } from "lucide-react";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  taskName: z.string().min(1, {
    message: "Task name cannot be empty.",
  }),
  duration: z.coerce.number().min(1, {
    message: "Duration must be at least 1 minute.",
  }),
});

const presetTasks = {
    'Work & Productivity': {
        color: "bg-sky-200/80 text-sky-900 hover:bg-sky-200 dark:bg-sky-800/60 dark:text-sky-100 dark:hover:bg-sky-800",
        tasks: [
            { name: 'Plan Day', duration: 15, icon: <ListChecks className="mr-2 h-4 w-4" /> },
            { name: 'Focus Session', duration: 50, icon: <BrainCircuit className="mr-2 h-4 w-4" /> },
            { name: 'Check Emails', duration: 15, icon: <Mail className="mr-2 h-4 w-4" /> },
            { name: 'Stand-up', duration: 15, icon: <Users className="mr-2 h-4 w-4" /> },
        ]
    },
    'Health & Wellness': {
        color: "bg-green-200/80 text-green-900 hover:bg-green-200 dark:bg-green-800/60 dark:text-green-100 dark:hover:bg-green-800",
        tasks: [
            { name: 'Drink Water', duration: 2, icon: <Droplets className="mr-2 h-4 w-4" /> },
            { name: 'Lunch Break', duration: 45, icon: <Utensils className="mr-2 h-4 w-4" /> },
            { name: 'Meditate', duration: 10, icon: <Bed className="mr-2 h-4 w-4" /> },
        ]
    },
    'Breaks': {
        color: "bg-amber-200/80 text-amber-900 hover:bg-amber-200 dark:bg-amber-800/60 dark:text-amber-100 dark:hover:bg-amber-800",
        tasks: [
            { name: 'Short Break', duration: 5, icon: <Coffee className="mr-2 h-4 w-4" /> },
            { name: 'Walk', duration: 15, icon: <Footprints className="mr-2 h-4 w-4" /> },
        ]
    }
};

export default function TaskForm() {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskName: "",
      duration: 25,
    },
  });
  
  const handlePresetClick = (preset: {name: string, duration: number}) => {
    form.setValue('taskName', preset.name);
    form.setValue('duration', preset.duration);
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
        <CardTitle className="font-headline text-2xl">Create a New Task</CardTitle>
      </CardHeader>
      <CardContent>
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

            <div className="space-y-4">
              {Object.entries(presetTasks).map(([category, {tasks, color}]) => (
                <div key={category}>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {tasks.map((preset) => (
                      <Badge
                        key={preset.name}
                        variant="secondary"
                        className={cn("cursor-pointer text-base py-2 px-4 border-transparent", color)}
                        onClick={() => handlePresetClick(preset)}
                      >
                        {preset.icon}
                        {preset.name} - {preset.duration}m
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>

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
              Start Timer
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
