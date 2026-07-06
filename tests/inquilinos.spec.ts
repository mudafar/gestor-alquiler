import { test, expect } from '@playwright/test';

test.describe('Inquilinos CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.getByRole('button', { name: 'Inquilinos' }).click();
  });

  test('should create a new inquilino successfully', async ({ page }) => {
    // Open the create modal
    await page.getByRole('button', { name: 'Nuevo Inquilino' }).click();
    await expect(page.getByRole('dialog', { name: 'Crear Nuevo Inquilino' })).toBeVisible();

    // Fill the form
    await page.getByLabel('Nombre del Inquilino').fill('Juan Perez');
    await page.getByLabel('Teléfono').fill('123456789');

    // Submit the form
    await page.getByRole('button', { name: 'Crear' }).click();

    // Verify modal is closed
    await expect(page.getByRole('dialog', { name: 'Crear Nuevo Inquilino' })).not.toBeVisible();

    // Verify it appears in the table
    await expect(page.getByRole('cell', { name: 'Juan Perez' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '123456789' })).toBeVisible();

    // Verify status badge shows "Sin asignar"
    await expect(page.getByRole('cell', { name: 'Sin asignar' })).toBeVisible();

    // Verify success notification
    await expect(page.getByRole('alert').filter({ hasText: 'Inquilino creado' })).toBeVisible();
  });

  test('should edit an existing inquilino', async ({ page }) => {
    // First create an inquilino to edit
    await page.getByRole('button', { name: 'Nuevo Inquilino' }).click();
    await page.getByLabel('Nombre del Inquilino').fill('Maria Garcia');
    await page.getByLabel('Teléfono').fill('987654321');
    await page.getByRole('button', { name: 'Crear' }).click();
    await expect(page.getByRole('cell', { name: 'Maria Garcia' })).toBeVisible();

    // Click the edit button
    const row = page.locator('tr').filter({ hasText: 'Maria Garcia' });
    await row.getByRole('button', { name: 'Editar' }).click();

    // Verify edit modal is open
    await expect(page.getByRole('dialog', { name: 'Editar Inquilino' })).toBeVisible();

    // Update the name and phone
    await page.getByLabel('Nombre del Inquilino').fill('Maria Rodriguez');
    await page.getByLabel('Teléfono').fill('111222333');
    await page.getByRole('button', { name: 'Actualizar' }).click();

    // Verify changes are reflected
    await expect(page.getByRole('cell', { name: 'Maria Rodriguez' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '111222333' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Maria Garcia' })).not.toBeVisible();

    // Verify success notification
    await expect(page.getByRole('alert').filter({ hasText: 'Inquilino actualizado' })).toBeVisible();
  });

  test('should delete an inquilino', async ({ page }) => {
    // Create an inquilino to delete
    await page.getByRole('button', { name: 'Nuevo Inquilino' }).click();
    await page.getByLabel('Nombre del Inquilino').fill('Carlos Lopez');
    await page.getByLabel('Teléfono').fill('555666777');
    await page.getByRole('button', { name: 'Crear' }).click();
    await expect(page.getByRole('cell', { name: 'Carlos Lopez' })).toBeVisible();

    // Click the delete button
    const row = page.locator('tr').filter({ hasText: 'Carlos Lopez' });
    await row.getByRole('button', { name: 'Eliminar' }).click();

    // Verify inquilino is removed from the list
    await expect(page.getByRole('cell', { name: 'Carlos Lopez' })).not.toBeVisible();

    // Verify success notification
    await expect(page.getByRole('alert').filter({ hasText: 'Inquilino eliminado' })).toBeVisible();
  });

  test('should assign inquilino to a local', async ({ page }) => {
    // First create a local (need a vacant local to assign to)
    await page.getByRole('button', { name: 'Locales' }).click();
    await page.getByRole('button', { name: 'Nuevo Local' }).click();
    await page.getByLabel('ID del Local').fill('LOC001');
    await page.getByLabel('Nombre').fill('Local Comercial');
    await page.getByLabel('Monto de Alquiler (USD)').fill('800');
    await page.getByRole('button', { name: 'Crear' }).click();
    await expect(page.getByRole('cell', { name: 'Local Comercial' })).toBeVisible();

    // Navigate to Inquilinos
    await page.getByRole('button', { name: 'Inquilinos' }).click();

    // Create an inquilino
    await page.getByRole('button', { name: 'Nuevo Inquilino' }).click();
    await page.getByLabel('Nombre del Inquilino').fill('Ana Martinez');
    await page.getByLabel('Teléfono').fill('444555666');
    await page.getByRole('button', { name: 'Crear' }).click();
    await expect(page.getByRole('cell', { name: 'Ana Martinez' })).toBeVisible();

    // Open assign modal
    await page.getByRole('button', { name: 'Asignar a Local' }).click();
    await expect(page.getByRole('dialog', { name: 'Asignar Inquilino a Local' })).toBeVisible();

    // Select inquilino and local
    await page.getByRole('combobox', { name: 'Inquilino' }).click();
    await page.getByRole('option', { name: 'Ana Martinez' }).click();

    await page.getByRole('combobox', { name: 'Local' }).click();
    await page.getByRole('option', { name: 'LOC001' }).click();

    // Submit assignment
    await page.getByRole('button', { name: 'Asignar', exact: true }).click();

    // Verify modal is closed
    await expect(page.getByRole('dialog', { name: 'Asignar Inquilino a Local' })).not.toBeVisible();

    // Verify assignment is reflected in the table
    await expect(page.getByRole('cell', { name: 'Local Comercial' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Asignado' })).toBeVisible();

    // Verify success notification
    await expect(page.getByRole('alert').filter({ hasText: 'Inquilino asignado' })).toBeVisible();
  });

  test('should unassign inquilino from local', async ({ page }) => {
    // Create a local first
    await page.getByRole('button', { name: 'Locales' }).click();
    await page.getByRole('button', { name: 'Nuevo Local' }).click();
    await page.getByLabel('ID del Local').fill('LOC002');
    await page.getByLabel('Nombre').fill('Local Oficina');
    await page.getByLabel('Monto de Alquiler (USD)').fill('600');
    await page.getByRole('button', { name: 'Crear' }).click();
    await expect(page.getByRole('cell', { name: 'Local Oficina' })).toBeVisible();

    // Navigate to Inquilinos
    await page.getByRole('button', { name: 'Inquilinos' }).click();

    // Create an inquilino
    await page.getByRole('button', { name: 'Nuevo Inquilino' }).click();
    await page.getByLabel('Nombre del Inquilino').fill('Pedro Sanchez');
    await page.getByLabel('Teléfono').fill('777888999');
    await page.getByRole('button', { name: 'Crear' }).click();
    await expect(page.getByRole('cell', { name: 'Pedro Sanchez' })).toBeVisible();

    // Assign inquilino to local
    await page.getByRole('button', { name: 'Asignar a Local' }).click();
    await page.getByRole('combobox', { name: 'Inquilino' }).click();
    await page.getByRole('option', { name: 'Pedro Sanchez' }).click();
    await page.getByRole('combobox', { name: 'Local' }).click();
    await page.getByRole('option', { name: 'LOC002' }).click();
    await page.getByRole('button', { name: 'Asignar', exact: true }).click();
    await expect(page.getByRole('cell', { name: 'Asignado' })).toBeVisible();

    // Unassign inquilino
    const row = page.locator('tr').filter({ hasText: 'Pedro Sanchez' });
    await row.getByRole('button', { name: 'Desasignar' }).click();

    // Verify unassignment is reflected
    await expect(page.getByRole('cell', { name: 'Sin asignar' })).toBeVisible();

    // Verify success notification
    await expect(page.getByRole('alert').filter({ hasText: 'Inquilino desasignado' })).toBeVisible();
  });
});
