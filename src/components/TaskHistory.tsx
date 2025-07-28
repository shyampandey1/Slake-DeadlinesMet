"use client";

import { History, ThumbsUp, ThumbsDown, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTasks } from "@/hooks/useFirestore";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";

export default function TaskHistory() {
  const { tasks, loading, clearTasks } = useTasks();
  const router = useRouter();

  const clearHistory = () => {
    clearTasks();
  };
  
  const handleTaskClick = (task: typeof tasks[0]) => {
    if (!task.completed) {
      const params = new URLSearchParams({
        task: task.name,
        duration: task.duration.toString(),
      });
      router.push(`/timer?${params.toString()}`);
    }
  };


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-6 w-6" />
          <CardTitle className="font-headline text-2xl">Task History</CardTitle>
        </div>
        {tasks.length > 0 && (
          <Button variant="ghost" size="icon" onClick={clearHistory}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Clear History</span>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : tasks.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead className="text-center">Duration</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow 
                  key={task.id} 
                  onClick={() => handleTaskClick(task)}
                  className={cn(!task.completed && "cursor-pointer hover:bg-muted/60")}
                >
                  <TableCell className="font-medium">{task.name}</TableCell>
                  <TableCell className="text-center">{task.duration} min</TableCell>
                  <TableCell className="text-center">
                    {task.completed ? (
                      <Badge variant="secondary" className="bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100">
                        <ThumbsUp className="mr-1 h-3 w-3" /> Done
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <ThumbsDown className="mr-1 h-3 w-3" /> Not Done
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {task.createdAt ? formatDistanceToNow(new Date(task.createdAt), {
                      addSuffix: true,
                    }) : 'Just now'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>No tasks completed yet. Start a new one!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
