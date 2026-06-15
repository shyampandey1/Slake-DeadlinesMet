
"use client";

import { useState, useMemo, useRef } from "react";
import { BookText, CheckCircle, Clock, Download, Droplets, FileDown, ImageDown, Play, ThumbsUp, X, Calendar as CalendarIcon, Wand2, Loader2, Sparkles, TrendingUp, Lightbulb, Target as TargetIcon, Dumbbell, BrainCircuit, ShowerHead, Palette, Laptop } from "lucide-react";
import { format, isToday, isYesterday, parse, compareDesc, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, isWithinInterval, startOfDay, endOfDay, subYears, differenceInDays } from "date-fns";
import { useTasks } from "@/hooks/useFirestore";
import { useRouter } from "next/navigation";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { DateRange } from "react-day-picker";
import { Pie, PieChart as RechartsPieChart, ResponsiveContainer, Cell, Label as RechartsLabel } from 'recharts';
import { useProfile } from "@/hooks/useProfile";
import { getTaskCategoryDetails, categoryColors } from "@/lib/categorization";
import html2canvas from 'html2canvas';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "./ui/skeleton";
import AuthWrapper from "./AuthWrapper";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Task, ProfileType } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import { Separator } from "./ui/separator";
import { getProductivityInsights, type ProductivityInsightsOutput } from "@/ai/flows/get-productivity-insights";

function formatDuration(minutes: number): string {
    if (minutes === 0) return "0m";
    if (minutes < 1) return "<1m";
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
    }
    return `${minutes}m`;
}

const getCategoryIcon = (category?: string) => {
    const cat = category || 'Default';
    switch (cat) {
        case 'Hydration': return <Droplets className="h-5 w-5 text-blue-400" />;
        case 'Fitness': return <Dumbbell className="h-5 w-5 text-red-400" />;
        case 'Meditation': return <BrainCircuit className="h-5 w-5 text-emerald-400" />;
        case 'Hygiene': return <ShowerHead className="h-5 w-5 text-cyan-400" />;
        case 'Creativity': return <Palette className="h-5 w-5 text-pink-400" />;
        case 'Productivity': return <Laptop className="h-5 w-5 text-purple-400" />;
        default: return <BookText className="h-5 w-5 text-slate-400" />;
    }
};

const allCategories = Object.keys(categoryColors);

function TaskLogBookContent() {
    const { tasks, loading: tasksLoading } = useTasks();
    const { profile, profileData, loading: profileLoading } = useProfile();
    const router = useRouter();
    const { activeTimer } = useActiveTimer();
    const [filter, setFilter] = useState("today");
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [insights, setInsights] = useState<ProductivityInsightsOutput | null>(null);
    const [insightsLoading, setInsightsLoading] = useState(false);

    const loading = tasksLoading || profileLoading;

    const handleTaskClick = (task: Task) => {
        if (!task.completed) {
            const remainingDuration = task.initialDuration - task.duration;
            const params = new URLSearchParams({
                task: task.name,
                duration: Math.max(1, remainingDuration).toString(),
            });
            if (task.category) {
                params.append("category", task.category);
            }
            router.push(`/timer?${params.toString()}`);
        }
    };

    const { filteredTasksByDate, dateFilterRange, dateFilterLabel } = useMemo(() => {
        const now = new Date();
        let startDate: Date;
        let endDate: Date = now;
        let label: string = 'Today';

        switch (filter) {
            case "today":
                startDate = startOfDay(now);
                endDate = endOfDay(now);
                label = "Today";
                break;
            case "last7":
                startDate = startOfDay(subDays(now, 6));
                label = "Last 7 Days";
                break;
            case "last30":
                startDate = startOfDay(subDays(now, 29));
                label = "Last 30 Days";
                break;
            case "prevMonth":
                const prevMonthDate = subMonths(now, 1);
                startDate = startOfMonth(prevMonthDate);
                endDate = endOfMonth(prevMonthDate);
                label = format(prevMonthDate, 'MMMM yyyy');
                break;
            case "thisYear":
                startDate = startOfYear(now);
                label = "This Year";
                break;
            case "lastYear":
                const prevYearDate = subYears(now, 1);
                startDate = startOfYear(prevYearDate);
                endDate = endOfYear(prevYearDate);
                label = format(prevYearDate, 'yyyy');
                break;
            case "custom":
                if (date) {
                    startDate = startOfDay(date);
                    endDate = endOfDay(date);
                    label = format(date, "PPP");
                } else {
                    return { filteredTasksByDate: [], dateFilterRange: { start: now, end: now }, dateFilterLabel: "Select Range" };
                }
                break;
            default: // all
                startDate = new Date(0);
                label = "All Time";
                return { filteredTasksByDate: tasks, dateFilterRange: { start: startDate, end: now }, dateFilterLabel: label };
        }

        const tasksInRange = tasks.filter(task => {
            if (!task.createdAt || isNaN(new Date(task.createdAt).getTime())) {
                return false;
            }
            const taskDate = new Date(task.createdAt);
            return isWithinInterval(taskDate, { start: startDate, end: endDate });
        });

        return { filteredTasksByDate: tasksInRange, dateFilterRange: { start: startDate, end: endDate }, dateFilterLabel: label };
    }, [tasks, filter, date]);

    const filteredTasks = useMemo(() => {
        if (!selectedCategory) {
            return filteredTasksByDate;
        }
        return filteredTasksByDate.filter(task => getTaskCategoryDetails(task.name, profile as ProfileType).mainCategory === selectedCategory);
    }, [filteredTasksByDate, selectedCategory, profile]);

    const categoryData = useMemo(() => {
        const data: { [key: string]: number } = {};
        // Calculate data based on the date-filtered tasks, NOT the category-filtered ones
        filteredTasksByDate.forEach(task => {
            const categoryDetails = getTaskCategoryDetails(task.name, profile as ProfileType);
            const category = categoryDetails.mainCategory || 'Uncategorized';
            data[category] = (data[category] || 0) + task.duration;
        });

        const totalDuration = Object.values(data).reduce((sum, duration) => sum + duration, 0);
        if (totalDuration === 0) return [];

        return allCategories.map((name) => ({
            name,
            value: data[name] || 0,
            percentage: totalDuration > 0 ? Math.round(((data[name] || 0) / totalDuration) * 100) : 0,
            color: categoryColors[name as keyof typeof categoryColors] || categoryColors.Default
        })).sort((a, b) => b.value - a.value);
    }, [filteredTasksByDate, profile]);

    const categoryStats = useMemo(() => {
        const statsObj: { [key: string]: { duration: number; coins: number; taskCount: number } } = {
            'Productivity': { duration: 0, coins: 0, taskCount: 0 },
            'Hydration': { duration: 0, coins: 0, taskCount: 0 },
            'Fitness': { duration: 0, coins: 0, taskCount: 0 },
            'Meditation': { duration: 0, coins: 0, taskCount: 0 },
            'Hygiene': { duration: 0, coins: 0, taskCount: 0 },
            'Creativity': { duration: 0, coins: 0, taskCount: 0 }
        };
        
        filteredTasksByDate.forEach(task => {
            const cat = getTaskCategoryDetails(task.name, profile as ProfileType).mainCategory;
            if (statsObj[cat]) {
                statsObj[cat].duration += task.duration;
                statsObj[cat].coins += task.earnedCoins || 0;
                if (task.completed) {
                    statsObj[cat].taskCount += 1;
                }
            }
        });
        
        return statsObj;
    }, [filteredTasksByDate, profile]);

    const stats = useMemo(() => {
        const sourceTasks = selectedCategory ? filteredTasks : filteredTasksByDate;
        if (loading || sourceTasks.length === 0) {
            return { totalTasks: 0, completedTasks: 0, totalTime: 0, completionRate: 0, hydrationProgress: 0, hydrationGoal: 8, glassesDrunk: 0 };
        }
        const completedTasks = sourceTasks.filter(t => t.completed).length;
        const totalTime = sourceTasks.reduce((acc, t) => acc + t.duration, 0);
        const completionRate = sourceTasks.length > 0 ? Math.round((completedTasks / sourceTasks.length) * 100) : 0;

        const glassesDrunk = filteredTasksByDate.filter(t => {
            const rawName = (t.name || '').toLowerCase();
            const isHydration = getTaskCategoryDetails(t.name, profile as ProfileType).mainCategory === 'Hydration';
            return t.completed && (isHydration || rawName.includes('water') || rawName.includes('hydration') || rawName.includes('drink'));
        }).length;

        const daysInFilter = differenceInDays(dateFilterRange.end, dateFilterRange.start) + 1;
        const hydrationGoal = daysInFilter * 8;
        const hydrationProgress = hydrationGoal > 0 ? Math.min(100, Math.round((glassesDrunk / hydrationGoal) * 100)) : 0;

        return {
            totalTasks: sourceTasks.length,
            completedTasks,
            totalTime,
            completionRate,
            hydrationProgress,
            hydrationGoal,
            glassesDrunk
        };
    }, [filteredTasks, filteredTasksByDate, selectedCategory, loading, profile, dateFilterRange]);

    const groupedTasks = useMemo(() => {
        const groups: { [key: string]: Task[] } = {};
        filteredTasks.forEach(task => {
            if (task.createdAt && !isNaN(new Date(task.createdAt).getTime())) {
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

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const sortedGroupKeys = useMemo(() => {
        return Object.keys(groupedTasks).sort((a, b) => {
            if (a === "Today") return -1;
            if (b === "Today") return 1;
            if (a === "Yesterday") return -1;
            if (b === "Yesterday") return 1;

            try {
                const dateA = parse(a, 'PPP', new Date());
                const dateB = parse(b, 'PPP', new Date());
                if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
                    return compareDesc(dateA, dateB);
                }
            } catch (e) {
                return 0;
            }
            return 0;
        });
    }, [groupedTasks]);

    const handleFilterChange = (value: string) => {
        if (value === "custom") {
            setIsCalendarOpen(true);
        } else {
            setDate(new Date());
            setFilter(value);
        }
    };

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            setDate(selectedDate);
            setFilter("custom");
            setIsCalendarOpen(false);
        }
    };

    const generateInsights = async () => {
        if (filteredTasksByDate.length === 0) return;
        setInsightsLoading(true);
        try {
            const response = await fetch('/api/analytics/insights', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tasks: filteredTasksByDate.map(t => ({
                        name: t.name,
                        duration: t.duration,
                        completed: t.completed,
                        category: getTaskCategoryDetails(t.name, profile as ProfileType).mainCategory,
                        createdAt: t.createdAt
                    })),
                    profile,
                    streak: profileData?.streak || {}
                })
            });
            if (!response.ok) throw new Error('Failed to fetch insights');
            const result = await response.json();
            setInsights(result);
        } catch (e) {
            console.error("Failed to generate insights:", e);
        } finally {
            setInsightsLoading(false);
        }
    };

    const downloadCSV = () => {
        const headers = ['Date', 'Task Name', 'Category', 'Time Spent (min)', 'Initial Duration (min)', 'Completed'];
        const rows = filteredTasksByDate.map(task => [
            format(new Date(task.createdAt), 'yyyy-MM-dd HH:mm'),
            `"${task.name.replace(/"/g, '""')}"`,
            getTaskCategoryDetails(task.name, profile as ProfileType).mainCategory,
            task.duration,
            task.initialDuration,
            task.completed ? 'Yes' : 'No'
        ].join(','));

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "DeadlinesMet-logbook.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadImage = () => {
        if (reportRef.current) {
            html2canvas(reportRef.current, {
                useCORS: true,
                backgroundColor: getComputedStyle(document.body).backgroundColor,
                scale: 3,
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = "DeadlinesMet-logbook.png";
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }
    };

    const renderSkeleton = () => (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-[500px] w-full" />
        </div>
    );

    return (
        <div className="space-y-6 bg-background p-1">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-headline text-foreground">Statistics</h2>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <div className="flex items-center gap-2 w-full flex-1">
                            <Select value={filter} onValueChange={handleFilterChange}>
                                <SelectTrigger className="flex-1 sm:w-[180px] bg-card/40 border-white/5 shadow-sm text-foreground">
                                    <SelectValue placeholder="Select a range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="last7">Last 7 days</SelectItem>
                                    <SelectItem value="last30">Last 30 days</SelectItem>
                                    <SelectItem value="prevMonth">Previous Month</SelectItem>
                                    <SelectItem value="thisYear">This Year</SelectItem>
                                    <SelectItem value="lastYear">Last Year</SelectItem>
                                    <SelectItem value="all">All Time</SelectItem>
                                </SelectContent>
                            </Select>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn("flex-1 justify-start text-left font-normal bg-card/40 border-white/5 shadow-sm", !date && "text-muted-foreground")}
                                    onClick={() => { setFilter('custom'); setIsCalendarOpen(true); }}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date && filter === 'custom' ? format(date, "PPP") : (
                                        <span>Custom</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                        </div>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="single"
                                selected={date}
                                onSelect={handleDateSelect}
                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                toMonth={new Date()}
                            />
                        </PopoverContent>
                    </Popover>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto bg-card/40 border-white/5 shadow-sm">
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={downloadCSV}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Download as CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={downloadImage}>
                                <ImageDown className="mr-2 h-4 w-4" />
                                Download as Image
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {loading ? renderSkeleton() : (
                <>
                    <div ref={reportRef}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="bg-card/40 border-white/5 backdrop-blur-md shadow-lg rounded-2xl hover:border-white/10 transition-all duration-300 hover:scale-[1.02]">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                                    <CardTitle className="text-xs sm:text-sm font-medium truncate">Tasks Logged</CardTitle>
                                    <BookText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="text-xl sm:text-2xl font-bold">{stats.totalTasks}</div>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stats.completedTasks} completed</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card/40 border-white/5 backdrop-blur-md shadow-lg rounded-2xl hover:border-white/10 transition-all duration-300 hover:scale-[1.02]">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                                    <CardTitle className="text-xs sm:text-sm font-medium truncate">Completion Rate</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="text-xl sm:text-2xl font-bold">{stats.completionRate}%</div>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">of logged tasks</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card/40 border-white/5 backdrop-blur-md shadow-lg rounded-2xl hover:border-white/10 transition-all duration-300 hover:scale-[1.02]">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                                    <CardTitle className="text-xs sm:text-sm font-medium truncate">Time Focused</CardTitle>
                                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="text-xl sm:text-2xl font-bold truncate">{formatDuration(stats.totalTime)}</div>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">all sessions</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card/40 border-white/5 backdrop-blur-md shadow-lg rounded-2xl hover:border-white/10 transition-all duration-300 hover:scale-[1.02]">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                                    <CardTitle className="text-xs sm:text-sm font-medium truncate">Hydration Goal</CardTitle>
                                    <Droplets className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="text-xl sm:text-2xl font-bold">{stats.hydrationProgress}%</div>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stats.glassesDrunk}/{stats.hydrationGoal} glasses</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="mt-4">
                            {!insights && !insightsLoading ? (
                                <Button
                                    onClick={generateInsights}
                                    disabled={filteredTasksByDate.length === 0}
                                    className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md border-none flex items-center justify-center gap-2 group transition-all duration-300 active:scale-[0.98]"
                                >
                                    <Sparkles className="w-5 h-5 text-blue-200 group-hover:animate-pulse" />
                                    <span className="font-headline text-lg font-bold tracking-tight">Generate AI Productivity Insights</span>
                                </Button>
                            ) : (
                                <Card className="border-blue-500/30 bg-blue-900/10 overflow-hidden">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-blue-500/5">
                                        <div>
                                            <CardTitle className="text-lg font-headline flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-blue-400" />
                                                AI Productivity Coach
                                            </CardTitle>
                                            <CardDescription>Based on your {dateFilterLabel} log</CardDescription>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setInsights(null)} disabled={insightsLoading}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-4">
                                        {insightsLoading ? (
                                            <div className="py-8 flex flex-col items-center justify-center gap-4">
                                                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                                                <p className="text-sm italic animate-pulse">Analyzing your performance patterns...</p>
                                            </div>
                                        ) : insights ? (
                                            <div className="grid gap-4 md:grid-cols-3">
                                                <div className="md:col-span-2 space-y-4">
                                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm">
                                                        <p className="text-sm leading-relaxed italic text-blue-900 font-medium">"{insights.summary}"</p>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                                                                <TrendingUp className="w-3.5 h-3.5" />
                                                                Strengths
                                                            </h4>
                                                            <ul className="space-y-1.5">
                                                                {insights.strengths.map((s, i) => (
                                                                    <li key={i} className="text-sm flex items-start gap-2 text-foreground/80">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                                                        {s}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                                                                <Lightbulb className="w-3.5 h-3.5" />
                                                                Suggestions
                                                            </h4>
                                                            <ul className="space-y-1.5">
                                                                {insights.suggestions.map((s, i) => (
                                                                    <li key={i} className="text-sm flex items-start gap-2 text-foreground/80">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                                                                        {s}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-500/5 to-purple-500/5 rounded-xl border border-white/5">
                                                    <div className="relative w-24 h-24 mb-3">
                                                        <svg className="w-full h-full" viewBox="0 0 100 100">
                                                            <circle className="text-white/10 stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                                                            <circle
                                                                className="text-blue-500 stroke-current"
                                                                strokeWidth="8"
                                                                strokeDasharray={251.2}
                                                                strokeDashoffset={251.2 - (251.2 * insights.focusScore) / 100}
                                                                strokeLinecap="round"
                                                                fill="transparent"
                                                                r="40"
                                                                cx="50"
                                                                cy="50"
                                                                transform="rotate(-90 50 50)"
                                                            />
                                                        </svg>
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                            <span className="text-2xl font-bold">{insights.focusScore}</span>
                                                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Focus</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-center font-medium text-muted-foreground leading-tight">Focus Score based on consistency and output</p>
                                                </div>
                                            </div>
                                        ) : null}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <Card className="mt-4">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span>Category Breakdown</span>
                                    {selectedCategory && (
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="h-auto px-2 py-1 text-xs">
                                            <X className="w-3 h-3 mr-1" />
                                            Clear filter
                                        </Button>
                                    )}
                                </CardTitle>
                                <CardDescription>{dateFilterLabel}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {filteredTasksByDate.length > 0 ? (
                                    <div className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6 items-center">
                                            <div className="h-64 w-full">
                                                <ResponsiveContainer>
                                                    <RechartsPieChart>
                                                        <Pie
                                                            data={categoryData}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            labelLine={false}
                                                            paddingAngle={2}
                                                        >
                                                            {categoryData.map((entry, index) => (
                                                                <Cell
                                                                    key={`cell-${index}`}
                                                                    fill={entry.color}
                                                                    stroke={entry.color}
                                                                    className={cn("transition-opacity outline-none", selectedCategory && selectedCategory !== entry.name && "opacity-30")}
                                                                />
                                                            ))}
                                                            <RechartsLabel
                                                                value={formatDuration(stats.totalTime)}
                                                                position="center"
                                                                className="fill-foreground text-2xl font-bold"
                                                            />
                                                        </Pie>
                                                    </RechartsPieChart>
                                                </ResponsiveContainer>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                {categoryData.map(cat => (
                                                    cat.value > 0 && (
                                                        <button
                                                            key={cat.name}
                                                            onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                                                            className={cn(
                                                                "flex items-center gap-3 p-2 rounded-md transition-colors w-full",
                                                                selectedCategory === cat.name && 'bg-accent'
                                                            )}
                                                        >
                                                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                                            <span className={cn("text-sm text-muted-foreground", selectedCategory === cat.name && "text-accent-foreground")}>{cat.name}</span>
                                                            <span className={cn("ml-auto text-sm font-semibold text-foreground", selectedCategory === cat.name && "text-accent-foreground")}>{formatDuration(cat.value)}</span>
                                                        </button>
                                                    )
                                                ))}
                                            </div>
                                        </div>

                                        <Separator className="bg-white/5" />

                                        {/* TASK 2: Sleek Responsive Glassmorphic Cards Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {Object.keys(categoryStats).map((catName) => {
                                                const stat = categoryStats[catName];
                                                const color = categoryColors[catName as keyof typeof categoryColors] || '#64748b';
                                                const isSelected = selectedCategory === catName;
                                                
                                                // Map categories to Lucide icons
                                                let Icon = Laptop;
                                                if (catName === 'Hydration') Icon = Droplets;
                                                else if (catName === 'Fitness') Icon = Dumbbell;
                                                else if (catName === 'Meditation') Icon = BrainCircuit;
                                                else if (catName === 'Hygiene') Icon = ShowerHead;
                                                else if (catName === 'Creativity') Icon = Palette;
                                                
                                                return (
                                                    <button
                                                        key={catName}
                                                        onClick={() => setSelectedCategory(isSelected ? null : catName)}
                                                        className={cn(
                                                            "flex flex-col text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group select-none cursor-pointer",
                                                            isSelected 
                                                                ? "bg-slate-900/60 border-blue-500/50 shadow-lg shadow-blue-500/5 scale-[1.02]" 
                                                                : "bg-slate-950/20 hover:bg-slate-900/40 border-white/5 hover:border-white/10 hover:scale-[1.01]"
                                                        )}
                                                        style={{
                                                            boxShadow: isSelected ? `0 4px 20px -2px ${color}20` : undefined
                                                        }}
                                                    >
                                                        {/* Gradient glow bg effect */}
                                                        <div 
                                                            className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-[0.08] blur-xl group-hover:scale-125 transition-transform duration-500"
                                                            style={{ backgroundColor: color }}
                                                        />
                                                        
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div 
                                                                className="p-2.5 rounded-xl border transition-colors"
                                                                style={{ 
                                                                    backgroundColor: `${color}15`, 
                                                                    borderColor: `${color}30`,
                                                                    color: color 
                                                                }}
                                                            >
                                                                <Icon className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-sm tracking-tight text-white/90">{catName}</h4>
                                                                <p className="text-[10px] text-muted-foreground">{stat.taskCount} completed</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="mt-auto space-y-2 w-full">
                                                            <div className="flex justify-between items-baseline">
                                                                <span className="text-2xl font-black font-headline text-white">{formatDuration(stat.duration)}</span>
                                                                <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                                                                    🪙 {stat.coins}
                                                                </span>
                                                            </div>
                                                            
                                                            {/* HSL dynamic glow progress bar */}
                                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full rounded-full transition-all duration-500"
                                                                    style={{ 
                                                                        backgroundColor: color,
                                                                        width: `${stats.totalTime > 0 ? Math.min(100, Math.round((stat.duration / stats.totalTime) * 100)) : 0}%`,
                                                                        boxShadow: `0 0 8px ${color}`
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
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
                    </div>
                    {/* Task log list is now outside the reportRef */}
                    {filteredTasksByDate.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Task Log</CardTitle>
                                {selectedCategory && (
                                    <CardDescription>Showing tasks for the '{selectedCategory}' category</CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                    {activeTimer && activeTimer.taskName && (
                                        <div className="mb-4 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-4 animate-in fade-in duration-300">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className={cn(
                                                            "animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75",
                                                            activeTimer.isPaused && "bg-amber-500"
                                                        )}></span>
                                                        <span className={cn(
                                                            "relative inline-flex rounded-full h-2 w-2 bg-primary",
                                                            activeTimer.isPaused && "bg-amber-500"
                                                        )}></span>
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                                        {activeTimer.isPaused ? "Paused Focus Session" : "Running Focus Session"}
                                                    </span>
                                                </div>
                                                <p className="font-bold text-foreground truncate">{activeTimer.taskName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Initial duration: {formatDuration(activeTimer.initialDuration)}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => {
                                                        router.push(`/timer?task=${encodeURIComponent(activeTimer.taskName)}&duration=${activeTimer.initialDuration}&category=${activeTimer.category || ''}&color=${activeTimer.color || ''}`);
                                                    }} 
                                                    className="h-auto py-1.5 px-3 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-sm transition-all active:scale-95"
                                                >
                                                    <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                                                    Resume
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {sortedGroupKeys.length > 0 ? sortedGroupKeys.map((day) => (
                                        <div key={day}>
                                            <h3 className="font-semibold text-lg mb-2 sticky top-0 bg-card py-1">{day}</h3>
                                            <div className="space-y-3">
                                                {groupedTasks[day].map((task) => (
                                                    <div key={task.id} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-card/60 border border-white/5 backdrop-blur-md shadow-sm hover:border-white/10 transition-colors">
                                                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                                            {/* Visual Category Icon Container */}
                                                            <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex-shrink-0 flex items-center justify-center">
                                                                {getCategoryIcon(task.category)}
                                                            </div>
                                                            <div className="flex-1 min-w-0 text-left">
                                                                <p className="font-semibold block truncate text-foreground text-sm sm:text-base">{task.name}</p>
                                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                                    Time spent: {formatDuration(task.duration)}
                                                                    {!task.completed && ` of ${formatDuration(task.initialDuration)}`}
                                                                    {task.createdAt && ` • ${format(new Date(task.createdAt), "p")}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            {task.completed ? (
                                                                <div className="flex items-center gap-1.5 text-green-500 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full text-xs font-bold">
                                                                    <ThumbsUp className="h-3.5 w-3.5" />
                                                                    <span>Done</span>
                                                                </div>
                                                            ) : (
                                                                <Button size="sm" variant="secondary" onClick={() => handleTaskClick(task)} className="h-auto py-1.5 px-3 rounded-full text-xs shadow-sm">
                                                                    <Play className="mr-1.5 h-3 w-3 fill-current" />
                                                                    Continue
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-10 text-center text-muted-foreground">
                                            <p>No tasks found for '{selectedCategory}' in this period.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
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
