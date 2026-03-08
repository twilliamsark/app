import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { StorageService } from '../../services/storage.service';

export interface InstanceCreateDialogData {
  templateId?: string;
  date?: string;
}

@Component({
  selector: 'app-instance-create-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
  ],
  templateUrl: './instance-create-dialog.component.html',
  styleUrl: './instance-create-dialog.component.scss',
})
export class InstanceCreateDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<InstanceCreateDialogComponent>);
  private readonly storage = inject(StorageService);
  private readonly dialogData = inject<InstanceCreateDialogData | undefined>(MAT_DIALOG_DATA, {
    optional: true,
  });

  readonly templateId = signal<string | null>(null);
  /** Input value: string while typing, or selected template object. */
  readonly templateInputValue = signal<string | { id: string; name: string } | null>(null);
  /** Date for the picker (bound to mat-datepicker). */
  readonly dateValue = signal<Date>(new Date());
  readonly name = signal('');
  readonly items = signal<{ foodId: string; servings: number }[]>([]);

  ngOnInit(): void {
    const d = this.dialogData;
    if (d?.templateId) {
      const t = this.storage.templates().find((x) => x.id === d.templateId);
      if (t) {
        const option = { id: t.id, name: t.name };
        this.templateInputValue.set(option);
        this.onTemplateChange(t.id);
      }
    }
    if (d?.date) {
      this.dateValue.set(this.parseDateStr(d.date));
    }
  }

  readonly templateOptions = computed(() =>
    this.storage.templates().map((t) => ({ id: t.id, name: t.name }))
  );

  readonly filteredTemplateOptions = computed(() => {
    const v = this.templateInputValue();
    const q = (typeof v === 'string' ? v : v?.name ?? '').toLowerCase().trim();
    const options = this.templateOptions();
    if (!q) return options;
    return options.filter((t) => t.name.toLowerCase().includes(q));
  });

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
    const n = this.name().trim();
    return tid != null && this.dateValue() != null && n.length > 0 && this.items().length > 0;
  });

  private dateToStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private parseDateStr(str: string): Date {
    return new Date(str + 'T12:00:00');
  }

  onTemplateInputChange(value: string | { id: string; name: string } | null): void {
    this.templateInputValue.set(value ?? '');
    if (typeof value === 'object' && value != null) {
      this.onTemplateChange(value.id);
    } else {
      if (this.templateId()) this.onTemplateChange(null);
    }
  }

  displayTemplateName = (value: { id: string; name: string } | string | null): string => {
    if (value == null) return '';
    return typeof value === 'object' ? value.name : String(value);
  };

  onTemplateOptionSelected(option: { id: string; name: string }): void {
    this.templateInputValue.set(option);
    this.onTemplateChange(option.id);
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
    const dateObj = this.dateValue();
    const n = this.name().trim();
    if (!tid || !dateObj || !n) return;
    this.dialogRef.close({
      templateId: tid,
      date: this.dateToStr(dateObj),
      name: n,
      items: this.items().filter((it) => it.servings > 0),
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
