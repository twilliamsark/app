import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { CsvService } from './csv.service';

const FOODS_KEY = 'nutrition_foods';
const TEMPLATES_KEY = 'nutrition_templates';
const INSTANCES_KEY = 'nutrition_instances';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.removeItem(FOODS_KEY);
    localStorage.removeItem(TEMPLATES_KEY);
    localStorage.removeItem(INSTANCES_KEY);
    TestBed.configureTestingModule({
      providers: [CsvService, StorageService],
    });
    service = TestBed.inject(StorageService);
  });

  describe('foods', () => {
    it('starts with empty foods', () => {
      expect(service.foods()).toEqual([]);
    });

    it('addFood adds and persists', () => {
      const added = service.addFood({
        name: 'Eggs',
        calories: 70,
        sodium: 60,
        protein: 6,
        totalCarbs: 0,
        fiberCarbs: 0,
        netCarbs: 0,
        sugarCarbs: 0,
      });
      expect(added.id).toBeDefined();
      expect(added.name).toBe('Eggs');
      expect(service.foods()).toHaveLength(1);
      expect(JSON.parse(localStorage.getItem(FOODS_KEY)!)).toHaveLength(1);
    });

    it('updateFood updates by id', () => {
      const added = service.addFood({
        name: 'Eggs',
        calories: 70,
        sodium: 60,
        protein: 6,
        totalCarbs: 0,
        fiberCarbs: 0,
        netCarbs: 0,
        sugarCarbs: 0,
      });
      service.updateFood(added.id, { calories: 80 });
      expect(service.foods()[0].calories).toBe(80);
    });

    it('deleteFood removes by id', () => {
      const added = service.addFood({
        name: 'Eggs',
        calories: 70,
        sodium: 60,
        protein: 6,
        totalCarbs: 0,
        fiberCarbs: 0,
        netCarbs: 0,
        sugarCarbs: 0,
      });
      service.deleteFood(added.id);
      expect(service.foods()).toHaveLength(0);
    });
  });

  describe('mergeFoods', () => {
    const parsedFoods = [
      {
        name: 'eggs',
        calories: 70,
        sodium: 60,
        protein: 6,
        totalCarbs: 0,
        fiberCarbs: 0,
        netCarbs: 0,
        sugarCarbs: 0,
      },
    ];

    it('adds new foods when storage is empty', () => {
      service.mergeFoods(parsedFoods);
      expect(service.foods()).toHaveLength(1);
      expect(service.foods()[0].name).toBe('eggs');
    });

    it('updates existing foods by name', () => {
      const added = service.addFood({
        name: 'eggs',
        calories: 70,
        sodium: 60,
        protein: 6,
        totalCarbs: 0,
        fiberCarbs: 0,
        netCarbs: 0,
        sugarCarbs: 0,
      });
      service.mergeFoods([
        {
          name: 'eggs',
          calories: 80,
          sodium: 60,
          protein: 6,
          totalCarbs: 0,
          fiberCarbs: 0,
          netCarbs: 0,
          sugarCarbs: 0,
        },
      ]);
      expect(service.foods()).toHaveLength(1);
      expect(service.foods()[0].id).toBe(added.id);
      expect(service.foods()[0].calories).toBe(80);
    });

    it('adds new foods alongside existing', () => {
      service.addFood({
        name: 'Existing',
        calories: 0,
        sodium: 0,
        protein: 0,
        totalCarbs: 0,
        fiberCarbs: 0,
        netCarbs: 0,
        sugarCarbs: 0,
      });
      service.mergeFoods(parsedFoods);
      expect(service.foods()).toHaveLength(2);
      expect(service.foods().map((f) => f.name).sort()).toEqual(['Existing', 'eggs']);
    });
  });

  describe('templates', () => {
    it('addTemplate and deleteTemplate', () => {
      const t = service.addTemplate({
        name: 'Breakfast',
        items: [{ foodId: 'f1', servings: 1 }],
      });
      expect(t.id).toBeDefined();
      expect(service.templates()).toHaveLength(1);
      expect(service.templates()[0].name).toBe('Breakfast');
      service.deleteTemplate(t.id);
      expect(service.templates()).toHaveLength(0);
    });

    it('updateTemplate updates by id', () => {
      const t = service.addTemplate({
        name: 'Breakfast',
        items: [],
      });
      service.updateTemplate(t.id, { name: 'Lunch' });
      expect(service.templates()[0].name).toBe('Lunch');
    });
  });

  describe('instances', () => {
    it('addInstance and deleteInstance', () => {
      const i = service.addInstance({
        templateId: 't1',
        date: '2025-03-05',
        name: 'Lunch',
        items: [],
      });
      expect(i.id).toBeDefined();
      expect(service.instances()).toHaveLength(1);
      expect(service.instances()[0].date).toBe('2025-03-05');
      service.deleteInstance(i.id);
      expect(service.instances()).toHaveLength(0);
    });
  });

  describe('export/import', () => {
    it('exportFoodsCsv returns csv string', () => {
      service.addFood({
        name: 'Eggs',
        calories: 70,
        sodium: 60,
        protein: 6,
        totalCarbs: 0,
        fiberCarbs: 0,
        netCarbs: 0,
        sugarCarbs: 0,
      });
      const csv = service.exportFoodsCsv();
      expect(csv).toContain('name,calories');
      expect(csv).toContain('Eggs');
    });

    it('importTemplatesCsv adds new templates', () => {
      const csv = `id,name,createdAt,updatedAt,itemsJson
,"New Template",1000,2000,"[]"`;
      service.importTemplatesCsv(csv);
      expect(service.templates()).toHaveLength(1);
      expect(service.templates()[0].name).toBe('New Template');
    });
  });
});
