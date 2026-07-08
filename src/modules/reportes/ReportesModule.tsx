import { useState } from 'react';
import { Card, Group, Text, Tabs, Stack } from '@mantine/core';
import { IconChartBar, IconUsers, IconHome, IconBuilding, IconCalendarClock } from '@tabler/icons-react';
import { ReporteResumen } from './ReporteResumen';
import { ReporteMorosos } from './ReporteMorosos';
import { ReporteFichaLocal } from './ReporteFichaLocal';
import { ReporteOcupacion } from './ReporteOcupacion';
import { ReporteProximosVencimientos } from './ReporteProximosVencimientos';

export function ReportesModule() {
  const [activeTab, setActiveTab] = useState<string | null>('resumen');

  return (
    <Stack gap="md">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="xl" fw={700}>Reportes</Text>
            <Text c="dimmed" mt={4}>Consulta financiera, morosidad, fichas, ocupaci&oacute;n y vencimientos.</Text>
          </div>
        </Group>
      </Card>

      <Tabs value={activeTab} onChange={setActiveTab} keepMounted={false} variant="pills">
        <Tabs.List>
          <Tabs.Tab value="resumen" leftSection={<IconChartBar size={16} />}>Resumen financiero</Tabs.Tab>
          <Tabs.Tab value="morosos" leftSection={<IconUsers size={16} />}>Morosos actuales</Tabs.Tab>
          <Tabs.Tab value="ficha" leftSection={<IconHome size={16} />}>Ficha por local</Tabs.Tab>
          <Tabs.Tab value="ocupacion" leftSection={<IconBuilding size={16} />}>Ocupaci&oacute;n</Tabs.Tab>
          <Tabs.Tab value="vencimientos" leftSection={<IconCalendarClock size={16} />}>Pr&oacute;ximos vencimientos</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="resumen" pt="md"><ReporteResumen /></Tabs.Panel>
        <Tabs.Panel value="morosos" pt="md"><ReporteMorosos /></Tabs.Panel>
        <Tabs.Panel value="ficha" pt="md"><ReporteFichaLocal /></Tabs.Panel>
        <Tabs.Panel value="ocupacion" pt="md"><ReporteOcupacion /></Tabs.Panel>
        <Tabs.Panel value="vencimientos" pt="md"><ReporteProximosVencimientos /></Tabs.Panel>
      </Tabs>
    </Stack>
  );
}