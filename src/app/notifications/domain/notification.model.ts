export interface Notification {
    id: number;
    userId: number;
    title: string;
    message: string;
    channel: string;
    isRead: boolean;
    createdAt: string;
}
