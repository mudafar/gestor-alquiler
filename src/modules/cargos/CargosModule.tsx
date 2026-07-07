import { useState, useMemo } from 'react';
import { Card, Group, Text, Select, Table, Badge } from '@mantine/core';
import { useAppStore } from '../../store/store';

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const estadoColor: Record<string, string> = {
  al_dia: 'green',
  atrasado: 'red',
  adelantado: 'blue',
};

const estadoLabel: Record<string, string> = {
  al_dia: 'Al día',
  atrasado: 'Atrasado',
  adelantado: 'Adelantado',
};

export function CargosModule() {
  const { contratos, locales, inquilinos, cargosMensuales } = useAppStore();
  const [selectedContratoId, setSelectedContratoId] = useState<string>('');

  const contratoOptions = useMemo(
    () =>
      contratos.map((c) => {
        const local = locales.find((l) => l.id === c.local_id);
        const inquilino = inquilinos.find((i) => i.id === c.inquilino_id);
        return {
          value: c.id.toString(),
          label: `${local?.nombre ?? c.local_id} – ${inquilino?.nombre ?? `#${c.inquilino_id}`} (${c.fecha_inicio} a ${c.fecha_fin})`,
        };
      }),
    [contratos, locales, inquilinos]
  );

  const cargos = useMemo(
    () => cargosMensuales.filter((c) => c.contrato_id.toString() === selectedContratoId),
    [cargosMensuales, selectedContratoId]
  );

  const selectedContrato = contratos.find((c) => c.id.toString() === selectedContratoId);

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Text size="xl" fw={700}>
          Cargos Mensuales
        </Text>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
        <Select
          label="Seleccionar Contrato"
          placeholder="Selecciona un contrato"
          data={contratoOptions}
          value={selectedContratoId || null}
          onChange={(v) => setSelectedContratoId(v || '')}
          searchable
          mb="md"
        />

        {selectedContrato && (
          <Text size="sm" c="dimmed" mb="md">
            Contrato: {selectedContrato.fecha_inicio} → {selectedContrato.fecha_fin} —{' '}
            <Badge color={selectedContrato.estado === 'activo' ? 'green' : selectedContrato.estado === 'finalizado' ? 'blue' : 'red'} size="sm">
              {selectedContrato.estado}
            </Badge>
          </Text>
        )}

        {cargos.length === 0 ? (
          <Text c="dimmed" ta="center" py="md">
            {selectedContratoId ? 'No hay cargos para este contrato.' : 'Selecciona un contrato para ver sus cargos.'}
          </Text>
        ) : (
          <Table highlightOnHover>
            <thead>
              <tr>
                <th>Mes</th>
                <th>Año</th>
                <th>Alquiler</th>
                <th>Condominio</th>
                <th>Luz</th>
                <th>Total</th>
                <th>Pagado</th>
                <th>Saldo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {cargos.map((c) => {
                const saldo = c.monto_total - c.monto_pagado;
                return (
                  <tr key={c.id}>
                    <td>{meses[c.mes - 1]}</td>
                    <td>{c.anio}</td>
                    <td>${c.monto_alquiler.toFixed(2)}</td>
                    <td>{c.monto_condominio ? `$${c.monto_condominio.toFixed(2)}` : '-'}</td>
                    <td>{c.monto_luz ? `$${c.monto_luz.toFixed(2)}` : '-'}</td>
                    <td>${c.monto_total.toFixed(2)}</td>
                    <td>${c.monto_pagado.toFixed(2)}</td>
                    <td>${saldo.toFixed(2)}</td>
                    <td>
                      <Badge color={estadoColor[c.estado_morosidad]}>{estadoLabel[c.estado_morosidad]}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}