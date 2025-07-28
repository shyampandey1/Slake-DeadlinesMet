'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-motivational-message.ts';
import '@/ai/flows/get-music-vibe';
import '@/ai/flows/get-location-from-coords';
import '@/ai/flows/get-music-library';
