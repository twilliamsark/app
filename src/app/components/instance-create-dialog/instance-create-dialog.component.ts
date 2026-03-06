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
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-instance-create-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDialogModule,
  ],
  templateUrl: './instance-create-dialog.component.html',
  styleUrl: './instance-create-dialog.component.scss',
})
export class InstanceCreateDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<InstanceCreateDialogComponent>);
  private readonly storage = inject(StorageService);

  readonly templateId = signal<string | null>(null);
  readonly date = signal(this.todayStr());
  readonly name = signal('');
  readonly items = signal<{ foodId: string; servings: number }[]>([]);

  readonly templateOptions = computed(() =>
    this.storage.templates().map((t) => ({ id: t.id, name: t.name }))
  );

  readonly foodById = this.storage.foodById;

  readonly itemRows = computed(() => {
    const byId = this.storage.foodById();
    return this.items().map((it) => ({
      foodId: it.foodId,
      servings: it.servings,
      name: byId.get(it.foodId)?.name ?? 'Unknown',
    }));
  });

  readonly canSave = computed(() => {
    const tid = this.templateId();
    const d = this.date();
    const n = this.name().trim();
    return tid != null && d.length > 0 && n.length > 0 && this.items().length > 0;
  });

  private todayStr(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  onTemplateChange(templateId: string | null): void {
    this.templateId.set(templateId);
    if (!templateId) {
      this.items.set([]);
      this.name.set('');
      return;
    }
    const t = this.storage.templates().find((x) => x.id === templateId);
    if (t) {
      this.items.set(t.items.map((it) => ({ ...it })));
      this.name.set(t.name);
    }
  }

  setServings(foodId: string, servings: number): void {
    const v = Math.max(0, Number(servings) || 0);
    this.items.update((list) =>
      list.map((it) => (it.foodId === foodId ? { ...it, servings: v } : it))
    );
  }

  save(): void {
    const tid = this.templateId();
    const d = this.date();
    const n = this.name().trim();
    if (!tid || !d || !n) return;
    this.dialogRef.close({
      templateId: tid,
      date: d,
      name: n,
      items: this.items().filter((it) => it.servings > 0),
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
