/**
 * Monitoring reading.
 *
 * NOTE: The backend response may include additional sensor fields
 * (e.g. ethylene, oxygen), but the FreshSense frontend intentionally
 * works only with temperature and humidity. Any extra fields returned
 * by the API are simply ignored by the UI.
 */
export interface MonitoringReading {
  id: number;
  temperature: number;
  humidity: number;
  recordedAt: string;
}
