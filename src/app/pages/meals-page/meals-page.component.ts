import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, downloadOutline, addOutline, trashOutline } from 'ionicons/icons';
import { StorageService } from '../../services/storage.service';
import { aggregateNutrients, type FoodNutrients } from '../../models/food.model';
import type { MealInstance } from '../../models/meal-instance.model';
import { InstanceCreateDialogComponent } from '../../components/instance-create-dialog/instance-create-dialog.component';

addIcons({ cloudUploadOutline, downloadOutline, addOutline, trashOutline });

interface InstanceWithAggregates extends MealInstance {
  aggregates: FoodNutrients;
  templateName: string;
}

export interface DayRow {
  date: string;
  instances: InstanceWithAggregates[];
  dayAggregates: FoodNutrients;
}

@Component({
  selector: 'app-meals-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
  ],
  templateUrl: './meals-page.component.html',
  styleUrl: './meals-page.component.scss',
})
export class MealsPageComponent {
  private readonly storage = inject(StorageService);
  private readonly modalCtrl = inject(ModalController);

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

  readonly daysWithSummaries = computed<DayRow[]>(() => {
    const list = this.instancesWithAggregates();
    if (list.length === 0) return [];
    const rows: DayRow[] = [];
    let currentDate = list[0].date;
    let currentInstances: InstanceWithAggregates[] = [];
    const zero: FoodNutrients = {
      calories: 0,
      sodium: 0,
      protein: 0,
      totalCarbs: 0,
      fiberCarbs: 0,
      netCarbs: 0,
      sugarCarbs: 0,
    };
    const sumAggregates = (a: FoodNutrients, b: FoodNutrients): FoodNutrients => ({
      calories: a.calories + b.calories,
      sodium: a.sodium + b.sodium,
      protein: a.protein + b.protein,
      totalCarbs: a.totalCarbs + b.totalCarbs,
      fiberCarbs: a.fiberCarbs + b.fiberCarbs,
      netCarbs: a.netCarbs + b.netCarbs,
      sugarCarbs: a.sugarCarbs + b.sugarCarbs,
    });
    const flush = (date: string, instances: InstanceWithAggregates[]) => {
      if (instances.length === 0) return;
      const dayAggregates = instances.reduce(
        (acc, m) => sumAggregates(acc, m.aggregates),
        zero
      );
      rows.push({ date, instances, dayAggregates });
    };
    for (const m of list) {
      if (m.date !== currentDate) {
        flush(currentDate, currentInstances);
        currentDate = m.date;
        currentInstances = [];
      }
      currentInstances.push(m);
    }
    flush(currentDate, currentInstances);
    return rows;
  });

  async openCreateDialog(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: InstanceCreateDialogComponent,
      componentProps: {},
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.date != null && data?.templateId != null && data?.name != null) {
      this.storage.addInstance({
        templateId: data.templateId,
        date: data.date,
        name: data.name,
        items: data.items ?? [],
      });
    }
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
