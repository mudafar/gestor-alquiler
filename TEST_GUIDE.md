# Rental Management System - Testing Guide

This guide explains how to test each feature of the rental management system.

## 1. Locales (Properties) Module

### Testing Steps:
1. Click on "Locales" in the navigation menu
2. Click "Nuevo Local" button
3. Fill in the form:
   - ID del Local: LOCAL001
   - Nombre: Local Ejemplo
   - Dirección: Calle Principal 123
   - Estado: Vacante
   - Monto de Alquiler (USD): 1000
4. Click "Crear" button
5. Verify the new local appears in the table

## 2. Inquilinos (Tenants) Module

### Testing Steps:
1. Click on "Inquilinos" in the navigation menu
2. Click "Nuevo Inquilino" button
3. Fill in the form:
   - Nombre: Juan Pérez
   - Email: juan@example.com
   - Teléfono: 123456789
   - Dirección: Av. Principal 456
   - Fecha Inicio: 2023-01-01
   - Fecha Fin: 2024-01-01
4. Click "Crear" button
5. Verify the new tenant appears in the table
6. Assign tenant to a property:
   - Click the "Asignar" button for the tenant
   - Select a property from the dropdown
   - Confirm assignment

## 3. Cargos (Charges) Module

### Testing Steps:
1. Click on "Cargos" in the navigation menu
2. Select year (e.g., 2023)
3. Select month (e.g., Enero)
4. Click "Generar Cargos" button
5. Verify charges are generated for all occupied properties

## 4. Pagos (Payments) Module

### Testing Steps:
1. Click on "Pagos" in the navigation menu
2. Select "Registro" tab
3. Select a property from the dropdown
4. Select a charge from the dropdown
5. Enter payment date (YYYY-MM-DD format)
6. Enter payment amount
7. Select currency (USD or BS)
8. Click "Registrar Pago" button
9. Verify payment appears in the history table

## 5. Egresos (Expenses) Module

### Testing Steps:
1. Click on "Egresos" in the navigation menu
2. Click "Nuevo Egreso" button
3. Fill in the form:
   - Fecha: 2023-01-15
   - Monto: 500
   - Moneda: USD
   - Descripción: Mantenimiento
   - Categoría: Mantenimiento
4. Click "Crear" button
5. Verify the new expense appears in the table

## 6. Reportes (Reports) Module

### Testing Steps:
1. Click on "Reportes" in the navigation menu
2. Set date range (e.g., 2023-01-01 to 2023-12-31)
3. Click "Generar Reporte" button
4. View the financial summary and morosos list

## Important Notes:
- All data is stored locally in the browser using sql.js
- The database is initialized automatically when the application starts
- Changes are persisted between sessions
- The application is fully responsive and works on all screen sizes