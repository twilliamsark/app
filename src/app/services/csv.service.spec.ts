import { describe, it, expect } from 'vitest';
import { CsvService } from './csv.service';
import type { Food } from '../models/food.model';
import type { MealTemplate } from '../models/meal-template.model';
import type { MealInstance } from '../models/meal-instance.model';

describe('CsvService', () => {
  let service: CsvService;

  beforeEach(() => {
    service = new CsvService();
  });

  describe('parseFoodCsv', () => {
    it('returns empty array for empty or header-only csv', () => {
      expect(service.parseFoodCsv('')).toEqual([]);
      expect(
        service.parseFoodCsv('food,calories,sodium,protein,total carbs,fiber carbs,net carbs,sugar carbs')
      ).toEqual([]);
    });

    it('parses csv with "food" header', () => {
      const csv = `food,calories,sodium,protein,total carbs,fiber carbs,net carbs,sugar carbs
eggs,70,60,6,0,0,0,0`;
      const rows = service.parseFoodCsv(csv);
      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe('eggs');
      expect(rows[0].calories).toBe(70);
      expect(rows[0].sodium).toBe(60);
      expect(rows[0].protein).toBe(6);
      expect(rows[0].netCarbs).toBe(0);
    });

    it('parses csv with "Target" header (first column)', () => {
      const csv = `Target,calories,sodium,protein,total carbs,fiber carbs,net carbs,sugar carbs
banana,72,0,1,18.5,2.1,16.4,9.9`;
      const rows = service.parseFoodCsv(csv);
      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe('banana');
      expect(rows[0].calories).toBe(72);
      expect(rows[0].sugarCarbs).toBe(9.9);
    });

    it('skips rows with empty name', () => {
      const csv = `food,calories,sodium,protein,total carbs,fiber carbs,net carbs,sugar carbs
,0,0,0,0,0,0,0
apple,50,0,0,14,2,12,10`;
      const rows = service.parseFoodCsv(csv);
      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe('apple');
    });
  });

  describe('foodToCsvRow and foodsToCsv', () => {
    it('serializes a food to csv row and round-trips', () => {
      const food: Food = {
        id: 'id1',
        name: 'Test Food',
        calories: 100,
        sodium: 200,
        protein: 10,
        totalCarbs: 20,
        fiberCarbs: 5,
        netCarbs: 15,
        sugarCarbs: 3,
      };
      const row = service.foodToCsvRow(food);
      expect(row).toContain('id1');
      expect(row).toContain('Test Food');
      expect(row).toContain('100');
      const fullCsv = service.foodsToCsv([food]);
      expect(fullCsv).toContain('id,name,calories');
      expect(fullCsv).toContain('Test Food');
    });

    it('escapes names with commas in quotes', () => {
      const food: Food = {
        id: '1',
        name: 'Bread, whole wheat',
        calories: 70,
        sodium: 130,
        protein: 3,
        totalCarbs: 12,
        fiberCarbs: 2,
        netCarbs: 10,
        sugarCarbs: 2,
      };
      const row = service.foodToCsvRow(food);
      expect(row).toContain('"Bread, whole wheat"');
    });
  });

  describe('templatesToCsv and parseTemplatesCsv', () => {
    it('round-trips templates', () => {
      const templates: MealTemplate[] = [
        {
          id: 't1',
          name: 'Breakfast',
          items: [{ foodId: 'f1', servings: 1 }],
          createdAt: 1000,
          updatedAt: 2000,
        },
      ];
      const csv = service.templatesToCsv(templates);
      expect(csv).toContain('id,name,createdAt,updatedAt,itemsJson');
      expect(csv).toContain('Breakfast');
      const parsed = service.parseTemplatesCsv(csv);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Breakfast');
      expect(parsed[0].items).toEqual([{ foodId: 'f1', servings: 1 }]);
    });
  });

  describe('instancesToCsv and parseInstancesCsv', () => {
    it('round-trips instances', () => {
      const instances: MealInstance[] = [
        {
          id: 'i1',
          templateId: 't1',
          date: '2025-03-05',
          name: 'Lunch',
          items: [{ foodId: 'f1', servings: 2 }],
          createdAt: 1000,
          updatedAt: 2000,
        },
      ];
      const csv = service.instancesToCsv(instances);
      expect(csv).toContain('templateId');
      expect(csv).toContain('2025-03-05');
      const parsed = service.parseInstancesCsv(csv);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].date).toBe('2025-03-05');
      expect(parsed[0].name).toBe('Lunch');
      expect(parsed[0].items).toEqual([{ foodId: 'f1', servings: 2 }]);
    });
  });
});
