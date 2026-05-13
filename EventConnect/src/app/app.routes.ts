/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: app.routes.ts
 * Descripción: Definición de todas las rutas principales de la aplicación.
 * Incluye navegación pública, autenticada y panel de administración.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Routes } from '@angular/router';

// ── Componentes de autenticación ─────────────────────────
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';

// ── Componentes principales ──────────────────────────────
import { HomeComponent } from './features/home/home.component';
import { ExploreComponent } from './features/explore/explore.component';
import { MapComponent } from './features/map/map.component';
import { EventDetailComponent } from './features/event-detail/event-detail.component';
import { StatsComponent } from './features/stats/stats.component';

// ── Perfil de usuario ────────────────────────────────────
import { ProfileViewComponent } from './features/profile/profile-view/profile-view.component';
import { ProfileEditComponent } from './features/profile/profile-edit/profile-edit.component';
import { HistoryComponent } from './features/profile/history/history.component';
import { FavoritesComponent } from './features/profile/favorites/favorites.component';

// ── Social ───────────────────────────────────────────────
import { FriendsComponent } from './features/friends/friends.component';
import { ChatDetailComponent } from './features/chat-detail/chat-detail.component';
import { MeetupsComponent } from './features/meetups/meetups.component';

// ── Guards ───────────────────────────────────────────────
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

// ── Administración ───────────────────────────────────────
import { AdminLayoutComponent } from './features/admin/layout/admin-layout.component';
import { AdminDashboardComponent } from './features/admin/pages/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './features/admin/pages/admin-users/admin-users.component';
import { AdminEventsComponent } from './features/admin/pages/admin-events/admin-events.component';
import { AdminReportsComponent } from './features/admin/pages/admin-reports/admin-reports.component';
import { AdminSettingsComponent } from './features/admin/pages/admin-settings/admin-settings.component';

/**
 * Definición principal de rutas de la aplicación.
 */
export const routes: Routes = [

  // ── Redirección inicial ────────────────────────────────
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  // ── Autenticación ──────────────────────────────────────
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [authGuard]
  },

  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [authGuard]
  },

  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },

  {
    path: 'reset-password',
    component: ResetPasswordComponent
  },

  // ── Navegación pública ─────────────────────────────────
  {
    path: 'home',
    component: HomeComponent
  },

  {
    path: 'explore',
    component: ExploreComponent
  },

  {
    path: 'map',
    component: MapComponent
  },

  {
    path: 'events/:id',
    component: EventDetailComponent
  },

  {
    path: 'stats',
    component: StatsComponent
  },

  // ── Perfil y usuario ───────────────────────────────────
  {
    path: 'profile',
    component: ProfileViewComponent,
    canActivate: [authGuard]
  },

  {
    path: 'profile/edit',
    component: ProfileEditComponent,
    canActivate: [authGuard]
  },

  {
    path: 'history',
    component: HistoryComponent,
    canActivate: [authGuard]
  },

  {
    path: 'favorites',
    component: FavoritesComponent,
    canActivate: [authGuard]
  },

  // ── Funcionalidades sociales ───────────────────────────
  {
    path: 'friends',
    component: FriendsComponent,
    canActivate: [authGuard]
  },

  {
    path: 'chat/:conversationId',
    component: ChatDetailComponent,
    canActivate: [authGuard]
  },

  {
    path: 'meetups',
    component: MeetupsComponent,
    canActivate: [authGuard]
  },

  // ── Panel de administración ────────────────────────────
  {
    path: 'admin',

    component: AdminLayoutComponent,

    // Protección de acceso administrador
    canActivate: [authGuard, adminGuard],

    // Protección de rutas hijas
    canActivateChild: [adminGuard],

    children: [

      {
        path: 'dashboard',
        component: AdminDashboardComponent
      },

      {
        path: 'users',
        component: AdminUsersComponent
      },

      {
        path: 'events',
        component: AdminEventsComponent
      },

      {
        path: 'reports',
        component: AdminReportsComponent
      },

      {
        path: 'settings',
        component: AdminSettingsComponent
      }
    ]
  }
];