import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: { login: ReturnType<typeof vi.fn>; loginWithGoogle: ReturnType<typeof vi.fn> };
  let navigateSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    authServiceSpy = {
      login: vi.fn(),
      loginWithGoogle: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    const router = TestBed.inject(Router);
    navigateSpy = vi.fn().mockResolvedValue(true);
    vi.spyOn(router, 'navigate').mockImplementation(navigateSpy as any);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('inicia con el formulario inválido y vacío', () => {
    expect(component.loginForm.invalid).toBe(true);
    expect(component.loginForm.value).toEqual({ email: '', password: '' });
  });

  it('marca email inválido cuando el formato no es correcto', () => {
    component.loginForm.patchValue({ email: 'no-es-email', password: '12345678' });
    expect(component.email?.errors?.['email']).toBeTruthy();
    expect(component.loginForm.valid).toBe(false);
  });

  it('marca password como requerido cuando está vacío', () => {
    component.loginForm.patchValue({ email: 'a@b.com', password: '' });
    expect(component.password?.errors?.['required']).toBeTruthy();
  });

  it('valida correctamente con email y password rellenos', () => {
    component.loginForm.patchValue({ email: 'a@b.com', password: '12345678' });
    expect(component.loginForm.valid).toBe(true);
  });

  it('no llama a authService.login si el formulario es inválido', () => {
    component.loginForm.patchValue({ email: '', password: '' });
    component.onSubmit();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('llama a authService.login con el payload correcto cuando es válido', () => {
    authServiceSpy.login.mockReturnValue(of({ user: { role: 'user' } } as any));
    component.loginForm.patchValue({ email: 'a@b.com', password: '12345678' });

    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: '12345678'
    });
  });

  it('navega a /home tras login con rol user', () => {
    authServiceSpy.login.mockReturnValue(of({ user: { role: 'user' } } as any));
    component.loginForm.patchValue({ email: 'a@b.com', password: '12345678' });

    component.onSubmit();

    expect(navigateSpy).toHaveBeenCalledWith(['/home']);
  });

  it('navega a /admin/dashboard tras login con rol admin', () => {
    authServiceSpy.login.mockReturnValue(of({ user: { role: 'admin' } } as any));
    component.loginForm.patchValue({ email: 'a@b.com', password: '12345678' });

    component.onSubmit();

    expect(navigateSpy).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('muestra el mensaje de error devuelto por el backend si falla el login', () => {
    authServiceSpy.login.mockReturnValue(
      throwError(() => ({ error: { message: 'Credenciales inválidas' } }))
    );
    component.loginForm.patchValue({ email: 'a@b.com', password: 'bad' });

    component.onSubmit();

    expect(component.errorMessage).toBe('Credenciales inválidas');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('usa un mensaje por defecto si el error no trae message', () => {
    authServiceSpy.login.mockReturnValue(throwError(() => ({})));
    component.loginForm.patchValue({ email: 'a@b.com', password: '12345678' });

    component.onSubmit();

    expect(component.errorMessage).toBe('No se pudo iniciar sesión');
  });
});
