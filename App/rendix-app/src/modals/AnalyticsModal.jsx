/*
  Nombre del archivo: AnalyticsModal.jsx
  Propósito: Modal analítico con gráficos de líneas (Recharts) para evaluar 
  la tendencia mensual de combustible y costos operativos.
*/

import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function AnalyticsModal({ fuelRecords = [], expenses = [], onClose }) {

  // Procesar y agrupar los datos por mes para alimentar el gráfico
  const dataMap = {};

  fuelRecords.forEach(f => {
    const month = f.date ? f.date.substring(0, 7) : 'Desconocido'; // Formato YYYY-MM
    if (!dataMap[month]) dataMap[month] = { month, bencina: 0, gastos: 0 };
    dataMap[month].bencina += Number(f.total || 0);
  });

  expenses.forEach(e => {
    const month = e.date ? e.date.substring(0, 7) : 'Desconocido';
    if (!dataMap[month]) dataMap[month] = { month, bencina: 0, gastos: 0 };
    dataMap[month].gastos += Number(e.amount || 0);
  });

  // Convertir a array y ordenar cronológicamente por mes
  const chartData = Object.values(dataMap).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: '#1e293b', border: '1px solid #334155', borderRadius: '16px',
        padding: '30px', width: '100%', maxWidth: '850px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '22px', fontWeight: '800' }}>
              📈 Analítica y Tendencia de Gastos
            </h3>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
              Evolución mensual consolidada de combustible y costos operativos de la flota.
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {chartData.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#0f172a', borderRadius: '12px' }}>
            No hay suficientes registros históricos para generar las curvas analíticas.
          </div>
        ) : (
          <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #334155', height: '340px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val.toLocaleString('es-CL')}`} />
                <Tooltip 
                  contentStyle={{ background: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(val) => [`$${Number(val).toLocaleString('es-CL')}`, '']}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Line type="monotone" dataKey="bencina" name="Gasto Bencina" stroke="#38bdf8" strokeWidth={3} dot={{ fill: '#38bdf8' }} />
                <Line type="monotone" dataKey="gastos" name="Gastos Operativos" stroke="#fca5a5" strokeWidth={3} dot={{ fill: '#fca5a5' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={onClose} 
            style={{ background: '#334155', color: '#f8fafc', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
          >
            Cerrar Analítica
          </button>
        </div>
      </div>
    </div>
  );
}