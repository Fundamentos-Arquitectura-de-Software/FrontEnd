export interface Recipe {
  id: number;
  title: string;
  description?: string;
  image?: string;
  rating?: number;
  level?: string;
  type?: string;
  time?: string;
  ingredients?: string[];
  steps?: string[];
}
