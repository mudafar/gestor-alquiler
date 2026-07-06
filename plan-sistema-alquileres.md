# Plan: Sistema de Gestión de Alquileres de Locales Comerciales (MVP)

## 1. Alcance

- Gestión de alquileres de locales comerciales (oficinas/locales).
- Fuera de alcance: estacionamiento/parking (no incluir en ningún módulo).
- Aplicación de escritorio Windows (empaquetado como app de escritorio es un paso separado, fuera de este plan), un solo usuario, sin red/multiusuario, sin login.
- Idioma: 100% español (UI, mensajes, labels, fechas).

## 2. Stack Tecnológico

- **Frontend**: React + TypeScript
- **UI**: Mantine (componentes, formularios con `@mantine/form`, tablas, inputs de fecha/número/select, notificaciones)
- **Estado**: Zustand
- **Base de datos**: sql.js (SQLite compilado a WASM), en memoria + persistencia manual a archivo `.db`
- **Empaquetado escritorio**: fuera de alcance de este plan (paso separado)
- Sin backend/servidor. Sin autenticación. Sin conexión de red.

## 3. Modelo de Datos (SQLite)

### Tabla: locales
- id (PK, texto — usa el código/ID propio del local)
- nombre
- direccion (opcional)
- estado (ocupado / vacante)
- monto_alquiler (USD, fijo)
- monto_condominio (USD, opcional, nullable)
- monto_luz (USD, opcional, nullable)
- activo (booleano, para soft-delete)

### Tabla: inquilinos
- id (PK)
- local_id (FK → locales)
- nombre
- telefono (opcional)
- activo (booleano — solo un inquilino activo por local)

### Tabla: cargos_mensuales
- id (PK)
- local_id (FK)
- anio
- mes
- monto_alquiler (snapshot USD)
- monto_condominio (snapshot USD, nullable)
- monto_luz (snapshot USD, nullable)
- monto_total (calculado: suma de los anteriores)
- monto_pagado (acumulado, se actualiza con cada pago)
- estado_morosidad (al_dia / atrasado / adelantado)
- Nota: un registro por local por mes; se genera automáticamente o bajo demanda.

### Tabla: pagos
- id (PK)
- cargo_mensual_id (FK → cargos_mensuales)
- local_id (FK, redundante para queries rápidas)
- fecha_pago
- monto
- moneda (USD / BS)
- cuenta (juridica / personal)
- creado_en (timestamp)

### Tabla: egresos
- id (PK)
- fecha
- monto
- moneda (USD / BS)
- descripcion
- categoria (texto libre, opcional)

## 4. Reglas de Negocio

### Cargos mensuales
- Monto total del mes = alquiler + condominio (si aplica) + luz (si aplica).
- Todos los montos de cargos están en USD (fijo).
- Los pagos pueden hacerse en USD o BS (moneda seleccionable por pago), sin conversión automática — el sistema no maneja tasa de cambio.

### Pagos parciales
- Un pago se vincula a un mes (cargo_mensual) específico.
- Si el pago no cubre el monto total, el cargo queda con saldo pendiente (monto_pagado < monto_total).
- Pagos adicionales al mismo mes se acumulan hasta completar el monto total.

### Morosidad (por cargo mensual)
- **Al día**: pagado completo antes o el día 5 del mes correspondiente.
- **Atrasado**: después del día 5 sin completar el monto total (o sin pago alguno).
- **Adelantado**: mes futuro pagado en su totalidad antes de que inicie.
- El estado se recalcula cada vez que se registra un pago o al consultar (no requiere proceso en segundo plano).

### Cuentas
- "Cuenta" es solo una etiqueta/tipo en el pago: jurídica o personal. No maneja saldos ni balances propios — es únicamente para reportes.

### Egresos
- Registro manual, general del negocio (no vinculado a locales).
- Campos: fecha, monto, moneda, descripción, categoría (texto libre, opcional).

## 5. Funcionalidades (Módulos)

### 5.1 Locales
- Crear / editar / desactivar local.
- Campos: código (ID), nombre, dirección, estado (ocupado/vacante), monto alquiler, condominio (opcional), luz (opcional).
- Listado con filtro por estado.

### 5.2 Inquilinos
- Asignar inquilino activo a un local (nombre, teléfono).
- Historial simple (opcional para MVP: solo inquilino actual).

### 5.3 Cargos Mensuales
- Generación de cargo mensual por local (manual o automática al inicio del mes).
- Vista de cargos pendientes/pagados por mes.

### 5.4 Pagos
- Registrar pago: local, mes que cubre, monto, moneda, cuenta (jurídica/personal), fecha.
- Permitir pago parcial (queda saldo pendiente visible).
- No se requiere método de pago ni recibo.

### 5.5 Egresos
- Registrar egreso: fecha, monto, moneda, descripción, categoría.
- Listado con filtro por rango de fechas.

### 5.6 Reportes
- **Resumen financiero por rango de fechas**: totales de ingresos (pagos) y egresos, agrupados por moneda y por cuenta (solo ingresos).
- **Ficha por local**: historial de cargos mensuales, pagos asociados, saldo, estado de morosidad.
- **Morosos actuales**: listado de locales con cargo(s) en estado "atrasado".

### 5.7 Persistencia / Backup
- Guardado manual: botón "Guardar" que exporta la base sql.js a un archivo `.db` en disco.
- Carga manual: botón "Abrir base de datos" para cargar un archivo `.db` existente al iniciar.
- Compartir/backup = copiar el archivo `.db` manualmente (no hay sincronización automática).

## 6. Arquitectura de la Aplicación

- React app con sql.js manejando la DB en memoria (en el hilo principal o en un worker).
- Acceso a filesystem (leer/guardar `.db`) vía File System Access API del navegador, o mecanismo equivalente que provea el empaquetado de escritorio (a definir en el paso separado de empaquetado).
- Zustand como capa de estado global: locales, inquilinos, cargos, pagos, egresos cargados en memoria tras abrir la DB.
- Toda escritura (crear pago, local, egreso, etc.) actualiza sql.js en memoria y el estado Zustand; el guardado a disco es explícito (botón Guardar), no automático por operación (evitar overhead), pero se debe advertir visualmente si hay cambios sin guardar.

## 7. Pantallas (UI)

1. **Locales**: tabla + formulario crear/editar.
2. **Detalle de Local**: datos del local, inquilino activo, historial de cargos/pagos (ficha).
3. **Pagos**: formulario de registro rápido + listado/filtro.
4. **Egresos**: formulario + listado/filtro por fecha.
5. **Reportes**: selector de rango de fechas + resumen financiero + lista de morosos.
6. Barra superior o tabs para navegar entre secciones (sin router, single-page con estado de sección activa).
7. Indicador de "cambios sin guardar" + botones Guardar / Abrir DB.

## 8. Plan de Construcción (para agente de IA)

1. Definir esquema SQLite completo (tablas + relaciones) y script de inicialización.
2. Implementar capa de acceso a datos (funciones TS que ejecutan SQL vía sql.js): CRUD locales, inquilinos, cargos, pagos, egresos + queries de reportes.
3. Implementar lógica de negocio pura (cálculo de morosidad, monto_total, saldo pendiente) como funciones testeables independientes de UI/DB.
4. Implementar abrir/guardar archivo `.db` (File System Access API o mecanismo provisional en navegador).
5. Construir UI en React + Mantine por módulo (Locales → Pagos → Egresos → Reportes), conectando a la capa de datos vía Zustand.
6. Pruebas manuales por módulo antes de integrar el siguiente.
7. Reportes al final (dependen de todos los datos previos).
8. Empaquetado como app de escritorio Windows: paso separado, no incluido en este plan.

## 9. Fuera de Alcance (explícito)

- Estacionamiento / parking.
- Tasa de cambio o conversión de moneda.
- Métodos de pago (pago móvil, efectivo, punto de venta) como campo.
- Recibos/comprobantes imprimibles.
- Multiusuario, red local, login/autenticación.
- Historial de inquilinos anteriores (solo activo).
- Cálculo de intereses/recargos por mora.
