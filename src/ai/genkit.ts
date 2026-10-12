/**
 * @fileOverview Unified AI entry point redirecting legacy references to JEV TypeSafe SystemOne.
 * Zero Genkit dependencies remain in the production runtime.
 */

export {
  callTypeSafeSystemOne,
  createChoiceQuestion,
  createScoreQuestion,
  createNoulQuestion,
  JEV_MODEL,
  JEV_API_BASE_URL,
} from '@/lib/jevClient';
