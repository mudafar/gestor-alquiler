import { useState } from 'react';
import { 
  TextInput, 
  NumberInput, 
  Button, 
  Card, 
  Group, 
  Text, 
  Table, 
  ActionIcon, 
  Modal, 
  Box,
  Select,
  Alert
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconTrash, IconPencil, IconPlus, IconX } from '@tabler/icons-react';
import { useAppStore } from '../../store/store';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { type Egreso } from '../../services/appService';

interface EgresoFormData {
  fecha: string;
  monto: number;
  moneda: 'USD' | 'BS';
  descripcion: string;
  categoria?: string;
}

export function EgresosModule() {
  const { egresos, createEgreso, updateEgreso, deleteEgreso } = useAppStore();
  const [modalOpened, setModalOpened] = useState(false);
  const [editingEgreso, setEditingEgreso] = useState<Egreso | null>(null);
  const [deletingEgresoId, setDeletingEgresoId] = useState<number | null>(null);
  
  const form = useForm<EgresoFormData>({
    initialValues: {
      fecha: dayjs().format('YYYY-MM-DD'),
      monto: 0,
      moneda: 'USD',
      descripcion: '',
      categoria: '',
    },
    validate: {
      monto: (value) => (value > 0 ? null : 'El monto debe ser mayor a 0'),
      descripcion: (value) => (value.trim() ? null : 'La descripción es requerida'),
    },
  });

  const handleSubmit = (values: EgresoFormData) => {
    if (editingEgreso) {
      // Update existing egreso - we need to pass the id from editingEgreso
      // Since EgresoFormData doesn't have id, we'll create a new object with all values plus id
      const egresoToUpdate = {
        ...values,
        id: editingEgreso.id,
      } as Egreso;
      updateEgreso(egresoToUpdate);
      notifications.show({
        title: 'Egreso actualizado',
        message: `El egreso ha sido actualizado.`,
        color: 'green',
      });
    } else {
      // Create new egreso
      createEgreso(values);
      notifications.show({
        title: 'Egreso creado',
        message: `El egreso ha sido creado.`,
        color: 'green',
      });
    }
    form.reset();
    setModalOpened(false);
    setEditingEgreso(null);
  };

  const handleEdit = (egreso: Egreso) => {
    form.setValues({ fecha: egreso.fecha, monto: egreso.monto, moneda: egreso.moneda, descripcion: egreso.descripcion, categoria: egreso.categoria });
    setEditingEgreso(egreso);
    setModalOpened(true);
  };

  const handleDelete = (id: number) => {
    setDeletingEgresoId(id);
  };

  const confirmDelete = () => {
    if (deletingEgresoId) {
      deleteEgreso(deletingEgresoId);
      notifications.show({
        title: 'Egreso eliminado',
        message: `El egreso ha sido eliminado.`,
        color: 'green',
      });
      setDeletingEgresoId(null);
    }
  };

  const cancelDelete = () => {
    setDeletingEgresoId(null);
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Text size="xl" fw={700}>Registro de Egresos</Text>
        <Button 
          leftSection={<IconPlus size={18} />} 
          onClick={() => {
            form.reset();
            setEditingEgreso(null);
            setModalOpened(true);
          }}
        >
          Nuevo Egreso
        </Button>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
        <Text size="lg" fw={700} mb="md">Lista de Egresos</Text>
        <Table highlightOnHover>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Monto</th>
              <th>Moneda</th>
              <th>Categoría</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {egresos.map((egreso) => (
              <tr key={egreso.id}>
                <td>{egreso.fecha}</td>
                <td>{egreso.descripcion}</td>
                <td>${egreso.monto.toFixed(2)}</td>
                <td>{egreso.moneda}</td>
                <td>{egreso.categoria || '-'}</td>
                <td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      title="Editar"
                      onClick={() => handleEdit(egreso)}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      title="Eliminar"
                      onClick={() => handleDelete(egreso.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal 
        opened={modalOpened} 
        onClose={() => setModalOpened(false)} 
        title={editingEgreso ? "Editar Egreso" : "Registrar Nuevo Egreso"}
      >
        <Box mx="auto">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              label="Fecha"
              placeholder="YYYY-MM-DD"
              {...form.getInputProps('fecha')}
            />
            
            <TextInput
              label="Descripción"
              placeholder="Descripción del egreso"
              {...form.getInputProps('descripcion')}
            />
            
            <NumberInput
              label="Monto"
              placeholder="Monto del egreso"
              decimalScale={2}
              {...form.getInputProps('monto')}
            />
            
            <Select
              label="Moneda"
              placeholder="Seleccionar moneda"
              data={[
                { value: 'USD', label: 'USD' },
                { value: 'BS', label: 'BS' },
              ]}
              {...form.getInputProps('moneda')}
            />
            
            <TextInput
              label="Categoría (Opcional)"
              placeholder="Categoría del egreso"
              {...form.getInputProps('categoria')}
            />
            
            <Group justify="flex-end" mt="md">
              <Button 
                variant="default" 
                onClick={() => setModalOpened(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingEgreso ? "Actualizar" : "Registrar"}
              </Button>
            </Group>
          </form>
        </Box>
      </Modal>

      <Modal 
        opened={!!deletingEgresoId} 
        onClose={cancelDelete} 
        title="Confirmar Eliminación"
      >
        <Alert 
          icon={<IconX size={16} />} 
          title="Eliminar Egreso" 
          color="red"
        >
          ¿Estás seguro de que deseas eliminar este egreso? Esta acción no se puede deshacer.
        </Alert>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={cancelDelete}>
            Cancelar
          </Button>
          <Button color="red" onClick={confirmDelete}>
            Eliminar
          </Button>
        </Group>
      </Modal>
    </div>
  );
}