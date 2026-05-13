/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: profile-edit.component.ts
 * Descripción: Componente encargado de gestionar la edición del perfil de usuario,
 * incluyendo datos personales, avatar, contraseña e intereses.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import {
  ChangeDetectorRef,
  Component,
  inject
} from '@angular/core';
import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../layout/components/header/header';
import { AuthService } from '../../../core/services/auth.service';

// Modelo local con los datos principales del perfil del usuario.
interface UserProfile {
  _id?: string;
  name: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  interests?: string[];
}

// Modelo local para representar cada categoría de interés seleccionable.
interface FavoriteCategory {
  key: string;
  label: string;
  emoji: string;
  selected: boolean;
}

// Validador personalizado para comprobar que la nueva contraseña y su confirmación coinciden.
// Si ambos campos están vacíos, no aplica error porque el cambio de contraseña es opcional.
const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const newPassword = control.get('newPassword')?.value;
  const confirmNewPassword = control.get('confirmNewPassword')?.value;

  if (!newPassword && !confirmNewPassword) {
    return null;
  }

  if (newPassword !== confirmNewPassword) {
    return { passwordMismatch: true };
  }

  return null;
};

// Componente encargado de gestionar el formulario de edición de perfil.
// Carga los datos actuales del usuario, permite modificarlos
// y envía los cambios al backend mediante el servicio de autenticación.
@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.scss'
})
export class ProfileEditComponent {

  // Constructor de formularios reactivos.
  private fb = inject(FormBuilder);

  // Servicio usado para permitir renderizar SVGs inline de forma segura.
  private sanitizer = inject(DomSanitizer);

  // Servicio de navegación entre pantallas.
  private router = inject(Router);

  // Servicio de autenticación utilizado para obtener y actualizar el perfil.
  private authService = inject(AuthService);

  // Referencia para forzar la detección de cambios al actualizar datos.
  private cdr = inject(ChangeDetectorRef);

  // Indica si el formulario se está enviando al backend.
  isSubmitting = false;

  // Mensaje mostrado cuando el perfil se actualiza correctamente.
  successMessage = '';

  // Mensaje mostrado cuando ocurre un error al actualizar el perfil.
  errorMessage = '';

  // Controla si el username se muestra como texto o como campo editable.
  isEditingUsername = false;

  // Datos del usuario mostrados en la pantalla de edición.
  user: UserProfile = {
    name: '',
    email: '',
    username: '',
    avatarUrl: 'assets/images/default-avatar.svg',
    bio: '',
    location: '',
    interests: []
  };

  // Categorías de intereses disponibles para personalizar recomendaciones.
  favorites: FavoriteCategory[] = [
    { key: 'culture',     label: 'Cultura',      emoji: '🎭', selected: true  },
    { key: 'sports',      label: 'Deporte',       emoji: '🏀', selected: true  },
    { key: 'family',      label: 'Familia',       emoji: '🏰', selected: true  },
    { key: 'solidarity',  label: 'Solidario',     emoji: '🌍', selected: false },
    { key: 'education',   label: 'Educación',     emoji: '🎓', selected: false },
    { key: 'gastronomy',  label: 'Gastronomía',   emoji: '🧑‍🍳', selected: false },
    { key: 'wellness',    label: 'Bienestar',     emoji: '🙌', selected: false }
  ];

  // Método para obtener el SVG de una categoría de interés.
  // Se sanitiza el HTML para poder insertarlo en la plantilla.
  // Si no existe la clave, devuelve una cadena vacía.
  getSvg(key: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.interestSvgs[key] ?? '');
  }

  // Diccionario de SVGs usados como iconos visuales de intereses.
  readonly interestSvgs: Record<string, string> = {
    // Cultura — máscaras de teatro
    culture: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="10" r="6"/><path d="M12.5 10a3.5 3.5 0 0 1-7 0"/><circle cx="17" cy="10" r="4"/><path d="M19.5 10a2.5 2.5 0 0 1-5 0"/><path d="M15 16.5c1 1 2.5 1.5 4 1"/><path d="M9 17c1.5 1.5 4 2 6 1.5"/></svg>`,
    // Deporte — trofeo
    sports: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`,
    // Familia — casa con corazón
    family: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 13c-1.1 0-2 .67-2 1.5S10.9 16 12 16s2-.67 2-1.5S13.1 13 12 13z"/><path d="M9.5 10.5C9.5 9.12 10.62 8 12 8s2.5 1.12 2.5 2.5c0 2-2.5 4-2.5 4s-2.5-2-2.5-4z"/></svg>`,
    // Solidario — manos unidas
    solidarity: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1"/><path d="M14 10V8a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 9.9V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5"/><path d="M6 14v0a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-3a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2"/><path d="M2 12c0-2.8 2.2-5 5-5"/><path d="M22 12c0-2.8-2.2-5-5-5"/></svg>`,
    // Educación — birrete de graduación
    education: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    // Gastronomía — tenedor y cuchillo
    gastronomy: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`,
    // Bienestar — hoja de naturaleza
    wellness: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
  };

  // Formulario reactivo con validaciones básicas de nombre, email, username y contraseña.
  // El email se mantiene deshabilitado porque se muestra como dato informativo.
  // También aplica el validador personalizado para confirmar la nueva contraseña.
  profileForm = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      currentPassword: [''],
      confirmCurrentPassword: [''],
      newPassword: ['', [Validators.minLength(6)]],
      confirmNewPassword: ['']
    },
    { validators: passwordMatchValidator }
  );

  // Método del ciclo de vida ejecutado al inicializar el componente.
  // Recupera el perfil del usuario desde el backend.
  // Rellena el formulario y sincroniza los intereses seleccionados.
  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (profile: UserProfile) => {
        this.user = {
          _id: profile._id ?? '',
          name: profile.name ?? 'Usuario',
          email: profile.email ?? '',
          username: profile.username ?? '',
          avatarUrl:
            profile.avatarUrl ||
            'assets/images/default-avatar.svg',
          bio: profile.bio ?? '',
          location: profile.location ?? '',
          interests: profile.interests ?? ['culture', 'sports', 'family']
        };

        this.profileForm.patchValue({
          name: this.user.name,
          email: this.user.email,
          username: this.user.username ?? ''
        });

        const interestKeys = this.user.interests ?? [];
        this.favorites = this.favorites.map((favorite) => ({
          ...favorite,
          selected: interestKeys.includes(favorite.key)
        }));

        this.cdr.detectChanges();
      },
      error: () => {
        this.profileForm.patchValue({
          name: this.user.name,
          email: this.user.email,
          username: this.user.username ?? ''
        });

        this.cdr.detectChanges();
      }
    });
  }

  // Método para activar o desactivar la edición del username.
  // Alterna entre mostrar el username como texto o como input editable.
  toggleUsernameEdit(): void {
    this.isEditingUsername = !this.isEditingUsername;
  }

  // Método ejecutado cuando el usuario selecciona una nueva imagen de avatar.
  // Lee el fichero como base64 y lo muestra inmediatamente en la vista.
  // No envía la imagen hasta que se guardan los cambios del perfil.
  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || !input.files.length) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      this.user.avatarUrl = reader.result as string;
      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }

  // Método para seleccionar o deseleccionar una categoría de interés.
  // Cambia el estado selected de la categoría recibida.
  toggleFavorite(category: FavoriteCategory): void {
    category.selected = !category.selected;
  }

  // Método principal de envío del formulario.
  // Valida los campos, comprueba contraseñas actuales y construye el payload.
  // Envía los cambios al backend y actualiza localStorage con los datos esenciales.
  onSubmit(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    const formValue = this.profileForm.getRawValue();

    if (
      (formValue.currentPassword || formValue.confirmCurrentPassword) &&
      formValue.currentPassword !== formValue.confirmCurrentPassword
    ) {
      this.errorMessage = 'La contraseña actual no coincide en ambos campos';
      this.cdr.detectChanges();
      return;
    }

    this.isSubmitting = true;
    this.cdr.detectChanges();

    const payload = {
      name: formValue.name ?? '',
      email: formValue.email ?? '',
      username: formValue.username ?? '',
      avatarUrl:
        this.user.avatarUrl || 'assets/images/default-avatar.svg',
      bio: this.user.bio ?? '',
      location: this.user.location ?? '',
      interests: this.favorites
        .filter((favorite) => favorite.selected)
        .map((favorite) => favorite.key),
      passwordChange:
        formValue.currentPassword && formValue.newPassword
          ? {
              currentPassword: formValue.currentPassword,
              newPassword: formValue.newPassword
            }
          : null
    };

    this.authService.updateProfile(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.successMessage = 'Perfil actualizado correctamente';

        setTimeout(() => this.router.navigate(['/profile']), 1000);

        this.user = {
          ...this.user,
          name: res.user.name,
          email: res.user.email,
          username: res.user.username,
          avatarUrl: res.user.avatarUrl,
          interests: res.user.interests
        };

        // Se guardan en localStorage solo los datos esenciales y se evita almacenar avatar en base64.
        const userToStore = {
          _id: res.user._id,
          name: res.user.name,
          email: res.user.email,
          username: res.user.username,
          avatarUrl: typeof res.user.avatarUrl === 'string' && res.user.avatarUrl.startsWith('data:')
            ? undefined
            : res.user.avatarUrl,
          bio: res.user.bio,
          location: res.user.location,
          interests: res.user.interests
        };

        localStorage.setItem('user', JSON.stringify(userToStore));
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.message || 'Error al actualizar perfil';
        this.cdr.detectChanges();
      }
    });
  }

  // Método para volver a la pantalla de perfil sin guardar cambios.
  goBackToProfile(): void {
    this.router.navigate(['/profile']);
  }

  // Método para cerrar sesión desde la pantalla de edición.
  // Limpia los datos locales del usuario, llama al servicio de logout
  // y redirige a la pantalla de inicio de sesión.
  logout(): void {
    this.user = {
      name: '',
      email: '',
      username: '',
      avatarUrl: '',
      bio: '',
      location: '',
      interests: []
    };

    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Getter para acceder fácilmente al control name desde la plantilla.
  get name() {
    return this.profileForm.get('name');
  }

  // Getter para acceder fácilmente al control email desde la plantilla.
  get email() {
    return this.profileForm.get('email');
  }

  // Getter para acceder fácilmente al control username desde la plantilla.
  get username() {
    return this.profileForm.get('username');
  }

  // Getter para acceder fácilmente al control currentPassword desde la plantilla.
  get currentPassword() {
    return this.profileForm.get('currentPassword');
  }

  // Getter para acceder fácilmente al control confirmCurrentPassword desde la plantilla.
  get confirmCurrentPassword() {
    return this.profileForm.get('confirmCurrentPassword');
  }

  // Getter para acceder fácilmente al control newPassword desde la plantilla.
  get newPassword() {
    return this.profileForm.get('newPassword');
  }

  // Getter para acceder fácilmente al control confirmNewPassword desde la plantilla.
  get confirmNewPassword() {
    return this.profileForm.get('confirmNewPassword');
  }
}