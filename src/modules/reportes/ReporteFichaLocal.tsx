import { useState } from 'react';
import {
  Select,
  Text,
  Table,
  Badge,
  Paper,
  Group,
  SimpleGrid,
  Divider,
  Alert,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { appService } from '../../services/appService';
import { useAppStore } from '../../store/store';

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'al_dia':     return 'teal';
    case 'atrasado':   return 'red';
    case 'adelantado': return 'blue';
    default:           return 'gray';
  }
};

const getEstadoLabel = (estado: string) => {
  switch (estado) {
    case 'al_dia':     return 'Al día';
    case 'atrasado':   return 'Atrasado';
    case 'adelantado': return 'Adelantado';
    default:           return estado;
  }
};

export function ReporteFichaLocal() {
  const locales = useAppStore((s) => s.locales);
  const [selectedLocalId, setSelectedLocalId] = useState<string | null>(null);

  const ficha = selectedLocalId ? appService.getFichaLocal(selectedLocalId) : null;

  const localesData = locales.map((l) => ({
    value: l.id,
    label: `${l.id} – ${l.nombre} (${l.estado})`,
  }));

  return (
    <div>
      <Paper shadow="sm" p="lg" radius="md" withBorder mb="md">
        <Text size="md" fw={600} mb="md">
          Seleccionar Local
        </Text>
        <Select
          placeholder="Selecciona un local para ver su ficha"
          data={localesData}
          value={selectedLocalId}
          onChange={setSelectedLocalId}
          searchable
          clearable
          style={{ maxWidth: 480 }}
        />
      </Paper>

      {!selectedLocalId && (
        <Alert icon={<IconInfoCircle size={18} />} color="blue" radius="md">
          Selecciona un local para ver su historial completo de cargos, pagos y estado.
        </Alert>
      )}

      {ficha && (
        <>
          {/* Encabezado del local */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="md">
            <Paper p="md" radius="md" withBorder>
              <Text size="xs" c="dimmed">Local</Text>
              <Text fw={700}>{ficha.local.nombre}</Text>
              <Text size="xs" c="dimmed">{ficha.local.id}</Text>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Text size="xs" c="dimmed">Inquilino activo</Text>
              <Text fw={700}>{ficha.inquilino?.nombre ?? '—'}</Text>
              {ficha.inquilino?.telefono && (
                <Text size="xs" c="dimmed">{ficha.inquilino.telefono}</Text>
              )}
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Text size="xs" c="dimmed">Estado</Text>
              <Badge
                color={ficha.local.estado === 'ocupado' ? 'teal' : 'gray'}
                size="lg"
                mt={4}
              >
                {ficha.local.estado === 'ocupado' ? 'Ocupado' : 'Vacante'}
              </Badge>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Text size="xs" c="dimmed">Saldo pendiente USD</Text>
              <Text fw={700} c={ficha.saldoPendienteUSD > 0 ? 'red' : 'teal'} size="xl">
                ${ficha.saldoPendienteUSD.toFixed(2)}
              </Text>
            </Paper>
          </SimpleGrid>

          {/* Monto del local */}
          <Paper shadow="sm" p="md" radius="md" withBorder mb="md">
            <Group gap="xl">
              <div>
                <Text size="xs" c="dimmed">Alquiler</Text>
                <Text fw={600}>${ficha.local.monto_alquiler.toFixed(2)}</Text>
              </div>
              {ficha.local.monto_condominio != null && (
                <div>
                  <Text size="xs" c="dimmed">Condominio</Text>
                  <Text fw={600}>${ficha.local.monto_condominio.toFixed(2)}</Text>
                </div>
              )}
              {ficha.local.monto_luz != null && (
                <div>
                  <Text size="xs" c="dimmed">Luz</Text>
                  <Text fw={600}>${ficha.local.monto_luz.toFixed(2)}</Text>
                </div>
              )}
              <Divider orientation="vertical" />
              <div>
                <Text size="xs" c="dimmed">Total mensual</Text>
                <Text fw={700} size="lg">
                  ${(
                    ficha.local.monto_alquiler +
                    (ficha.local.monto_condominio ?? 0) +
                    (ficha.local.monto_luz ?? 0)
                  ).toFixed(2)}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Total cargado</Text>
                <Text fw={700}>${ficha.totalCargado.toFixed(2)}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Total cobrado USD</Text>
                <Text fw={700} c="teal">${ficha.totalPagadoEnUSD.toFixed(2)}</Text>
              </div>
            </Group>
          </Paper>

          {/* Cargos */}
          <Paper shadow="sm" radius="md" withBorder mb="md">
            <Text fw={700} p="md" pb={0}>
              Historial de Cargos Mensuales
            </Text>
            {ficha.cargos.length === 0 ? (
              <Text c="dimmed" p="md">Sin cargos registrados.</Text>
            ) : (
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Período</Table.Th>
                    <Table.Th ta="right">Total</Table.Th>
                    <Table.Th ta="right">Pagado</Table.Th>
                    <Table.Th ta="right">Pendiente</Table.Th>
                    <Table.Th>Estado</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {ficha.cargos.map((c) => {
                    const pendiente = Math.max(0, c.monto_total - c.monto_pagado);
                    return (
                      <Table.Tr key={c.id}>
                        <Table.Td>
                          {MESES[c.mes - 1]} {c.anio}
                        </Table.Td>
                        <Table.Td ta="right">${c.monto_total.toFixed(2)}</Table.Td>
                        <Table.Td ta="right" c="teal">${c.monto_pagado.toFixed(2)}</Table.Td>
                        <Table.Td ta="right" c={pendiente > 0 ? 'red' : 'teal'}>
                          ${pendiente.toFixed(2)}
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getEstadoColor(c.estado_morosidad)} variant="light">
                            {getEstadoLabel(c.estado_morosidad)}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            )}
          </Paper>

          {/* Pagos */}
          <Paper shadow="sm" radius="md" withBorder>
            <Text fw={700} p="md" pb={0}>
              Historial de Pagos
            </Text>
            {ficha.pagos.length === 0 ? (
              <Text c="dimmed" p="md">Sin pagos registrados.</Text>
            ) : (
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th ta="right">Monto</Table.Th>
                    <Table.Th>Moneda</Table.Th>
                    <Table.Th>Cuenta</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {ficha.pagos.map((p) => (
                    <Table.Tr key={p.id}>
                      <Table.Td>{p.fecha_pago}</Table.Td>
                      <Table.Td ta="right" fw={600}>
                        {p.moneda === 'USD' ? '$' : 'Bs.'}{p.monto.toFixed(2)}
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={p.moneda === 'USD' ? 'blue' : 'orange'}>
                          {p.moneda}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={p.cuenta === 'juridica' ? 'violet' : 'gray'}>
                          {p.cuenta === 'juridica' ? 'Jurídica' : 'Personal'}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        </>
      )}
    </div>
  );
}
