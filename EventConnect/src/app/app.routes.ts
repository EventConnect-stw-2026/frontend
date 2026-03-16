import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from './features/home/home.component';
import { ExploreComponent } from './features/explore/explore.component';
import { MapComponent } from './features/map/map.component';
import { EventDetailComponent } from './features/event-detail/event-detail.component';
import { ProfileViewComponent } from './features/profile/profile-view/profile-view.component';
import { ProfileEditComponent } from './features/profile/profile-edit/profile-edit.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { authGuard } from './core/guards/auth.guard';

//! Añadir el AuthGuard al final del desarrollo
export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [authGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [authGuard] },
  { path: 'home', component: HomeComponent },
  { path: 'explore', component: ExploreComponent },
  { path: 'map', component: MapComponent },
  { path: 'events/:id', component: EventDetailComponent },
  { path: 'profile', component: ProfileViewComponent, canActivate: [authGuard] },
  { path: 'profile/edit', component: ProfileEditComponent, canActivate: [authGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
];