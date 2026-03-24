import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss'
})
export class AdminSidebarComponent {
  menuItems = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: '▪' },
    { label: 'Usuarios', route: '/admin/users', icon: '👥' },
    { label: 'Eventos', route: '/admin/events', icon: '📌' },
    { label: 'Moderación', route: '/admin/moderation', icon: '●', badge: 8 },
    { label: 'Roles', route: '/admin/roles', icon: '🔐' },
    { label: 'Reportes', route: '/admin/reports', icon: '📊' },
    { label: 'Configuración', route: '/admin/settings', icon: '⚙' }
  ];
}