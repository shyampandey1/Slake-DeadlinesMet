
"use client";

import { useState } from "react";
import { format, isSameDay, set } from "date-fns";
import AuthWrapper from "@/components/AuthWrapper";
import HamburgerMenu from "@/components/HamburgerMenu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useCalendarEvents } from "@/hooks/useFirestore";
import type { UserEvent } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ListChecks, BrainCircuit, LucideIcon, Clock, CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const iconMap: { [key: string]: LucideIcon } = {
    ListChecks: ListChecks,
    BrainCircuit: BrainCircuit,
    Calendar: CalendarIcon,
};

const formSchema = z.object({
  name: z.string().min(1, "Task name is required."),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute."),
  hour: z.string(),
  minute: z.string(),
});


function AddEventDialog({ isOpen, onClose, onSave, selectedDate }: { isOpen: boolean, onClose: () => void, onSave: (data: z.infer<typeof formSchema>) => void, selectedDate: Date }) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", duration: 30, hour: "09", minute: "00" },
    });

    const handleSubmit = (data: z.infer<typeof formSchema>) => {
        onSave(data);
        form.reset();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Event for {format(selectedDate, "PPP")}</DialogTitle>
                    <DialogDescription>Schedule a new task for this day.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Task Name</FormLabel>
                                <FormControl><Input placeholder="e.g., Project meeting" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="duration"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Duration (min)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="space-y-2">
                                <FormLabel>Time</FormLabel>
                                <div className="flex gap-2">
                                    <FormField
                                        control={form.control}
                                        name="hour"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Hour" />
                                                    </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(hour => (
                                                            <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="minute"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Minute" />
                                                    </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(minute => (
                                                            <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                            <Button type="submit">Add Event</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


function CalendarPageComponent() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const { events, loading, addEvent, deleteEvent } = useCalendarEvents();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const selectedDayEvents = events
        .filter(event => selectedDate && isSameDay(new Date(event.date), selectedDate))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    const handleSaveEvent = async (data: z.infer<typeof formSchema>) => {
        if (selectedDate) {
            const hours = parseInt(data.hour, 10);
            const minutes = parseInt(data.minute, 10);
            const eventDate = set(selectedDate, { hours, minutes });

            await addEvent({
                name: data.name,
                duration: data.duration,
                icon: "ListChecks", 
                date: eventDate.toISOString()
            });
        }
    };
    
    const renderSkeleton = () => (
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
        </div>
    );

    return (
        <div className="flex flex-col h-screen">
            <header className="fixed top-0 left-0 right-0 w-full bg-background/80 backdrop-blur-sm border-b border-border/50 z-10">
                <div className="container mx-auto flex h-20 max-w-4xl items-center justify-between p-4 sm:p-6 md:p-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-xl font-bold font-headline text-foreground/80">Event Calendar</h1>
                        <p className="text-sm text-muted-foreground">Plan your days and schedule tasks.</p>
                    </div>
                    <HamburgerMenu />
                </div>
            </header>
            <main className="flex-1 overflow-y-auto pt-24 pb-20">
                <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl grid md:grid-cols-2 gap-8">
                    <Card>
                        <CardContent className="p-2">
                           <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                className="rounded-md"
                                modifiers={{
                                    hasEvent: events.map(e => new Date(e.date))
                                }}
                                modifiersClassNames={{
                                    hasEvent: 'has-event'
                                }}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                               <span>Tasks for {selectedDate ? format(selectedDate, "PPP") : "..."}</span>
                               <Button size="icon" variant="outline" onClick={() => setIsDialogOpen(true)} disabled={!selectedDate}>
                                   <Plus className="h-4 w-4" />
                               </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                             {loading ? renderSkeleton() : selectedDayEvents.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedDayEvents.map(event => {
                                        const Icon = iconMap[event.icon] || ListChecks;
                                        return (
                                            <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                                                <div className="flex items-center gap-3">
                                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                                    <div>
                                                        <span className="font-medium">{event.name}</span>
                                                        <div className="text-xs text-muted-foreground">{format(new Date(event.date), "p")}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="gap-1.5 whitespace-nowrap">
                                                        <Clock className="h-3.5 w-3.5"/>
                                                        {event.duration} min
                                                    </Badge>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive" onClick={() => deleteEvent(event.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground py-10 flex flex-col items-center justify-center h-full">
                                    <CalendarIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
                                    <p className="font-semibold">No tasks scheduled</p>
                                    <p className="text-sm">Add a task to see it here.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
            {selectedDate && <AddEventDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSave={handleSaveEvent} selectedDate={selectedDate}/>}
        </div>
    );
}

export default function WrappedCalendarPage() {
    return (
        <AuthWrapper>
            <CalendarPageComponent />
        </AuthWrapper>
    );
}
