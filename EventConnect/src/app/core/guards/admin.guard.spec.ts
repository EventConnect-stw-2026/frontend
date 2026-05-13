import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, of, throwError, Observable } from 'rxjs';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

function runGuard(): Observable<boolean | UrlTree> {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;
  return TestBed.runInInjectionContext(
    () => adminGuard(route, state) as Observable<boolean | UrlTree>
  );
}

describe('adminGuard', () => {
  let authServiceSpy: { getProfile: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(() => {
    authServiceSpy = { getProfile: vi.fn() };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authServiceSpy }]
    });

    router = TestBed.inject(Router);
  });

  it('permite acceso si el perfil tiene rol admin', async () => {
    authServiceSpy.getProfile.mockReturnValue(of({ role: 'admin' }));

    const result = await firstValueFrom(runGuard());

    expect(result).toBe(true);
  });

  it('redirige a /home si el usuario no es admin', async () => {
    authServiceSpy.getProfile.mockReturnValue(of({ role: 'user' }));

    const result = await firstValueFrom(runGuard());

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/home');
  });

  it('redirige a /login si getProfile lanza error (sin sesión)', async () => {
    authServiceSpy.getProfile.mockReturnValue(throwError(() => new Error('401')));

    const result = await firstValueFrom(runGuard());

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('redirige a /home si el perfil es nulo', async () => {
    authServiceSpy.getProfile.mockReturnValue(of(null));

    const result = await firstValueFrom(runGuard());

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/home');
  });
});
