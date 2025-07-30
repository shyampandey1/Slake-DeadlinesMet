
"use client";

import { useMemo } from "react";
import { BookText, ThumbsUp, ThumbsDown, Trash2, TrendingUp, Calendar, CheckCircle, Clock, RefreshCw, XCircle, Pause, Play } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { useTasks } from "@/hooks/useFirestore";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import AuthWrapper from "./AuthWrapper";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

function TaskLogBookContent() {
  const { tasks, loading, clearTasks } = useTasks();
  const router = useRouter();

  const handleTaskClick = (task: Task) => {
    if (!task.completed) {
      const params = new URLSearchParams({
        task: task.name,
        duration: task.duration.toString(),
      });
      router.push(`/timer?${params.toString()}`);
    }
  };

  const stats = useMemo(() => {
    if (loading || tasks.length === 0) {
      return { totalTasks: 0, completedTasks: 0, totalTime: 0, completionRate: 0 };
    }
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTime = tasks.reduce((acc, t) => acc + t.duration, 0);
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    return {
      totalTasks: tasks.length,
      completedTasks,
      totalTime,
      completionRate
    };
  }, [tasks, loading]);

  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: Task[] } = {
      Today: [],
      Yesterday: [],
      Older: []
    };
    tasks.forEach(task => {
      const taskDate = new Date(task.createdAt);
      if (isToday(taskDate)) {
        groups.Today.push(task);
      } else if (isYesterday(taskDate)) {
        groups.Yesterday.push(task);
      } else {
        groups.Older.push(task);
      }
    });
    return groups;
  }, [tasks]);

  const renderSkeleton = () => (
    <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
    </div>
  );

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-headline text-foreground">Statistics</h2>
        </div>
      
        {loading ? renderSkeleton() : (
            <>
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.completedTasks}</div>
                            <p className="text-xs text-muted-foreground">out of {stats.totalTasks} total tasks</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Time Focused</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalTime} min</div>
                            <p className="text-xs text-muted-foreground">across all sessions</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.completionRate}%</div>
                            <p className="text-xs text-muted-foreground">Keep up the great work!</p>
                        </CardContent>
                    </Card>
                </div>
                
                {tasks.length > 0 ? (
                    <Accordion type="multiple" defaultValue={["Today", "Yesterday"]} className="w-full space-y-4">
                      {Object.entries(groupedTasks).map(([day, dayTasks]) => (
                        dayTasks.length > 0 && (
                          <AccordionItem value={day} key={day} className="border-none">
                              <Card>
                                  <AccordionTrigger className="p-4 border-b">
                                      <div className="flex items-center gap-2">
                                          <Calendar className="h-5 w-5" />
                                          <h3 className="font-headline text-lg">{day}</h3>
                                      </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="p-4">
                                      <div className="space-y-4">
                                      {dayTasks.map((task) => (
                                          <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                                              <div className="flex flex-col">
                                                  <span className="font-semibold">{task.name}</span>
                                                  <span className="text-sm text-muted-foreground">
                                                    Time spent: {task.duration} min &bull; {format(new Date(task.createdAt), "p")}
                                                  </span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                  {task.completed ? (
                                                      <div className="flex items-center gap-1 text-green-500">
                                                          <ThumbsUp className="h-4 w-4" />
                                                          <span className="text-sm font-medium">Done</span>
                                                      </div>
                                                  ) : (
                                                    <div className="inline-flex items-center">
                                                        <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-l-md px-3 py-1.5">
                                                            <Pause className="h-4 w-4" />
                                                            <span className="text-sm font-medium">Paused</span>
                                                        </div>
                                                        <Button size="sm" variant="outline" onClick={() => handleTaskClick(task)} className="rounded-l-none border-l-0 px-3 py-1.5 h-auto">
                                                            <Play className="mr-2 h-3 w-3" />
                                                            Continue
                                                        </Button>
                                                    </div>
                                                  )}
                                              </div>
                                          </div>
                                      ))}
                                      </div>
                                  </AccordionContent>
                              </Card>
                          </AccordionItem>
                        )
                      ))}
                    </Accordion>
                ) : (
                    <div className="py-16 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                        <BookText className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">No Task Log Found</h3>
                        <p className="mt-1 text-sm">Complete a task to see your log here.</p>
                    </div>
                )}
            </>
        )}
    </div>
  );
}

export default function WrappedTaskHistory() {
  return (
    <AuthWrapper>
      <TaskLogBookContent />
    </AuthWrapper>
  );
}
