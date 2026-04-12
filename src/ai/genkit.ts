
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const apiKey = process.env.GEMINI_API_KEY;

export const ai = genkit({
  plugins: [googleAI({ apiKey, apiVersion: 'v1beta' })],
  model: 'googleai/gemini-1.5-flash',
});
