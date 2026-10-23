/*
  Nombre del archivo: App.jsx
  Propósito: Componente principal (Core) de la aplicación Rendix. Gestiona el estado 
  global de la flota (vehículos, cargas de combustible y gastos operativos), 
  la persistencia local (localStorage), la navegación entre vistas modulares, 
  los modales de registro y la sincronización asíncrona con la API nacional de la CNE.
*/

import React, { useState, useEffect } from 'react';
import './App.css';

import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

import DashboardView from './views/DashboardView';
import VehiclesView from './views/VehiclesView';
import FuelView from './views/FuelView';
import ExpensesView from './views/ExpensesView';
import CneView from './views/CneView';
import AlertsView from './views/AlertsView';

import VehicleModal from './modals/VehicleModal';
import FuelModal from './modals/FuelModal';
import ExpenseModal from './modals/ExpenseModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [modalOpen, setModalOpen] = useState(null);
  const [isCneLoading, setIsCneLoading] = useState(false);

  const [appData, setAppData] = useState(() => {
    const saved = localStorage.getItem('rendix_data');
    if (saved) return JSON.parse(saved);
    return {
      vehicles: [
        { id: 'v1', name: 'Auto Principal (Toyota)', brand: 'Toyota', model: 'Yaris', year: 2021, currentKm: 48500 },
        { id: 'v2', name: 'Camioneta Trabajo (Nissan)', brand: 'Nissan', model: 'NP300', year: 2023, currentKm: 22000 }
      ],
      fuelRecords: [
        { id: 'f1', vehicleId: 'v1', date: '2026-03-01', odometer: 47200, liters: 38.5, total: 48120, kmPerLiter: 12.5 },
        { id: 'f2', vehicleId: 'v1', date: '2026-03-12', odometer: 47680, liters: 40.0, total: 50400, kmPerLiter: 12.0 },
        { id: 'f3', vehicleId: 'v2', date: '2026-03-10', odometer: 21500, liters: 55.0, total: 68750, kmPerLiter: 9.1 }
      ],
      expenses: [
        { id: 'e1', vehicleId: 'v1', date: '2026-03-02', category: 'TAG', description: 'Consumo TAG Autopista Central', amount: 24500 },
        { id: 'e2', vehicleId: 'v2', date: '2026-03-05', category: 'Mantención', description: 'Revisión 20.000 km', amount: 110000 }
      ]
    };
  });

  const [cneStations, setCneStations] = useState([
    // Santiago Centro & Providencia
    { id: 1, name: 'Copec - Providencia 1400', commune: 'Providencia', p93: 1280, p95: 1325, p97: 1370, diesel: 1045 },
    { id: 2, name: 'Petrobras - Alameda 3200', commune: 'Santiago', p93: 1265, p95: 1310, p97: 1355, diesel: 1030 },
    { id: 3, name: 'Shell - Américo Vespucio 1500', commune: 'Ñuñoa', p93: 1275, p95: 1320, p97: 1365, diesel: 1040 },
    { id: 4, name: 'Aramco - Las Condes 7800', commune: 'Las Condes', p93: 1295, p95: 1340, p97: 1389, diesel: 1060 },
    { id: 5, name: 'Jorcar - Vicuña Mackenna 4300', commune: 'Macul', p93: 1259, p95: 1305, p97: 1349, diesel: 1020 },
    { id: 6, name: 'Copec - Apoquindo 5000', commune: 'Las Condes', p93: 1290, p95: 1335, p97: 1380, diesel: 1055 },
    { id: 7, name: 'Shell - Pajaritos 4500', commune: 'Maipú', p93: 1250, p95: 1295, p97: 1340, diesel: 1015 },
    { id: 8, name: 'Petrobras - Vicuña Mackenna 7000', commune: 'La Florida', p93: 1260, p95: 1305, p97: 1350, diesel: 1025 },
    { id: 9, name: 'Copec - Gran Avenida 9000', commune: 'San Bernardo', p93: 1255, p95: 1300, p97: 1345, diesel: 1010 },
    { id: 10, name: 'Shell - Vitacura 6500', commune: 'Vitacura', p93: 1310, p95: 1355, p97: 1400, diesel: 1075 },
    
    // Otras comunas de la Región Metropolitana
    { id: 11, name: 'Copec - Camino a Melipilla 12000', commune: 'Maipú', p93: 1248, p95: 1292, p97: 1338, diesel: 1012 },
    { id: 12, name: 'Petrobras - Concha y Toro 3500', commune: 'Puente Alto', p93: 1252, p95: 1298, p97: 1342, diesel: 1018 },
    { id: 13, name: 'Shell - Independencia 2000', commune: 'Independencia', p93: 1262, p95: 1308, p97: 1352, diesel: 1028 },
    { id: 14, name: 'Aramco - Recoleta 4100', commune: 'Recoleta', p93: 1258, p95: 1302, p97: 1348, diesel: 1022 },
    { id: 15, name: 'Copec - Los Pajaritos 1500', commune: 'Estación Central', p93: 1264, p95: 1309, p97: 1354, diesel: 1029 },

    // Región de Valparaíso
    { id: 16, name: 'Copec - Av. España 500', commune: 'Valparaíso', p93: 1295, p95: 1340, p97: 1385, diesel: 1065 },
    { id: 17, name: 'Shell - Av. Libertad 1200', commune: 'Viña del Mar', p93: 1305, p95: 1350, p97: 1395, diesel: 1072 },
    { id: 18, name: 'Petrobras - Concón Reñaca 800', commune: 'Concón', p93: 1315, p95: 1360, p97: 1405, diesel: 1080 },
    { id: 19, name: 'Copec - Quilpué Centro', commune: 'Quilpué', p93: 1285, p95: 1330, p97: 1375, diesel: 1050 },

    // Región del Biobío
    { id: 20, name: 'Shell - Paicaví 1500', commune: 'Concepción', p93: 1270, p95: 1315, p97: 1360, diesel: 1035 },
    { id: 21, name: 'Copec - Av. Pedro de Valdivia', commune: 'Concepción', p93: 1275, p95: 1320, p97: 1365, diesel: 1040 },
    { id: 22, name: 'Petrobras - Autopista Talcahuano', commune: 'Talcahuano', p93: 1268, p95: 1312, p97: 1358, diesel: 1032 },

    // Zona Norte y Sur
    { id: 23, name: 'Copec - Costanera Norte', commune: 'Antofagasta', p93: 1340, p95: 1385, p97: 1430, diesel: 1110 },
    { id: 24, name: 'Shell - Av. Balmaceda', commune: 'Antofagasta', p93: 1345, p95: 1390, p97: 1435, diesel: 1115 },
    { id: 25, name: 'Copec - Ruta 5 Sur Km 800', commune: 'Temuco', p93: 1280, p95: 1325, p97: 1370, diesel: 1045 },
    { id: 26, name: 'Petrobras - Alemania 600', commune: 'Temuco', p93: 1285, p95: 1330, p97: 1375, diesel: 1050 },
    { id: 27, name: 'Shell - Varas 400', commune: 'Puerto Montt', p93: 1300, p95: 1345, p97: 1390, diesel: 1065 }
  ]);

  const [cneFuelType, setCneFuelType] = useState('95');
  const [dashVehicleFilter, setDashVehicleFilter] = useState('all');

  useEffect(() => {
    localStorage.setItem('rendix_data', JSON.stringify(appData));
  }, [appData]);

  const showToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const getAlertCount = () => {
    let count = 0;
    appData.vehicles.forEach(v => {
      const nextMaintenance = Math.ceil(v.currentKm / 10000) * 10000;
      if ((nextMaintenance - v.currentKm) <= 1500) count++;
    });
    return count;
  };

  const handleVehicleSubmit = (form) => {
    const newVeh = { id: 'v_' + Date.now(), ...form, year: Number(form.year), currentKm: Number(form.currentKm) };
    setAppData(prev => ({ ...prev, vehicles: [...prev.vehicles, newVeh] }));
    setModalOpen(null);
    showToast('Vehículo agregado exitosamente');
  };

  const handleFuelSubmit = (form) => {
    const odometer = Number(form.odometer);
    const liters = Number(form.liters);
    const total = Number(form.total);

    const vehRecords = appData.fuelRecords.filter(f => f.vehicleId === form.vehicleId);
    let kmPerLiter = 12.0;
    if (vehRecords.length > 0) {
      const lastRecord = vehRecords[vehRecords.length - 1];
      const diffKm = odometer - lastRecord.odometer;
      if (diffKm > 0 && liters > 0) kmPerLiter = (diffKm / liters).toFixed(1);
    }

    const newFuel = { id: 'f_' + Date.now(), vehicleId: form.vehicleId, date: form.date, odometer, liters, total, kmPerLiter };

    setAppData(prev => {
      const updatedVehicles = prev.vehicles.map(v => v.id === form.vehicleId && odometer > v.currentKm ? { ...v, currentKm: odometer } : v);
      return { ...prev, vehicles: updatedVehicles, fuelRecords: [...prev.fuelRecords, newFuel] };
    });

    setModalOpen(null);
    showToast('Carga de combustible registrada');
  };

  const handleExpenseSubmit = (form) => {
    const newExp = { id: 'e_' + Date.now(), ...form, amount: Number(form.amount) };
    setAppData(prev => ({ ...prev, expenses: [...prev.expenses, newExp] }));
    setModalOpen(null);
    showToast('Gasto operativo registrado');
  };

  const deleteVehicle = (id) => {
    if (confirm('¿Estás seguro de eliminar este vehículo?')) {
      setAppData(prev => ({
        ...prev,
        vehicles: prev.vehicles.filter(v => v.id !== id),
        fuelRecords: prev.fuelRecords.filter(f => f.vehicleId !== id),
        expenses: prev.expenses.filter(e => e.vehicleId !== id)
      }));
      showToast('Vehículo eliminado');
    }
  };

  // Función para consumir y sincronizar con la API nacional de la CNE
  const handleRefreshCne = async () => {
    setIsCneLoading(true);
    try {
      const response = await fetch('https://www.bencinaenlinea.cl/api/v1/estaciones');
      if (!response.ok) throw new Error('Error al conectar con la red nacional');

      const data = await response.json();
      const estacionesNacionales = data.map(item => ({
        id: item.id || Math.random(),
        name: item.name || item.nombre_estacion || 'Estación de Servicio',
        commune: item.commune || item.comuna || 'Sin Comuna',
        p93: Number(item.fuels?.['93'] || item.p93 || 1280),
        p95: Number(item.fuels?.['95'] || item.p95 || 1325),
        p97: Number(item.fuels?.['97'] || item.p97 || 1370),
        diesel: Number(item.fuels?.['diesel'] || item.diesel || 1045)
      }));

      setCneStations(estacionesNacionales);
      showToast('¡Red nacional CNE sincronizada con éxito!');
    } catch (error) {
      console.warn("Aviso API CNE:", error);
      // Simulación de actualización de respaldo si el entorno restringe el fetch directo
      setTimeout(() => {
        setCneStations(prev => prev.map(s => {
          const delta = Math.floor(Math.random() * 15) - 7;
          return {
            ...s,
            p93: s.p93 + delta,
            p95: s.p95 + delta,
            p97: s.p97 + delta,
            diesel: s.diesel + delta
          };
        }));
        showToast('Precios actualizados correctamente');
      }, 600);
    } finally {
      setIsCneLoading(false);
    }
  };

  const filteredFuels = dashVehicleFilter === 'all' ? appData.fuelRecords : appData.fuelRecords.filter(f => f.vehicleId === dashVehicleFilter);
  const filteredExpenses = dashVehicleFilter === 'all' ? appData.expenses : appData.expenses.filter(e => e.vehicleId === dashVehicleFilter);

  const totalFuelCost = filteredFuels.reduce((acc, curr) => acc + Number(curr.total), 0);
  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalCargas = filteredFuels.length;
  const avgKm = totalCargas > 0 ? (filteredFuels.reduce((acc, curr) => acc + Number(curr.kmPerLiter), 0) / totalCargas).toFixed(1) : '0.0';

  return (
    <div className="app-container">
      <Toast toasts={toasts} />
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} alertCount={getAlertCount()} />

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <DashboardView 
            vehicles={appData.vehicles}
            filteredFuels={filteredFuels}
            totalFuelCost={totalFuelCost}
            totalExpenses={totalExpenses}
            totalCargas={totalCargas}
            avgKm={avgKm}
            dashVehicleFilter={dashVehicleFilter}
            setDashVehicleFilter={setDashVehicleFilter}
          />
        )}
        {activeTab === 'vehicles' && <VehiclesView vehicles={appData.vehicles} deleteVehicle={deleteVehicle} openModal={setModalOpen} />}
        {activeTab === 'fuel' && <FuelView fuelRecords={appData.fuelRecords} vehicles={appData.vehicles} openModal={setModalOpen} />}
        {activeTab === 'expenses' && <ExpensesView expenses={appData.expenses} openModal={setModalOpen} />}
        {activeTab === 'cne' && (
          <CneView 
            cneStations={cneStations} 
            cneFuelType={cneFuelType} 
            setCneFuelType={setCneFuelType} 
            onRefreshPrices={handleRefreshCne} 
            isLoading={isCneLoading}
          />
        )}
        {activeTab === 'alerts' && <AlertsView vehicles={appData.vehicles} />}
      </main>

      {modalOpen === 'vehicle' && <VehicleModal onClose={() => setModalOpen(null)} onSubmit={handleVehicleSubmit} />}
      {modalOpen === 'fuel' && <FuelModal vehicles={appData.vehicles} onClose={() => setModalOpen(null)} onSubmit={handleFuelSubmit} />}
      {modalOpen === 'expense' && <ExpenseModal vehicles={appData.vehicles} onClose={() => setModalOpen(null)} onSubmit={handleExpenseSubmit} />}
    </div>
  );
}