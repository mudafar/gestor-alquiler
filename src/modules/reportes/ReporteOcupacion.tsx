import { useMemo } from 'react';
import {
  Text,
  Table,
  Paper,
  SimpleGrid,
} from '@mantine/core';
import { appService } from '../../services/appService';
import { useAppStore } from '../../store/store';

export function ReporteOcupacion() {
  useAppStore((s) => s.contratos);
  useAppStore((s) => s.locales);

  const data = useMemo(() => appService.getOcupacion(), []);

  return (
    <div>
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb="md">
        <Paper p="lg" radius="md" withBorder ta="center">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Locales</Text>
          <Text size="xxxl" fw={900}>{data.total}</Text>
        </Paper>
        <Paper p="lg" radius="md" withBorder ta="center">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Ocupados</Text>
          <Text size="xxxl" fw={900} c="teal">{data.ocupados}</Text>
        </Paper>
        <Paper p="lg" radius="md" withBorder ta="center">
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Vacantes</Text>
          <Text size="xxxl" fw={900} c="red">{data.vacantes}</Text>
        </Paper>
      </SimpleGrid>

      <Paper shadow="sm" p="lg" radius="md" withBorder mb="md">
        <Text size="lg" fw={700}>Ocupaci&oacute;n: {data.porcentaje}%</Text>
        <Text size="sm" c="dimmed">{data.ocupados} de {data.total} locales ocupados</Text>
      </Paper>

      {data.listaVacantes.length > 0 && (
        <Paper shadow="sm" radius="md" withBorder>
          <Text fw={700} p="md" pb={0}>Locales Vacantes</Text>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>Nombre</Table.Th>
                <Table.Th>Direcci&oacute;n</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.listaVacantes.map((l: any) => (
                <Table.Tr key={l.id}>
                  <Table.Td>{l.id}</Table.Td>
                  <Table.Td fw={600}>{l.nombre}</Table.Td>
                  <Table.Td>{l.direccion || ''}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </div>
  );
}