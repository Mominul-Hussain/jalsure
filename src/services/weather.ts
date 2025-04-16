/**
 * Represents weather information, including temperature and rainfall.
 */
export interface Weather {
  /**
   * The temperature in Celsius.
   */
  temperatureCelsius: number;
  /**
   * The rainfall in mm.
   */
  rainfallMm: number;
}

/**
 * Asynchronously retrieves weather information for a given location.
 *
 * @param latitude The latitude of the location.
 * @param longitude The longitude of the location.
 * @returns A promise that resolves to a Weather object containing temperature and rainfall.
 */
export async function getWeather(latitude: number, longitude: number): Promise<Weather> {
  // TODO: Implement this by calling an API.
  return {
    temperatureCelsius: 25,
    rainfallMm: 0,
  };
}
