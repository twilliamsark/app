import { describe, it, expect } from 'vitest';
import type { MealInstanceItem, MealInstance } from './meal-instance.model';

describe('meal-instance.model', () => {
  describe('MealInstanceItem', () => {
    it('allows valid item shape', () => {
      const item: MealInstanceItem = { foodId: 'f1', servings: 2 };
      expect(item.foodId).toBe('f1');
      expect(item.servings).toBe(2);
    });
  });

  describe('MealInstance', () => {
    it('allows valid instance shape', () => {
      const instance: MealInstance = {
        id: 'i1',
        templateId: 't1',
        date: '2025-03-05',
        name: 'Lunch',
        servingTime: 'lunch',
        items: [{ foodId: 'f1', servings: 1 }],
        createdAt: 1000,
        updatedAt: 2000,
      };
      expect(instance.date).toBe('2025-03-05');
      expect(instance.templateId).toBe('t1');
      expect(instance.items).toHaveLength(1);
    });
  });
});
