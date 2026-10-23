/*
  Nombre del archivo: Sidebar.jsx
  Propósito: Renderiza la barra de navegación lateral izquierda. Permite cambiar 
  de sección (Dashboard, Vehículos, Combustible, Gastos, CNE, Alertas) y muestra 
  un contador dinámico de notificaciones pendientes de mantención.
*/

import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, alertCount }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'vehicles', label: 'Vehículos', icon: '🚗' },
    { id: 'fuel', label: 'Cargas Combustible', icon: '⛽' },
    { id: 'expenses', label: 'Gastos Operativos', icon: '🧾' },
    { id: 'cne', label: 'Precios en Vivo (CNE)', icon: '⚡' },
    { id: 'alerts', label: 'Alertas y Mantenciones', icon: '🔔', badge: alertCount }
  ];

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-header">
          <div className="brand-icon">⚡</div>
          <div>
            <h1 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>Rendix</h1>
            <p style={{ fontSize: '11px' }}>Control Vehicular</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>{item.icon} {item.label}</span>
              {item.badge > 0 && <span className="badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}