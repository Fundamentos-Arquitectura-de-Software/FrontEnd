export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertState = 'active' | 'muted' | 'resolved';

export interface Alert {
    id: number;
    severity: AlertSeverity;
    state: AlertState;
    title: string;
    message: string;
    source: string;
    timeAgo: string;
}
