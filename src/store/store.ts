import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  type Local,
  type Inquilino,
  type Contrato,
  type CargoMensual,
  type Pago,
  type Egreso,
  appService,
} from '../services/appService';
import { initDatabase, exportDatabase } from '../services/db';
import { saveToIndexedDB, loadFromIndexedDB, clearIndexedDB } from '../services/persistence';

interface AppState {
  locales: Local[];
  inquilinos: Inquilino[];
  contratos: Contrato[];
  cargosMensuales: CargoMensual[];
  pagos: Pago[];
  egresos: Egreso[];
  dbInitialized: boolean;
}

interface AppActions {
  initializeDb: (dbBytes?: Uint8Array) => Promise<void>;
  exportDbToFile: () => void;
  clearDb: () => Promise<void>;
  loadAllData: () => void;
  persistDb: () => Promise<void>;

  // Locales
  createLocal: (local: Omit<Local, 'id' | 'activo'>) => void;
  updateLocal: (local: Local) => void;
  deleteLocal: (id: number) => void;

  // Inquilinos
  createInquilino: (nombre: string, cedula?: string) => void;
  updateInquilino: (id: number, nombre: string, cedula?: string) => void;
  deleteInquilino: (id: number) => void;

  // Contratos
  createContrato: (data: {
    local_id: number;
    inquilino_id: number;
    fecha_inicio: string;
    fecha_fin: string;
    monto_alquiler: number;
    monto_condominio?: number | null;
    monto_luz?: number | null;
    observaciones?: string;
  }) => void;
  cancelContrato: (contratoId: number) => void;

  // Pagos
  registrarPago: (cargoMensualId: number, fechaPago: string, monto_bs: number, tasa_cambio: number, cuenta: 'juridica' | 'personal') => void;
  eliminarPago: (pagoId: number) => void;

  // Egresos
  createEgreso: (egreso: Omit<Egreso, 'id'>) => void;
  updateEgreso: (egreso: Egreso) => void;
  deleteEgreso: (id: number) => void;
}

export const useAppStore = create<AppState & AppActions>()(
  immer(
    (set, get) => ({
      locales: [],
      inquilinos: [],
      contratos: [],
      cargosMensuales: [],
      pagos: [],
      egresos: [],
      dbInitialized: false,

      initializeDb: async (dbBytes) => {
        if (dbBytes) {
          await initDatabase(dbBytes);
          await saveToIndexedDB();
        } else {
          const saved = await loadFromIndexedDB();
          await initDatabase(saved ?? undefined);
        }
        appService.finalizarContratosVencidos();
        set({ dbInitialized: true });
        get().loadAllData();
      },

      exportDbToFile: () => {
        const bytes = exportDatabase();
        const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alquiler-db-${new Date().toISOString().slice(0, 10)}.db`;
        a.click();
        URL.revokeObjectURL(url);
      },

      clearDb: async () => {
        await clearIndexedDB();
        await get().initializeDb();
      },

      persistDb: async () => {
        await saveToIndexedDB();
      },

      loadAllData: () => {
        set((state) => {
          state.locales = appService.getLocales(true);
          state.inquilinos = appService.getInquilinosActivos();
          state.contratos = appService.getContratos();
          state.cargosMensuales = appService.getCargosMensuales();
          state.pagos = appService.getPagos();
          state.egresos = appService.getEgresos();
        });
      },

      // Locales
      createLocal: (local) => {
        appService.createLocal(local);
        get().loadAllData();
        get().persistDb();
      },
      updateLocal: (local) => {
        appService.updateLocal(local);
        get().loadAllData();
        get().persistDb();
      },
      deleteLocal: (id) => {
        appService.deleteLocal(id);
        get().loadAllData();
        get().persistDb();
      },

      // Inquilinos
      createInquilino: (nombre, cedula) => {
        appService.createInquilino(nombre, cedula);
        get().loadAllData();
        get().persistDb();
      },
      updateInquilino: (id, nombre, cedula) => {
        appService.updateInquilino(id, nombre, cedula);
        get().loadAllData();
        get().persistDb();
      },
      deleteInquilino: (id) => {
        appService.deleteInquilino(id);
        get().loadAllData();
        get().persistDb();
      },

      // Contratos
      createContrato: (data) => {
        appService.createContrato(data);
        get().loadAllData();
        get().persistDb();
      },
      cancelContrato: (contratoId) => {
        appService.cancelContrato(contratoId);
        get().loadAllData();
        get().persistDb();
      },

      // Pagos
      registrarPago: (cargoMensualId, fechaPago, monto_bs, tasa_cambio, cuenta) => {
        appService.registrarPago(cargoMensualId, fechaPago, monto_bs, tasa_cambio, cuenta);
        get().loadAllData();
        get().persistDb();
      },
      eliminarPago: (pagoId) => {
        appService.eliminarPago(pagoId);
        get().loadAllData();
        get().persistDb();
      },

      // Egresos
      createEgreso: (egreso) => {
        appService.createEgreso(egreso);
        get().loadAllData();
        get().persistDb();
      },
      updateEgreso: (egreso) => {
        appService.updateEgreso(egreso);
        get().loadAllData();
        get().persistDb();
      },
      deleteEgreso: (id) => {
        appService.deleteEgreso(id);
        get().loadAllData();
        get().persistDb();
      },
    })
  )
);
