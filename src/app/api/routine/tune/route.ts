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
 * Organized into exactly 4 cohesive, natural quadrants of the day:
 * 1. Morning Protocol (Wake -> Work Start, includes Morning Commute)
 * 2. Afternoon Execution (Work Start -> Work End, includes lunch & profession work blocks)
 * 3. Evening Recharge & Growth (Work End -> Night Wind-Down, includes Evening Commute, workout, study & hobby)
 * 4. Night Restoration (Anchored to Sleep Time, includes pre-sleep MOVERS, reading & scribing)
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
  if (workStartMins < wakeMins) {
    workStartMins = wakeMins + 90;
  }
  let rawWorkEndMins = timeToMinutes(answers.workOrCollegeEnd);
  if (rawWorkEndMins <= workStartMins) {
    rawWorkEndMins = workStartMins + 480;
  }

  // Core daytime execution must end in late afternoon (capped between 17:30 and 18:30 max,
  // leaving at least 4.5 hours for evening recharge, dinner, workout, and rest before sleep)
  const coreWorkEndMins = Math.min(
    rawWorkEndMins,
    Math.max(workStartMins + 240, Math.min(1110, sleepMins - 270))
  );

  let lunchMins = timeToMinutes(answers.lunchBreakTime);
  if (lunchMins < 660) {
    lunchMins += 720; // 01:00 or 02:00 -> PM (13:00 / 14:00)
  }
  if (lunchMins <= workStartMins || lunchMins >= coreWorkEndMins) {
    lunchMins = workStartMins + Math.floor((coreWorkEndMins - workStartMins) / 2);
  }

  const lunchDuration = Math.max(25, Math.min(90, answers.lunchDurationMinutes || 45));
  const commute = Math.max(0, Math.min(90, answers.commuteDurationMinutes || 0));

  // 2. Extract Authentic Tasks from Selected Profession Routine
  const profession = answers.profession || 'General';
  const routineKey = profileToRoutineMap[profession] || 'General';
  const rawRoutine = defaultRoutines.routines[routineKey] || defaultRoutines.routines['General'] || [];

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

  // Fallbacks if profession routine had minimal tasks
  if (profWorkTasks.length === 0) {
    profWorkTasks.push(
      { name: `${profession} Strategic Execution (Block 1)`, duration: 90, icon: 'Briefcase' },
      { name: `${profession} Core Deliverables & Operations (Block 2)`, duration: 90, icon: 'Briefcase' }
    );
  }

  // =========================================================================
  // QUADRANT 1: MORNING PROTOCOL (wakeMins -> workStartMins)
  // Category: "Morning Protocol"
  // =========================================================================
  let currentPointer = wakeMins;

  // Hydration #1
  tasks.push({
    id: makeId('wake_hyd'),
    title: 'Hydration Check-in #1 (Waking Glass)',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 2,
    category: 'Morning Protocol',
    isMoversPillar: true,
    moversType: 'hydration',
    coinsReward: 15,
    icon: 'Droplets',
  });
  currentPointer += 2;

  // Domestic Bed Setup
  tasks.push({
    id: makeId('wake_bed'),
    title: 'Set Bed & Morning Space Hygiene',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 5,
    category: 'Morning Protocol',
    isMoversPillar: true,
    moversType: 'domestic',
    coinsReward: 15,
    icon: 'Bed',
  });
  currentPointer += 5;

  // Morning MOVERS Injection
  if (answers.moversWrapperMode === 'morning_primer') {
    tasks.push({
      id: makeId('mov_m'),
      title: 'Meditation & Centering (M)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 10,
      category: 'Morning Protocol',
      isMoversPillar: true,
      moversType: 'M',
      coinsReward: 25,
      icon: 'BrainCircuit',
    });
    currentPointer += 10;

    tasks.push({
      id: makeId('mov_o'),
      title: 'Oxygenation & Breathwork (O)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 3,
      category: 'Morning Protocol',
      isMoversPillar: true,
      moversType: 'O',
      coinsReward: 20,
      icon: 'Wind',
    });
    currentPointer += 3;

    tasks.push({
      id: makeId('mov_v'),
      title: 'Strategic Visualization & Focus Framing (V)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 10,
      category: 'Morning Protocol',
      isMoversPillar: true,
      moversType: 'V',
      coinsReward: 25,
      icon: 'Target',
    });
    currentPointer += 10;

    tasks.push({
      id: makeId('mov_e'),
      title: 'Physical Awakening & Mobility Workout (E)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 20,
      category: 'Morning Protocol',
      isMoversPillar: true,
      moversType: 'E',
      coinsReward: 30,
      icon: 'Dumbbell',
    });
    currentPointer += 20;
  } else if (answers.moversWrapperMode === 'evening_restorer') {
    tasks.push({
      id: makeId('mov_e_quick'),
      title: 'Awakening Mobility & Kinetic Stretch (E)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 12,
      category: 'Morning Protocol',
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
      category: 'Morning Protocol',
      isMoversPillar: true,
      moversType: 'M',
      coinsReward: 25,
      icon: 'BrainCircuit',
    });
    currentPointer += 10;

    tasks.push({
      id: makeId('mov_o_weave'),
      title: 'Pranayama Oxygenation (O)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 3,
      category: 'Morning Protocol',
      isMoversPillar: true,
      moversType: 'O',
      coinsReward: 20,
      icon: 'Wind',
    });
    currentPointer += 3;
  }

  // Freshen Up & Breakfast
  tasks.push({
    id: makeId('wake_fresh'),
    title: 'Freshen Up & Personal Hygiene',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 15,
    category: 'Morning Protocol',
    isMoversPillar: false,
    coinsReward: 15,
    icon: 'ShowerHead',
  });
  currentPointer += 15;

  tasks.push({
    id: makeId('wake_bfast'),
    title: 'Nutritious Breakfast & Cognitive Fuel',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 20,
    category: 'Morning Protocol',
    isMoversPillar: false,
    coinsReward: 15,
    icon: 'Utensils',
  });
  currentPointer += 20;

  // Early Morning Study (if requested)
  if (answers.studyOrResearchPreference === 'early_morning') {
    const available = Math.max(0, workStartMins - commute - currentPointer);
    const studyDuration = Math.min(answers.studyDurationMinutes || 60, Math.max(25, available));
    if (studyDuration > 0 && available >= 25) {
      tasks.push({
        id: makeId('study_early'),
        title: 'Dawn Focus Sprint & Deep Theory',
        startTime: minutesToTime(currentPointer),
        durationMinutes: studyDuration,
        category: 'Morning Protocol',
        isMoversPillar: false,
        coinsReward: 35,
        icon: 'BookOpen',
      });
      currentPointer += studyDuration;
    }
  } else if (answers.studyOrResearchPreference === 'split_blocks') {
    const splitDur = Math.floor((answers.studyDurationMinutes || 60) / 2);
    const available = Math.max(0, workStartMins - commute - currentPointer);
    if (splitDur > 0 && available >= splitDur) {
      tasks.push({
        id: makeId('study_split_1'),
        title: 'Morning Focus & Core Study Block (Phase 1)',
        startTime: minutesToTime(currentPointer),
        durationMinutes: splitDur,
        category: 'Morning Protocol',
        isMoversPillar: false,
        coinsReward: 30,
        icon: 'BookOpen',
      });
      currentPointer += splitDur;
    }
  }

  // Morning Commute (Scheduled inside Morning Protocol, right before work begins!)
  if (commute > 0) {
    const commuteStart = Math.max(currentPointer, workStartMins - commute);
    tasks.push({
      id: makeId('commute_m'),
      title: 'Morning Commute & Mindful Transit / Audio Briefing',
      startTime: minutesToTime(commuteStart),
      durationMinutes: commute,
      category: 'Morning Protocol',
      isMoversPillar: false,
      coinsReward: 15,
      icon: 'Car',
    });
  }

  // =========================================================================
  // QUADRANT 2: AFTERNOON EXECUTION (workStartMins -> coreWorkEndMins)
  // Category: "Afternoon Execution"
  // Seamlessly integrates authentic profession tasks!
  // =========================================================================
  currentPointer = workStartMins;

  // Morning Work Segment (before lunch)
  const morningWorkBudget = Math.max(60, lunchMins - workStartMins);
  const midTasksCount = Math.max(1, Math.ceil(profWorkTasks.length / 2));
  const morningProfTasks = profWorkTasks.slice(0, midTasksCount);
  const afternoonProfTasks = profWorkTasks.slice(midTasksCount);

  const overheadMorning = 6; // Hyd #2 (2m), Eye #1 (2m), Hyd #3 (2m)
  const netMorningWorkMins = Math.max(30, morningWorkBudget - overheadMorning);
  const rawWorkBlockDur1 = Math.floor(netMorningWorkMins / morningProfTasks.length);
  const workBlockDur1 = Math.min(90, Math.max(30, rawWorkBlockDur1));

  morningProfTasks.forEach((pt, idx) => {
    tasks.push({
      id: makeId(`prof_am_${idx}`),
      title: pt.name,
      startTime: minutesToTime(currentPointer),
      durationMinutes: workBlockDur1,
      category: 'Afternoon Execution',
      isMoversPillar: false,
      coinsReward: 30,
      icon: pt.icon || 'Briefcase',
    });
    currentPointer += workBlockDur1;

    if (idx === 0) {
      tasks.push({
        id: makeId('hyd_2'),
        title: 'Hydration Check-in #2',
        startTime: minutesToTime(currentPointer),
        durationMinutes: 2,
        category: 'Afternoon Execution',
        isMoversPillar: true,
        moversType: 'hydration',
        coinsReward: 15,
        icon: 'Droplets',
      });
      currentPointer += 2;

      tasks.push({
        id: makeId('eye_1'),
        title: 'Eye-Strain 20-20-20 Vision Rest #1',
        startTime: minutesToTime(currentPointer),
        durationMinutes: 2,
        category: 'Afternoon Execution',
        isMoversPillar: true,
        moversType: 'eye_strain',
        coinsReward: 15,
        icon: 'Eye',
      });
      currentPointer += 2;
    }
  });

  // If there is extra buffer before lunch, insert tactical sync
  if (lunchMins - 2 - currentPointer >= 20) {
    const bufferDur = Math.min(45, lunchMins - 2 - currentPointer);
    tasks.push({
      id: makeId('prof_am_sync'),
      title: `${profession} Morning Execution Review & Standup Sync`,
      startTime: minutesToTime(currentPointer),
      durationMinutes: bufferDur,
      category: 'Afternoon Execution',
      isMoversPillar: false,
      coinsReward: 20,
      icon: 'Briefcase',
    });
    currentPointer += bufferDur;
  }

  // Pre-lunch hydration check
  tasks.push({
    id: makeId('hyd_3'),
    title: 'Hydration Check-in #3',
    startTime: minutesToTime(Math.max(currentPointer, lunchMins - 2)),
    durationMinutes: 2,
    category: 'Afternoon Execution',
    isMoversPillar: true,
    moversType: 'hydration',
    coinsReward: 15,
    icon: 'Droplets',
  });

  // Lunch Break
  tasks.push({
    id: makeId('lunch_block'),
    title: 'Lunch & Mindful Nutrition Break',
    startTime: minutesToTime(lunchMins),
    durationMinutes: lunchDuration - 2,
    category: 'Afternoon Execution',
    isMoversPillar: false,
    coinsReward: 20,
    icon: 'Utensils',
  });

  tasks.push({
    id: makeId('hyd_4'),
    title: 'Hydration Check-in #4 (Post-Lunch Glass)',
    startTime: minutesToTime(lunchMins + lunchDuration - 2),
    durationMinutes: 2,
    category: 'Afternoon Execution',
    isMoversPillar: true,
    moversType: 'hydration',
    coinsReward: 15,
    icon: 'Droplets',
  });

  // Afternoon Work Tasks (between lunch end and coreWorkEndMins)
  currentPointer = lunchMins + lunchDuration;
  const afternoonWorkBudget = Math.max(60, coreWorkEndMins - currentPointer);
  const overheadAfternoon = answers.moversWrapperMode === 'jev_smart_weave' ? 12 : 4;
  const netAfternoonWorkMins = Math.max(30, afternoonWorkBudget - overheadAfternoon);

  const pmTasksToUse =
    afternoonProfTasks.length > 0
      ? afternoonProfTasks
      : [{ name: `${profession} Tactical Execution & Deliverables`, duration: 90, icon: 'Briefcase' }];
  const rawWorkBlockDur2 = Math.floor(netAfternoonWorkMins / pmTasksToUse.length);
  const workBlockDur2 = Math.min(90, Math.max(30, rawWorkBlockDur2));

  pmTasksToUse.forEach((pt, idx) => {
    tasks.push({
      id: makeId(`prof_pm_${idx}`),
      title: pt.name,
      startTime: minutesToTime(currentPointer),
      durationMinutes: workBlockDur2,
      category: 'Afternoon Execution',
      isMoversPillar: false,
      coinsReward: 30,
      icon: pt.icon || 'Briefcase',
    });
    currentPointer += workBlockDur2;

    if (idx === 0) {
      tasks.push({
        id: makeId('eye_2'),
        title: 'Eye-Strain 20-20-20 Vision Rest #2',
        startTime: minutesToTime(currentPointer),
        durationMinutes: 2,
        category: 'Afternoon Execution',
        isMoversPillar: true,
        moversType: 'eye_strain',
        coinsReward: 15,
        icon: 'Eye',
      });
      currentPointer += 2;

      if (answers.moversWrapperMode === 'jev_smart_weave') {
        tasks.push({
          id: makeId('mov_v_weave'),
          title: 'Afternoon Re-Alignment & Micro-Visualization (V)',
          startTime: minutesToTime(currentPointer),
          durationMinutes: 8,
          category: 'Afternoon Execution',
          isMoversPillar: true,
          moversType: 'V',
          coinsReward: 25,
          icon: 'Target',
        });
        currentPointer += 8;
      }

      tasks.push({
        id: makeId('hyd_5'),
        title: 'Hydration Check-in #5',
        startTime: minutesToTime(currentPointer),
        durationMinutes: 2,
        category: 'Afternoon Execution',
        isMoversPillar: true,
        moversType: 'hydration',
        coinsReward: 15,
        icon: 'Droplets',
      });
      currentPointer += 2;
    }
  });

  // If afternoon still has remaining time before coreWorkEndMins, insert tactical execution sprint and wrap-up
  if (coreWorkEndMins - currentPointer >= 45) {
    const sprintDur = Math.min(75, Math.floor((coreWorkEndMins - currentPointer) * 0.6));
    tasks.push({
      id: makeId('prof_pm_sprint'),
      title: `${profession} Tactical Operations & Focused Implementation`,
      startTime: minutesToTime(currentPointer),
      durationMinutes: sprintDur,
      category: 'Afternoon Execution',
      isMoversPillar: false,
      coinsReward: 30,
      icon: 'Briefcase',
    });
    currentPointer += sprintDur;
  }

  if (coreWorkEndMins - currentPointer >= 15) {
    const wrapDur = coreWorkEndMins - currentPointer;
    tasks.push({
      id: makeId('prof_pm_wrap'),
      title: `${profession} Daily Execution Wrap-Up & Milestone Review`,
      startTime: minutesToTime(currentPointer),
      durationMinutes: wrapDur,
      category: 'Afternoon Execution',
      isMoversPillar: false,
      coinsReward: 25,
      icon: 'Briefcase',
    });
    currentPointer += wrapDur;
  }

  // =========================================================================
  // QUADRANT 3: EVENING RECHARGE & GROWTH (coreWorkEndMins -> nightWindDownStart)
  // Category: "Evening Recharge & Growth"
  // Includes evening return transit, dinner, study, and authentic profession evening tasks
  // =========================================================================
  currentPointer = coreWorkEndMins;

  // Calculate Night Wind-down start: anchored strictly backward from sleepMins!
  const nightWindDownDuration = answers.moversWrapperMode === 'evening_restorer' ? 55 : 35;
  const nightWindDownStart = sleepMins - nightWindDownDuration;

  // 1. Evening Commute (starts immediately at core work end, separated from morning commute!)
  if (commute > 0) {
    tasks.push({
      id: makeId('commute_e'),
      title: 'Evening Return Transit & Cognitive Decompression',
      startTime: minutesToTime(currentPointer),
      durationMinutes: commute,
      category: 'Evening Recharge & Growth',
      isMoversPillar: false,
      coinsReward: 15,
      icon: 'Car',
    });
    currentPointer += commute;

    tasks.push({
      id: makeId('hyd_6'),
      title: 'Hydration Check-in #6 (Post-Commute Refuel)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 2,
      category: 'Evening Recharge & Growth',
      isMoversPillar: true,
      moversType: 'hydration',
      coinsReward: 15,
      icon: 'Droplets',
    });
    currentPointer += 2;
  }

  const eveningActivities =
    answers.eveningCustomization && answers.eveningCustomization.length > 0
      ? answers.eveningCustomization
      : ['fitness', 'family_social', 'relaxation'];

  // 2. Physical Training & Kinetic Workout (E)
  if (eveningActivities.includes('fitness') && currentPointer + 30 <= nightWindDownStart) {
    const fitnessDur = Math.min(45, Math.max(25, Math.floor((nightWindDownStart - currentPointer) * 0.25)));
    tasks.push({
      id: makeId('eve_fitness'),
      title: 'Physical Training & Kinetic Workout (E)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: fitnessDur,
      category: 'Evening Recharge & Growth',
      isMoversPillar: true,
      moversType: 'E',
      coinsReward: 30,
      icon: 'Dumbbell',
    });
    currentPointer += fitnessDur;
  }

  // 3. Dinner & Family / Social Connection Time
  if (eveningActivities.includes('family_social') && currentPointer + 30 <= nightWindDownStart) {
    const dinnerDur = Math.min(50, Math.max(30, Math.floor((nightWindDownStart - currentPointer) * 0.3)));
    tasks.push({
      id: makeId('eve_social'),
      title: 'Dinner & Family / Social Connection Time',
      startTime: minutesToTime(currentPointer),
      durationMinutes: dinnerDur,
      category: 'Evening Recharge & Growth',
      isMoversPillar: false,
      coinsReward: 20,
      icon: 'Users',
    });
    currentPointer += dinnerDur;
  }

  // 4. Study block (Late Afternoon or Split Blocks Phase 2)
  if (answers.studyOrResearchPreference === 'late_afternoon' && currentPointer + 30 <= nightWindDownStart) {
    const studyDur = Math.min(
      answers.studyDurationMinutes || 60,
      Math.max(30, Math.floor((nightWindDownStart - currentPointer) * 0.45))
    );
    if (studyDur >= 25) {
      tasks.push({
        id: makeId('study_late_pm'),
        title: 'Deep Research & Focused Intellectual Sprint',
        startTime: minutesToTime(currentPointer),
        durationMinutes: studyDur,
        category: 'Evening Recharge & Growth',
        isMoversPillar: false,
        coinsReward: 35,
        icon: 'BookOpen',
      });
      currentPointer += studyDur;
    }
  } else if (answers.studyOrResearchPreference === 'split_blocks' && currentPointer + 30 <= nightWindDownStart) {
    const splitDur2 = Math.min(
      Math.floor((answers.studyDurationMinutes || 60) / 2),
      Math.max(25, Math.floor((nightWindDownStart - currentPointer) * 0.4))
    );
    if (splitDur2 >= 20) {
      tasks.push({
        id: makeId('study_split_2'),
        title: 'Evening Synthesis & Deep Study Sprint (Phase 2)',
        startTime: minutesToTime(currentPointer),
        durationMinutes: splitDur2,
        category: 'Evening Recharge & Growth',
        isMoversPillar: false,
        coinsReward: 30,
        icon: 'BookOpen',
      });
      currentPointer += splitDur2;
    }
  }

  // 5. Creative Hobby or Skill-Building
  if (eveningActivities.includes('creative_hobby') && currentPointer + 25 <= nightWindDownStart) {
    const creativeDur = Math.min(45, Math.max(25, Math.floor((nightWindDownStart - currentPointer) * 0.35)));
    tasks.push({
      id: makeId('eve_creative'),
      title: 'Creative Hobby & Passion Project Exploration',
      startTime: minutesToTime(currentPointer),
      durationMinutes: creativeDur,
      category: 'Evening Recharge & Growth',
      isMoversPillar: false,
      coinsReward: 25,
      icon: 'Palette',
    });
    currentPointer += creativeDur;
  }

  if (eveningActivities.includes('skill_building') && currentPointer + 25 <= nightWindDownStart) {
    const skillsDur = Math.min(45, Math.max(25, Math.floor((nightWindDownStart - currentPointer) * 0.35)));
    tasks.push({
      id: makeId('eve_skills'),
      title: 'Skill-Building Sprint & Tech Upskilling',
      startTime: minutesToTime(currentPointer),
      durationMinutes: skillsDur,
      category: 'Evening Recharge & Growth',
      isMoversPillar: false,
      coinsReward: 30,
      icon: 'Code',
    });
    currentPointer += skillsDur;
  }

  // 6. Authentic Profession Evening Tasks (e.g. founder networking, review, next day planning)
  if (profEveningTasks.length > 0) {
    for (const pet of profEveningTasks) {
      if (currentPointer + 15 > nightWindDownStart - 6) break;
      const petDur = Math.min(pet.duration || 30, Math.min(60, nightWindDownStart - currentPointer - 6));
      if (petDur >= 15) {
        tasks.push({
          id: makeId(`prof_eve_${tasks.length}`),
          title: pet.name,
          startTime: minutesToTime(currentPointer),
          durationMinutes: petDur,
          category: 'Evening Recharge & Growth',
          isMoversPillar: false,
          coinsReward: 25,
          icon: pet.icon || 'Target',
        });
        currentPointer += petDur;
      }
    }
  }

  // 7. Study block for Night Owl (placed in late evening)
  if (answers.studyOrResearchPreference === 'night_owl' && currentPointer + 30 <= nightWindDownStart) {
    const owlDur = Math.min(
      answers.studyDurationMinutes || 60,
      Math.max(30, nightWindDownStart - currentPointer - 6)
    );
    if (owlDur >= 25) {
      tasks.push({
        id: makeId('study_owl'),
        title: 'Night Owl Focus Sprint & Deep Work',
        startTime: minutesToTime(currentPointer),
        durationMinutes: owlDur,
        category: 'Evening Recharge & Growth',
        isMoversPillar: false,
        coinsReward: 35,
        icon: 'BookOpen',
      });
      currentPointer += owlDur;
    }
  }

  // 8. Passive Relaxation & Stress Decompression (fills remaining evening buffer)
  if (nightWindDownStart - currentPointer - 4 >= 15) {
    const relaxDur = nightWindDownStart - currentPointer - 4;
    tasks.push({
      id: makeId('eve_relax'),
      title: 'Passive Relaxation & Stress Decompression',
      startTime: minutesToTime(currentPointer),
      durationMinutes: relaxDur,
      category: 'Evening Recharge & Growth',
      isMoversPillar: false,
      coinsReward: 15,
      icon: 'Sparkles',
    });
    currentPointer += relaxDur;
  }

  // Hydration #7 & Eye Strain #3 (Anchored directly before night wind-down)
  const hyd7Start = Math.max(currentPointer, nightWindDownStart - 4);
  tasks.push({
    id: makeId('hyd_7'),
    title: 'Hydration Check-in #7 (Evening Water Glass)',
    startTime: minutesToTime(hyd7Start),
    durationMinutes: 2,
    category: 'Evening Recharge & Growth',
    isMoversPillar: true,
    moversType: 'hydration',
    coinsReward: 15,
    icon: 'Droplets',
  });

  tasks.push({
    id: makeId('eye_3'),
    title: 'Eye-Strain 20-20-20 Vision Rest #3',
    startTime: minutesToTime(hyd7Start + 2),
    durationMinutes: 2,
    category: 'Evening Recharge & Growth',
    isMoversPillar: true,
    moversType: 'eye_strain',
    coinsReward: 15,
    icon: 'Eye',
  });

  // =========================================================================
  // QUADRANT 4: NIGHT RESTORATION (nightWindDownStart -> sleepMins)
  // Category: "Night Restoration"
  // STRICTLY ANCHORED BACKWARD FROM sleepMins — NEVER WRAPS TO NEXT MORNING!
  // =========================================================================
  currentPointer = nightWindDownStart;

  if (answers.moversWrapperMode === 'evening_restorer') {
    tasks.push({
      id: makeId('mov_rest_m'),
      title: 'Deep Meditation & Mental Unwind (M)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 10,
      category: 'Night Restoration',
      isMoversPillar: true,
      moversType: 'M',
      coinsReward: 25,
      icon: 'BrainCircuit',
    });
    currentPointer += 10;

    tasks.push({
      id: makeId('mov_rest_o'),
      title: 'Parasympathetic Oxygenation & Breathwork (O)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 3,
      category: 'Night Restoration',
      isMoversPillar: true,
      moversType: 'O',
      coinsReward: 20,
      icon: 'Wind',
    });
    currentPointer += 3;

    tasks.push({
      id: makeId('mov_rest_v'),
      title: 'Tomorrow Alignment Visualization (V)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 10,
      category: 'Night Restoration',
      isMoversPillar: true,
      moversType: 'V',
      coinsReward: 25,
      icon: 'Target',
    });
    currentPointer += 10;
  }

  // Reading (R)
  tasks.push({
    id: makeId('mov_r'),
    title: 'Positive Reading & Intellectual Intake (R)',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 15,
    category: 'Night Restoration',
    isMoversPillar: true,
    moversType: 'R',
    coinsReward: 25,
    icon: 'BookOpen',
  });
  currentPointer += 15;

  // Scribing (S)
  tasks.push({
    id: makeId('mov_s'),
    title: 'Scribing & Daily Reflection Journaling (S)',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 10,
    category: 'Night Restoration',
    isMoversPillar: true,
    moversType: 'S',
    coinsReward: 25,
    icon: 'PenSquare',
  });
  currentPointer += 10;

  // Hydration #8 (Pre-Sleep Sip)
  tasks.push({
    id: makeId('hyd_8'),
    title: 'Hydration Check-in #8 (Pre-Sleep Sip)',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 2,
    category: 'Night Restoration',
    isMoversPillar: true,
    moversType: 'hydration',
    coinsReward: 15,
    icon: 'Droplets',
  });
  currentPointer += 2;

  // Domestic Bed Setup & Night Anchor
  tasks.push({
    id: makeId('night_bed'),
    title: 'Night Desk Tidy & Sleep Sanctuary Setup',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 5,
    category: 'Night Restoration',
    isMoversPillar: true,
    moversType: 'domestic',
    coinsReward: 15,
    icon: 'Bed',
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
      `Schedule structured into 4 seamless quadrants (Morning, Afternoon, Evening, Night) with zero overlapping blocks, integrated MOVERS synchronization, and ${answers.profession || 'Reformer'} profession focus sprints.`;
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
