
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Coffee, Droplets, BookOpen, BrainCircuit } from 'lucide-react';

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

const formSchema = z.object({
  taskName: z.string().min(1, {
    message: "Task name cannot be empty.",
  }),
  duration: z.coerce.number().min(1, {
    message: "Duration must be at least 1 minute.",
  }),
});

const presetTasks = [
    { name: 'Drink Water', duration: 1, icon: <Droplets className="mr-1 h-3 w-3" /> },
    { name: 'Short Break', duration: 5, icon: <Coffee className="mr-1 h-3 w-3" /> },
    { name: 'Read a book', duration: 15, icon: <BookOpen className="mr-1 h-3 w-3" /> },
    { name: 'Deep Work', duration: 45, icon: <BrainCircuit className="mr-1 h-3 w-3" /> },
];

export default function TaskForm() {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskName: "",
      duration: 25,
    },
  });
  
  const handlePresetClick = (preset: typeof presetTasks[0]) => {
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <div className="flex flex-wrap gap-2">
                {presetTasks.map((preset) => (
                    <Badge 
                        key={preset.name} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-primary/20"
                        onClick={() => handlePresetClick(preset)}
                    >
                        {preset.icon}
                        {preset.name} - {preset.duration} min
                    </Badge>
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
                        className="w-20 text-center font-bold text-primary"
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
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              <Rocket className="mr-2 h-4 w-4" />
              Start Timer
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
