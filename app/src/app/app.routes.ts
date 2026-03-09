import { Routes } from '@angular/router';
import { FoodsPageComponent } from './pages/foods-page/foods-page.component';
import { TemplatesPageComponent } from './pages/templates-page/templates-page.component';
import { MealsPageComponent } from './pages/meals-page/meals-page.component';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'foods' },
  { path: 'foods', component: FoodsPageComponent },
  { path: 'templates', component: TemplatesPageComponent },
  { path: 'meals', component: MealsPageComponent },
  { path: '**', redirectTo: 'foods' },
];
