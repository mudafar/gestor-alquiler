import { useState } from 'react';
import {
  TextInput,
  Button,
  Card,
  Group,
  Text,
  Table,
  ActionIcon,
  Modal,
  Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconTrash, IconPlus, IconPencil } from '@tabler/icons-react';
import { useAppStore } from '../../store/store';
import { notifications } from '@mantine/notifications';

interface InquilinoFormData {
  nombre: string;
  cedula: string;
}

export function InquilinosModule() {
  const { inquilinos, createInquilino, updateInquilino, deleteInquilino } = useAppStore();

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingInquilino, setEditingInquilino] = useState<{ id: number; nombre: string; cedula: string } | null>(null);

  const form = useForm<InquilinoFormData>({
    initialValues: { nombre: '', cedula: '' },
    validate: {
      nombre: (value) => (value.trim() ? null : 'El nombre es requerido'),
    },
  });

  const handleSubmit = (values: InquilinoFormData) => {
    if (modalMode === 'edit' && editingInquilino) {
      updateInquilino(editingInquilino.id, values.nombre, values.cedula || undefined);
      notifications({ title: 'Inquilino actualizado', message: `El inquilino ${values.nombre} ha sido actualizado.`, color: 'green' });
    } else {
      createInquilino(values.nombre, values.cedula || undefined);
      notifications({ title: 'Inquilino creado', message: `El inquilino ${values.nombre} ha sido creado.`, color: 'green' });
    }
    form.reset();
    setModalMode(null);
    setEditingInquilino(null);
  };

  const handleEdit = (inquilino: typeof inquilinos[0]) => {
    setEditingInquilino({ id: inquilino.id, nombre: inquilino.nombre, cedula: inquilino.cedula || '' });
    form.setValues({ nombre: inquilino.nombre, cedula: inquilino.cedula || '' });
    setModalMode('edit');
  };

  const handleDelete = (id: number) => {
    deleteInquilino(id);
    notifications({ title: 'Inquilino eliminado', message: 'El inquilino ha sido eliminado.', color: 'green' });
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Text size="xl" fw={700}>Gestión de Inquilinos</Text>
        <Button leftSection={<IconPlus size={18} />} onClick={() => { form.reset(); setEditingInquilino(null); setModalMode('create'); }}>
          Nuevo Inquilino
        </Button>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
        <Text size="lg" fw={700} mb="md">Inquilinos</Text>
        <Table highlightOnHover>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cédula</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inquilinos.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', color: 'gray' }}>
                  No hay inquilinos registrados
                </td>
              </tr>
            ) : (
              inquilinos.map((inquilino) => (
                <tr key={inquilino.id}>
                  <td>{inquilino.nombre}</td>
                  <td>{inquilino.cedula || '-'}</td>
                  <td>
                    <Group gap="xs">
                      <ActionIcon variant="light" color="blue" title="Editar" onClick={() => handleEdit(inquilino)}>
                        <IconPencil size={16} />
                      </ActionIcon>
                      <ActionIcon variant="light" color="red" title="Eliminar" onClick={() => handleDelete(inquilino.id)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      <Modal opened={modalMode === 'create' || modalMode === 'edit'} onClose={() => { setModalMode(null); setEditingInquilino(null); form.reset(); }}
        title={modalMode === 'edit' ? 'Editar Inquilino' : 'Crear Nuevo Inquilino'}>
        <Box mx="auto">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput label="Nombre del Inquilino" placeholder="Nombre completo" withAsterisk mb="md" {...form.getInputProps('nombre')} />
            <TextInput label="Cédula (opcional)" placeholder="Cédula de identidad" mb="md" {...form.getInputProps('cedula')} />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => { setModalMode(null); setEditingInquilino(null); form.reset(); }}>Cancelar</Button>
              <Button type="submit">{modalMode === 'edit' ? 'Actualizar' : 'Crear'}</Button>
            </Group>
          </form>
        </Box>
      </Modal>
    </div>
  );
}