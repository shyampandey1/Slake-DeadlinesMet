
"use client";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
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

const Icon = ({ name, ...props }: { name: string, [key: string]: any }) => {
  const LucideIcon = icons[name as keyof typeof icons];
  return LucideIcon ? <LucideIcon {...props} /> : null;
};

function RoutinePageComponent() {
  const router = useRouter();
  const { profile, setProfile, daysOff, setDaysOff, loading: profileLoading } = useProfile();
  const { presetTasks, loading: tasksLoading, categoryTimeRanges } = usePresetTasks();

  const handleProfessionSelect = (profession: Profession) => {
    setProfile(profession.name);
  };

  const handleDayOffToggle = (day: 'Saturday' | 'Sunday') => {
    const newDaysOff = daysOff.includes(day)
      ? daysOff.filter(d => d !== day)
      : [...daysOff, day];
    setDaysOff(newDaysOff);
  };

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
    <div className="flex flex-col h-screen">
      <header className="fixed top-0 left-0 right-0 w-full bg-background/80 backdrop-blur-sm border-b border-border/50 z-10">
        <div className="container mx-auto flex h-20 max-w-4xl items-center justify-between p-4 sm:p-6 md:p-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-xl font-bold font-headline text-foreground/80">Customize Routine</h1>
                <p className="text-sm text-muted-foreground">Tailor your daily tasks from morning to night.</p>
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
                            {professionList.map((p) => (
                                <Button
                                    key={p.name}
                                    variant={profile === p.name ? "default" : "outline"}
                                    onClick={() => handleProfessionSelect(p)}
                                    className={cn("flex items-center gap-2", profile === p.name ? p.color : `hover:${p.color}`)}
                                >
                                    <Icon name={p.icon} className="h-4 w-4" />
                                    {p.name}
                                </Button>
                            ))}
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
                          <div className="space-y-4">
                              {tasks.map((task, index) => (
                                  <div key={task.id || `${task.name}-${index}`} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                                      <div className="flex items-center gap-3">
                                          <Icon name={task.icon} className="h-5 w-5 text-muted-foreground" />
                                          <div>
                                              <p className="font-medium">{task.name}</p>
                                              <p className="text-xs text-muted-foreground">{task.duration} min</p>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
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
  );
}

export default function RoutinePage() {
    return (
        <AuthWrapper>
            <RoutinePageComponent />
        </AuthWrapper>
    )
}
