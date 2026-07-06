import {
  Text,
  Table,
  Badge,
  Paper,
  Group,
  Alert,
} from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import { appService } from '../../services/appService';
import { useAppStore } from '../../store/store';

export function ReporteMorosos() {
  // Subscribe to store so list refreshes when payments are registered
  useAppStore((s) => s.pagos);
  useAppStore((s) => s.cargosMensuales);

  const morosos = appService.getMorosos();

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'al_dia':    return 'Al día';
      case 'atrasado':  return 'Atrasado';
      case 'adelantado': return 'Adelantado';
      default: return estado;
    }
  };

  const saldoTotal = morosos.reduce(
    (acc, m) => acc + Math.max(0, m.monto_total - m.monto_pagado),
    0
  );

  return (
    <div>
      {morosos.length === 0 ? (
        <Alert
          icon={<IconCircleCheck size={18} />}
          color="teal"
          title="Sin morosos"
          radius="md"
        >
          No hay locales con cargos atrasados en este momento.
        </Alert>
      ) : (
        <>
          <Group mb="md" gap="lg">
            <Paper p="md" radius="md" withBorder style={{ minWidth: 160 }}>
              <Text size="sm" c="dimmed">Locales con atraso</Text>
              <Text size="xl" fw={700} c="red">{new Set(morosos.map(m => m.local_id)).size}</Text>
            </Paper>
            <Paper p="md" radius="md" withBorder style={{ minWidth: 160 }}>
              <Text size="sm" c="dimmed">Cargos atrasados</Text>
              <Text size="xl" fw={700} c="orange">{morosos.length}</Text>
            </Paper>
            <Paper p="md" radius="md" withBorder style={{ minWidth: 160 }}>
              <Text size="sm" c="dimmed">Saldo pendiente USD</Text>
              <Text size="xl" fw={700} c="red">${saldoTotal.toFixed(2)}</Text>
            </Paper>
          </Group>

          <Paper shadow="sm" radius="md" withBorder>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Local</Table.Th>
                  <Table.Th>Inquilino</Table.Th>
                  <Table.Th>Período</Table.Th>
                  <Table.Th ta="right">Cargo</Table.Th>
                  <Table.Th ta="right">Pagado</Table.Th>
                  <Table.Th ta="right">Pendiente</Table.Th>
                  <Table.Th>Estado</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {morosos.map((m) => {
                  const pendiente = Math.max(0, m.monto_total - m.monto_pagado);
                  return (
                    <Table.Tr key={m.id}>
                      <Table.Td fw={600}>{m.nombreLocal}</Table.Td>
                      <Table.Td>{m.nombreInquilino}</Table.Td>
                      <Table.Td>
                        {m.anio}-{String(m.mes).padStart(2, '0')}
                      </Table.Td>
                      <Table.Td ta="right">${m.monto_total.toFixed(2)}</Table.Td>
                      <Table.Td ta="right" c="teal">${m.monto_pagado.toFixed(2)}</Table.Td>
                      <Table.Td ta="right" c="red" fw={600}>${pendiente.toFixed(2)}</Table.Td>
                      <Table.Td>
                        <Badge color="red" variant="light">
                          {getEstadoLabel(m.estado_morosidad)}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Paper>
        </>
      )}
    </div>
  );
}
