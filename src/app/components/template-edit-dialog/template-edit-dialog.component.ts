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
import { MatSelectModule } from '@angular/material/select';
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
    MatSelectModule,
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

  readonly foodOptions = computed(() => this.storage.foods());
  readonly foodById = this.storage.foodById;

  readonly itemRows = computed(() => {
    const byId = this.storage.foodById();
    return this.items().map((it) => ({
      foodId: it.foodId,
      servings: it.servings,
      name: byId.get(it.foodId)?.name ?? 'Unknown',
    }));
  });

  readonly selectedFoodIdToAdd = signal<string | null>(null);

  addItem(): void {
    const id = this.selectedFoodIdToAdd();
    if (!id) return;
    if (this.items().some((it) => it.foodId === id)) return;
    this.items.update((list) => [...list, { foodId: id, servings: 1 }]);
    this.selectedFoodIdToAdd.set(null);
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
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
