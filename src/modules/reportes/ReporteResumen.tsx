import { useState } from 'react';
import {
  Card,
  Group,
  Text,
  Table,
  Paper,
  SimpleGrid,
  TextInput,
  Button,
  Divider,
} from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { appService } from '../../services/appService';
import dayjs from 'dayjs';

export function ReporteResumen() {
  const [fechaInicio, setFechaInicio] = useState<string>(
    dayjs().startOf('month').format('YYYY-MM-DD')
  );
  const [fechaFin, setFechaFin] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [reporte, setReporte] = useState(() =>
    appService.getReporteResumen(
      dayjs().startOf('month').format('YYYY-MM-DD'),
      dayjs().format('YYYY-MM-DD')
    )
  );

  const handleGenerar = () => {
    setReporte(appService.getReporteResumen(fechaInicio, fechaFin));
  };

  const netUSD =
    reporte.ingresos.USD.total - reporte.egresos.USD;
  const netBS =
    reporte.ingresos.BS.total - reporte.egresos.BS;

  return (
    <div>
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
        <Text size="md" fw={600} mb="md">
          Rango de Fechas
        </Text>
        <Group align="flex-end" gap="sm">
          <TextInput
            label="Fecha Inicial"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <TextInput
            label="Fecha Final"
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button leftSection={<IconRefresh size={16} />} onClick={handleGenerar}>
            Generar
          </Button>
        </Group>
      </Card>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mb="md">
        {/* Ingresos */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Text size="lg" fw={700} mb="md" c="teal">
            Ingresos (Pagos)
          </Text>
          <Table withColumnBorders withRowBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Moneda</Table.Th>
                <Table.Th ta="right">Jurídica</Table.Th>
                <Table.Th ta="right">Personal</Table.Th>
                <Table.Th ta="right">Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td fw={600}>USD</Table.Td>
                <Table.Td ta="right">${reporte.ingresos.USD.juridica.toFixed(2)}</Table.Td>
                <Table.Td ta="right">${reporte.ingresos.USD.personal.toFixed(2)}</Table.Td>
                <Table.Td ta="right" fw={600}>${reporte.ingresos.USD.total.toFixed(2)}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={600}>BS</Table.Td>
                <Table.Td ta="right">Bs.{reporte.ingresos.BS.juridica.toFixed(2)}</Table.Td>
                <Table.Td ta="right">Bs.{reporte.ingresos.BS.personal.toFixed(2)}</Table.Td>
                <Table.Td ta="right" fw={600}>Bs.{reporte.ingresos.BS.total.toFixed(2)}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Paper>

        {/* Egresos */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Text size="lg" fw={700} mb="md" c="red">
            Egresos
          </Text>
          <Table withColumnBorders withRowBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Moneda</Table.Th>
                <Table.Th ta="right">Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td fw={600}>USD</Table.Td>
                <Table.Td ta="right">${reporte.egresos.USD.toFixed(2)}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={600}>BS</Table.Td>
                <Table.Td ta="right">Bs.{reporte.egresos.BS.toFixed(2)}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Paper>
      </SimpleGrid>

      {/* Neto */}
      <Paper shadow="sm" p="lg" radius="md" withBorder>
        <Text size="lg" fw={700} mb="md">
          Balance Neto (Ingresos − Egresos)
        </Text>
        <Divider mb="md" />
        <Group gap="xl">
          <div>
            <Text size="sm" c="dimmed">USD</Text>
            <Text size="xl" fw={700} c={netUSD >= 0 ? 'teal' : 'red'}>
              ${netUSD.toFixed(2)}
            </Text>
          </div>
          <div>
            <Text size="sm" c="dimmed">BS</Text>
            <Text size="xl" fw={700} c={netBS >= 0 ? 'teal' : 'red'}>
              Bs.{netBS.toFixed(2)}
            </Text>
          </div>
        </Group>
      </Paper>
    </div>
  );
}
