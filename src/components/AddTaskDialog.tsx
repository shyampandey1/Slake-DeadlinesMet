
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
import { BookOpen, BrainCircuit, Coffee, Dumbbell, Footprints, ListChecks, LucideIcon, Wind, Mail, Users, Bed, StretchHorizontal, Droplets, Loader2, Utensils, Target, Wrench, ShoppingBag } from "lucide-react";
import type { PresetTask } from "@/types";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { suggestTaskDetails } from "@/ai/flows/suggest-task-details";
import { suggestTaskName } from "@/ai/flows/suggest-task-name";

interface AddTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: PresetTask, category: string) => void;
  initialCategory: string;
  categories: string[];
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


export default function AddTaskDialog({ isOpen, onClose, onAddTask, initialCategory, categories }: AddTaskDialogProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingTaskName, setIsAnalyzingTaskName] = useState(false);
  const [taskNameSuggestions, setTaskNameSuggestions] = useState<string[]>([]);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const taskNameDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskName: "",
      duration: 10,
      icon: "BrainCircuit",
      category: initialCategory,
    },
  });

  const taskNameValue = form.watch("taskName");

  const handleSuggestDetails = async (taskName: string) => {
    setIsAnalyzing(true);
    try {
      const result = await suggestTaskDetails({ taskName, availableIcons: iconNames, availableCategories: categories });
      if (result) {
        if (result.iconName && iconNames.includes(result.iconName)) {
            form.setValue('icon', result.iconName, { shouldValidate: true });
        }
        if (result.category && categories.includes(result.category)) {
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

  const handleSuggestTaskName = async (prompt: string) => {
    if (prompt.length < 3) {
      setTaskNameSuggestions([]);
      return;
    }
    setIsAnalyzingTaskName(true);
    try {
      const result = await suggestTaskName({ taskPrompt: prompt });
      setTaskNameSuggestions(result.suggestions);
    } catch (error) {
      console.error("Failed to suggest task name:", error);
      setTaskNameSuggestions([]);
    } finally {
      setIsAnalyzingTaskName(false);
    }
  };

  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (taskNameDebounceTimeoutRef.current) clearTimeout(taskNameDebounceTimeoutRef.current);
    
    if (taskNameValue) {
      debounceTimeoutRef.current = setTimeout(() => handleSuggestDetails(taskNameValue), 800);
      taskNameDebounceTimeoutRef.current = setTimeout(() => handleSuggestTaskName(taskNameValue), 500);
    } else {
      setIsAnalyzing(false);
      setIsAnalyzingTaskName(false);
      setTaskNameSuggestions([]);
    }

    return () => {
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        if (taskNameDebounceTimeoutRef.current) clearTimeout(taskNameDebounceTimeoutRef.current);
    }

  }, [taskNameValue, form, categories]);


  useEffect(() => {
    if (isOpen) {
      form.reset({
        taskName: "",
        duration: 10,
        icon: "BrainCircuit",
        category: initialCategory,
      });
      setTaskNameSuggestions([]);
    }
  }, [isOpen, initialCategory, form]);

  const handleSuggestionClick = (suggestion: string) => {
    form.setValue('taskName', suggestion);
    setTaskNameSuggestions([]);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onAddTask({
        name: values.taskName,
        duration: values.duration,
        icon: values.icon,
    }, values.category);
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new quick start task</DialogTitle>
          <DialogDescription>
            Customize your quick-start list by adding a new reusable task.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="taskName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                      Task Name
                      {isAnalyzingTaskName && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Suggesting...
                          </span>
                      )}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Morning Journal" {...field} />
                  </FormControl>
                  <FormMessage />
                   {taskNameSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {taskNameSuggestions.map((suggestion, index) => (
                            <Badge
                                key={index}
                                variant="outline"
                                className="cursor-pointer"
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                {suggestion}
                            </Badge>
                        ))}
                    </div>
                   )}
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel className="flex items-center gap-2">
                        Category
                        {isAnalyzing && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Analyzing...
                            </span>
                        )}
                    </FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-wrap gap-2"
                        >
                        {categories.map((category) => (
                           <FormItem key={category} className="flex items-center space-x-2 space-y-0">
                             <FormControl>
                                <RadioGroupItem value={category} id={category} className="sr-only" />
                             </FormControl>
                             <FormLabel htmlFor={category} className="font-normal">
                                <Badge
                                    variant={field.value === category ? 'default' : 'secondary'}
                                    className={cn("cursor-pointer border", field.value !== category && "border-border")}
                                >
                                    {category}
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
                  <FormLabel className="flex items-center gap-2">
                      Duration (minutes)
                        {isAnalyzing && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Analyzing...
                            </span>
                        )}
                  </FormLabel>
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
                    <FormLabel className="flex items-center gap-2">
                        Icon
                        {isAnalyzing && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Analyzing...
                            </span>
                        )}
                    </FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                     <FormControl>
                      <SelectTrigger disabled={isAnalyzing}>
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
