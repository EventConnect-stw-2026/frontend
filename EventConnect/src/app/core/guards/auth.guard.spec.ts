import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, UrlTree, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, of, Observable } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

function runGuard(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
  const state = {} as RouterStateSnapshot;
  return TestBed.runInInjectionContext(
    () => authGuard(route, state) as Observable<boolean | UrlTree>
  );
}

function makeRoute(path: string | undefined): ActivatedRouteSnapshot {
  return { routeConfig: path ? { path } : null } as ActivatedRouteSnapshot;
}

describe('authGuard', () => {
  let authServiceSpy: { isLoggedIn$: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(() => {
    authServiceSpy = { isLoggedIn$: vi.fn() };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authServiceSpy }]
    });

    router = TestBed.inject(Router);
  });

  it('redirige a /login cuando se accede a una ruta protegida sin sesión', async () => {
    authServiceSpy.isLoggedIn$.mockReturnValue(of(false));

    const result = await firstValueFrom(runGuard(makeRoute('home')));

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('permite acceso a una ruta protegida si hay sesión', async () => {
    authServiceSpy.isLoggedIn$.mockReturnValue(of(true));

    const result = await firstValueFrom(runGuard(makeRoute('home')));

    expect(result).toBe(true);
  });

  it('redirige a /home si el usuario autenticado intenta acceder a /login', async () => {
    authServiceSpy.isLoggedIn$.mockReturnValue(of(true));

    const result = await firstValueFrom(runGuard(makeRoute('login')));

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/home');
  });

  it('redirige a /home si el usuario autenticado intenta acceder a /register', async () => {
    authServiceSpy.isLoggedIn$.mockReturnValue(of(true));

    const result = await firstValueFrom(runGuard(makeRoute('register')));

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/home');
  });

  it('permite acceso a /login si no hay sesión', async () => {
    authServiceSpy.isLoggedIn$.mockReturnValue(of(false));

    const result = await firstValueFrom(runGuard(makeRoute('login')));

    expect(result).toBe(true);
  });
});
