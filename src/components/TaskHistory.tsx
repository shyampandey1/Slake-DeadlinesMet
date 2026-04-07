
"use client";

import { useState, useMemo, useRef } from "react";
import { BookText, CheckCircle, Clock, Download, Droplets, FileDown, ImageDown, Play, ThumbsUp, X, Calendar as CalendarIcon, Wand2, Loader2, Sparkles, TrendingUp, Lightbulb, Target as TargetIcon } from "lucide-react";
import { format, isToday, isYesterday, parse, compareDesc, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, isWithinInterval, startOfDay, endOfDay, subYears, differenceInDays } from "date-fns";
import { useTasks } from "@/hooks/useFirestore";
import { useRouter } from "next/navigation";
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

const allCategories = Object.keys(categoryColors);

function TaskLogBookContent() {
    const { tasks, loading: tasksLoading } = useTasks();
    const { profile, loading: profileLoading } = useProfile();
    const router = useRouter();
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
            const result = await getProductivityInsights({
                tasks: filteredTasksByDate.map(t => ({
                    name: t.name,
                    duration: t.duration,
                    completed: t.completed,
                    category: getTaskCategoryDetails(t.name, profile as ProfileType).mainCategory,
                    createdAt: t.createdAt
                })),
                profile
            });
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
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <div className="flex items-center gap-2 w-full">
                            <Select value={filter} onValueChange={handleFilterChange}>
                                <SelectTrigger className="w-full sm:w-[180px]">
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
                                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
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
                            <Button variant="outline" className="w-full sm:w-auto">
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
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Tasks Logged</CardTitle>
                                    <BookText className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalTasks}</div>
                                    <p className="text-xs text-muted-foreground">{stats.completedTasks} completed</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.completionRate}%</div>
                                    <p className="text-xs text-muted-foreground">of all logged tasks</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Time Focused</CardTitle>
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formatDuration(stats.totalTime)}</div>
                                    <p className="text-xs text-muted-foreground">across all sessions</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Hydration Goal</CardTitle>
                                    <Droplets className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.hydrationProgress}%</div>
                                    <p className="text-xs text-muted-foreground">{stats.glassesDrunk} of {stats.hydrationGoal} glasses</p>
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
                                    {sortedGroupKeys.length > 0 ? sortedGroupKeys.map((day) => (
                                        <div key={day}>
                                            <h3 className="font-semibold text-lg mb-2 sticky top-0 bg-card py-1">{day}</h3>
                                            <div className="space-y-3">
                                                {groupedTasks[day].map((task) => (
                                                    <div key={task.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-card border">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold block truncate">{task.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Time spent: {formatDuration(task.duration)}
                                                                {!task.completed && ` of ${formatDuration(task.initialDuration)}`}
                                                                {task.createdAt && ` • ${format(new Date(task.createdAt), "p")}`}
                                                            </p>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            {task.completed ? (
                                                                <div className="flex items-center gap-1.5 text-green-500">
                                                                    <ThumbsUp className="h-4 w-4" />
                                                                    <span className="text-sm font-medium">Done</span>
                                                                </div>
                                                            ) : (
                                                                <Button size="sm" variant="secondary" onClick={() => handleTaskClick(task)} className="h-auto py-1.5 px-3">
                                                                    <Play className="mr-2 h-3 w-3" />
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
