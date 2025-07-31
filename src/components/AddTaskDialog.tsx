
"use client";

import { useState, useEffect, useRef } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { BookOpen, BrainCircuit, Coffee, Dumbbell, Footprints, ListChecks, LucideIcon, Wind, Mail, Users, Bed, StretchHorizontal, Droplets, Loader2, Utensils, Target, Wrench, ShoppingBag, Trash2, Wand2 } from "lucide-react";
import type { UserPresetTask } from "@/types";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { suggestTaskDetails } from "@/ai/flows/suggest-task-details";
import { usePresetTasks } from "@/hooks/useFirestore";

interface AddTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (task: Omit<UserPresetTask, 'id' | 'order'> & { category: string }, taskId?: string) => void;
  onDeleteTask?: (taskId: string) => void;
  initialTask?: UserPresetTask & { category: string };
  categories: { name: string; color: string }[];
}

const formSchema = z.object({
  taskName: z.string().min(1, "Task name is required."),
  category: z.string({ required_error: "Please select a category." }),
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
    { name: "Utensils", icon: Utensils },
    { name: "Target", icon: Target },
    { name: "Wrench", icon: Wrench },
    { name: "ShoppingBag", icon: ShoppingBag },
];
const iconNames = icons.map(i => i.name);


export default function AddTaskDialog({ isOpen, onClose, onSaveTask, onDeleteTask, initialTask, categories }: AddTaskDialogProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { isDefaultTask } = usePresetTasks();
  
  const isEditMode = !!initialTask?.id;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskName: "",
      duration: 10,
      icon: "BrainCircuit",
      category: "Work & Focus",
    },
  });

  const taskNameValue = form.watch("taskName");

  const handleSuggestDetails = async () => {
    const taskName = form.getValues("taskName");
    if (!taskName) return;

    setIsAnalyzing(true);
    try {
      const result = await suggestTaskDetails({ taskName, availableIcons: iconNames, availableCategories: categories.map(c => c.name) });
      if (result) {
        if (result.iconName && iconNames.includes(result.iconName)) {
            form.setValue('icon', result.iconName, { shouldValidate: true });
        }
        if (result.category && categories.map(c => c.name).includes(result.category)) {
            form.setValue('category', result.category, { shouldValidate: true });
        }
        if (result.duration) {
            form.setValue('duration', result.duration, { shouldValidate: true });
        }
      }
    } catch (error) {
      console.error("Failed to suggest details:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      form.reset({
        taskName: initialTask?.name ?? "",
        duration: initialTask?.duration ?? 10,
        icon: initialTask?.icon ?? "BrainCircuit",
        category: initialTask?.category ?? "Work & Focus",
      });
    }
  }, [isOpen, initialTask, form]);


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSaveTask({
        name: values.taskName,
        duration: values.duration,
        icon: values.icon,
        category: values.category
    }, initialTask?.id);
    onClose();
  };

  const handleDelete = () => {
    if (isEditMode && onDeleteTask) {
        onDeleteTask(initialTask.id!);
    }
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Task' : 'Add a New Quick Start Task'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modify the details of your task or delete it.' : 'Customize your quick-start list by adding a new reusable task.'}
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
                   <div className="flex items-center gap-2">
                    <FormControl>
                      <Input placeholder="e.g., Morning Journal" {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" size="icon" onClick={handleSuggestDetails} disabled={isAnalyzing || !taskNameValue}>
                      {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      <span className="sr-only">Suggest Details</span>
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-wrap gap-2"
                        >
                        {categories.map((category) => (
                           <FormItem key={category.name} className="flex items-center space-x-2 space-y-0">
                             <FormControl>
                                <RadioGroupItem value={category.name} id={category.name} className="sr-only" />
                             </FormControl>
                             <FormLabel htmlFor={category.name} className="font-normal">
                                <Badge
                                    className={cn(
                                        "cursor-pointer border-2",
                                        field.value === category.name 
                                            ? 'border-primary shadow-md' 
                                            : 'border-transparent opacity-70 hover:opacity-100',
                                        category.color
                                    )}
                                >
                                    {category.name}
                                </Badge>
                             </FormLabel>
                            </FormItem>
                        ))}
                        </RadioGroup>
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
                   <Select onValueChange={field.onChange} value={field.value}>
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
            <DialogFooter className="sm:justify-between">
                {isEditMode && initialTask && !isDefaultTask(initialTask) ? (
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant="destructive" className="sm:mr-auto">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Task
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the preset task from your routine.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                ) : <div />}
                <div className="flex gap-2 justify-end">
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Task'}</Button>
                </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
