'use server';
/**
 * @fileOverview Determines flood risk status based on sensor readings and weather data using LLM reasoning.
 *
 * - floodRiskAssessment - A function that assesses the flood risk.
 * - FloodRiskAssessmentInput - The input type for the floodRiskAssessment function.
 * - FloodRiskAssessmentOutput - The return type for the floodRiskAssessment function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {getWeather, Location} from '@/services/weather';

const FloodRiskAssessmentInputSchema = z.object({
  deviceId: z.string().describe('The unique identifier of the sensor device.'),
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
});
export type FloodRiskAssessmentInput = z.infer<typeof FloodRiskAssessmentInputSchema>;

const FloodRiskAssessmentOutputSchema = z.object({
  status: z.enum(['Normal', 'Watch', 'Warning', 'Predicted_Flood', 'Error']).describe('The flood risk status.'),
  predictedFloodRisk: z.number().min(0).max(1).describe('The predicted flood risk score (0-1).'),
  alertMessage: z.string().optional().describe('A message to display to the user about the alert.'),
});
export type FloodRiskAssessmentOutput = z.infer<typeof FloodRiskAssessmentOutputSchema>;

export async function floodRiskAssessment(input: FloodRiskAssessmentInput): Promise<FloodRiskAssessmentOutput> {
  return floodRiskAssessmentFlow(input);
}

const floodRiskAssessmentPrompt = ai.definePrompt({
  name: 'floodRiskAssessmentPrompt',
  input: {
    schema: z.object({
      deviceId: z.string().describe('The unique identifier of the sensor device.'),
      waterLevelCm: z.number().describe('The water level in centimeters.'),
      rainDetected: z.boolean().describe('Whether rain is detected by the sensor.'),
      turbidityNtu: z.number().describe('The turbidity of the water in NTU.'),
      temperatureC: z.number().describe('The temperature in Celsius.'),
      humidityPercent: z.number().describe('The humidity percentage.'),
      pressureHpa: z.number().describe('The pressure in Hectopascals.'),
      rainfallMillimeters: z.number().describe('The current rainfall in millimeters.'),
      temperatureCelsius: z.number().describe('The current temperature in Celsius.'),
      location: z.object({
        latitude: z.number().describe('The latitude of the sensor location.'),
        longitude: z.number().describe('The longitude of the sensor location.'),
      }).describe('The geographical location of the sensor.'),
    }),
  },
  output: {
    schema: z.object({
      status: z.enum(['Normal', 'Watch', 'Warning', 'Predicted_Flood', 'Error']).describe('The flood risk status.'),
      predictedFloodRisk: z.number().min(0).max(1).describe('The predicted flood risk score (0-1).'),
      alertMessage: z.string().optional().describe('A message to display to the user about the alert.'),
    }),
  },
  prompt: `Given the following sensor data and weather information for device ID {{{deviceId}}} at location (Lat: {{{location.latitude}}}, Lng: {{{location.longitude}}}), determine the flood risk status and a risk score between 0 and 1 based on your reasoning.

Sensor Data:
- Water Level: {{{waterLevelCm}}} cm
- Rain Detected: {{{rainDetected}}}
- Turbidity: {{{turbidityNtu}}} NTU
- Temperature: {{{temperatureC}}} °C
- Humidity: {{{humidityPercent}}}%
- Pressure: {{{pressureHpa}}} hPa

Weather Information:
- Rainfall: {{{rainfallMillimeters}}} mm
- Temperature: {{{temperatureCelsius}}} °C

Consider the following factors when determining the flood risk:
- High water level increases the risk.
- Heavy rainfall increases the risk.
- High turbidity may indicate increased runoff and potential flooding.

Output the flood risk status as one of the following: Normal, Watch, Warning, Predicted_Flood, Error. Also output a predicted flood risk score between 0 and 1.

Explain your reasoning for the flood risk status and predicted risk score. If the status is above \"Normal\", populate the alertMessage field with a message to display to the user. For example, if the status is \"Warning\", the alert message should contain the current water level and rainfall.
`,
});

const floodRiskAssessmentFlow = ai.defineFlow<
  typeof FloodRiskAssessmentInputSchema,
  typeof FloodRiskAssessmentOutputSchema
>({
  name: 'floodRiskAssessmentFlow',
  inputSchema: FloodRiskAssessmentInputSchema,
  outputSchema: FloodRiskAssessmentOutputSchema,
}, async input => {
  const weather = await getWeather(input.location as Location);
  const {output} = await floodRiskAssessmentPrompt({
    ...input,
    rainfallMillimeters: weather.rainfallMillimeters,
    temperatureCelsius: weather.temperatureCelsius,
  });
  return output!;
});

