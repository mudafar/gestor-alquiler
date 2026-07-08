# Reportes — Especificación (MVP)

> Este documento detalla los 5 reportes del MVP. Complementa [`plan-sistema-alquileres.md`](./plan-sistema-alquileres.md) y [`AGENTS.md`](./AGENTS.md). Todos los cálculos monetarios son en **USD**.

## 1. Resumen Financiero por Rango de Fechas

**Propósito:** vista consolidada de ingresos vs. egresos en un período.

**Filtro:** rango de fechas (fecha_inicio, fecha_fin), seleccionado por el usuario.

**Cálculo:**
- Ingresos: `SUM(pagos.monto_usd)` donde `pagos.fecha_pago` está dentro del rango, agrupado por `cuenta` (jurídica / personal).
- Egresos: `SUM(egresos.monto)` donde `egresos.fecha` está dentro del rango (convertir a USD si `egresos.moneda = 'BS'` — nota: el modelo de egresos no tiene tasa asociada; si el egreso es en BS, mostrarlo aparte, no mezclado en el total USD, o registrar egresos siempre en USD para evitar ambigüedad — confirmar con negocio si aplica).
- Total ingresos, total egresos, y neto (ingresos − egresos).

**Datos incluidos:** pagos y egresos de **cualquier estado de contrato** (activo, finalizado, cancelado) — es dinero real recibido/gastado, no se filtra por estado.

**Salida:** tabla o tarjetas con: Ingresos por cuenta (jurídica, personal), total ingresos, total egresos, neto.

---

## 2. Morosos Actuales

**Propósito:** identificar qué locales/inquilinos tienen pagos atrasados hoy, para gestión de cobranza.

**Filtro:** ninguno (siempre "a la fecha actual"). Solo contratos en estado `activo`.

**Cálculo por cargo_mensual** (solo cargos de contratos `activo`):

```
monto_pagado = SUM(pagos.monto_usd) WHERE pagos.cargo_mensual_id = cargo.id
saldo_pendiente = cargo.monto_total - monto_pagado
fecha_limite = día 5 del mes/año del cargo (cargo.mes, cargo.anio)

estado_morosidad:
  SI saldo_pendiente <= 0:
    SI fecha_actual < primer_día_del_mes_del_cargo → "adelantado"
    SINO → "al_dia"
  SINO (saldo_pendiente > 0):
    SI fecha_actual > fecha_limite → "atrasado"
    SINO → "al_dia"  (aún dentro del plazo, no vencido)
```

**Filtro de inclusión en el reporte:** solo cargos con `estado_morosidad = "atrasado"` Y `contrato.estado = "activo"`.

**Salida:** tabla con: Local, Inquilino, Mes/Año del cargo, Monto total, Monto pagado, Saldo pendiente, Días de atraso (opcional: `fecha_actual - fecha_limite`).

**Nota:** deuda de contratos `finalizado` o `cancelado` **no aparece aquí** — se consulta en la Ficha por Local (reporte 3).

---

## 3. Ficha por Local

**Propósito:** vista de auditoría/historial completo de un local específico.

**Filtro:** selección de un local (dropdown/búsqueda).

**Contenido:**
- Datos del local (nombre, dirección, estado actual ocupado/vacante).
- **Contrato activo** (si existe): inquilino, fecha_inicio, fecha_fin, montos, observaciones, tabla de cargos_mensuales del contrato con su saldo y estado de morosidad (calculado igual que en reporte 2, sin filtrar por "atrasado" — se muestran todos: al_dia, atrasado, adelantado).
- **Contratos históricos** (finalizado / cancelado): listado colapsable/expandible, cada uno con sus propios cargos y pagos asociados (incluye cargos con pago que sobrevivieron a una cancelación).

**Datos incluidos:** todos los contratos del local sin importar estado — este es el reporte que sí muestra el histórico completo, a diferencia de "Morosos actuales".

**Salida:** vista de detalle (no tabla plana) — sección contrato activo arriba, histórico debajo.

---

## 4. Ocupación

**Propósito:** visión general de cuántos locales están generando ingreso vs. vacíos.

**Filtro:** ninguno (estado actual, en tiempo real).

**Cálculo:**
- `estado` de cada local ya es un campo calculado (ocupado si tiene contrato `activo`, vacante si no) — este reporte solo agrega/lista.
- Total locales activos (no soft-deleted).
- Cantidad y % ocupados vs. vacantes.
- Listado de locales vacantes (para acción rápida: cuáles necesitan un inquilino).

**Salida:** resumen numérico (ej. "8 de 10 locales ocupados — 80%") + tabla de locales vacantes (nombre, dirección).

---

## 5. Próximos Vencimientos de Contrato

**Propósito:** anticipar renovaciones antes de perder un inquilino por descuido.

**Filtro:** ventana de tiempo fija de **60 días** hacia adelante desde la fecha actual (no configurable en MVP, simplicidad).

**Cálculo:**
- Contratos con `estado = "activo"` Y `fecha_fin` entre la fecha actual y fecha actual + 60 días.
- Ordenado por `fecha_fin` ascendente (los más urgentes primero).

**Salida:** tabla con: Local, Inquilino, fecha_fin, días restantes (`fecha_fin - fecha_actual`).

---

## Resumen de dependencias de datos

| Reporte | Tablas usadas | Filtra por estado de contrato |
|---|---|---|
| 1. Resumen financiero | pagos, egresos | No (todos) |
| 2. Morosos actuales | cargos_mensuales, pagos, contratos | Sí — solo `activo` |
| 3. Ficha por local | locales, contratos, cargos_mensuales, pagos | No (todos, separado por sección) |
| 4. Ocupación | locales, contratos | Implícito (vía `estado` calculado) |
| 5. Próximos vencimientos | contratos | Sí — solo `activo` |
