import { Injectable, signal, computed } from '@angular/core';
import { inject } from '@angular/core';
import { StorageService } from './storage.service';
import type { Food } from '../models/food.model';

@Injectable({ providedIn: 'root' })
export class TemplateBuilderService {
  private readonly storage = inject(StorageService);

  private readonly selectedFoodIdsSignal = signal<string[]>([]);

  readonly selectedFoodIds = this.selectedFoodIdsSignal.asReadonly();

  readonly selectedFoodsWithServings = computed(() => {
    const ids = this.selectedFoodIdsSignal();
    const byId = this.storage.foodById();
    return ids
      .map((id) => ({ food: byId.get(id), servings: 1 }))
      .filter((x): x is { food: Food; servings: number } => x.food != null);
  });

  setSelection(ids: string[]): void {
    this.selectedFoodIdsSignal.set([...ids]);
  }

  clearSelection(): void {
    this.selectedFoodIdsSignal.set([]);
  }

  getSelection(): string[] {
    return [...this.selectedFoodIdsSignal()];
  }
}
