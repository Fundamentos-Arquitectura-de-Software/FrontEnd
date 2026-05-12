export interface MonitoringReading {
  id: number;
  temperature: number;
  humidity: number;
  ethyleneLevel: number;
  oxygenLevel: number;
  ripeness: number;
  cleanliness: number;
  recordedAt: string;
}
