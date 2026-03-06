export interface Food {
  id: string;
  name: string;
  calories: number;
  sodium: number;
  protein: number;
  totalCarbs: number;
  fiberCarbs: number;
  netCarbs: number;
  sugarCarbs: number;
}

export interface FoodNutrients {
  calories: number;
  sodium: number;
  protein: number;
  totalCarbs: number;
  fiberCarbs: number;
  netCarbs: number;
  sugarCarbs: number;
}

export function aggregateNutrients(
  items: { food: Food; servings: number }[]
): FoodNutrients {
  return items.reduce(
    (acc, { food, servings }) => ({
      calories: acc.calories + food.calories * servings,
      sodium: acc.sodium + food.sodium * servings,
      protein: acc.protein + food.protein * servings,
      totalCarbs: acc.totalCarbs + food.totalCarbs * servings,
      fiberCarbs: acc.fiberCarbs + food.fiberCarbs * servings,
      netCarbs: acc.netCarbs + food.netCarbs * servings,
      sugarCarbs: acc.sugarCarbs + food.sugarCarbs * servings,
    }),
    {
      calories: 0,
      sodium: 0,
      protein: 0,
      totalCarbs: 0,
      fiberCarbs: 0,
      netCarbs: 0,
      sugarCarbs: 0,
    }
  );
}
