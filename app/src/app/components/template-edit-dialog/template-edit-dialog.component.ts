import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { StorageService } from '../../services/storage.service';

export interface TemplateEditDialogData {
  id?: string;
  name: string;
  items: { foodId: string; servings: number }[];
}

@Component({
  selector: 'app-template-edit-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatDialogModule,
  ],
  templateUrl: './template-edit-dialog.component.html',
  styleUrl: './template-edit-dialog.component.scss',
})
export class TemplateEditDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<TemplateEditDialogComponent>);
  readonly data = inject<TemplateEditDialogData>(MAT_DIALOG_DATA);
  private readonly storage = inject(StorageService);

  readonly name = signal(this.data.name);
  readonly items = signal<{ foodId: string; servings: number }[]>([
    ...this.data.items,
  ]);
  readonly createMeal = signal(false);

  readonly foodOptions = computed(() => this.storage.foods());
  /** Add food input: string while typing, or selected food { id, name }. */
  readonly addFoodInputValue = signal<string | { id: string; name: string } | null>(null);
  readonly foodById = this.storage.foodById;

  readonly filteredFoodOptions = computed(() => {
    const foods = this.foodOptions();
    const existingIds = new Set(this.items().map((it) => it.foodId));
    const available = foods.filter((f) => !existingIds.has(f.id));
    const v = this.addFoodInputValue();
    const q = (typeof v === 'string' ? v : v?.name ?? '').toLowerCase().trim();
    if (!q) return available.map((f) => ({ id: f.id, name: f.name }));
    return available
      .filter((f) => f.name.toLowerCase().includes(q))
      .map((f) => ({ id: f.id, name: f.name }));
  });

  readonly itemRows = computed(() => {
    const byId = this.storage.foodById();
    return this.items().map((it) => ({
      foodId: it.foodId,
      servings: it.servings,
      name: byId.get(it.foodId)?.name ?? 'Unknown',
    }));
  });

  displayFoodName = (value: { id: string; name: string } | string | null): string => {
    if (value == null) return '';
    return typeof value === 'object' ? value.name : String(value);
  };

  onAddFoodInputChange(value: string | { id: string; name: string } | null): void {
    this.addFoodInputValue.set(value ?? '');
  }

  onAddFoodOptionSelected(option: { id: string; name: string }): void {
    this.addFoodInputValue.set(option);
  }

  addItem(): void {
    const v = this.addFoodInputValue();
    const id = typeof v === 'object' && v != null ? v.id : null;
    if (!id) return;
    if (this.items().some((it) => it.foodId === id)) return;
    this.items.update((list) => [...list, { foodId: id, servings: 1 }]);
    this.addFoodInputValue.set(null);
  }

  setServings(foodId: string, servings: number): void {
    const v = Math.max(0, Number(servings) || 0);
    this.items.update((list) =>
      list.map((it) => (it.foodId === foodId ? { ...it, servings: v } : it))
    );
  }

  removeItem(foodId: string): void {
    this.items.update((list) => list.filter((it) => it.foodId !== foodId));
  }

  save(): void {
    const n = this.name().trim();
    if (!n) return;
    this.dialogRef.close({
      name: n,
      items: this.items().filter((it) => it.servings > 0),
      createMeal: this.createMeal(),
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
