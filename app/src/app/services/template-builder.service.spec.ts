import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TemplateBuilderService } from './template-builder.service';
import { StorageService } from './storage.service';
import { CsvService } from './csv.service';

describe('TemplateBuilderService', () => {
  let service: TemplateBuilderService;
  let storage: StorageService;

  beforeEach(() => {
    localStorage.removeItem('nutrition_foods');
    localStorage.removeItem('nutrition_templates');
    localStorage.removeItem('nutrition_instances');
    TestBed.configureTestingModule({
      providers: [CsvService, StorageService, TemplateBuilderService],
    });
    service = TestBed.inject(TemplateBuilderService);
    storage = TestBed.inject(StorageService);
  });

  it('starts with empty selection', () => {
    expect(service.selectedFoodIds()).toEqual([]);
    expect(service.getSelection()).toEqual([]);
  });

  it('setSelection and getSelection round-trip', () => {
    service.setSelection(['id1', 'id2']);
    expect(service.getSelection()).toEqual(['id1', 'id2']);
  });

  it('clearSelection empties selection', () => {
    service.setSelection(['id1']);
    service.clearSelection();
    expect(service.getSelection()).toEqual([]);
  });

  it('selectedFoodsWithServings returns foods from storage by id', () => {
    const food = storage.addFood({
      name: 'Eggs',
      calories: 70,
      sodium: 60,
      protein: 6,
      totalCarbs: 0,
      fiberCarbs: 0,
      netCarbs: 0,
      sugarCarbs: 0,
    });
    service.setSelection([food.id]);
    const withServings = service.selectedFoodsWithServings();
    expect(withServings).toHaveLength(1);
    expect(withServings[0].food.name).toBe('Eggs');
    expect(withServings[0].servings).toBe(1);
  });

  it('selectedFoodsWithServings filters out missing food ids', () => {
    const food = storage.addFood({
      name: 'Eggs',
      calories: 70,
      sodium: 60,
      protein: 6,
      totalCarbs: 0,
      fiberCarbs: 0,
      netCarbs: 0,
      sugarCarbs: 0,
    });
    service.setSelection([food.id, 'nonexistent-id']);
    const withServings = service.selectedFoodsWithServings();
    expect(withServings).toHaveLength(1);
    expect(withServings[0].food.id).toBe(food.id);
  });
});
