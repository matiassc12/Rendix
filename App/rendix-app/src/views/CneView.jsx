import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const COMMUNE_COORDS = {
  providencia: [-33.432, -70.612],
  santiago: [-33.448, -70.650],
  ñuñoa: [-33.456, -70.603],
  'las condes': [-33.411, -70.578],
  macul: [-33.483, -70.598],
  maipú: [-33.510, -70.758],
  'la florida': [-33.523, -70.599],
  'san bernardo': [-33.593, -70.702],
  vitacura: [-33.395, -70.574],
  'puente alto': [-33.611, -70.575],
  peñalolén: [-33.486, -70.542],
  'la reina': [-33.445, -70.544],
  recoleta: [-33.406, -70.641],
  independencia: [-33.416, -70.665],
  quilicura: [-33.361, -70.728],
  pudahuel: [-33.441, -70.749],
  'estación central': [-33.459, -70.695],
  'san miguel': [-33.498, -70.651]
};

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getStationPrice(station, fuelKey) {
  if (!station) return 0;
  let raw = 0;
  switch (fuelKey) {
    case 'p93':
      raw = Number(station.p93 ?? station.price_93 ?? 0);
      break;
    case 'p95':
      raw = Number(station.p95 ?? station.price_95 ?? 0);
      break;
    case 'p97':
      raw = Number(station.p97 ?? station.price_97 ?? 0);
      break;
    case 'diesel':
      raw = Number(station.diesel ?? station.price_diesel ?? 0);
      break;
    case 'kerosene':
      raw = Number(station.kerosene ?? station.price_kerosene ?? 0);
      break;
    default:
      raw = 0;
  }
  if (raw >= 100000) raw = Math.round(raw / 1000);
  return raw;
}

function resolveStationCoords(station, index) {
  const lat = Number(station.lat || station.latitude || 0);
  const lng = Number(station.lng || station.longitude || 0);
  if (lat !== 0 && lng !== 0) return [lat, lng];

  const communeKey = (station.commune || '').toLowerCase();
  const base =
    Object.entries(COMMUNE_COORDS).find(([key]) => communeKey.includes(key))?.[1] ||
    [-33.4489, -70.6693];
  const angle = (index * 137.5 * Math.PI) / 180;
  const radius = 0.004 + (index % 5) * 0.0015;
  return [base[0] + Math.cos(angle) * radius, base[1] + Math.sin(angle) * radius];
}

export default function CneView({ cneStations = [], isLoading = false, onReload }) {
  const [selectedFuel, setSelectedFuel] = useState('p95');
  const [selectedCommune, setSelectedCommune] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('price_asc'); // 'price_asc' | 'price_desc' | 'recent'
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'

  const cneMapRef = useRef(null);
  const cneMapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const communesList = [
    'todas',
    ...Array.from(new Set(cneStations.map(s => s.commune || 'Otra Comuna')))
  ].sort();

  const numericMaxPrice = Number(maxPriceFilter) > 0 ? Number(maxPriceFilter) : null;

  const filteredStations = cneStations
    .filter(station => {
      const matchesCommune = selectedCommune === 'todas' || station.commune === selectedCommune;
      const matchesSearch =
        (station.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (station.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (station.brand || '').toLowerCase().includes(searchTerm.toLowerCase());
      const price = getStationPrice(station, selectedFuel);
      const matchesMaxPrice = numericMaxPrice === null || price <= numericMaxPrice;
      return matchesCommune && matchesSearch && price > 0 && matchesMaxPrice;
    })
    .sort((a, b) => {
      if (sortOrder === 'price_desc') {
        return getStationPrice(b, selectedFuel) - getStationPrice(a, selectedFuel);
      }
      if (sortOrder === 'recent') {
        const da = String(a.last_updated || a.updated_at || '');
        const db = String(b.last_updated || b.updated_at || '');
        return db.localeCompare(da);
      }
      return getStationPrice(a, selectedFuel) - getStationPrice(b, selectedFuel);
    });

  const validPrices = filteredStations
    .map(s => getStationPrice(s, selectedFuel))
    .filter(p => p > 0);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
  const avgPrice =
    validPrices.length > 0
      ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length)
      : 0;

  const getFuelLabel = (key) => {
    switch (key) {
      case 'p93':
        return 'Gasolina 93';
      case 'p95':
        return 'Gasolina 95';
      case 'p97':
        return 'Gasolina 97';
      case 'diesel':
        return 'Diésel';
      case 'kerosene':
        return 'Kerosene';
      default:
        return 'Combustible';
    }
  };

  useEffect(() => {
    if (viewMode !== 'map') {
      if (cneMapInstanceRef.current) {
        cneMapInstanceRef.current.remove();
        cneMapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
      return;
    }

    if (!cneMapInstanceRef.current && cneMapRef.current) {
      const map = L.map(cneMapRef.current).setView([-33.4489, -70.6693], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      cneMapInstanceRef.current = map;
    }

    const map = cneMapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const bounds = [];

    filteredStations.slice(0, 80).forEach((st, idx) => {
      const coords = resolveStationCoords(st, idx);
      const price = getStationPrice(st, selectedFuel);
      const isCheapest = price === minPrice;
      const updatedLabel = st.last_updated || st.updated_at || 'Sin fecha';
      bounds.push(coords);

      const pinIcon = L.divIcon({
        className: 'cne-price-pin',
        html: `<div style="
          background:${isCheapest ? '#16a34a' : 'var(--bg-card)'};
          color:${isCheapest ? '#ffffff' : 'var(--text-primary)'};
          border:2px solid ${isCheapest ? '#86efac' : 'var(--accent)'};
          border-radius:8px;
          padding:2px 6px;
          font-size:11px;
          font-weight:800;
          white-space:nowrap;
          box-shadow:0 2px 6px rgba(0,0,0,0.45);
        ">$${price.toLocaleString('es-CL')}</div>`,
        iconSize: [58, 24],
        iconAnchor: [29, 12]
      });

      const marker = L.marker(coords, { icon: pinIcon });
      marker.bindPopup(`
        <div style="min-width:170px;color:#0f172a;">
          <strong>${escapeHtml(st.name)}</strong><br/>
          <span style="font-size:12px;color:#475569;">${escapeHtml(st.commune)} • ${escapeHtml(st.address || '')}</span><br/>
          <strong style="font-size:14px;color:${isCheapest ? '#16a34a' : '#2563eb'};">
            $${price.toLocaleString('es-CL')} / L
          </strong><br/>
          <span style="font-size:11px;color:#64748b;">Actualizado: ${escapeHtml(updatedLabel)}</span>
          ${isCheapest ? '<div style="margin-top:4px;font-size:11px;font-weight:700;color:#16a34a;">🏷️ Más económica del filtro</div>' : ''}
        </div>
      `);
      marker.addTo(layerGroup);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [viewMode, filteredStations, selectedFuel, minPrice]);

  return (
    <div className="view-container" style={{ padding: '20px', color: 'var(--text-primary)' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
            <span>⛽</span> Red CNE - Bencinas en Línea RM
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Precios actualizados durante el último mes por comuna en la Región Metropolitana.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                background: viewMode === 'list' ? '#3b82f6' : 'transparent',
                color: viewMode === 'list' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              📋 Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                background: viewMode === 'map' ? '#3b82f6' : 'transparent',
                color: viewMode === 'map' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              🗺️ Mapa
            </button>
          </div>

          {onReload && (
            <button
              onClick={onReload}
              disabled={isLoading}
              style={{
                background: 'var(--bg-card-inner)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
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
      </div>

      {/* Botones de selección de combustible */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'var(--bg-card)', padding: '8px', borderRadius: '10px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
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
              minWidth: '100px',
              padding: '10px',
              border: 'none',
              borderRadius: '6px',
              background: selectedFuel === item.key ? '#3b82f6' : 'transparent',
              color: selectedFuel === item.key ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: selectedFuel === item.key ? '700' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Filtros: Comuna, Búsqueda, Precio Máximo y Orden */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>FILTRAR POR COMUNA</label>
          <select
            value={selectedCommune}
            onChange={(e) => setSelectedCommune(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              background: 'var(--bg-card-inner)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              boxSizing: 'border-box'
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
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>BUSCAR ESTACIÓN O DIRECCIÓN</label>
          <input
            type="text"
            placeholder="Ej: Copec, Shell, Apoquindo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              background: 'var(--bg-card-inner)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>PRECIO MÁXIMO ($/L)</label>
          <input
            type="number"
            min="0"
            step="10"
            placeholder="Ej: 1350"
            value={maxPriceFilter}
            onChange={(e) => setMaxPriceFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              background: 'var(--bg-card-inner)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>ORDENAR POR</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              background: 'var(--bg-card-inner)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          >
            <option value="price_asc">Precio: Menor a Mayor</option>
            <option value="price_desc">Precio: Mayor a Menor</option>
            <option value="recent">Más reciente primero</option>
          </select>
        </div>
      </div>

      {/* Cuadros comparativos de precios */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>PRECIO MÍNIMO ENCONTRADO ({getFuelLabel(selectedFuel)})</span>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>
            {minPrice > 0 ? `$${minPrice.toLocaleString('es-CL')} / L` : '---'}
          </div>
        </div>

        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600' }}>PRECIO PROMEDIO ({getFuelLabel(selectedFuel)})</span>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>
            {avgPrice > 0 ? `$${avgPrice.toLocaleString('es-CL')} / L` : '---'}
          </div>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '12px' }}>
          <div ref={cneMapRef} style={{ height: '460px', width: '100%', borderRadius: '8px', overflow: 'hidden' }} />
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--text-primary)' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card-inner)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                <th style={{ padding: '14px' }}>ESTACIÓN / MARCA</th>
                <th style={{ padding: '14px' }}>COMUNA</th>
                <th style={{ padding: '14px' }}>DIRECCIÓN</th>
                <th style={{ padding: '14px' }}>ÚLTIMA ACTUALIZACIÓN</th>
                <th style={{ padding: '14px', textAlign: 'right' }}>PRECIO {getFuelLabel(selectedFuel).toUpperCase()}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStations.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No hay estaciones con precios actualizados en el último mes para los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredStations.map((st, index) => {
                  const currentPrice = getStationPrice(st, selectedFuel);
                  const isCheapest = currentPrice === minPrice;
                  const updatedLabel = st.last_updated || st.updated_at || '—';

                  return (
                    <tr
                      key={st.id || st.external_id || `${st.name}-${index}`}
                      style={{ borderBottom: '1px solid var(--border-color)', background: isCheapest ? 'rgba(34, 197, 94, 0.05)' : 'transparent' }}
                    >
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isCheapest && <span title="Opción más económica" style={{ fontSize: '14px' }}>🏷️</span>}
                          {st.name}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{st.brand || 'Genérica'}</span>
                      </td>
                      <td style={{ padding: '14px', color: '#0284c7', fontWeight: '500' }}>{st.commune}</td>
                      <td style={{ padding: '14px', color: 'var(--text-secondary)', fontSize: '13px' }}>{st.address}</td>
                      <td style={{ padding: '14px', color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        🕒 {updatedLabel}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: '700', fontSize: '16px', color: isCheapest ? '#16a34a' : 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        ${currentPrice.toLocaleString('es-CL')} / L
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}