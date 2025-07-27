'use server';
/**
 * @fileOverview A flow to get location data from coordinates.
 *
 * - getLocationFromCoords - A function that returns city and country from lat/long.
 * - GetLocationFromCoordsInput - The input type for the function.
 * - GetLocationFromCoordsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetLocationFromCoordsInputSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});
export type GetLocationFromCoordsInput = z.infer<typeof GetLocationFromCoordsInputSchema>;

const GetLocationFromCoordsOutputSchema = z.object({
  city: z.string().describe('The city name.'),
  country: z.string().describe('The country name.'),
  weather: z.object({
    temp: z.number().describe('The temperature in Celsius.'),
    description: z.string().describe('A brief weather description.'),
  }),
});
export type GetLocationFromCoordsOutput = z.infer<typeof GetLocationFromCoordsOutputSchema>;

export async function getLocationFromCoords(input: GetLocationFromCoordsInput): Promise<GetLocationFromCoordsOutput> {
  return getLocationFromCoordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getLocationFromCoordsPrompt',
  input: {schema: GetLocationFromCoordsInputSchema},
  output: {schema: GetLocationFromCoordsOutputSchema},
  prompt: `You are a helpful assistant that converts geographic coordinates into a location and provides the current weather.

  Based on the provided latitude and longitude, identify the city and country. Then, provide a simple, one-word weather description (e.g., "Cloudy", "Sunny", "Rainy") and the current temperature in Celsius.

  Latitude: {{{latitude}}}
  Longitude: {{{longitude}}}
  `,
});

const getLocationFromCoordsFlow = ai.defineFlow(
  {
    name: 'getLocationFromCoordsFlow',
    inputSchema: GetLocationFromCoordsInputSchema,
    outputSchema: GetLocationFromCoordsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
