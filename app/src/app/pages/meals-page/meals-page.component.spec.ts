import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { MealsPageComponent } from './meals-page.component';
import { StorageService } from '../../services/storage.service';
import { CsvService } from '../../services/csv.service';

describe('MealsPageComponent', () => {
  let fixture: ComponentFixture<MealsPageComponent>;
  let component: MealsPageComponent;
  let storage: StorageService;
  let dialogOpenSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.removeItem('nutrition_foods');
    localStorage.removeItem('nutrition_templates');
    localStorage.removeItem('nutrition_instances');

    dialogOpenSpy = vi.fn().mockReturnValue({
      afterClosed: () => of(undefined),
    });

    TestBed.configureTestingModule({
      imports: [MealsPageComponent],
      providers: [
        StorageService,
        CsvService,
        {
          provide: MatDialog,
          useValue: { open: dialogOpenSpy },
        },
      ],
    });
    TestBed.overrideProvider(MatDialog, {
      useValue: { open: dialogOpenSpy },
    });

    fixture = TestBed.createComponent(MealsPageComponent);
    component = fixture.componentInstance;
    storage = TestBed.inject(StorageService);
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders the Meals heading', () => {
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading?.textContent?.trim()).toBe('Meals');
  });

  it('shows instances with aggregates sorted by date descending', () => {
    const template = storage.addTemplate({
      name: 'Lunch',
      items: [],
    });
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
    storage.addInstance({
      templateId: template.id,
      date: '2025-03-01',
      name: 'Lunch Monday',
      items: [{ foodId: food.id, servings: 1 }],
    });
    storage.addInstance({
      templateId: template.id,
      date: '2025-03-05',
      name: 'Lunch Friday',
      items: [{ foodId: food.id, servings: 2 }],
    });
    fixture.detectChanges();

    const instances = component.instancesWithAggregates();
    expect(instances).toHaveLength(2);
    expect(instances[0].date).toBe('2025-03-05');
    expect(instances[1].date).toBe('2025-03-01');
    expect(instances[0].aggregates.calories).toBe(140);
  });

  it('openCreateDialog opens InstanceCreateDialogComponent', () => {
    component.openCreateDialog();
    expect(dialogOpenSpy).toHaveBeenCalled();
    const componentClass = dialogOpenSpy.mock.calls[0][0];
    expect(componentClass?.name).toContain('InstanceCreateDialogComponent');
  });

  it('adds instance when dialog returns result', () => {
    const addDialogSpy = vi.fn().mockReturnValue({
      afterClosed: () =>
        of({
          templateId: 't1',
          date: '2025-03-05',
          name: 'Lunch',
          items: [],
        }),
    });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [MealsPageComponent],
      providers: [
        StorageService,
        CsvService,
        { provide: MatDialog, useValue: { open: addDialogSpy } },
      ],
    });
    const addStorage = TestBed.inject(StorageService);
    const template = addStorage.addTemplate({
      name: 'Lunch',
      items: [],
    });
    addDialogSpy.mockReturnValue({
      afterClosed: () =>
        of({
          templateId: template.id,
          date: '2025-03-05',
          name: 'Lunch',
          items: [],
        }),
    });
    const addFixture = TestBed.createComponent(MealsPageComponent);
    const addComponent = addFixture.componentInstance;
    addFixture.detectChanges();

    addComponent.openCreateDialog();
    addFixture.detectChanges();

    expect(addStorage.instances()).toHaveLength(1);
    expect(addStorage.instances()[0].date).toBe('2025-03-05');
  });

  it('deleteInstance removes instance when confirmed', () => {
    const template = storage.addTemplate({ name: 'Lunch', items: [] });
    const i = storage.addInstance({
      templateId: template.id,
      date: '2025-03-05',
      name: 'Lunch',
      items: [],
    });
    vi.stubGlobal('confirm', () => true);
    fixture.detectChanges();

    component.deleteInstance(i.id);

    expect(storage.instances()).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  it('exportCsv calls storage.exportInstancesCsv', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const exportSpy = vi.spyOn(storage, 'exportInstancesCsv').mockReturnValue('header\n');
    component.exportCsv();
    expect(exportSpy).toHaveBeenCalled();
  });
});
