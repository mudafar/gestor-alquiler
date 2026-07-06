import { useState } from 'react';
import { 
  Button, 
  Card, 
  Group, 
  Text, 
  Select
} from '@mantine/core';
import { useAppStore } from '../../store/store';
import { notifications } from '@mantine/notifications';

export function CargosModule() {
  const { locales, generarCargoMensual, generarCargosParaMes } = useAppStore();
  const [selectedAnio, setSelectedAnio] = useState<number>(new Date().getFullYear());
  const [selectedMes, setSelectedMes] = useState<number>(new Date().getMonth() + 1);
  const [selectedLocal, setSelectedLocal] = useState<string>('');

  const handleGenerateSingle = () => {
    if (selectedLocal) {
      generarCargoMensual(selectedLocal, selectedAnio, selectedMes);
      notifications.show({
        title: 'Cargo generado',
        message: `Se ha generado el cargo para ${selectedLocal} (${selectedAnio}-${selectedMes}).`,
        color: 'green',
      });
    }
  };

  const handleGenerateAll = () => {
    const nuevosCargos = generarCargosParaMes(selectedAnio, selectedMes);
    notifications.show({
      title: 'Cargos generados',
      message: `Se generaron ${nuevosCargos} cargos mensuales para ${selectedAnio}-${selectedMes}.`,
      color: 'green',
    });
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Text size="xl" fw={700}>Gestión de Cargos Mensuales</Text>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
        <Text size="lg" fw={700} mb="md">Generar Cargos</Text>
        <Group grow>
          <Select
            label="Año"
            placeholder="Seleccionar año"
            data={Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => ({
              value: y.toString(),
              label: y.toString()
            }))}
            value={selectedAnio.toString()}
            onChange={(value) => setSelectedAnio(parseInt(value || '0'))}
          />
          
          <Select
            label="Mes"
            placeholder="Seleccionar mes"
            data={[
              { value: '1', label: 'Enero' },
              { value: '2', label: 'Febrero' },
              { value: '3', label: 'Marzo' },
              { value: '4', label: 'Abril' },
              { value: '5', label: 'Mayo' },
              { value: '6', label: 'Junio' },
              { value: '7', label: 'Julio' },
              { value: '8', label: 'Agosto' },
              { value: '9', label: 'Septiembre' },
              { value: '10', label: 'Octubre' },
              { value: '11', label: 'Noviembre' },
              { value: '12', label: 'Diciembre' },
            ]}
            value={selectedMes.toString()}
            onChange={(value) => setSelectedMes(parseInt(value || '0'))}
          />
          
          <Select
            label="Local (Opcional)"
            placeholder="Seleccionar local"
            data={locales.filter(l => l.estado === 'ocupado').map(l => ({
              value: l.id,
              label: `${l.id} - ${l.nombre}`
            }))}
            value={selectedLocal}
            onChange={(value) => setSelectedLocal(value || '')}
          />
        </Group>
        
        <Group mt="md">
          <Button onClick={handleGenerateSingle} disabled={!selectedLocal}>
            Generar Cargo para Local Seleccionado
          </Button>
          <Button onClick={handleGenerateAll} variant="outline">
            Generar Cargos para Todos los Locales
          </Button>
        </Group>
      </Card>
    </div>
  );
}