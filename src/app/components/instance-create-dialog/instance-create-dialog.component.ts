import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
  input,
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
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { StorageService } from '../../services/storage.service';

addIcons({ closeOutline });

export interface InstanceCreateDialogData {
  templateId?: string;
  date?: string;
}

@Component({
  selector: 'app-instance-create-dialog',
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
    IonIcon,
  ],
  templateUrl: './instance-create-dialog.component.html',
  styleUrl: './instance-create-dialog.component.scss',
})
export class InstanceCreateDialogComponent implements OnInit {
  private readonly modal = inject(IonModalToken, { optional: true });
  private readonly storage = inject(StorageService);

  templateIdProp = input<string | undefined>();
  dateProp = input<string | undefined>();

  readonly templateId = signal<string | null>(null);
  readonly templateInputValue = signal<string | { id: string; name: string } | null>(null);
  readonly dateValue = signal<string>(this.todayStr());
  readonly name = signal('');
  readonly items = signal<{ foodId: string; servings: number }[]>([]);
  readonly showTemplateList = signal(false);

  getTemplateSearchDisplay(): string {
    const v = this.templateInputValue();
    if (v == null) return '';
    return typeof v === 'object' ? v.name : v;
  }

  ngOnInit(): void {
    const tid = this.templateIdProp();
    const d = this.dateProp();
    if (tid) {
      const t = this.storage.templates().find((x) => x.id === tid);
      if (t) {
        this.templateInputValue.set({ id: t.id, name: t.name });
        this.onTemplateChange(t.id);
      }
    }
    if (d) this.dateValue.set(d);
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
    const d = this.dateValue();
    const n = this.name().trim();
    return tid != null && (d?.length ?? 0) > 0 && n.length > 0 && this.items().length > 0;
  });

  private todayStr(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  onTemplateSearchInput(ev: CustomEvent): void {
    const value = (ev.target as HTMLIonSearchbarElement).value ?? '';
    this.templateInputValue.set(value);
    this.showTemplateList.set(true);
    if (this.templateId()) this.onTemplateChange(null);
  }

  onTemplateOptionSelected(option: { id: string; name: string }): void {
    this.templateInputValue.set(option.name);
    this.onTemplateChange(option.id);
    this.showTemplateList.set(false);
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
    const d = this.dateValue();
    const n = this.name().trim();
    if (!tid || !d || !n) return;
    this.modal?.dismiss({
      templateId: tid,
      date: d,
      name: n,
      items: this.items().filter((it) => it.servings > 0),
    });
  }

  cancel(): void {
    this.modal?.dismiss();
  }
}
