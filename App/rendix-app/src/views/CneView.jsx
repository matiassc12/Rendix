/*
  Nombre del archivo: CneView.jsx
  Propósito: Vista de precios CNE que permite alternar dinámicamente entre 
  el listado en tarjetas y el mapa interactivo de Leaflet para ubicar visualmente 
  las estaciones más económicas.
*/

import React, { useState } from 'react';
import MapView from '../components/MapView';

export default function CneView({ cneStations, cneFuelType, setCneFuelType, onRefreshPrices, isLoading }) {
  const [busqueda, setBusqueda] = useState('');
  const [comunaSeleccionada, setComunaSeleccionada] = useState('todas');
  const [modoMapa, setModoMapa] = useState(false); // Estado para alternar entre tarjetas y mapa

  const comunasDisponibles = ['todas', ...new Set(cneStations.map(s => s.commune))].sort();

  const estacionesFiltradas = cneStations.filter(s => {
    const textoCoincidente = 
      s.name.toLowerCase().includes(busqueda.toLowerCase()) || 
      s.commune.toLowerCase().includes(busqueda.toLowerCase());
    const comunaCoincidente = 
      comunaSeleccionada === 'todas' || s.commune.toLowerCase() === comunaSeleccionada.toLowerCase();
    return textoCoincidente && comunaCoincidente;
  });

  return (
    <div>
      <div className="header-title">
        <div>
          <h2>Precios en Vivo - Red Nacional CNE</h2>
          <p>Consulta en tiempo real todas las estaciones de servicio del país.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary" onClick={() => setModoMapa(!modoMapa)} style={{ background: '#4f46e5' }}>
            {modoMapa ? '📋 Ver en Tarjetas' : '🗺️ Ver en Mapa'}
          </button>
          <button className="btn-primary" onClick={onRefreshPrices} disabled={isLoading} style={{ background: '#059669' }}>
            {isLoading ? 'Actualizando...' : '🔄 Sincronizar'}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card-box" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ flex: '1 1 250px' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Buscar Estación</label>
          <input type="text" placeholder="Ej: Copec, Shell..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ margin: 0 }} />
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Comuna</label>
          <select value={comunaSeleccionada} onChange={e => setComunaSeleccionada(e.target.value)} style={{ margin: 0, textTransform: 'capitalize' }}>
            {comunasDisponibles.map(c => <option key={c} value={c}>{c === 'todas' ? 'Todas las comunas' : c}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Combustible</label>
          <select value={cneFuelType} onChange={e => setCneFuelType(e.target.value)} style={{ margin: 0 }}>
            <option value="95">Gasolina 95 Octanos</option>
            <option value="93">Gasolina 93 Octanos</option>
            <option value="97">Gasolina 97 Octanos</option>
            <option value="diesel">Petróleo Diésel</option>
          </select>
        </div>
      </div>

      {/* Renderizado condicional: Modo Mapa o Modo Tarjetas */}
      {modoMapa ? (
        <MapView stations={estacionesFiltradas} fuelType={cneFuelType} />
      ) : (
        <div className="stats-grid">
          {estacionesFiltradas.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <p style={{ color: '#64748b', fontSize: '15px' }}>No se encontraron estaciones con los filtros aplicados.</p>
            </div>
          ) : (
            estacionesFiltradas.map(s => {
              const precioActual = s[cneFuelType === 'diesel' ? 'diesel' : 'p' + cneFuelType];
              const etiquetaCombustible = cneFuelType === 'diesel' ? 'Diésel' : `${cneFuelType} Octanos`;

              return (
                <div key={s.id} className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                      {s.commune}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{etiquetaCombustible}</span>
                  </div>
                  <h4 style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700', marginTop: '4px' }}>{s.name}</h4>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Precio litro:</span>
                    <span style={{ color: '#4f46e5', fontSize: '18px', fontWeight: 'bold' }}>
                      ${precioActual ? precioActual.toLocaleString('es-CL') : 'N/D'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}