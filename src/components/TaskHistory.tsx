
"use client";

import { useState, useMemo } from "react";
import { BookText, ThumbsUp, Pause, Play, Calendar as CalendarIcon, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { format, isToday, isYesterday, parse, compareDesc, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears, isWithinInterval } from "date-fns";
import { useTasks } from "@/hooks/useFirestore";
import { useRouter } from "next/navigation";
import { DateRange } from "react-day-picker";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "./ui/skeleton";
import AuthWrapper from "./AuthWrapper";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Task } from "@/types";
import { cn } from "@/lib/utils";


function formatDuration(minutes: number): string {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes} min`;
}

function TaskLogBookContent() {
  const { tasks, loading } = useTasks();
  const router = useRouter();
  const [filter, setFilter] = useState("today");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleTaskClick = (task: Task) => {
    if (!task.completed) {
      const remainingDuration = task.initialDuration - task.duration;
      const params = new URLSearchParams({
        task: task.name,
        duration: Math.max(1, remainingDuration).toString(),
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

  const filteredTasks = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (filter) {
      case "today":
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case "last7":
        startDate = startOfDay(subDays(now, 6));
        break;
      case "last30":
        startDate = startOfDay(subDays(now, 29));
        break;
      case "prevMonth":
        const prevMonthDate = subMonths(now, 1);
        startDate = startOfMonth(prevMonthDate);
        endDate = endOfMonth(prevMonthDate);
        break;
      case "thisYear":
        startDate = startOfYear(now);
        break;
      case "lastYear":
         const prevYearDate = subYears(now, 1);
         startDate = startOfYear(prevYearDate);
         endDate = endOfYear(prevYearDate);
         break;
      case "custom":
        if (dateRange?.from) {
          startDate = startOfDay(dateRange.from);
          endDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        } else {
          return [];
        }
        break;
      default:
        return tasks;
    }

    return tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      return isWithinInterval(taskDate, { start: startDate, end: endDate });
    });
  }, [tasks, filter, dateRange]);


  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: Task[] } = {};
    filteredTasks.forEach(task => {
        if (task.createdAt) {
            const taskDate = new Date(task.createdAt);
            let dayKey: string;

            if (isToday(taskDate)) {
                dayKey = "Today";
            } else if (isYesterday(taskDate)) {
                dayKey = "Yesterday";
            } else {
                dayKey = format(taskDate, 'PPP');
            }
            
            if (!groups[dayKey]) {
                groups[dayKey] = [];
            }
            groups[dayKey].push(task);
        }
    });
    return groups;
  }, [filteredTasks]);

  const sortedGroupKeys = useMemo(() => {
    return Object.keys(groupedTasks).sort((a, b) => {
        if (a === "Today") return -1;
        if (b === "Today") return 1;
        if (a === "Yesterday") return -1;
        if (b === "Yesterday") return 1;
        
        const dateA = parse(a, 'PPP', new Date());
        const dateB = parse(b, 'PPP', new Date());
        return compareDesc(dateA, dateB);
    });
  }, [groupedTasks]);

  const handleFilterChange = (value: string) => {
    if (value === "custom") {
        setIsCalendarOpen(true);
    } else {
        setDateRange(undefined);
        setFilter(value);
    }
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from) {
      setFilter("custom");
      setIsCalendarOpen(false);
    }
  };

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
                            <div className="text-2xl font-bold">{formatDuration(stats.totalTime)}</div>
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

                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Task Log</span>
                             <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <div className="flex items-center gap-2">
                                    <Select value={filter} onValueChange={handleFilterChange}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select a range" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="today">Today</SelectItem>
                                            <SelectItem value="last7">Last 7 days</SelectItem>
                                            <SelectItem value="last30">Last 30 days</SelectItem>
                                            <SelectItem value="prevMonth">Previous Month</SelectItem>
                                            <SelectItem value="thisYear">This Year</SelectItem>
                                            <SelectItem value="lastYear">Last Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="date"
                                            variant={"outline"}
                                            className={cn("w-auto justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                                            onClick={() => { setFilter('custom'); setIsCalendarOpen(true); }}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (
                                            dateRange.to ? (
                                                <>
                                                {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(dateRange.from, "LLL dd, y")
                                            )
                                            ) : (
                                            <span>Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                </div>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={dateRange?.from}
                                        selected={dateRange}
                                        onSelect={handleDateSelect}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredTasks.length > 0 ? (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                {sortedGroupKeys.map((day) => (
                                    <div key={day}>
                                        <h3 className="font-semibold text-lg mb-2 sticky top-0 bg-background/95 py-1 backdrop-blur-sm">{day}</h3>
                                        <div className="space-y-3">
                                            {groupedTasks[day].map((task) => (
                                                 <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold">{task.name}</span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {task.completed
                                                                ? `Time spent: ${formatDuration(task.duration)}`
                                                                : `Time spent: ${formatDuration(task.duration)} of ${formatDuration(task.initialDuration)}`
                                                            }
                                                            {task.createdAt && <>&nbsp;&bull;&nbsp;{format(new Date(task.createdAt), "p")}</>}
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
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="py-16 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                <BookText className="mx-auto h-12 w-12" />
                                <h3 className="mt-4 text-lg font-semibold">No Tasks Found</h3>
                                <p className="mt-1 text-sm">No tasks were logged in this period.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
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
