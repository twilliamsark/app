/**
 * Page component tests are excluded from the default test run (see angular.json test exclude)
 * because they import Ionic, which triggers an ES module resolution issue in Vitest.
 * Run these specs manually or re-enclude when Vitest/Ionic resolve the directory-import compatibility.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { FoodsPageComponent } from './foods-page.component';
import { AddFoodDialogComponent } from '../../components/add-food-dialog/add-food-dialog.component';
import { StorageService } from '../../services/storage.service';
import { CsvService } from '../../services/csv.service';
import { TemplateBuilderService } from '../../services/template-builder.service';

describe('FoodsPageComponent', () => {
  let fixture: ComponentFixture<FoodsPageComponent>;
  let component: FoodsPageComponent;
  let storage: StorageService;
  let csv: CsvService;
  let navigateSpy: ReturnType<typeof vi.fn>;
  let modalCreateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.removeItem('nutrition_foods');
    localStorage.removeItem('nutrition_templates');
    localStorage.removeItem('nutrition_instances');

    modalCreateSpy = vi.fn().mockResolvedValue({
      present: vi.fn().mockResolvedValue(undefined),
      onDidDismiss: () => Promise.resolve({ data: undefined }),
    });

    navigateSpy = vi.fn().mockResolvedValue(true);

    TestBed.configureTestingModule({
      imports: [FoodsPageComponent],
      providers: [
        StorageService,
        CsvService,
        TemplateBuilderService,
        {
          provide: Router,
          useValue: {
            navigate: navigateSpy,
            navigateByUrl: vi.fn().mockResolvedValue(true),
            url: '/',
            events: of(),
          },
        },
        {
          provide: ModalController,
          useValue: { create: modalCreateSpy },
        },
      ],
    });

    fixture = TestBed.createComponent(FoodsPageComponent);
    component = fixture.componentInstance;
    storage = TestBed.inject(StorageService);
    csv = TestBed.inject(CsvService);
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders the Foods heading', () => {
    const heading = fixture.nativeElement.querySelector('ion-title');
    expect(heading?.textContent?.trim()).toBe('Foods');
  });

  it('filters foods by search query', () => {
    storage.addFood({
      name: 'Eggs',
      calories: 70,
      sodium: 60,
      protein: 6,
      totalCarbs: 0,
      fiberCarbs: 0,
      netCarbs: 0,
      sugarCarbs: 0,
    });
    storage.addFood({
      name: 'Oatmeal',
      calories: 150,
      sodium: 0,
      protein: 5,
      totalCarbs: 27,
      fiberCarbs: 4,
      netCarbs: 23,
      sugarCarbs: 1,
    });
    fixture.detectChanges();

    component.searchQuery.set('egg');
    fixture.detectChanges();

    const filtered = component.filteredFoods();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Eggs');
  });

  it('filters foods by max calories', () => {
    storage.addFood({
      name: 'Low cal',
      calories: 50,
      sodium: 0,
      protein: 0,
      totalCarbs: 0,
      fiberCarbs: 0,
      netCarbs: 0,
      sugarCarbs: 0,
    });
    storage.addFood({
      name: 'High cal',
      calories: 500,
      sodium: 0,
      protein: 0,
      totalCarbs: 0,
      fiberCarbs: 0,
      netCarbs: 0,
      sugarCarbs: 0,
    });
    fixture.detectChanges();

    component.maxCalories.set(100);
    fixture.detectChanges();

    const filtered = component.filteredFoods();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Low cal');
  });

  it('toggleSelect adds and removes id from selection', () => {
    const food = storage.addFood({
      name: 'Eggs',
      calories: 70,
      sodium: 60,
      protein: 6,
      totalCarbs: 0,
      fiberCarbs: 0,
      netCarbs: 0,
      sugarCarbs: 0,
    });
    fixture.detectChanges();

    expect(component.selectedIds().has(food.id)).toBe(false);
    component.toggleSelect(food.id);
    expect(component.selectedIds().has(food.id)).toBe(true);
    component.toggleSelect(food.id);
    expect(component.selectedIds().has(food.id)).toBe(false);
  });

  it('exportCsv calls storage.exportFoodsCsv', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const exportSpy = vi.spyOn(storage, 'exportFoodsCsv').mockReturnValue('id,name\n');
    component.exportCsv();
    expect(exportSpy).toHaveBeenCalled();
  });

  it('openAddFoodDialog opens AddFoodDialogComponent', async () => {
    await component.openAddFoodDialog();
    expect(modalCreateSpy).toHaveBeenCalled();
    const config = modalCreateSpy.mock.calls[0][0];
    expect(config.component).toBe(AddFoodDialogComponent);
  });

  it('saveSelectionAsTemplate sets selection and navigates', () => {
    const food = storage.addFood({
      name: 'Eggs',
      calories: 70,
      sodium: 60,
      protein: 6,
      totalCarbs: 0,
      fiberCarbs: 0,
      netCarbs: 0,
      sugarCarbs: 0,
    });
    fixture.detectChanges();

    component.toggleSelect(food.id);
    component.saveSelectionAsTemplate();

    expect(navigateSpy).toHaveBeenCalledWith(['/templates'], {
      queryParams: { new: '1' },
    });
  });
});
