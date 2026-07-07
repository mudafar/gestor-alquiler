import { useState, useEffect } from 'react';
import { AppShell, Burger, Group, Text, Button, Modal, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconDatabaseExport, IconDatabaseImport, IconTrash, IconHome, IconBuilding, IconUser, IconReceipt, IconFileDescription, IconFileInvoice, IconChartPie } from '@tabler/icons-react';
import { useAppStore } from './store/store';
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
  const [openedDbLoadModal, { open: openDbLoadModal, close: closeDbLoadModal }] = useDisclosure(false);
  const [openedClearModal, { open: openClearModal, close: closeClearModal }] = useDisclosure(false);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    // Initialize DB on component mount
    initializeDb().then(() => {
      setIsDbReady(true);
      notifications.show({
        title: 'Base de datos lista',
        message: 'La base de datos se ha inicializado correctamente.',
        color: 'green',
      });
    }).catch((error) => {
      notifications.show({
        title: 'Error de base de datos',
        message: `Error al inicializar la base de datos: ${error.message}`,
        color: 'red',
      });
    });
  }, [initializeDb]);

  const handleFileOpen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const dbBytes = new Uint8Array(buffer);
        await initializeDb(dbBytes);
        notifications.show({
          title: 'Base de datos importada',
          message: 'La base de datos se ha importado desde el archivo.',
          color: 'green',
        });
        closeDbLoadModal();
      } catch (error: any) {
        notifications.show({
          title: 'Error al importar DB',
          message: `Error al importar la base de datos: ${error.message}`,
          color: 'red',
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportDb = () => {
    exportDbToFile();
    notifications.show({
      title: 'Base de datos exportada',
      message: 'El archivo de respaldo se ha descargado.',
      color: 'green',
    });
  };

  const handleClearDb = async () => {
    try {
      await clearDb();
      notifications.show({
        title: 'Base de datos limpiada',
        message: 'La base de datos se ha reiniciado.',
        color: 'blue',
      });
      closeClearModal();
    } catch (error: any) {
      notifications.show({
        title: 'Error al limpiar DB',
        message: `Error: ${error.message}`,
        color: 'red',
      });
    }
  };

  if (!isDbReady) {
    return <Text>Cargando base de datos...</Text>;
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
          <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
          <Title order={4}>Sistema de Gestión de Alquileres</Title>
          <Group style={{ marginLeft: 'auto' }}>
            <Button leftSection={<IconDatabaseImport size={18} />} onClick={openDbLoadModal} variant="default">
              Importar DB
            </Button>
            <Button leftSection={<IconDatabaseExport size={18} />} onClick={handleExportDb} variant="default">
              Exportar DB
            </Button>
            <Button leftSection={<IconTrash size={18} />} onClick={openClearModal} color="red" variant="subtle">
              Limpiar DB
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Text size="lg" fw={700} mb="md">Menú Principal</Text>
        <Button 
          variant={activeTab === 'home' ? 'filled' : 'subtle'} 
          leftSection={<IconHome size={18} />}
          fullWidth
          onClick={() => setActiveTab('home')}
          mb="sm"
        >
          Inicio
        </Button>
        <Button 
          variant={activeTab === 'locales' ? 'filled' : 'subtle'} 
          leftSection={<IconBuilding size={18} />}
          fullWidth
          onClick={() => setActiveTab('locales')}
          mb="sm"
        >
          Locales
        </Button>
        <Button 
          variant={activeTab === 'inquilinos' ? 'filled' : 'subtle'} 
          leftSection={<IconUser size={18} />}
          fullWidth
          onClick={() => setActiveTab('inquilinos')}
          mb="sm"
        >
          Inquilinos
        </Button>
        <Button 
          variant={activeTab === 'contratos' ? 'filled' : 'subtle'} 
          leftSection={<IconFileDescription size={18} />}
          fullWidth
          onClick={() => setActiveTab('contratos')}
          mb="sm"
        >
          Contratos
        </Button>
        <Button 
          variant={activeTab === 'pagos' ? 'filled' : 'subtle'} 
          leftSection={<IconReceipt size={18} />}
          fullWidth
          onClick={() => setActiveTab('pagos')}
          mb="sm"
        >
          Pagos
        </Button>
        <Button 
          variant={activeTab === 'cargos' ? 'filled' : 'subtle'} 
          leftSection={<IconFileInvoice size={18} />}
          fullWidth
          onClick={() => setActiveTab('cargos')}
          mb="sm"
        >
          Cargos
        </Button>
        <Button 
          variant={activeTab === 'egresos' ? 'filled' : 'subtle'} 
          leftSection={<IconFileInvoice size={18} />}
          fullWidth
          onClick={() => setActiveTab('egresos')}
          mb="sm"
        >
          Egresos
        </Button>
        <Button 
          variant={activeTab === 'reportes' ? 'filled' : 'subtle'} 
          leftSection={<IconChartPie size={18} />}
          fullWidth
          onClick={() => setActiveTab('reportes')}
          mb="sm"
        >
          Reportes
        </Button>
      </AppShell.Navbar>

      <AppShell.Main>
        {activeTab === 'home' && (
          <div>
            <Text size="xl" fw={700} mb="md">Bienvenido</Text>
            <Text size="lg" mb="md">Resumen del sistema</Text>
            <Text>Este sistema permite gestionar alquileres de locales comerciales, incluyendo:</Text>
            <ul>
              <li>Gestión de locales (creación, edición, desactivación)</li>
              <li>Asignación de inquilinos</li>
              <li>Generación de cargos mensuales</li>
              <li>Registro de pagos</li>
              <li>Registro de egresos</li>
              <li>Generación de reportes financieros</li>
            </ul>
          </div>
        )}

        {activeTab === 'locales' && <LocalesModule />}
        {activeTab === 'inquilinos' && <InquilinosModule />}
        {activeTab === 'contratos' && <ContratosModule />}
        {activeTab === 'pagos' && <PagosModule />}
        {activeTab === 'cargos' && <CargosModule />}
        {activeTab === 'egresos' && <EgresosModule />}
        {activeTab === 'reportes' && <ReportesModule />}
      </AppShell.Main>

      <Modal opened={openedDbLoadModal} onClose={closeDbLoadModal} title="Importar Base de Datos">
        <Text>Seleccione un archivo .db para importar. Esto reemplazará la base de datos actual.</Text>
        <input type="file" accept=".db" onChange={handleFileOpen} />
      </Modal>

      <Modal opened={openedClearModal} onClose={closeClearModal} title="Limpiar Base de Datos">
        <Text color="red" fw={600}>
          ¿Está seguro de que desea eliminar todos los datos? Esta acción no se puede deshacer.
        </Text>
        <Text mt="sm">Se creará una base de datos vacía.</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeClearModal}>Cancelar</Button>
          <Button color="red" onClick={handleClearDb}>Limpiar</Button>
        </Group>
      </Modal>
    </AppShell>
  );
}

export default App;
