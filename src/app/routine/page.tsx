"use client";

import { useState, useRef, useEffect } from 'react';
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useProfile, professions, Profession } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useRoutineStore } from "@/hooks/useRoutineStore";
import { icons } from "lucide-react"; 
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import AuthWrapper from '@/components/AuthWrapper';
import HamburgerMenu from '@/components/HamburgerMenu';
import { format } from 'date-fns';
import AddTaskDialog from '@/components/AddTaskDialog';
import type { UserPresetTask } from '@/types';
import {
  Plus,
  RotateCw,
  Trash2,
  Sparkles,
  Loader2,
  Wand2,
  SlidersHorizontal,
  ChevronDown,
  Check,
  Copy,
  Edit2,
  Download,
  Share2,
  Upload,
  Calendar,
  Layers,
  CheckCircle2,
  Sun,
  Moon,
  Clock,
  MoreVertical,
} from 'lucide-react';
import { generateAIRoutine } from '@/ai/flows/generate-routine';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { defaultRoutines, profileToRoutineMap, applyMoversTemplate, formatTo12h } from '@/lib/routines';
import { RoutineTunerModal } from '@/components/routine/RoutineTunerModal';
import { DMDropzone } from '@/components/routine/DMDropzone';
import { SharedRoutinesSection } from '@/components/routine/SharedRoutinesSection';
import { exportRoutineToDMFile, shareRoutineToCommunity } from '@/lib/dmFileHandler';
import { toast } from '@/hooks/use-toast';
import { DMRoutineAuthor, DMRoutineFileFormat, CustomRoutineProfile } from '@/types/routineTuner';

// Corrected Icon component
const Icon = ({ name, ...props }: { name: string; [key: string]: any }) => {
  const LucideIcon = icons[name as keyof typeof icons];
  if (!LucideIcon) return null;
  return React.createElement(LucideIcon, props);
};

function RoutinePageComponent() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    profile,
    setProfile,
    daysOff,
    setDaysOff,
    profileData,
    reformerPreference,
    setReformerPreference,
  } = useProfile();

  const {
    presetTasks,
    loading: tasksLoading,
    categoryTimeRanges,
    addPresetTask,
    updatePresetTask,
    deletePresetTask,
    isDefaultTask,
    clearAndSetPresetTasks,
    customProfiles,
    activeProfileId,
    activeCustomProfile,
    saveCustomProfile,
    setActiveProfile,
    renameCustomProfile,
    duplicateCustomProfile,
    deleteCustomProfile,
    importDMProfile,
  } = useRoutineStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<(UserPresetTask & { category: string }) | undefined>(undefined);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Routine Tuner Modal State
  const [isTunerModalOpen, setIsTunerModalOpen] = useState(false);
  const [tunerProfileToEdit, setTunerProfileToEdit] = useState<CustomRoutineProfile | null>(null);
  const [isImportDropzoneOpen, setIsImportDropzoneOpen] = useState(false);

  // Rename Dialog State
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renameInputValue, setRenameInputValue] = useState('');

  const routineRef = useRef<HTMLDivElement>(null);
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  // Update open categories when presetTasks changes
  useEffect(() => {
    const categories = Object.keys(presetTasks);
    if (categories.length > 0) {
      setOpenCategories(categories);
    }
  }, [presetTasks]);

  const handleProfessionSelect = (p: Profession & { activeColor?: string }) => {
    setProfile(p.name);
    // If currently viewing a custom profile, switch to default to view standard profession tasks
    if (activeProfileId) {
      setActiveProfile(null);
    }
    setTimeout(() => {
      routineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  const handleDayOffToggle = (day: 'Saturday' | 'Sunday') => {
    const newDaysOff = daysOff.includes(day)
      ? daysOff.filter((d) => d !== day)
      : [...daysOff, day];
    setDaysOff(newDaysOff);
  };

  const handleOpenDialog = (task?: UserPresetTask, category?: string) => {
    const initialTask = task && category ? { ...task, category } : category ? ({ category } as any) : undefined;
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
    setIsDialogOpen(false);
  };

  const handleTemplateChange = async (pref: 'morning_primer' | 'evening_restorer') => {
    await setReformerPreference(pref);
    if (!profile) return;
    const routineKey = profileToRoutineMap[profile];
    if (!routineKey) return;
    const defaultTasksForProfile = defaultRoutines.routines[routineKey] || [];
    const updatedTasks = applyMoversTemplate(defaultTasksForProfile, pref);
    await clearAndSetPresetTasks(profile, updatedTasks);
  };

  const handleResetRoutine = async () => {
    if (!profile) return;
    const routineKey = profileToRoutineMap[profile];
    if (!routineKey) return;
    const defaultTasksForProfile = defaultRoutines.routines[routineKey];
    if (!defaultTasksForProfile) return;

    await clearAndSetPresetTasks(profile, defaultTasksForProfile);
  };

  const handleGenerateAIRoutine = async () => {
    if (!profile) return;
    setIsGeneratingAI(true);
    try {
      const aiRoutine = await generateAIRoutine({ profession: profile, daysOff });
      const flatTasks = Object.entries(aiRoutine.routines).flatMap(([category, { tasks }]) =>
        tasks.map((task) => ({
          name: task.name,
          duration: Number(task.duration),
          icon: task.icon,
          category: category,
        }))
      );
      await clearAndSetPresetTasks(profile, flatTasks);
    } catch (error) {
      console.error('Failed to generate AI routine:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Export Active Routine to .dm File
  const handleExportActiveRoutine = async () => {
    if (!activeCustomProfile) return;
    const author: DMRoutineAuthor = {
      uid: user?.uid || 'guest_user',
      displayName: user?.displayName || profileData?.displayName || 'Reformer',
      profession: profile || 'General',
    };

    try {
      await exportRoutineToDMFile(activeCustomProfile, author);
      toast({
        title: 'Routine Exported',
        description: `Exported "${activeCustomProfile.name}.dm" to your device.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: err?.message || 'Could not export .dm container.',
      });
    }
  };

  // Share Active Routine with Reformers Community Hub
  const handleShareActiveRoutine = async () => {
    if (!activeCustomProfile) return;
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Sign In Required',
        description: 'Please sign in to publish your routine to the Reformers Hub.',
      });
      return;
    }

    const author: DMRoutineAuthor = {
      uid: user.uid,
      displayName: user.displayName || profileData?.displayName || 'Reformer',
      profession: profile || 'General',
    };

    try {
      await shareRoutineToCommunity(activeCustomProfile, author);
      toast({
        title: 'Published to Reformers Hub! 🚀',
        description: `"${activeCustomProfile.name}" is now live in the community marketplace.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Publish Failed',
        description: err?.message || 'Could not share routine to community.',
      });
    }
  };

  // Inline Rename Modal Handler
  const openRenameDialog = () => {
    if (!activeCustomProfile) return;
    setRenameInputValue(activeCustomProfile.name);
    setIsRenameDialogOpen(true);
  };

  const handleConfirmRename = async () => {
    if (!activeCustomProfile || !renameInputValue.trim()) return;
    await renameCustomProfile(activeCustomProfile.id, renameInputValue.trim());
    setIsRenameDialogOpen(false);
    toast({
      title: 'Profile Renamed',
      description: `Routine is now named "${renameInputValue.trim()}".`,
    });
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
        {/* Sticky Fixed Header */}
        <header className="fixed top-0 left-0 right-0 w-full bg-background/80 backdrop-blur-md border-b border-border/50 z-10">
          <div className="w-full flex h-20 items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12">
            <div className="flex flex-col gap-0.5 min-w-0 pr-2">
              <h1 className="text-xl sm:text-2xl font-bold font-headline text-foreground/90 truncate">
                Daily Routine
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                4-Quadrant Circadian Rhythm &amp; Reformers MOVERS Execution
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Prominent 'Tune My Schedule' Button */}
              <Button
                size="sm"
                onClick={() => {
                  setTunerProfileToEdit(null);
                  setIsTunerModalOpen(true);
                }}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 rounded-xl gap-1.5 h-10 px-3.5 sm:px-4 shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4 text-black" />
                <span className="hidden sm:inline">Tune My Schedule</span>
                <span className="sm:hidden font-bold">Tune</span>
              </Button>

              <HamburgerMenu />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pt-24 pb-20 min-w-0">
          <div className="w-full max-w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6 space-y-8 min-w-0 overflow-x-hidden">
            
            {/* Routine Profile Switcher & Fast Actions Bar */}
            <Card className="border-border/60 bg-gradient-to-br from-card/90 via-card/50 to-background/80 backdrop-blur-xl shadow-sm rounded-2xl sm:rounded-3xl overflow-hidden">
              <CardContent className="p-4 sm:p-5 space-y-4">
                {/* Header Row: Title + Active Status + Primary Tweak Button */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                      <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Active Schedule
                        </span>
                        {activeCustomProfile ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Tuned Profile
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Default Template
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      setTunerProfileToEdit(activeCustomProfile || null);
                      setIsTunerModalOpen(true);
                    }}
                    className="h-8 sm:h-9 px-3 text-xs font-bold rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 shrink-0 gap-1.5 shadow-sm"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{activeCustomProfile ? 'Tweak' : 'Tune'}</span>
                  </Button>
                </div>

                {/* Main Selector & Unified Action Row */}
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 min-w-0 h-10 text-xs sm:text-sm font-bold justify-between rounded-xl border-border/80 bg-background/60 hover:border-purple-500/50 px-3"
                      >
                        <span className="truncate">
                          {activeCustomProfile
                            ? activeCustomProfile.name
                            : `Default (${profile || 'Standard'})`}
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-1.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64 rounded-2xl p-2 z-50">
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        Standard Templates
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => setActiveProfile(null)}
                        className="rounded-xl flex items-center justify-between text-xs py-2 cursor-pointer"
                      >
                        <span>Default ({profile || 'General'})</span>
                        {!activeCustomProfile && <Check className="w-4 h-4 text-emerald-400" />}
                      </DropdownMenuItem>

                      {customProfiles.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Custom Tuned Profiles
                          </DropdownMenuLabel>
                          {customProfiles.map((cp) => (
                            <DropdownMenuItem
                              key={cp.id}
                              onClick={() => setActiveProfile(cp.id)}
                              className="rounded-xl flex items-center justify-between text-xs py-2 cursor-pointer"
                            >
                              <span className="truncate">{cp.name}</span>
                              {activeProfileId === cp.id && (
                                <Check className="w-4 h-4 text-emerald-400" />
                              )}
                            </DropdownMenuItem>
                          ))}
                        </>
                      )}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setTunerProfileToEdit(null);
                          setIsTunerModalOpen(true);
                        }}
                        className="rounded-xl text-xs py-2 text-emerald-400 cursor-pointer gap-2 font-bold"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" /> + Tune New Schedule
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setIsImportDropzoneOpen((prev) => !prev)}
                        className="rounded-xl text-xs py-2 text-purple-400 cursor-pointer gap-2"
                      >
                        <Upload className="w-3.5 h-3.5" /> Import .dm Routine
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Clean Action Icons Strip */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {activeCustomProfile && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleShareActiveRoutine}
                          className="h-10 w-10 p-0 rounded-xl border-border/80 hover:border-purple-500/50 hover:bg-purple-500/10 text-purple-400 shrink-0"
                          title="Publish routine to community"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportActiveRoutine}
                          className="h-10 w-10 p-0 rounded-xl border-border/80 hover:border-blue-500/50 hover:bg-blue-500/10 text-blue-400 shrink-0"
                          title="Download .dm container to device"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsImportDropzoneOpen((prev) => !prev)}
                      className="h-10 w-10 p-0 rounded-xl border-border/80 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400 shrink-0"
                      title="Import a .dm routine file"
                    >
                      <Upload className="w-4 h-4" />
                    </Button>

                    {activeCustomProfile && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 w-10 p-0 rounded-xl border-border/80 hover:bg-muted/60 shrink-0"
                            title="More profile options"
                          >
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1.5 z-50">
                          <DropdownMenuItem onClick={openRenameDialog} className="rounded-xl text-xs py-2 gap-2 cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" /> Rename Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateCustomProfile(activeCustomProfile.id)} className="rounded-xl text-xs py-2 gap-2 cursor-pointer">
                            <Copy className="w-3.5 h-3.5 text-muted-foreground" /> Duplicate Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <div className="rounded-xl text-xs py-2 px-2 text-destructive hover:bg-destructive/10 flex items-center gap-2 cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" /> Delete Profile
                              </div>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Custom Routine?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{activeCustomProfile.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteCustomProfile(activeCustomProfile.id)}
                                  className="bg-destructive hover:bg-destructive/90 rounded-xl"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Circadian Anchors Pill Bar (Clean 12h display) */}
                {activeCustomProfile && (
                  <div className="flex items-center gap-2 pt-3 border-t border-border/40 text-xs flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                      <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Wake: <strong className="font-mono font-bold">{formatTo12h(activeCustomProfile.tuningAnswers.wakeUpTime)}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                      <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Sleep: <strong className="font-mono font-bold">{formatTo12h(activeCustomProfile.tuningAnswers.sleepTime)}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/60 text-muted-foreground font-medium border border-border/50">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{activeCustomProfile.tasks?.length || 0} Chronological Blocks</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Collapsible Import .dm Dropzone Area */}
            {isImportDropzoneOpen && (
              <DMDropzone
                onRoutineImported={async (dm) => {
                  await importDMProfile(dm);
                  setIsImportDropzoneOpen(false);
                  toast({
                    title: 'Routine Imported!',
                    description: `Loaded "${dm.profileName}" into your routine profiles.`,
                  });
                }}
              />
            )}

            {/* Profession Templates & Day Off (Show when on Default or for inspiration) */}
            {!activeCustomProfile && (
              <>
                {Object.entries(professions).map(([group, professionList]) => (
                  <Card key={group} className="overflow-hidden">
                    <CardHeader>
                      <CardTitle className="font-headline text-lg">{group}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4">
                        {professionList.map((p) => {
                          const isSelected = profile === p.name;
                          return (
                            <Button
                              key={p.name}
                              variant="outline"
                              onClick={() => handleProfessionSelect(p)}
                              className={cn(
                                "flex items-center gap-2 transition-colors duration-200 border-2 bg-transparent",
                                isSelected ? p.activeColor : p.color
                              )}
                            >
                              <Icon name={p.icon} className="h-4 w-4" />
                              {p.name}
                            </Button>
                          );
                        })}
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
                      <Checkbox
                        id="saturday"
                        checked={daysOff.includes('Saturday')}
                        onCheckedChange={() => handleDayOffToggle('Saturday')}
                      />
                      <label htmlFor="saturday" className="text-sm font-medium leading-none">
                        Saturday
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sunday"
                        checked={daysOff.includes('Sunday')}
                        onCheckedChange={() => handleDayOffToggle('Sunday')}
                      />
                      <label htmlFor="sunday" className="text-sm font-medium leading-none">
                        Sunday
                      </label>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-emerald-500/30 bg-emerald-500/5">
                  <CardHeader>
                    <CardTitle className="font-headline text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-500" />
                      18-Profession Universal MOVERS Wrapper
                    </CardTitle>
                    <CardDescription>Select your energy synchronization template for {profile || "your routine"}.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
                    <Button 
                      variant={reformerPreference === 'morning_primer' ? 'default' : 'outline'}
                      onClick={() => handleTemplateChange('morning_primer')}
                      className={cn(
                        "w-full max-w-full min-w-0 flex flex-col items-start gap-1.5 h-auto p-4 text-left whitespace-normal break-words transition-all",
                        reformerPreference === 'morning_primer'
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
                          : "hover:border-emerald-500/50"
                      )}
                    >
                      <span className="font-bold flex items-center gap-1.5">🌅 The Morning Primer</span>
                      <span className="text-xs opacity-85 whitespace-normal break-words leading-relaxed w-full">
                        (M+O+V+E) before core work; (R+S) at day's end with 8 hydration reminders & visual breaks.
                      </span>
                    </Button>
                    <Button 
                      variant={reformerPreference === 'evening_restorer' ? 'default' : 'outline'}
                      onClick={() => handleTemplateChange('evening_restorer')}
                      className={cn(
                        "w-full max-w-full min-w-0 flex flex-col items-start gap-1.5 h-auto p-4 text-left whitespace-normal break-words transition-all",
                        reformerPreference === 'evening_restorer'
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                          : "hover:border-indigo-500/50"
                      )}
                    >
                      <span className="font-bold flex items-center gap-1.5">🌙 The Evening Restorer</span>
                      <span className="text-xs opacity-85 whitespace-normal break-words leading-relaxed w-full">
                        (E) at wake-up; (M+O+V+R+S) in a consolidated recovery block before sleep with 8 hydration reminders & visual breaks.
                      </span>
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Routine Tasks Accordion Section */}
            <div ref={routineRef} className="pt-2 scroll-mt-24 min-w-0">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold font-headline">
                    {activeCustomProfile ? 'Schedule Blocks' : `${profile || 'Profession'} Routine`}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {activeCustomProfile
                      ? '4 contiguous non-overlapping quadrants engineered for peak focus and recovery.'
                      : 'Preset habit sprints configured for your current focus mode.'}
                  </p>
                </div>

                {!activeCustomProfile && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-xl">
                          <RotateCw className="w-4 h-4 mr-2" />
                          Reset Routine
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure you want to reset?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will delete custom preset tasks for '{profile}' and restore the default template.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleResetRoutine} className="rounded-xl">
                            Reset
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleGenerateAIRoutine} 
                      disabled={isGeneratingAI}
                      className="bg-blue-600/10 hover:bg-blue-600/20 border-blue-500/30 text-blue-400 gap-2 rounded-xl transition-all"
                    >
                      {isGeneratingAI ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <Wand2 className="w-4 h-4 text-blue-400" />}
                      {isGeneratingAI ? "Designing..." : "Auto-Plan"}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTunerProfileToEdit(null);
                        setIsTunerModalOpen(true);
                      }}
                      className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 rounded-xl gap-1.5"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      Tune Schedule
                    </Button>
                  </div>
                )}
              </div>

              {tasksLoading ? renderSkeleton() : (
                <Accordion 
                  type="multiple" 
                  value={openCategories} 
                  onValueChange={setOpenCategories} 
                  className="w-full space-y-4"
                >
                  {Object.entries(presetTasks).map(([category, { color, tasks }]) => {
                    const timeRange = categoryTimeRanges[category];
                    return (
                      <AccordionItem value={category} key={category} className="border-none">
                        <Card className="overflow-hidden border-border/60">
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
                                <AlertDialog key={task.id || `${task.name}-${index}`}>
                                  <ContextMenu>
                                    <ContextMenuTrigger disabled={isDefaultTask(task)}>
                                      <Button
                                        variant="outline"
                                        className="w-full justify-between gap-3 h-auto py-2 px-3 whitespace-normal rounded-xl border-border/70 hover:border-emerald-500/40"
                                        onClick={() => handleOpenDialog(task, category)}
                                      >
                                        <div className="flex items-center gap-3">
                                          <Icon name={task.icon} className="h-5 w-5 text-muted-foreground shrink-0" />
                                          <div className="text-left">
                                            <p className="font-medium text-sm">{task.name}</p>
                                            <p className="text-xs text-muted-foreground">{task.duration} min</p>
                                          </div>
                                        </div>
                                      </Button>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                      <AlertDialogTrigger asChild>
                                        <ContextMenuItem className="text-destructive focus:text-destructive">
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete Task
                                        </ContextMenuItem>
                                      </AlertDialogTrigger>
                                    </ContextMenuContent>
                                  </ContextMenu>
                                  <AlertDialogContent className="rounded-2xl">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will remove "{task.name}" from this routine category.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteTask(task.id!)} className="bg-destructive hover:bg-destructive/90 rounded-xl">
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ))}
                            </div>
                            <CardFooter className="p-0 pt-4">
                              <Button
                                variant="ghost"
                                className="w-full border-dashed border-2 rounded-xl"
                                onClick={() => handleOpenDialog(undefined, category)}
                              >
                                <Plus className="w-4 h-4 mr-2" /> Add Task
                              </Button>
                            </CardFooter>
                          </AccordionContent>
                        </Card>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </div>

            {/* Community Shared Routines Marketplace Section */}
            <SharedRoutinesSection
              currentRoutineVector={activeCustomProfile?.routineVector}
              onApplyRoutine={async (dm) => {
                const profile = await importDMProfile(dm);
                setTimeout(() => {
                  routineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 300);
                return profile;
              }}
            />

            <div className="mt-8 flex justify-end">
              <Button size="lg" onClick={() => router.push('/')} className="rounded-xl font-bold px-8">
                Done
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Task Dialog */}
      <AddTaskDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSaveTask={handleSaveTask}
        onDeleteTask={(id) => handleDeleteTask(id)}
        initialTask={taskToEdit}
        categories={categoriesWithColors}
      />

      {/* Interactive Routine Tuner Modal */}
      <RoutineTunerModal
        isOpen={isTunerModalOpen}
        onClose={() => {
          setIsTunerModalOpen(false);
          setTunerProfileToEdit(null);
        }}
        onSaveProfile={async (newProfile) => {
          await saveCustomProfile(newProfile);
          toast({
            title: 'Tuned Routine Activated! ✨',
            description: `"${newProfile.name}" is now your active schedule.`,
          });
          setTimeout(() => {
            routineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300);
        }}
        defaultUserName={user?.displayName || profileData?.displayName || 'My'}
        currentProfession={profile || 'General'}
        initialAnswers={tunerProfileToEdit?.tuningAnswers}
        existingProfileId={tunerProfileToEdit?.id}
      />

      {/* Rename Profile Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Rename Routine Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={renameInputValue}
              onChange={(e) => setRenameInputValue(e.target.value)}
              placeholder="e.g. Shyam's Focus Routine"
              className="text-base h-11"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleConfirmRename} className="rounded-xl font-bold">
              Save Name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function RoutinePage() {
  return (
    <AuthWrapper>
      <RoutinePageComponent />
    </AuthWrapper>
  );
}
