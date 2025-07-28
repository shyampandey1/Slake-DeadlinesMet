
'use server';
/**
 * @fileOverview A flow to get the weather for a given location.
 *
 * - getWeatherForLocation - A function that gets the weather.
 * - GetWeatherForLocationInput - The input type for the getWeatherForLocation function.
 * - GetWeatherForLocationOutput - The return type for the getWeatherForLocation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getWeather } from 'genkitx-weather';


const GetWeatherForLocationInputSchema = z.object({
    latitude: z.number().describe('The latitude of the location.'),
    longitude: z.number().describe('The longitude of the location.'),
});
export type GetWeatherForLocationInput = z.infer<typeof GetWeatherForLocationInputSchema>;

const GetWeatherForLocationOutputSchema = z.object({
    location: z.string().describe('The city and state of the location.'),
    temperature: z.number().describe('The current temperature in Celsius.'),
    condition: z.string().describe('The current weather condition.'),
    icon: z.string().describe('An icon representing the current weather condition.'),
});
export type GetWeatherForLocationOutput = z.infer<typeof GetWeatherForLocationOutputSchema>;

export async function getWeatherForLocation(input: GetWeatherForLocationInput): Promise<GetWeatherForLocationOutput> {
    return getWeatherForLocationFlow(input);
}


const getWeatherForLocationFlow = ai.defineFlow(
    {
        name: 'getWeatherForLocationFlow',
        inputSchema: GetWeatherForLocationInputSchema,
        outputSchema: GetWeatherForLocationOutputSchema,
    },
    async (input) => {
        const weather = await getWeather({
            location: `${input.latitude},${input.longitude}`
        });

        if (!weather) {
            throw new Error('Could not get weather for location.');
        }

        return {
            location: weather.location,
            temperature: weather.temperature,
            condition: weather.condition,
            icon: weather.icon,
        };
    }
);

