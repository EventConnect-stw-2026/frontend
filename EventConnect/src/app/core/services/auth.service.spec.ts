import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl + '/auth';

  beforeEach(() => {
    try { localStorage.clear(); } catch (e) { /* noop */ }

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('login hace POST al endpoint con el payload', async () => {
    const payload = { email: 'a@b.com', password: '12345678' };
    const response = { user: { _id: '1', role: 'user', email: 'a@b.com' } };

    const promise = firstValueFrom(service.login(payload));

    const req = httpMock.expectOne(`${apiUrl}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    expect(req.request.withCredentials).toBe(true);
    req.flush(response);

    const res = await promise;
    expect(res).toEqual(response as any);
  });

  it('login publica el usuario en currentUser$', async () => {
    const response = { user: { _id: '1', role: 'user', email: 'a@b.com' } };

    const promise = firstValueFrom(service.login({ email: 'a@b.com', password: '12345678' }));

    const req = httpMock.expectOne(`${apiUrl}/login`);
    req.flush(response);
    await promise;

    expect(service.getCurrentUser()?.email).toBe('a@b.com');
  });

  it('login marca sessionPresent=true en localStorage si hay user', async () => {
    const promise = firstValueFrom(service.login({ email: 'a@b.com', password: '12345678' }));
    const req = httpMock.expectOne(`${apiUrl}/login`);
    req.flush({ user: { _id: '1', role: 'user' } });
    await promise;

    expect(localStorage.getItem('sessionPresent')).toBe('true');
  });

  it('register hace POST al endpoint con el payload', async () => {
    const payload = { name: 'P', username: 'p', email: 'a@b.com', password: '12345678' };
    const promise = firstValueFrom(service.register(payload));

    const req = httpMock.expectOne(`${apiUrl}/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ user: { _id: '1', role: 'user' } });
    await promise;
  });

  it('logout llama al endpoint y limpia la sesión', () => {
    localStorage.setItem('sessionPresent', 'true');

    service.logout();

    const req = httpMock.expectOne(`${apiUrl}/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({});

    expect(localStorage.getItem('sessionPresent')).toBe('false');
    expect(service.getCurrentUser()).toBeNull();
  });

  it('isLoggedIn$ devuelve false sin llamar al backend si no hay sessionPresent', async () => {
    localStorage.removeItem('sessionPresent');

    const isLoggedIn = await firstValueFrom(service.isLoggedIn$());

    expect(isLoggedIn).toBe(false);
    httpMock.expectNone(`${apiUrl}/profile`);
  });

  it('forgotPassword hace POST con el email', async () => {
    const promise = firstValueFrom(service.forgotPassword('a@b.com'));

    const req = httpMock.expectOne(`${apiUrl}/forgot-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.com' });
    req.flush({ message: 'ok' });
    await promise;
  });

  it('resetPassword hace POST con token y nueva contraseña', async () => {
    const promise = firstValueFrom(service.resetPassword('tok123', 'nueva123'));

    const req = httpMock.expectOne(`${apiUrl}/reset-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'tok123', password: 'nueva123' });
    req.flush({ message: 'ok' });
    await promise;
  });

  it('getProfile hace GET y actualiza currentUser$', async () => {
    const promise = firstValueFrom(service.getProfile());

    const req = httpMock.expectOne(`${apiUrl}/profile`);
    expect(req.request.method).toBe('GET');
    req.flush({ _id: '1', email: 'a@b.com', role: 'user' });
    await promise;

    expect(service.getCurrentUser()?._id).toBe('1');
  });
});
