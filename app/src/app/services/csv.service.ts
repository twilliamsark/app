import { Injectable } from '@angular/core';
import type { Food } from '../models/food.model';
import type { MealTemplate } from '../models/meal-template.model';
import type { MealInstance } from '../models/meal-instance.model';

const FOOD_CSV_HEADER =
  'id,name,calories,sodium,protein,total carbs,fiber carbs,net carbs,sugar carbs';

@Injectable({ providedIn: 'root' })
export class CsvService {
  parseFoodCsv(csvText: string): Omit<Food, 'id'>[] {
    const lines = this.parseCsvLines(csvText);
    if (lines.length < 2) return [];
    const header = lines[0].map((c) => c.trim().toLowerCase());
    const nameIdx =
      header.findIndex((h) => ['food', 'target', 'name'].includes(h)) >= 0
        ? header.findIndex((h) => ['food', 'target', 'name'].includes(h))
        : 0;
    const calIdx = header.indexOf('calories');
    const sodIdx = header.indexOf('sodium');
    const proIdx = header.indexOf('protein');
    const totIdx = header.findIndex((h) => h === 'total carbs');
    const fibIdx = header.findIndex((h) => h === 'fiber carbs');
    const netIdx = header.findIndex((h) => h === 'net carbs');
    const sugIdx = header.findIndex(
      (h) => h === 'sugar carbs' || h === 'suger carbs'
    );
    if (
      nameIdx < 0 ||
      calIdx < 0 ||
      sodIdx < 0 ||
      proIdx < 0 ||
      totIdx < 0 ||
      fibIdx < 0 ||
      netIdx < 0 ||
      sugIdx < 0
    )
      return [];
    const rows: Omit<Food, 'id'>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const name = (row[nameIdx] ?? '').trim();
      if (!name) continue;
      const num = (idx: number) => {
        const v = (row[idx] ?? '0').toString().trim();
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      rows.push({
        name,
        calories: num(calIdx),
        sodium: num(sodIdx),
        protein: num(proIdx),
        totalCarbs: num(totIdx),
        fiberCarbs: num(fibIdx),
        netCarbs: num(netIdx),
        sugarCarbs: num(sugIdx),
      });
    }
    return rows;
  }

  private parseCsvLines(csvText: string): string[][] {
    const lines: string[][] = [];
    let current: string[] = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < csvText.length; i++) {
      const ch = csvText[i];
      if (inQuotes) {
        if (ch === '"') {
          if (csvText[i + 1] === '"') {
            field += '"';
            i++;
          } else inQuotes = false;
        } else field += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === ',' || ch === '\t') {
          current.push(field);
          field = '';
        } else if (ch === '\r') {
          if (csvText[i + 1] === '\n') i++;
          current.push(field);
          field = '';
          lines.push(current);
          current = [];
        } else if (ch === '\n') {
          current.push(field);
          field = '';
          lines.push(current);
          current = [];
        } else field += ch;
      }
    }
    current.push(field);
    if (current.some((c) => c.length > 0)) lines.push(current);
    return lines;
  }

  foodToCsvRow(food: Food): string {
    const esc = (v: string | number) => {
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    return [
      esc(food.id),
      esc(food.name),
      food.calories,
      food.sodium,
      food.protein,
      food.totalCarbs,
      food.fiberCarbs,
      food.netCarbs,
      food.sugarCarbs,
    ].join(',');
  }

  foodsToCsv(foods: Food[]): string {
    return [FOOD_CSV_HEADER, ...foods.map((f) => this.foodToCsvRow(f))].join(
      '\n'
    );
  }

  templatesToCsv(templates: MealTemplate[]): string {
    const header = 'id,name,createdAt,updatedAt,itemsJson';
    const rows = templates.map((t) =>
      [
        t.id,
        `"${String(t.name).replace(/"/g, '""')}"`,
        t.createdAt,
        t.updatedAt,
        `"${JSON.stringify(t.items).replace(/"/g, '""')}"`,
      ].join(',')
    );
    return [header, ...rows].join('\n');
  }

  instancesToCsv(instances: MealInstance[]): string {
    const header = 'id,templateId,date,name,createdAt,updatedAt,itemsJson';
    const rows = instances.map((i) =>
      [
        i.id,
        i.templateId,
        i.date,
        `"${String(i.name).replace(/"/g, '""')}"`,
        i.createdAt,
        i.updatedAt,
        `"${JSON.stringify(i.items).replace(/"/g, '""')}"`,
      ].join(',')
    );
    return [header, ...rows].join('\n');
  }

  parseTemplatesCsv(csvText: string): Omit<MealTemplate, 'id'>[] {
    const lines = this.parseCsvLines(csvText);
    if (lines.length < 2) return [];
    const header = lines[0].map((c) => c.trim().toLowerCase());
    const nameIdx = header.indexOf('name');
    const caIdx = header.indexOf('createdat');
    const uaIdx = header.indexOf('updatedat');
    const itemsIdx = header.indexOf('itemsjson');
    if (nameIdx < 0 || itemsIdx < 0) return [];
    const result: Omit<MealTemplate, 'id'>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const name = (row[nameIdx] ?? '').trim().replace(/^"|"$/g, '');
      const itemsJson = (row[itemsIdx] ?? '').trim().replace(/^"|"$/g, '').replace(/""/g, '"');
      let items: { foodId: string; servings: number }[] = [];
      try {
        items = JSON.parse(itemsJson) ?? [];
      } catch {
        // skip
      }
      const createdAt = caIdx >= 0 ? Number(row[caIdx]) || Date.now() : Date.now();
      const updatedAt = uaIdx >= 0 ? Number(row[uaIdx]) || Date.now() : Date.now();
      result.push({ name, items, createdAt, updatedAt });
    }
    return result;
  }

  parseInstancesCsv(csvText: string): Omit<MealInstance, 'id'>[] {
    const lines = this.parseCsvLines(csvText);
    if (lines.length < 2) return [];
    const header = lines[0].map((c) => c.trim().toLowerCase());
    const tidIdx = header.indexOf('templateid');
    const dateIdx = header.indexOf('date');
    const nameIdx = header.indexOf('name');
    const caIdx = header.indexOf('createdat');
    const uaIdx = header.indexOf('updatedat');
    const itemsIdx = header.indexOf('itemsjson');
    if (tidIdx < 0 || dateIdx < 0 || nameIdx < 0 || itemsIdx < 0) return [];
    const result: Omit<MealInstance, 'id'>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const templateId = (row[tidIdx] ?? '').trim();
      const date = (row[dateIdx] ?? '').trim();
      const name = (row[nameIdx] ?? '').trim().replace(/^"|"$/g, '');
      const itemsJson = (row[itemsIdx] ?? '').trim().replace(/^"|"$/g, '').replace(/""/g, '"');
      let items: { foodId: string; servings: number }[] = [];
      try {
        items = JSON.parse(itemsJson) ?? [];
      } catch {
        // skip
      }
      const createdAt = caIdx >= 0 ? Number(row[caIdx]) || Date.now() : Date.now();
      const updatedAt = uaIdx >= 0 ? Number(row[uaIdx]) || Date.now() : Date.now();
      result.push({ templateId, date, name, items, createdAt, updatedAt });
    }
    return result;
  }
}
