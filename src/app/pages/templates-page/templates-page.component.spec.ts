import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';
import { TemplatesPageComponent } from './templates-page.component';
import { StorageService } from '../../services/storage.service';
import { CsvService } from '../../services/csv.service';
import { TemplateBuilderService } from '../../services/template-builder.service';

describe('TemplatesPageComponent', () => {
  let fixture: ComponentFixture<TemplatesPageComponent>;
  let component: TemplatesPageComponent;
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
      imports: [TemplatesPageComponent],
      providers: [
        StorageService,
        CsvService,
        TemplateBuilderService,
        {
          provide: ModalController,
          useValue: { create: modalCreateSpy },
        },
      ],
    });

    fixture = TestBed.createComponent(TemplatesPageComponent);
    component = fixture.componentInstance;
    storage = TestBed.inject(StorageService);
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders the Meal templates heading', () => {
    const heading = fixture.nativeElement.querySelector('ion-title');
    expect(heading?.textContent?.trim()).toBe('Meal templates');
  });

  it('shows templates with aggregates', () => {
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
    storage.addTemplate({
      name: 'Breakfast',
      items: [{ foodId: food.id, servings: 2 }],
    });
    fixture.detectChanges();

    const templates = component.templatesWithAggregates();
    expect(templates).toHaveLength(1);
    expect(templates[0].name).toBe('Breakfast');
    expect(templates[0].aggregates.calories).toBe(140);
  });

  it('openCreateDialog opens TemplateEditDialogComponent', async () => {
    await component.openCreateDialog();
    expect(modalCreateSpy).toHaveBeenCalled();
    const config = modalCreateSpy.mock.calls[0][0];
    expect(config.component?.name).toContain('TemplateEditDialogComponent');
  });

  it('adds template when dialog returns result', async () => {
    modalCreateSpy.mockResolvedValue({
      present: vi.fn().mockResolvedValue(undefined),
      onDidDismiss: () =>
        Promise.resolve({
          data: { name: 'New Template', items: [] },
        }),
    });

    await component.openCreateDialog();
    fixture.detectChanges();

    expect(storage.templates()).toHaveLength(1);
    expect(storage.templates()[0].name).toBe('New Template');
  });

  it('deleteTemplate removes template when confirmed', () => {
    const t = storage.addTemplate({ name: 'To Delete', items: [] });
    vi.stubGlobal('confirm', () => true);
    fixture.detectChanges();

    component.deleteTemplate(t.id);

    expect(storage.templates()).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  it('exportCsv calls storage.exportTemplatesCsv', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const exportSpy = vi.spyOn(storage, 'exportTemplatesCsv').mockReturnValue('header\n');
    component.exportCsv();
    expect(exportSpy).toHaveBeenCalled();
  });
});
