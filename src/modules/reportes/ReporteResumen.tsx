import { useState } from 'react';
import {
  Card,
  Group,
  Text,
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
  const [fechaInicio, setFechaInicio] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [fechaFin, setFechaFin] = useState(dayjs().format('YYYY-MM-DD'));
  const [reporte, setReporte] = useState(() => appService.getReporteResumen(
    dayjs().startOf('month').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')
  ));

  const handleGenerar = () => setReporte(appService.getReporteResumen(fechaInicio, fechaFin));

  const { ingresos, egresos } = reporte;
  const netoUSD = ingresos.total - egresos.usd;

  return (
    <div>
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
        <Text size="md" fw={600} mb="md">Rango de Fechas</Text>
        <Group align="flex-end" gap="sm">
          <TextInput label="Fecha Inicial" type="date" value={fechaInicio}
            onChange={(e) => setFechaInicio(e.currentTarget.value)} style={{ flex: 1 }} />
          <TextInput label="Fecha Final" type="date" value={fechaFin}
            onChange={(e) => setFechaFin(e.currentTarget.value)} style={{ flex: 1 }} />
          <Button leftSection={<IconRefresh size={16} />} onClick={handleGenerar}>Generar</Button>
        </Group>
      </Card>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mb="md">
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Text size="lg" fw={700} mb="md" c="teal">Ingresos (Pagos)</Text>
          <Group mb="xs">
            <div style={{ flex: 1 }}><Text size="sm" c="dimmed">Jur&iacute;dica</Text><Text fw={700}>${ingresos.juridica.toFixed(2)}</Text></div>
            <div style={{ flex: 1 }}><Text size="sm" c="dimmed">Personal</Text><Text fw={700}>${ingresos.personal.toFixed(2)}</Text></div>
            <div style={{ flex: 1 }}><Text size="sm" c="dimmed">Total</Text><Text fw={700} size="lg">${ingresos.total.toFixed(2)}</Text></div>
          </Group>
        </Paper>

        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Text size="lg" fw={700} mb="md" c="red">Egresos</Text>
          <Group mb="xs">
            <div style={{ flex: 1 }}><Text size="sm" c="dimmed">USD</Text><Text fw={700}>${egresos.usd.toFixed(2)}</Text></div>
            <div style={{ flex: 1 }}><Text size="sm" c="dimmed">BS</Text><Text fw={700}>Bs.{egresos.bs.toFixed(2)}</Text></div>
          </Group>
        </Paper>
      </SimpleGrid>

      <Paper shadow="sm" p="lg" radius="md" withBorder>
        <Text size="lg" fw={700} mb="md">Balance Neto (Ingresos − Egresos USD)</Text>
        <Divider mb="md" />
        <Text size="xl" fw={700} c={netoUSD >= 0 ? 'teal' : 'red'}>${netoUSD.toFixed(2)} USD</Text>
        {egresos.bs > 0 && <Text size="sm" c="dimmed" mt={4}>(+ Bs.{egresos.bs.toFixed(2)} en egresos en BS)</Text>}
      </Paper>
    </div>
  );
}
