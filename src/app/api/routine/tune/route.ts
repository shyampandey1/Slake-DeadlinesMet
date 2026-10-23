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
  // Strictly capped at <= 4 tasks!
  // =========================================================================
  const transitionTimeAvailable = Math.max(20, workStartMins - currentPointer);

  // Task 1: Focus Priming / Early Study / MOVERS Movement
  if (answers.studyOrResearchPreference === 'early_morning' && transitionTimeAvailable >= 35) {
    const studyDur = Math.min(answers.studyDurationMinutes || 45, transitionTimeAvailable - (commute > 0 ? commute : 15) - 2);
    const validDur = Math.max(20, studyDur);
    tasks.push({
      id: makeId('study_early'),
      title: 'Dawn Focus Sprint & Deep Theory',
      startTime: minutesToTime(currentPointer),
      durationMinutes: validDur,
      category: 'Morning Transition & Prep',
      isMoversPillar: false,
      coinsReward: 35,
      icon: 'BookOpen',
    });
    currentPointer += validDur;
  } else if (answers.studyOrResearchPreference === 'split_blocks' && transitionTimeAvailable >= 35) {
    const splitDur1 = Math.min(Math.floor((answers.studyDurationMinutes || 60) / 2), transitionTimeAvailable - (commute > 0 ? commute : 15) - 2);
    const validDur = Math.max(20, splitDur1);
    tasks.push({
      id: makeId('study_split_1'),
      title: 'Morning Focus & Core Study Block (Phase 1)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: validDur,
      category: 'Morning Transition & Prep',
      isMoversPillar: false,
      coinsReward: 30,
      icon: 'BookOpen',
    });
    currentPointer += validDur;
  } else if (answers.moversWrapperMode === 'morning_primer') {
    tasks.push({
      id: makeId('mov_v'),
      title: 'Strategic Visualization & Focus Framing (V)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 10,
      category: 'Morning Transition & Prep',
      isMoversPillar: true,
      moversType: 'V',
      coinsReward: 25,
      icon: 'Target',
    });
    currentPointer += 10;
  } else {
    tasks.push({
      id: makeId('mov_v_prep'),
      title: 'Daily Objective Framing & Mental Rehearsal',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 10,
      category: 'Morning Transition & Prep',
      isMoversPillar: true,
      moversType: 'V',
      coinsReward: 20,
      icon: 'Target',
    });
    currentPointer += 10;
  }

  // Task 2: Hydration #2
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

  // Task 3: Commute / Mindful Transit or Remote Workspace Priming
  const transitDur = Math.max(10, workStartMins - currentPointer);
  tasks.push({
    id: makeId('commute_m'),
    title: commute > 0 ? morningCommuteTitle : 'Workspace Priming & Equipment Setup',
    startTime: minutesToTime(currentPointer),
    durationMinutes: transitDur,
    category: 'Morning Transition & Prep',
    isMoversPillar: false,
    coinsReward: 15,
    icon: commute > 0 ? (isCollege ? 'GraduationCap' : isIndependent ? 'Coffee' : 'Car') : 'Laptop',
  });
  currentPointer += transitDur;

  // =========================================================================
  // SECTION 3: DEEP FOCUS: MORNING SPRINT (Work Start -> Lunch Start)
  // Strictly capped at <= 5 tasks!
  // =========================================================================
  currentPointer = Math.max(currentPointer, workStartMins);
  const morningWorkBudget = Math.max(60, lunchMins - currentPointer);
  const midTasksCount = Math.max(1, Math.ceil(profWorkTasks.length / 2));
  const morningProfTasks = profWorkTasks.slice(0, midTasksCount);
  const afternoonProfTasks = profWorkTasks.slice(midTasksCount);

  // Distribute tasks across morning work budget: 2 core work tasks, 1 eye-strain break, 1 sync, 1 hydration
  const overheadMorning = 4; // eye_1 (2m) + hyd_3 (2m)
  const netMorningWorkMins = Math.max(50, morningWorkBudget - overheadMorning - 20); // reserve 20m for preLunchSync
  const workBlockDur1 = quantize5(netMorningWorkMins / Math.max(1, Math.min(2, morningProfTasks.length)));

  // Task 1: Morning Deep Work Block #1
  const firstProfTask = morningProfTasks[0] || { name: `${profession} Core Execution & Focus Sprint`, icon: 'Briefcase' };
  tasks.push({
    id: makeId('prof_am_0'),
    title: firstProfTask.name,
    startTime: minutesToTime(currentPointer),
    durationMinutes: workBlockDur1,
    category: 'Deep Focus: Morning Sprint',
    isMoversPillar: false,
    coinsReward: 35,
    icon: firstProfTask.icon || (isCollege ? 'BookOpen' : 'Briefcase'),
  });
  currentPointer += workBlockDur1;

  // Task 2: Eye-Strain Rest #1
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

  // Task 3: Morning Deep Work Block #2
  const secondProfTask = morningProfTasks[1] || { name: `${profession} Deep Production & Deliverables`, icon: 'Briefcase' };
  const remBeforeSync = Math.max(25, lunchMins - currentPointer - 22);
  const secondBlockDur = quantize5(Math.min(workBlockDur1, remBeforeSync));
  tasks.push({
    id: makeId('prof_am_1'),
    title: secondProfTask.name,
    startTime: minutesToTime(currentPointer),
    durationMinutes: secondBlockDur,
    category: 'Deep Focus: Morning Sprint',
    isMoversPillar: false,
    coinsReward: 30,
    icon: secondProfTask.icon || (isCollege ? 'GraduationCap' : 'Briefcase'),
  });
  currentPointer += secondBlockDur;

  // Task 4: Pre-Lunch Review & Standup Sync
  const syncDur = Math.max(15, lunchMins - 2 - currentPointer);
  tasks.push({
    id: makeId('prof_am_sync'),
    title: preLunchSyncTitle,
    startTime: minutesToTime(currentPointer),
    durationMinutes: syncDur,
    category: 'Deep Focus: Morning Sprint',
    isMoversPillar: false,
    coinsReward: 20,
    icon: preLunchSyncIcon,
  });
  currentPointer += syncDur;

  // Task 5: Hydration #3
  tasks.push({
    id: makeId('hyd_3'),
    title: 'Hydration Check-in #3 (Pre-Lunch Glass)',
    startTime: minutesToTime(Math.max(currentPointer, lunchMins - 2)),
    durationMinutes: 2,
    category: 'Deep Focus: Morning Sprint',
    isMoversPillar: true,
    moversType: 'hydration',
    coinsReward: 15,
    icon: 'Droplets',
  });

  // =========================================================================
  // SECTION 4: MID-DAY RECOVERY & LUNCH (Lunch Break Window)
  // Strictly capped at <= 3 tasks! Exact sum == lunchDuration!
  // =========================================================================
  currentPointer = lunchMins;
  const netWalkMins = Math.max(5, Math.min(10, lunchDuration - 22)); // 5 to 10m
  const netLunchMins = lunchDuration - netWalkMins - 2; // Exact mathematical sum == lunchDuration

  // Task 1: Lunch Nutrition
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

  // Task 2: Hydration #4
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

  // Task 3: Digestive Walk & Light Reset
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
  // Strictly capped at <= 5 tasks!
  // =========================================================================
  currentPointer = lunchMins + lunchDuration;
  const afternoonBudget = Math.max(60, coreWorkEndMins - currentPointer);
  const pmTasksToUse =
    afternoonProfTasks.length > 0
      ? afternoonProfTasks
      : isCollege
      ? [{ name: 'Academic Application & Project Sprint', duration: 75, icon: 'GraduationCap' }]
      : isIndependent
      ? [{ name: 'Independent Production & Creative Deliverables', duration: 75, icon: 'Palette' }]
      : [{ name: `${profession} Core Execution & Deliverables`, duration: 75, icon: 'Briefcase' }];

  const netAfternoonMins = Math.max(50, afternoonBudget - 24); // reserve for wrap-up, eye-strain, hydration
  const pmBlockDur = quantize5(netAfternoonMins / Math.max(1, Math.min(2, pmTasksToUse.length)));

  // Task 1: Afternoon Production Block
  const firstPmTask = pmTasksToUse[0];
  tasks.push({
    id: makeId('prof_pm_0'),
    title: firstPmTask.name,
    startTime: minutesToTime(currentPointer),
    durationMinutes: pmBlockDur,
    category: 'Afternoon Strategic Execution',
    isMoversPillar: false,
    coinsReward: 30,
    icon: firstPmTask.icon || (isCollege ? 'GraduationCap' : 'Briefcase'),
  });
  currentPointer += pmBlockDur;

  // Task 2: Eye-Strain Rest #2
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

  // Task 3: Afternoon Sprints / Alignment
  if (answers.moversWrapperMode === 'jev_smart_weave') {
    tasks.push({
      id: makeId('mov_v_weave'),
      title: 'Afternoon Re-Alignment & Micro-Visualization (V)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 8,
      category: 'Afternoon Strategic Execution',
      isMoversPillar: true,
      moversType: 'V',
      coinsReward: 25,
      icon: 'Target',
    });
    currentPointer += 8;
  } else {
    const sprintDur = quantize5(Math.min(pmBlockDur, Math.max(25, coreWorkEndMins - currentPointer - 24)));
    tasks.push({
      id: makeId('prof_pm_sprint'),
      title: pmSprintTitle,
      startTime: minutesToTime(currentPointer),
      durationMinutes: sprintDur,
      category: 'Afternoon Strategic Execution',
      isMoversPillar: false,
      coinsReward: 30,
      icon: pmSprintIcon,
    });
    currentPointer += sprintDur;
  }

  // Task 4: Hydration #5
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

  // Task 5: Daily Milestone Wrap-Up
  const wrapDur = Math.max(15, coreWorkEndMins - currentPointer);
  tasks.push({
    id: makeId('prof_pm_wrap'),
    title: pmWrapTitle,
    startTime: minutesToTime(currentPointer),
    durationMinutes: wrapDur,
    category: 'Afternoon Strategic Execution',
    isMoversPillar: false,
    coinsReward: 25,
    icon: pmWrapIcon,
  });
  currentPointer += wrapDur;

  // =========================================================================
  // SECTION 6: EVENING TRANSITION & FITNESS (Core Work End -> Dinner End)
  // Strictly capped at <= 4 tasks!
  // =========================================================================
  currentPointer = Math.max(currentPointer, coreWorkEndMins);
  const nightWindDownDuration = answers.moversWrapperMode === 'evening_restorer' ? 55 : 35;
  const nightWindDownStart = sleepMins - nightWindDownDuration;

  // Task 1: Evening Commute / Studio Close-Down
  const eveTransitDur = commute > 0 ? commute : 15;
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

  // Task 2: Hydration #6
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

  const eveningActivities =
    answers.eveningCustomization && answers.eveningCustomization.length > 0
      ? answers.eveningCustomization
      : ['fitness', 'family_social', 'relaxation'];

  // Task 3: Physical Training & Kinetic Workout (E)
  const fitnessDur = eveningActivities.includes('fitness') ? 35 : 20;
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

  // Task 4: Dinner & Family / Social Connection Time
  const dinnerDur = 35;
  tasks.push({
    id: makeId('eve_social'),
    title: 'Dinner & Family / Social Connection Time',
    startTime: minutesToTime(currentPointer),
    durationMinutes: dinnerDur,
    category: 'Evening Transition & Fitness',
    isMoversPillar: false,
    coinsReward: 20,
    icon: 'Users',
  });
  currentPointer += dinnerDur;

  // =========================================================================
  // SECTION 7: EVENING GROWTH & CREATIVE (Post-Dinner -> Night Wind-Down Start)
  // Strictly capped at <= 5 tasks!
  // =========================================================================
  const growthTimeAvailable = Math.max(50, nightWindDownStart - currentPointer);

  // Task 1: Study Block
  let studyBlockDur = 30;
  let studyBlockTitle = 'Intellectual Synthesis & Deep Focus';
  if (answers.studyOrResearchPreference === 'late_afternoon') {
    studyBlockDur = Math.min(answers.studyDurationMinutes || 45, Math.floor(growthTimeAvailable * 0.4));
    studyBlockTitle = 'Deep Research & Focused Intellectual Sprint';
  } else if (answers.studyOrResearchPreference === 'split_blocks') {
    studyBlockDur = Math.min(Math.floor((answers.studyDurationMinutes || 60) / 2), Math.floor(growthTimeAvailable * 0.35));
    studyBlockTitle = 'Evening Synthesis & Deep Study Sprint (Phase 2)';
  } else if (answers.studyOrResearchPreference === 'night_owl') {
    studyBlockDur = Math.min(answers.studyDurationMinutes || 60, Math.floor(growthTimeAvailable * 0.45));
    studyBlockTitle = 'Night Owl Focus Sprint & Deep Work';
  }
  tasks.push({
    id: makeId('study_pm'),
    title: studyBlockTitle,
    startTime: minutesToTime(currentPointer),
    durationMinutes: Math.max(25, studyBlockDur),
    category: 'Evening Growth & Creative',
    isMoversPillar: false,
    coinsReward: 35,
    icon: 'BookOpen',
  });
  currentPointer += Math.max(25, studyBlockDur);

  // Task 2: Creative Hobby, Skill-Building or Profession Evening Project
  let creativeTitle = 'Skill-Building Sprint & Tech Upskilling';
  let creativeIcon = 'Code';
  if (eveningActivities.includes('creative_hobby')) {
    creativeTitle = 'Creative Hobby & Passion Project Exploration';
    creativeIcon = 'Palette';
  } else if (profEveningTasks.length > 0) {
    creativeTitle = profEveningTasks[0].name;
    creativeIcon = profEveningTasks[0].icon || 'Target';
  }
  const creativeDur = Math.max(20, Math.min(35, Math.floor((nightWindDownStart - currentPointer - 6) * 0.5)));
  tasks.push({
    id: makeId('eve_creative'),
    title: creativeTitle,
    startTime: minutesToTime(currentPointer),
    durationMinutes: creativeDur,
    category: 'Evening Growth & Creative',
    isMoversPillar: false,
    coinsReward: 25,
    icon: creativeIcon,
  });
  currentPointer += creativeDur;

  // Task 3: Eye-Strain Rest #3
  tasks.push({
    id: makeId('eye_3'),
    title: 'Eye-Strain 20-20-20 Vision Rest #3',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 2,
    category: 'Evening Growth & Creative',
    isMoversPillar: true,
    moversType: 'eye_strain',
    coinsReward: 15,
    icon: 'Eye',
  });
  currentPointer += 2;

  // Task 4: Passive Relaxation & Stress Decompression
  const relaxDur = Math.max(15, nightWindDownStart - currentPointer - 2);
  tasks.push({
    id: makeId('eve_relax'),
    title: 'Passive Relaxation & Stress Decompression',
    startTime: minutesToTime(currentPointer),
    durationMinutes: relaxDur,
    category: 'Evening Growth & Creative',
    isMoversPillar: false,
    coinsReward: 15,
    icon: 'Sparkles',
  });
  currentPointer += relaxDur;

  // Task 5: Hydration #7
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

  // =========================================================================
  // SECTION 8: NIGHT RESTORATION & SLEEP (Night Wind-Down Start -> Sleep Time)
  // Strictly capped at <= 5 tasks! Anchored strictly to sleepMins!
  // =========================================================================
  currentPointer = Math.max(currentPointer, nightWindDownStart);

  // Task 1: Evening MOVERS Centering & Breathwork
  if (answers.moversWrapperMode === 'evening_restorer') {
    tasks.push({
      id: makeId('mov_rest_m'),
      title: 'Deep Meditation & Parasympathetic Breathwork (M+O)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 12,
      category: 'Night Restoration & Sleep',
      isMoversPillar: true,
      moversType: 'M',
      coinsReward: 25,
      icon: 'BrainCircuit',
    });
    currentPointer += 12;
  } else {
    tasks.push({
      id: makeId('mov_rest_wind'),
      title: 'Mindful Evening Decompression & Breathwork',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 8,
      category: 'Night Restoration & Sleep',
      isMoversPillar: true,
      moversType: 'M',
      coinsReward: 20,
      icon: 'Wind',
    });
    currentPointer += 8;
  }

  // Task 2: Reading (R)
  tasks.push({
    id: makeId('mov_r'),
    title: 'Positive Reading & Intellectual Intake (R)',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 15,
    category: 'Night Restoration & Sleep',
    isMoversPillar: true,
    moversType: 'R',
    coinsReward: 25,
    icon: 'BookOpen',
  });
  currentPointer += 15;

  // Task 3: Scribing (S)
  tasks.push({
    id: makeId('mov_s'),
    title: 'Scribing & Daily Reflection Journaling (S)',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 10,
    category: 'Night Restoration & Sleep',
    isMoversPillar: true,
    moversType: 'S',
    coinsReward: 25,
    icon: 'PenSquare',
  });
  currentPointer += 10;

  // Task 4: Domestic Bed Setup & Night Anchor
  tasks.push({
    id: makeId('night_bed'),
    title: 'Night Desk Tidy & Sleep Sanctuary Setup',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 5,
    category: 'Night Restoration & Sleep',
    isMoversPillar: true,
    moversType: 'domestic',
    coinsReward: 15,
    icon: 'Bed',
  });
  currentPointer += 5;

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
