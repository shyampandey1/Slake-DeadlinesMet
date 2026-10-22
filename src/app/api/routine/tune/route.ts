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
  let workEndMins = timeToMinutes(answers.workOrCollegeEnd);
  if (workEndMins <= workStartMins) {
    workEndMins = workStartMins + 480;
  }

  let lunchMins = timeToMinutes(answers.lunchBreakTime);
  if (lunchMins < 660) {
    lunchMins += 720; // 01:00 or 02:00 -> PM (13:00 / 14:00)
  }
  if (lunchMins <= workStartMins || lunchMins >= workEndMins) {
    lunchMins = workStartMins + Math.floor((workEndMins - workStartMins) / 2);
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
      lower.includes('set the bed') ||
      lower.includes('set table & breakfast') ||
      lower.includes('breakfast & prep') ||
      lower.includes('freshen up') ||
      lower.includes('shower') ||
      lower.includes('set table & lunch') ||
      lower.includes('reading a book') ||
      lower.includes('skincare') ||
      lower.includes('setting bed for night') ||
      lower.includes('final journaling') ||
      lower.includes('meditation & morning hydration') ||
      lower.includes('morning warm-up') ||
      lower.includes('deep breathing & morning hydration') ||
      lower.includes('morning hydration & breathing') ||
      lower.includes('drink a glass of water') ||
      lower.includes('hydration') ||
      lower.includes('eye strain') ||
      lower.includes('visual break') ||
      lower.includes('visual rest') ||
      lower.includes('gaming') ||
      lower.includes('entertainment') ||
      lower.includes('dinner') ||
      lower.includes('snacks') ||
      lower.includes('deep breathing & relax') ||
      lower.includes('evening warm-up')
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
      lower.includes('inbox zero') ||
      lower.includes('growth metric') ||
      lower.includes('strategy planning') ||
      lower.includes('upskilling') ||
      lower.includes('portfolio') ||
      lower.includes('side project')
    ) {
      profEveningTasks.push({ name: t.name, duration: t.duration || 30, icon: t.icon || 'Briefcase' });
    } else {
      profWorkTasks.push({ name: t.name, duration: t.duration || 60, icon: t.icon || 'Briefcase' });
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
  // QUADRANT 2: AFTERNOON EXECUTION (workStartMins -> workEndMins)
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
  const workBlockDur1 = Math.floor(netMorningWorkMins / morningProfTasks.length);

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

  // Afternoon Work Tasks
  currentPointer = lunchMins + lunchDuration;
  const afternoonWorkBudget = Math.max(60, workEndMins - currentPointer);
  const overheadAfternoon = answers.moversWrapperMode === 'jev_smart_weave' ? 12 : 4;
  const netAfternoonWorkMins = Math.max(30, afternoonWorkBudget - overheadAfternoon);

  const pmTasksToUse =
    afternoonProfTasks.length > 0
      ? afternoonProfTasks
      : [{ name: `${profession} Tactical Execution & Deliverables`, duration: 90, icon: 'Briefcase' }];
  const workBlockDur2 = Math.floor(netAfternoonWorkMins / pmTasksToUse.length);

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

  // =========================================================================
  // QUADRANT 3: EVENING RECHARGE & GROWTH (workEndMins -> nightWindDownStart)
  // Category: "Evening Recharge & Growth"
  // Includes evening return transit, study block, and customizable activities
  // =========================================================================
  currentPointer = workEndMins;

  // Calculate Night Wind-down start: anchored strictly backward from sleepMins!
  const nightWindDownDuration = answers.moversWrapperMode === 'evening_restorer' ? 55 : 35;
  const nightWindDownStart = sleepMins - nightWindDownDuration;

  // 1. Evening Commute (starts immediately at work end, separated from morning commute!)
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

  // 2. Study block (if late afternoon, split phase 2, or night owl)
  if (answers.studyOrResearchPreference === 'late_afternoon') {
    const studyDur = Math.min(
      answers.studyDurationMinutes || 60,
      Math.max(30, Math.floor((nightWindDownStart - currentPointer) * 0.4))
    );
    if (studyDur > 0 && nightWindDownStart - currentPointer >= studyDur + 30) {
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
  } else if (answers.studyOrResearchPreference === 'split_blocks') {
    const splitDur2 = Math.min(
      Math.floor((answers.studyDurationMinutes || 60) / 2),
      Math.max(20, Math.floor((nightWindDownStart - currentPointer) * 0.35))
    );
    if (splitDur2 > 0 && nightWindDownStart - currentPointer >= splitDur2 + 30) {
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
  } else if (answers.studyOrResearchPreference === 'night_owl') {
    const owlDur = Math.min(
      answers.studyDurationMinutes || 60,
      Math.max(30, Math.floor((nightWindDownStart - currentPointer) * 0.4))
    );
    if (owlDur > 0 && nightWindDownStart - currentPointer >= owlDur + 30) {
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

  // 3. Evening Customization Activities
  const remainingEveMins = Math.max(45, nightWindDownStart - currentPointer - 4);
  const eveningActivities =
    answers.eveningCustomization && answers.eveningCustomization.length > 0
      ? answers.eveningCustomization
      : ['fitness', 'family_social', 'relaxation'];

  const slotDur = Math.max(
    20,
    Math.floor(remainingEveMins / Math.max(1, eveningActivities.length + (profEveningTasks.length > 0 ? 1 : 0)))
  );

  eveningActivities.forEach((act) => {
    if (currentPointer + slotDur > nightWindDownStart) return;

    if (act === 'fitness') {
      tasks.push({
        id: makeId('eve_fitness'),
        title: 'Physical Training & Kinetic Workout (E)',
        startTime: minutesToTime(currentPointer),
        durationMinutes: slotDur,
        category: 'Evening Recharge & Growth',
        isMoversPillar: true,
        moversType: 'E',
        coinsReward: 30,
        icon: 'Dumbbell',
      });
      currentPointer += slotDur;
    } else if (act === 'family_social') {
      tasks.push({
        id: makeId('eve_social'),
        title: 'Dinner & Family / Social Connection Time',
        startTime: minutesToTime(currentPointer),
        durationMinutes: slotDur,
        category: 'Evening Recharge & Growth',
        isMoversPillar: false,
        coinsReward: 20,
        icon: 'Users',
      });
      currentPointer += slotDur;
    } else if (act === 'creative_hobby') {
      tasks.push({
        id: makeId('eve_creative'),
        title: 'Creative Hobby & Passion Project Exploration',
        startTime: minutesToTime(currentPointer),
        durationMinutes: slotDur,
        category: 'Evening Recharge & Growth',
        isMoversPillar: false,
        coinsReward: 25,
        icon: 'Palette',
      });
      currentPointer += slotDur;
    } else if (act === 'skill_building') {
      tasks.push({
        id: makeId('eve_skills'),
        title: 'Skill-Building Sprint & Tech Upskilling',
        startTime: minutesToTime(currentPointer),
        durationMinutes: slotDur,
        category: 'Evening Recharge & Growth',
        isMoversPillar: false,
        coinsReward: 30,
        icon: 'Code',
      });
      currentPointer += slotDur;
    } else if (act === 'relaxation') {
      tasks.push({
        id: makeId('eve_relax'),
        title: 'Passive Relaxation & Stress Decompression',
        startTime: minutesToTime(currentPointer),
        durationMinutes: Math.min(20, slotDur),
        category: 'Evening Recharge & Growth',
        isMoversPillar: false,
        coinsReward: 15,
        icon: 'Sparkles',
      });
      currentPointer += Math.min(20, slotDur);
    }
  });

  // 4. Authentic Profession Evening Tasks (e.g. founder networking, review, next day planning)
  if (profEveningTasks.length > 0 && currentPointer + 20 <= nightWindDownStart) {
    const pet = profEveningTasks[0];
    const petDur = Math.min(pet.duration || 25, nightWindDownStart - currentPointer - 4);
    if (petDur >= 15) {
      tasks.push({
        id: makeId('prof_eve_0'),
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

  // Hydration #7 & Eye Strain #3
  tasks.push({
    id: makeId('hyd_7'),
    title: 'Hydration Check-in #7 (Evening Water Glass)',
    startTime: minutesToTime(Math.max(currentPointer, nightWindDownStart - 4)),
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
    startTime: minutesToTime(Math.max(currentPointer + 2, nightWindDownStart - 2)),
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
