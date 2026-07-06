import { useState } from 'react';
import { Card, Group, Text, Tabs, Stack } from '@mantine/core';
import { IconChartBar, IconUsers, IconHome } from '@tabler/icons-react';
import { ReporteResumen } from './ReporteResumen';
import { ReporteMorosos } from './ReporteMorosos';
import { ReporteFichaLocal } from './ReporteFichaLocal';

export function ReportesModule() {
  const [activeTab, setActiveTab] = useState<string | null>('resumen');

  return (
    <Stack gap="md">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="xl" fw={700}>
              Reportes
            </Text>
            <Text c="dimmed" mt={4}>
              Consulta el resumen financiero, los morosos actuales y la ficha completa por local.
            </Text>
          </div>
        </Group>
      </Card>

      <Tabs value={activeTab} onChange={setActiveTab} keepMounted={false} variant="pills">
        <Tabs.List>
          <Tabs.Tab value="resumen" leftSection={<IconChartBar size={16} />}>
            Resumen financiero
          </Tabs.Tab>
          <Tabs.Tab value="morosos" leftSection={<IconUsers size={16} />}>
            Morosos actuales
          </Tabs.Tab>
          <Tabs.Tab value="ficha" leftSection={<IconHome size={16} />}>
            Ficha por local
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="resumen" pt="md">
          <ReporteResumen />
        </Tabs.Panel>

        <Tabs.Panel value="morosos" pt="md">
          <ReporteMorosos />
        </Tabs.Panel>

        <Tabs.Panel value="ficha" pt="md">
          <ReporteFichaLocal />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}