import { useMemo } from 'react';
import {
  Text,
  Table,
  Paper,
  Group,
  Alert,
  Badge,
} from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import { appService } from '../../services/appService';
import { useAppStore } from '../../store/store';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export function ReporteMorosos() {
  useAppStore((s) => s.pagos);
  useAppStore((s) => s.cargosMensuales);

  const morosos = useMemo(() => appService.getMorosos(), []);
  const saldoTotal = morosos.reduce((acc: number, m: any) => acc + m.saldo_pendiente, 0);

  if (morosos.length === 0) {
    return (
      <Alert icon={<IconCircleCheck size={18} />} color="teal" title="Sin morosos" radius="md">
        No hay locales con cargos atrasados en este momento.
      </Alert>
    );
  }

  return (
    <div>
      <Group mb="md" gap="lg">
        <Paper p="md" radius="md" withBorder style={{ minWidth: 160 }}>
          <Text size="sm" c="dimmed">Cargos atrasados</Text>
          <Text size="xl" fw={700} c="red">{morosos.length}</Text>
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
              <Table.Th>Per&iacute;odo</Table.Th>
              <Table.Th ta="right">Total</Table.Th>
              <Table.Th ta="right">Pagado</Table.Th>
              <Table.Th ta="right">Pendiente</Table.Th>
              <Table.Th ta="right">D&iacute;as atraso</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {morosos.map((m: any) => (
              <Table.Tr key={m.cargo_id}>
                <Table.Td fw={600}>{m.local_nombre}</Table.Td>
                <Table.Td>{m.inquilino_nombre}</Table.Td>
                <Table.Td>{MESES[m.mes - 1]} {m.anio}</Table.Td>
                <Table.Td ta="right">${m.monto_total.toFixed(2)}</Table.Td>
                <Table.Td ta="right" c="teal">${m.monto_pagado.toFixed(2)}</Table.Td>
                <Table.Td ta="right" c="red" fw={600}>${m.saldo_pendiente.toFixed(2)}</Table.Td>
                <Table.Td ta="right"><Badge color="red" variant="light">{m.dias_atraso}d</Badge></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </div>
  );
}
