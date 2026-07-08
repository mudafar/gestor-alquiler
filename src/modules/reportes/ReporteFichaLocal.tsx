import { useState, useMemo } from 'react';
import {
  Select,
  Text,
  Table,
  Badge,
  Paper,
  Group,
  SimpleGrid,
  Alert,
  Collapse,
  Button,
} from '@mantine/core';
import { IconInfoCircle, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { appService } from '../../services/appService';
import { useAppStore } from '../../store/store';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dec'];

function CargoTable({ cargos }: { cargos: any[] }) {
  return (
    <Table highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Per&iacute;odo</Table.Th>
          <Table.Th ta="right">Total</Table.Th>
          <Table.Th ta="right">Pagado</Table.Th>
          <Table.Th ta="right">Pendiente</Table.Th>
          <Table.Th>Estado</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {cargos.map((c: any) => {
          const saldo = Math.max(0, c.monto_total - c.monto_pagado);
          const estadoColor = c.estado_morosidad === 'al_dia' ? 'teal' : c.estado_morosidad === 'atrasado' ? 'red' : 'blue';
          const estadoLabel = c.estado_morosidad === 'al_dia' ? 'Al d&iacute;a' : c.estado_morosidad === 'atrasado' ? 'Atrasado' : 'Adelantado';
          return (
            <Table.Tr key={c.id}>
              <Table.Td>{MESES[c.mes - 1]} {c.anio}</Table.Td>
              <Table.Td ta="right">${c.monto_total.toFixed(2)}</Table.Td>
              <Table.Td ta="right" c="teal">${c.monto_pagado.toFixed(2)}</Table.Td>
              <Table.Td ta="right" c={saldo > 0 ? 'red' : 'teal'} fw={600}>${saldo.toFixed(2)}</Table.Td>
              <Table.Td><Badge color={estadoColor} variant="light">{estadoLabel}</Badge></Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}

export function ReporteFichaLocal() {
  const locales = useAppStore((s) => s.locales);
  const [selectedLocalId, setSelectedLocalId] = useState<number | null>(null);
  const [showHistoricos, setShowHistoricos] = useState(false);

  const ficha = selectedLocalId ? appService.getFichaLocal(selectedLocalId) : null;

  const localesData = useMemo(() =>
    locales.map((l) => ({ value: l.id, label: l.nombre })),
    [locales]
  );

  return (
    <div>
      <Paper shadow="sm" p="lg" radius="md" withBorder mb="md">
        <Text size="md" fw={600} mb="md">Seleccionar Local</Text>
        <Select placeholder="Selecciona un local" data={localesData}
          value={selectedLocalId} onChange={(v) => { setSelectedLocalId(v); setShowHistoricos(false); }}
          searchable clearable style={{ maxWidth: 480 }} />
      </Paper>

      {!selectedLocalId && (
        <Alert icon={<IconInfoCircle size={18} />} color="blue" radius="md">
          Selecciona un local para ver su ficha completa.
        </Alert>
      )}

      {ficha && (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="md">
            <Paper p="md" radius="md" withBorder>
              <Text size="xs" c="dimmed">Local</Text>
              <Text fw={700}>#{ficha.local.id} {ficha.local.nombre}</Text>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Text size="xs" c="dimmed">Estado</Text>
              <Badge color={ficha.local.estado === 'ocupado' ? 'teal' : 'gray'} size="lg" mt={4}>
                {ficha.local.estado === 'ocupado' ? 'Ocupado' : 'Vacante'}
              </Badge>
            </Paper>
          </SimpleGrid>

          {ficha.contratoActivo && (
            <Paper shadow="sm" radius="md" withBorder mb="md" p="md">
              <Text fw={700} mb="sm">Contrato Activo</Text>
              <Group mb="sm" gap="xl">
                <div><Text size="xs" c="dimmed">Inquilino</Text><Text fw={600}>{ficha.contratoActivo.inquilino?.nombre ?? '&mdash;'}</Text></div>
                <div><Text size="xs" c="dimmed">Inicio</Text><Text>{ficha.contratoActivo.contrato.fecha_inicio}</Text></div>
                <div><Text size="xs" c="dimmed">Fin</Text><Text>{ficha.contratoActivo.contrato.fecha_fin}</Text></div>
                <div><Text size="xs" c="dimmed">Alquiler</Text><Text>${ficha.contratoActivo.contrato.monto_alquiler.toFixed(2)}</Text></div>
              </Group>
              <CargoTable cargos={ficha.contratoActivo.cargos} />
              {ficha.contratoActivo.pagos.length > 0 && (
                <>
                  <Text fw={600} mt="md" mb="xs">Pagos</Text>
                  <Table highlightOnHover>
                    <Table.Thead><Table.Tr>
                      <Table.Th>Fecha</Table.Th><Table.Th>BS</Table.Th><Table.Th>Tasa</Table.Th><Table.Th ta="right">USD</Table.Th><Table.Th>Cuenta</Table.Th>
                    </Table.Tr></Table.Thead>
                    <Table.Tbody>
                      {ficha.contratoActivo.pagos.map((p: any) => (
                        <Table.Tr key={p.id}>
                          <Table.Td>{p.fecha_pago}</Table.Td>
                          <Table.Td>{p.monto_bs.toFixed(2)}</Table.Td>
                          <Table.Td>{p.tasa_cambio.toFixed(2)}</Table.Td>
                          <Table.Td ta="right" fw={600}>${p.monto_usd.toFixed(2)}</Table.Td>
                          <Table.Td><Badge variant="light" color={p.cuenta === 'juridica' ? 'violet' : 'gray'}>{p.cuenta === 'juridica' ? 'Jur&iacute;dica' : 'Personal'}</Badge></Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </>
              )}
            </Paper>
          )}

          {ficha.historicos.length > 0 && (
            <Paper shadow="sm" radius="md" withBorder>
              <Button variant="subtle" fullWidth onClick={() => setShowHistoricos(!showHistoricos)}
                rightSection={showHistoricos ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}>
                Contratos hist&oacute;ricos ({ficha.historicos.length})
              </Button>
              <Collapse in={showHistoricos}>
                {ficha.historicos.map((h: any) => (
                  <div key={h.contrato.id} style={{ borderTop: '1px solid var(--mantine-color-gray-3)', padding: 'var(--mantine-spacing-md)' }}>
                    <Group mb="xs" gap="xl">
                      <Badge color={h.contrato.estado === 'finalizado' ? 'blue' : 'red'}>{h.contrato.estado}</Badge>
                      <div><Text size="xs" c="dimmed">Inquilino</Text><Text fw={600}>{h.inquilino?.nombre ?? '&mdash;'}</Text></div>
                      <div><Text size="xs" c="dimmed">Inicio</Text><Text>{h.contrato.fecha_inicio}</Text></div>
                      <div><Text size="xs" c="dimmed">Fin</Text><Text>{h.contrato.fecha_fin}</Text></div>
                    </Group>
                    <CargoTable cargos={h.cargos} />
                    {h.pagos.length > 0 && (
                      <>
                        <Text fw={600} mt="md" mb="xs">Pagos</Text>
                        <Table highlightOnHover>
                          <Table.Thead><Table.Tr>
                            <Table.Th>Fecha</Table.Th><Table.Th>BS</Table.Th><Table.Th>Tasa</Table.Th><Table.Th ta="right">USD</Table.Th><Table.Th>Cuenta</Table.Th>
                          </Table.Tr></Table.Thead>
                          <Table.Tbody>
                            {h.pagos.map((p: any) => (
                              <Table.Tr key={p.id}>
                                <Table.Td>{p.fecha_pago}</Table.Td>
                                <Table.Td>{p.monto_bs.toFixed(2)}</Table.Td>
                                <Table.Td>{p.tasa_cambio.toFixed(2)}</Table.Td>
                                <Table.Td ta="right" fw={600}>${p.monto_usd.toFixed(2)}</Table.Td>
                                <Table.Td><Badge variant="light" color={p.cuenta === 'juridica' ? 'violet' : 'gray'}>{p.cuenta === 'juridica' ? 'Jur&iacute;dica' : 'Personal'}</Badge></Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </>
                    )}
                  </div>
                ))}
              </Collapse>
            </Paper>
          )}
        </>
      )}
    </div>
  );
}
