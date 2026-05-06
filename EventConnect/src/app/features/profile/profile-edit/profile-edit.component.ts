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

interface FavoriteCategory {
  key: string;
  label: string;
  emoji: string;
  selected: boolean;
}

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

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.scss'
})
export class ProfileEditComponent {
  private fb        = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  isEditingUsername = false;

  user: UserProfile = {
    name: 'Jeffrey Preston Bezos',
    email: 'jeff@amazon.com',
    username: 'jeffAmazon',
    avatarUrl:
      'https://upload.wikimedia.org/wikipedia/commons/9/91/Jeff_Bezos_2016.jpg',
    bio: '',
    location: '',
    interests: ['culture', 'sports', 'family']
  };

  favorites: FavoriteCategory[] = [
    { key: 'culture',     label: 'Cultura',      emoji: '🎭', selected: true  },
    { key: 'sports',      label: 'Deporte',       emoji: '🏀', selected: true  },
    { key: 'family',      label: 'Familia',       emoji: '🏰', selected: true  },
    { key: 'solidarity',  label: 'Solidario',     emoji: '🌍', selected: false },
    { key: 'education',   label: 'Educación',     emoji: '🎓', selected: false },
    { key: 'gastronomy',  label: 'Gastronomía',   emoji: '🧑‍🍳', selected: false },
    { key: 'wellness',    label: 'Bienestar',     emoji: '🙌', selected: false }
  ];

  // SVGs por categoría de interés
  getSvg(key: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.interestSvgs[key] ?? '');
  }

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

  toggleUsernameEdit(): void {
    this.isEditingUsername = !this.isEditingUsername;
  }

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

  toggleFavorite(category: FavoriteCategory): void {
    category.selected = !category.selected;
  }

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
        // Guardar solo datos esenciales, sin avatar en base64
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

  goBackToProfile(): void {
    this.router.navigate(['/profile']);
  }

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

  get name() {
    return this.profileForm.get('name');
  }

  get email() {
    return this.profileForm.get('email');
  }

  get username() {
    return this.profileForm.get('username');
  }

  get currentPassword() {
    return this.profileForm.get('currentPassword');
  }

  get confirmCurrentPassword() {
    return this.profileForm.get('confirmCurrentPassword');
  }

  get newPassword() {
    return this.profileForm.get('newPassword');
  }

  get confirmNewPassword() {
    return this.profileForm.get('confirmNewPassword');
  }
}