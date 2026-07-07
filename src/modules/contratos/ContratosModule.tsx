import { useState, useMemo } from 'react';
import {
  TextInput,
  NumberInput,
  Select,
  Button,
  Card,
  Group,
  Text,
  Table,
  Badge,
  ActionIcon,
  Modal,
  Box,
  Textarea,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconX, IconPlus } from '@tabler/icons-react';
import { useAppStore } from '../../store/store';
import { appService } from '../../services/appService';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';

interface ContratoFormData {
  local_id: string;
  inquilino_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  monto_alquiler: number;
  monto_condominio?: number | null;
  monto_luz?: number | null;
  observaciones?: string;
}

export function ContratosModule() {
  const { locales, inquilinos, contratos, createContrato, cancelContrato } = useAppStore();
  const [modalOpened, setModalOpened] = useState(false);
  const [cancelId, setCancelId] = useState<number | null>(null);

  const localesDisponibles = useMemo(
    () => locales.filter((l) => !contratos.some((c) => c.local_id === l.id && c.estado === 'activo')),
    [locales, contratos]
  );

  const form = useForm<ContratoFormData>({
    initialValues: {
      local_id: '',
      inquilino_id: '',
      fecha_inicio: dayjs().format('YYYY-MM'),
      fecha_fin: dayjs().add(1, 'year').format('YYYY-MM'),
      monto_alquiler: 0,
      monto_condominio: null,
      monto_luz: null,
      observaciones: '',
    },
    validate: {
      local_id: (v) => (v ? null : 'Selecciona un local'),
      inquilino_id: (v) => (v ? null : 'Selecciona un inquilino'),
      fecha_inicio: (v) => (v ? null : 'La fecha de inicio es requerida'),
      fecha_fin: (v) => (v ? null : 'La fecha de fin es requerida'),
      monto_alquiler: (v) => (v > 0 ? null : 'El monto debe ser mayor a 0'),
    },
  });

  const selectedLocal = locales.find((l) => l.id === form.values.local_id);

  const handleLocalChange = (localId: string) => {
    const local = locales.find((l) => l.id === localId);
    if (local) {
      form.setValues({
        local_id: localId,
        monto_alquiler: local.monto_alquiler,
        monto_condominio: local.monto_condominio,
        monto_luz: local.monto_luz,
      });
    } else {
      form.setFieldValue('local_id', localId);
    }
  };

  const handleSubmit = (values: ContratoFormData) => {
    try {
      createContrato({
        local_id: values.local_id,
        inquilino_id: parseInt(values.inquilino_id, 10),
        fecha_inicio: values.fecha_inicio,
        fecha_fin: values.fecha_fin,
        monto_alquiler: values.monto_alquiler,
        monto_condominio: values.monto_condominio,
        monto_luz: values.monto_luz,
        observaciones: values.observaciones,
      });
      notifications({ title: 'Contrato creado', message: 'El contrato se ha creado y los cargos mensuales han sido generados.', color: 'green' });
      form.reset();
      setModalOpened(false);
    } catch (e: any) {
      notifications({ title: 'Error', message: e.message, color: 'red' });
    }
  };

  const handleCancel = () => {
    if (cancelId == null) return;
    try {
      cancelContrato(cancelId);
      notifications({ title: 'Contrato cancelado', message: 'El contrato ha sido cancelado exitosamente.', color: 'orange' });
      setCancelId(null);
    } catch (e: any) {
      notifications({ title: 'Error', message: e.message, color: 'red' });
    }
  };

  const contratoRows = contratos.map((c) => {
    const local = locales.find((l) => l.id === c.local_id);
    const inquilino = inquilinos.find((i) => i.id === c.inquilino_id);
    const estadoColor = c.estado === 'activo' ? 'green' : c.estado === 'finalizado' ? 'blue' : 'red';
    return { ...c, localNombre: local?.nombre ?? c.local_id, inquilinoNombre: inquilino?.nombre ?? `#${c.inquilino_id}`, estadoColor };
  });

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Text size="xl" fw={700}>
          Gestión de Contratos
        </Text>
        <Button
          leftSection={<IconPlus size={18} />}
          onClick={() => {
            form.reset();
            setModalOpened(true);
          }}
        >
          Nuevo Contrato
        </Button>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
        <Text size="lg" fw={700} mb="md">
          Lista de Contratos
        </Text>
        <Table highlightOnHover>
          <thead>
            <tr>
              <th>Local</th>
              <th>Inquilino</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Estado</th>
              <th>Monto Alq.</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {contratoRows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'gray' }}>
                  No hay contratos registrados
                </td>
              </tr>
            ) : (
              contratoRows.map((c) => (
                <tr key={c.id}>
                  <td>{c.localNombre}</td>
                  <td>{c.inquilinoNombre}</td>
                  <td>{c.fecha_inicio}</td>
                  <td>{c.fecha_fin}</td>
                  <td>
                    <Badge color={c.estadoColor}>{c.estado}</Badge>
                  </td>
                  <td>${c.monto_alquiler.toFixed(2)}</td>
                  <td>
                    {c.estado === 'activo' && (
                      <ActionIcon variant="light" color="red" title="Cancelar contrato" onClick={() => setCancelId(c.id)}>
                        <IconX size={16} />
                      </ActionIcon>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title="Crear Nuevo Contrato" size="lg">
        <Box mx="auto">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Select
              label="Local"
              placeholder="Seleccionar local"
              data={localesDisponibles.map((l) => ({ value: l.id, label: `${l.id} – ${l.nombre}` }))}
              searchable
              {...form.getInputProps('local_id')}
              onChange={handleLocalChange}
            />
            <Select
              label="Inquilino"
              placeholder="Seleccionar inquilino"
              data={inquilinos.map((i) => ({ value: i.id.toString(), label: i.nombre + (i.cedula ? ` (${i.cedula})` : '') }))}
              searchable
              {...form.getInputProps('inquilino_id')}
            />
            <TextInput label="Fecha de Inicio (mes/año)" placeholder="YYYY-MM" {...form.getInputProps('fecha_inicio')} />
            <TextInput label="Fecha de Fin (mes/año)" placeholder="YYYY-MM" {...form.getInputProps('fecha_fin')} />
            {selectedLocal && (
              <Text size="sm" c="dimmed" mb="sm">
                Montos base del local: Alquiler ${selectedLocal.monto_alquiler.toFixed(2)}
                {selectedLocal.monto_condominio ? `, Condominio $${selectedLocal.monto_condominio.toFixed(2)}` : ''}
                {selectedLocal.monto_luz ? `, Luz $${selectedLocal.monto_luz.toFixed(2)}` : ''}
              </Text>
            )}
            <NumberInput label="Monto Alquiler (USD)" placeholder="Monto de alquiler" decimalScale={2} {...form.getInputProps('monto_alquiler')} />
            <NumberInput label="Monto Condominio (USD) - Opcional" placeholder="Monto de condominio" decimalScale={2} {...form.getInputProps('monto_condominio')} />
            <NumberInput label="Monto Luz (USD) - Opcional" placeholder="Monto de luz" decimalScale={2} {...form.getInputProps('monto_luz')} />
            <Textarea label="Observaciones" placeholder="Observaciones (opcional)" {...form.getInputProps('observaciones')} />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setModalOpened(false)}>
                Cancelar
              </Button>
              <Button type="submit">Crear Contrato</Button>
            </Group>
          </form>
        </Box>
      </Modal>

      <Modal opened={cancelId != null} onClose={() => setCancelId(null)} title="Cancelar Contrato">
        <Alert icon={<IconX size={16} />} title="Confirmar Cancelación" color="red">
          Se eliminarán los cargos futuros sin pago. Los cargos pasados y aquellos con pagos registrados se conservarán.
          ¿Estás seguro?
        </Alert>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setCancelId(null)}>
            No, mantener
          </Button>
          <Button color="red" onClick={handleCancel}>
            Sí, cancelar contrato
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
