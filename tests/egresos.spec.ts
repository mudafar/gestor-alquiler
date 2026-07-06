import { test, expect } from '@playwright/test';

test.describe('Egresos CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.getByRole('button', { name: 'Egresos' }).click();
  });

  test('should create a new egreso successfully', async ({ page }) => {
    // Open the create modal
    await page.getByRole('button', { name: 'Nuevo Egreso' }).click();
    await expect(page.getByRole('dialog', { name: 'Registrar Nuevo Egreso' })).toBeVisible();

    // Fill the form
    await page.getByLabel('Descripción').fill('Pago de mantenimiento');
    await page.getByLabel('Monto').fill('250');

    // Submit the form
    await page.getByRole('button', { name: 'Registrar' }).click();

    // Verify modal is closed
    await expect(page.getByRole('dialog', { name: 'Registrar Nuevo Egreso' })).not.toBeVisible();

    // Verify it appears in the table
    await expect(page.getByRole('cell', { name: 'Pago de mantenimiento' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '$250.00' })).toBeVisible();

    // Verify success notification
    await expect(page.getByRole('alert').filter({ hasText: 'Egreso creado' })).toBeVisible();
  });

  test('should edit an existing egreso', async ({ page }) => {
    // First create an egreso to edit
    await page.getByRole('button', { name: 'Nuevo Egreso' }).click();
    await page.getByLabel('Descripción').fill('Gastos de limpieza');
    await page.getByLabel('Monto').fill('150');
    await page.getByRole('button', { name: 'Registrar' }).click();
    await expect(page.getByRole('cell', { name: 'Gastos de limpieza' })).toBeVisible();

    // Click the edit button
    const row = page.locator('tr').filter({ hasText: 'Gastos de limpieza' });
    await row.getByRole('button', { name: 'Editar' }).click();

    // Verify edit modal is open
    await expect(page.getByRole('dialog', { name: 'Editar Egreso' })).toBeVisible();

    // Update the description
    await page.getByLabel('Descripción').fill('Limpieza profunda');
    await page.getByLabel('Monto').fill('200');
    await page.getByRole('button', { name: 'Actualizar' }).click();

    // Verify changes are reflected
    await expect(page.getByRole('cell', { name: 'Limpieza profunda' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '$200.00' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Gastos de limpieza' })).not.toBeVisible();

    // Verify success notification
    await expect(page.getByRole('alert').filter({ hasText: 'Egreso actualizado' })).toBeVisible();
  });

  test('should delete an egreso with confirmation', async ({ page }) => {
    // Create an egreso to delete
    await page.getByRole('button', { name: 'Nuevo Egreso' }).click();
    await page.getByLabel('Descripción').fill('Egreso a Eliminar');
    await page.getByLabel('Monto').fill('100');
    await page.getByRole('button', { name: 'Registrar' }).click();
    await expect(page.getByRole('cell', { name: 'Egreso a Eliminar' })).toBeVisible();

    // Click the delete button
    const row = page.locator('tr').filter({ hasText: 'Egreso a Eliminar' });
    await row.getByRole('button', { name: 'Eliminar' }).click();

    // Verify confirmation modal appears
    await expect(page.getByRole('dialog', { name: 'Confirmar Eliminación' })).toBeVisible();

    // Confirm deletion — scope to dialog
    const dialog = page.getByRole('dialog', { name: 'Confirmar Eliminación' });
    await dialog.getByRole('button', { name: 'Eliminar' }).click();

    // Verify egreso is removed
    await expect(page.getByRole('cell', { name: 'Egreso a Eliminar' })).not.toBeVisible();

    // Verify success notification
    await expect(page.getByRole('alert').filter({ hasText: 'Egreso eliminado' })).toBeVisible();
  });

  test('should create egreso with optional category', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo Egreso' }).click();

    // Fill required fields
    await page.getByLabel('Descripción').fill('Seguro del edificio');
    await page.getByLabel('Monto').fill('500');

    // Fill optional category
    await page.getByLabel('Categoría (Opcional)').fill('Seguros');

    // Change currency to BS
    await page.getByRole('combobox', { name: 'Moneda' }).click();
    await page.getByRole('option', { name: 'BS' }).click();

    await page.getByRole('button', { name: 'Registrar' }).click();

    await expect(page.getByRole('cell', { name: 'Seguro del edificio' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Seguros' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'BS' })).toBeVisible();
  });
});
