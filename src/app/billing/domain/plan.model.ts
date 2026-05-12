export type PlanType = 'free' | 'premium';

export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  price: number;
  currency: string;
  features: string[];
}
