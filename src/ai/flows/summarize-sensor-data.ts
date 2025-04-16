'use server';
/**
 * @fileOverview Summarizes sensor data and provides a risk assessment.
 *
 * - summarizeSensorData - A function that summarizes sensor data and assesses flood risk.
 * - SummarizeSensorDataInput - The input type for the summarizeSensorData function.
 * - SummarizeSensorDataOutput - The return type for the summarizeSensorData function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {getWeather, Weather} from '@/services/weather';

const SummarizeSensorDataInputSchema = z.object({
  deviceId: z.string().describe('The ID of the sensor device.'),
  waterLevel_cm: z.number().describe('The water level in centimeters.'),
  rainDetected: z.boolean().describe('Whether rain is detected or not.'),
  turbidity_ntu: z.number().describe('The turbidity in NTU.'),
  temperature_c: z.number().describe('The temperature in Celsius.'),
  humidity_percent: z.number().describe('The humidity percentage.'),
  pressure_hpa: z.number().describe('The pressure in hPa.'),
  location: z.object({
    latitude: z.number().describe('The latitude of the sensor location.'),
    longitude: z.number().describe('The longitude of the sensor location.'),
  }).describe('The location of the sensor.'),
});
export type SummarizeSensorDataInput = z.infer<typeof SummarizeSensorDataInputSchema>;

const SummarizeSensorDataOutputSchema = z.object({
  summary: z.string().describe('A summary of the sensor data and flood risk assessment.'),
  status: z.string().describe('The flood risk status (Normal, Watch, Warning, Predicted_Flood).'),
});
export type SummarizeSensorDataOutput = z.infer<typeof SummarizeSensorDataOutputSchema>;

export async function summarizeSensorData(input: SummarizeSensorDataInput): Promise<SummarizeSensorDataOutput> {
  return summarizeSensorDataFlow(input);
}

const summarizeSensorDataPrompt = ai.definePrompt({
  name: 'summarizeSensorDataPrompt',
  input: {
    schema: z.object({
      deviceId: z.string().describe('The ID of the sensor device.'),
      waterLevel_cm: z.number().describe('The water level in centimeters.'),
      rainDetected: z.boolean().describe('Whether rain is detected or not.'),
      turbidity_ntu: z.number().describe('The turbidity in NTU.'),
      temperature_c: z.number().describe('The temperature in Celsius.'),
      humidity_percent: z.number().describe('The humidity percentage.'),
      pressure_hpa: z.number().describe('The pressure in hPa.'),
      location: z.object({
        latitude: z.number().describe('The latitude of the sensor location.'),
        longitude: z.number().describe('The longitude of the sensor location.'),
      }).describe('The location of the sensor.'),
      weather: z.object({
        temperatureCelsius: z.number().describe('The temperature in Celsius.'),
        rainfallMillimeters: z.number().describe('The amount of rainfall in millimeters.'),
      }).describe('The current weather conditions.'),
      floodRiskStatus: z.string().describe('The flood risk status.'),
      floodRiskReasoning: z.string().describe('The reasoning behind the flood risk status.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('A summary of the sensor data and flood risk assessment.'),
      status: z.string().describe('The flood risk status.'),
    }),
  },
  prompt: `Here is the sensor data for device ID {{{deviceId}}}:\nWater level: {{{waterLevel_cm}}} cm\nRain detected: {{{rainDetected}}}\nTurbidity: {{{turbidity_ntu}}} NTU\nTemperature: {{{temperature_c}}} C\nHumidity: {{{humidity_percent}}}%\nPressure: {{{pressure_hpa}}} hPa\n\nThe current weather conditions are:\nTemperature: {{{weather.temperatureCelsius}}} C\nRainfall: {{{weather.rainfallMillimeters}}} mm\n\nFlood Risk Status: {{{floodRiskStatus}}}\nReasoning: {{{floodRiskReasoning}}}\n\nSummarize the sensor data and flood risk assessment in a concise sentence or two for a popup display.  Be very brief.\nReturn the flood risk status in the output.\n`,
});

const summarizeSensorDataFlow = ai.defineFlow<
  typeof SummarizeSensorDataInputSchema,
  typeof SummarizeSensorDataOutputSchema
>({
  name: 'summarizeSensorDataFlow',
  inputSchema: SummarizeSensorDataInputSchema,
  outputSchema: SummarizeSensorDataOutputSchema,
}, async (input) => {
  const weather: Weather = await getWeather(input.location);

  const {output} = await summarizeSensorDataPrompt({
    ...input,
    weather: weather,
    floodRiskStatus: 'Normal',
    floodRiskReasoning: 'No risk',
  });

  output!.status = 'Normal';
  return output!;
});
