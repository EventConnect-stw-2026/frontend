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
import { StatsComponent } from './features/stats/stats.component';
import { FriendsComponent } from './features/friends/friends.component';
import { ChatDetailComponent } from './features/chat-detail/chat-detail.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { AdminLayoutComponent } from './features/admin/layout/admin-layout.component';
import { AdminDashboardComponent } from './features/admin/pages/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './features/admin/pages/admin-users/admin-users.component';
import { AdminEventsComponent } from './features/admin/pages/admin-events/admin-events.component';
import { AdminReportsComponent } from './features/admin/pages/admin-reports/admin-reports.component';
import { AdminSettingsComponent } from './features/admin/pages/admin-settings/admin-settings.component';




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
  { path: 'stats', component: StatsComponent },
  { path: 'friends', component: FriendsComponent, canActivate: [authGuard] },
  { path: 'chat/:conversationId', component: ChatDetailComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminLayoutComponent, canActivate: [authGuard, adminGuard], canActivateChild: [adminGuard], children: [
    { path: 'dashboard', component: AdminDashboardComponent },
    { path: 'users', component: AdminUsersComponent },
    { path: 'events', component: AdminEventsComponent },
    { path: 'reports', component: AdminReportsComponent },
    { path: 'settings', component: AdminSettingsComponent }
  ] }
];