/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: admin-users.component.ts
 * Descripción: Componente encargado de la gestión de usuarios desde el panel de administración.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, startWith, switchMap, finalize } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { AdminTopbarComponent } from '../../components/admin-topbar/admin-topbar.component';
import { AdminService, AdminUser } from '../../../../core/services/admin.service';

// Interface para representar un usuario dentro de la tabla de administración,
// adaptando los datos recibidos del backend a valores visibles en la interfaz.
interface AdminUserView {
  id: string;
  name: string;
  email: string;
  role: 'Usuario' | 'Admin';
  status: 'Activo' | 'Baneado';
}

// Componente encargado de gestionar los usuarios del panel de administración.
// Permite listar, filtrar, paginar, ver detalles, bloquear,
// desbloquear y eliminar usuarios desde la interfaz administrativa.
@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminTopbarComponent],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {

  // Servicio utilizado para comunicarse con los endpoints de administración.
  private adminService = inject(AdminService);

  // Texto introducido en el buscador de usuarios.
  search = '';

  // Rol seleccionado para filtrar la lista de usuarios.
  selectedRole = 'Todos';

  // Página actual de la tabla paginada.
  currentPage = 1;

  // Número máximo de usuarios mostrados por página.
  pageSize = 10;

  // Variables de control del modal de detalle.
  showDetailModal = false;
  selectedUserId: string | null = null;
  loadingDetail = false;
  errorDetail = '';

  // Estados de acciones sobre usuarios.
  blockingUserId: string | null = null;
  unblockingUserId: string | null = null;
  deletingUserId: string | null = null;
  showDeleteConfirmModal = false;
  deleteTargetUserId: string | null = null;
  deleteTargetUserName = '';

  // Mensajes globales mostrados en la interfaz.
  successMessage = '';
  errorMessage = '';

  // Subject utilizado para forzar la recarga de la lista de usuarios.
  private refreshTrigger$ = new BehaviorSubject<void>(void 0);

  // Subject utilizado para cargar dinámicamente el detalle de un usuario.
  private userDetailTrigger$ = new BehaviorSubject<string | null>(null);

  // Observable encargado de obtener el detalle del usuario seleccionado.
  // Si no hay usuario seleccionado, devuelve null.
  // Gestiona también errores y estado de carga del modal.
  userDetail$ = this.userDetailTrigger$.pipe(
    switchMap((userId) => {
      if (!userId) {
        return of(null);
      }

      return this.adminService.getUserDetail(userId).pipe(
        map((response) => response.user),
        catchError((error) => {
          this.errorDetail = error?.error?.message || 'Error al cargar detalles del usuario';
          return of(null);
        }),
        map((user) => {
          this.loadingDetail = false;
          return user;
        })
      );
    })
  );

  // Observable principal de la lista de usuarios.
  // Recarga los datos cuando cambia refreshTrigger$,
  // adapta la respuesta del backend y gestiona estados de carga o error.
  users$: Observable<{
    users: AdminUserView[];
    isLoading: boolean;
    errorMessage: string;
  }> = this.refreshTrigger$.pipe(
    switchMap(() =>
      this.adminService.getUsers().pipe(
        map((response) => ({
          users: response.users.map((user: AdminUser) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role === 'admin' ? 'Admin' as const : 'Usuario' as const,
            status: user.isBlocked ? 'Baneado' as const : 'Activo' as const
          })),
          isLoading: false,
          errorMessage: ''
        })),
        catchError((error) =>
          of({
            users: [],
            isLoading: false,
            errorMessage: error?.error?.message || 'No se pudo cargar la lista de usuarios'
          })
        )
      )
    ),
    startWith({
      users: [],
      isLoading: true,
      errorMessage: ''
    })
  );

  // Método del ciclo de vida ejecutado al inicializar el componente.
  // Lanza una primera recarga de usuarios.
  // Permite que la tabla se cargue al entrar en la vista.
  ngOnInit(): void {
    this.refreshTrigger$.next();
  }

  // Método para filtrar usuarios por texto y rol.
  // Comprueba coincidencias en nombre y correo electrónico.
  // Devuelve únicamente los usuarios que cumplen los filtros activos.
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

  // Método para obtener los usuarios de la página actual.
  // Aplica primero los filtros y después calcula el rango paginado.
  // Devuelve solo los usuarios visibles en la tabla.
  getPaginatedUsers(users: AdminUserView[]): AdminUserView[] {
    const filtered = this.filteredUsers(users);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(startIndex, startIndex + this.pageSize);
  }

  // Método para calcular el número total de páginas.
  // Usa la cantidad de usuarios filtrados y el tamaño de página.
  // Garantiza que siempre exista al menos una página.
  getTotalPages(users: AdminUserView[]): number {
    const filtered = this.filteredUsers(users);
    return Math.max(1, Math.ceil(filtered.length / this.pageSize));
  }

  // Método para cambiar a una página concreta.
  // Comprueba que la página solicitada esté dentro del rango permitido.
  // Actualiza la página actual si la navegación es válida.
  goToPage(page: number, totalPages: number): void {
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
    }
  }

  // Método para avanzar a la siguiente página.
  // Utiliza el número total de páginas para validar el movimiento.
  // Delega el cambio real en goToPage.
  nextPage(totalPages: number): void {
    this.goToPage(this.currentPage + 1, totalPages);
  }

  // Método para retroceder a la página anterior.
  // Utiliza el número total de páginas para validar el movimiento.
  // Delega el cambio real en goToPage.
  previousPage(totalPages: number): void {
    this.goToPage(this.currentPage - 1, totalPages);
  }

  // Método para reiniciar la paginación.
  // Vuelve a la primera página cuando cambian los filtros.
  // Evita mostrar páginas vacías después de una búsqueda.
  resetPagination(): void {
    this.currentPage = 1;
  }

  // Método para abrir el modal de detalle de un usuario.
  // Guarda el identificador del usuario seleccionado.
  // Dispara la carga de información detallada desde el backend.
  viewUserDetail(user: AdminUserView): void {
    this.selectedUserId = user.id;
    this.errorDetail = '';
    this.loadingDetail = true;
    this.showDetailModal = true;
    this.userDetailTrigger$.next(user.id);
  }

  // Método para cerrar el modal de detalle.
  // Limpia el usuario seleccionado y los estados asociados.
  // Reinicia el observable de detalle a un valor vacío.
  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedUserId = null;
    this.loadingDetail = false;
    this.errorDetail = '';
    this.userDetailTrigger$.next(null);
  }

  // Método para bloquear un usuario.
  // Comprueba que exista un identificador válido antes de llamar al backend.
  // Tras completar la acción, cierra el modal y refresca la lista.
  blockUserAction(userId: string): void {
    if (!userId) return;

    this.blockingUserId = userId;

    this.adminService.blockUser(userId).subscribe({
      next: () => {
        this.successMessage = 'Usuario bloqueado exitosamente';
        this.blockingUserId = null;

        setTimeout(() => {
          this.successMessage = '';
          this.closeDetailModal();
          this.refreshTrigger$.next();
        }, 2000);
      },
      error: (error) => {
        this.errorDetail = error?.error?.message || 'Error al bloquear usuario';
        this.blockingUserId = null;
      }
    });
  }

  // Método para desbloquear un usuario previamente bloqueado.
  // Envía la acción al backend mediante el servicio de administración.
  // Si tiene éxito, actualiza la tabla de usuarios.
  unblockUserAction(userId: string): void {
    if (!userId) return;

    this.unblockingUserId = userId;

    this.adminService.unblockUser(userId).subscribe({
      next: () => {
        this.successMessage = 'Usuario desbloqueado exitosamente';
        this.unblockingUserId = null;

        setTimeout(() => {
          this.successMessage = '';
          this.closeDetailModal();
          this.refreshTrigger$.next();
        }, 2000);
      },
      error: (error) => {
        this.errorDetail = error?.error?.message || 'Error al desbloquear usuario';
        this.unblockingUserId = null;
      }
    });
  }

  // Método para eliminar un usuario.
  // Solicita confirmación antes de ejecutar una acción irreversible.
  // Tras eliminar correctamente, refresca la lista de usuarios.
  openDeleteConfirm(userId: string, userName: string): void {
    if (!userId) return;

    this.deleteTargetUserId = userId;
    this.deleteTargetUserName = userName;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirmModal = false;
    this.deleteTargetUserId = null;
    this.deleteTargetUserName = '';
  }

  confirmDeleteUser(): void {
    if (!this.deleteTargetUserId) return;

    const userId = this.deleteTargetUserId;
    this.showDeleteConfirmModal = false;
    this.deleteTargetUserId = null;

    this.deletingUserId = userId;

    this.adminService.deleteUser(userId).subscribe({
      next: () => {
        this.successMessage = 'Usuario eliminado exitosamente';
        this.deletingUserId = null;

        setTimeout(() => {
          this.successMessage = '';
          this.closeDetailModal();
          this.refreshTrigger$.next();
        }, 2000);
      },
      error: (error) => {
        this.errorDetail = error?.error?.message || 'Error al eliminar usuario';
        this.deletingUserId = null;
      }
    });
  }
}