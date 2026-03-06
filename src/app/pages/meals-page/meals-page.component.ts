import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { StorageService } from '../../services/storage.service';
import { aggregateNutrients } from '../../models/food.model';
import type { MealInstance } from '../../models/meal-instance.model';
import { InstanceCreateDialogComponent } from '../../components/instance-create-dialog/instance-create-dialog.component';

interface InstanceWithAggregates extends MealInstance {
  aggregates: ReturnType<typeof aggregateNutrients>;
  templateName: string;
}

@Component({
  selector: 'app-meals-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './meals-page.component.html',
  styleUrl: './meals-page.component.scss',
})
export class MealsPageComponent {
  private readonly storage = inject(StorageService);
  private readonly dialog = inject(MatDialog);

  readonly instancesWithAggregates = computed<InstanceWithAggregates[]>(() => {
    const instances = this.storage.instances();
    const templates = new Map(this.storage.templates().map((t) => [t.id, t]));
    const byId = this.storage.foodById();
    return instances
      .map((i) => {
        const t = templates.get(i.templateId);
        const itemsWithFood = i.items
          .map((it) => ({
            food: byId.get(it.foodId),
            servings: it.servings,
          }))
          .filter(
            (x): x is { food: NonNullable<typeof x.food>; servings: number } =>
              x.food != null
          );
        const aggregates = aggregateNutrients(itemsWithFood);
        return {
          ...i,
          aggregates,
          templateName: t?.name ?? 'Unknown',
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  openCreateDialog(): void {
    const ref = this.dialog.open(InstanceCreateDialogComponent, {
      width: 'min(90vw, 560px)',
      data: {},
    });
    ref.afterClosed().subscribe((result) => {
      if (result?.date != null && result?.templateId != null && result?.name != null) {
        this.storage.addInstance({
          templateId: result.templateId,
          date: result.date,
          name: result.name,
          items: result.items ?? [],
        });
      }
    });
  }

  deleteInstance(id: string): void {
    if (typeof confirm !== 'undefined' && !confirm('Delete this meal instance?')) return;
    this.storage.deleteInstance(id);
  }

  exportCsv(): void {
    const csv = this.storage.exportInstancesCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'meal-instances.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  triggerImport(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        if (text) this.storage.importInstancesCsv(text);
      };
      reader.readAsText(file);
    };
    input.click();
  }
}
