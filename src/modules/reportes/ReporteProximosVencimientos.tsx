import { useMemo } from 'react';
import {
  Text,
  Table,
  Paper,
  Badge,
} from '@mantine/core';
import { appService } from '../../services/appService';
import { useAppStore } from '../../store/store';

export function ReporteProximosVencimientos() {
  useAppStore((s) => s.contratos);

  const data = useMemo(() => appService.getProximosVencimientos(), []);

  if (data.length === 0) {
    return (
      <Paper shadow="sm" p="lg" radius="md" withBorder>
        <Text c="dimmed" ta="center">No hay contratos pr&oacute;ximos a vencer en los pr&oacute;ximos 60 d&iacute;as.</Text>
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" radius="md" withBorder>
      <Text fw={700} p="md" pb={0}>Contratos por vencer (pr&oacute;ximos 60 d&iacute;as)</Text>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Local</Table.Th>
            <Table.Th>Inquilino</Table.Th>
            <Table.Th>Fecha Fin</Table.Th>
            <Table.Th ta="right">D&iacute;as restantes</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((c: any) => (
            <Table.Tr key={c.contrato_id}>
              <Table.Td fw={600}>{c.local_nombre}</Table.Td>
              <Table.Td>{c.inquilino_nombre}</Table.Td>
              <Table.Td>{c.fecha_fin}</Table.Td>
              <Table.Td ta="right">
                <Badge color={c.dias_restantes <= 15 ? 'red' : c.dias_restantes <= 30 ? 'orange' : 'yellow'}>
                  {c.dias_restantes} d&iacute;as
                </Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}