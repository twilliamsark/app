import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp,
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { nutritionOutline, layersOutline, restaurantOutline } from 'ionicons/icons';

addIcons({ nutritionOutline, layersOutline, restaurantOutline });

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    IonApp,
    IonTabs,
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    IonLabel,
    IonIcon,
    RouterLink,
    RouterLinkActive,
  ],
  template: `
    <ion-app>
      <ion-tabs>
        <ion-router-outlet />
        <ion-tab-bar slot="bottom">
        <ion-tab-button tab="foods" [routerLink]="['/foods']" routerLinkActive="tab-selected">
          <ion-icon name="nutrition-outline" />
          <ion-label>Foods</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="templates" [routerLink]="['/templates']" routerLinkActive="tab-selected">
          <ion-icon name="layers-outline" />
          <ion-label>Templates</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="meals" [routerLink]="['/meals']" routerLinkActive="tab-selected">
          <ion-icon name="restaurant-outline" />
          <ion-label>Meals</ion-label>
        </ion-tab-button>
        </ion-tab-bar>
      </ion-tabs>
    </ion-app>
  `,
  styles: [
    `
      ion-tab-bar {
        --background: var(--ion-toolbar-background, #1a1d21);
      }
      ion-tab-button.tab-selected {
        color: var(--ion-color-primary);
      }
    `,
  ],
})
export class AppComponent {}
