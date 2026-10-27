/*
  Nombre del archivo: Sidebar.jsx
  Propósito: Menú lateral de navegación con indicadores de alertas.
*/

import React from 'react';
import { supabase } from '../supabaseClient';

export default function Sidebar({ activeTab, setActiveTab, alertCount = 0 }) {
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className="sidebar" style={{
      width: '260px',
      backgroundColor: '#0f172a',
      borderRight: '1px solid #1e293b',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      position: 'sticky',
      top: 0,
      height: '100vh',
      boxSizing: 'border-box'
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '32px', paddingLeft: '8px' }}>
        <span style={{ fontSize: '28px' }}>⚡</span>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#f8fafc', fontWeight: '900', tracking: '-1px' }}>
          Rendix
        </h1>
      </div>

      {/* Navegación */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <SidebarButton 
          icon="📊" 
          label="Dashboard" 
          isActive={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
        />
        <SidebarButton 
          icon="🚗" 
          label="Mis Vehículos" 
          isActive={activeTab === 'vehicles'} 
          onClick={() => setActiveTab('vehicles')} 
        />
        <SidebarButton 
          icon="🗂️" 
          label="Guantera Digital" 
          isActive={activeTab === 'documents'} 
          onClick={() => setActiveTab('documents')} 
        />
        <SidebarButton 
          icon="⛽" 
          label="Cargas de Bencina" 
          isActive={activeTab === 'fuel'} 
          onClick={() => setActiveTab('fuel')} 
        />
        <SidebarButton 
          icon="💸" 
          label="Gastos y TAG" 
          isActive={activeTab === 'expenses'} 
          onClick={() => setActiveTab('expenses')} 
        />
        <SidebarButton 
          icon="🗺️" 
          label="Red CNE (Precios)" 
          isActive={activeTab === 'cne'} 
          onClick={() => setActiveTab('cne')} 
        />
        
        {/* Botón de Alertas con Badge Dinámico */}
        <button
          onClick={() => setActiveTab('alerts')}
          style={{
            ...buttonStyle,
            backgroundColor: activeTab === 'alerts' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            color: activeTab === 'alerts' ? '#38bdf8' : '#94a3b8',
            marginTop: '16px',
            border: activeTab === 'alerts' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
          }}
        >
          <span style={{ fontSize: '18px' }}>🚨</span>
          <span style={{ flex: 1, textAlign: 'left', fontWeight: activeTab === 'alerts' ? '700' : '600' }}>Alertas</span>
          {alertCount > 0 && (
            <span style={{
              background: '#ef4444',
              color: '#fff',
              fontSize: '11px',
              fontWeight: '800',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              {alertCount}
            </span>
          )}
        </button>
      </nav>

      {/* Botón de Cerrar Sesión */}
      <button
        onClick={handleLogout}
        style={{
          ...buttonStyle,
          color: '#ef4444',
          marginTop: 'auto',
          backgroundColor: 'transparent'
        }}
      >
        <span>🚪</span> Cerrar Sesión
      </button>
    </aside>
  );
}

// Componente auxiliar interno para mantener los botones limpios
const SidebarButton = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        ...buttonStyle,
        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
        color: isActive ? '#38bdf8' : '#94a3b8',
        border: isActive ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
      }}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span style={{ fontWeight: isActive ? '700' : '600' }}>{label}</span>
    </button>
  );
};

// Estilo base para los botones
const buttonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  borderRadius: '12px',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  width: '100%',
  textAlign: 'left'
};