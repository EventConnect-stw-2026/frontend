import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env['TEST_EMAIL'] ?? 'pablob@example.com';
const TEST_PASSWORD = process.env['TEST_PASSWORD'] ?? '12345678';

test.describe('Autenticación', () => {
  test('iniciar sesión con credenciales válidas redirige a /home', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[formControlName="email"]', TEST_EMAIL);
    await page.fill('input[formControlName="password"]', TEST_PASSWORD);
    await page.click('.login-btn');

    await expect(page).toHaveURL('/home', { timeout: 8000 });
  });

  test('iniciar sesión con credenciales inválidas muestra error', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[formControlName="email"]', 'noexiste@test.com');
    await page.fill('input[formControlName="password"]', 'contraseñaerronea');
    await page.click('.login-btn');

    // La URL no debe cambiar a /home
    await expect(page).not.toHaveURL('/home', { timeout: 5000 });
    await expect(page).toHaveURL('/login');
  });
});
