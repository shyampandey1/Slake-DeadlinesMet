'use server';
/**
 * @fileOverview A weather-fetching AI agent.
 *
 * - getWeather - A function that fetches weather information.
 * - GetWeatherInput - The input type for the getWeather function.
 * - GetWeatherOutput - The return type for the getWeather function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {retriever} from 'genkitx-weather';

const GetWeatherInputSchema = z.object({
  location: z.string().describe('The location to get the weather for.'),
});
export type GetWeatherInput = z.infer<typeof GetWeatherInputSchema>;

const GetWeatherOutputSchema = z.object({
  temperature: z.number().describe('The temperature in Celsius.'),
  description: z.string().describe('A short description of the weather.'),
  icon: z.string().describe('An emoji representing the weather.'),
});
export type GetWeatherOutput = z.infer<typeof GetWeatherOutputSchema>;

const getWeatherTool = ai.defineTool(
  {
    name: 'getWeather',
    description: 'Get the current weather for a location.',
    inputSchema: GetWeatherInputSchema,
    outputSchema: GetWeatherOutputSchema,
  },
  async (input) => {
    const response = await retriever.retrieve({
      content: `What is the weather in ${input.location}?`,
    });
    const weatherData = response[0].content[0].data as any;
    // Simplified mapping, you might need to adjust based on actual API response
    return {
      temperature: weatherData.temperature,
      description: weatherData.condition,
      icon: weatherData.icon,
    };
  }
);


export async function getWeather(input: GetWeatherInput): Promise<GetWeatherOutput> {
  return getWeatherFlow(input);
}


const prompt = ai.definePrompt({
  name: 'getWeatherPrompt',
  input: {schema: GetWeatherInputSchema},
  output: {schema: GetWeatherOutputSchema},
  tools: [getWeatherTool],
  prompt: `Get the weather for {{location}}`,
});

const getWeatherFlow = ai.defineFlow(
  {
    name: 'getWeatherFlow',
    inputSchema: GetWeatherInputSchema,
    outputSchema: GetWeatherOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
