import { supabase } from '../supabaseClient';

const CACHE_KEY = 'rendix_cne_stations_cache_v4';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

function mapStationForUI(st) {
  const p93 = Number(st.p93 ?? st.price_93 ?? 0) || null;
  const p95 = Number(st.p95 ?? st.price_95 ?? 0) || null;
  const p97 = Number(st.p97 ?? st.price_97 ?? 0) || null;
  const diesel = Number(st.diesel ?? st.price_diesel ?? 0) || null;
  const kerosene = Number(st.kerosene ?? st.price_kerosene ?? 0) || null;

  return {
    id: st.id || st.external_id,
    external_id: st.external_id || st.id,
    name: st.name || st.brand || 'Estación CNE',
    brand: st.brand || 'Sin bandera',
    region: st.region || 'Metropolitana',
    commune: st.commune || 'Sin comuna',
    address: st.address || 'Dirección no disponible',
    lat: st.lat != null ? Number(st.lat) : null,
    lng: st.lng != null ? Number(st.lng) : null,
    // Formato corto usado por CneView.jsx
    p93,
    p95,
    p97,
    diesel,
    kerosene,
    // Formato BD usado por cne_stations y FuelView.jsx
    price_93: p93,
    price_95: p95,
    price_97: p97,
    price_diesel: diesel,
    price_kerosene: kerosene,
    updated_at: st.updated_at || new Date().toISOString(),
  };
}

export async function fetchRealCnePrices({
  regionFilter = 'Metropolitana',
  forceRetry = false,
} = {}) {
  if (!forceRetry) {
    try {
      const rawCache = localStorage.getItem(CACHE_KEY);
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        const isFresh = Date.now() - parsed.timestamp < CACHE_TTL_MS;
        if (isFresh && Array.isArray(parsed.stations) && parsed.stations.length > 0) {
          return parsed.stations.map(mapStationForUI);
        }
      }
    } catch {
      localStorage.removeItem(CACHE_KEY);
    }
  }

  try {
    const { data, error } = await supabase.functions.invoke('quick-processor', {
      body: { regionFilter, forceRetry },
    });

    if (error) throw new Error(error.message || 'Error invocando quick-processor');
    if (data?.error) throw new Error(data.error);

    const rawStations = Array.isArray(data?.stations) ? data.stations : [];
    if (rawStations.length > 0) {
      const mapped = rawStations.map(mapStationForUI);
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), stations: mapped })
        );
      } catch {
        // Ignorar si localStorage está lleno
      }
      return mapped;
    }
  } catch (proxyErr) {
    console.warn('Fallo en quick-processor, usando respaldo de tabla cne_stations:', proxyErr.message);
  }

  const { data: dbStations, error: dbError } = await supabase
    .from('cne_stations')
    .select('*')
    .order('commune', { ascending: true });

  if (!dbError && Array.isArray(dbStations) && dbStations.length > 0) {
    return dbStations.map(mapStationForUI);
  }

  return [];
}