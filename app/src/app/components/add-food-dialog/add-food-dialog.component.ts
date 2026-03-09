import {
  Component,
  inject,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import type { Food } from '../../models/food.model';

export interface AddFoodDialogData {
  food?: Food;
}

@Component({
  selector: 'app-add-food-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './add-food-dialog.component.html',
  styleUrl: './add-food-dialog.component.scss',
})
export class AddFoodDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<AddFoodDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly data = inject<AddFoodDialogData | null>(MAT_DIALOG_DATA, { optional: true });

  readonly isEdit = !!this.data?.food;

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

  ngOnInit(): void {
    const food = this.data?.food;
    if (food) {
      this.form.patchValue({
        name: food.name,
        calories: food.calories,
        sodium: food.sodium,
        protein: food.protein,
        totalCarbs: food.totalCarbs,
        fiberCarbs: food.fiberCarbs,
        netCarbs: food.netCarbs,
        sugarCarbs: food.sugarCarbs,
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const name = (v.name ?? '').trim();
    if (!name) return;
    const payload = {
      name,
      calories: Number(v.calories) || 0,
      sodium: Number(v.sodium) || 0,
      protein: Number(v.protein) || 0,
      totalCarbs: Number(v.totalCarbs) || 0,
      fiberCarbs: Number(v.fiberCarbs) || 0,
      netCarbs: Number(v.netCarbs) || 0,
      sugarCarbs: Number(v.sugarCarbs) || 0,
    };
    this.dialogRef.close(this.isEdit ? { id: this.data!.food!.id, ...payload } : payload);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
