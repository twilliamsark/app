import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  input,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonModalToken } from '@ionic/angular/standalone';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonButtons,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonSearchbar,
  IonList,
  IonCheckbox,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { StorageService } from '../../services/storage.service';

addIcons({ closeOutline });

export interface TemplateEditDialogData {
  id?: string;
  name: string;
  items: { foodId: string; servings: number }[];
}

@Component({
  selector: 'app-template-edit-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFooter,
    IonButtons,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonSearchbar,
    IonList,
    IonCheckbox,
    IonIcon,
  ],
  templateUrl: './template-edit-dialog.component.html',
  styleUrl: './template-edit-dialog.component.scss',
})
export class TemplateEditDialogComponent implements OnInit {
  private readonly modal = inject(IonModalToken, { optional: true });
  private readonly storage = inject(StorageService);

  idProp = input<string | undefined>();
  nameProp = input<string>('');
  itemsProp = input<{ foodId: string; servings: number }[]>([]);

  readonly name = signal('');
  readonly items = signal<{ foodId: string; servings: number }[]>([]);
  readonly createMeal = signal(false);
  readonly showFoodList = signal(false);

  ngOnInit(): void {
    this.name.set(this.nameProp());
    this.items.set([...this.itemsProp()]);
  }

  readonly foodOptions = computed(() => this.storage.foods());
  readonly addFoodInputValue = signal<string>('');
  readonly foodById = this.storage.foodById;

  readonly filteredFoodOptions = computed(() => {
    const foods = this.foodOptions();
    const existingIds = new Set(this.items().map((it) => it.foodId));
    const available = foods.filter((f) => !existingIds.has(f.id));
    const q = this.addFoodInputValue().toLowerCase().trim();
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

  onAddFoodSearch(ev: CustomEvent): void {
    this.addFoodInputValue.set((ev.target as HTMLIonSearchbarElement).value ?? '');
    this.showFoodList.set(true);
  }

  onAddFoodOptionSelected(option: { id: string; name: string }): void {
    this.addItem(option.id);
    this.addFoodInputValue.set('');
    this.showFoodList.set(false);
  }

  addItem(foodId?: string): void {
    const id = foodId ?? (this.filteredFoodOptions()[0]?.id);
    if (!id) return;
    if (this.items().some((it) => it.foodId === id)) return;
    this.items.update((list) => [...list, { foodId: id, servings: 1 }]);
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
    this.modal?.dismiss({
      name: n,
      items: this.items().filter((it) => it.servings > 0),
      createMeal: this.createMeal(),
    });
  }

  cancel(): void {
    this.modal?.dismiss();
  }
}
