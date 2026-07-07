import { useState, useMemo } from 'react';
import {
  NumberInput,
  Button,
  Card,
  Group,
  Text,
  Select,
  TextInput,
  Table,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAppStore } from '../../store/store';
import { appService } from '../../services/appService';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';

interface PagoFormData {
  contrato_id: string;
  cargo_mensual_id: number;
  fecha_pago: string;
  monto_bs: number;
  tasa_cambio: number;
  cuenta: 'juridica' | 'personal';
}

export function PagosModule() {
  const { contratos, locales, inquilinos, cargosMensuales, pagos, registrarPago, eliminarPago } = useAppStore();
  const [verHistorial, setVerHistorial] = useState(false);

  const ultimaTasa = useMemo(() => {
    const val = appService.getConfig('ultima_tasa_cambio');
    return val ? parseFloat(val) : 0;
  }, []);

  const form = useForm<PagoFormData>({
    initialValues: {
      contrato_id: '',
      cargo_mensual_id: 0,
      fecha_pago: dayjs().format('YYYY-MM-DD'),
      monto_bs: 0,
      tasa_cambio: ultimaTasa || 0,
      cuenta: 'juridica',
    },
    validate: {
      contrato_id: (v) => (v ? null : 'Selecciona un contrato'),
      cargo_mensual_id: (v) => (v > 0 ? null : 'Selecciona un cargo'),
      monto_bs: (v) => (v > 0 ? null : 'El monto en BS debe ser mayor a 0'),
      tasa_cambio: (v) => (v > 0 ? null : 'La tasa de cambio debe ser mayor a 0'),
    },
  });

  const contratoOptions = useMemo(
    () =>
      contratos.map((c) => {
        const local = locales.find((l) => l.id === c.local_id);
        const inquilino = inquilinos.find((i) => i.id === c.inquilino_id);
        return { value: c.id.toString(), label: `${local?.nombre ?? c.local_id} – ${inquilino?.nombre ?? `#${c.inquilino_id}`} (${c.fecha_inicio} a ${c.fecha_fin})` };
      }),
    [contratos, locales, inquilinos]
  );

  const cargosDelContrato = useMemo(
    () => cargosMensuales.filter((c) => c.contrato_id.toString() === form.values.contrato_id),
    [cargosMensuales, form.values.contrato_id]
  );

  const montoUsdCalculado = form.values.monto_bs > 0 && form.values.tasa_cambio > 0 ? form.values.monto_bs / form.values.tasa_cambio : 0;

  const cargoOptions = useMemo(
    () =>
      cargosDelContrato.map((c) => {
        const saldo = c.monto_total - c.monto_pagado;
        return {
          value: c.id.toString(),
          label: `${c.anio}-${String(c.mes).padStart(2, '0')} — Total: $${c.monto_total.toFixed(2)} — Saldo: $${saldo.toFixed(2)}`,
        };
      }),
    [cargosDelContrato]
  );

  const handleSubmit = (values: PagoFormData) => {
    try {
      registrarPago(values.cargo_mensual_id, values.fecha_pago, values.monto_bs, values.tasa_cambio, values.cuenta);
      notifications({ title: 'Pago registrado', message: `Pago de Bs. ${values.monto_bs.toFixed(2)} registrado.`, color: 'green' });
      form.reset();
      form.setValues({
        contrato_id: '',
        cargo_mensual_id: 0,
        fecha_pago: dayjs().format('YYYY-MM-DD'),
        monto_bs: 0,
        tasa_cambio: ultimaTasa || 0,
        cuenta: 'juridica',
      });
    } catch (e: any) {
      notifications({ title: 'Error', message: e.message, color: 'red' });
    }
  };

  // Build pago history with contrato/cargo info
  const pagoRows = useMemo(() => {
    return pagos.map((p) => {
      const cargo = cargosMensuales.find((c) => c.id === p.cargo_mensual_id);
      const contrato = cargo ? contratos.find((c) => c.id === cargo.contrato_id) : null;
      const local = contrato ? locales.find((l) => l.id === contrato.local_id) : null;
      return {
        ...p,
        cargoLabel: cargo ? `${cargo.anio}-${String(cargo.mes).padStart(2, '0')}` : '-',
        localNombre: local?.nombre ?? '-',
      };
    });
  }, [pagos, cargosMensuales, contratos, locales]);

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Text size="xl" fw={700}>
          Registro de Pagos
        </Text>
        <Button variant={verHistorial ? 'filled' : 'outline'} onClick={() => setVerHistorial(!verHistorial)}>
          {verHistorial ? 'Nuevo Pago' : 'Ver Historial'}
        </Button>
      </Group>

      {!verHistorial ? (
        <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
          <Text size="lg" fw={700} mb="md">
            Registrar Nuevo Pago
          </Text>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Select
              label="Contrato"
              placeholder="Seleccionar contrato"
              data={contratoOptions}
              searchable
              value={form.values.contrato_id || null}
              error={form.errors.contrato_id}
              onChange={(v) => {
                form.setValues((prev) => ({ ...prev, contrato_id: v || '', cargo_mensual_id: 0 }));
              }}
            />

            <Select
              label="Cargo Mensual"
              placeholder="Seleccionar cargo"
              data={cargoOptions}
              value={form.values.cargo_mensual_id > 0 ? form.values.cargo_mensual_id.toString() : null}
              error={form.errors.cargo_mensual_id}
              disabled={!form.values.contrato_id}
              onChange={(v) => form.setFieldValue('cargo_mensual_id', v ? parseInt(v, 10) : 0)}
            />

            <TextInput label="Fecha de Pago" placeholder="YYYY-MM-DD" {...form.getInputProps('fecha_pago')} />

            <NumberInput label="Monto en Bolívares (BS)" placeholder="Monto en BS" decimalScale={2} {...form.getInputProps('monto_bs')} />

            <NumberInput label="Tasa de Cambio (BS/USD)" placeholder="Tasa de cambio" decimalScale={2} {...form.getInputProps('tasa_cambio')} />

            {montoUsdCalculado > 0 && (
              <Text size="sm" c="blue" mt={4}>
                Equivalente en USD: <strong>${montoUsdCalculado.toFixed(2)}</strong>
              </Text>
            )}

            <Select
              label="Cuenta"
              placeholder="Seleccionar cuenta"
              data={[
                { value: 'juridica', label: 'Jurídica' },
                { value: 'personal', label: 'Personal' },
              ]}
              {...form.getInputProps('cuenta')}
            />

            <Group justify="flex-end" mt="md">
              <Button type="submit">Registrar Pago</Button>
            </Group>
          </form>
        </Card>
      ) : (
        <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
          <Text size="lg" fw={700} mb="md">
            Historial de Pagos
          </Text>
          <Table highlightOnHover>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Local</th>
                <th>Cargo</th>
                <th>BS</th>
                <th>Tasa</th>
                <th>USD</th>
                <th>Cuenta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagoRows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'gray' }}>
                    No hay pagos registrados
                  </td>
                </tr>
              ) : (
                pagoRows.map((p) => (
                  <tr key={p.id}>
                    <td>{p.fecha_pago}</td>
                    <td>{p.localNombre}</td>
                    <td>{p.cargoLabel}</td>
                    <td>{p.monto_bs.toFixed(2)}</td>
                    <td>{p.tasa_cambio.toFixed(2)}</td>
                    <td>${p.monto_usd.toFixed(2)}</td>
                    <td>{p.cuenta === 'juridica' ? 'Jurídica' : 'Personal'}</td>
                    <td>
                      <Button
                        variant="subtle"
                        color="red"
                        size="compact-xs"
                        title="Eliminar pago"
                        onClick={() => {
                          eliminarPago(p.id);
                          notifications({ title: 'Pago eliminado', message: 'El pago ha sido eliminado.', color: 'orange' });
                        }}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}