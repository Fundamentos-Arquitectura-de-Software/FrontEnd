export interface HistoryEntry {
  id?: number;
  productId: number;
  productName: string;
  category: string;
  action: 'consume' | 'discard' | 'add';
  quantity: number;
  date: string;
}
