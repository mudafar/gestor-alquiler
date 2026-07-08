import { useState, useEffect } from 'react';
import { AppShell, Burger, Group, Text, Button, Title, SimpleGrid, Paper, Modal, TextInput, Alert } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconHome, IconBuilding, IconUser, IconReceipt, IconFileDescription, IconFileInvoice, IconChartPie, IconDatabase, IconDownload, IconUpload, IconTrash, IconAlertCircle } from '@tabler/icons-react';
import { useAppStore } from './store/store';
import { appService } from './services/appService';
import { notifications } from '@mantine/notifications';
import { LocalesModule } from './modules/locales/LocalesModule';
import { InquilinosModule } from './modules/inquilinos/InquilinosModule';
import { EgresosModule } from './modules/egresos/EgresosModule';
import { PagosModule } from './modules/pagos/PagosModule';
import { ContratosModule } from './modules/contratos/ContratosModule';
import { CargosModule } from './modules/cargos/CargosModule';
import { ReportesModule } from './modules/reportes/ReportesModule';

function App() {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const { initializeDb, exportDbToFile, clearDb } = useAppStore();
  const [isDbReady, setIsDbReady] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [confirmClearText, setConfirmClearText] = useState('');
  const [openedClearModal, { open: openClearModal, close: closeClearModal }] = useDisclosure(false);
  useEffect(() => {
    initializeDb().then(() => {
      setIsDbReady(true);
      notifications.show({ title: 'Base de datos lista', message: 'La base de datos se ha inicializado correctamente.', color: 'green' });
    }).catch((error) => {
      notifications.show({ title: 'Error de base de datos', message: `Error al inicializar la base de datos: ${error.message}`, color: 'red' });
    });
  }, []);

  const handleExportDb = () => {
    exportDbToFile();
    notifications.show({ title: 'Base de datos exportada', message: 'El archivo de respaldo se ha descargado.', color: 'green' });
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await initializeDb(new Uint8Array(ev.target?.result as ArrayBuffer));
        notifications.show({ title: 'Base de datos importada', message: 'La base de datos se ha importado desde el archivo.', color: 'green' });
      } catch (error: any) {
        notifications.show({ title: 'Error al importar DB', message: `Error: ${error.message}`, color: 'red' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleClearDb = async () => {
    try {
      await clearDb();
      notifications.show({ title: 'Base de datos limpiada', message: 'La base de datos se ha reiniciado.', color: 'blue' });
      closeClearModal();
      setConfirmClearText('');
    } catch (error: any) {
      notifications.show({ title: 'Error al limpiar DB', message: `Error: ${error.message}`, color: 'red' });
    }
  };

  const navBtn = (tab: string, icon: React.ReactNode, label: string) => (
    <Button variant={activeTab === tab ? 'filled' : 'subtle'} leftSection={icon} fullWidth onClick={() => setActiveTab(tab)} mb={4} styles={{ inner: { justifyContent: 'flex-start' } }}>
      {label}
    </Button>
  );

  if (!isDbReady) return <Text p="xl">Cargando base de datos...</Text>;

  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !mobileOpened, desktop: !desktopOpened } }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
          <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
          <Title order={4}>Sistema de Gestión de Alquileres</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {navBtn('home', <IconHome size={18} />, 'Inicio')}
        <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4} mt="md">GESTI&Oacute;N</Text>
        {navBtn('locales', <IconBuilding size={18} />, 'Locales')}
        {navBtn('inquilinos', <IconUser size={18} />, 'Inquilinos')}
        {navBtn('contratos', <IconFileDescription size={18} />, 'Contratos')}
        {navBtn('pagos', <IconReceipt size={18} />, 'Pagos')}
        {navBtn('cargos', <IconFileInvoice size={18} />, 'Cargos')}
        {navBtn('egresos', <IconFileInvoice size={18} />, 'Egresos')}
        <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4} mt="md">AN&Aacute;LISIS</Text>
        {navBtn('reportes', <IconChartPie size={18} />, 'Reportes')}
        <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4} mt="md">SISTEMA</Text>
        {navBtn('datos', <IconDatabase size={18} />, 'Datos')}
      </AppShell.Navbar>

      <AppShell.Main>
        {activeTab === 'home' && (
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            {(() => {
              const o = appService.getOcupacion();
              const m = appService.getMorosos();
              const v = appService.getProximosVencimientos();
              return (
                <>
                  <SimpleGrid cols={3} spacing="md" mb="xl">
                    <Paper p="lg" radius="md" withBorder onClick={() => setActiveTab('reportes')} style={{ cursor: 'pointer' }}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Ocupaci&oacute;n</Text>
                      <Text size="xxxl" fw={900}>{o.ocupados} de {o.total}</Text>
                      <Text size="sm" c={o.porcentaje < 50 ? 'red' : 'teal'}>{o.porcentaje}% ocupado</Text>
                    </Paper>
                    <Paper p="lg" radius="md" withBorder onClick={() => setActiveTab('reportes')} style={{ cursor: 'pointer' }}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Morosos</Text>
                      <Text size="xxxl" fw={900} c={m.length > 0 ? 'red' : 'teal'}>{m.length}</Text>
                      <Text size="sm" c="dimmed">{m.length === 0 ? 'Sin morosos' : 'cargos atrasados'}</Text>
                    </Paper>
                    <Paper p="lg" radius="md" withBorder onClick={() => setActiveTab('reportes')} style={{ cursor: 'pointer' }}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Pr&oacute;ximos vencimientos</Text>
                      <Text size="xxxl" fw={900} c={v.length > 0 ? 'orange' : 'teal'}>{v.length}</Text>
                      <Text size="sm" c="dimmed">{v.length === 0 ? 'Sin vencimientos' : 'contratos en 60 d&iacute;as'}</Text>
                    </Paper>
                  </SimpleGrid>

                  <Text size="sm" c="dimmed" mb="sm">Acciones r&aacute;pidas</Text>
                  <Group>
                    <Button leftSection={<IconReceipt size={18} />} onClick={() => setActiveTab('pagos')}>+ Registrar Pago</Button>
                    <Button leftSection={<IconFileDescription size={18} />} onClick={() => setActiveTab('contratos')}>+ Nuevo Contrato</Button>
                    <Button leftSection={<IconBuilding size={18} />} onClick={() => setActiveTab('locales')}>+ Nuevo Local</Button>
                  </Group>
                </>
              );
            })()}
          </div>
        )}

        {activeTab === 'locales' && <LocalesModule />}
        {activeTab === 'inquilinos' && <InquilinosModule />}
        {activeTab === 'contratos' && <ContratosModule />}
        {activeTab === 'pagos' && <PagosModule />}
        {activeTab === 'cargos' && <CargosModule />}
        {activeTab === 'egresos' && <EgresosModule />}
        {activeTab === 'reportes' && <ReportesModule />}

        {activeTab === 'datos' && (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <Text size="xl" fw={700} mb="lg">Datos</Text>
            <SimpleGrid cols={1} spacing="md">
              <Paper p="lg" radius="md" withBorder>
                <Group>
                  <IconDownload size={24} />
                  <div style={{ flex: 1 }}>
                    <Text fw={600}>Exportar Base de Datos</Text>
                    <Text size="sm" c="dimmed">Descarga un archivo .db con todos los datos actuales.</Text>
                  </div>
                  <Button onClick={handleExportDb}>Exportar</Button>
                </Group>
              </Paper>
              <Paper p="lg" radius="md" withBorder>
                <Group>
                  <IconUpload size={24} />
                  <div style={{ flex: 1 }}>
                    <Text fw={600}>Importar Base de Datos</Text>
                    <Text size="sm" c="dimmed">Reemplaza los datos actuales por un archivo .db.</Text>
                  </div>
                  <Button component="label">Importar<input type="file" accept=".db" onChange={handleFileImport} hidden /></Button>
                </Group>
              </Paper>
              <Paper p="lg" radius="md" withBorder>
                <Group>
                  <IconTrash size={24} color="var(--mantine-color-red-6)" />
                  <div style={{ flex: 1 }}>
                    <Text fw={600}>Limpiar Base de Datos</Text>
                    <Text size="sm" c="dimmed">Elimina todos los datos permanentemente.</Text>
                  </div>
                  <Button color="red" onClick={() => { setConfirmClearText(''); openClearModal(); }}>Limpiar</Button>
                </Group>
              </Paper>
            </SimpleGrid>
          </div>
        )}
      </AppShell.Main>

      <Modal opened={openedClearModal} onClose={() => { closeClearModal(); setConfirmClearText(''); }} title="Limpiar Base de Datos">
        <Alert icon={<IconAlertCircle size={18} />} color="red" mb="md">
          Esta acci&oacute;n eliminar&aacute; todos los datos permanentemente y no se puede deshacer.
        </Alert>
        <TextInput placeholder='Escribe "ELIMINAR" para confirmar' value={confirmClearText} onChange={(e) => setConfirmClearText(e.currentTarget.value)} />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => { closeClearModal(); setConfirmClearText(''); }}>Cancelar</Button>
          <Button color="red" disabled={confirmClearText !== 'ELIMINAR'} onClick={handleClearDb}>Limpiar DB</Button>
        </Group>
      </Modal>
    </AppShell>
  );
}

export default App;
