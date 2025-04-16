'use server';
/**
 * @fileOverview Generates an informative alert message summarizing flood status,
 * sensor readings, and location.
 *
 * - generateInformativeAlertMessage - A function that generates the alert message.
 * - GenerateInformativeAlertMessageInput - The input type for the generateInformativeAlertMessage function.
 * - GenerateInformativeAlertMessageOutput - The return type for the generateInformativeAlertMessage function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateInformativeAlertMessageInputSchema = z.object({
  deviceId: z.string().describe('The unique identifier of the sensor device.'),
  status: z.enum(['Normal', 'Watch', 'Warning', 'Predicted_Flood', 'Error']).describe('The flood risk status.'),
  waterLevelCm: z.number().describe('The water level in centimeters.'),
  rainDetected: z.boolean().describe('Whether rain is detected by the sensor.'),
  turbidityNtu: z.number().describe('The turbidity of the water in NTU.'),
  temperatureC: z.number().describe('The temperature in Celsius.'),
  humidityPercent: z.number().describe('The humidity percentage.'),
  pressureHpa: z.number().describe('The pressure in Hectopascals.'),
  location: z.object({
    latitude: z.number().describe('The latitude of the sensor location.'),
    longitude: z.number().describe('The longitude of the sensor location.'),
  }).describe('The geographical location of the sensor.'),
  predictedFloodRisk: z.number().min(0).max(1).describe('The predicted flood risk score (0-1).'),
});
export type GenerateInformativeAlertMessageInput = z.infer<typeof GenerateInformativeAlertMessageInputSchema>;

const GenerateInformativeAlertMessageOutputSchema = z.object({
  alertMessage: z.string().describe('The generated informative alert message.'),
});
export type GenerateInformativeAlertMessageOutput = z.infer<typeof GenerateInformativeAlertMessageOutputSchema>;

export async function generateInformativeAlertMessage(input: GenerateInformativeAlertMessageInput): Promise<GenerateInformativeAlertMessageOutput> {
  return generateInformativeAlertMessageFlow(input);
}

const generateInformativeAlertMessagePrompt = ai.definePrompt({
  name: 'generateInformativeAlertMessagePrompt',
  input: {
    schema: z.object({
      deviceId: z.string().describe('The unique identifier of the sensor device.'),
      status: z.enum(['Normal', 'Watch', 'Warning', 'Predicted_Flood', 'Error']).describe('The flood risk status.'),
      waterLevelCm: z.number().describe('The water level in centimeters.'),
      rainDetected: z.boolean().describe('Whether rain is detected by the sensor.'),
      turbidityNtu: z.number().describe('The turbidity of the water in NTU.'),
      temperatureC: z.number().describe('The temperature in Celsius.'),
      humidityPercent: z.number().describe('The humidity percentage.'),
      pressureHpa: z.number().describe('The pressure in Hectopascals.'),
      location: z.object({
        latitude: z.number().describe('The latitude of the sensor location.'),
        longitude: z.number().describe('The longitude of the sensor location.'),
      }).describe('The geographical location of the sensor.'),
      predictedFloodRisk: z.number().min(0).max(1).describe('The predicted flood risk score (0-1).'),
    }),
  },
  output: {
    schema: z.object({
      alertMessage: z.string().describe('The generated informative alert message.'),
    }),
  },
  prompt: `Generate an informative alert message summarizing the flood status for device {{{deviceId}}} at location (Lat: {{{location.latitude}}}, Lng: {{{location.longitude}}}).\nInclude sensor readings such as water level ({{{waterLevelCm}}} cm), rain detected ({{{rainDetected}}}), turbidity ({{{turbidityNtu}}} NTU), temperature ({{{temperatureC}}} °C), humidity ({{{humidityPercent}}}%), and pressure ({{{pressureHpa}}} hPa).\nThe flood risk status is {{{status}}}, and the predicted flood risk is {{{predictedFloodRisk}}}. The alert message should be concise, informative, and actionable. Use the accent color for alerts and critical information.\n`,
});

const generateInformativeAlertMessageFlow = ai.defineFlow<
  typeof GenerateInformativeAlertMessageInputSchema,
  typeof GenerateInformativeAlertMessageOutputSchema
>({
  name: 'generateInformativeAlertMessageFlow',
  inputSchema: GenerateInformativeAlertMessageInputSchema,
  outputSchema: GenerateInformativeAlertMessageOutputSchema,
}, async (input) => {
  const {output} = await generateInformativeAlertMessagePrompt(input);
  return output!;
});
