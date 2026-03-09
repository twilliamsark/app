import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
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
  IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, downloadOutline, addOutline, createOutline, trashOutline } from 'ionicons/icons';
import { StorageService } from '../../services/storage.service';
import { TemplateBuilderService } from '../../services/template-builder.service';
import { aggregateNutrients } from '../../models/food.model';
import type { MealTemplateWithFoods } from '../../models/meal-template.model';
import { TemplateEditDialogComponent } from '../../components/template-edit-dialog/template-edit-dialog.component';
import { InstanceCreateDialogComponent } from '../../components/instance-create-dialog/instance-create-dialog.component';

addIcons({ cloudUploadOutline, downloadOutline, addOutline, createOutline, trashOutline });

@Component({
  selector: 'app-templates-page',
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
    IonCardContent,
  ],
  templateUrl: './templates-page.component.html',
  styleUrl: './templates-page.component.scss',
})
export class TemplatesPageComponent implements OnInit {
  private readonly storage = inject(StorageService);
  private readonly templateBuilder = inject(TemplateBuilderService);
  private readonly modalCtrl = inject(ModalController);
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
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === '1') {
      const selection = this.templateBuilder.getSelection();
      if (selection.length > 0) {
        this.openCreateDialog(selection.map((id) => ({ foodId: id, servings: 1 })));
        this.templateBuilder.clearSelection();
        window.history.replaceState({}, '', '/templates');
      }
    }
  }

  async openCreateDialog(initialItems?: { foodId: string; servings: number }[]): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: TemplateEditDialogComponent,
      componentProps: {
        nameProp: '',
        itemsProp: initialItems ?? [],
      },
    });
    await modal.present();
    const { data: result } = await modal.onDidDismiss();
    if (result?.name == null) return;
    const template = this.storage.addTemplate({
      name: result.name,
      items: result.items ?? [],
    });
    if (result.createMeal) {
      this.router.navigate(['/meals']);
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const instanceModal = await this.modalCtrl.create({
        component: InstanceCreateDialogComponent,
        componentProps: {
          templateIdProp: template.id,
          dateProp: dateStr,
        },
      });
      await instanceModal.present();
      const { data: instanceResult } = await instanceModal.onDidDismiss();
      if (
        instanceResult?.date != null &&
        instanceResult?.templateId != null &&
        instanceResult?.name != null
      ) {
        this.storage.addInstance({
          templateId: instanceResult.templateId,
          date: instanceResult.date,
          name: instanceResult.name,
          items: instanceResult.items ?? [],
        });
      }
    }
  }

  async openEditDialog(template: MealTemplateWithFoods): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: TemplateEditDialogComponent,
      componentProps: {
        idProp: template.id,
        nameProp: template.name,
        itemsProp: template.items.map((it) => ({ foodId: it.foodId, servings: it.servings })),
      },
    });
    await modal.present();
    const { data: result } = await modal.onDidDismiss();
    if (result != null && result.name != null && template.id) {
      this.storage.updateTemplate(template.id, {
        name: result.name,
        items: result.items ?? template.items,
      });
    }
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
