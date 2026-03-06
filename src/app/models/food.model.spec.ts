import { describe, it, expect } from 'vitest';
import { aggregateNutrients } from './food.model';
import type { Food } from './food.model';

describe('food.model', () => {
  const foodA: Food = {
    id: '1',
    name: 'Eggs',
    calories: 70,
    sodium: 60,
    protein: 6,
    totalCarbs: 0,
    fiberCarbs: 0,
    netCarbs: 0,
    sugarCarbs: 0,
  };

  const foodB: Food = {
    id: '2',
    name: 'Oatmeal',
    calories: 150,
    sodium: 0,
    protein: 5,
    totalCarbs: 27,
    fiberCarbs: 4,
    netCarbs: 23,
    sugarCarbs: 1,
  };

  describe('aggregateNutrients', () => {
    it('returns zeros for empty items', () => {
      const result = aggregateNutrients([]);
      expect(result).toEqual({
        calories: 0,
        sodium: 0,
        protein: 0,
        totalCarbs: 0,
        fiberCarbs: 0,
        netCarbs: 0,
        sugarCarbs: 0,
      });
    });

    it('scales single food by servings', () => {
      const result = aggregateNutrients([{ food: foodA, servings: 2 }]);
      expect(result.calories).toBe(140);
      expect(result.sodium).toBe(120);
      expect(result.protein).toBe(12);
      expect(result.netCarbs).toBe(0);
    });

    it('sums multiple items with different servings', () => {
      const result = aggregateNutrients([
        { food: foodA, servings: 1 },
        { food: foodB, servings: 2 },
      ]);
      expect(result.calories).toBe(70 + 300);
      expect(result.sodium).toBe(60 + 0);
      expect(result.protein).toBe(6 + 10);
      expect(result.totalCarbs).toBe(0 + 54);
      expect(result.fiberCarbs).toBe(0 + 8);
      expect(result.netCarbs).toBe(0 + 46);
      expect(result.sugarCarbs).toBe(0 + 2);
    });

    it('handles fractional servings', () => {
      const result = aggregateNutrients([{ food: foodA, servings: 0.5 }]);
      expect(result.calories).toBe(35);
      expect(result.protein).toBe(3);
    });
  });
});
