import { 
  NumberInput, 
  Button, 
  Card, 
  Group, 
  Text, 
  Select,
  TextInput
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAppStore } from '../../store/store';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';

interface PagoFormData {
  local_id: string;
  cargo_mensual_id: number;
  fecha_pago: string;
  monto: number;
  moneda: 'USD' | 'BS';
  cuenta: 'juridica' | 'personal';
}

export function PagosModule() {
  const { locales, cargosMensuales, registrarPago } = useAppStore();
  
  const form = useForm<PagoFormData>({
    initialValues: {
      local_id: '',
      cargo_mensual_id: 0,
      fecha_pago: dayjs().format('YYYY-MM-DD'),
      monto: 0,
      moneda: 'USD',
      cuenta: 'juridica',
    },
    validate: {
      local_id: (value) => (value.trim() ? null : 'El local es requerido'),
      cargo_mensual_id: (value) => (value > 0 ? null : 'El cargo es requerido'),
      monto: (value) => (value > 0 ? null : 'El monto debe ser mayor a 0'),
    },
  });

  const handleSubmit = (values: PagoFormData) => {
    registrarPago(
      values.cargo_mensual_id,
      values.local_id,
      values.fecha_pago,
      values.monto,
      values.moneda,
      values.cuenta
    );
    notifications.show({
      title: 'Pago registrado',
      message: `El pago ha sido registrado exitosamente.`,
      color: 'green',
    });
    form.reset();
    // Force re-render of selects after reset
    form.setValues({
      local_id: '',
      cargo_mensual_id: 0,
      fecha_pago: dayjs().format('YYYY-MM-DD'),
      monto: 0,
      moneda: 'USD',
      cuenta: 'juridica',
    });
  };

  // Get cargos for the selected local
  const selectedLocalId = form.values.local_id;
  const filteredCargos = selectedLocalId 
    ? cargosMensuales.filter(c => c.local_id === selectedLocalId)
    : [];

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Text size="xl" fw={700}>Registro de Pagos</Text>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
        <Text size="lg" fw={700} mb="md">Registrar Nuevo Pago</Text>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Select
            label="Local"
            placeholder="Seleccionar local"
            data={locales.filter(l => l.estado === 'ocupado').map(l => ({
              value: l.id,
              label: `${l.id} - ${l.nombre}`
            }))}
            value={form.values.local_id || null}
            error={form.errors.local_id}
            onChange={(value) => {
              form.setValues((prev) => ({
                ...prev,
                local_id: value || '',
                cargo_mensual_id: 0,
              }));
            }}
          />
          
          <Select
            label="Cargo Mensual"
            placeholder="Seleccionar cargo"
            data={filteredCargos.map(c => ({
              value: c.id.toString(),
              label: `${c.anio}-${String(c.mes).padStart(2, '0')} — $${c.monto_total.toFixed(2)} (${c.estado_morosidad})`
            }))}
            value={form.values.cargo_mensual_id > 0 ? form.values.cargo_mensual_id.toString() : null}
            error={form.errors.cargo_mensual_id}
            disabled={!selectedLocalId}
            onChange={(value) => {
              form.setFieldValue('cargo_mensual_id', value ? parseInt(value, 10) : 0);
            }}
          />
          
          <TextInput
            label="Fecha de Pago"
            placeholder="YYYY-MM-DD"
            {...form.getInputProps('fecha_pago')}
          />
          
          <NumberInput
            label="Monto"
            placeholder="Monto del pago"
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
          
          <Select
            label="Cuenta"
            placeholder="Seleccionar cuenta"
            data={[
              { value: 'juridica', label: 'Jurídica' },
              { value: 'personal', label: 'Personal' },
            ]}
            {...form.getInputProps('cuenta')}
          />
          
          <Group justify="flex-end" mt="md">
            <Button type="submit">
              Registrar Pago
            </Button>
          </Group>
        </form>
      </Card>
    </div>
  );
}