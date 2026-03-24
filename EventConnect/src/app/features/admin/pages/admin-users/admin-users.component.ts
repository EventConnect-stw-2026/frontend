import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { AdminTopbarComponent } from '../../components/admin-topbar/admin-topbar.component';
import { AdminService, AdminUser } from '../../../../core/services/admin.service';

interface AdminUserView {
  id: string;
  name: string;
  email: string;
  role: 'Usuario' | 'Admin';
  status: 'Activo' | 'Baneado';
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminTopbarComponent],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent {
  private adminService = inject(AdminService);

  search = '';
  selectedRole = 'Todos';

  users$: Observable<{
    users: AdminUserView[];
    isLoading: boolean;
    errorMessage: string;
  }> = this.adminService.getUsers().pipe(
    map((response) => ({
      users: response.users.map((user: AdminUser) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role === 'admin' ? 'Admin' as 'Admin' : 'Usuario' as 'Usuario',
        status: user.isBlocked ? 'Baneado' as 'Baneado' : 'Activo' as 'Activo'
      })),
      isLoading: false,
      errorMessage: ''
    })),
    startWith({
      users: [],
      isLoading: true,
      errorMessage: ''
    }),
    catchError((error) => of({
      users: [],
      isLoading: false,
      errorMessage: error?.error?.message || 'No se pudo cargar la lista de usuarios'
    }))
  );

  filteredUsers(users: AdminUserView[]): AdminUserView[] {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(this.search.toLowerCase()) ||
        user.email.toLowerCase().includes(this.search.toLowerCase());
      const matchesRole =
        this.selectedRole === 'Todos' || user.role === this.selectedRole;
      return matchesSearch && matchesRole;
    });
  }

  editUser(user: AdminUserView): void {
    console.log('Editar usuario', user);
  }

  changeRole(user: AdminUserView): void {
    console.log('Cambiar rol', user);
  }

  deleteUser(user: AdminUserView): void {
    console.log('Eliminar usuario', user);
  }
}