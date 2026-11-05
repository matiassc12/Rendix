/*
  Nombre del archivo: App.jsx
  Propósito: Componente principal de RendixApp con layout unificado y control de sesión.
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
import TripView from './views/TripView';

import VehicleModal from './modals/VehicleModal';
import FuelModal from './modals/FuelModal';
import ExpenseModal from './modals/ExpenseModal';
import ServiceModal from './modals/ServiceModal';
import AnalyticsModal from './modals/AnalyticsModal';

export default function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  
  const [theme, setTheme] = useState('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [modalState, setModalState] = useState({ type: null, data: null });
  const [isCneLoading, setIsCneLoading] = useState(false);

  const [vehicles, setVehicles] = useState([]);
  const [fuelRecords, setFuelRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [cneStations, setCneStations] = useState([]);

  const [dashVehicleFilter, setDashVehicleFilter] = useState('all');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchUserVehicles();
      fetchFuelRecords();
      fetchExpenses();
      fetchCneStations();
    }
  }, [session]);

  const fetchUserVehicles = async () => {
    // 🔧 CORRECCIÓN: El select('*') garantiza que se traigan las nuevas columnas de archivos
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
        image_url: v.image_url || '',
        last_service_km: Number(v.last_service_km || 0),
        last_service_date: v.last_service_date || '',
        
        // Fechas
        soap_expiration: v.soap_expiration || '',
        permiso_circulacion_expiration: v.permiso_circulacion_expiration || '',
        revision_tecnica_expiration: v.revision_tecnica_expiration || '',
        seguro_privado_expiration: v.seguro_privado_expiration || '',
        licencia_conducir_expiration: v.licencia_conducir_expiration || '',
        
        // 🔧 CORRECCIÓN: Ahora incluimos explícitamente los campos de archivos adjuntos
        soap_file: v.soap_file || '',
        permiso_file: v.permiso_file || '',
        revision_file: v.revision_file || '',
        seguro_file: v.seguro_file || '',
        licencia_file: v.licencia_file || ''
      }));
      setVehicles(formatted);
    } else if (error) {
      console.error('Error fetching vehicles:', error);
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

  const fetchCneStations = async () => {
    setIsCneLoading(true);
    try {
      const { data, error } = await supabase.from('cne_stations').select('*').order('commune', { ascending: true });
      if (!error && data && data.length > 0) setCneStations(data);
    } catch (err) {
      console.error('Error al obtener cne_stations:', err);
    } finally {
      setIsCneLoading(false);
    }
  };

  const showToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const closeModal = () => setModalState({ type: null, data: null });
  const openModal = (type, data = null) => setModalState({ type, data });

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
      image_url: form.image_url || null
    };
    if (form.id) {
      await supabase.from('user_vehicles').update(payload).eq('id', form.id);
      showToast('✨ Vehículo actualizado');
    } else {
      await supabase.from('user_vehicles').insert([payload]);
      showToast('🎉 Vehículo registrado');
    }
    fetchUserVehicles();
    closeModal();
  };

  const deleteVehicle = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este vehículo?')) {
      await supabase.from('user_vehicles').delete().eq('id', id);
      fetchUserVehicles();
      fetchFuelRecords();
      fetchExpenses();
      showToast('🗑️ Vehículo eliminado');
    }
  };

  const handleFuelSubmit = async (form) => {
    if (!session) return;
    const payload = {
      user_id: session.user.id,
      vehicle_id: form.vehicle_id || form.vehicleId,
      date: form.date || new Date().toISOString().split('T')[0],
      liters: Number(form.liters || 0),
      total: Number(form.total || 0),
      odometer: Number(form.odometer || form.currentKm || 0),
      fuel_type: form.fuel_type || '95',
      station: form.station || ''
    };
    const { data } = await supabase.from('fuel_records').insert([payload]).select();
    if (data) setFuelRecords(prev => [data[0], ...prev]);
    showToast('⛽ Carga registrada');
    closeModal();
  };

  const handleDeleteFuel = async (id) => {
    if (window.confirm('¿Eliminar carga?')) {
      await supabase.from('fuel_records').delete().eq('id', id);
      setFuelRecords(prev => prev.filter(item => item.id !== id));
      showToast('🗑️ Carga eliminada');
    }
  };

  const handleExpenseSubmit = async (form) => {
    if (!session) return;
    const payload = {
      user_id: session.user.id,
      vehicle_id: form.vehicle_id || form.vehicleId,
      date: form.date || new Date().toISOString().split('T')[0],
      amount: Number(form.amount || 0),
      category: form.category || 'Otros',
      description: form.description || ''
    };
    const { data } = await supabase.from('expenses').insert([payload]).select();
    if (data) setExpenses(prev => [data[0], ...prev]);
    showToast('💰 Gasto registrado');
    closeModal();
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('¿Eliminar gasto?')) {
      await supabase.from('expenses').delete().eq('id', id);
      setExpenses(prev => prev.filter(item => item.id !== id));
      showToast('🗑️ Gasto eliminado');
    }
  };

  const handleServiceSubmit = async (form) => {
    if (!session) return;
    await supabase.from('user_vehicles').update({
      last_service_date: form.last_service_date,
      last_service_km: form.last_service_km
    }).eq('id', form.vehicleId);
    fetchUserVehicles();
    closeModal();
    showToast('🔧 Mantención registrada');
  };

  // 🔧 CORRECCIÓN: Función robusta para guardar y refrescar
  const handleSaveDocuments = async (vehicleId, updatedDocs) => {
    if (!session) return;
    
    try {
      const { error } = await supabase
        .from('user_vehicles')
        .update(updatedDocs)
        .eq('id', vehicleId);
      
      if (error) {
        console.error('Error al guardar documentos en Supabase:', error);
        alert(`❌ Error al guardar: ${error.message}`);
      } else {
        await fetchUserVehicles();
        showToast('✨ Billetera digital guardada en la nube');
      }
    } catch (err) {
      console.error('Error al guardar Billetera:', err);
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

  const calculateCostPerKm = () => {
    if (!filteredFuels || filteredFuels.length === 0) return '0';
    const recordsByVehicle = {};
    filteredFuels.forEach(r => {
      const vId = r.vehicle_id || r.vehicleId;
      if (!vId) return;
      if (!recordsByVehicle[vId]) recordsByVehicle[vId] = [];
      recordsByVehicle[vId].push(r);
    });

    let totalKmTraveled = 0;
    Object.values(recordsByVehicle).forEach(vRecords => {
      if (vRecords.length < 2) return;
      const sorted = [...vRecords].sort((a, b) => Number(a.odometer) - Number(b.odometer));
      const kmDiff = Number(sorted[sorted.length - 1].odometer) - Number(sorted[0].odometer);
      if (kmDiff > 0) totalKmTraveled += kmDiff;
    });

    if (totalKmTraveled === 0) return '0';
    const grandTotalCost = totalFuelCost + totalExpenses;
    return Math.round(grandTotalCost / totalKmTraveled).toLocaleString('es-CL');
  };

  if (!session) {
    return <Auth onLoginSuccess={(sess) => { setSession(sess); showToast('🔐 ¡Bienvenido!'); }} />;
  }

  return (
    <div className="app-container">
      <Toast toasts={toasts} />

      <div className="mobile-topbar">
        <button 
          onClick={() => setMobileMenuOpen(prev => !prev)} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '22px', cursor: 'pointer' }}
        >
          ☰
        </button>
        <div style={{ fontWeight: '900', fontSize: '16px', color: 'var(--text-primary)' }}>
          Rendix<span style={{ color: '#38bdf8' }}>App</span>
        </div>
        <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer' }}>
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        alertCount={getAlertCount()} 
        theme={theme}
        toggleTheme={toggleTheme}
        isOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
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
            costPerKm={calculateCostPerKm()}
            dashVehicleFilter={dashVehicleFilter}
            setDashVehicleFilter={setDashVehicleFilter}
            setActiveTab={setActiveTab}
            openAnalyticsModal={() => openModal('analytics')}
          />
        )}
        {activeTab === 'vehicles' && <VehiclesView vehicles={vehicles} deleteVehicle={deleteVehicle} openModal={(v) => openModal('vehicle', v)} />}
        {activeTab === 'documents' && <DocumentsView vehicles={vehicles} onSaveDocuments={handleSaveDocuments} />}
        {activeTab === 'trip' && <TripView vehicles={vehicles} fuelRecords={fuelRecords} />}
        {activeTab === 'fuel' && <FuelView fuelRecords={fuelRecords} vehicles={vehicles} openModal={() => openModal('fuel')} onDeleteFuel={handleDeleteFuel} />}
        {activeTab === 'expenses' && <ExpensesView expenses={expenses} vehicles={vehicles} openModal={() => openModal('expense')} onDeleteExpense={handleDeleteExpense} />}
        {activeTab === 'cne' && <CneView cneStations={cneStations} isLoading={isCneLoading} onReload={fetchCneStations} />}
        {activeTab === 'alerts' && <AlertsView vehicles={vehicles} openServiceModal={(vehicle) => openModal('service', vehicle)} />}
      </main>

      {modalState.type === 'vehicle' && <VehicleModal editingVehicle={modalState.data} onClose={closeModal} onSubmit={handleVehicleSubmit} />}
      {modalState.type === 'fuel' && <FuelModal vehicles={vehicles} onClose={closeModal} onSubmit={handleFuelSubmit} />}
      {modalState.type === 'expense' && <ExpenseModal vehicles={vehicles} onClose={closeModal} onSubmit={handleExpenseSubmit} />}
      {modalState.type === 'service' && <ServiceModal vehicle={modalState.data} onClose={closeModal} onSubmit={handleServiceSubmit} />}
      {modalState.type === 'analytics' && <AnalyticsModal fuelRecords={fuelRecords} expenses={expenses} onClose={closeModal} />}
    </div>
  );
}