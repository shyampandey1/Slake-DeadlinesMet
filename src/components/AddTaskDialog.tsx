
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BookOpen, BrainCircuit, Coffee, Dumbbell, Footprints, ListChecks, LucideIcon, Wind, Mail, Users, Bed, StretchHorizontal, Droplets } from "lucide-react";
import type { PresetTask } from "@/types";

interface AddTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: PresetTask) => void;
  category: string;
}

const formSchema = z.object({
  taskName: z.string().min(1, "Task name is required."),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute."),
  icon: z.string().min(1, "Icon is required."),
});

const icons: {name: string, icon: LucideIcon}[] = [
    { name: "ListChecks", icon: ListChecks },
    { name: "Bed", icon: Bed },
    { name: "StretchHorizontal", icon: StretchHorizontal },
    { name: "Dumbbell", icon: Dumbbell },
    { name: "BrainCircuit", icon: BrainCircuit },
    { name: "Mail", icon: Mail },
    { name: "Users", icon: Users },
    { name: "Coffee", icon: Coffee },
    { name: "Footprints", icon: Footprints },
    { name: "Wind", icon: Wind },
    { name: "Droplets", icon: Droplets },
    { name: "BookOpen", icon: BookOpen },
];

export default function AddTaskDialog({ isOpen, onClose, onAddTask, category }: AddTaskDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskName: "",
      duration: 10,
      icon: "BrainCircuit",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onAddTask({
        name: values.taskName,
        duration: values.duration,
        icon: values.icon,
    });
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new task to "{category}"</DialogTitle>
          <DialogDescription>
            Customize your quick-start list by adding a new task.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="taskName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Morning Journal" {...field} />
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
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                     <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an icon" />
                      </SelectTrigger>
                     </FormControl>
                    <SelectContent>
                      {icons.map(({name, icon: Icon}) => (
                        <SelectItem key={name} value={name}>
                          <div className="flex items-center">
                            <Icon className="mr-2 h-4 w-4" />
                            <span>{name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="ghost">Cancel</Button>
                </DialogClose>
                <Button type="submit">Add Task</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
