"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import {
  SharedCommunityRoutine,
  DMRoutineFileFormat,
  CustomRoutineProfile,
} from '@/types/routineTuner';
import { cosineSimilarity } from '@/lib/clientEmbedder';
import { exportRoutineToDMFile, sendCoOpInviteForRoutine } from '@/lib/dmFileHandler';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  CheckCircle2,
  Users,
  Sparkles,
  Clock,
  BookOpen,
  Sun,
  Flame,
  Search,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface SharedRoutinesSectionProps {
  currentRoutineVector?: number[];
  onApplyRoutine: (dmContainer: DMRoutineFileFormat) => Promise<CustomRoutineProfile>;
  className?: string;
}

export function SharedRoutinesSection({
  currentRoutineVector,
  onApplyRoutine,
  className,
}: SharedRoutinesSectionProps) {
  const { user } = useAuth();
  const { profileData } = useProfile();
  const [routines, setRoutines] = useState<SharedCommunityRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Fallback vector from profile if currentRoutineVector is empty
  const userVector = useMemo(() => {
    if (currentRoutineVector && currentRoutineVector.length > 0) {
      return currentRoutineVector;
    }
    if (profileData?.lifestyleVector && profileData.lifestyleVector.length > 0) {
      return profileData.lifestyleVector;
    }
    return [];
  }, [currentRoutineVector, profileData?.lifestyleVector]);

  // Subscribe to community shared routines
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'shared_routines'), limit(40));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: SharedCommunityRoutine[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.dmPayload) {
            loaded.push({
              id: docSnap.id,
              author: data.author || { uid: '', displayName: 'Anonymous Reformer', profession: 'General' },
              profileName: data.profileName || 'Shared Routine',
              wakeTime: data.wakeTime || '06:30',
              sleepTime: data.sleepTime || '23:00',
              studyWindow: data.studyWindow || 'split_blocks',
              routineVector: data.routineVector || [],
              tasksCount: data.tasksCount || (data.dmPayload?.tasks?.length || 0),
              sustainabilityScore: data.sustainabilityScore || 90,
              optimizationSummary: data.optimizationSummary,
              sharedAt: data.sharedAt,
              dmPayload: data.dmPayload,
            });
          }
        });

        setRoutines(loaded);
        setLoading(false);
      },
      (error) => {
        console.warn('[SharedRoutines] Failed to fetch shared routines:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Compute similarity & rank routines
  const rankedRoutines = useMemo(() => {
    const list = routines.map((r) => {
      let sim = 0.5; // Baseline similarity
      if (
        userVector.length > 0 &&
        r.routineVector &&
        r.routineVector.length === userVector.length
      ) {
        const rawSim = cosineSimilarity(userVector, r.routineVector);
        sim = Math.max(0, Math.min(1, rawSim));
      }
      return {
        ...r,
        similarityScore: Number(sim.toFixed(3)),
      };
    });

    // Filter by search query if any
    const filtered = searchQuery.trim()
      ? list.filter(
          (r) =>
            r.profileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.author.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.author.profession.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : list;

    // Sort by cosine similarity descending
    return filtered.sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));
  }, [routines, userVector, searchQuery]);

  // Action 1: Apply Routine
  const handleApply = async (routine: SharedCommunityRoutine) => {
    setActionInProgress(`apply_${routine.id}`);
    try {
      await onApplyRoutine(routine.dmPayload);
      toast({
        title: 'Routine Applied!',
        description: `"${routine.profileName}" by ${routine.author.displayName} has been added to your profile switcher.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Apply Failed',
        description: err?.message || 'Could not apply routine.',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Action 2: Download .dm File
  const handleDownload = async (routine: SharedCommunityRoutine) => {
    setActionInProgress(`download_${routine.id}`);
    try {
      const profileToExport: CustomRoutineProfile = {
        id: routine.id,
        name: routine.profileName,
        updatedAt: new Date().toISOString(),
        tuningAnswers: routine.dmPayload.tuningParameters,
        tasks: routine.dmPayload.tasks,
        routineVector: routine.routineVector,
        sustainabilityScore: routine.sustainabilityScore,
        optimizationSummary: routine.optimizationSummary,
      };

      await exportRoutineToDMFile(profileToExport, routine.author);
      toast({
        title: 'File Downloaded',
        description: `Saved "${routine.profileName}.dm" to your device.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: err?.message || 'Could not export .dm file.',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Action 3: Sync & Co-Op with Creator (Strictly status: 'IDLE')
  const handleCoOpInvite = async (routine: SharedCommunityRoutine) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Sign In Required',
        description: 'You must be signed in to initiate a Co-Op focus partnership.',
      });
      return;
    }

    if (routine.author.uid === user.uid) {
      toast({
        variant: 'destructive',
        title: 'Action Not Permitted',
        description: 'You cannot initiate a Co-Op session with yourself.',
      });
      return;
    }

    setActionInProgress(`coop_${routine.id}`);
    try {
      const { sessionId } = await sendCoOpInviteForRoutine(
        routine.author.uid,
        routine.author.displayName,
        routine.profileName,
        { uid: user.uid, displayName: user.displayName || 'Reformer' }
      );

      toast({
        title: 'Co-Op Invite Sent! 🤝',
        description: `Invited ${routine.author.displayName} to sync schedule "${routine.profileName}". Session initialized in IDLE mode until you start focus.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Co-Op Invite Failed',
        description: err?.message || 'Could not send Co-Op invitation.',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <Card className={cn('overflow-hidden border-border/70 bg-card/60 backdrop-blur-xl', className)}>
      <CardHeader className="p-6 border-b border-border/50 bg-gradient-to-r from-purple-500/10 via-emerald-500/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="font-headline text-lg sm:text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Shared Routines Marketplace (.dm)
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Discover portable community routines ranked dynamically by cosine match against your focus schedule.
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search routines or creators..."
              className="text-xs pl-9 h-9 bg-background/60 rounded-xl border-border/80"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            <p className="text-xs">Scanning Reformers routine matrix...</p>
          </div>
        ) : rankedRoutines.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="p-3 w-12 h-12 mx-auto rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold">No shared routines match your criteria</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Be the first to share your tuned schedule by clicking "Share with Reformers" on any custom routine!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rankedRoutines.map((routine) => {
              const matchPercent = Math.round((routine.similarityScore || 0.7) * 100);
              const isMine = user?.uid === routine.author.uid;

              return (
                <div
                  key={routine.id}
                  className="p-5 rounded-2xl border border-border/70 bg-background/50 hover:border-purple-500/40 transition-all flex flex-col justify-between gap-4 group hover:shadow-lg hover:shadow-purple-500/5"
                >
                  <div className="space-y-3">
                    {/* Header: Title & Similarity Pill */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-foreground group-hover:text-purple-300 transition-colors">
                          {routine.profileName}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          by <span className="font-medium text-foreground/80">{routine.author.displayName}</span>{' '}
                          • <span className="text-purple-400">{routine.author.profession || 'Reformer'}</span>
                        </p>
                      </div>

                      <span
                        className={cn(
                          'text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border whitespace-nowrap shrink-0',
                          matchPercent >= 85
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : matchPercent >= 70
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : 'bg-muted text-muted-foreground border-border/50'
                        )}
                      >
                        {matchPercent}% Match
                      </span>
                    </div>

                    {/* Metadata Chips */}
                    <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-md border border-border/40">
                        <Sun className="w-3 h-3 text-amber-400" /> Wake {routine.wakeTime}
                      </span>
                      <span className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-md border border-border/40">
                        <Clock className="w-3 h-3 text-indigo-400" /> Sleep {routine.sleepTime}
                      </span>
                      <span className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-md border border-border/40">
                        <Flame className="w-3 h-3 text-emerald-400" /> {routine.tasksCount} Tasks
                      </span>
                    </div>

                    {routine.optimizationSummary && (
                      <p className="text-[11px] text-muted-foreground/90 line-clamp-2 leading-relaxed">
                        {routine.optimizationSummary}
                      </p>
                    )}
                  </div>

                  {/* 3 Action Buttons */}
                  <div className="pt-2 border-t border-border/40 grid grid-cols-3 gap-2">
                    {/* 1. Apply Routine */}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionInProgress !== null}
                      onClick={() => handleApply(routine)}
                      className="text-xs h-9 px-2 hover:border-emerald-500 hover:text-emerald-400 gap-1.5 rounded-xl"
                      title="Apply to your profile switcher"
                    >
                      {actionInProgress === `apply_${routine.id}` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span className="truncate">Apply</span>
                    </Button>

                    {/* 2. Download .dm */}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionInProgress !== null}
                      onClick={() => handleDownload(routine)}
                      className="text-xs h-9 px-2 hover:border-blue-500 hover:text-blue-400 gap-1.5 rounded-xl"
                      title="Download .dm container to device"
                    >
                      {actionInProgress === `download_${routine.id}` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-blue-400" />
                      )}
                      <span className="truncate">Save .dm</span>
                    </Button>

                    {/* 3. Sync & Co-Op */}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionInProgress !== null || isMine}
                      onClick={() => handleCoOpInvite(routine)}
                      className={cn(
                        'text-xs h-9 px-2 gap-1.5 rounded-xl',
                        isMine
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:border-purple-500 hover:text-purple-400'
                      )}
                      title={
                        isMine
                          ? 'This is your own routine'
                          : 'Send non-intrusive IDLE Co-Op invite to creator'
                      }
                    >
                      {actionInProgress === `coop_${routine.id}` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                      )}
                      <span className="truncate">{isMine ? 'Yours' : 'Co-Op'}</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
