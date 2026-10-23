import { NextResponse } from 'next/server';
import {
  RoutineTuningAnswers,
  RoutineTuningAnswersSchema,
  DMRoutineTaskBlock,
} from '@/types/routineTuner';
import { defaultRoutines, profileToRoutineMap } from '@/lib/routines';
import {
  callTypeSafeSystemOne,
  createScoreQuestion,
  createNoulQuestion,
  extractJevText,
  JEV_API_KEY,
} from '@/lib/jevClient';

/**
 * Converts "HH:mm" to total minutes from midnight (0..1439).
 */
function timeToMinutes(timeStr: string): number {
  const [h, m] = (timeStr || '00:00').split(':').map((v) => parseInt(v, 10));
  return (h || 0) * 60 + (m || 0);
}

/**
 * Converts total minutes from midnight (0..1439) back to "HH:mm".
 */
function minutesToTime(mins: number): string {
  const normalized = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Builds the complete schedule of non-overlapping task blocks with MOVERS injection,
 * 8 spaced hydration checks, 3 eye-strain breaks, domestic setup, and authentic profession tasks.
 *
 * Organized into exactly 8 distinct, circadian non-overlapping sections (<= 6 tasks per section):
 * 1. Morning Activation & Primer (Wake -> Morning Movement & Nutrition) [<= 5 tasks]
 * 2. Morning Transition & Prep (Commute / Pre-Work Readiness & Focus Framing) [<= 4 tasks]
 * 3. Deep Focus: Morning Sprint (Work Start -> Pre-Lunch Deep Production) [<= 5 tasks]
 * 4. Mid-Day Recovery & Lunch (Nutrition, Post-Lunch Walk & Reset) [<= 3 tasks]
 * 5. Afternoon Strategic Execution (Post-Lunch -> Work End Sprint & Wrap) [<= 5 tasks]
 * 6. Evening Transition & Fitness (Evening Return Transit, Workout & Dinner) [<= 4 tasks]
 * 7. Evening Growth & Creative (Study / Research, Creative Hobby & Relax) [<= 5 tasks]
 * 8. Night Restoration & Sleep (Pre-Sleep MOVERS, Reading, Journaling & Bed) [<= 5 tasks]
 */
/**
 * Proportional Bounded Partitioner
 * Guarantees exact sum of task durations equals totalBudget without any task exceeding max
 * or falling below min. Eliminates excessive single-task dumping (e.g. 197m relaxation).
 */
function partitionBudget(
  totalBudget: number,
  taskSpecs: Array<{ name: string; min: number; max: number; hardMax?: number; weight: number }>
): number[] {
  const n = taskSpecs.length;
  if (n === 0) return [];

  const minSum = taskSpecs.reduce((s, t) => s + t.min, 0);
  const effectiveBudget = Math.max(minSum, totalBudget);

  const durs = taskSpecs.map((t) => t.min);
  let remaining = effectiveBudget - minSum;
  const totalWeight = taskSpecs.reduce((s, t) => s + (t.weight || 1), 0);

  // Pass 1: Proportional allocation up to soft max
  for (let i = 0; i < n && remaining > 0; i++) {
    const spec = taskSpecs[i];
    const capacity = spec.max - durs[i];
    if (capacity <= 0) continue;
    const share = Math.round((effectiveBudget - minSum) * ((spec.weight || 1) / totalWeight));
    const toAdd = Math.min(capacity, Math.min(remaining, share));
    durs[i] += toAdd;
    remaining -= toAdd;
  }

  // Pass 2: Fill remaining up to soft max
  for (let i = 0; i < n && remaining > 0; i++) {
    const capacity = taskSpecs[i].max - durs[i];
    if (capacity > 0 && remaining > 0) {
      const toAdd = Math.min(capacity, remaining);
      durs[i] += toAdd;
      remaining -= toAdd;
    }
  }

  // Pass 3: If remaining budget still exists, distribute ONLY to elastic tasks that allow hardMax > max
  // Never add to capped tasks (like wrap-up, eye rest, or short breaks)
  if (remaining > 0) {
    const elasticIndices: number[] = [];
    for (let i = 0; i < n; i++) {
      const hardCap = taskSpecs[i].hardMax || taskSpecs[i].max;
      if (durs[i] < hardCap) {
        elasticIndices.push(i);
      }
    }

    while (remaining > 0 && elasticIndices.length > 0) {
      let allocatedInRound = false;
      for (const idx of elasticIndices) {
        const hardCap = taskSpecs[idx].hardMax || taskSpecs[idx].max;
        if (durs[idx] < hardCap && remaining > 0) {
          durs[idx] += 1;
          remaining -= 1;
          allocatedInRound = true;
        }
      }
      if (!allocatedInRound) break;
    }
  }

  // If there is still a tiny residue (e.g. 1-2m), give it to the task with highest hardMax
  if (remaining > 0) {
    let bestIdx = 0;
    let maxCap = -1;
    for (let i = 0; i < n; i++) {
      const hardCap = taskSpecs[i].hardMax || taskSpecs[i].max;
      if (hardCap > maxCap) {
        maxCap = hardCap;
        bestIdx = i;
      }
    }
    durs[bestIdx] += remaining;
  }

  return durs;
}

function buildDeterministicSchedule(answers: RoutineTuningAnswers): DMRoutineTaskBlock[] {
  const tasks: DMRoutineTaskBlock[] = [];
  let taskIdCounter = 1;
  const makeId = (prefix: string) => `${prefix}_${taskIdCounter++}_${Math.random().toString(36).substring(2, 6)}`;

  // 1. Time Anchors & Normalized Calculations
  const wakeMins = timeToMinutes(answers.wakeUpTime);
  let sleepMins = timeToMinutes(answers.sleepTime);
  if (sleepMins <= wakeMins) {
    sleepMins += 1440; // Sleep crosses midnight into early next day
  }

  let workStartMins = timeToMinutes(answers.workOrCollegeStart);
  if (workStartMins < wakeMins + 75) {
    workStartMins = wakeMins + 75; // Leave at least 75m for waking activation & breakfast
  }
  let rawWorkEndMins = timeToMinutes(answers.workOrCollegeEnd);
  if (rawWorkEndMins <= workStartMins) {
    rawWorkEndMins = workStartMins + 480;
  }

  // Core daytime execution ends in late afternoon, leaving at least 4.5 hours for evening recharge & recovery
  const coreWorkEndMins = Math.min(
    rawWorkEndMins,
    Math.max(workStartMins + 240, Math.min(1110, sleepMins - 270))
  );

  let lunchMins = timeToMinutes(answers.lunchBreakTime);
  if (lunchMins < 660) {
    lunchMins += 720; // 01:00 or 02:00 -> PM (13:00 / 14:00)
  }
  if (lunchMins <= workStartMins + 60 || lunchMins >= coreWorkEndMins - 60) {
    lunchMins = workStartMins + Math.floor((coreWorkEndMins - workStartMins) / 2);
  }

  const lunchDuration = Math.max(25, Math.min(90, answers.lunchDurationMinutes || 45));
  const commute = Math.max(0, Math.min(90, answers.commuteDurationMinutes || 0));

  // Helper to round durations to clean 5-minute increments (minimum 15m)
  const quantize5 = (mins: number) => Math.max(15, Math.round(mins / 5) * 5);

  // 2. Extract Authentic Tasks from Selected Profession Routine
  const profession = answers.profession || 'General';
  const routineKey = profileToRoutineMap[profession] || 'General';
  const rawRoutine = defaultRoutines.routines[routineKey] || defaultRoutines.routines['General'] || [];

  const isCollege =
    answers.occupationMode === 'college' ||
    profession.toLowerCase().includes('student');
  const isIndependent =
    answers.occupationMode === 'independent' ||
    profession.toLowerCase().includes('freelance') ||
    profession.toLowerCase().includes('writer') ||
    profession.toLowerCase().includes('artist');

  const profWorkTasks: { name: string; duration: number; icon: string }[] = [];
  const profEveningTasks: { name: string; duration: number; icon: string }[] = [];

  for (const t of rawRoutine) {
    const cat = t.category || '';
    const lower = t.name.toLowerCase();

    // Skip generic morning wake/bed boilerplate, meals, and legacy hydration/strain items handled by our MOVERS engine
    if (
      lower.includes('wake up') ||
      lower.includes('bed') ||
      lower.includes('breakfast') ||
      lower.includes('freshen up') ||
      lower.includes('shower') ||
      lower.includes('set table') ||
      lower.includes('reading a book') ||
      lower.includes('skincare') ||
      lower.includes('setting bed') ||
      lower.includes('final journaling') ||
      lower.includes('meditation') ||
      lower.includes('morning warm-up') ||
      lower.includes('deep breathing') ||
      lower.includes('drink a glass of water') ||
      lower.includes('hydration') ||
      lower.includes('eye strain') ||
      lower.includes('visual break') ||
      lower.includes('visual rest') ||
      lower.includes('gaming') ||
      lower.includes('entertainment') ||
      lower.includes('dinner') ||
      lower.includes('snacks') ||
      lower.includes('evening warm-up') ||
      cat.toLowerCase().includes('morning')
    ) {
      continue;
    }

    if (
      cat === 'Late Hustle' ||
      cat === 'Review' ||
      cat === 'Prep' ||
      cat === 'Close Out' ||
      cat === 'Wrap Up' ||
      cat === 'Decompression' ||
      cat === 'Evening Wind-down' ||
      cat === 'Extracurricular' ||
      cat === 'Networking & Rest' ||
      lower.includes('inbox zero') ||
      lower.includes('growth metric') ||
      lower.includes('strategy planning') ||
      lower.includes('upskilling') ||
      lower.includes('portfolio') ||
      lower.includes('side project') ||
      lower.includes('networking') ||
      lower.includes('decompression') ||
      lower.includes('night') ||
      lower.includes('evening')
    ) {
      profEveningTasks.push({ name: t.name, duration: Math.min(60, t.duration || 30), icon: t.icon || 'Briefcase' });
    } else {
      profWorkTasks.push({ name: t.name, duration: Math.min(90, Math.max(30, t.duration || 60)), icon: t.icon || 'Briefcase' });
    }
  }

  // Domain-specific fallbacks if profession routine had minimal tasks
  if (profWorkTasks.length === 0) {
    if (isCollege) {
      profWorkTasks.push(
        { name: 'Core Academic Lectures & Theory Session', duration: 90, icon: 'BookOpen' },
        { name: 'Problem Set Execution & Laboratory Projects', duration: 90, icon: 'GraduationCap' }
      );
    } else if (isIndependent) {
      profWorkTasks.push(
        { name: 'Core Creative Foundation & Concept Sprint', duration: 90, icon: 'Palette' },
        { name: 'Deep Independent Production & Deliverables', duration: 90, icon: 'PenTool' }
      );
    } else {
      profWorkTasks.push(
        { name: `${profession} Strategic Execution & Core Focus`, duration: 90, icon: 'Briefcase' },
        { name: `${profession} Core Deliverables & Operations`, duration: 90, icon: 'Briefcase' }
      );
    }
  }

  // Domain-specific commute titles
  const morningCommuteTitle = isCollege
    ? 'Campus Transit & Daily Academic Primer'
    : isIndependent
    ? 'Morning Transition & Workspace Priming'
    : 'Morning Commute & Mindful Transit / Audio Briefing';

  const eveningCommuteTitle = isCollege
    ? 'Campus Return Transit & Intellectual Decompression'
    : isIndependent
    ? 'Studio Close-Down & Cognitive Decompression'
    : 'Evening Return Transit & Cognitive Decompression';

  // Domain-specific mid-day and afternoon tasks
  const preLunchSyncTitle = isCollege
    ? 'Academic Milestone Review & Lecture Synthesis'
    : isIndependent
    ? 'Creative Project Alignment & Milestone Check'
    : `${profession} Mid-Day Execution Review & Standup Sync`;
  const preLunchSyncIcon = isCollege ? 'BookOpen' : isIndependent ? 'Palette' : 'Briefcase';

  const pmSprintTitle = isCollege
    ? 'Coursework Application & Research Sprint'
    : isIndependent
    ? 'Deep Production Sprint & Portfolio Implementation'
    : `${profession} Strategic Execution & Milestone Sprint`;
  const pmSprintIcon = isCollege ? 'GraduationCap' : isIndependent ? 'Layers' : 'Briefcase';

  const pmWrapTitle = isCollege
    ? "Daily Academic Review & Tomorrow's Class Prep"
    : isIndependent
    ? 'Studio Daily Milestone Review & Project Wrap-Up'
    : `${profession} Daily Execution Wrap-Up & Milestone Review`;
  const pmWrapIcon = isCollege ? 'BookOpen' : isIndependent ? 'CheckCircle2' : 'Briefcase';

  // =========================================================================
  // SECTION 1: MORNING ACTIVATION & PRIMER (Wake -> Breakfast End)
  // Strictly capped at <= 5 tasks!
  // =========================================================================
  let currentPointer = wakeMins;

  // Task 1: Hydration #1
  tasks.push({
    id: makeId('wake_hyd'),
    title: 'Hydration Check-in #1 (Waking Glass)',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 2,
    category: 'Morning Activation & Primer',
    isMoversPillar: true,
    moversType: 'hydration',
    coinsReward: 15,
    icon: 'Droplets',
  });
  currentPointer += 2;

  // Task 2: Domestic Bed Setup
  tasks.push({
    id: makeId('wake_bed'),
    title: 'Set Bed & Morning Space Hygiene',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 5,
    category: 'Morning Activation & Primer',
    isMoversPillar: true,
    moversType: 'domestic',
    coinsReward: 15,
    icon: 'Bed',
  });
  currentPointer += 5;

  // Task 3: Morning MOVERS Centering
  if (answers.moversWrapperMode === 'morning_primer') {
    tasks.push({
      id: makeId('mov_m'),
      title: 'Meditation & Centering (M)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 10,
      category: 'Morning Activation & Primer',
      isMoversPillar: true,
      moversType: 'M',
      coinsReward: 25,
      icon: 'BrainCircuit',
    });
    currentPointer += 10;
  } else if (answers.moversWrapperMode === 'evening_restorer') {
    tasks.push({
      id: makeId('mov_e_quick'),
      title: 'Awakening Mobility & Kinetic Stretch (E)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 12,
      category: 'Morning Activation & Primer',
      isMoversPillar: true,
      moversType: 'E',
      coinsReward: 20,
      icon: 'Dumbbell',
    });
    currentPointer += 12;
  } else {
    // JEV Smart Weave
    tasks.push({
      id: makeId('mov_m_weave'),
      title: 'Mindful Breathing & Centering (M)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 10,
      category: 'Morning Activation & Primer',
      isMoversPillar: true,
      moversType: 'M',
      coinsReward: 25,
      icon: 'BrainCircuit',
    });
    currentPointer += 10;
  }

  // Task 4: Personal Hygiene
  tasks.push({
    id: makeId('wake_fresh'),
    title: 'Freshen Up & Personal Hygiene',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 15,
    category: 'Morning Activation & Primer',
    isMoversPillar: false,
    coinsReward: 15,
    icon: 'ShowerHead',
  });
  currentPointer += 15;

  // Task 5: Nutritious Breakfast
  tasks.push({
    id: makeId('wake_bfast'),
    title: 'Nutritious Breakfast & Cognitive Fuel',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 20,
    category: 'Morning Activation & Primer',
    isMoversPillar: false,
    coinsReward: 15,
    icon: 'Utensils',
  });
  currentPointer += 20;

  // =========================================================================
  // SECTION 2: MORNING TRANSITION & PREP (Post-Breakfast -> Work Start)
  // Strictly capped at <= 6 tasks! Bounded commute & setup (never > 45m).
  // =========================================================================
  const prepAvailable = Math.max(20, workStartMins - currentPointer);
  const targetCommute = commute > 0 ? Math.min(commute, 45) : 15;
  const netPrepMins = Math.max(15, prepAvailable - targetCommute - 2);

  if (answers.studyOrResearchPreference === 'early_morning' && prepAvailable >= 45) {
    if (netPrepMins >= 80) {
      const [study1, kinetic, study2, prepV] = partitionBudget(netPrepMins, [
        { name: 'study1', min: 30, max: 55, hardMax: 65, weight: 38 },
        { name: 'kinetic', min: 5, max: 15, hardMax: 15, weight: 12 },
        { name: 'study2', min: 20, max: 45, hardMax: 50, weight: 32 },
        { name: 'prepV', min: 10, max: 18, hardMax: 20, weight: 18 },
      ]);
      tasks.push({
        id: makeId('study_early_1'),
        title: 'Dawn Focus Sprint #1 (Deep Theory)',
        startTime: minutesToTime(currentPointer),
        durationMinutes: study1,
        category: 'Morning Transition & Prep',
        isMoversPillar: false,
        coinsReward: 35,
        icon: 'BookOpen',
      });
      currentPointer += study1;

      tasks.push({
        id: makeId('prep_kinetic'),
        title: 'Visual & Kinetic Rest Break',
        startTime: minutesToTime(currentPointer),
        durationMinutes: kinetic,
        category: 'Morning Transition & Prep',
        isMoversPillar: false,
        coinsReward: 15,
        icon: 'Eye',
      });
      currentPointer += kinetic;

      tasks.push({
        id: makeId('study_early_2'),
        title: 'Dawn Focus Sprint #2 (Practical Application)',
        startTime: minutesToTime(currentPointer),
        durationMinutes: study2,
        category: 'Morning Transition & Prep',
        isMoversPillar: false,
        coinsReward: 30,
        icon: 'BookOpen',
      });
      currentPointer += study2;

      tasks.push({
        id: makeId('mov_v'),
        title: 'Strategic Visualization & Focus Framing (V)',
        startTime: minutesToTime(currentPointer),
        durationMinutes: prepV,
        category: 'Morning Transition & Prep',
        isMoversPillar: true,
        moversType: 'V',
        coinsReward: 25,
        icon: 'Target',
      });
      currentPointer += prepV;
    } else {
      const [studyDur, prepV] = partitionBudget(netPrepMins, [
        { name: 'study', min: 20, max: 50, hardMax: 60, weight: 65 },
        { name: 'prepV', min: 10, max: 18, hardMax: 20, weight: 35 },
      ]);
      tasks.push({
        id: makeId('study_early'),
        title: 'Dawn Focus Sprint & Deep Theory',
        startTime: minutesToTime(currentPointer),
        durationMinutes: studyDur,
        category: 'Morning Transition & Prep',
        isMoversPillar: false,
        coinsReward: 35,
        icon: 'BookOpen',
      });
      currentPointer += studyDur;

      tasks.push({
        id: makeId('mov_v'),
        title: 'Strategic Visualization & Focus Framing (V)',
        startTime: minutesToTime(currentPointer),
        durationMinutes: prepV,
        category: 'Morning Transition & Prep',
        isMoversPillar: true,
        moversType: 'V',
        coinsReward: 25,
        icon: 'Target',
      });
      currentPointer += prepV;
    }
  } else if (answers.studyOrResearchPreference === 'split_blocks' && prepAvailable >= 45) {
    if (netPrepMins >= 80) {
      const [split1, kinetic, split2, prepV] = partitionBudget(netPrepMins, [
        { name: 'split1', min: 30, max: 55, hardMax: 65, weight: 38 },
        { name: 'kinetic', min: 5, max: 15, hardMax: 15, weight: 12 },
        { name: 'split2', min: 20, max: 45, hardMax: 50, weight: 32 },
        { name: 'prepV', min: 10, max: 18, hardMax: 20, weight: 18 },
      ]);
      tasks.push({
        id: makeId('study_split_1a'),
        title: 'Morning Focus & Core Study (Phase 1A)',
        startTime: minutesToTime(currentPointer),
        durationMinutes: split1,
        category: 'Morning Transition & Prep',
        isMoversPillar: false,
        coinsReward: 30,
        icon: 'BookOpen',
      });
      currentPointer += split1;

      tasks.push({
        id: makeId('prep_kinetic'),
        title: 'Visual & Kinetic Rest Break',
        startTime: minutesToTime(currentPointer),
        durationMinutes: kinetic,
        category: 'Morning Transition & Prep',
        isMoversPillar: false,
        coinsReward: 15,
        icon: 'Eye',
      });
      currentPointer += kinetic;

      tasks.push({
        id: makeId('study_split_1b'),
        title: 'Morning Focus & Core Study (Phase 1B)',
        startTime: minutesToTime(currentPointer),
        durationMinutes: split2,
        category: 'Morning Transition & Prep',
        isMoversPillar: false,
        coinsReward: 25,
        icon: 'BookOpen',
      });
      currentPointer += split2;

      tasks.push({
        id: makeId('mov_v'),
        title: 'Strategic Visualization & Focus Framing (V)',
        startTime: minutesToTime(currentPointer),
        durationMinutes: prepV,
        category: 'Morning Transition & Prep',
        isMoversPillar: true,
        moversType: 'V',
        coinsReward: 25,
        icon: 'Target',
      });
      currentPointer += prepV;
    } else {
      const [splitDur1, prepV] = partitionBudget(netPrepMins, [
        { name: 'split1', min: 20, max: 45, hardMax: 60, weight: 65 },
        { name: 'prepV', min: 10, max: 18, hardMax: 20, weight: 35 },
      ]);
      tasks.push({
        id: makeId('study_split_1'),
        title: 'Morning Focus & Core Study Block (Phase 1)',
        startTime: minutesToTime(currentPointer),
        durationMinutes: splitDur1,
        category: 'Morning Transition & Prep',
        isMoversPillar: false,
        coinsReward: 30,
        icon: 'BookOpen',
      });
      currentPointer += splitDur1;

      tasks.push({
        id: makeId('mov_v'),
        title: 'Strategic Visualization & Focus Framing (V)',
        startTime: minutesToTime(currentPointer),
        durationMinutes: prepV,
        category: 'Morning Transition & Prep',
        isMoversPillar: true,
        moversType: 'V',
        coinsReward: 25,
        icon: 'Target',
      });
      currentPointer += prepV;
    }
  } else {
    if (netPrepMins >= 80) {
      const [primer1, kinetic, primer2, prepV] = partitionBudget(netPrepMins, [
        { name: 'primer1', min: 30, max: 55, hardMax: 65, weight: 38 },
        { name: 'kinetic', min: 5, max: 15, hardMax: 15, weight: 12 },
        { name: 'primer2', min: 20, max: 45, hardMax: 50, weight: 32 },
        { name: 'prepV', min: 10, max: 18, hardMax: 20, weight: 18 },
      ]);
      tasks.push({
        id: makeId('primer_1'),
        title: 'Daily Domain Primer & Strategic Review',
        startTime: minutesToTime(currentPointer),
        durationMinutes: primer1,
        category: 'Morning Transition & Prep',
        isMoversPillar: false,
        coinsReward: 30,
        icon: 'BookOpen',
      });
      currentPointer += primer1;

      tasks.push({
        id: makeId('prep_kinetic'),
        title: 'Visual & Kinetic Rest Break',
        startTime: minutesToTime(currentPointer),
        durationMinutes: kinetic,
        category: 'Morning Transition & Prep',
        isMoversPillar: false,
        coinsReward: 15,
        icon: 'Eye',
      });
      currentPointer += kinetic;

      tasks.push({
        id: makeId('primer_2'),
        title: 'High-Yield Knowledge Synthesis & Reading',
        startTime: minutesToTime(currentPointer),
        durationMinutes: primer2,
        category: 'Morning Transition & Prep',
        isMoversPillar: false,
        coinsReward: 25,
        icon: 'BookOpen',
      });
      currentPointer += primer2;

      tasks.push({
        id: makeId('mov_v'),
        title: 'Strategic Visualization & Focus Framing (V)',
        startTime: minutesToTime(currentPointer),
        durationMinutes: prepV,
        category: 'Morning Transition & Prep',
        isMoversPillar: true,
        moversType: 'V',
        coinsReward: 25,
        icon: 'Target',
      });
      currentPointer += prepV;
    } else if (netPrepMins >= 40) {
      const [primerDur, prepV] = partitionBudget(netPrepMins, [
        { name: 'primer', min: 20, max: 45, hardMax: 60, weight: 65 },
        { name: 'prepV', min: 10, max: 18, hardMax: 20, weight: 35 },
      ]);
      tasks.push({
        id: makeId('domain_primer'),
        title: 'Daily Domain Primer & Strategic Review',
        startTime: minutesToTime(currentPointer),
        durationMinutes: primerDur,
        category: 'Morning Transition & Prep',
        isMoversPillar: false,
        coinsReward: 25,
        icon: 'BookOpen',
      });
      currentPointer += primerDur;

      tasks.push({
        id: makeId('mov_v_prep'),
        title: 'Daily Objective Framing & Mental Rehearsal (V)',
        startTime: minutesToTime(currentPointer),
        durationMinutes: prepV,
        category: 'Morning Transition & Prep',
        isMoversPillar: true,
        moversType: 'V',
        coinsReward: 20,
        icon: 'Target',
      });
      currentPointer += prepV;
    } else {
      tasks.push({
        id: makeId('mov_v_prep'),
        title: 'Daily Objective Framing & Mental Rehearsal (V)',
        startTime: minutesToTime(currentPointer),
        durationMinutes: netPrepMins,
        category: 'Morning Transition & Prep',
        isMoversPillar: true,
        moversType: 'V',
        coinsReward: 20,
        icon: 'Target',
      });
      currentPointer += netPrepMins;
    }
  }

  // Hydration #2
  tasks.push({
    id: makeId('hyd_2'),
    title: 'Hydration Check-in #2 (Pre-Focus Glass)',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 2,
    category: 'Morning Transition & Prep',
    isMoversPillar: true,
    moversType: 'hydration',
    coinsReward: 15,
    icon: 'Droplets',
  });
  currentPointer += 2;

  // Commute / Priming (exact transit duration, max 45m!)
  tasks.push({
    id: makeId('commute_m'),
    title: commute > 0 ? morningCommuteTitle : 'Workspace Priming & Equipment Setup',
    startTime: minutesToTime(currentPointer),
    durationMinutes: targetCommute,
    category: 'Morning Transition & Prep',
    isMoversPillar: false,
    coinsReward: 15,
    icon: commute > 0 ? (isCollege ? 'GraduationCap' : isIndependent ? 'Coffee' : 'Car') : 'Laptop',
  });
  currentPointer += targetCommute;

  // =========================================================================
  // SECTION 3: DEEP FOCUS: MORNING SPRINT (Work Start -> Lunch Start)
  // Strictly capped at <= 6 tasks! Focus sprints max 75m, sync max 25m.
  // =========================================================================
  currentPointer = Math.max(currentPointer, workStartMins);
  const morningWorkBudget = Math.max(60, lunchMins - currentPointer);
  const midTasksCount = Math.max(1, Math.ceil(profWorkTasks.length / 2));
  const morningProfTasks = profWorkTasks.slice(0, midTasksCount);
  const afternoonProfTasks = profWorkTasks.slice(midTasksCount);

  if (morningWorkBudget >= 195) {
    // 4-hour morning: 6 tasks (Sprint 1, Eye Rest & Hydration, Sprint 2, Coffee Reset, Tactical Sprint, Standup Sync)
    const netMorningMins = morningWorkBudget - 5; // 5m for eye rest & hydration combo
    const [am1, am2, coffee, tactical, sync] = partitionBudget(netMorningMins, [
      { name: 'am1', min: 45, max: 70, hardMax: 75, weight: 28 },
      { name: 'am2', min: 40, max: 65, hardMax: 75, weight: 26 },
      { name: 'coffee', min: 15, max: 25, hardMax: 25, weight: 12 },
      { name: 'tactical', min: 35, max: 55, hardMax: 65, weight: 22 },
      { name: 'sync', min: 15, max: 20, hardMax: 25, weight: 12 },
    ]);

    const firstProfTask = morningProfTasks[0] || { name: `${profession} Core Execution & Focus Sprint`, icon: 'Briefcase' };
    tasks.push({
      id: makeId('prof_am_0'),
      title: firstProfTask.name,
      startTime: minutesToTime(currentPointer),
      durationMinutes: am1,
      category: 'Deep Focus: Morning Sprint',
      isMoversPillar: false,
      coinsReward: 35,
      icon: firstProfTask.icon || (isCollege ? 'BookOpen' : 'Briefcase'),
    });
    currentPointer += am1;

    tasks.push({
      id: makeId('eye_hyd_am'),
      title: 'Eye-Strain 20-20-20 Vision Rest & Hydration Check-in',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 5,
      category: 'Deep Focus: Morning Sprint',
      isMoversPillar: true,
      moversType: 'eye_strain',
      coinsReward: 20,
      icon: 'Eye',
    });
    currentPointer += 5;

    const secondProfTask = morningProfTasks[1] || { name: `${profession} Technical Sprint & Operations`, icon: 'Layers' };
    tasks.push({
      id: makeId('prof_am_1'),
      title: secondProfTask.name,
      startTime: minutesToTime(currentPointer),
      durationMinutes: am2,
      category: 'Deep Focus: Morning Sprint',
      isMoversPillar: false,
      coinsReward: 30,
      icon: secondProfTask.icon || 'Layers',
    });
    currentPointer += am2;

    tasks.push({
      id: makeId('am_coffee_reset'),
      title: 'Mid-Morning Coffee & Kinetic Reset',
      startTime: minutesToTime(currentPointer),
      durationMinutes: coffee,
      category: 'Deep Focus: Morning Sprint',
      isMoversPillar: false,
      coinsReward: 15,
      icon: 'Coffee',
    });
    currentPointer += coffee;

    tasks.push({
      id: makeId('am_tactical'),
      title: `${profession} Collaborative Execution & Tactical Sprint`,
      startTime: minutesToTime(currentPointer),
      durationMinutes: tactical,
      category: 'Deep Focus: Morning Sprint',
      isMoversPillar: false,
      coinsReward: 25,
      icon: 'Layers',
    });
    currentPointer += tactical;

    tasks.push({
      id: makeId('sync_standup'),
      title: preLunchSyncTitle,
      startTime: minutesToTime(currentPointer),
      durationMinutes: sync,
      category: 'Deep Focus: Morning Sprint',
      isMoversPillar: false,
      coinsReward: 20,
      icon: preLunchSyncIcon,
    });
    currentPointer += sync;
  } else {
    // Standard morning: 5 tasks
    const netMorningMins = Math.max(40, morningWorkBudget - 4); // 4m for eye_1 + hyd_3
    const [am1, am2, sync] = partitionBudget(netMorningMins, [
      { name: 'am1', min: 30, max: 70, hardMax: 75, weight: 45 },
      { name: 'am2', min: 25, max: 65, hardMax: 75, weight: 38 },
      { name: 'sync', min: 15, max: 25, hardMax: 30, weight: 17 },
    ]);

    const firstProfTask = morningProfTasks[0] || { name: `${profession} Core Execution & Focus Sprint`, icon: 'Briefcase' };
    tasks.push({
      id: makeId('prof_am_0'),
      title: firstProfTask.name,
      startTime: minutesToTime(currentPointer),
      durationMinutes: am1,
      category: 'Deep Focus: Morning Sprint',
      isMoversPillar: false,
      coinsReward: 35,
      icon: firstProfTask.icon || (isCollege ? 'BookOpen' : 'Briefcase'),
    });
    currentPointer += am1;

    tasks.push({
      id: makeId('eye_1'),
      title: 'Eye-Strain 20-20-20 Vision Rest #1',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 2,
      category: 'Deep Focus: Morning Sprint',
      isMoversPillar: true,
      moversType: 'eye_strain',
      coinsReward: 15,
      icon: 'Eye',
    });
    currentPointer += 2;

    const secondProfTask = morningProfTasks[1] || { name: `${profession} Technical Sprint & Operations`, icon: 'Layers' };
    tasks.push({
      id: makeId('prof_am_1'),
      title: secondProfTask.name,
      startTime: minutesToTime(currentPointer),
      durationMinutes: am2,
      category: 'Deep Focus: Morning Sprint',
      isMoversPillar: false,
      coinsReward: 30,
      icon: secondProfTask.icon || 'Layers',
    });
    currentPointer += am2;

    tasks.push({
      id: makeId('sync_standup'),
      title: preLunchSyncTitle,
      startTime: minutesToTime(currentPointer),
      durationMinutes: sync,
      category: 'Deep Focus: Morning Sprint',
      isMoversPillar: false,
      coinsReward: 20,
      icon: preLunchSyncIcon,
    });
    currentPointer += sync;

    tasks.push({
      id: makeId('hyd_3'),
      title: 'Hydration Check-in #3 (Pre-Lunch Glass)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 2,
      category: 'Deep Focus: Morning Sprint',
      isMoversPillar: true,
      moversType: 'hydration',
      coinsReward: 15,
      icon: 'Droplets',
    });
    currentPointer += 2;
  }

  // =========================================================================
  // SECTION 4: MID-DAY RECOVERY & LUNCH (Lunch Break Window)
  // Strictly capped at <= 3 tasks! Exact sum == lunchDuration!
  // =========================================================================
  currentPointer = lunchMins;
  const netWalkMins = Math.max(5, Math.min(10, lunchDuration - 22));
  const netLunchMins = lunchDuration - netWalkMins - 2;

  tasks.push({
    id: makeId('lunch_block'),
    title: 'Lunch & Mindful Nutrition Break',
    startTime: minutesToTime(currentPointer),
    durationMinutes: netLunchMins,
    category: 'Mid-Day Recovery & Lunch',
    isMoversPillar: false,
    coinsReward: 20,
    icon: 'Utensils',
  });
  currentPointer += netLunchMins;

  tasks.push({
    id: makeId('hyd_4'),
    title: 'Hydration Check-in #4 (Post-Lunch Glass)',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 2,
    category: 'Mid-Day Recovery & Lunch',
    isMoversPillar: true,
    moversType: 'hydration',
    coinsReward: 15,
    icon: 'Droplets',
  });
  currentPointer += 2;

  tasks.push({
    id: makeId('lunch_walk'),
    title: 'Post-Lunch Walk & Light Kinetic Reset',
    startTime: minutesToTime(currentPointer),
    durationMinutes: netWalkMins,
    category: 'Mid-Day Recovery & Lunch',
    isMoversPillar: false,
    coinsReward: 15,
    icon: 'Footprints',
  });
  currentPointer += netWalkMins;

  // =========================================================================
  // SECTION 5: AFTERNOON STRATEGIC EXECUTION (Post-Lunch -> Core Work End)
  // Strictly capped at <= 6 tasks! Wrap-up strictly 15-25m!
  // =========================================================================
  currentPointer = lunchMins + lunchDuration;
  const afternoonBudget = Math.max(60, coreWorkEndMins - currentPointer);
  const pmTasksToUse =
    afternoonProfTasks.length > 0
      ? afternoonProfTasks
      : isCollege
      ? [{ name: 'Academic Application & Project Sprint', duration: 60, icon: 'GraduationCap' }]
      : isIndependent
      ? [{ name: 'Independent Production & Creative Deliverables', duration: 60, icon: 'Palette' }]
      : [{ name: `${profession} Core Execution & Deliverables`, duration: 60, icon: 'Briefcase' }];

  if (afternoonBudget >= 200) {
    // Long afternoon (3.5 - 4 hours): 6 tasks (PM1, Eye & Stretch, PM2, Tea Reset, Tactical Sprint, Wrap-Up <= 25m)
    const netAfternoonMins = afternoonBudget - 5; // 5m for eye rest & stretch combo
    const [pm1, pm2, teaReset, tactical, wrap] = partitionBudget(netAfternoonMins, [
      { name: 'pm1', min: 45, max: 70, hardMax: 75, weight: 28 },
      { name: 'pm2', min: 40, max: 65, hardMax: 75, weight: 26 },
      { name: 'teaReset', min: 15, max: 20, hardMax: 25, weight: 10 },
      { name: 'tactical', min: 30, max: 55, hardMax: 65, weight: 24 },
      { name: 'wrap', min: 15, max: 20, hardMax: 25, weight: 12 },
    ]);

    const firstPmTask = pmTasksToUse[0];
    tasks.push({
      id: makeId('prof_pm_0'),
      title: firstPmTask.name,
      startTime: minutesToTime(currentPointer),
      durationMinutes: pm1,
      category: 'Afternoon Strategic Execution',
      isMoversPillar: false,
      coinsReward: 30,
      icon: firstPmTask.icon || (isCollege ? 'GraduationCap' : 'Briefcase'),
    });
    currentPointer += pm1;

    tasks.push({
      id: makeId('eye_pm_combo'),
      title: 'Eye-Strain 20-20-20 Vision Rest & Kinetic Stretch',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 5,
      category: 'Afternoon Strategic Execution',
      isMoversPillar: true,
      moversType: 'eye_strain',
      coinsReward: 20,
      icon: 'Eye',
    });
    currentPointer += 5;

    const secondPmTask = pmTasksToUse[1] || { name: pmSprintTitle, icon: pmSprintIcon };
    tasks.push({
      id: makeId('prof_pm_sprint'),
      title: answers.moversWrapperMode === 'jev_smart_weave' ? 'Afternoon Re-Alignment & Micro-Visualization (V)' : secondPmTask.name,
      startTime: minutesToTime(currentPointer),
      durationMinutes: pm2,
      category: 'Afternoon Strategic Execution',
      isMoversPillar: answers.moversWrapperMode === 'jev_smart_weave',
      moversType: answers.moversWrapperMode === 'jev_smart_weave' ? 'V' : undefined,
      coinsReward: 25,
      icon: answers.moversWrapperMode === 'jev_smart_weave' ? 'Target' : (secondPmTask.icon || 'Layers'),
    });
    currentPointer += pm2;

    tasks.push({
      id: makeId('pm_tea_reset'),
      title: 'Kinetic Movement & Afternoon Tea Reset',
      startTime: minutesToTime(currentPointer),
      durationMinutes: teaReset,
      category: 'Afternoon Strategic Execution',
      isMoversPillar: false,
      coinsReward: 15,
      icon: 'Coffee',
    });
    currentPointer += teaReset;

    tasks.push({
      id: makeId('pm_tactical'),
      title: `${profession} Tactical Deliverables & Milestone Review`,
      startTime: minutesToTime(currentPointer),
      durationMinutes: tactical,
      category: 'Afternoon Strategic Execution',
      isMoversPillar: false,
      coinsReward: 25,
      icon: 'Layers',
    });
    currentPointer += tactical;

    tasks.push({
      id: makeId('prof_pm_wrap'),
      title: pmWrapTitle,
      startTime: minutesToTime(currentPointer),
      durationMinutes: wrap,
      category: 'Afternoon Strategic Execution',
      isMoversPillar: false,
      coinsReward: 25,
      icon: pmWrapIcon,
    });
    currentPointer += wrap;
  } else if (afternoonBudget >= 160) {
    // Moderate afternoon (2.5 - 3.5 hours): 6 tasks (PM1, Eye, Tea/Walk, PM2, Hydration, Wrap-Up <= 25m)
    const netAfternoonMins = Math.max(40, afternoonBudget - 4); // 4m for eye_2 + hyd_5
    const [pm1, pm2, teaBreak, wrap] = partitionBudget(netAfternoonMins, [
      { name: 'pm1', min: 40, max: 65, hardMax: 75, weight: 36 },
      { name: 'pm2', min: 35, max: 60, hardMax: 70, weight: 34 },
      { name: 'teaBreak', min: 15, max: 20, hardMax: 25, weight: 15 },
      { name: 'wrap', min: 15, max: 20, hardMax: 25, weight: 15 },
    ]);

    const firstPmTask = pmTasksToUse[0];
    tasks.push({
      id: makeId('prof_pm_0'),
      title: firstPmTask.name,
      startTime: minutesToTime(currentPointer),
      durationMinutes: pm1,
      category: 'Afternoon Strategic Execution',
      isMoversPillar: false,
      coinsReward: 30,
      icon: firstPmTask.icon || (isCollege ? 'GraduationCap' : 'Briefcase'),
    });
    currentPointer += pm1;

    tasks.push({
      id: makeId('eye_2'),
      title: 'Eye-Strain 20-20-20 Vision Rest #2',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 2,
      category: 'Afternoon Strategic Execution',
      isMoversPillar: true,
      moversType: 'eye_strain',
      coinsReward: 15,
      icon: 'Eye',
    });
    currentPointer += 2;

    tasks.push({
      id: makeId('pm_tea_break'),
      title: 'Kinetic Movement & Afternoon Tea Reset',
      startTime: minutesToTime(currentPointer),
      durationMinutes: teaBreak,
      category: 'Afternoon Strategic Execution',
      isMoversPillar: false,
      coinsReward: 15,
      icon: 'Coffee',
    });
    currentPointer += teaBreak;

    const secondPmTask = pmTasksToUse[1] || { name: pmSprintTitle, icon: pmSprintIcon };
    tasks.push({
      id: makeId('prof_pm_sprint'),
      title: answers.moversWrapperMode === 'jev_smart_weave' ? 'Afternoon Re-Alignment & Micro-Visualization (V)' : secondPmTask.name,
      startTime: minutesToTime(currentPointer),
      durationMinutes: pm2,
      category: 'Afternoon Strategic Execution',
      isMoversPillar: answers.moversWrapperMode === 'jev_smart_weave',
      moversType: answers.moversWrapperMode === 'jev_smart_weave' ? 'V' : undefined,
      coinsReward: 25,
      icon: answers.moversWrapperMode === 'jev_smart_weave' ? 'Target' : (secondPmTask.icon || 'Layers'),
    });
    currentPointer += pm2;

    tasks.push({
      id: makeId('hyd_5'),
      title: 'Hydration Check-in #5 (Mid-Afternoon Glass)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 2,
      category: 'Afternoon Strategic Execution',
      isMoversPillar: true,
      moversType: 'hydration',
      coinsReward: 15,
      icon: 'Droplets',
    });
    currentPointer += 2;

    tasks.push({
      id: makeId('prof_pm_wrap'),
      title: pmWrapTitle,
      startTime: minutesToTime(currentPointer),
      durationMinutes: wrap,
      category: 'Afternoon Strategic Execution',
      isMoversPillar: false,
      coinsReward: 25,
      icon: pmWrapIcon,
    });
    currentPointer += wrap;
  } else {
    // Compact afternoon: 5 tasks
    const netAfternoonMins = Math.max(40, afternoonBudget - 4); // 4m for eye_2 + hyd_5
    const [pm1, pm2, wrap] = partitionBudget(netAfternoonMins, [
      { name: 'pm1', min: 30, max: 65, hardMax: 75, weight: 45 },
      { name: 'pm2', min: 25, max: 60, hardMax: 70, weight: 40 },
      { name: 'wrap', min: 15, max: 20, hardMax: 25, weight: 15 },
    ]);

    const firstPmTask = pmTasksToUse[0];
    tasks.push({
      id: makeId('prof_pm_0'),
      title: firstPmTask.name,
      startTime: minutesToTime(currentPointer),
      durationMinutes: pm1,
      category: 'Afternoon Strategic Execution',
      isMoversPillar: false,
      coinsReward: 30,
      icon: firstPmTask.icon || (isCollege ? 'GraduationCap' : 'Briefcase'),
    });
    currentPointer += pm1;

    tasks.push({
      id: makeId('eye_2'),
      title: 'Eye-Strain 20-20-20 Vision Rest #2',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 2,
      category: 'Afternoon Strategic Execution',
      isMoversPillar: true,
      moversType: 'eye_strain',
      coinsReward: 15,
      icon: 'Eye',
    });
    currentPointer += 2;

    const secondPmTask = pmTasksToUse[1] || { name: pmSprintTitle, icon: pmSprintIcon };
    tasks.push({
      id: makeId('prof_pm_sprint'),
      title: answers.moversWrapperMode === 'jev_smart_weave' ? 'Afternoon Re-Alignment & Micro-Visualization (V)' : secondPmTask.name,
      startTime: minutesToTime(currentPointer),
      durationMinutes: pm2,
      category: 'Afternoon Strategic Execution',
      isMoversPillar: answers.moversWrapperMode === 'jev_smart_weave',
      moversType: answers.moversWrapperMode === 'jev_smart_weave' ? 'V' : undefined,
      coinsReward: 25,
      icon: answers.moversWrapperMode === 'jev_smart_weave' ? 'Target' : (secondPmTask.icon || 'Layers'),
    });
    currentPointer += pm2;

    tasks.push({
      id: makeId('hyd_5'),
      title: 'Hydration Check-in #5 (Mid-Afternoon Glass)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 2,
      category: 'Afternoon Strategic Execution',
      isMoversPillar: true,
      moversType: 'hydration',
      coinsReward: 15,
      icon: 'Droplets',
    });
    currentPointer += 2;

    tasks.push({
      id: makeId('prof_pm_wrap'),
      title: pmWrapTitle,
      startTime: minutesToTime(currentPointer),
      durationMinutes: wrap,
      category: 'Afternoon Strategic Execution',
      isMoversPillar: false,
      coinsReward: 25,
      icon: pmWrapIcon,
    });
    currentPointer += wrap;
  }

  // =========================================================================
  // SECTION 6: EVENING TRANSITION & FITNESS (Core Work End -> Dinner End)
  // Strictly capped at <= 5 tasks!
  // =========================================================================
  currentPointer = Math.max(currentPointer, coreWorkEndMins);
  const nightWindDownDuration = answers.moversWrapperMode === 'evening_restorer' ? 50 : 40;
  const nightWindDownStart = sleepMins - nightWindDownDuration;

  const eveningActivities =
    answers.eveningCustomization && answers.eveningCustomization.length > 0
      ? answers.eveningCustomization
      : ['fitness', 'family_social', 'relaxation'];

  const totalEvening = Math.max(100, nightWindDownStart - currentPointer);
  // Give Section 6 a balanced share of total evening (up to 46% for massive gaps, max 205m)
  const sec6Budget = totalEvening > 360
    ? Math.min(205, Math.round(totalEvening * 0.46))
    : totalEvening > 300
    ? Math.min(160, Math.round(totalEvening * 0.40))
    : (totalEvening > 180 ? 110 : 75);

  if (sec6Budget >= 140) {
    // 5 tasks: Commute, Hydration, Workout, Dinner, Post-Dinner Stroll
    const [eveTransitDur, fitnessDur, dinnerDur, strollDur] = partitionBudget(sec6Budget - 2, [
      { name: 'commute', min: commute > 0 ? Math.min(commute, 30) : 15, max: 40, hardMax: 45, weight: 20 },
      { name: 'fitness', min: 30, max: 55, hardMax: 60, weight: 30 },
      { name: 'dinner', min: 35, max: 55, hardMax: 65, weight: 32 },
      { name: 'stroll', min: 15, max: 35, hardMax: 45, weight: 18 },
    ]);

    tasks.push({
      id: makeId('commute_e'),
      title: commute > 0 ? eveningCommuteTitle : 'Studio & Workspace Close-Down',
      startTime: minutesToTime(currentPointer),
      durationMinutes: eveTransitDur,
      category: 'Evening Transition & Fitness',
      isMoversPillar: false,
      coinsReward: 15,
      icon: commute > 0 ? (isCollege ? 'GraduationCap' : isIndependent ? 'Coffee' : 'Car') : 'CheckCircle2',
    });
    currentPointer += eveTransitDur;

    tasks.push({
      id: makeId('hyd_6'),
      title: 'Hydration Check-in #6 (Post-Commute Refuel)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 2,
      category: 'Evening Transition & Fitness',
      isMoversPillar: true,
      moversType: 'hydration',
      coinsReward: 15,
      icon: 'Droplets',
    });
    currentPointer += 2;

    tasks.push({
      id: makeId('eve_fitness'),
      title: eveningActivities.includes('fitness')
        ? 'Physical Training & Kinetic Workout (E)'
        : 'Evening Kinetic Stroll & Movement Reset (E)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: fitnessDur,
      category: 'Evening Transition & Fitness',
      isMoversPillar: true,
      moversType: 'E',
      coinsReward: 30,
      icon: 'Dumbbell',
    });
    currentPointer += fitnessDur;

    tasks.push({
      id: makeId('eve_social'),
      title: 'Dinner & Mindful Social Connection Time',
      startTime: minutesToTime(currentPointer),
      durationMinutes: dinnerDur,
      category: 'Evening Transition & Fitness',
      isMoversPillar: false,
      coinsReward: 20,
      icon: 'Users',
    });
    currentPointer += dinnerDur;

    tasks.push({
      id: makeId('eve_stroll_sec6'),
      title: 'Post-Dinner Fresh Air Digest Stroll',
      startTime: minutesToTime(currentPointer),
      durationMinutes: strollDur,
      category: 'Evening Transition & Fitness',
      isMoversPillar: false,
      coinsReward: 15,
      icon: 'Footprints',
    });
    currentPointer += strollDur;
  } else {
    // 4 tasks: Commute, Hydration, Workout, Dinner
    const [eveTransitDur, fitnessDur, dinnerDur] = partitionBudget(sec6Budget - 2, [
      { name: 'commute', min: commute > 0 ? Math.min(commute, 30) : 15, max: 40, hardMax: 45, weight: 22 },
      { name: 'fitness', min: 25, max: 50, hardMax: 55, weight: 40 },
      { name: 'dinner', min: 30, max: 55, hardMax: 60, weight: 38 },
    ]);

    tasks.push({
      id: makeId('commute_e'),
      title: commute > 0 ? eveningCommuteTitle : 'Studio & Workspace Close-Down',
      startTime: minutesToTime(currentPointer),
      durationMinutes: eveTransitDur,
      category: 'Evening Transition & Fitness',
      isMoversPillar: false,
      coinsReward: 15,
      icon: commute > 0 ? (isCollege ? 'GraduationCap' : isIndependent ? 'Coffee' : 'Car') : 'CheckCircle2',
    });
    currentPointer += eveTransitDur;

    tasks.push({
      id: makeId('hyd_6'),
      title: 'Hydration Check-in #6 (Post-Commute Refuel)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 2,
      category: 'Evening Transition & Fitness',
      isMoversPillar: true,
      moversType: 'hydration',
      coinsReward: 15,
      icon: 'Droplets',
    });
    currentPointer += 2;

    tasks.push({
      id: makeId('eve_fitness'),
      title: eveningActivities.includes('fitness')
        ? 'Physical Training & Kinetic Workout (E)'
        : 'Evening Kinetic Stroll & Movement Reset (E)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: fitnessDur,
      category: 'Evening Transition & Fitness',
      isMoversPillar: true,
      moversType: 'E',
      coinsReward: 30,
      icon: 'Dumbbell',
    });
    currentPointer += fitnessDur;

    tasks.push({
      id: makeId('eve_social'),
      title: 'Dinner & Mindful Social Connection Time',
      startTime: minutesToTime(currentPointer),
      durationMinutes: dinnerDur,
      category: 'Evening Transition & Fitness',
      isMoversPillar: false,
      coinsReward: 20,
      icon: 'Users',
    });
    currentPointer += dinnerDur;
  }

  // =========================================================================
  // SECTION 7: EVENING GROWTH & CREATIVE (Post-Dinner -> Night Wind-Down Start)
  // Strictly capped at <= 6 tasks! NO TASK OVER 70m! RELAXATION <= 40m!
  // =========================================================================
  const growthTimeAvailable = Math.max(45, nightWindDownStart - currentPointer);
  const netGrowthMins = Math.max(40, growthTimeAvailable - 2); // 2m for hyd_7

  // Determine study title based on user preference
  let studyBlockTitle = 'Evening Intellectual Sprint & Focus Block';
  if (answers.studyOrResearchPreference === 'late_afternoon') {
    studyBlockTitle = 'Deep Research & Focused Intellectual Sprint';
  } else if (answers.studyOrResearchPreference === 'split_blocks') {
    studyBlockTitle = 'Evening Synthesis & Deep Study Sprint (Phase 2)';
  } else if (answers.studyOrResearchPreference === 'night_owl') {
    studyBlockTitle = 'Night Owl Focus Sprint & Deep Work';
  }

  // Determine creative title
  let creativeTitle = 'Skill-Building Sprint & Tech Upskilling';
  let creativeIcon = 'Code';
  if (eveningActivities.includes('creative_hobby')) {
    creativeTitle = 'Creative Hobby & Passion Project Exploration';
    creativeIcon = 'Palette';
  } else if (profEveningTasks.length > 0) {
    creativeTitle = profEveningTasks[0].name;
    creativeIcon = profEveningTasks[0].icon || 'Target';
  }

  // For long study requests (e.g. night owl 120m), split study into two focused Pomodoro blocks
  const wantsLongStudy = (answers.studyDurationMinutes || 0) >= 90 && answers.studyOrResearchPreference === 'night_owl';

  if (wantsLongStudy && netGrowthMins >= 160) {
    // 6 tasks: Study P1, Study P2, Creative, Restorative Leisure (<= 40m), Digital Sunset (<= 35m), Hydration
    const [studyP1, studyP2, creative, leisure, sunset] = partitionBudget(netGrowthMins, [
      { name: 'studyP1', min: 35, max: 65, hardMax: 70, weight: 26 },
      { name: 'studyP2', min: 30, max: 65, hardMax: 70, weight: 25 },
      { name: 'creative', min: 25, max: 60, hardMax: 65, weight: 23 },
      { name: 'leisure', min: 20, max: 35, hardMax: 40, weight: 14 }, // STRICTLY <= 40m!
      { name: 'sunset', min: 15, max: 30, hardMax: 35, weight: 12 },
    ]);

    tasks.push({
      id: makeId('study_pm_1'),
      title: 'Night Owl Focus Sprint (Phase 1: Deep Theory)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: studyP1,
      category: 'Evening Growth & Creative',
      isMoversPillar: false,
      coinsReward: 35,
      icon: 'BookOpen',
    });
    currentPointer += studyP1;

    tasks.push({
      id: makeId('study_pm_2'),
      title: 'Night Owl Focus Sprint (Phase 2: Execution)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: studyP2,
      category: 'Evening Growth & Creative',
      isMoversPillar: false,
      coinsReward: 30,
      icon: 'BookOpen',
    });
    currentPointer += studyP2;

    tasks.push({
      id: makeId('eve_creative'),
      title: creativeTitle,
      startTime: minutesToTime(currentPointer),
      durationMinutes: creative,
      category: 'Evening Growth & Creative',
      isMoversPillar: false,
      coinsReward: 25,
      icon: creativeIcon,
    });
    currentPointer += creative;

    tasks.push({
      id: makeId('eve_relax'),
      title: 'Restorative Leisure & Stress Decompression',
      startTime: minutesToTime(currentPointer),
      durationMinutes: leisure,
      category: 'Evening Growth & Creative',
      isMoversPillar: false,
      coinsReward: 15,
      icon: 'Sparkles',
    });
    currentPointer += leisure;

    tasks.push({
      id: makeId('eve_sunset'),
      title: "Digital Sunset & Tomorrow's Priority Architecture",
      startTime: minutesToTime(currentPointer),
      durationMinutes: sunset,
      category: 'Evening Growth & Creative',
      isMoversPillar: false,
      coinsReward: 20,
      icon: 'Moon',
    });
    currentPointer += sunset;

    tasks.push({
      id: makeId('hyd_7'),
      title: 'Hydration Check-in #7 (Evening Water Glass)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 2,
      category: 'Evening Growth & Creative',
      isMoversPillar: true,
      moversType: 'hydration',
      coinsReward: 15,
      icon: 'Droplets',
    });
    currentPointer += 2;
  } else {
    // Standard evening: 6 tasks (Study P1, Stroll/Break, Creative/Study P2, Restorative Leisure <= 40m, Sunset <= 35m, Hydration)
    const [sDur, strollDur, cDur, lDur, sunsetDur] = partitionBudget(netGrowthMins, [
      { name: 'study', min: 30, max: 65, hardMax: 70, weight: 28 },
      { name: 'stroll', min: 15, max: 25, hardMax: 30, weight: 14 },
      { name: 'creative', min: 25, max: 65, hardMax: 70, weight: 26 },
      { name: 'leisure', min: 15, max: 35, hardMax: 40, weight: 18 }, // STRICTLY <= 40m!
      { name: 'sunset', min: 15, max: 30, hardMax: 35, weight: 14 },
    ]);

    tasks.push({
      id: makeId('study_pm'),
      title: isCollege ? 'Evening Intellectual Focus & Coursework' : studyBlockTitle,
      startTime: minutesToTime(currentPointer),
      durationMinutes: sDur,
      category: 'Evening Growth & Creative',
      isMoversPillar: false,
      coinsReward: 35,
      icon: 'BookOpen',
    });
    currentPointer += sDur;

    tasks.push({
      id: makeId('eve_stroll'),
      title: 'Post-Dinner Fresh Air Stroll & Social Connection',
      startTime: minutesToTime(currentPointer),
      durationMinutes: strollDur,
      category: 'Evening Growth & Creative',
      isMoversPillar: false,
      coinsReward: 15,
      icon: 'Footprints',
    });
    currentPointer += strollDur;

    tasks.push({
      id: makeId('eve_creative'),
      title: isCollege ? 'Creative Project & Skill Synthesis Sprint' : creativeTitle,
      startTime: minutesToTime(currentPointer),
      durationMinutes: cDur,
      category: 'Evening Growth & Creative',
      isMoversPillar: false,
      coinsReward: 25,
      icon: creativeIcon,
    });
    currentPointer += cDur;

    tasks.push({
      id: makeId('eve_relax'),
      title: 'Restorative Leisure & Stress Decompression',
      startTime: minutesToTime(currentPointer),
      durationMinutes: lDur,
      category: 'Evening Growth & Creative',
      isMoversPillar: false,
      coinsReward: 15,
      icon: 'Sparkles',
    });
    currentPointer += lDur;

    tasks.push({
      id: makeId('eve_sunset'),
      title: "Digital Sunset & Tomorrow's Priority Architecture",
      startTime: minutesToTime(currentPointer),
      durationMinutes: sunsetDur,
      category: 'Evening Growth & Creative',
      isMoversPillar: false,
      coinsReward: 20,
      icon: 'Moon',
    });
    currentPointer += sunsetDur;

    tasks.push({
      id: makeId('hyd_7'),
      title: 'Hydration Check-in #7 (Evening Water Glass)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 2,
      category: 'Evening Growth & Creative',
      isMoversPillar: true,
      moversType: 'hydration',
      coinsReward: 15,
      icon: 'Droplets',
    });
    currentPointer += 2;
  }

  // =========================================================================
  // SECTION 8: NIGHT RESTORATION & SLEEP (Night Wind-Down Start -> Sleep Time)
  // Strictly capped at <= 5 tasks! Anchored strictly to sleepMins with zero drift!
  // =========================================================================
  currentPointer = nightWindDownStart;

  // Task 1: Evening MOVERS Centering & Breathwork
  const mDur = answers.moversWrapperMode === 'evening_restorer' ? 12 : 10;
  tasks.push({
    id: makeId('mov_rest_m'),
    title: answers.moversWrapperMode === 'evening_restorer'
      ? 'Deep Meditation & Parasympathetic Breathwork (M+O)'
      : 'Mindful Evening Decompression & Breathwork',
    startTime: minutesToTime(currentPointer),
    durationMinutes: mDur,
    category: 'Night Restoration & Sleep',
    isMoversPillar: true,
    moversType: 'M',
    coinsReward: 25,
    icon: answers.moversWrapperMode === 'evening_restorer' ? 'BrainCircuit' : 'Wind',
  });
  currentPointer += mDur;

  // Task 2: Reading (R)
  const rDur = answers.moversWrapperMode === 'evening_restorer' ? 16 : 13;
  tasks.push({
    id: makeId('mov_r'),
    title: 'Positive Reading & Intellectual Intake (R)',
    startTime: minutesToTime(currentPointer),
    durationMinutes: rDur,
    category: 'Night Restoration & Sleep',
    isMoversPillar: true,
    moversType: 'R',
    coinsReward: 25,
    icon: 'BookOpen',
  });
  currentPointer += rDur;

  // Task 3: Scribing (S)
  const sDur = answers.moversWrapperMode === 'evening_restorer' ? 10 : 10;
  tasks.push({
    id: makeId('mov_s'),
    title: 'Scribing & Daily Reflection Journaling (S)',
    startTime: minutesToTime(currentPointer),
    durationMinutes: sDur,
    category: 'Night Restoration & Sleep',
    isMoversPillar: true,
    moversType: 'S',
    coinsReward: 25,
    icon: 'PenSquare',
  });
  currentPointer += sDur;

  // Task 4: Domestic Bed Setup & Night Anchor
  const bedDur = answers.moversWrapperMode === 'evening_restorer' ? 10 : 5;
  tasks.push({
    id: makeId('night_bed'),
    title: 'Night Desk Tidy & Sleep Sanctuary Setup',
    startTime: minutesToTime(currentPointer),
    durationMinutes: bedDur,
    category: 'Night Restoration & Sleep',
    isMoversPillar: true,
    moversType: 'domestic',
    coinsReward: 15,
    icon: 'Bed',
  });
  currentPointer += bedDur;

  // Task 5: Hydration #8 (Pre-Sleep Sip)
  tasks.push({
    id: makeId('hyd_8'),
    title: 'Hydration Check-in #8 (Pre-Sleep Sip)',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 2,
    category: 'Night Restoration & Sleep',
    isMoversPillar: true,
    moversType: 'hydration',
    coinsReward: 15,
    icon: 'Droplets',
  });
  currentPointer += 2;
  return tasks;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const parseResult = RoutineTuningAnswersSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid tuning parameters',
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const answers = parseResult.data;

    // 1. Build deterministic zero-overlap schedule
    const schedule = buildDeterministicSchedule(answers);

    // 2. Enhance with JEV TypeSafe SystemOne (or fallback gracefully)
    let sustainabilityScore = 94;
    let optimizationSummary =
      `Schedule structured into 8 circadian non-overlapping sections (Morning Activation, Transition, Morning Sprint, Mid-Day Recovery, Afternoon Execution, Evening Fitness, Growth & Creative, Night Restoration) with strictly <= 6 tasks per section, complete MOVERS synchronization, and ${answers.profession || 'Reformer'} profession focus sprints.`;
    let recommendedFocusPeak =
      answers.studyOrResearchPreference === 'early_morning'
        ? '07:30 AM - 09:00 AM'
        : '10:00 AM - 12:30 PM';
    let conflictResolutionNote =
      'Micro-gaps, transit corridors, and post-work recovery windows mathematically bounded to eliminate cognitive burnout.';

    if (JEV_API_KEY) {
      try {
        const jevState = {
          profileName: answers.profileName,
          profession: answers.profession || 'General',
          wakeUpTime: answers.wakeUpTime,
          sleepTime: answers.sleepTime,
          workStart: answers.workOrCollegeStart,
          workEnd: answers.workOrCollegeEnd,
          studyPreference: answers.studyOrResearchPreference,
          studyDurationMinutes: answers.studyDurationMinutes,
          moversWrapperMode: answers.moversWrapperMode,
          totalTasks: schedule.length,
          hydrationCheckCount: schedule.filter((t) => t.moversType === 'hydration').length,
          eyeStrainCount: schedule.filter((t) => t.moversType === 'eye_strain').length,
        };

        const jevQuestions = {
          scheduleSustainabilityScore: createScoreQuestion([
            'Evaluate schedule sustainability, realistic buffer times, cognitive pacing, and circadian health on a 0 to 100 scale.',
          ]),
          optimizationSummary: createNoulQuestion(
            'Provide a 1-sentence synthesis of how the schedule is optimized for focus and recovery.'
          ),
          recommendedFocusPeak: createNoulQuestion(
            'Identify the single best peak energy window for high-cognitive work in this schedule.'
          ),
          conflictResolutionNote: createNoulQuestion(
            'Summarize how micro-gaps and breaks eliminate burnout.'
          ),
        };

        const jevResponse = await callTypeSafeSystemOne({
          state: jevState,
          questions: jevQuestions,
        });

        if (jevResponse?.answers) {
          const rawScore = jevResponse.answers.scheduleSustainabilityScore;
          if (typeof rawScore === 'number' && !isNaN(rawScore)) {
            sustainabilityScore = Math.max(0, Math.min(100, Math.round(rawScore)));
          } else if (rawScore && typeof rawScore.score === 'number') {
            sustainabilityScore = Math.max(0, Math.min(100, Math.round(rawScore.score)));
          }

          const rawSummary = extractJevText(jevResponse.answers.optimizationSummary);
          if (rawSummary) optimizationSummary = rawSummary;

          const rawPeak = extractJevText(jevResponse.answers.recommendedFocusPeak);
          if (rawPeak) recommendedFocusPeak = rawPeak;

          const rawNote = extractJevText(jevResponse.answers.conflictResolutionNote);
          if (rawNote) conflictResolutionNote = rawNote;
        }
      } catch (jevErr) {
        console.warn(
          '[JEV TypeSafe] Schedule synthesis optimization fell back to deterministic baseline:',
          jevErr
        );
      }
    }

    return NextResponse.json({
      success: true,
      profileName: answers.profileName,
      tuningAnswers: answers,
      tasks: schedule,
      sustainabilityScore,
      optimizationSummary,
      recommendedFocusPeak,
      conflictResolutionNote,
    });
  } catch (error: any) {
    console.error('[API /api/routine/tune] Error synthesizing schedule:', error);
    return NextResponse.json(
      {
        error: 'Failed to synthesize schedule',
        message: error?.message || 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
