import { NextRequest, NextResponse } from 'next/server';
import {
  callTypeSafeSystemOne,
  createScoreQuestion,
  createNoulQuestion,
  extractJevText,
} from '@/lib/jevClient';

export interface SynergyRequestBody {
  currentUser: {
    id?: string;
    displayName?: string;
    profile?: string;
    reformerPreference?: string;
    routineTasks?: string[];
  };
  matchedPartner: {
    id: string;
    name: string;
    profession?: string;
    reformerPreference?: string;
    routineTasks?: string[];
    similarity?: number;
  };
}

export interface SynergyResponse {
  synergyScore: number;
  sharedStrength: string;
  recommendedSprintTopic: string;
  recommendedDurationMinutes: number;
  compatibilityBadge: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SynergyRequestBody;
    const { currentUser, matchedPartner } = body;

    if (!currentUser || !matchedPartner) {
      return NextResponse.json(
        { error: 'Missing currentUser or matchedPartner' },
        { status: 400 }
      );
    }

    const state = {
      currentUser: {
        name: currentUser.displayName || 'Reformer',
        profession: currentUser.profile || 'General High Performer',
        wrapper: currentUser.reformerPreference || 'morning_primer',
        tasks: currentUser.routineTasks || ['Deep Work Sprint', 'Hydration', 'Meditation'],
      },
      matchedPartner: {
        name: matchedPartner.name || 'Partner Reformer',
        profession: matchedPartner.profession || 'Specialist',
        wrapper: matchedPartner.reformerPreference || 'morning_primer',
        tasks: matchedPartner.routineTasks || ['Focused Execution', 'Oxygenation', 'Scribing'],
      },
      precomputedVectorSimilarity: matchedPartner.similarity || 0.85,
    };

    let synergyScore = Math.round((matchedPartner.similarity || 0.88) * 100);
    let sharedStrength = `Both reformers prioritize synchronized ${state.currentUser.wrapper.replace('_', ' ')} deep work rituals.`;
    let recommendedSprintTopic = `${state.currentUser.profession} & ${state.matchedPartner.profession} Synergy Sprint`;
    let recommendedDurationMinutes = 25;

    try {
      const jevResult = await callTypeSafeSystemOne({
        model: 'jev-latest',
        state,
        questions: {
          synergyScore: createScoreQuestion(
            [
              'Assess the synergistic productivity alignment between these two reformers on a scale of 0 to 100 based on their profession, MOVERS preference, and routine overlap.',
            ],
            'Rate from 0 to 100 how well their focus patterns complement each other.'
          ),
          sharedStrength: createNoulQuestion(
            'Identify the single most prominent shared strength or synchronized habit pattern between these two reformers (1 concise sentence).'
          ),
          recommendedSprintTopic: createNoulQuestion(
            'Formulate an actionable high-impact Co-Op focus sprint topic suitable for both reformers (3 to 6 words).'
          ),
          recommendedDurationMinutes: createNoulQuestion(
            'Recommend the optimal Co-Op sprint timer duration in minutes as an integer (e.g. 25, 45, or 60).'
          ),
        },
      });

      if (jevResult && jevResult.answers) {
        if (typeof jevResult.answers.synergyScore === 'number') {
          synergyScore = Math.min(100, Math.max(50, Math.round(jevResult.answers.synergyScore)));
        }
        sharedStrength = extractJevText(jevResult.answers.sharedStrength, sharedStrength);
        recommendedSprintTopic = extractJevText(jevResult.answers.recommendedSprintTopic, recommendedSprintTopic);
        const durationText = extractJevText(jevResult.answers.recommendedDurationMinutes, '');
        if (durationText) {
          const parsed = parseInt(durationText, 10);
          if (!isNaN(parsed) && parsed > 0) {
            recommendedDurationMinutes = parsed;
          }
        }
      }
    } catch (jevErr) {
      console.warn('[SynergyRoute] JEV SystemOne fallback active:', jevErr);
    }

    const formatPreference = (pref?: string) => {
      if (!pref) return 'Flexible Focus Sessions';
      const clean = pref.toLowerCase().replace(/_/g, ' ');
      if (clean.includes('morning')) return 'Prefers Morning Focus Sessions';
      if (clean.includes('evening')) return 'Prefers Evening Focus Sessions';
      return 'Prefers Synchronized Focus Sessions';
    };

    const compatibilityBadge = `${synergyScore}% Routine Match • ${formatPreference(state.matchedPartner.wrapper)}`;

    const responsePayload: SynergyResponse = {
      synergyScore,
      sharedStrength,
      recommendedSprintTopic,
      recommendedDurationMinutes,
      compatibilityBadge,
    };

    return NextResponse.json(responsePayload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
