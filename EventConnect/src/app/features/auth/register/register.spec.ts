import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: { register: ReturnType<typeof vi.fn>; loginWithGoogle: ReturnType<typeof vi.fn> };
  let navigateSpy: ReturnType<typeof vi.fn>;

  const validPayload = {
    name: 'Pablo Bueno',
    username: 'pablob',
    email: 'pablob@example.com',
    password: '12345678',
    confirmPassword: '12345678'
  };

  beforeEach(async () => {
    authServiceSpy = {
      register: vi.fn(),
      loginWithGoogle: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    const router = TestBed.inject(Router);
    navigateSpy = vi.fn().mockResolvedValue(true);
    vi.spyOn(router, 'navigate').mockImplementation(navigateSpy as any);

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('inicia con el formulario inválido', () => {
    expect(component.registerForm.invalid).toBe(true);
  });

  it('exige nombre con al menos 2 caracteres', () => {
    component.registerForm.patchValue({ ...validPayload, name: 'a' });
    expect(component.name?.errors?.['minlength']).toBeTruthy();
  });

  it('exige username con al menos 3 caracteres', () => {
    component.registerForm.patchValue({ ...validPayload, username: 'ab' });
    expect(component.username?.errors?.['minlength']).toBeTruthy();
  });

  it('exige email con formato válido', () => {
    component.registerForm.patchValue({ ...validPayload, email: 'no-email' });
    expect(component.email?.errors?.['email']).toBeTruthy();
  });

  it('exige password con al menos 6 caracteres', () => {
    component.registerForm.patchValue({ ...validPayload, password: '123', confirmPassword: '123' });
    expect(component.password?.errors?.['minlength']).toBeTruthy();
  });

  it('marca passwordMismatch cuando password y confirmPassword no coinciden', () => {
    component.registerForm.patchValue({
      ...validPayload,
      password: '12345678',
      confirmPassword: 'distinto'
    });
    expect(component.registerForm.errors?.['passwordMismatch']).toBe(true);
    expect(component.registerForm.valid).toBe(false);
  });

  it('es válido cuando todos los campos cumplen las reglas', () => {
    component.registerForm.patchValue(validPayload);
    expect(component.registerForm.valid).toBe(true);
  });

  it('no llama a authService.register si el formulario es inválido', () => {
    component.registerForm.patchValue({ ...validPayload, email: 'no-email' });
    component.onSubmit();
    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });

  it('envía el payload sin confirmPassword al backend', () => {
    authServiceSpy.register.mockReturnValue(of({ user: { role: 'user' } } as any));
    component.registerForm.patchValue(validPayload);

    component.onSubmit();

    expect(authServiceSpy.register).toHaveBeenCalledWith({
      name: 'Pablo Bueno',
      username: 'pablob',
      email: 'pablob@example.com',
      password: '12345678'
    });
  });

  it('navega a /home tras registro correcto', () => {
    authServiceSpy.register.mockReturnValue(of({ user: { role: 'user' } } as any));
    component.registerForm.patchValue(validPayload);

    component.onSubmit();

    expect(navigateSpy).toHaveBeenCalledWith(['/home']);
  });

  it('expone el mensaje de error del backend si el registro falla', () => {
    authServiceSpy.register.mockReturnValue(
      throwError(() => ({ error: { message: 'El email ya existe' } }))
    );
    component.registerForm.patchValue(validPayload);

    component.onSubmit();

    expect(component.errorMessage).toBe('El email ya existe');
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
