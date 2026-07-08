import { getDatabase } from './db';

// ── Interfaces ──

export interface Local {
  id: number;
  nombre: string;
  direccion?: string;
  monto_alquiler: number;
  monto_condominio?: number | null;
  monto_luz?: number | null;
  activo: boolean;
}

export interface Inquilino {
  id: number;
  nombre: string;
  cedula?: string;
  activo: boolean;
}

export interface Contrato {
  id: number;
  local_id: number;
  inquilino_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  monto_alquiler: number;
  monto_condominio: number | null;
  monto_luz: number | null;
  observaciones: string | null;
  estado: 'activo' | 'finalizado' | 'cancelado';
  creado_en: string;
}

export interface CargoMensual {
  id: number;
  contrato_id: number;
  anio: number;
  mes: number;
  monto_alquiler: number;
  monto_condominio: number | null;
  monto_luz: number | null;
  monto_total: number;
  // computed
  monto_pagado: number;
  estado_morosidad: 'al_dia' | 'atrasado' | 'adelantado';
}

export interface Pago {
  id: number;
  cargo_mensual_id: number;
  fecha_pago: string;
  monto_bs: number;
  tasa_cambio: number;
  monto_usd: number;
  cuenta: 'juridica' | 'personal';
  creado_en: string;
}

export interface Egreso {
  id: number;
  fecha: string;
  monto: number;
  moneda: 'USD' | 'BS';
  descripcion: string;
  categoria?: string;
}

export interface ConfigRow {
  clave: string;
  valor: string;
}

// ── Helpers ──

function select<T>(sql: string, params: any[] = []): T[] {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return rows;
}

function execute(sql: string, params: any[] = []): void {
  const db = getDatabase();
  db.run(sql, params);
}

export function calcularMorosidad(
  anio: number,
  mes: number,
  montoTotal: number,
  montoPagado: number,
  today: Date = new Date()
): 'al_dia' | 'atrasado' | 'adelantado' {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const esFuturo = anio > currentYear || (anio === currentYear && mes > currentMonth);
  if (esFuturo) {
    return montoPagado >= montoTotal ? 'adelantado' : 'al_dia';
  }

  if (montoPagado >= montoTotal) return 'al_dia';

  const esMesActual = anio === currentYear && mes === currentMonth;
  if (esMesActual) return currentDay <= 5 ? 'al_dia' : 'atrasado';

  return 'atrasado';
}

// ── Locales ──

function getLocalEstado(localId: number): 'ocupado' | 'vacante' {
  const activos = select<any>(
    "SELECT id FROM contratos WHERE local_id = ? AND estado = 'activo' LIMIT 1",
    [localId]
  );
  return activos.length > 0 ? 'ocupado' : 'vacante';
}

// ── App Service ──

export const appService = {
  // ===== LOCALES =====
  getLocales(soloActivos: boolean = true): Local[] {
    const query = soloActivos
      ? 'SELECT * FROM locales WHERE activo = 1 ORDER BY id ASC'
      : 'SELECT * FROM locales ORDER BY id ASC';
    const rows = select<any>(query);
    return rows.map(r => ({ ...r, activo: r.activo === 1 }));
  },

  getLocalEstado(localId: number): 'ocupado' | 'vacante' {
    return getLocalEstado(localId);
  },

  createLocal(local: Omit<Local, 'id' | 'activo'>): number {
    const db = getDatabase();
    db.run(
      `INSERT INTO locales (nombre, direccion, monto_alquiler, monto_condominio, monto_luz, activo)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [local.nombre, local.direccion || null, local.monto_alquiler, local.monto_condominio || null, local.monto_luz || null]
    );
    const result = db.exec('SELECT last_insert_rowid() AS id');
    return result[0].values[0][0] as number;
  },

  updateLocal(local: Local): void {
    execute(
      `UPDATE locales SET nombre = ?, direccion = ?, monto_alquiler = ?, monto_condominio = ?, monto_luz = ?, activo = ? WHERE id = ?`,
      [local.nombre, local.direccion || null, local.monto_alquiler, local.monto_condominio || null, local.monto_luz || null, local.activo ? 1 : 0, local.id]
    );
  },

  deleteLocal(id: number): void {
    execute('UPDATE locales SET activo = 0 WHERE id = ?', [id]);
  },

  // ===== INQUILINOS =====
  getInquilinosActivos(): Inquilino[] {
    const rows = select<any>('SELECT * FROM inquilinos WHERE activo = 1 ORDER BY nombre ASC');
    return rows.map(r => ({ id: r.id, nombre: r.nombre, cedula: r.cedula ?? undefined, activo: true }));
  },

  getAllInquilinos(): Inquilino[] {
    const rows = select<any>('SELECT * FROM inquilinos ORDER BY nombre ASC');
    return rows.map(r => ({ id: r.id, nombre: r.nombre, cedula: r.cedula ?? undefined, activo: r.activo === 1 }));
  },

  createInquilino(nombre: string, cedula?: string): number {
    const db = getDatabase();
    db.run('INSERT INTO inquilinos (nombre, cedula, activo) VALUES (?, ?, 1)', [nombre, cedula || null]);
    const result = db.exec('SELECT last_insert_rowid() AS id');
    return result[0].values[0][0] as number;
  },

  updateInquilino(id: number, nombre: string, cedula?: string): void {
    execute('UPDATE inquilinos SET nombre = ?, cedula = ? WHERE id = ?', [nombre, cedula || null, id]);
  },

  deleteInquilino(id: number): void {
    execute('UPDATE inquilinos SET activo = 0 WHERE id = ?', [id]);
  },

  // ===== CONTRATOS =====
  getContratos(): Contrato[] {
    return select<Contrato>('SELECT * FROM contratos ORDER BY creado_en DESC');
  },

  getContratosPorLocal(localId: number): Contrato[] {
    return select<Contrato>('SELECT * FROM contratos WHERE local_id = ? ORDER BY creado_en DESC', [localId]);
  },

  getContratoActivo(localId: number): Contrato | null {
    const rows = select<Contrato>(
      "SELECT * FROM contratos WHERE local_id = ? AND estado = 'activo' LIMIT 1",
      [localId]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  createContrato(data: {
    local_id: number;
    inquilino_id: number;
    fecha_inicio: string;
    fecha_fin: string;
    monto_alquiler: number;
    monto_condominio?: number | null;
    monto_luz?: number | null;
    observaciones?: string;
  }): void {
    const activo = this.getContratoActivo(data.local_id);
    if (activo) throw new Error(`El local ya tiene un contrato activo.`);

    const db = getDatabase();
    const timestamp = new Date().toISOString();

    db.run(
      `INSERT INTO contratos (local_id, inquilino_id, fecha_inicio, fecha_fin, monto_alquiler, monto_condominio, monto_luz, observaciones, estado, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activo', ?)`,
      [data.local_id, data.inquilino_id, data.fecha_inicio, data.fecha_fin, data.monto_alquiler, data.monto_condominio || null, data.monto_luz || null, data.observaciones || null, timestamp]
    );

    const result = db.exec('SELECT last_insert_rowid() AS id');
    const contratoId = result[0].values[0][0] as number;

    // Generate cargos_mensuales
    this._generarCargosParaContrato(contratoId, data.fecha_inicio, data.fecha_fin, data.monto_alquiler, data.monto_condominio ?? 0, data.monto_luz ?? 0);
  },

  _generarCargosParaContrato(contratoId: number, fechaInicio: string, fechaFin: string, montoAlquiler: number, montoCondominio: number, montoLuz: number): void {
    const [anioInicio, mesInicio] = fechaInicio.split('-').map(Number);
    const [anioFin, mesFin] = fechaFin.split('-').map(Number);

    let y = anioInicio, m = mesInicio;
    while (y < anioFin || (y === anioFin && m <= mesFin)) {
      const total = montoAlquiler + montoCondominio + montoLuz;
      execute(
        `INSERT OR IGNORE INTO cargos_mensuales (contrato_id, anio, mes, monto_alquiler, monto_condominio, monto_luz, monto_total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [contratoId, y, m, montoAlquiler, montoCondominio || null, montoLuz || null, total]
      );
      m++;
      if (m > 12) { m = 1; y++; }
    }
  },

  cancelContrato(contratoId: number): void {
    const contratos = select<Contrato>('SELECT * FROM contratos WHERE id = ?', [contratoId]);
    if (contratos.length === 0) throw new Error('Contrato no encontrado.');
    const contrato = contratos[0];
    if (contrato.estado !== 'activo') throw new Error('Solo se pueden cancelar contratos activos.');

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // Find cargos to delete: future cargos without payments
    const cargosFuturos = select<any>(
      'SELECT id FROM cargos_mensuales WHERE contrato_id = ? AND (anio > ? OR (anio = ? AND mes > ?))',
      [contratoId, currentYear, currentYear, currentMonth]
    );

    for (const cargo of cargosFuturos) {
      const pagosCargo = select<any>('SELECT COUNT(*) as cnt FROM pagos WHERE cargo_mensual_id = ?', [cargo.id]);
      const hasPagos = pagosCargo[0]?.cnt > 0;
      if (!hasPagos) {
        execute('DELETE FROM cargos_mensuales WHERE id = ?', [cargo.id]);
      }
    }

    execute("UPDATE contratos SET estado = 'cancelado' WHERE id = ?", [contratoId]);
  },

  finalizarContratosVencidos(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const fechaActual = `${year}-${month}`;

    execute(
      "UPDATE contratos SET estado = 'finalizado' WHERE estado = 'activo' AND fecha_fin < ?",
      [fechaActual]
    );
  },

  // ===== CARGOS MENSUALES =====
  getCargosMensuales(filters?: { contratoId?: number }): CargoMensual[] {
    let query = 'SELECT * FROM cargos_mensuales';
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.contratoId) {
      conditions.push('contrato_id = ?');
      params.push(filters.contratoId);
    }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY anio DESC, mes DESC';

    const rows = select<any>(query, params);
    return rows.map(r => this._computeCargoFields(r));
  },

  getCargosPorContrato(contratoId: number): CargoMensual[] {
    return this.getCargosMensuales({ contratoId });
  },

  _computeCargoFields(row: any): CargoMensual {
    const pagosCargo = select<any>('SELECT COALESCE(SUM(monto_usd), 0) as total FROM pagos WHERE cargo_mensual_id = ?', [row.id]);
    const montoPagado = pagosCargo[0]?.total || 0;
    const estado = calcularMorosidad(row.anio, row.mes, row.monto_total, montoPagado);
    return {
      id: row.id,
      contrato_id: row.contrato_id,
      anio: row.anio,
      mes: row.mes,
      monto_alquiler: row.monto_alquiler,
      monto_condominio: row.monto_condominio,
      monto_luz: row.monto_luz,
      monto_total: row.monto_total,
      monto_pagado: montoPagado,
      estado_morosidad: estado,
    };
  },

  // ===== PAGOS =====
  getPagos(filters?: { cargoMensualId?: number }): Pago[] {
    let query = 'SELECT * FROM pagos';
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.cargoMensualId) {
      conditions.push('cargo_mensual_id = ?');
      params.push(filters.cargoMensualId);
    }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY fecha_pago DESC, creado_en DESC';

    return select<Pago>(query, params);
  },

  getSaldoPendiente(cargoMensualId: number): number {
    const cargos = select<any>('SELECT monto_total FROM cargos_mensuales WHERE id = ?', [cargoMensualId]);
    if (cargos.length === 0) return 0;
    const total = cargos[0].monto_total;
    const pagos = select<any>('SELECT COALESCE(SUM(monto_usd), 0) as total FROM pagos WHERE cargo_mensual_id = ?', [cargoMensualId]);
    const pagado = pagos[0]?.total || 0;
    return total - pagado;
  },

  registrarPago(
    cargoMensualId: number,
    fechaPago: string,
    monto_bs: number,
    tasa_cambio: number,
    cuenta: 'juridica' | 'personal'
  ): void {
    if (tasa_cambio <= 0) throw new Error('La tasa de cambio debe ser mayor a 0.');
    if (monto_bs <= 0) throw new Error('El monto en BS debe ser mayor a 0.');

    const monto_usd = monto_bs / tasa_cambio;
    const saldo = this.getSaldoPendiente(cargoMensualId);

    if (monto_usd > saldo) {
      throw new Error(`El pago excede el saldo pendiente. Saldo: $${saldo.toFixed(2)}, pago: $${monto_usd.toFixed(2)}.`);
    }

    const timestamp = new Date().toISOString();

    execute(
      `INSERT INTO pagos (cargo_mensual_id, fecha_pago, monto_bs, tasa_cambio, monto_usd, cuenta, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cargoMensualId, fechaPago, monto_bs, tasa_cambio, monto_usd, cuenta, timestamp]
    );

    // Update last exchange rate
    this.setConfig('ultima_tasa_cambio', tasa_cambio.toString());
  },

  eliminarPago(pagoId: number): void {
    execute('DELETE FROM pagos WHERE id = ?', [pagoId]);
  },

  // ===== EGRESOS =====
  getEgresos(filters?: { fechaInicio?: string; fechaFin?: string }): Egreso[] {
    let query = 'SELECT * FROM egresos';
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.fechaInicio) {
      conditions.push('fecha >= ?');
      params.push(filters.fechaInicio);
    }
    if (filters?.fechaFin) {
      conditions.push('fecha <= ?');
      params.push(filters.fechaFin);
    }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY fecha DESC, id DESC';

    return select<Egreso>(query, params);
  },

  createEgreso(egreso: Omit<Egreso, 'id'>): void {
    execute(
      'INSERT INTO egresos (fecha, monto, moneda, descripcion, categoria) VALUES (?, ?, ?, ?, ?)',
      [egreso.fecha, egreso.monto, egreso.moneda, egreso.descripcion, egreso.categoria || null]
    );
  },

  updateEgreso(egreso: Egreso): void {
    execute(
      'UPDATE egresos SET fecha = ?, monto = ?, moneda = ?, descripcion = ?, categoria = ? WHERE id = ?',
      [egreso.fecha, egreso.monto, egreso.moneda, egreso.descripcion, egreso.categoria || null, egreso.id]
    );
  },

  deleteEgreso(id: number): void {
    execute('DELETE FROM egresos WHERE id = ?', [id]);
  },

  // ===== CONFIG =====
  getConfig(clave: string): string | null {
    const rows = select<ConfigRow>('SELECT valor FROM config WHERE clave = ?', [clave]);
    return rows.length > 0 ? rows[0].valor : null;
  },

  setConfig(clave: string, valor: string): void {
    execute('INSERT OR REPLACE INTO config (clave, valor) VALUES (?, ?)', [clave, valor]);
  },

  // ===== REPORTES =====

  getReporteResumen(fechaInicio: string, fechaFin: string) {
    const ingresos = select<any>(
      `SELECT cuenta, COALESCE(SUM(monto_usd), 0) as total FROM pagos
       WHERE fecha_pago >= ? AND fecha_pago <= ?
       GROUP BY cuenta`,
      [fechaInicio, fechaFin]
    );
    const juridica = ingresos.find((r: any) => r.cuenta === 'juridica')?.total || 0;
    const personal = ingresos.find((r: any) => r.cuenta === 'personal')?.total || 0;

    const egresosUsd = select<any>(
      `SELECT COALESCE(SUM(monto), 0) as total FROM egresos
       WHERE moneda = 'USD' AND fecha >= ? AND fecha <= ?`,
      [fechaInicio, fechaFin]
    )[0]?.total || 0;

    const egresosBs = select<any>(
      `SELECT COALESCE(SUM(monto), 0) as total FROM egresos
       WHERE moneda = 'BS' AND fecha >= ? AND fecha <= ?`,
      [fechaInicio, fechaFin]
    )[0]?.total || 0;

    return {
      ingresos: { juridica, personal, total: juridica + personal },
      egresos: { usd: egresosUsd, bs: egresosBs },
    };
  },

  getMorosos() {
    const cargos = this.getCargosMensuales();
    const contratos = this.getContratos();
    const localesMap = new Map(this.getLocales(false).map((l: any) => [l.id, l]));
    const inquilinosMap = new Map(this.getAllInquilinos().map((i: any) => [i.id, i]));

    const result: any[] = [];
    for (const cargo of cargos) {
      if (cargo.estado_morosidad !== 'atrasado') continue;
      const contrato = contratos.find((c: any) => c.id === cargo.contrato_id);
      if (!contrato || contrato.estado !== 'activo') continue;
      const local = localesMap.get(contrato.local_id);
      const inquilino = inquilinosMap.get(contrato.inquilino_id);
      const saldo = Math.max(0, cargo.monto_total - cargo.monto_pagado);
      const fechaLimite = new Date(cargo.anio, cargo.mes - 1, 5);
      const hoy = new Date();
      const diasAtraso = Math.max(0, Math.floor((hoy.getTime() - fechaLimite.getTime()) / (1000 * 60 * 60 * 24)));
      result.push({
        cargo_id: cargo.id,
        local_nombre: local?.nombre ?? `#${contrato.local_id}`,
        inquilino_nombre: inquilino?.nombre ?? `#${contrato.inquilino_id}`,
        anio: cargo.anio,
        mes: cargo.mes,
        monto_total: cargo.monto_total,
        monto_pagado: cargo.monto_pagado,
        saldo_pendiente: saldo,
        dias_atraso: diasAtraso,
      });
    }
    return result;
  },

  getFichaLocal(localId: number) {
    const locales = this.getLocales(false);
    const local = locales.find((l: any) => l.id === localId);
    if (!local) return null;

    const contratos = this.getContratosPorLocal(localId);
    const inquilinosMap = new Map(this.getAllInquilinos().map((i: any) => [i.id, i]));

    const contratoActivo = contratos.find((c: any) => c.estado === 'activo') || null;
    const historicos = contratos.filter((c: any) => c.estado !== 'activo');

    const buildContratoInfo = (contrato: any) => {
      if (!contrato) return null;
      const cargos = this.getCargosPorContrato(contrato.id);
      const cargoIds = cargos.map((c: any) => c.id);
      const pagos = cargoIds.length > 0
        ? select<any>(
            `SELECT * FROM pagos WHERE cargo_mensual_id IN (${cargoIds.map(() => '?').join(',')}) ORDER BY fecha_pago DESC`,
            cargoIds
          )
        : [];
      const inquilino = inquilinosMap.get(contrato.inquilino_id) || null;
      return { contrato, inquilino, cargos, pagos };
    };

    return {
      local: { ...local, estado: getLocalEstado(localId) },
      contratoActivo: buildContratoInfo(contratoActivo),
      historicos: historicos.map(buildContratoInfo).filter(Boolean),
    };
  },

  getOcupacion() {
    const locales = this.getLocales(false);
    const activos = locales.filter((l: any) => l.activo);
    let ocupados = 0;
    const vacantes: any[] = [];
    for (const l of activos) {
      if (getLocalEstado(l.id) === 'ocupado') {
        ocupados++;
      } else {
        vacantes.push(l);
      }
    }
    return {
      total: activos.length,
      ocupados,
      vacantes: activos.length - ocupados,
      porcentaje: activos.length > 0 ? Math.round((ocupados / activos.length) * 100) : 0,
      listaVacantes: vacantes,
    };
  },

  getProximosVencimientos() {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    const fechaHoy = `${y}-${m}-${d}`;

    const dentro60 = new Date(hoy.getTime() + 60 * 24 * 60 * 60 * 1000);
    const y2 = dentro60.getFullYear();
    const m2 = String(dentro60.getMonth() + 1).padStart(2, '0');
    const d2 = String(dentro60.getDate()).padStart(2, '0');
    const fechaFin = `${y2}-${m2}-${d2}`;

    const contratos = select<any>(
      `SELECT c.* FROM contratos c WHERE c.estado = 'activo' AND c.fecha_fin >= ? AND c.fecha_fin <= ? ORDER BY c.fecha_fin ASC`,
      [fechaHoy, fechaFin]
    );

    const localesMap = new Map(this.getLocales(false).map((l: any) => [l.id, l]));
    const inquilinosMap = new Map(this.getAllInquilinos().map((i: any) => [i.id, i]));

    return contratos.map((c: any) => {
      const [cy, cm] = c.fecha_fin.split('-').map(Number);
      const finDate = new Date(cy, cm - 1);
      const dias = Math.max(0, Math.ceil((finDate.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        contrato_id: c.id,
        local_nombre: localesMap.get(c.local_id)?.nombre ?? `#${c.local_id}`,
        inquilino_nombre: inquilinosMap.get(c.inquilino_id)?.nombre ?? `#${c.inquilino_id}`,
        fecha_fin: c.fecha_fin,
        dias_restantes: dias,
      };
    });
  },
};
