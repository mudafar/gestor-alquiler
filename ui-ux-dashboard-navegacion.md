# UI/UX — Dashboard, Navegación y Header (MVP)

> Complementa [`plan-sistema-alquileres.md`](./plan-sistema-alquileres.md), [`reportes.md`](./reportes.md) y [`AGENTS.md`](./AGENTS.md).

## 1. Dashboard (Inicio)

Reemplaza el bloque de texto/lista estática actual por 3 tarjetas de KPI + accesos rápidos. Los 3 KPIs elegidos son los únicos reportes que **no requieren ningún filtro/input del usuario** (los otros dos — Resumen financiero y Ficha por local — solo viven en la sección Reportes, ya que requieren rango de fechas / selección de local).

### 1.1 Tarjetas de KPI (grid, 3 columnas en desktop)

**Tarjeta 1 — Ocupación**
- Valor principal: `X de Y locales ocupados` + `%` (ej. "8 de 10 — 80%").
- Cálculo: ya definido en `reportes.md` §4 — usa `estado` calculado de `locales`.
- Clic → navega a Reportes con la vista de Ocupación abierta.

**Tarjeta 2 — Morosos**
- Valor principal: cantidad de cargos en estado "atrasado" (solo contratos activos, según `reportes.md` §2).
- Color de alerta si cantidad > 0 (ej. borde/ícono rojo o ámbar); estado neutral si es 0.
- Clic → navega a Reportes con la vista de Morosos abierta.

**Tarjeta 3 — Próximos Vencimientos**
- Valor principal: cantidad de contratos activos con `fecha_fin` dentro de los próximos 60 días (`reportes.md` §5).
- Color de alerta si cantidad > 0.
- Clic → navega a Reportes con la vista de Vencimientos abierta.

Cada tarjeta: ícono + valor grande + etiqueta descriptiva pequeña debajo (patrón estándar de KPI card).

### 1.2 Accesos rápidos (debajo de las tarjetas)

Fila de botones para las 3 acciones más frecuentes:
- **"+ Registrar Pago"**
- **"+ Nuevo Contrato"**
- **"+ Nuevo Local"**

Cada botón abre directamente el modal de creación correspondiente (mismo modal usado en su sección, con el patrón de botón dual "Crear" / "Crear y agregar otro" ya definido).

### 1.3 Qué se elimina de Inicio
- El bloque de texto "Resumen del sistema" con la lista de bullets de funcionalidades — se elimina por completo, no aporta valor accionable.

---

## 2. Sidebar — Agrupación por sección

Reemplaza la lista plana de 8 ítems por grupos con encabezado (label pequeño, mayúsculas, color gris — no clickeable, solo agrupador visual):

```
Inicio                    (sin grupo, siempre primero)

GESTIÓN
  Locales
  Inquilinos
  Contratos
  Pagos
  Cargos
  Egresos

ANÁLISIS
  Reportes

SISTEMA
  Datos (Importar/Exportar/Limpiar DB — ver sección 3)
```

- Ítem activo: mantener el estilo actual (fondo azul sólido) — ya es correcto, solo extender el patrón a todos los ítems.
- Separación visual entre grupos: espacio + línea divisoria sutil o solo espacio + label, sin necesidad de bordes pesados.

---

## 3. Header — Simplificación y reubicación de acciones de datos

### 3.1 Header principal
- Se mantiene: título "Sistema de Gestión de Alquileres" + ícono de cierre/menú a la izquierda.
- Se elimina del header: botones "Importar DB", "Exportar DB", "Limpiar DB".

### 3.2 Nueva sección "Datos" (dentro de "SISTEMA" en el sidebar)
- Vista dedicada con 3 acciones:
  - **Exportar DB** — acción directa (no destructiva), botón normal.
  - **Importar DB** — acción directa, botón normal, con advertencia inline ("Esto reemplazará los datos actuales" si aplica al comportamiento real).
  - **Limpiar DB** — botón en rojo, pero **requiere modal de confirmación explícita**: texto "Esta acción eliminará todos los datos permanentemente y no se puede deshacer", el usuario debe escribir "ELIMINAR" (o similar) en un input antes de que el botón de confirmar se habilite. Sin este paso, no procede.

---

## 4. Consistencia entre vistas de listado (Locales, Inquilinos, Contratos, Pagos, Cargos, Egresos)

Patrón único a aplicar en las 6 vistas:

- Fila superior: título de la sección (izquierda) + botón primario "+ Nuevo [Entidad]" (derecha), misma alineación en todas.
- Filtros (si aplica a la vista, ej. estado, rango de fecha) en una fila debajo del título, antes de la tabla.
- Tabla con ancho máximo ~1200-1400px, centrada — evitar estirar tablas/contenido al ancho completo en monitores grandes (mejora legibilidad).
- Modal de creación: mismo patrón de botón dual ya definido en `plan-sistema-alquileres.md` §7bis, aplicado consistentemente.

---

## 5. Alcance de responsive

- Target: **solo resoluciones de escritorio estándar** (ej. 1366×768, 1440×900, 1920×1080). No se optimiza para tablet/móvil — es una app de escritorio Windows.
- Sidebar fijo (no colapsable a hamburguesa) en estas resoluciones — se mantiene el comportamiento actual de sidebar visible siempre.

---

## 6. Fuera de alcance de este documento

- Gráficos/visualizaciones avanzadas en el dashboard (barras, líneas) — los KPIs son solo valores numéricos + etiqueta, sin chart en el MVP.
- Personalización del dashboard (reordenar/ocultar tarjetas) — fijo para todos los usuarios.
- Modo oscuro / temas.
