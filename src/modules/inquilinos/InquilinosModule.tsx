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
  Select,
  Badge
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconTrash, IconPlus, IconPencil, IconX } from '@tabler/icons-react';
import { useAppStore } from '../../store/store';
import { notifications } from '@mantine/notifications';

interface InquilinoFormData {
  nombre: string;
  telefono: string;
}

interface AsignacionFormData {
  inquilino_id: string;
  local_id: string;
}

export function InquilinosModule() {
  const { 
    inquilinos, 
    locales, 
    createInquilino, 
    updateInquilino, 
    deleteInquilino,
    asignarInquilinoExistente,
    desasignarInquilino 
  } = useAppStore();
  
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'assign' | null>(null);
  const [editingInquilino, setEditingInquilino] = useState<{id: number, nombre: string, telefono: string} | null>(null);
  
  const form = useForm<InquilinoFormData>({
    initialValues: {
      nombre: '',
      telefono: '',
    },
    validate: {
      nombre: (value) => (value.trim() ? null : 'El nombre es requerido'),
    },
  });

  const asignacionForm = useForm<AsignacionFormData>({
    initialValues: {
      inquilino_id: '',
      local_id: '',
    },
    validate: {
      inquilino_id: (value) => (value ? null : 'Selecciona un inquilino'),
      local_id: (value) => (value ? null : 'Selecciona un local'),
    },
  });

  const handleSubmit = (values: InquilinoFormData) => {
    if (modalMode === 'edit' && editingInquilino) {
      updateInquilino(editingInquilino.id, values.nombre, values.telefono || undefined);
      notifications.show({
        title: 'Inquilino actualizado',
        message: `El inquilino ${values.nombre} ha sido actualizado.`,
        color: 'green',
      });
    } else {
      createInquilino(values.nombre, values.telefono || undefined);
      notifications.show({
        title: 'Inquilino creado',
        message: `El inquilino ${values.nombre} ha sido creado.`,
        color: 'green',
      });
    }
    form.reset();
    setModalMode(null);
    setEditingInquilino(null);
  };

  const handleAsignacionSubmit = (values: AsignacionFormData) => {
    asignarInquilinoExistente(parseInt(values.inquilino_id), values.local_id);
    notifications.show({
      title: 'Inquilino asignado',
      message: 'El inquilino ha sido asignado al local correctamente.',
      color: 'green',
    });
    asignacionForm.reset();
    setModalMode(null);
  };

  const handleEdit = (inquilino: typeof inquilinos[0]) => {
    setEditingInquilino({
      id: inquilino.id,
      nombre: inquilino.nombre,
      telefono: inquilino.telefono || '',
    });
    form.setValues({
      nombre: inquilino.nombre,
      telefono: inquilino.telefono || '',
    });
    setModalMode('edit');
  };

  const handleDelete = (id: number) => {
    deleteInquilino(id);
    notifications.show({
      title: 'Inquilino eliminado',
      message: 'El inquilino ha sido eliminado.',
      color: 'green',
    });
  };

  const handleUnassign = (inquilinoId: number, localId: string) => {
    desasignarInquilino(inquilinoId, localId);
    notifications.show({
      title: 'Inquilino desasignado',
      message: 'El inquilino ha sido desasignado del local.',
      color: 'orange',
    });
  };

  // For the assign modal: locales already assigned to the selected inquilino are excluded
  const selectedInquilinoId = asignacionForm.values.inquilino_id;
  const selectedInquilino = inquilinos.find(i => i.id.toString() === selectedInquilinoId);
  const availableLocales = locales.filter(l =>
    !selectedInquilino?.local_ids.includes(l.id)
  );

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Text size="xl" fw={700}>Gestión de Inquilinos</Text>
        <Group>
          <Button 
            leftSection={<IconPlus size={18} />} 
            onClick={() => {
              form.reset();
              setEditingInquilino(null);
              setModalMode('create');
            }}
          >
            Nuevo Inquilino
          </Button>
          <Button 
            leftSection={<IconPlus size={18} />} 
            color="blue"
            onClick={() => {
              asignacionForm.reset();
              setModalMode('assign');
            }}
          >
            Asignar a Local
          </Button>
        </Group>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
        <Text size="lg" fw={700} mb="md">Inquilinos</Text>
        <Table highlightOnHover>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Locales Asignados</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inquilinos.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'gray' }}>
                  No hay inquilinos registrados
                </td>
              </tr>
            ) : (
              inquilinos.map((inquilino) => {
                const assignedLocales = locales.filter(l => inquilino.local_ids.includes(l.id));
                const isAssigned = assignedLocales.length > 0;
                return (
                  <tr key={inquilino.id}>
                    <td>{inquilino.nombre}</td>
                    <td>{inquilino.telefono || '-'}</td>
                    <td>
                      {assignedLocales.length === 0 ? (
                        <Text size="sm" c="dimmed">-</Text>
                      ) : (
                        <Group gap={4} wrap="wrap">
                          {assignedLocales.map(local => (
                            <Badge
                              key={local.id}
                              color="teal"
                              variant="light"
                              rightSection={
                                <ActionIcon
                                  size="xs"
                                  color="teal"
                                  variant="transparent"
                                  title={`Desasignar de ${local.nombre}`}
                                  onClick={() => handleUnassign(inquilino.id, local.id)}
                                >
                                  <IconX size={10} />
                                </ActionIcon>
                              }
                            >
                              {local.id} – {local.nombre}
                            </Badge>
                          ))}
                        </Group>
                      )}
                    </td>
                    <td>
                      <Badge color={isAssigned ? 'green' : 'gray'}>
                        {isAssigned ? `${assignedLocales.length} local${assignedLocales.length > 1 ? 'es' : ''}` : 'Sin asignar'}
                      </Badge>
                    </td>
                    <td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          title="Editar"
                          onClick={() => handleEdit(inquilino)}
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          title="Eliminar"
                          onClick={() => handleDelete(inquilino.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </Card>

      {/* Create/Edit Modal */}
      <Modal 
        opened={modalMode === 'create' || modalMode === 'edit'} 
        onClose={() => {
          setModalMode(null);
          setEditingInquilino(null);
          form.reset();
        }} 
        title={modalMode === 'edit' ? 'Editar Inquilino' : 'Crear Nuevo Inquilino'}
      >
        <Box mx="auto">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              label="Nombre del Inquilino"
              placeholder="Nombre completo"
              withAsterisk
              mb="md"
              {...form.getInputProps('nombre')}
            />
            
            <TextInput
              label="Teléfono"
              placeholder="Número de teléfono"
              mb="md"
              {...form.getInputProps('telefono')}
            />
            
            <Group justify="flex-end" mt="md">
              <Button 
                variant="default" 
                onClick={() => {
                  setModalMode(null);
                  setEditingInquilino(null);
                  form.reset();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {modalMode === 'edit' ? 'Actualizar' : 'Crear'}
              </Button>
            </Group>
          </form>
        </Box>
      </Modal>

      {/* Assign Modal */}
      <Modal 
        opened={modalMode === 'assign'} 
        onClose={() => {
          setModalMode(null);
          asignacionForm.reset();
        }} 
        title="Asignar Inquilino a Local"
      >
        <Box mx="auto">
          <form onSubmit={asignacionForm.onSubmit(handleAsignacionSubmit)}>
            <Select
              label="Inquilino"
              placeholder="Seleccionar inquilino"
              data={inquilinos.filter(i => i.activo).map(i => ({
                value: i.id.toString(),
                label: i.nombre + (i.telefono ? ` (${i.telefono})` : '')
              }))}
              mb="md"
              {...asignacionForm.getInputProps('inquilino_id')}
            />
            
            <Select
              label="Local"
              placeholder={selectedInquilinoId ? 'Seleccionar local disponible' : 'Primero selecciona un inquilino'}
              data={availableLocales.map(l => ({
                value: l.id,
                label: `${l.id} – ${l.nombre} (${l.estado})`
              }))}
              disabled={!selectedInquilinoId}
              mb="md"
              {...asignacionForm.getInputProps('local_id')}
            />
            
            <Group justify="flex-end" mt="md">
              <Button 
                variant="default" 
                onClick={() => {
                  setModalMode(null);
                  asignacionForm.reset();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Asignar
              </Button>
            </Group>
          </form>
        </Box>
      </Modal>
    </div>
  );
}