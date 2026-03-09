import {
  Component,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { AddFoodDialogComponent, AddFoodDialogData } from '../../components/add-food-dialog/add-food-dialog.component';
import { DEFAULT_SERVING_TIME, SERVING_TIMES } from '../../models/serving-time.model';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { StorageService } from '../../services/storage.service';
import { CsvService } from '../../services/csv.service';
import { TemplateBuilderService } from '../../services/template-builder.service';
import type { Food } from '../../models/food.model';

@Component({
  selector: 'app-foods-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatDialogModule,
    MatSelectModule,
  ],
  templateUrl: './foods-page.component.html',
  styleUrl: './foods-page.component.scss',
})
export class FoodsPageComponent implements AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;

  private readonly storage = inject(StorageService);
  private readonly csv = inject(CsvService);
  private readonly templateBuilder = inject(TemplateBuilderService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly searchQuery = signal('');
  readonly servingTimeFilter = signal<string | null>(null);
  readonly maxCalories = signal<number | null>(null);
  readonly maxNetCarbs = signal<number | null>(null);
  readonly minProtein = signal<number | null>(null);
  readonly selectedIds = signal<Set<string>>(new Set());

  readonly dataSource = new MatTableDataSource<Food>([]);

  readonly filteredFoods = computed(() => {
    let list = this.storage.foods();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    const maxCal = this.maxCalories();
    if (maxCal != null && Number.isFinite(maxCal)) {
      list = list.filter((f) => f.calories <= maxCal);
    }
    const maxNet = this.maxNetCarbs();
    if (maxNet != null && Number.isFinite(maxNet)) {
      list = list.filter((f) => f.netCarbs <= maxNet);
    }
    const minPro = this.minProtein();
    if (minPro != null && Number.isFinite(minPro)) {
      list = list.filter((f) => f.protein >= minPro);
    }
    const st = this.servingTimeFilter();
    if (st != null && st !== '') {
      list = list.filter((f) => (f.servingTime ?? DEFAULT_SERVING_TIME) === st);
    }
    return list;
  });

  constructor() {
    effect(() => {
      this.dataSource.data = this.filteredFoods();
    });
  }

  ngAfterViewInit(): void {
    if (this.sort) this.dataSource.sort = this.sort;
  }

  readonly servingTimes = SERVING_TIMES;

  clearFilters(): void {
    this.searchQuery.set('');
    this.servingTimeFilter.set(null);
    this.maxCalories.set(null);
    this.maxNetCarbs.set(null);
    this.minProtein.set(null);
  }

  readonly displayedColumns = [
    'select',
    'name',
    'servingTime',
    'calories',
    'sodium',
    'protein',
    'totalCarbs',
    'fiberCarbs',
    'netCarbs',
    'sugarCarbs',
    'actions',
  ];

  toggleSelect(id: string): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.selectedIds.set(new Set(this.filteredFoods().map((f) => f.id)));
    } else {
      this.selectedIds.set(new Set());
    }
  }

  getSelectionChecked(): boolean {
    const list = this.filteredFoods();
    const selected = this.selectedIds();
    return list.length > 0 && list.every((f) => selected.has(f.id));
  }

  getSelectionIndeterminate(): boolean {
    const list = this.filteredFoods();
    const selected = this.selectedIds();
    const count = list.filter((f) => selected.has(f.id)).length;
    return count > 0 && count < list.length;
  }

  exportCsv(): void {
    const csv = this.storage.exportFoodsCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'foods.csv';
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
        if (text) this.storage.mergeFoods(this.csv.parseFoodCsv(text));
      };
      reader.readAsText(file);
    };
    input.click();
  }

  getSelectedFoods(): Food[] {
    const byId = new Map(this.storage.foods().map((f) => [f.id, f]));
    return [...this.selectedIds()].map((id) => byId.get(id)!).filter(Boolean);
  }

  saveSelectionAsTemplate(): void {
    const ids = [...this.selectedIds()];
    this.templateBuilder.setSelection(ids);
    this.router.navigate(['/templates'], { queryParams: { new: '1' } });
  }

  openAddFoodDialog(): void {
    const ref = this.dialog.open(AddFoodDialogComponent, {
      width: 'min(90vw, 520px)',
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      if ('id' in result && result.id) {
        const { id, ...patch } = result;
        this.storage.updateFood(id, patch);
      } else {
        this.storage.addFood(result);
      }
    });
  }

  openEditFoodDialog(food: Food): void {
    const ref = this.dialog.open(AddFoodDialogComponent, {
      width: 'min(90vw, 520px)',
      data: { food } satisfies AddFoodDialogData,
    });
    ref.afterClosed().subscribe((result) => {
      if (!result || !('id' in result)) return;
      const { id, ...patch } = result;
      this.storage.updateFood(id, patch);
    });
  }

  deleteFood(food: Food): void {
    if (!confirm(`Delete "${food.name}"? This cannot be undone.`)) return;
    this.storage.deleteFood(food.id);
    this.selectedIds.update((set) => {
      const next = new Set(set);
      next.delete(food.id);
      return next;
    });
  }
}
