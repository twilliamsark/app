import type { Food } from './food.model';
import type { FoodNutrients } from './food.model';

export interface MealTemplateItem {
  foodId: string;
  servings: number;
}

export interface MealTemplate {
  id: string;
  name: string;
  items: MealTemplateItem[];
  createdAt: number;
  updatedAt: number;
}

export interface MealTemplateWithFoods extends MealTemplate {
  itemsWithFood: { food: Food; servings: number }[];
  aggregates: FoodNutrients;
}
