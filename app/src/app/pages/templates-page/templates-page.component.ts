import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { StorageService } from '../../services/storage.service';
import { TemplateBuilderService } from '../../services/template-builder.service';
import { aggregateNutrients } from '../../models/food.model';
import { DEFAULT_SERVING_TIME } from '../../models/serving-time.model';
import type { MealTemplateWithFoods } from '../../models/meal-template.model';
import { TemplateEditDialogComponent } from '../../components/template-edit-dialog/template-edit-dialog.component';
import {
  InstanceCreateDialogComponent,
  InstanceCreateDialogData,
} from '../../components/instance-create-dialog/instance-create-dialog.component';

@Component({
  selector: 'app-templates-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatCardModule, MatDialogModule],
  templateUrl: './templates-page.component.html',
  styleUrl: './templates-page.component.scss',
})
export class TemplatesPageComponent implements OnInit {
  private readonly storage = inject(StorageService);
  private readonly templateBuilder = inject(TemplateBuilderService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly templatesWithAggregates = computed<MealTemplateWithFoods[]>(() => {
    const templates = this.storage.templates();
    const byId = this.storage.foodById();
    return templates.map((t) => {
      const itemsWithFood = t.items
        .map((it) => ({
          food: byId.get(it.foodId),
          servings: it.servings,
        }))
        .filter((x): x is { food: NonNullable<typeof x.food>; servings: number } => x.food != null);
      const aggregates = aggregateNutrients(itemsWithFood);
      return {
        ...t,
        itemsWithFood,
        aggregates,
      };
    });
  });

  ngOnInit(): void {
    // If navigated with ?new=1 and we have a selection, open create dialog
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === '1') {
      const selection = this.templateBuilder.getSelection();
      if (selection.length > 0) {
        const foodById = this.storage.foodById();
        const firstFood = foodById.get(selection[0]!);
        const servingTime = firstFood?.servingTime ?? DEFAULT_SERVING_TIME;
        this.openCreateDialog(
          selection.map((id) => ({ foodId: id, servings: 1 })),
          servingTime,
        );
        this.templateBuilder.clearSelection();
        window.history.replaceState({}, '', '/templates');
      }
    }
  }

  openCreateDialog(
    initialItems?: { foodId: string; servings: number }[],
    initialServingTime?: string,
  ): void {
    const ref = this.dialog.open(TemplateEditDialogComponent, {
      width: 'min(90vw, 560px)',
      data: {
        name: '',
        servingTime: initialServingTime ?? DEFAULT_SERVING_TIME,
        items: initialItems ?? [],
      },
    });
    ref.afterClosed().subscribe((result) => {
      if (result?.name == null) return;
      const template = this.storage.addTemplate({
        name: result.name,
        servingTime: result.servingTime ?? DEFAULT_SERVING_TIME,
        items: result.items ?? [],
      });
      if (result.createMeal) {
        this.router.navigate(['/meals']);
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const instanceRef = this.dialog.open(InstanceCreateDialogComponent, {
          width: 'min(90vw, 560px)',
          data: { templateId: template.id, date: dateStr } satisfies InstanceCreateDialogData,
        });
        instanceRef.afterClosed().subscribe((instanceResult) => {
          if (
            instanceResult?.date != null &&
            instanceResult?.templateId != null &&
            instanceResult?.name != null
          ) {
            this.storage.addInstance({
              templateId: instanceResult.templateId,
              date: instanceResult.date,
              name: instanceResult.name,
              servingTime: instanceResult.servingTime ?? DEFAULT_SERVING_TIME,
              items: instanceResult.items ?? [],
            });
          }
        });
      }
    });
  }

  openEditDialog(template: MealTemplateWithFoods): void {
    const ref = this.dialog.open(TemplateEditDialogComponent, {
      width: 'min(90vw, 560px)',
      data: {
        id: template.id,
        name: template.name,
        servingTime: template.servingTime ?? DEFAULT_SERVING_TIME,
        items: template.items.map((it) => ({ foodId: it.foodId, servings: it.servings })),
      },
    });
    ref.afterClosed().subscribe((result) => {
      if (result != null && result.name != null && template.id) {
        this.storage.updateTemplate(template.id, {
          name: result.name,
          servingTime: result.servingTime,
          items: result.items ?? template.items,
        });
      }
    });
  }

  deleteTemplate(id: string): void {
    if (typeof confirm !== 'undefined' && !confirm('Delete this template?')) return;
    this.storage.deleteTemplate(id);
  }

  exportCsv(): void {
    const csv = this.storage.exportTemplatesCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'meal-templates.csv';
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
        if (text) this.storage.importTemplatesCsv(text);
      };
      reader.readAsText(file);
    };
    input.click();
  }
}
