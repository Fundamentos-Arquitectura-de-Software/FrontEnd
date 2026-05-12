export interface Alert {
  id: number;
  severity: string;
  state: string;
  title: string;
  message: string;
  source: string;
  timeAgo: string;
}
