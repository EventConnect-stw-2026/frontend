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
  private fb = inject(FormBuilder);
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
    { key: 'culture', label: 'Cultura', emoji: '🎭', selected: true },
    { key: 'sports', label: 'Deporte', emoji: '🏀', selected: true },
    { key: 'family', label: 'Familia', emoji: '🏰', selected: true },
    { key: 'solidarity', label: 'Solidario', emoji: '🌍', selected: false },
    { key: 'education', label: 'Educación', emoji: '🎓', selected: false },
    { key: 'gastronomy', label: 'Gastronomía', emoji: '🧑‍🍳', selected: false },
    { key: 'wellness', label: 'Bienestar', emoji: '🙌', selected: false }
  ];

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
            'assets/images/default-avatar.png',
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
        this.user.avatarUrl || 'assets/images/default-avatar.png',
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