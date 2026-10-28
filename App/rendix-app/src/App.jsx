/*
  Nombre del archivo: App.jsx
  Propósito: Componente principal de Rendix Cloud. Administra la sesión, 
  operaciones CRUD con Supabase, notificaciones estéticas, Guantera Digital, 
  Registro de Mantenciones, fotos de vehículos y Analítica.
*/

import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './supabaseClient';

import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

import DashboardView from './views/DashboardView';
import VehiclesView from './views/VehiclesView';
import FuelView from './views/FuelView';
import ExpensesView from './views/ExpensesView';
import CneView from './views/CneView';
import AlertsView from './views/AlertsView';
import DocumentsView from './views/DocumentsView'; 

import VehicleModal from './modals/VehicleModal';
import FuelModal from './modals/FuelModal';
import ExpenseModal from './modals/ExpenseModal';
import ServiceModal from './modals/ServiceModal';
import AnalyticsModal from './modals/AnalyticsModal';

export default function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  
  // Control de estado para modales
  const [modalState, setModalState] = useState({ type: null, data: null });
  const [isCneLoading, setIsCneLoading] = useState(false);

  // Estados sincronizados con Supabase
  const [vehicles, setVehicles] = useState([]);
  const [fuelRecords, setFuelRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Lista inicial de respaldo para la Red CNE
  const [cneStations, setCneStations] = useState([
    { id: 1, name: 'Copec - Providencia 1400', commune: 'Providencia', p93: 1280, p95: 1325, p97: 1370, diesel: 1045 },
    { id: 2, name: 'Petrobras - Alameda 3200', commune: 'Santiago', p93: 1265, p95: 1310, p97: 1355, diesel: 1030 },
    { id: 3, name: 'Shell - Américo Vespucio 1500', commune: 'Ñuñoa', p93: 1275, p95: 1320, p97: 1365, diesel: 1040 }
  ]);

  const [cneFuelType, setCneFuelType] = useState('95');
  const [dashVehicleFilter, setDashVehicleFilter] = useState('all');

  // Control de Sesión con Supabase Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cargar datos desde Supabase al iniciar sesión
  useEffect(() => {
    if (session) {
      fetchUserVehicles();
      fetchFuelRecords();
      fetchExpenses();
    }
  }, [session]);

  const fetchUserVehicles = async () => {
    const { data, error } = await supabase
      .from('user_vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formatted = data.map(v => ({
        id: v.id,
        name: v.custom_name,
        brand: v.brand || 'Sin marca',
        model: v.model || 'Sin modelo',
        year: v.year || new Date().getFullYear(),
        color: v.color || '#4f46e5',
        currentKm: Number(v.current_km || 0),
        plate: v.plate || 'SIN PATENTE',
        image_url: v.image_url || '', // Imagen / Foto del vehículo
        last_service_km: Number(v.last_service_km || 0),
        last_service_date: v.last_service_date || '',
        soap_expiration: v.soap_expiration || '',
        permiso_circulacion_expiration: v.permiso_circulacion_expiration || '',
        revision_tecnica_expiration: v.revision_tecnica_expiration || '',
        seguro_privado_expiration: v.seguro_privado_expiration || '',
        licencia_conducir_expiration: v.licencia_conducir_expiration || ''
      }));
      setVehicles(formatted);
    }
  };

  const fetchFuelRecords = async () => {
    const { data, error } = await supabase.from('fuel_records').select('*').order('date', { ascending: false });
    if (!error && data) setFuelRecords(data);
  };

  const fetchExpenses = async () => {
    const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (!error && data) setExpenses(data);
  };

  // Sistema de Notificaciones Estéticas (Toasts)
  const showToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const closeModal = () => setModalState({ type: null, data: null });
  const openModal = (type, data = null) => {
    setModalState({ type, data });
  };

  // CRUD Manejadores
  const handleVehicleSubmit = async (form) => {
    if (!session) return;
    const payload = {
      user_id: session.user.id,
      global_vehicle_id: form.global_vehicle_id || null,
      custom_name: form.name,
      brand: form.brand,
      model: form.model,
      year: Number(form.year),
      current_km: Number(form.currentKm),
      plate: form.plate ? form.plate.trim().toUpperCase() : 'SIN PATENTE',
      image_url: form.image_url || null // Guardar la URL de la foto
    };
    if (form.id) {
      const { error } = await supabase.from('user_vehicles').update(payload).eq('id', form.id);
      if (!error) showToast('✨ Vehículo actualizado correctamente');
      else showToast('❌ Error al actualizar el vehículo');
    } else {
      const { error } = await supabase.from('user_vehicles').insert([payload]);
      if (!error) showToast('🎉 Vehículo registrado con éxito en tu garaje');
      else showToast('❌ Error al registrar el vehículo');
    }
    fetchUserVehicles();
    closeModal();
  };

  const deleteVehicle = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este vehículo?')) {
      const { error } = await supabase.from('user_vehicles').delete().eq('id', id);
      if (!error) {
        fetchUserVehicles();
        fetchFuelRecords();
        fetchExpenses();
        showToast('🗑️ Vehículo eliminado correctamente');
      } else showToast('❌ Error al eliminar el vehículo');
    }
  };

  const handleServiceSubmit = async (form) => {
    if (!session) return;
    const { error } = await supabase
      .from('user_vehicles')
      .update({
        last_service_date: form.last_service_date,
        last_service_km: form.last_service_km
      })
      .eq('id', form.vehicleId);

    if (!error) {
      fetchUserVehicles();
      closeModal();
      showToast('🔧 ¡Mantención registrada correctamente!');
    } else {
      showToast('❌ Error al registrar la mantención');
    }
  };

const handleSaveDocuments = async (vehicleId, updatedDocs) => {
    if (!session) return;
    
    const { error } = await supabase
      .from('user_vehicles')
      .update(updatedDocs)
      .eq('id', vehicleId);

    if (!error) {
      fetchUserVehicles();
      showToast('💾 Documentos guardados con éxito');
    } else {
      console.error('Error al guardar en Supabase:', error);
      showToast(`❌ Error: ${error.message || 'No se pudo guardar'}`);
    }
  };

 const handleRefreshCne = async () => {
    setIsCneLoading(true);
    showToast('🔄 Consultando Red CNE vía Supabase Edge...');

    try {
      const { data, error } = await supabase.functions.invoke('quick-processor');

      if (error) {
        throw new Error(error.message || 'Error al conectar con Supabase Edge');
      }

      // Si la función devuelve un error controlado de la CNE
      if (data?.error) {
        throw new Error(data.error);
      }

      const rawList = Array.isArray(data) ? data : (data?.estaciones || data?.data || []);

      if (rawList.length === 0) {
        throw new Error('La API de CNE no entregó datos de estaciones.');
      }

      // Mapeo oficial unificando Asistido y Autoservicio
      const formatted = rawList.map((item, index) => {
        const prices = item.precios || item.precios_combustible || {};

        const getMinPrice = (...keys) => {
          const valid = keys
            .map(k => Number(prices[k] || item[k] || 0))
            .filter(p => !isNaN(p) && p > 0);
          return valid.length > 0 ? Math.min(...valid) : 0;
        };

        return {
          id: item.id || item.codigo_estacion || index,
          name: item.nombre_fantasia || item.razon_social || item.distribuidor || 'Estación de Servicio',
          brand: item.distribuidor || item.marca || 'Generica',
          address: item.direccion || 'Sin dirección',
          commune: item.nombre_comuna || item.comuna || 'Otra Comuna',
          region: item.nombre_region || item.region || 'Otra Región',
          p93: getMinPrice('1', '8', '93', 'p93', 'A93', 'precio_93'),
          p95: getMinPrice('7', '9', '95', 'p95', 'A95', 'precio_95'),
          p97: getMinPrice('2', '10', '97', 'p97', 'A97', 'precio_97'),
          diesel: getMinPrice('3', '11', 'DI', 'ADI', 'diesel', 'precio_diesel'),
          kerosene: getMinPrice('4', '12', 'KE', 'AKE', 'kerosene', 'precio_kerosene')
        };
      }).filter(s => s.p93 > 0 || s.p95 > 0 || s.p97 > 0 || s.diesel > 0 || s.kerosene > 0);

      setCneStations(formatted);
      showToast(`⚡ ${formatted.length.toLocaleString('es-CL')} estaciones sincronizadas en vivo`);

    } catch (err) {
      console.error('Error CNE:', err);
      showToast(`❌ ${err.message || 'Error de conexión con la CNE'}`);
    } finally {
      setIsCneLoading(false);
    }
  };

const handleDeleteFuel = async (id) => {
    try {
      // 1. Eliminar de Supabase
      const { error } = await supabase
        .from('fuel_logs') // Ajusta el nombre de la tabla si en tu BD se llama 'fuels' o similar
        .delete()
        .eq('id', id);

      if (error) throw error;

      // 2. Actualizar estado local (ajusta setFuels según el nombre de tu estado, ej: setFuelRecords)
      setFuels(prev => prev.filter(item => item.id !== id));
      showToast('🗑️ Carga de bencina eliminada');

    } catch (err) {
      console.error('Error al eliminar carga:', err);
      showToast('❌ Error al eliminar la carga de bencina');
    }
  };
  


const getAlertCount = () => {
    let count = 0;
    vehicles.forEach(v => {
      const currentKm = Number(v.currentKm || 0);
      const lastServiceKm = Number(v.last_service_km || 0);
      const intervalKm = 10000;
      const nextServiceKm = lastServiceKm > 0 ? lastServiceKm + intervalKm : Math.ceil((currentKm + 1) / intervalKm) * intervalKm;
      const remainingKm = nextServiceKm - currentKm;

      if (lastServiceKm > 0 && remainingKm <= 1500) count++;

      const docs = [v.soap_expiration, v.permiso_circulacion_expiration, v.revision_tecnica_expiration, v.seguro_privado_expiration, v.licencia_conducir_expiration];
      docs.forEach(dateStr => {
        if (dateStr && Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24)) <= 30) count++;
      });
    });
    return count;
  };

  const filteredFuels = dashVehicleFilter === 'all' ? fuelRecords : fuelRecords.filter(f => (f.vehicle_id || f.vehicleId) === dashVehicleFilter);
  const filteredExpenses = dashVehicleFilter === 'all' ? expenses : expenses.filter(e => (e.vehicle_id || e.vehicleId) === dashVehicleFilter);
  const totalFuelCost = filteredFuels.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalCargas = filteredFuels.length;

  const calculateAvgKm = () => {
    if (!filteredFuels || filteredFuels.length === 0) return '0.0';
    const recordsByVehicle = {};
    filteredFuels.forEach(r => {
      const vId = r.vehicle_id || r.vehicleId;
      if (!vId) return;
      if (!recordsByVehicle[vId]) recordsByVehicle[vId] = [];
      recordsByVehicle[vId].push(r);
    });

    let totalKmTraveled = 0;
    let totalLitersConsumed = 0;

    Object.values(recordsByVehicle).forEach(vRecords => {
      if (vRecords.length < 2) return;
      const sorted = [...vRecords].sort((a, b) => Number(a.odometer) - Number(b.odometer));
      for (let i = 1; i < sorted.length; i++) {
        const kmDiff = Number(sorted[i].odometer) - Number(sorted[i - 1].odometer);
        const liters = Number(sorted[i].liters);
        if (kmDiff > 0 && liters > 0) {
          totalKmTraveled += kmDiff;
          totalLitersConsumed += liters;
        }
      }
    });
    if (totalLitersConsumed === 0) return '0.0';
    return (totalKmTraveled / totalLitersConsumed).toFixed(1);
  };

  if (!session) {
    return <Auth onLoginSuccess={(sess) => {
      setSession(sess);
      showToast('🔐 ¡Bienvenido de nuevo a Rendix!');
    }} />;
  }

  return (
    <div className="app-container">
      <Toast toasts={toasts} />
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        alertCount={getAlertCount()} 
      />

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <DashboardView 
            vehicles={vehicles}
            filteredFuels={filteredFuels}
            totalFuelCost={totalFuelCost}
            totalExpenses={totalExpenses}
            totalCargas={totalCargas}
            avgKm={calculateAvgKm()}
            dashVehicleFilter={dashVehicleFilter}
            setDashVehicleFilter={setDashVehicleFilter}
            setActiveTab={setActiveTab}
            openAnalyticsModal={() => openModal('analytics')}
          />
        )}
        {activeTab === 'vehicles' && (
          <VehiclesView vehicles={vehicles} deleteVehicle={deleteVehicle} openModal={(v) => openModal('vehicle', v)} />
        )}
        {activeTab === 'documents' && (
          <DocumentsView vehicles={vehicles} onSaveDocuments={handleSaveDocuments} />
        )}
        {activeTab === 'fuel' && (
          <FuelView 
            fuelRecords={fuelRecords} 
            vehicles={vehicles} 
            openModal={() => openModal('fuel')} 
            onDeleteFuel={handleDeleteFuel} 
          />
        )}
        {activeTab === 'expenses' && (
          <ExpensesView expenses={expenses} vehicles={vehicles} openModal={() => openModal('expense')} />
        )}
        {activeTab === 'cne' && (
          <CneView cneStations={cneStations} cneFuelType={cneFuelType} setCneFuelType={setCneFuelType} onRefreshPrices={handleRefreshCne} isLoading={isCneLoading} />
        )}
        {activeTab === 'alerts' && (
          <AlertsView 
            vehicles={vehicles} 
            openServiceModal={(vehicle) => openModal('service', vehicle)} 
          />
        )}
      </main>

      {/* Renderizado de Modales */}
      {modalState.type === 'vehicle' && <VehicleModal editingVehicle={modalState.data} onClose={closeModal} onSubmit={handleVehicleSubmit} />}
      {modalState.type === 'fuel' && <FuelModal vehicles={vehicles} onClose={closeModal} onSubmit={handleFuelSubmit} />}
      {modalState.type === 'expense' && <ExpenseModal vehicles={vehicles} onClose={closeModal} onSubmit={handleExpenseSubmit} />}
      {modalState.type === 'service' && <ServiceModal vehicle={modalState.data} onClose={closeModal} onSubmit={handleServiceSubmit} />}
      {modalState.type === 'analytics' && <AnalyticsModal fuelRecords={fuelRecords} expenses={expenses} onClose={closeModal} />}
    </div>
  );
}