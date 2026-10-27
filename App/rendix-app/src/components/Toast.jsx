/*
  Nombre del archivo: Toast.jsx
  Propósito: Contenedor flotante para mostrar notificaciones estéticas en la app.
*/

import React from 'react';

export default function Toast({ toasts = [] }) {
  if (!toasts.length) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      {toasts.map(toast => (
        <div key={toast.id} style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          color: '#f8fafc',
          padding: '14px 20px',
          borderRadius: '12px',
          border: '1px solid #38bdf8',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          fontSize: '13px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          pointerEvents: 'auto',
          animation: 'slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <span style={{ color: '#38bdf8', fontSize: '16px' }}>✨</span>
          {toast.message}
        </div>
      ))}
    </div>
  );
}