import {
  Component,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';

addIcons({ closeOutline });

@Component({
  selector: 'app-add-food-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
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
    IonIcon,
  ],
  templateUrl: './add-food-dialog.component.html',
  styleUrl: './add-food-dialog.component.scss',
})
export class AddFoodDialogComponent {
  private readonly modal = inject(IonModalToken, { optional: true });
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    calories: [0, [Validators.required, Validators.min(0)]],
    sodium: [0, [Validators.required, Validators.min(0)]],
    protein: [0, [Validators.required, Validators.min(0)]],
    totalCarbs: [0, [Validators.required, Validators.min(0)]],
    fiberCarbs: [0, [Validators.required, Validators.min(0)]],
    netCarbs: [0, [Validators.required, Validators.min(0)]],
    sugarCarbs: [0, [Validators.required, Validators.min(0)]],
  });

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const name = (v.name ?? '').trim();
    if (!name) return;
    this.modal?.dismiss({
      name,
      calories: Number(v.calories) || 0,
      sodium: Number(v.sodium) || 0,
      protein: Number(v.protein) || 0,
      totalCarbs: Number(v.totalCarbs) || 0,
      fiberCarbs: Number(v.fiberCarbs) || 0,
      netCarbs: Number(v.netCarbs) || 0,
      sugarCarbs: Number(v.sugarCarbs) || 0,
    });
  }

  cancel(): void {
    this.modal?.dismiss();
  }
}
