import { useState } from 'react';
import { 
  TextInput, 
  NumberInput, 
  Select, 
  Button, 
  Card, 
  Group, 
  Text, 
  Table, 
  ActionIcon, 
  Modal, 
  Box, 
  Alert 
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconTrash, IconPencil, IconPlus, IconX } from '@tabler/icons-react';
import { useAppStore } from '../../store/store';
import { notifications } from '@mantine/notifications';

interface LocalFormData {
  id: string;
  nombre: string;
  direccion?: string;
  estado: 'ocupado' | 'vacante';
  monto_alquiler: number;
  monto_condominio?: number | null;
  monto_luz?: number | null;
}

export function LocalesModule() {
  const { locales, createLocal, updateLocal, deleteLocal } = useAppStore();
  const [modalOpened, setModalOpened] = useState(false);
  const [editingLocal, setEditingLocal] = useState<LocalFormData | null>(null);
  const [deletingLocalId, setDeletingLocalId] = useState<string | null>(null);
  
  const form = useForm<LocalFormData>({
    initialValues: {
      id: '',
      nombre: '',
      direccion: '',
      estado: 'vacante',
      monto_alquiler: 0,
      monto_condominio: null,
      monto_luz: null,
    },
    validate: {
      id: (value) => (value.trim() ? null : 'El ID es requerido'),
      nombre: (value) => (value.trim() ? null : 'El nombre es requerido'),
      monto_alquiler: (value) => (value > 0 ? null : 'El monto debe ser mayor a 0'),
    },
  });

  const handleSubmit = (values: LocalFormData) => {
    if (editingLocal) {
      // Update existing local
      updateLocal({
        ...values,
        activo: true,
      });
      notifications.show({
        title: 'Local actualizado',
        message: `El local ${values.nombre} ha sido actualizado.`,
        color: 'green',
      });
    } else {
      // Create new local
      createLocal(values);
      notifications.show({
        title: 'Local creado',
        message: `El local ${values.nombre} ha sido creado.`,
        color: 'green',
      });
    }
    form.reset();
    setModalOpened(false);
    setEditingLocal(null);
  };

  const handleEdit = (local: LocalFormData) => {
    form.setValues(local);
    setEditingLocal(local);
    setModalOpened(true);
  };

  const handleDelete = (id: string) => {
    setDeletingLocalId(id);
  };

  const confirmDelete = () => {
    if (deletingLocalId) {
      deleteLocal(deletingLocalId);
      notifications.show({
        title: 'Local eliminado',
        message: `El local ha sido eliminado.`,
        color: 'green',
      });
      setDeletingLocalId(null);
    }
  };

  const cancelDelete = () => {
    setDeletingLocalId(null);
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Text size="xl" fw={700}>Gestión de Locales</Text>
        <Button 
          leftSection={<IconPlus size={18} />} 
          onClick={() => {
            form.reset();
            setEditingLocal(null);
            setModalOpened(true);
          }}
        >
          Nuevo Local
        </Button>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
        <Text size="lg" fw={700} mb="md">Lista de Locales</Text>
        <Table highlightOnHover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Monto Alquiler</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {locales.map((local) => (
              <tr key={local.id}>
                <td>{local.id}</td>
                <td>{local.nombre}</td>
                <td>{local.estado}</td>
                <td>${local.monto_alquiler.toFixed(2)}</td>
                <td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      title="Editar"
                      onClick={() => handleEdit(local)}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      title="Eliminar"
                      onClick={() => handleDelete(local.id)}
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
        title={editingLocal ? "Editar Local" : "Crear Nuevo Local"}
      >
        <Box mx="auto">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              label="ID del Local"
              placeholder="ID único del local"
              {...form.getInputProps('id')}
              disabled={!!editingLocal}
            />
            
            <TextInput
              label="Nombre"
              placeholder="Nombre del local"
              {...form.getInputProps('nombre')}
            />
            
            <TextInput
              label="Dirección"
              placeholder="Dirección del local"
              {...form.getInputProps('direccion')}
            />
            
            <Select
              label="Estado"
              placeholder="Seleccionar estado"
              data={[
                { value: 'ocupado', label: 'Ocupado' },
                { value: 'vacante', label: 'Vacante' },
              ]}
              {...form.getInputProps('estado')}
            />
            
            <NumberInput
              label="Monto de Alquiler (USD)"
              placeholder="Monto de alquiler"
              decimalScale={2}
              {...form.getInputProps('monto_alquiler')}
            />
            
            <NumberInput
              label="Monto de Condominio (USD) - Opcional"
              placeholder="Monto de condominio"
              decimalScale={2}
              {...form.getInputProps('monto_condominio')}
            />
            
            <NumberInput
              label="Monto de Luz (USD) - Opcional"
              placeholder="Monto de luz"
              decimalScale={2}
              {...form.getInputProps('monto_luz')}
            />
            
            <Group justify="flex-end" mt="md">
              <Button 
                variant="default" 
                onClick={() => setModalOpened(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingLocal ? "Actualizar" : "Crear"}
              </Button>
            </Group>
          </form>
        </Box>
      </Modal>

      <Modal 
        opened={!!deletingLocalId} 
        onClose={cancelDelete} 
        title="Confirmar Eliminación"
      >
        <Alert 
          icon={<IconX size={16} />} 
          title="Eliminar Local" 
          color="red"
        >
          ¿Estás seguro de que deseas eliminar este local? Esta acción no se puede deshacer.
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