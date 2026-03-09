import { describe, it, expect } from 'vitest';
import type { MealTemplateItem, MealTemplate } from './meal-template.model';

describe('meal-template.model', () => {
  describe('MealTemplateItem', () => {
    it('allows valid item shape', () => {
      const item: MealTemplateItem = { foodId: 'f1', servings: 1 };
      expect(item.foodId).toBe('f1');
      expect(item.servings).toBe(1);
    });
  });

  describe('MealTemplate', () => {
    it('allows valid template shape', () => {
      const template: MealTemplate = {
        id: 't1',
        name: 'Breakfast',
        servingTime: 'breakfast',
        items: [{ foodId: 'f1', servings: 1 }],
        createdAt: 1000,
        updatedAt: 2000,
      };
      expect(template.name).toBe('Breakfast');
      expect(template.items).toHaveLength(1);
      expect(template.items[0].servings).toBe(1);
    });
  });
});
