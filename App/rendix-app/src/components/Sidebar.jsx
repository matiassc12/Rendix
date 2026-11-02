/*
  Nombre del archivo: Sidebar.jsx
  Propósito: Barra de navegación lateral fija para escritorio y menú deslizante para móviles.
*/

import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, alertCount, theme, toggleTheme, isOpen, onCloseMobile }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard General', icon: '📊' },
    { id: 'vehicles', label: 'Mis Vehículos', icon: '🚘' },
    { id: 'documents', label: 'Guantera Digital', icon: '📁' },
    { id: 'trip', label: 'Cotizador de Fletes', icon: '🗺️' },
    { id: 'fuel', label: 'Cargas de Bencina', icon: '⛽' },
    { id: 'expenses', label: 'Gastos Operativos', icon: '💸' },
    { id: 'cne', label: 'Red CNE (Bencinas)', icon: '⚡' },
    { id: 'alerts', label: `Alertas de Flota ${alertCount > 0 ? `(${alertCount})` : ''}`, icon: '🚨' }
  ];

  return (
    <>
      {/* Capa oscura para cerrar el menú en móviles al hacer clic afuera */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`} 
        onClick={onCloseMobile} 
      />

      {/* Contenedor del Sidebar controlado por clases CSS */}
      <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        {/* LOGO / TÍTULO */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              Rendix<span style={{ color: '#38bdf8' }}>App</span>
            </h1>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
              Duoc UC • Capstone
            </span>
          </div>
          <button 
            onClick={toggleTheme} 
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Cambiar tema claro/oscuro"
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
        </div>

        {/* MENÚ DE NAVEGACIÓN */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: isActive ? '800' : '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: isActive ? '0 4px 6px -1px rgba(59, 130, 246, 0.3)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.id === 'alerts' && alertCount > 0 && (
                  <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '2px 6px', borderRadius: '10px' }}>
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* PIE DE SIDEBAR */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Rendix Cloud v2.5 • Duoc UC
        </div>
      </aside>
    </>
  );
}