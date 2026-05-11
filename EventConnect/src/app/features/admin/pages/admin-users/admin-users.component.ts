import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, startWith, switchMap, finalize } from 'rxjs/operators';
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
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);

  search = '';
  selectedRole = 'Todos';

  currentPage = 1;
  pageSize = 10;

  showDetailModal = false;
  selectedUserId: string | null = null;
  loadingDetail = false;
  errorDetail = '';

  blockingUserId: string | null = null;
  unblockingUserId: string | null = null;
  deletingUserId: string | null = null;
  showDeleteConfirmModal = false;
  deleteTargetUserId: string | null = null;
  deleteTargetUserName = '';

  successMessage = '';
  errorMessage = '';

  private refreshTrigger$ = new BehaviorSubject<void>(void 0);
  private userDetailTrigger$ = new BehaviorSubject<string | null>(null);

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

  ngOnInit(): void {
    this.refreshTrigger$.next();
  }

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

  getPaginatedUsers(users: AdminUserView[]): AdminUserView[] {
    const filtered = this.filteredUsers(users);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(startIndex, startIndex + this.pageSize);
  }

  getTotalPages(users: AdminUserView[]): number {
    const filtered = this.filteredUsers(users);
    return Math.max(1, Math.ceil(filtered.length / this.pageSize));
  }

  goToPage(page: number, totalPages: number): void {
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
    }
  }

  nextPage(totalPages: number): void {
    this.goToPage(this.currentPage + 1, totalPages);
  }

  previousPage(totalPages: number): void {
    this.goToPage(this.currentPage - 1, totalPages);
  }

  resetPagination(): void {
    this.currentPage = 1;
  }

  viewUserDetail(user: AdminUserView): void {
    this.selectedUserId = user.id;
    this.errorDetail = '';
    this.loadingDetail = true;
    this.showDetailModal = true;
    this.userDetailTrigger$.next(user.id);
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedUserId = null;
    this.loadingDetail = false;
    this.errorDetail = '';
    this.userDetailTrigger$.next(null);
  }

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