import { Routes } from '@angular/router';
import { HomeComponent } from './home';

export const appRoutes: Routes = [
  { path: '',      component: HomeComponent },
  { path: 'home',  component: HomeComponent },
];
