import { Injectable, inject } from '@angular/core';
import { signal, computed } from '@angular/core';
import type { Food } from '../models/food.model';
import type { MealTemplate } from '../models/meal-template.model';
import type { MealInstance } from '../models/meal-instance.model';
import { DEFAULT_SERVING_TIME } from '../models/serving-time.model';
import { CsvService } from './csv.service';

const FOODS_KEY = 'nutrition_foods';
const TEMPLATES_KEY = 'nutrition_templates';
const INSTANCES_KEY = 'nutrition_instances';

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly csv = inject(CsvService);
  private readonly foodsSignal = signal<Food[]>([]);
  private readonly templatesSignal = signal<MealTemplate[]>([]);
  private readonly instancesSignal = signal<MealInstance[]>([]);

  readonly foods = this.foodsSignal.asReadonly();
  readonly templates = this.templatesSignal.asReadonly();
  readonly instances = this.instancesSignal.asReadonly();

  readonly foodById = computed(() => {
    const map = new Map<string, Food>();
    for (const f of this.foodsSignal()) map.set(f.id, f);
    return map;
  });

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const f = localStorage.getItem(FOODS_KEY);
      if (f) this.foodsSignal.set(this.normalizeFoods(JSON.parse(f)));
      const t = localStorage.getItem(TEMPLATES_KEY);
      if (t) this.templatesSignal.set(this.normalizeTemplates(JSON.parse(t)));
      const i = localStorage.getItem(INSTANCES_KEY);
      if (i) this.instancesSignal.set(this.normalizeInstances(JSON.parse(i)));
    } catch {
      // ignore
    }
  }

  private normalizeFoods(list: Food[]): Food[] {
    return list.map((x) => ({
      ...x,
      servingTime: x.servingTime ?? DEFAULT_SERVING_TIME,
    }));
  }

  private normalizeTemplates(list: MealTemplate[]): MealTemplate[] {
    return list.map((x) => ({
      ...x,
      servingTime: x.servingTime ?? DEFAULT_SERVING_TIME,
    }));
  }

  private normalizeInstances(list: MealInstance[]): MealInstance[] {
    return list.map((x) => ({
      ...x,
      servingTime: x.servingTime ?? DEFAULT_SERVING_TIME,
    }));
  }

  private persistFoods(): void {
    localStorage.setItem(FOODS_KEY, JSON.stringify(this.foodsSignal()));
  }

  private persistTemplates(): void {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(this.templatesSignal()));
  }

  private persistInstances(): void {
    localStorage.setItem(INSTANCES_KEY, JSON.stringify(this.instancesSignal()));
  }

  mergeFoods(
    foods: (Omit<Food, 'id' | 'servingTime'> & { servingTime?: Food['servingTime'] })[],
  ): void {
    const byName = new Map(this.foodsSignal().map((f) => [f.name.toLowerCase().trim(), f]));
    const next: Food[] = [...this.foodsSignal()];
    for (const row of foods) {
      const key = row.name.toLowerCase().trim();
      const existing = byName.get(key);
      const servingTime = row.servingTime ?? DEFAULT_SERVING_TIME;
      if (existing) {
        const idx = next.findIndex((x) => x.id === existing.id);
        if (idx >= 0)
          next[idx] = {
            ...existing,
            ...row,
            servingTime,
          };
        byName.set(key, next[idx]!);
      } else {
        const newFood: Food = {
          id: genId(),
          ...row,
          servingTime,
        };
        next.push(newFood);
        byName.set(key, newFood);
      }
    }
    this.foodsSignal.set(next);
    this.persistFoods();
  }

  addFood(food: Omit<Food, 'id' | 'servingTime'> & { servingTime?: Food['servingTime'] }): Food {
    const newFood: Food = {
      ...food,
      servingTime: food.servingTime ?? DEFAULT_SERVING_TIME,
      id: genId(),
    };
    this.foodsSignal.update((list) => [...list, newFood]);
    this.persistFoods();
    return newFood;
  }

  updateFood(id: string, patch: Partial<Omit<Food, 'id'>>): void {
    this.foodsSignal.update((list) => list.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    this.persistFoods();
  }

  deleteFood(id: string): void {
    this.foodsSignal.update((list) => list.filter((f) => f.id !== id));
    this.persistFoods();
  }

  addTemplate(
    template: Omit<MealTemplate, 'id' | 'createdAt' | 'updatedAt' | 'servingTime'> & {
      servingTime?: MealTemplate['servingTime'];
    },
  ): MealTemplate {
    const now = Date.now();
    const t: MealTemplate = {
      ...template,
      servingTime: template.servingTime ?? DEFAULT_SERVING_TIME,
      id: genId(),
      createdAt: now,
      updatedAt: now,
    };
    this.templatesSignal.update((list) => [...list, t]);
    this.persistTemplates();
    return t;
  }

  updateTemplate(id: string, patch: Partial<Omit<MealTemplate, 'id' | 'createdAt'>>): void {
    const now = Date.now();
    this.templatesSignal.update((list) =>
      list.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: now } : t)),
    );
    this.persistTemplates();
  }

  deleteTemplate(id: string): void {
    this.templatesSignal.update((list) => list.filter((t) => t.id !== id));
    this.persistTemplates();
  }

  addInstance(
    instance: Omit<MealInstance, 'id' | 'createdAt' | 'updatedAt' | 'servingTime'> & {
      servingTime?: MealInstance['servingTime'];
    },
  ): MealInstance {
    const now = Date.now();
    const i: MealInstance = {
      ...instance,
      servingTime: instance.servingTime ?? DEFAULT_SERVING_TIME,
      id: genId(),
      createdAt: now,
      updatedAt: now,
    };
    this.instancesSignal.update((list) => [...list, i]);
    this.persistInstances();
    return i;
  }

  updateInstance(id: string, patch: Partial<Omit<MealInstance, 'id' | 'createdAt'>>): void {
    const now = Date.now();
    this.instancesSignal.update((list) =>
      list.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: now } : i)),
    );
    this.persistInstances();
  }

  deleteInstance(id: string): void {
    this.instancesSignal.update((list) => list.filter((i) => i.id !== id));
    this.persistInstances();
  }

  exportFoodsCsv(): string {
    return this.csv.foodsToCsv(this.foodsSignal());
  }

  exportTemplatesCsv(): string {
    return this.csv.templatesToCsv(this.templatesSignal());
  }

  exportInstancesCsv(): string {
    return this.csv.instancesToCsv(this.instancesSignal());
  }

  importTemplatesCsv(csvText: string): void {
    const rows = this.csv.parseTemplatesCsv(csvText);
    const byName = new Map(this.templatesSignal().map((t) => [t.name.toLowerCase().trim(), t]));
    const next = [...this.templatesSignal()];
    for (const row of rows) {
      const key = row.name.toLowerCase().trim();
      const existing = byName.get(key);
      if (existing) {
        const idx = next.findIndex((x) => x.id === existing.id);
        if (idx >= 0)
          next[idx] = {
            ...existing,
            ...row,
            id: existing.id,
            updatedAt: Date.now(),
          };
      } else {
        const t: MealTemplate = {
          ...row,
          id: genId(),
          createdAt: row.createdAt ?? Date.now(),
          updatedAt: row.updatedAt ?? Date.now(),
        };
        next.push(t);
        byName.set(key, t);
      }
    }
    this.templatesSignal.set(next);
    this.persistTemplates();
  }

  importInstancesCsv(csvText: string): void {
    const rows = this.csv.parseInstancesCsv(csvText);
    const next = [...this.instancesSignal()];
    for (const row of rows) {
      next.push({
        ...row,
        id: genId(),
        createdAt: row.createdAt ?? Date.now(),
        updatedAt: row.updatedAt ?? Date.now(),
      });
    }
    this.instancesSignal.set(next);
    this.persistInstances();
  }
}
