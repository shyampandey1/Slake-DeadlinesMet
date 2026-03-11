
import {genkit} from 'genkit';
import {googleAI, gemini15Flash} from '@genkit-ai/googleai';

const apiKey = process.env.GEMINI_API_KEY;

export const ai = genkit({
  plugins: [googleAI({ apiKey, apiVersion: 'v1' })],
  model: 'googleai/gemini-2.5-flash',
});
