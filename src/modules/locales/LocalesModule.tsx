import { useState, useMemo, useRef } from 'react';
import {
  TextInput,
  NumberInput,
  Button,
  Card,
  Group,
  Text,
  Table,
  Badge,
  ActionIcon,
  Modal,
  Box,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconTrash, IconPencil, IconPlus, IconX, IconCheck } from '@tabler/icons-react';
import { useAppStore } from '../../store/store';
import { appService } from '../../services/appService';
import { notifications } from '@mantine/notifications';

interface LocalFormData {
  nombre: string;
  direccion?: string;
  monto_alquiler: number;
  monto_condominio?: number | null;
  monto_luz?: number | null;
}

export function LocalesModule() {
  const { locales, contratos, createLocal, updateLocal, deleteLocal } = useAppStore();
  const [modalOpened, setModalOpened] = useState(false);
  const [editingLocal, setEditingLocal] = useState<LocalFormData | null>(null);
  const [deletingLocalId, setDeletingLocalId] = useState<number | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const form = useForm<LocalFormData>({
    initialValues: {
      nombre: '',
      direccion: '',
      monto_alquiler: 0,
      monto_condominio: null,
      monto_luz: null,
    },
    validate: {
      nombre: (value) => (value.trim() ? null : 'El nombre es requerido'),
      monto_alquiler: (value) => (value > 0 ? null : 'El monto debe ser mayor a 0'),
    },
  });

  const localEstados = useMemo(() => {
    const map: Record<number, 'ocupado' | 'vacante'> = {};
    for (const l of locales) {
      map[l.id] = appService.getLocalEstado(l.id);
    }
    return map;
  }, [locales, contratos]);

  const doCreate = (values: LocalFormData, stayOpen: boolean) => {
    try {
      createLocal(values);
      notifications.show({ title: 'Local creado', message: `El local ${values.nombre} ha sido creado correctamente.`, color: 'green', icon: <IconCheck size={18} /> });
      form.reset();
      if (stayOpen) {
        setTimeout(() => firstFieldRef.current?.focus(), 0);
      } else {
        setModalOpened(false);
      }
    } catch (e: any) {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    }
  };

  const handleSubmit = (values: LocalFormData) => {
    if (editingLocal) {
      updateLocal({ ...values, activo: true });
      notifications.show({ title: 'Local actualizado', message: `El local ${values.nombre} ha sido actualizado.`, color: 'green' });
      form.reset();
      setModalOpened(false);
      setEditingLocal(null);
    } else {
      doCreate(values, false);
    }
  };

  const handleCreateAndAddAnother = () => {
    const result = form.validate();
    if (result.hasErrors) return;
    doCreate(form.values, true);
  };

  const handleEdit = (local: typeof locales[0]) => {
    form.setValues({ nombre: local.nombre, direccion: local.direccion || '', monto_alquiler: local.monto_alquiler, monto_condominio: local.monto_condominio, monto_luz: local.monto_luz });
    setEditingLocal(local);
    setModalOpened(true);
  };

  const handleDelete = (id: number) => setDeletingLocalId(id);

  const confirmDelete = () => {
    if (deletingLocalId) {
      deleteLocal(deletingLocalId);
      notifications.show({ title: 'Local eliminado', message: 'El local ha sido eliminado.', color: 'green' });
      setDeletingLocalId(null);
    }
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Text size="xl" fw={700}>Gestión de Locales</Text>
        <Button leftSection={<IconPlus size={18} />} onClick={() => { form.reset(); setEditingLocal(null); setModalOpened(true); }}>
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
                <td>#{local.id}</td>
                <td>{local.nombre}</td>
                <td>
                  <Badge color={localEstados[local.id] === 'ocupado' ? 'green' : 'gray'}>
                    {localEstados[local.id] === 'ocupado' ? 'Ocupado' : 'Vacante'}
                  </Badge>
                </td>
                <td>${local.monto_alquiler.toFixed(2)}</td>
                <td>
                  <Group gap="xs">
                    <ActionIcon variant="light" color="blue" title="Editar" onClick={() => handleEdit(local)}>
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon variant="light" color="red" title="Eliminar" onClick={() => handleDelete(local.id)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title={editingLocal ? 'Editar Local' : 'Crear Nuevo Local'}>
        <Box mx="auto">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput label="Nombre" placeholder="Nombre del local" {...form.getInputProps('nombre')} ref={firstFieldRef} />
            <TextInput label="Dirección" placeholder="Dirección del local" {...form.getInputProps('direccion')} />
            <NumberInput label="Monto de Alquiler (USD)" placeholder="Monto de alquiler" decimalScale={2} {...form.getInputProps('monto_alquiler')} />
            <NumberInput label="Monto de Condominio (USD) - Opcional" placeholder="Monto de condominio" decimalScale={2} {...form.getInputProps('monto_condominio')} />
            <NumberInput label="Monto de Luz (USD) - Opcional" placeholder="Monto de luz" decimalScale={2} {...form.getInputProps('monto_luz')} />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setModalOpened(false)}>Cancelar</Button>
              {editingLocal ? (
                <Button type="submit">Guardar</Button>
              ) : (
                <>
                  <Button type="submit">Crear</Button>
                  <Button variant="outline" type="button" onClick={handleCreateAndAddAnother}>Crear y agregar otro</Button>
                </>
              )}
            </Group>
          </form>
        </Box>
      </Modal>

      <Modal opened={!!deletingLocalId} onClose={() => setDeletingLocalId(null)} title="Confirmar Eliminación">
        <Alert icon={<IconX size={16} />} title="Eliminar Local" color="red">
          ¿Estás seguro de que deseas eliminar este local? Esta acción no se puede deshacer.
        </Alert>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setDeletingLocalId(null)}>Cancelar</Button>
          <Button color="red" onClick={confirmDelete}>Eliminar</Button>
        </Group>
      </Modal>
    </div>
  );
}