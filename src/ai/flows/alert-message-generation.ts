'use server';
/**
 * @fileOverview Generates an alert message summarizing flood status, location, water level, and risk.
 *
 * - generateAlertMessage - A function that generates the alert message.
 * - GenerateAlertMessageInput - The input type for the generateAlertMessage function.
 * - GenerateAlertMessageOutput - The return type for the generateAlertMessage function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateAlertMessageInputSchema = z.object({
  deviceId: z.string().describe('The unique identifier of the sensor device.'),
  status: z.enum(['Normal', 'Watch', 'Warning', 'Predicted_Flood', 'Error']).describe('The flood risk status.'),
  waterLevelCm: z.number().describe('The water level in centimeters.'),
  location: z.object({
    latitude: z.number().describe('The latitude of the sensor location.'),
    longitude: z.number().describe('The longitude of the sensor location.'),
  }).describe('The geographical location of the sensor.'),
  predictedFloodRisk: z.number().min(0).max(1).describe('The predicted flood risk score (0-1).'),
});
export type GenerateAlertMessageInput = z.infer<typeof GenerateAlertMessageInputSchema>;

const GenerateAlertMessageOutputSchema = z.object({
  alertMessage: z.string().describe('The generated alert message.'),
});
export type GenerateAlertMessageOutput = z.infer<typeof GenerateAlertMessageOutputSchema>;

export async function generateAlertMessage(input: GenerateAlertMessageInput): Promise<GenerateAlertMessageOutput> {
  return generateAlertMessageFlow(input);
}

const generateAlertMessagePrompt = ai.definePrompt({
  name: 'generateAlertMessagePrompt',
  input: {
    schema: z.object({
      deviceId: z.string().describe('The unique identifier of the sensor device.'),
      status: z.enum(['Normal', 'Watch', 'Warning', 'Predicted_Flood', 'Error']).describe('The flood risk status.'),
      waterLevelCm: z.number().describe('The water level in centimeters.'),
      location: z.object({
        latitude: z.number().describe('The latitude of the sensor location.'),
        longitude: z.number().describe('The longitude of the sensor location.'),
      }).describe('The geographical location of the sensor.'),
      predictedFloodRisk: z.number().min(0).max(1).describe('The predicted flood risk score (0-1).'),
    }),
  },
  output: {
    schema: z.object({
      alertMessage: z.string().describe('The generated alert message.'),
    }),
  },
  prompt: `Generate an alert message summarizing the flood status for device {{{deviceId}}} at location (Lat: {{{location.latitude}}}, Lng: {{{location.longitude}}}). The water level is {{{waterLevelCm}}} cm, the flood risk status is {{{status}}}, and the predicted flood risk is {{{predictedFloodRisk}}}. The alert message should be concise and informative. Use the accent color for alerts and critical information.`, // Use accent color for alerts and critical information.
});

const generateAlertMessageFlow = ai.defineFlow<
  typeof GenerateAlertMessageInputSchema,
  typeof GenerateAlertMessageOutputSchema
>({
  name: 'generateAlertMessageFlow',
  inputSchema: GenerateAlertMessageInputSchema,
  outputSchema: GenerateAlertMessageOutputSchema,
}, async (input) => {
  const {output} = await generateAlertMessagePrompt(input);
  return output!;
});
