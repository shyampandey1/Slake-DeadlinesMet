
'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-motivational-message.ts';
import '@/ai/flows/get-music-vibe';
import '@/ai/flows/get-music-library';
import '@/ai/flows/suggest-task-details';
import '@/ai/flows/organize-routine';
import '@/ai/flows/categorize-task';

    