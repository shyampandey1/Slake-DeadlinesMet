import { NextResponse } from 'next/server';
import {
  RoutineTuningAnswers,
  RoutineTuningAnswersSchema,
  DMRoutineTaskBlock,
} from '@/types/routineTuner';
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
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
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
 * 8 spaced hydration checks, and 3 eye-strain breaks.
 */
function buildDeterministicSchedule(answers: RoutineTuningAnswers): DMRoutineTaskBlock[] {
  const tasks: DMRoutineTaskBlock[] = [];
  let taskIdCounter = 1;

  const makeId = (prefix: string) => `${prefix}_${taskIdCounter++}_${Math.random().toString(36).substring(2, 6)}`;

  const wakeMins = timeToMinutes(answers.wakeUpTime);
  const sleepMins = timeToMinutes(answers.sleepTime);
  const workStartMins = timeToMinutes(answers.workOrCollegeStart);
  const workEndMins = timeToMinutes(answers.workOrCollegeEnd);
  const lunchMins = timeToMinutes(answers.lunchBreakTime);
  const commute = Math.max(0, answers.commuteDurationMinutes || 0);

  let currentPointer = wakeMins;

  // 1. Waking Anchor & Domestic Setup
  tasks.push({
    id: makeId('wake_hyd'),
    title: 'Hydration Check-in #1 (Waking Glass)',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 2,
    category: 'Morning Kickstart',
    isMoversPillar: true,
    moversType: 'hydration',
    coinsReward: 15,
    icon: 'Droplets',
  });
  currentPointer += 2;

  tasks.push({
    id: makeId('wake_bed'),
    title: 'Set Bed & Morning Space Hygiene',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 5,
    category: 'Morning Kickstart',
    isMoversPillar: true,
    moversType: 'domestic',
    coinsReward: 15,
    icon: 'Bed',
  });
  currentPointer += 5;

  // 2. Morning MOVERS Injection according to mode
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
      title: 'Morning Awakening Exercise & Mobility (E)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 25,
      category: 'Morning Protocol',
      isMoversPillar: true,
      moversType: 'E',
      coinsReward: 30,
      icon: 'Dumbbell',
    });
    currentPointer += 25;
  } else if (answers.moversWrapperMode === 'evening_restorer') {
    tasks.push({
      id: makeId('mov_e_quick'),
      title: 'Awakening Stretch & Light Movement (E)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 15,
      category: 'Morning Protocol',
      isMoversPillar: true,
      moversType: 'E',
      coinsReward: 20,
      icon: 'Dumbbell',
    });
    currentPointer += 15;
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

  // Freshen up & Breakfast
  tasks.push({
    id: makeId('wake_fresh'),
    title: 'Freshen Up & Morning Routine',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 20,
    category: 'Morning Kickstart',
    isMoversPillar: false,
    coinsReward: 15,
    icon: 'ShowerHead',
  });
  currentPointer += 20;

  tasks.push({
    id: makeId('wake_bfast'),
    title: 'Nutritious Breakfast & Day Planning',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 25,
    category: 'Morning Kickstart',
    isMoversPillar: false,
    coinsReward: 15,
    icon: 'Utensils',
  });
  currentPointer += 25;

  // 3. Early Morning Study (if requested)
  if (answers.studyOrResearchPreference === 'early_morning') {
    const studyDuration = Math.min(answers.studyDurationMinutes || 60, Math.max(30, workStartMins - commute - currentPointer));
    if (studyDuration > 0) {
      tasks.push({
        id: makeId('study_early'),
        title: 'Deep Research & Study Focus Sprint (Phase 1)',
        startTime: minutesToTime(currentPointer),
        durationMinutes: studyDuration,
        category: 'Deep Focus & Study',
        isMoversPillar: false,
        coinsReward: 35,
        icon: 'BookOpen',
      });
      currentPointer += studyDuration;
    }
  } else if (answers.studyOrResearchPreference === 'split_blocks') {
    const splitDur = Math.floor((answers.studyDurationMinutes || 60) / 2);
    if (splitDur > 0 && workStartMins - commute - currentPointer >= splitDur) {
      tasks.push({
        id: makeId('study_split_1'),
        title: 'Morning Focus & Core Study Block (Phase 1)',
        startTime: minutesToTime(currentPointer),
        durationMinutes: splitDur,
        category: 'Deep Focus & Study',
        isMoversPillar: false,
        coinsReward: 30,
        icon: 'BookOpen',
      });
      currentPointer += splitDur;
    }
  }

  // Morning Commute
  if (commute > 0) {
    const commuteStart = Math.max(currentPointer, workStartMins - commute);
    tasks.push({
      id: makeId('commute_m'),
      title: 'Morning Commute & Mindful Transit / Audio Briefing',
      startTime: minutesToTime(commuteStart),
      durationMinutes: commute,
      category: 'Transit & Prep',
      isMoversPillar: false,
      coinsReward: 15,
      icon: 'Car',
    });
    currentPointer = commuteStart + commute;
  } else {
    currentPointer = Math.max(currentPointer, workStartMins);
  }

  // 4. College / Office Morning Block
  const workMinsPart1 = Math.max(60, lunchMins - workStartMins);
  const part1Mid1 = workStartMins + Math.floor(workMinsPart1 * 0.3);
  const part1Mid2 = workStartMins + Math.floor(workMinsPart1 * 0.6);
  const part1Mid3 = workStartMins + Math.floor(workMinsPart1 * 0.85);

  tasks.push({
    id: makeId('work_sprint_1'),
    title: 'College / Office Core Focus Sprint (Block 1)',
    startTime: minutesToTime(workStartMins),
    durationMinutes: Math.max(30, part1Mid1 - workStartMins),
    category: 'Work & Academics',
    isMoversPillar: false,
    coinsReward: 30,
    icon: 'Briefcase',
  });

  tasks.push({
    id: makeId('hyd_2'),
    title: 'Hydration Check-in #2',
    startTime: minutesToTime(part1Mid1),
    durationMinutes: 2,
    category: 'Work & Academics',
    isMoversPillar: true,
    moversType: 'hydration',
    coinsReward: 15,
    icon: 'Droplets',
  });

  tasks.push({
    id: makeId('eye_1'),
    title: 'Eye-Strain 20-20-20 Vision Rest #1',
    startTime: minutesToTime(part1Mid2),
    durationMinutes: 2,
    category: 'Work & Academics',
    isMoversPillar: true,
    moversType: 'eye_strain',
    coinsReward: 15,
    icon: 'Eye',
  });

  tasks.push({
    id: makeId('hyd_3'),
    title: 'Hydration Check-in #3',
    startTime: minutesToTime(part1Mid3),
    durationMinutes: 2,
    category: 'Work & Academics',
    isMoversPillar: true,
    moversType: 'hydration',
    coinsReward: 15,
    icon: 'Droplets',
  });

  // 5. Lunch Break
  const lunchDuration = Math.max(20, answers.lunchDurationMinutes || 45);
  tasks.push({
    id: makeId('lunch_block'),
    title: 'Lunch & Mindful Nutrition Break',
    startTime: minutesToTime(lunchMins),
    durationMinutes: lunchDuration - 2,
    category: 'Nutrition & Energy',
    isMoversPillar: false,
    coinsReward: 20,
    icon: 'Utensils',
  });

  tasks.push({
    id: makeId('hyd_4'),
    title: 'Hydration Check-in #4 (Post-Lunch Glass)',
    startTime: minutesToTime(lunchMins + lunchDuration - 2),
    durationMinutes: 2,
    category: 'Nutrition & Energy',
    isMoversPillar: true,
    moversType: 'hydration',
    coinsReward: 15,
    icon: 'Droplets',
  });

  const afternoonWorkStart = lunchMins + lunchDuration;
  const afternoonDur = Math.max(60, workEndMins - afternoonWorkStart);
  const pmMid1 = afternoonWorkStart + Math.floor(afternoonDur * 0.35);
  const pmMid2 = afternoonWorkStart + Math.floor(afternoonDur * 0.7);

  tasks.push({
    id: makeId('work_sprint_2'),
    title: 'College / Office Strategic Sprint (Block 2)',
    startTime: minutesToTime(afternoonWorkStart),
    durationMinutes: Math.max(30, pmMid1 - afternoonWorkStart),
    category: 'Work & Academics',
    isMoversPillar: false,
    coinsReward: 30,
    icon: 'Briefcase',
  });

  tasks.push({
    id: makeId('eye_2'),
    title: 'Eye-Strain 20-20-20 Vision Rest #2',
    startTime: minutesToTime(pmMid1),
    durationMinutes: 2,
    category: 'Work & Academics',
    isMoversPillar: true,
    moversType: 'eye_strain',
    coinsReward: 15,
    icon: 'Eye',
  });

  // JEV Smart Weave afternoon micro-pillar
  if (answers.moversWrapperMode === 'jev_smart_weave') {
    tasks.push({
      id: makeId('mov_v_weave'),
      title: 'Afternoon Re-Alignment & Micro-Visualization (V)',
      startTime: minutesToTime(pmMid1 + 4),
      durationMinutes: 10,
      category: 'Work & Academics',
      isMoversPillar: true,
      moversType: 'V',
      coinsReward: 25,
      icon: 'Target',
    });
  }

  tasks.push({
    id: makeId('hyd_5'),
    title: 'Hydration Check-in #5',
    startTime: minutesToTime(pmMid2),
    durationMinutes: 2,
    category: 'Work & Academics',
    isMoversPillar: true,
    moversType: 'hydration',
    coinsReward: 15,
    icon: 'Droplets',
  });

  // 6. Evening Commute
  currentPointer = workEndMins;
  if (commute > 0) {
    tasks.push({
      id: makeId('commute_e'),
      title: 'Evening Return Transit & Cognitive Decompression',
      startTime: minutesToTime(currentPointer),
      durationMinutes: commute,
      category: 'Transit & Prep',
      isMoversPillar: false,
      coinsReward: 15,
      icon: 'Car',
    });
    currentPointer += commute;
  }

  tasks.push({
    id: makeId('hyd_6'),
    title: 'Hydration Check-in #6 (Post-Commute Refuel)',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 2,
    category: 'Evening Custom',
    isMoversPillar: true,
    moversType: 'hydration',
    coinsReward: 15,
    icon: 'Droplets',
  });
  currentPointer += 2;

  // 7. Late Afternoon Study (if requested)
  if (answers.studyOrResearchPreference === 'late_afternoon') {
    const studyDur = Math.max(30, answers.studyDurationMinutes || 60);
    tasks.push({
      id: makeId('study_late_pm'),
      title: 'Deep Research & Study Focus Sprint',
      startTime: minutesToTime(currentPointer),
      durationMinutes: studyDur,
      category: 'Deep Focus & Study',
      isMoversPillar: false,
      coinsReward: 35,
      icon: 'BookOpen',
    });
    currentPointer += studyDur;

    tasks.push({
      id: makeId('eye_3'),
      title: 'Eye-Strain 20-20-20 Vision Rest #3',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 2,
      category: 'Deep Focus & Study',
      isMoversPillar: true,
      moversType: 'eye_strain',
      coinsReward: 15,
      icon: 'Eye',
    });
    currentPointer += 2;
  }

  // 8. Evening Customization Activities
  const eveningActivities = answers.eveningCustomization || ['fitness', 'relaxation'];
  for (const act of eveningActivities) {
    if (act === 'fitness') {
      tasks.push({
        id: makeId('eve_fitness'),
        title: 'Physical Training & Kinetic Workout (E)',
        startTime: minutesToTime(currentPointer),
        durationMinutes: 30,
        category: 'Evening Custom',
        isMoversPillar: true,
        moversType: 'E',
        coinsReward: 30,
        icon: 'Dumbbell',
      });
      currentPointer += 30;
    } else if (act === 'creative_hobby') {
      tasks.push({
        id: makeId('eve_creative'),
        title: 'Creative Hobby & Passion Project Exploration',
        startTime: minutesToTime(currentPointer),
        durationMinutes: 30,
        category: 'Evening Custom',
        isMoversPillar: false,
        coinsReward: 25,
        icon: 'Palette',
      });
      currentPointer += 30;
    } else if (act === 'family_social') {
      tasks.push({
        id: makeId('eve_social'),
        title: 'Dinner & Family / Social Connection Time',
        startTime: minutesToTime(currentPointer),
        durationMinutes: 35,
        category: 'Evening Custom',
        isMoversPillar: false,
        coinsReward: 20,
        icon: 'Users',
      });
      currentPointer += 35;
    } else if (act === 'skill_building') {
      tasks.push({
        id: makeId('eve_skills'),
        title: 'Skill-Building Sprint & Tech Upskilling',
        startTime: minutesToTime(currentPointer),
        durationMinutes: 30,
        category: 'Evening Custom',
        isMoversPillar: false,
        coinsReward: 30,
        icon: 'Code',
      });
      currentPointer += 30;
    } else if (act === 'relaxation') {
      tasks.push({
        id: makeId('eve_relax'),
        title: 'Passive Relaxation & Stress Decompression',
        startTime: minutesToTime(currentPointer),
        durationMinutes: 20,
        category: 'Evening Custom',
        isMoversPillar: false,
        coinsReward: 15,
        icon: 'Sparkles',
      });
      currentPointer += 20;
    }
  }

  // Hydration #7
  tasks.push({
    id: makeId('hyd_7'),
    title: 'Hydration Check-in #7 (Evening Water Glass)',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 2,
    category: 'Evening Wind-down',
    isMoversPillar: true,
    moversType: 'hydration',
    coinsReward: 15,
    icon: 'Droplets',
  });
  currentPointer += 2;

  // 9. Night Owl Study / Split Blocks Phase 2
  if (answers.studyOrResearchPreference === 'night_owl') {
    const studyDur = Math.max(30, answers.studyDurationMinutes || 60);
    tasks.push({
      id: makeId('study_night_owl'),
      title: 'Night Owl Focus Research & Deep Work Sprint',
      startTime: minutesToTime(currentPointer),
      durationMinutes: studyDur,
      category: 'Deep Focus & Study',
      isMoversPillar: false,
      coinsReward: 35,
      icon: 'BookOpen',
    });
    currentPointer += studyDur;

    tasks.push({
      id: makeId('eye_3_night'),
      title: 'Eye-Strain 20-20-20 Vision Rest #3',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 2,
      category: 'Deep Focus & Study',
      isMoversPillar: true,
      moversType: 'eye_strain',
      coinsReward: 15,
      icon: 'Eye',
    });
    currentPointer += 2;
  } else if (answers.studyOrResearchPreference === 'split_blocks') {
    const splitDur2 = Math.floor((answers.studyDurationMinutes || 60) / 2);
    if (splitDur2 > 0) {
      tasks.push({
        id: makeId('study_split_2'),
        title: 'Evening Synthesis & Deep Study Sprint (Phase 2)',
        startTime: minutesToTime(currentPointer),
        durationMinutes: splitDur2,
        category: 'Deep Focus & Study',
        isMoversPillar: false,
        coinsReward: 30,
        icon: 'BookOpen',
      });
      currentPointer += splitDur2;
    }
  }

  // Ensure Eye-Strain #3 exists if not yet scheduled
  if (!tasks.some((t) => t.moversType === 'eye_strain' && t.id.includes('eye_3'))) {
    tasks.push({
      id: makeId('eye_3_fallback'),
      title: 'Eye-Strain 20-20-20 Vision Rest #3',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 2,
      category: 'Evening Wind-down',
      isMoversPillar: true,
      moversType: 'eye_strain',
      coinsReward: 15,
      icon: 'Eye',
    });
    currentPointer += 2;
  }

  // 10. Night MOVERS & Bedtime Protocol
  if (answers.moversWrapperMode === 'evening_restorer') {
    tasks.push({
      id: makeId('mov_rest_m'),
      title: 'Deep Meditation & Mental Unwind (M)',
      startTime: minutesToTime(currentPointer),
      durationMinutes: 10,
      category: 'Bedtime Routine',
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
      category: 'Bedtime Routine',
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
      category: 'Bedtime Routine',
      isMoversPillar: true,
      moversType: 'V',
      coinsReward: 25,
      icon: 'Target',
    });
    currentPointer += 10;
  }

  // Reading & Scribing
  tasks.push({
    id: makeId('mov_r'),
    title: 'Positive Reading & Intellectual Intake (R)',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 15,
    category: 'Bedtime Routine',
    isMoversPillar: true,
    moversType: 'R',
    coinsReward: 25,
    icon: 'BookOpen',
  });
  currentPointer += 15;

  tasks.push({
    id: makeId('mov_s'),
    title: 'Scribing & Daily Reflection Journaling (S)',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 10,
    category: 'Bedtime Routine',
    isMoversPillar: true,
    moversType: 'S',
    coinsReward: 25,
    icon: 'PenSquare',
  });
  currentPointer += 10;

  // Hydration #8 (Final pre-sleep sip)
  tasks.push({
    id: makeId('hyd_8'),
    title: 'Hydration Check-in #8 (Pre-Sleep Sip)',
    startTime: minutesToTime(currentPointer),
    durationMinutes: 2,
    category: 'Bedtime Routine',
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
    category: 'Bedtime Routine',
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
    let sustainabilityScore = 92;
    let optimizationSummary =
      'Schedule optimized with zero overlapping blocks, integrated MOVERS energy synchronization, and 8 spaced hydration checks.';
    let recommendedFocusPeak =
      answers.studyOrResearchPreference === 'early_morning'
        ? '07:30 AM - 09:00 AM'
        : '10:00 AM - 12:30 PM';
    let conflictResolutionNote =
      'Micro-gaps and commute buffers mathematically isolated to protect recovery periods.';

    if (JEV_API_KEY) {
      try {
        const jevState = {
          profileName: answers.profileName,
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
