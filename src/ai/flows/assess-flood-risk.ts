'use server';
/**
 * @fileOverview Determines flood risk status based on sensor readings and weather data.
 *
 * - assessFloodRisk - A function that assesses the flood risk.
 * - AssessFloodRiskInput - The input type for the assessFloodRisk function.
 * - AssessFloodRiskOutput - The return type for the assessFloodRisk function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {getWeather, Location} from '@/services/weather';

const AssessFloodRiskInputSchema = z.object({
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
export type AssessFloodRiskInput = z.infer<typeof AssessFloodRiskInputSchema>;

const AssessFloodRiskOutputSchema = z.object({
  status: z.enum(['Normal', 'Watch', 'Warning', 'Predicted_Flood', 'Error']).describe('The flood risk status.'),
  predictedFloodRisk: z.number().min(0).max(1).describe('The predicted flood risk score (0-1).'),
  alertMessage: z.string().optional().describe('A message to display to the user about the alert.'),
});
export type AssessFloodRiskOutput = z.infer<typeof AssessFloodRiskOutputSchema>;

export async function assessFloodRisk(input: AssessFloodRiskInput): Promise<AssessFloodRiskOutput> {
  return assessFloodRiskFlow(input);
}

const assessFloodRiskPrompt = ai.definePrompt({
  name: 'assessFloodRiskPrompt',
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
  prompt: `Given the following sensor data and weather information for device ID {{{deviceId}}} at location (Lat: {{{location.latitude}}}, Lng: {{{location.longitude}}}), determine the flood risk status and a risk score between 0 and 1.\n\nSensor Data:\n- Water Level: {{{waterLevelCm}}} cm\n- Rain Detected: {{{rainDetected}}}\n- Turbidity: {{{turbidityNtu}}} NTU\n- Temperature: {{{temperatureC}}} °C\n- Humidity: {{{humidityPercent}}}%\n- Pressure: {{{pressureHpa}}} hPa\n\nWeather Information:\n- Rainfall: {{{rainfallMillimeters}}} mm\n- Temperature: {{{temperatureCelsius}}} °C\n\nConsider the following factors when determining the flood risk:\n- High water level increases the risk.\n- Heavy rainfall increases the risk.\n- High turbidity may indicate increased runoff and potential flooding.\n\nOutput the flood risk status as one of the following: Normal, Watch, Warning, Predicted_Flood, Error. Also output a predicted flood risk score between 0 and 1.
If the status is above "Normal", populate the alertMessage field with a message to display to the user. For example, if the status is "Warning", the alert message should contain the current water level and rainfall.
`,
});

const assessFloodRiskFlow = ai.defineFlow<
  typeof AssessFloodRiskInputSchema,
  typeof AssessFloodRiskOutputSchema
>(
  {
    name: 'assessFloodRiskFlow',
    inputSchema: AssessFloodRiskInputSchema,
    outputSchema: AssessFloodRiskOutputSchema,
  },
  async input => {
    const weather = await getWeather(input.location as Location);
    const {output} = await assessFloodRiskPrompt({
      ...input,
      rainfallMillimeters: weather.rainfallMillimeters,
      temperatureCelsius: weather.temperatureCelsius,
    });
    return output!;
  }
);
