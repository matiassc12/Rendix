import React, { useState } from 'react';

export default function CneView({ cneStations = [], isLoading = false, onReload }) {
  const [selectedFuel, setSelectedFuel] = useState('p95');
  const [selectedCommune, setSelectedCommune] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');

  // Generar listado de comunas ordenadas
  const communesList = ['todas', ...Array.from(new Set(cneStations.map(s => s.commune || 'Otra Comuna')))].sort();

  // Filtrar estaciones por criterio y ordenar de más barata a más cara
  const filteredStations = cneStations.filter(station => {
    const matchesCommune = selectedCommune === 'todas' || station.commune === selectedCommune;
    const matchesSearch = (station.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (station.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (station.brand || '').toLowerCase().includes(searchTerm.toLowerCase());
    const price = Number(station[selectedFuel] || 0);
    return matchesCommune && matchesSearch && price > 0;
  }).sort((a, b) => Number(a[selectedFuel] || 0) - Number(b[selectedFuel] || 0));

  // Cálculo de estadísticas del filtro
  const validPrices = filteredStations.map(s => Number(s[selectedFuel] || 0)).filter(p => p > 0);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
  const avgPrice = validPrices.length > 0 ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length) : 0;

  const getFuelLabel = (key) => {
    switch (key) {
      case 'p93': return 'Gasolina 93';
      case 'p95': return 'Gasolina 95';
      case 'p97': return 'Gasolina 97';
      case 'diesel': return 'Diésel';
      case 'kerosene': return 'Kerosene';
      default: return 'Combustible';
    }
  };

  return (
    <div className="view-container" style={{ padding: '20px', color: '#f8fafc' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>⛽</span> Red CNE - Bencinas en Línea RM
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Precios de estaciones destacadas por comuna en la Región Metropolitana.
          </p>
        </div>
        {onReload && (
          <button
            onClick={onReload}
            disabled={isLoading}
            style={{
              background: '#334155',
              color: '#ffffff',
              border: '1px solid #475569',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? '🔄 Cargando...' : '🔄 Actualizar Lista'}
          </button>
        )}
      </div>

      {/* Botones de selección de combustible */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#1e293b', padding: '8px', borderRadius: '10px', border: '1px solid #334155' }}>
        {[
          { key: 'p93', label: 'Gasolina 93' },
          { key: 'p95', label: 'Gasolina 95' },
          { key: 'p97', label: 'Gasolina 97' },
          { key: 'diesel', label: 'Diésel' },
          { key: 'kerosene', label: 'Kerosene' }
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setSelectedFuel(item.key)}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '6px',
              background: selectedFuel === item.key ? '#3b82f6' : 'transparent',
              color: selectedFuel === item.key ? '#ffffff' : '#94a3b8',
              fontWeight: selectedFuel === item.key ? '700' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Filtro por Comuna y Buscador */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '20px' }}>
        <div>
          <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>FILTRAR POR COMUNA</label>
          <select
            value={selectedCommune}
            onChange={(e) => setSelectedCommune(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              background: '#0f172a',
              border: '1px solid #334155',
              color: '#fff',
              fontSize: '14px'
            }}
          >
            {communesList.map(c => (
              <option key={c} value={c}>
                {c === 'todas' ? 'Todas las Comunas' : c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>BUSCAR ESTACIÓN O DIRECCIÓN</label>
          <input
            type="text"
            placeholder="Ej: Copec, Shell, Apoquindo, Matta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              background: '#0f172a',
              border: '1px solid #334155',
              color: '#fff',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Cuadros comparativos de precios */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: '600' }}>PRECIO MÍNIMO ENCONTRADO ({getFuelLabel(selectedFuel)})</span>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#22c55e', marginTop: '4px' }}>
            {minPrice > 0 ? `$${minPrice.toLocaleString('es-CL')} / L` : '---'}
          </div>
        </div>

        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#60a5fa', fontWeight: '600' }}>PRECIO PROMEDIO ({getFuelLabel(selectedFuel)})</span>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#3b82f6', marginTop: '4px' }}>
            {avgPrice > 0 ? `$${avgPrice.toLocaleString('es-CL')} / L` : '---'}
          </div>
        </div>
      </div>

      {/* Tabla de Estaciones */}
      <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#f8fafc' }}>
          <thead>
            <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '12px' }}>
              <th style={{ padding: '14px' }}>ESTACIÓN / MARCA</th>
              <th style={{ padding: '14px' }}>COMUNA</th>
              <th style={{ padding: '14px' }}>DIRECCIÓN</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>PRECIO {getFuelLabel(selectedFuel).toUpperCase()}</th>
            </tr>
          </thead>
          <tbody>
            {filteredStations.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  No hay estaciones registradas para los criterios seleccionados.
                </td>
              </tr>
            ) : (
              filteredStations.map((st) => {
                const currentPrice = Number(st[selectedFuel] || 0);
                const isCheapest = currentPrice === minPrice;

                return (
                  <tr key={st.id} style={{ borderBottom: '1px solid #334155', background: isCheapest ? 'rgba(34, 197, 94, 0.05)' : 'transparent' }}>
                    <td style={{ padding: '14px' }}>
                      <div style={{ fontWeight: '600', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isCheapest && <span title="Opción más económica" style={{ fontSize: '14px' }}>🏷️</span>}
                        {st.name}
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{st.brand || 'Genérica'}</span>
                    </td>
                    <td style={{ padding: '14px', color: '#38bdf8', fontWeight: '500' }}>{st.commune}</td>
                    <td style={{ padding: '14px', color: '#cbd5e1', fontSize: '13px' }}>{st.address}</td>
                    <td style={{ padding: '14px', textAlign: 'right', fontWeight: '700', fontSize: '16px', color: isCheapest ? '#4ade80' : '#f8fafc' }}>
                      ${currentPrice.toLocaleString('es-CL')} / L
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}