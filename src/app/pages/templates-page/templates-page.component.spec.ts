import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { TemplatesPageComponent } from './templates-page.component';
import { StorageService } from '../../services/storage.service';
import { CsvService } from '../../services/csv.service';
import { TemplateBuilderService } from '../../services/template-builder.service';

describe('TemplatesPageComponent', () => {
  let fixture: ComponentFixture<TemplatesPageComponent>;
  let component: TemplatesPageComponent;
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
      imports: [TemplatesPageComponent],
      providers: [
        StorageService,
        CsvService,
        TemplateBuilderService,
        {
          provide: MatDialog,
          useValue: { open: dialogOpenSpy },
        },
      ],
    });
    TestBed.overrideProvider(MatDialog, {
      useValue: { open: dialogOpenSpy },
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
    const heading = fixture.nativeElement.querySelector('h1');
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

  it('openCreateDialog opens TemplateEditDialogComponent', () => {
    component.openCreateDialog();
    expect(dialogOpenSpy).toHaveBeenCalled();
    const componentClass = dialogOpenSpy.mock.calls[0][0];
    expect(componentClass?.name).toContain('TemplateEditDialogComponent');
  });

  it('adds template when dialog returns result', () => {
    const addDialogSpy = vi.fn().mockReturnValue({
      afterClosed: () => of({ name: 'New Template', items: [] }),
    });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TemplatesPageComponent],
      providers: [
        StorageService,
        CsvService,
        TemplateBuilderService,
        { provide: MatDialog, useValue: { open: addDialogSpy } },
      ],
    });
    TestBed.overrideProvider(MatDialog, {
      useValue: { open: addDialogSpy },
    });
    const addFixture = TestBed.createComponent(TemplatesPageComponent);
    const addComponent = addFixture.componentInstance;
    const addStorage = TestBed.inject(StorageService);
    addFixture.detectChanges();

    addComponent.openCreateDialog();
    addFixture.detectChanges();

    expect(addStorage.templates()).toHaveLength(1);
    expect(addStorage.templates()[0].name).toBe('New Template');
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
