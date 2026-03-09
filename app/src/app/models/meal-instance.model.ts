export interface MealInstanceItem {
  foodId: string;
  servings: number;
}

export interface MealInstance {
  id: string;
  templateId: string;
  date: string; // YYYY-MM-DD
  name: string;
  items: MealInstanceItem[];
  createdAt: number;
  updatedAt: number;
}
