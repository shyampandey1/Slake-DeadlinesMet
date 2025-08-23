
"use client";
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useProfile, professions, Profession } from "@/hooks/useProfile";
import { usePresetTasks } from "@/hooks/useFirestore";
import * as icons from "lucide-react";
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import AuthWrapper from '@/components/AuthWrapper';
import HamburgerMenu from '@/components/HamburgerMenu';
import { format } from 'date-fns';
import AddTaskDialog from '@/components/AddTaskDialog';
import type { UserPresetTask } from '@/types';
import { Plus } from 'lucide-react';
import TaskDeletion from '@/components/TaskDeletion';

const Icon = ({ name, ...props }: { name: string, [key: string]: any }) => {
  const LucideIcon = icons[name as keyof typeof icons];
  return LucideIcon ? <LucideIcon {...props} /> : null;
};

function RoutinePageComponent() {
  const router = useRouter();
  const { profile, setProfile, daysOff, setDaysOff, loading: profileLoading } = useProfile();
  const { presetTasks, loading: tasksLoading, categoryTimeRanges, addPresetTask, updatePresetTask, deletePresetTask, isDefaultTask } = usePresetTasks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<(UserPresetTask & { category: string }) | undefined>(undefined);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const pressTimerRef = useRef<NodeJS.Timeout>();


  const handleProfessionSelect = (profession: Profession) => {
    setProfile(profession.name);
  };

  const handleDayOffToggle = (day: 'Saturday' | 'Sunday') => {
    const newDaysOff = daysOff.includes(day)
      ? daysOff.filter(d => d !== day)
      : [...daysOff, day];
    setDaysOff(newDaysOff);
  };

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
      await addPresetTask(taskData, profile);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    await deletePresetTask(taskId);
    setDeletingTaskId(null);
    setIsDialogOpen(false);
  };

  const onTaskMouseDown = (taskId: string) => {
    pressTimerRef.current = setTimeout(() => setDeletingTaskId(taskId), 500); // Long press is 500ms
  };

  const onTaskMouseUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
  };
  
  const categoriesWithColors = Object.entries(presetTasks).map(([name, { color }]) => ({ name, color }));

  const renderSkeleton = () => (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <>
    <div className="flex flex-col h-screen">
      <header className="fixed top-0 left-0 right-0 w-full bg-background/80 backdrop-blur-sm border-b border-border/50 z-10">
        <div className="container mx-auto flex h-20 max-w-4xl items-center justify-between p-4 sm:p-6 md:p-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-xl font-bold font-headline text-foreground/80">Sync Routine</h1>
                <p className="text-sm text-muted-foreground">Select a profession to see the recommended routine.</p>
            </div>
            <HamburgerMenu />
        </div>
      </header>
       <main className="flex-1 overflow-y-auto pt-24 pb-20">
        <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl space-y-8">
            {Object.entries(professions).map(([group, professionList]) => (
                <Card key={group} className="overflow-hidden">
                    <CardHeader>
                        <CardTitle className="font-headline text-lg">{group}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            {professionList.map((p) => {
                                const colorName = p.color.split('-')[1];
                                const isSelected = profile === p.name;
                                
                                return (
                                <Button
                                    key={p.name}
                                    variant="outline"
                                    onClick={() => handleProfessionSelect(p)}
                                    className={cn(
                                        "flex items-center gap-2 transition-colors duration-200 border-2 bg-transparent",
                                        isSelected 
                                            ? `bg-${colorName}-800 text-${colorName}-100 border-${colorName}-500/80`
                                            : `text-${colorName}-400 border-${colorName}-500/80 hover:bg-${colorName}-800 hover:border-${colorName}-500/80 hover:text-white`
                                    )}
                                >
                                    <Icon name={p.icon} className="h-4 w-4" />
                                    {p.name}
                                </Button>
                            )})}
                        </div>
                    </CardContent>
                </Card>
            ))}

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-lg">Day Off Schedule</CardTitle>
                    <CardDescription>Select your days off to switch to a recovery-focused routine automatically.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="saturday" checked={daysOff.includes('Saturday')} onCheckedChange={() => handleDayOffToggle('Saturday')} />
                        <label htmlFor="saturday" className="text-sm font-medium leading-none">Saturday</label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="sunday" checked={daysOff.includes('Sunday')} onCheckedChange={() => handleDayOffToggle('Sunday')} />
                        <label htmlFor="sunday" className="text-sm font-medium leading-none">Sunday</label>
                    </div>
                </CardContent>
            </Card>

            <Separator />
            
            <div>
              <h2 className="text-2xl font-bold font-headline">Your Routine</h2>
            </div>
            
            {tasksLoading ? renderSkeleton() : (
              <Accordion type="multiple" defaultValue={Object.keys(presetTasks)} className="w-full space-y-4">
                {Object.entries(presetTasks).map(([category, { color, tasks }]) => {
                   const timeRange = categoryTimeRanges[category];
                   return (
                  <AccordionItem value={category} key={category} className="border-none">
                    <Card className="overflow-hidden">
                      <AccordionTrigger className={cn("p-4 border-b", color)}>
                           <div className="flex flex-col items-start text-left">
                                <h3 className="font-headline text-lg">{category}</h3>
                                {timeRange && (
                                    <p className="text-xs text-inherit opacity-80">
                                        {format(timeRange.start, 'p')} - {format(timeRange.end, 'p')}
                                    </p>
                                )}
                            </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-4">
                          <div className="space-y-2">
                              {tasks.map((task, index) => (
                                <div
                                  key={task.id || `${task.name}-${index}`}
                                  className="relative overflow-hidden rounded-lg"
                                  onMouseDown={() => onTaskMouseDown(task.id!)}
                                  onMouseUp={onTaskMouseUp}
                                  onTouchStart={() => onTaskMouseDown(task.id!)}
                                  onTouchEnd={onTaskMouseUp}
                                  onMouseLeave={onTaskMouseUp}
                                >
                                  <Button
                                      variant="outline"
                                      className="w-full justify-between gap-3 h-auto py-2 px-3 whitespace-normal"
                                      onClick={() => {
                                        if(deletingTaskId === task.id) {
                                            setDeletingTaskId(null);
                                        } else {
                                            handleOpenDialog(task, category);
                                        }
                                      }}
                                    >
                                      <div className="flex items-center gap-3">
                                          <Icon name={task.icon} className="h-5 w-5 text-muted-foreground" />
                                          <div className="text-left">
                                              <p className="font-medium">{task.name}</p>
                                              <p className="text-xs text-muted-foreground">{task.duration} min</p>
                                          </div>
                                      </div>
                                  </Button>
                                  {deletingTaskId === task.id && (
                                    <TaskDeletion 
                                      isDefault={isDefaultTask(task)}
                                      onConfirmDelete={() => handleDeleteTask(task.id!)} 
                                    />
                                  )}
                                </div>
                              ))}
                          </div>
                          <CardFooter className="p-0 pt-4">
                            <Button variant="ghost" className="w-full border-dashed border-2" onClick={() => handleOpenDialog(undefined, category)}>
                                <Plus className="w-4 h-4 mr-2" /> Add Task
                            </Button>
                          </CardFooter>
                      </AccordionContent>
                    </Card>
                  </AccordionItem>
                   )
                })}
              </Accordion>
            )}

            <div className="mt-6 flex justify-end">
                <Button size="lg" onClick={() => router.push('/')}>Done</Button>
            </div>
        </div>
      </main>
    </div>
     <AddTaskDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSaveTask={handleSaveTask}
        onDeleteTask={(id) => handleDeleteTask(id)}
        initialTask={taskToEdit}
        categories={categoriesWithColors}
      />
    </>
  );
}

export default function RoutinePage() {
    return (
        <AuthWrapper>
            <RoutinePageComponent />
        </AuthWrapper>
    )
}
