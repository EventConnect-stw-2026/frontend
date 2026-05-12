import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env['TEST_EMAIL'] ?? 'pablob@example.com';
const TEST_PASSWORD = process.env['TEST_PASSWORD'] ?? '12345678';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('input[formControlName="email"]', TEST_EMAIL);
  await page.fill('input[formControlName="password"]', TEST_PASSWORD);
  await page.click('.login-btn');
  await expect(page).toHaveURL('/home', { timeout: 8000 });
}

test.describe('Asistencia a eventos', () => {
  test('confirmar asistencia a un evento cambia el estado del botón', async ({ page }) => {
    await login(page);

    // Navegar a Explorar y abrir el primer evento disponible
    await page.goto('/explore');
    await page.waitForSelector('.event-card', { timeout: 8000 });
    await page.locator('.event-card').first().click();
    await page.waitForURL(/\/events\/.+/, { timeout: 8000 });

    const attendBtn = page.locator('.attend-btn');
    await attendBtn.waitFor({ timeout: 8000 });

    const initialText = await attendBtn.textContent();

    // Si ya está apuntado, primero desapuntarse para tener un estado limpio
    if (initialText?.includes('Ya estás apuntado')) {
      await attendBtn.click();
      await expect(attendBtn).toContainText('Apuntarme al evento', { timeout: 5000 });
    }

    // Confirmar asistencia
    await expect(attendBtn).toContainText('Apuntarme al evento');
    await attendBtn.click();
    await expect(attendBtn).toContainText('Ya estás apuntado', { timeout: 5000 });
  });

  test('intentar confirmar asistencia sin sesión muestra aviso de login', async ({ page }) => {
    await page.goto('/explore');
    await page.waitForSelector('.event-card', { timeout: 8000 });
    await page.locator('.event-card').first().click();
    await page.waitForURL(/\/events\/.+/, { timeout: 8000 });

    const attendBtn = page.locator('.attend-btn');
    await attendBtn.waitFor({ timeout: 8000 });
    await attendBtn.click();

    // Sin sesión el backend devuelve 401 y la app muestra un toast de error
    const toast = page.locator('.toast.toast-error');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText('iniciar sesión');
  });
});
