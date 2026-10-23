/*
  Nombre del archivo: Toast.jsx
  Propósito: Muestra notificaciones flotantes en la esquina superior derecha 
  para dar retroalimentación visual al usuario cada vez que realiza una acción 
  exitosa (como registrar un gasto o agregar un vehículo).
*/

import React from 'react';

export default function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {toasts.map(t => <div key={t.id} className="toast">{t.message}</div>)}
    </div>
  );
}