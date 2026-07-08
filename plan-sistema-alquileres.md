# Plan: Sistema de Gestión de Alquileres de Locales Comerciales (MVP)

> Este documento refleja el estado objetivo del sistema, incluyendo cambios sobre la versión ya implementada (contratos, cédula de inquilino, tasa de cambio, sql.js offline). Ver `AGENTS.md` para estado real de implementación.

## 1. Alcance

- Gestión de alquileres de locales comerciales (oficinas/locales).
- Fuera de alcance: estacionamiento/parking.
- Aplicación de escritorio Windows (empaquetado es un paso separado, fuera de este plan).
- Un solo usuario, sin red/multiusuario, sin login.
- Debe funcionar completamente **sin conexión a internet** (sql.js debe cargarse localmente, no desde CDN).
- Idioma: 100% español (UI, mensajes, labels, fechas).

## 2. Stack Tecnológico

- React + TypeScript + Vite
- Mantine (`@mantine/core`, `@mantine/form`, `@mantine/hooks`, `@mantine/notifications`, `@mantine/dates`)
- Zustand + Immer
- sql.js (SQLite WASM) — **bundleado localmente vía npm**, wasm servido desde assets propios, no desde CDN
- IndexedDB para auto-persistencia + export/import manual de `.db` como backup
- Sin backend/servidor. Sin autenticación. Sin conexión de red requerida.

## 3. Modelo de Datos (SQLite)

### Tabla: locales
- id (PK, INTEGER AUTOINCREMENT — generado automáticamente, mostrado como `#ID` en UI)
- nombre
- direccion (opcional)
- estado (ocupado / vacante) — **calculado automáticamente**: ocupado si tiene un contrato activo, vacante si no. No editable manualmente, se muestra como informativo.
- monto_alquiler_base (USD)
- monto_condominio_base (USD, opcional, nullable)
- monto_luz_base (USD, opcional, nullable)
- activo (booleano, soft-delete)

### Tabla: inquilinos
- id (PK)
- nombre (obligatorio)
- cedula (opcional, único si se llena)
- activo (booleano, soft-delete)
- Sin `local_id` — la relación con locales vive únicamente en `contratos`.
- Sin campo teléfono (eliminado).
- Un inquilino puede tener contratos en varios locales (simultáneos o históricos).

### Tabla: contratos
- id (PK)
- local_id (FK → locales, INTEGER)
- inquilino_id (FK → inquilinos)
- fecha_inicio (mes/año)
- fecha_fin (mes/año, obligatoria)
- monto_alquiler (USD, snapshot editable al crear — hereda de local por defecto)
- monto_condominio (USD, opcional, snapshot editable)
- monto_luz (USD, opcional, snapshot editable)
- observaciones (texto libre, opcional)
- estado (activo / finalizado / cancelado)
- creado_en (timestamp)
- **Inmutable tras creación** — no se edita; para corregir se cancela y se crea uno nuevo.

### Tabla: cargos_mensuales
- id (PK)
- contrato_id (FK → contratos) — ya no referencia local directamente (se resuelve vía contrato)
- anio
- mes
- monto_alquiler (snapshot USD, copiado del contrato al generar)
- monto_condominio (snapshot USD, nullable)
- monto_luz (snapshot USD, nullable)
- monto_total (calculado: suma de los anteriores)
- Nota: `monto_pagado` y `estado_morosidad` **no se almacenan** — se calculan siempre on-the-fly a partir de `pagos` (evita desincronización).
- Se generan todos los cargos del contrato (uno por mes) al momento de crear el contrato.

### Tabla: pagos
- id (PK)
- cargo_mensual_id (FK → cargos_mensuales) — resuelve contrato y local por transitividad (join), sin FK redundante
- fecha_pago
- monto_bs (monto ingresado en bolívares)
- tasa_cambio (tasa usada en este pago, guardada como registro histórico)
- monto_usd (calculado: monto_bs / tasa_cambio — es el valor usado internamente en todos los cálculos y reportes)
- cuenta (juridica / personal) — obligatoria
- creado_en (timestamp)
- **No se permite sobrepago**: monto_usd no puede exceder el saldo pendiente del cargo (monto_total − suma de pagos ya registrados en ese cargo). Si el usuario quiere pagar de más, debe registrar un pago adicional contra otro cargo/mes.

### Tabla: egresos
- id (PK)
- fecha
- monto
- moneda (USD / BS)
- descripcion
- categoria (texto libre, opcional)

### Tabla: config
- clave (PK, texto)
- valor
- Uso: guardar `ultima_tasa_cambio` para pre-cargar el formulario de pagos.

## 4. Reglas de Negocio

### Contratos
- Un local solo puede tener **un contrato activo a la vez** (validación de "no más de uno activo", no por solapamiento de fechas contra históricos).
- Validación de "contrato activo" se evalúa solo contra otros contratos en estado `activo` del mismo local (no contra finalizados/cancelados).
- Al crear el contrato, se generan automáticamente todos los cargos mensuales del rango fecha_inicio → fecha_fin.
- Estado del contrato pasa a `finalizado` automáticamente al cargar la app, si la fecha actual supera fecha_fin.
- Cancelar un contrato (antes de su fecha fin):
  - Elimina cargos **futuros sin pago**.
  - Conserva cargos **pasados sin pago** (historial de morosidad).
  - Conserva cargos **con pago** (parcial o total), sin importar si son pasados o futuros.
  - Pasa el contrato a estado `cancelado`.
- No se permite editar un contrato existente. Para corregir datos: cancelar y crear uno nuevo.
- Renovación: manual — crear un nuevo contrato con nuevas fechas (no hay atajo de "renovar").

### Cargos mensuales
- Monto total = alquiler + condominio (si aplica) + luz (si aplica), snapshot del contrato al generar.
- `monto_pagado` = suma de pagos (en USD) asociados al cargo — calculado en cada consulta.
- Saldo pendiente = monto_total − monto_pagado — calculado en cada consulta.

### Pagos
- Todo pago se ingresa en bolívares (BS) junto con la tasa de cambio del día.
- El sistema calcula automáticamente el equivalente en USD (monto_bs / tasa_cambio); ese valor USD es el que se usa en todos los cálculos internos, saldos y reportes.
- La tasa usada se guarda en el pago (registro histórico) y también actualiza `config.ultima_tasa_cambio`.
- El formulario de pago pre-carga la última tasa guardada, editable por el usuario en cada pago.
- Cuenta (jurídica/personal) es obligatoria en cada pago.
- No se permite registrar un pago cuyo monto_usd exceda el saldo pendiente del cargo seleccionado.
- Un pago se vincula a un cargo mensual específico (mes/contrato). Pagos parciales permitidos: se acumulan hasta completar el monto_total del cargo.

### Morosidad (por cargo mensual, calculado on-the-fly)
- **Al día**: pagado completo antes o el día 5 del mes correspondiente.
- **Atrasado**: después del día 5 sin completar el monto total (o sin pago alguno).
- **Adelantado**: mes futuro pagado en su totalidad antes de que inicie.

### Cuentas
- Etiqueta en el pago (jurídica / personal), sin saldo propio — solo para agrupación en reportes.

### Egresos
- Registro manual, general del negocio (no vinculado a locales ni contratos).

### Reportes (todo en USD)
- Todos los cálculos internos y reportes se expresan únicamente en USD (BS es solo referencia histórica guardada en cada pago individual).
- Reportes incluyen pagos/cargos de contratos en cualquier estado (activo, finalizado, cancelado) — no se filtran por estado de contrato.

## 5. Funcionalidades (Módulos)

### 5.1 Locales
- Crear / editar / desactivar local.
- Campos: nombre, dirección, estado (informativo, automático), monto alquiler base, condominio base (opcional), luz base (opcional). ID auto-generado.
- Listado con filtro por estado.

### 5.2 Inquilinos
- CRUD: nombre (obligatorio), cédula (opcional, única).
- Sin asignación directa a local — se maneja vía contratos.
- Un inquilino puede figurar en varios contratos (mismos o distintos locales).

### 5.3 Contratos
- Crear contrato: seleccionar local (debe estar vacante) e inquilino, fecha_inicio, fecha_fin (mes/año), montos (pre-cargados desde el local, editables), observaciones.
- Validación: bloquear si el local ya tiene un contrato activo.
- Al guardar: genera automáticamente todos los cargos mensuales del rango.
- Acción: cancelar contrato (con confirmación, explicando que se eliminarán cargos futuros sin pago).
- Vista: listado de contratos por local (activo + histórico).

### 5.4 Cargos Mensuales
- Vista de cargos por contrato: mes, monto total, saldo pendiente, estado de morosidad (todo calculado).
- No se generan manualmente — se generan automáticamente al crear el contrato.

### 5.5 Pagos
- Registrar pago: seleccionar contrato → cargo mensual (mes), monto en BS, tasa de cambio (pre-cargada con la última usada, editable), cuenta (jurídica/personal), fecha.
- Cálculo automático de monto USD, validación de no exceder saldo pendiente.
- Listado/historial de pagos con filtro.

### 5.6 Egresos
- Registrar egreso: fecha, monto, moneda, descripción, categoría.
- Listado con filtro por rango de fechas.

### 5.7 Reportes
- **Resumen financiero por rango de fechas**: totales de ingresos (pagos, en USD) y egresos, agrupados por cuenta (ingresos).
- **Ficha por local**: contrato activo actual (si existe) + listado de contratos históricos (finalizados/cancelados), con sus cargos y pagos asociados.
- **Morosos actuales**: listado de cargos en estado "atrasado" (con local, contrato e inquilino asociado).

### 5.8 Persistencia / Backup
- Auto-persistencia a IndexedDB en cada operación de escritura.
- Export/import manual de archivo `.db` para backup/compartir.
- sql.js debe cargar sus assets (wasm) localmente, sin depender de CDN/internet.

## 6. Arquitectura de la Aplicación

- React SPA (Vite) con sql.js manejando la DB en memoria.
- IndexedDB como persistencia automática; export/import manual de `.db` como backup portátil.
- Zustand + Immer como capa de estado global; todas las acciones CRUD pasan por el store, nunca se consulta la DB directamente desde los componentes.
- Cálculos derivados (morosidad, monto_pagado, saldo pendiente) implementados como funciones puras, ejecutadas en cada consulta/render — nunca almacenados como estado persistente.

## 7. Pantallas (UI)

1. **Locales**: tabla + formulario crear/editar.
2. **Inquilinos**: tabla + formulario crear/editar (nombre, cédula).
3. **Contratos**: formulario crear (local, inquilino, fechas, montos, observaciones) + listado + acción cancelar.
4. **Detalle de Local**: datos del local, contrato activo, histórico de contratos.
5. **Pagos**: formulario de registro (contrato → cargo → monto BS + tasa + cuenta) + listado/filtro.
6. **Egresos**: formulario + listado/filtro por fecha.
7. **Reportes**: selector de rango de fechas + resumen financiero + lista de morosos.
8. Navegación por tabs (sin router).

## 7bis. Estándar UI/UX — Formularios de Creación

Aplica de forma **consistente** a los 4 formularios de creación: Locales, Inquilinos, Contratos, Pagos.

### Patrón: botón dual "Crear" / "Crear y agregar otro"

- El footer del modal tiene **dos botones**:
  - **"Crear"**: guarda el registro y **cierra** el modal.
  - **"Crear y agregar otro"**: guarda el registro, **limpia el formulario**, **mantiene el modal abierto**, foco automático en el primer campo.
- En **ambos** casos: mostrar notificación de éxito (`@mantine/notifications`, ícono check, ej. "Local creado correctamente") — 3-4 segundos.
- Este patrón resuelve la ambigüedad reportada: el usuario decide explícitamente si sigue cargando datos o termina, sin adivinar si el clic funcionó o si el modal se va a cerrar solo.
- Aplica solo a **creación**. En **edición** de un registro existente: un solo botón "Guardar", que guarda y cierra el modal (no aplica "guardar y agregar otro").

### Caso especial: Pagos

- Tras cualquiera de los dos botones (Crear / Crear y agregar otro), **limpiar el formulario completo**, incluyendo selección de local/contrato/cargo y montos.
- Excepción: **no** limpiar el formulario si el pago fue **rechazado** por validación (ej. sobrepago) — mantener los valores para que el usuario corrija.

### Fecha inicio/fin en Contratos

- Usar `MonthPickerInput` (`@mantine/dates`) para fecha_inicio y fecha_fin — selección de mes/año únicamente, sin días (coincide con el modelo `anio`/`mes`).
- Validación: fecha_fin no puede ser anterior a fecha_inicio.

### Pagos — inputs USD y Bs con cálculo bidireccional

- Dos `NumberInput` editables: **Monto (USD)** y **Monto (Bs)**, más el input de **Tasa de cambio** (pre-cargado con la última tasa guardada en `config`).
- Si el usuario edita USD → recalcular Bs = USD × tasa.
- Si el usuario edita Bs → recalcular USD = Bs / tasa.
- Si el usuario edita la tasa después de haber llenado un monto → recalcular el campo que **no fue el último editado manualmente** por el usuario (evitar sobreescribir el valor que el usuario acaba de fijar a propósito).
- El modelo de datos **no cambia**: se sigue guardando `monto_bs`, `tasa_cambio`, y `monto_usd` (usado en todos los cálculos/validaciones internas, incluyendo el chequeo de no-sobrepago). Los dos inputs son solo una conveniencia de entrada de datos en la UI.

### Pagos — flujo de selección y preselección de cargo

- Flujo de selección: **1) Local/Contrato → 2) Cargo (mes)**.
- Al seleccionar el contrato, el sistema preselecciona automáticamente el cargo cuyo mes/año coincide con la **fecha actual del pago**, **solo si** ese cargo existe y tiene saldo pendiente.
- Si no hay cargo del mes actual con saldo pendiente (ya pagado completo, o el contrato no cubre el mes actual), no preseleccionar — el usuario elige manualmente entre los cargos con saldo pendiente del contrato.

## 8. Fuera de Alcance (explícito)

- Estacionamiento / parking.
- Edición de contratos existentes (solo cancelar + crear nuevo).
- Renovación automática/asistida de contratos.
- Manejo de excedente de pago (sobrepago) — bloqueado, no redistribuido.
- Métodos de pago como campo (pago móvil, efectivo, punto de venta).
- Recibos/comprobantes imprimibles.
- Multiusuario, red local, login/autenticación.
- Cálculo de intereses/recargos por mora.
- Tipos de cargo adicionales más allá de alquiler/condominio/luz.