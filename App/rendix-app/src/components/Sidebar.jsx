/*
  Nombre del archivo: Sidebar.jsx
  Propósito: Barra de navegación lateral profesional con iconografía vectorial Lucide,
  selector de tema, perfil activo y cierre de sesión.
*/

import React from 'react';
import {
  LayoutDashboard,
  Car,
  FolderCheck,
  Route,
  Fuel,
  Receipt,
  Zap,
  Bell,
  Sun,
  Moon,
  User,
  LogOut,
  Gauge
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  alertCount,
  theme,
  toggleTheme,
  isOpen,
  onCloseMobile,
  userEmail = '',
  onLogout
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard General', Icon: LayoutDashboard },
    { id: 'vehicles', label: 'Mis Vehículos', Icon: Car },
    { id: 'documents', label: 'Guantera Digital', Icon: FolderCheck },
    { id: 'trip', label: 'Cotizador de Fletes', Icon: Route },
    { id: 'fuel', label: 'Cargas de Bencina', Icon: Fuel },
    { id: 'expenses', label: 'Gastos Operativos', Icon: Receipt },
    { id: 'cne', label: 'Red CNE (Bencinas)', Icon: Zap },
    { id: 'alerts', label: 'Alertas de Flota', Icon: Bell, badge: alertCount }
  ];

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onCloseMobile}
      />

      <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        {/* MARCA / LOGO */}
        <div
          style={{
            padding: '22px 18px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
              }}
            >
              <Gauge size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '19px',
                  fontWeight: '900',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.1
                }}
              >
                Rendix<span style={{ color: '#38bdf8' }}>App</span>
              </h1>
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--text-secondary)',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}
              >
                Fleet & Cost Control
              </span>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* MENÚ DE NAVEGACIÓN */}
        <nav
          style={{
            flex: 1,
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            overflowY: 'auto'
          }}
        >
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            const IconComponent = item.Icon;

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
                  gap: '11px',
                  padding: '11px 13px',
                  borderRadius: '10px',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                  background: isActive
                    ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                    : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: isActive ? '700' : '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.28)' : 'none',
                  transition: 'all 0.18s ease'
                }}
              >
                <IconComponent
                  size={17}
                  strokeWidth={isActive ? 2.3 : 2}
                  style={{ flexShrink: 0, opacity: isActive ? 1 : 0.85 }}
                />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge > 0 && (
                  <span
                    style={{
                      background: isActive ? '#ffffff' : '#ef4444',
                      color: isActive ? '#1d4ed8' : '#ffffff',
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '2px 7px',
                      borderRadius: '999px'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* PERFIL Y CIERRE DE SESIÓN */}
        <div
          style={{
            padding: '14px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {userEmail && (
            <div
              style={{
                background: 'var(--bg-card-inner)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '9px 11px',
                display: 'flex',
                alignItems: 'center',
                gap: '9px'
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <User size={14} />
              </div>
              <span
                title={userEmail}
                style={{
                  fontSize: '11.5px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {userEmail}
              </span>
            </div>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                onLogout();
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '9px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#ef4444',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px'
              }}
            >
              <LogOut size={14} />
              Cerrar Sesión
            </button>
          )}
        </div>
      </aside>
    </>
  );
}