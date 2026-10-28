/*
  Nombre del archivo: CneView.jsx
  Propósito: Consulta nacional de precios CNE con filtros en cascada por Región, 
  Comuna y Combustible, ordenados automáticamente de menor a mayor precio.
*/

import React, { useState, useMemo } from 'react';

export default function CneView({ cneStations = [], cneFuelType, setCneFuelType, onRefreshPrices, isLoading }) {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCommune, setSelectedCommune] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Obtener lista única de regiones
  const regions = useMemo(() => {
    const set = new Set(cneStations.map(s => s.region).filter(Boolean));
    return Array.from(set).sort();
  }, [cneStations]);

  // 2. Obtener comunas filtradas según la región seleccionada
  const communes = useMemo(() => {
    const filteredByRegion = selectedRegion === 'all' 
      ? cneStations 
      : cneStations.filter(s => s.region === selectedRegion);

    const set = new Set(filteredByRegion.map(s => s.commune).filter(Boolean));
    return Array.from(set).sort();
  }, [cneStations, selectedRegion]);

  // Manejar cambio de región (reinicia la comuna seleccionada)
  const handleRegionChange = (e) => {
    setSelectedRegion(e.target.value);
    setSelectedCommune('all');
  };

  // Clave del precio según el tipo de combustible
  const getFuelKey = (type) => {
    if (type === '93') return 'p93';
    if (type === '95') return 'p95';
    if (type === '97') return 'p97';
    if (type === 'diesel') return 'diesel';
    if (type === 'kerosene') return 'kerosene';
    return 'p95';
  };

  const fuelKey = getFuelKey(cneFuelType);

  // 3. Filtrar y ordenar de MÁS BARATA a MÁS CARA
  const sortedStations = useMemo(() => {
    return cneStations
      .filter(station => {
        const matchesRegion = selectedRegion === 'all' || station.region === selectedRegion;
        const matchesCommune = selectedCommune === 'all' || station.commune === selectedCommune;
        const matchesSearch = 
          station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          station.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          station.brand.toLowerCase().includes(searchTerm.toLowerCase());
        
        const price = Number(station[fuelKey] || 0);
        return matchesRegion && matchesCommune && matchesSearch && price > 0;
      })
      .sort((a, b) => Number(a[fuelKey]) - Number(b[fuelKey])); // Orden ascendente
  }, [cneStations, selectedRegion, selectedCommune, searchTerm, fuelKey]);

  // Estadísticas del filtro actual
  const minPrice = sortedStations.length > 0 ? Number(sortedStations[0][fuelKey]) : 0;
  const maxPrice = sortedStations.length > 0 ? Number(sortedStations[sortedStations.length - 1][fuelKey]) : 0;
  const avgPrice = sortedStations.length > 0 
    ? Math.round(sortedStations.reduce((acc, curr) => acc + Number(curr[fuelKey]), 0) / sortedStations.length) 
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#f8fafc', fontWeight: '900', letterSpacing: '-0.5px' }}>⛽ Red CNE - Bencina en Línea Chile</h2>
          <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>Precios oficiales del Ministerio de Energía ordenados de más económico a más caro.</p>
        </div>

        <button
          onClick={onRefreshPrices}
          disabled={isLoading}
          style={{
            background: isLoading ? '#334155' : 'linear-gradient(135deg, #22c55e, #15803d)',
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '800',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 6px -1px rgba(34, 197, 94, 0.3)'
          }}
        >
          {isLoading ? '🔄 Cargando CNE...' : '⚡ Sincronizar Precios Chile'}
        </button>
      </div>

      {/* Controles y Filtros */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Selector de Tipo de Combustible */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>Combustible:</span>
          <div style={{ display: 'flex', gap: '6px', background: '#0f172a', padding: '4px', borderRadius: '8px', border: '1px solid #334155', flexWrap: 'wrap' }}>
            {[
              { id: '93', label: 'Gasolina 93' },
              { id: '95', label: 'Gasolina 95' },
              { id: '97', label: 'Gasolina 97' },
              { id: 'diesel', label: 'Diésel' },
              { id: 'kerosene', label: 'Kerosene' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setCneFuelType(f.id)}
                style={{
                  background: cneFuelType === f.id ? '#3b82f6' : 'transparent',
                  color: cneFuelType === f.id ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros en Cascada (Región -> Comuna -> Buscador) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          
          {/* Selector de Región */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>1. REGIÓN</label>
            <select
              value={selectedRegion}
              onChange={handleRegionChange}
              style={{ width: '100%', background: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px', padding: '9px 12px', fontSize: '12px', fontWeight: '700', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">Todas las Regiones ({regions.length})</option>
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Selector de Comuna */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>2. COMUNA / CIUDAD</label>
            <select
              value={selectedCommune}
              onChange={(e) => setSelectedCommune(e.target.value)}
              style={{ width: '100%', background: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px', padding: '9px 12px', fontSize: '12px', fontWeight: '700', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">Todas las Comunas ({communes.length})</option>
              {communes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Búsqueda por Nombre o Dirección */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>3. BUSCAR ESTACIÓN / MARCA</label>
            <input
              type="text"
              placeholder="Ej: Copec, Shell, Alameda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '9px 12px', borderRadius: '8px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

        </div>
      </div>

      {/* Resumen KPI de Precios en el Filtro Actual */}
      {sortedStations.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '12px 16px', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: '700', textTransform: 'uppercase' }}>Precio Mínimo</span>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#4ade80', marginTop: '2px' }}>${minPrice.toLocaleString('es-CL')} /L</div>
          </div>

          <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '12px 16px', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Precio Promedio</span>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#38bdf8', marginTop: '2px' }}>${avgPrice.toLocaleString('es-CL')} /L</div>
          </div>

          <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '12px 16px', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Precio Máximo</span>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#fca5a5', marginTop: '2px' }}>${maxPrice.toLocaleString('es-CL')} /L</div>
          </div>

          <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '12px 16px', borderRadius: '10px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Estaciones Encontradas</span>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#f8fafc', marginTop: '2px' }}>{sortedStations.length.toLocaleString('es-CL')}</div>
          </div>
        </div>
      )}

      {/* Lista de Estaciones Ordenadas */}
      {sortedStations.length === 0 ? (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          No se encontraron estaciones con precios activos para el filtro seleccionado.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
          {sortedStations.map((station, index) => {
            const price = Number(station[fuelKey]);
            const isCheapest = index === 0; // La primera es siempre la más económica por el sort

            return (
              <div
                key={station.id}
                style={{
                  background: '#1e293b',
                  border: `1px solid ${isCheapest ? '#22c55e' : '#334155'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isCheapest ? '0 0 20px rgba(34, 197, 94, 0.2)' : 'none',
                  position: 'relative',
                  gap: '12px'
                }}
              >
                {isCheapest && (
                  <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.4)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' }}>
                    🏷️ MÁS ECONÓMICA
                  </span>
                )}

                <div>
                  <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase' }}>{station.brand}</div>
                  <h4 style={{ margin: '2px 0 0 0', fontSize: '15px', color: '#f8fafc', fontWeight: '800', paddingRight: isCheapest ? '90px' : '0' }}>{station.name}</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>📍 {station.address}, {station.commune}</p>
                </div>

                <div style={{ background: '#0f172a', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>
                    {cneFuelType.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: '950', color: isCheapest ? '#22c55e' : '#f8fafc' }}>
                    ${price.toLocaleString('es-CL')} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>/L</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}