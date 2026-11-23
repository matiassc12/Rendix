/*
  Nombre del archivo: App.jsx
  Propósito: Componente principal de RendixApp con layout unificado, control de sesión,
  rendimiento manual por vehículo y sincronización con Supabase + API CNE.
*/

import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './supabaseClient';
import { fetchRealCnePrices } from './services/cneService';
import {
  calculateFleetAverageEfficiency,
  getManualEfficiency
} from './utils/efficiencyHelper';

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

const getTodayLocalISO = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDaysUntilExpiration = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
  if (!y || !m || !d) return null;
  const expDate = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
};

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
    } else {
      setVehicles([]);
      setFuelRecords([]);
      setExpenses([]);
      setDashVehicleFilter('all');
    }
  }, [session]);

  useEffect(() => {
    if (
      session &&
      (activeTab === 'cne' || activeTab === 'fuel') &&
      cneStations.length === 0 &&
      !isCneLoading
    ) {
      fetchCneStations(false);
    }
  }, [session, activeTab]);

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
        image_url: v.image_url || '',
        manual_efficiency: v.manual_efficiency ? Number(v.manual_efficiency) : '',
        last_service_km: Number(v.last_service_km || 0),
        last_service_date: v.last_service_date || '',

        soap_expiration: v.soap_expiration || '',
        permiso_circulacion_expiration: v.permiso_circulacion_expiration || '',
        revision_tecnica_expiration: v.revision_tecnica_expiration || '',
        seguro_privado_expiration: v.seguro_privado_expiration || '',
        licencia_conducir_expiration: v.licencia_conducir_expiration || '',

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
    const { data, error } = await supabase
      .from('fuel_records')
      .select('*')
      .order('date', { ascending: false });
    if (!error && data) setFuelRecords(data);
  };

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    if (!error && data) setExpenses(data);
  };

  const fetchCneStations = async (forceRetry = false) => {
    setIsCneLoading(true);
    try {
      if (cneStations.length === 0) {
        const { data, error } = await supabase
          .from('cne_stations')
          .select('*')
          .order('commune', { ascending: true });

        if (!error && data && data.length > 0) {
          setCneStations(data);
        }
      }

      const liveStations = await fetchRealCnePrices({
        regionFilter: 'Metropolitana',
        forceRetry
      });

      if (liveStations && liveStations.length > 0) {
        setCneStations(liveStations);
        if (forceRetry) showToast('✅ Precios actualizados desde API CNE');
      } else if (forceRetry) {
        showToast('⚠️ API CNE temporalmente saturada; mostrando respaldo en nube');
      }
    } catch (err) {
      console.error('Error al obtener estaciones CNE:', err);
    } finally {
      setIsCneLoading(false);
    }
  };

  const showToast = (message) => {
    const id = Date.now() + Math.random();
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
      current_km: Number(form.currentKm || 0),
      plate: form.plate ? form.plate.trim().toUpperCase() : 'SIN PATENTE',
      image_url: form.image_url || null,
      manual_efficiency:
        form.manual_efficiency && Number(form.manual_efficiency) > 0
          ? Number(form.manual_efficiency)
          : null
    };

    const { error } = form.id
      ? await supabase
          .from('user_vehicles')
          .update(payload)
          .eq('id', form.id)
          .eq('user_id', session.user.id)
      : await supabase.from('user_vehicles').insert([payload]);

    if (error) {
      console.error('Error guardando vehículo:', error);
      showToast(`❌ Error al guardar vehículo: ${error.message}`);
      return;
    }

    showToast(form.id ? '✨ Vehículo actualizado' : '🎉 Vehículo registrado');
    await fetchUserVehicles();
    closeModal();
  };

  const handleUpdateManualEfficiency = async (vehicleId, manualEfficiency) => {
    if (!session) return;
    const val = manualEfficiency && Number(manualEfficiency) > 0 ? Number(manualEfficiency) : null;
    const { error } = await supabase
      .from('user_vehicles')
      .update({ manual_efficiency: val })
      .eq('id', vehicleId)
      .eq('user_id', session.user.id);

    if (!error) {
      setVehicles(prev =>
        prev.map(v => (v.id === vehicleId ? { ...v, manual_efficiency: val || '' } : v))
      );
      showToast('✅ Rendimiento actualizado');
    } else {
      console.error('Error al actualizar rendimiento manual:', error);
      showToast('❌ No se pudo guardar el rendimiento');
    }
  };

  const deleteVehicle = async (id) => {
    if (!session) return;
    if (window.confirm('¿Estás seguro de eliminar este vehículo?')) {
      const { error } = await supabase
        .from('user_vehicles')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error eliminando vehículo:', error);
        showToast('❌ No se pudo eliminar el vehículo');
        return;
      }

      if (dashVehicleFilter === id) {
        setDashVehicleFilter('all');
      }
      await Promise.all([fetchUserVehicles(), fetchFuelRecords(), fetchExpenses()]);
      showToast('🗑️ Vehículo eliminado');
    }
  };

  const handleFuelSubmit = async (form) => {
    if (!session) return;
    const vehicleId = form.vehicle_id || form.vehicleId;
    if (!vehicleId) {
      showToast('⚠️ Selecciona un vehículo');
      return;
    }

    const odoVal = form.odometer && Number(form.odometer) > 0 ? Number(form.odometer) : null;

    const payload = {
      user_id: session.user.id,
      vehicle_id: vehicleId,
      date: form.date || getTodayLocalISO(),
      liters: Number(form.liters || 0),
      total: Number(form.total || 0),
      odometer: odoVal,
      fuel_type: form.fuel_type || '95',
      station: form.station || '',
      is_full_tank: form.is_full_tank ?? true
    };

    const { data, error } = await supabase.from('fuel_records').insert([payload]).select();
    if (error) {
      console.error('Error registrando carga:', error);
      showToast(`❌ Error al registrar carga: ${error.message}`);
      return;
    }

    if (data && data[0]) {
      setFuelRecords(prev => [data[0], ...prev]);
    }

    // Sincronizar current_km del vehículo si el odómetro registrado es mayor
    const targetVehicle = vehicles.find(v => v.id === vehicleId);
    if (odoVal && targetVehicle && odoVal > Number(targetVehicle.currentKm || 0)) {
      const { error: kmError } = await supabase
        .from('user_vehicles')
        .update({ current_km: odoVal })
        .eq('id', vehicleId)
        .eq('user_id', session.user.id);

      if (!kmError) {
        setVehicles(prev =>
          prev.map(v => (v.id === vehicleId ? { ...v, currentKm: odoVal } : v))
        );
      }
    }

    showToast('⛽ Carga registrada');
    closeModal();
  };

  const handleDeleteFuel = async (id) => {
    if (!session) return;
    if (window.confirm('¿Eliminar carga?')) {
      const { error } = await supabase
        .from('fuel_records')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        showToast('❌ Error al eliminar carga');
        return;
      }

      setFuelRecords(prev => prev.filter(item => item.id !== id));
      showToast('🗑️ Carga eliminada');
    }
  };

  const handleExpenseSubmit = async (form) => {
    if (!session) return;
    const payload = {
      user_id: session.user.id,
      vehicle_id: form.vehicle_id || form.vehicleId,
      date: form.date || getTodayLocalISO(),
      amount: Number(form.amount || 0),
      category: form.category || 'Otros',
      description: form.description || ''
    };

    const { data, error } = await supabase.from('expenses').insert([payload]).select();
    if (error) {
      console.error('Error registrando gasto:', error);
      showToast(`❌ Error al registrar gasto: ${error.message}`);
      return;
    }

    if (data && data[0]) {
      setExpenses(prev => [data[0], ...prev]);
    }
    showToast('💰 Gasto registrado');
    closeModal();
  };

  const handleDeleteExpense = async (id) => {
    if (!session) return;
    if (window.confirm('¿Eliminar gasto?')) {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        showToast('❌ Error al eliminar gasto');
        return;
      }

      setExpenses(prev => prev.filter(item => item.id !== id));
      showToast('🗑️ Gasto eliminado');
    }
  };

  const handleServiceSubmit = async (form) => {
    if (!session) return;
    const vehicleId = form.vehicleId || form.vehicle_id;
    const serviceKm = Number(form.last_service_km || 0);
    const serviceDate = form.last_service_date || getTodayLocalISO();

    const targetVehicle = vehicles.find(v => v.id === vehicleId);
    const updatePayload = {
      last_service_date: serviceDate,
      last_service_km: serviceKm,
      ...(serviceKm > Number(targetVehicle?.currentKm || 0) ? { current_km: serviceKm } : {})
    };

    const { error } = await supabase
      .from('user_vehicles')
      .update(updatePayload)
      .eq('id', vehicleId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error registrando mantención:', error);
      showToast(`❌ Error al registrar mantención: ${error.message}`);
      return;
    }

    // Si el modal envía costo asociado, registrarlo también en gastos
    const serviceCost = Number(form.cost || form.amount || 0);
    if (serviceCost > 0) {
      const { data: expData } = await supabase
        .from('expenses')
        .insert([
          {
            user_id: session.user.id,
            vehicle_id: vehicleId,
            date: serviceDate,
            amount: serviceCost,
            category: 'Mantención',
            description: form.description || `Mantención ${serviceKm.toLocaleString('es-CL')} km`
          }
        ])
        .select();

      if (expData && expData[0]) {
        setExpenses(prev => [expData[0], ...prev]);
      }
    }

    await fetchUserVehicles();
    closeModal();
    showToast('🔧 Mantención registrada');
  };

  const handleSaveDocuments = async (vehicleId, updatedDocs) => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('user_vehicles')
        .update(updatedDocs)
        .eq('id', vehicleId)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error al guardar documentos en Supabase:', error);
        showToast(`❌ Error al guardar: ${error.message}`);
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
      const nextServiceKm =
        lastServiceKm > 0
          ? lastServiceKm + intervalKm
          : Math.ceil((currentKm + 1) / intervalKm) * intervalKm;
      const remainingKm = nextServiceKm - currentKm;

      if (lastServiceKm > 0 && remainingKm <= 1500) count++;
      const docs = [
        v.soap_expiration,
        v.permiso_circulacion_expiration,
        v.revision_tecnica_expiration,
        v.seguro_privado_expiration,
        v.licencia_conducir_expiration
      ];
      docs.forEach(dateStr => {
        const daysLeft = getDaysUntilExpiration(dateStr);
        if (daysLeft !== null && daysLeft <= 30) count++;
      });
    });
    return count;
  };

  const filteredVehicles =
    dashVehicleFilter === 'all'
      ? vehicles
      : vehicles.filter(v => v.id === dashVehicleFilter);
  const filteredFuels =
    dashVehicleFilter === 'all'
      ? fuelRecords
      : fuelRecords.filter(f => (f.vehicle_id || f.vehicleId) === dashVehicleFilter);
  const filteredExpenses =
    dashVehicleFilter === 'all'
      ? expenses
      : expenses.filter(e => (e.vehicle_id || e.vehicleId) === dashVehicleFilter);

  const totalFuelCost = filteredFuels.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalCargas = filteredFuels.length;

  const avgKm = calculateFleetAverageEfficiency(filteredVehicles);

  const calculateCostPerKm = () => {
    if (!filteredFuels || filteredFuels.length === 0) return '0';

    // 1. Estimar kilómetros recorridos usando (litros cargados * rendimiento manual km/L)
    let estimatedKm = 0;
    filteredFuels.forEach(r => {
      const vId = r.vehicle_id || r.vehicleId;
      const vehicle = vehicles.find(v => v.id === vId);
      const manualKmL = getManualEfficiency(vehicle);
      const liters = Number(r.liters || 0);
      if (manualKmL > 0 && liters > 0) {
        estimatedKm += liters * manualKmL;
      }
    });

    // 2. Respaldo por diferencia de odómetro si no hay rendimiento manual configurado
    if (estimatedKm === 0) {
      const recordsByVehicle = {};
      filteredFuels.forEach(r => {
        const vId = r.vehicle_id || r.vehicleId;
        const odo = Number(r.odometer || 0);
        if (!vId || odo <= 0) return;
        if (!recordsByVehicle[vId]) recordsByVehicle[vId] = [];
        recordsByVehicle[vId].push(r);
      });

      Object.values(recordsByVehicle).forEach(vRecords => {
        if (vRecords.length < 2) return;
        const sorted = [...vRecords].sort((a, b) => Number(a.odometer) - Number(b.odometer));
        const kmDiff = Number(sorted[sorted.length - 1].odometer) - Number(sorted[0].odometer);
        if (kmDiff > 0) estimatedKm += kmDiff;
      });
    }

    if (estimatedKm <= 0) return '0';
    const grandTotalCost = totalFuelCost + totalExpenses;
    return Math.round(grandTotalCost / estimatedKm).toLocaleString('es-CL');
  };

  if (!session) {
    return (
      <Auth
        onLoginSuccess={sess => {
          setSession(sess);
          showToast('🔐 ¡Bienvenido!');
        }}
      />
    );
  }

  return (
    <div className="app-container">
      <Toast toasts={toasts} />

      <div className="mobile-topbar">
        <button
          onClick={() => setMobileMenuOpen(prev => !prev)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '22px',
            cursor: 'pointer'
          }}
        >
          ☰
        </button>
        <div style={{ fontWeight: '900', fontSize: '16px', color: 'var(--text-primary)' }}>
          Rendix<span style={{ color: '#38bdf8' }}>App</span>
        </div>
        <button
          onClick={toggleTheme}
          style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer' }}
        >
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
            filteredVehicles={filteredVehicles}
            filteredFuels={filteredFuels}
            filteredExpenses={filteredExpenses}
            totalFuelCost={totalFuelCost}
            totalExpenses={totalExpenses}
            totalCargas={totalCargas}
            avgKm={avgKm}
            costPerKm={calculateCostPerKm()}
            dashVehicleFilter={dashVehicleFilter}
            setDashVehicleFilter={setDashVehicleFilter}
            setActiveTab={setActiveTab}
            openAnalyticsModal={() => openModal('analytics')}
          />
        )}
        {activeTab === 'vehicles' && (
          <VehiclesView
            vehicles={vehicles}
            deleteVehicle={deleteVehicle}
            openModal={v => openModal('vehicle', v)}
            onUpdateManualEfficiency={handleUpdateManualEfficiency}
          />
        )}
        {activeTab === 'documents' && (
          <DocumentsView vehicles={vehicles} onSaveDocuments={handleSaveDocuments} />
        )}
        {activeTab === 'trip' && <TripView vehicles={vehicles} />}
        {activeTab === 'fuel' && (
          <FuelView
            fuelRecords={fuelRecords}
            vehicles={vehicles}
            cneStations={cneStations}
            isCneLoading={isCneLoading}
            openModal={() => openModal('fuel')}
            onDeleteFuel={handleDeleteFuel}
          />
        )}
        {activeTab === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            vehicles={vehicles}
            openModal={() => openModal('expense')}
            onDeleteExpense={handleDeleteExpense}
          />
        )}
        {activeTab === 'cne' && (
          <CneView
            cneStations={cneStations}
            isLoading={isCneLoading}
            onReload={() => fetchCneStations(true)}
          />
        )}
        {activeTab === 'alerts' && (
          <AlertsView
            vehicles={vehicles}
            openServiceModal={vehicle => openModal('service', vehicle)}
          />
        )}
      </main>

      {modalState.type === 'vehicle' && (
        <VehicleModal
          editingVehicle={modalState.data}
          onClose={closeModal}
          onSubmit={handleVehicleSubmit}
        />
      )}
      {modalState.type === 'fuel' && (
        <FuelModal
          vehicles={vehicles}
          onClose={closeModal}
          onSubmit={handleFuelSubmit}
        />
      )}
      {modalState.type === 'expense' && (
        <ExpenseModal
          vehicles={vehicles}
          onClose={closeModal}
          onSubmit={handleExpenseSubmit}
        />
      )}
      {modalState.type === 'service' && (
        <ServiceModal
          vehicle={modalState.data}
          onClose={closeModal}
          onSubmit={handleServiceSubmit}
        />
      )}
      {modalState.type === 'analytics' && (
        <AnalyticsModal
          fuelRecords={fuelRecords}
          expenses={expenses}
          onClose={closeModal}
        />
      )}
    </div>
  );
}