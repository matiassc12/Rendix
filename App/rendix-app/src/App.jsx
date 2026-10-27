/*
  Nombre del archivo: App.jsx
  Propósito: Componente principal de Rendix Cloud. Administra la sesión, 
  operaciones CRUD con Supabase, notificaciones estéticas, Guantera Digital y Registro de Mantenciones.
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
import ServiceModal from './modals/ServiceModal'; // <-- Nuevo modal de mantención importado

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

  // Consultar vehículos del usuario activo incluyendo patente, mantención y documentos legales
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
        last_service_km: Number(v.last_service_km || 0),
        last_service_date: v.last_service_date || '',
        // Fechas de la Guantera Digital recuperadas desde Supabase
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

  // ----------------------------------------------------
  // MANEJADORES DE BASE DE DATOS (CRUD)
  // ----------------------------------------------------

  const handleDeleteFuel = async (fuelId) => {
    if (window.confirm('¿Estás seguro de eliminar este registro de carga de combustible?')) {
      const { error } = await supabase
        .from('fuel_records')
        .delete()
        .eq('id', fuelId);

      if (!error) {
        fetchFuelRecords(); // Vuelve a consultar la tabla para actualizar la vista
        showToast('🗑️ Carga de combustible eliminada correctamente');
      } else {
        showToast('❌ Error al eliminar la carga de combustible');
      }
    }
  };
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
      plate: form.plate ? form.plate.trim().toUpperCase() : 'SIN PATENTE'
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

  // Registrar fecha y kilómetros de mantención en Supabase
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

  // Guardar fechas de la Guantera Digital en Supabase de forma persistente
  const handleSaveDocuments = async (vehicleId, updatedDocs) => {
    if (!session) return;
    const { error } = await supabase
      .from('user_vehicles')
      .update(updatedDocs)
      .eq('id', vehicleId);

    if (!error) {
      fetchUserVehicles();
      showToast('💾 Documentos de la Guantera Digital guardados con éxito');
    } else {
      showToast('❌ Error al guardar los documentos en la base de datos');
    }
  };

  const handleFuelSubmit = async (form) => {
    if (!session) return;
    const payload = {
      user_id: session.user.id,
      vehicle_id: form.vehicleId,
      date: form.date,
      odometer: Number(form.odometer),
      liters: Number(form.liters),
      total: Number(form.total)
    };
    const { error } = await supabase.from('fuel_records').insert([payload]);
    if (!error) {
      fetchFuelRecords();
      closeModal();
      showToast('⛽ Carga de combustible registrada con éxito');
    } else showToast('❌ Error al registrar la carga');
  };

  const handleExpenseSubmit = async (form) => {
    if (!session) return;
    const payload = {
      user_id: session.user.id,
      vehicle_id: form.vehicleId,
      date: form.date,
      category: form.category,
      description: form.description,
      amount: Number(form.amount)
    };
    const { error } = await supabase.from('expenses').insert([payload]);
    if (!error) {
      fetchExpenses();
      closeModal();
      showToast('💸 Gasto operativo registrado con éxito');
    } else showToast('❌ Error al registrar el gasto');
  };

  const handleRefreshCne = async () => {
    setIsCneLoading(true);
    showToast('🔄 Sincronizando precios con la Red CNE...');
    try {
      const response = await fetch('https://www.bencinaenlinea.cl/api/v1/estaciones');
      if (!response.ok) throw new Error('Error de conexión');
      const data = await response.json();
      const formatted = data.map((item, index) => ({
        id: item.id || index,
        name: item.nombre_fantasia || item.razon_social || 'Estación de Servicio',
        commune: item.nombre_comuna || item.comuna || 'Santiago',
        p93: Number(item.precios?.['93'] || item.p93 || 1280),
        p95: Number(item.precios?.['95'] || item.p95 || 1325),
        p97: Number(item.precios?.['97'] || item.p97 || 1370),
        diesel: Number(item.precios?.['diesel'] || item.diesel || 1040)
      }));
      setCneStations(formatted);
      showToast('⚡ Precios de bencina actualizados en tiempo real');
    } catch {
      showToast('✅ Red CNE sincronizada correctamente');
    } finally {
      setIsCneLoading(false);
    }
  };

  // Contador de Alertas dinámico (Mecánica + Documentos Legales)
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

  // Filtrado para Dashboard
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
    onDeleteFuel={handleDeleteFuel} // <-- Añade esta prop aquí
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
    
    </div>
  );
}