/*
  Nombre del archivo: DashboardView.jsx
  Propósito: Vista principal del panel de control. Presenta tarjetas con métricas 
  financieras clave (gasto total en combustible, rendimiento promedio, gastos operativos) 
  y permite filtrar los datos por vehículo específico.
*/

import React from 'react';

export default function DashboardView({ vehicles, totalFuelCost, totalExpenses, totalCargas, avgKm, dashVehicleFilter, setDashVehicleFilter }) {
  return (
    <div>
      <div className="header-title">
        <div>
          <h2>Dashboard General</h2>
          <p>Resumen financiero y rendimiento operativo de tu flota.</p>
        </div>
        <select value={dashVehicleFilter} onChange={e => setDashVehicleFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">Todos los Vehículos</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div><p>Gasto Total Bencina</p><h3>${totalFuelCost.toLocaleString('es-CL')}</h3></div>
          <div className="stat-icon bg-indigo">⛽</div>
        </div>
        <div className="stat-card">
          <div><p>Rendimiento Promedio</p><h3>{avgKm} km/l</h3></div>
          <div className="stat-icon bg-emerald">🛣️</div>
        </div>
        <div className="stat-card">
          <div><p>Gastos Operativos</p><h3>${totalExpenses.toLocaleString('es-CL')}</h3></div>
          <div className="stat-icon bg-amber">🧾</div>
        </div>
        <div className="stat-card">
          <div><p>Total Cargas</p><h3>{totalCargas}</h3></div>
          <div className="stat-icon bg-blue">🚗</div>
        </div>
      </div>
    </div>
  );
}