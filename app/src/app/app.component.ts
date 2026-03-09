import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary">
      <span class="title">Nutrition</span>
      <nav class="nav">
        <a mat-button routerLink="/foods" routerLinkActive="active">Foods</a>
        <a mat-button routerLink="/templates" routerLinkActive="active">Templates</a>
        <a mat-button routerLink="/meals" routerLinkActive="active">Meals</a>
      </nav>
    </mat-toolbar>
    <main class="main">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
      .title { font-weight: 600; margin-right: 1.5rem; }
      .nav { display: flex; gap: 0.25rem; }
      .nav a.active { background: rgba(255,255,255,0.12); }
      .main { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    `,
  ],
})
export class AppComponent {}
