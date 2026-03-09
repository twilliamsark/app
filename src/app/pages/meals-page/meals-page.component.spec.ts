import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';
import { MealsPageComponent } from './meals-page.component';
import { StorageService } from '../../services/storage.service';
import { CsvService } from '../../services/csv.service';

describe('MealsPageComponent', () => {
  let fixture: ComponentFixture<MealsPageComponent>;
  let component: MealsPageComponent;
  let storage: StorageService;
  let modalCreateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.removeItem('nutrition_foods');
    localStorage.removeItem('nutrition_templates');
    localStorage.removeItem('nutrition_instances');

    modalCreateSpy = vi.fn().mockResolvedValue({
      present: vi.fn().mockResolvedValue(undefined),
      onDidDismiss: () => Promise.resolve({ data: undefined }),
    });

    TestBed.configureTestingModule({
      imports: [MealsPageComponent],
      providers: [
        StorageService,
        CsvService,
        {
          provide: ModalController,
          useValue: { create: modalCreateSpy },
        },
      ],
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
    const heading = fixture.nativeElement.querySelector('ion-title');
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

  it('openCreateDialog opens InstanceCreateDialogComponent', async () => {
    await component.openCreateDialog();
    expect(modalCreateSpy).toHaveBeenCalled();
    const config = modalCreateSpy.mock.calls[0][0];
    expect(config.component?.name).toContain('InstanceCreateDialogComponent');
  });

  it('adds instance when dialog returns result', async () => {
    const template = storage.addTemplate({
      name: 'Lunch',
      items: [],
    });
    modalCreateSpy.mockResolvedValue({
      present: vi.fn().mockResolvedValue(undefined),
      onDidDismiss: () =>
        Promise.resolve({
          data: {
            templateId: template.id,
            date: '2025-03-05',
            name: 'Lunch',
            items: [],
          },
        }),
    });

    await component.openCreateDialog();
    fixture.detectChanges();

    expect(storage.instances()).toHaveLength(1);
    expect(storage.instances()[0].date).toBe('2025-03-05');
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
