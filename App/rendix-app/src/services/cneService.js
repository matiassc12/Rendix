import { supabase } from '../supabaseClient';

const CACHE_KEY = 'rendix_cne_stations_cache_v7';
const CACHE_TTL_MS = 30 * 60 * 1000;

function isWithinLastMonth(dateStr) {
  if (!dateStr) return false;
  const raw = String(dateStr).trim();
  const dmy = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})(?:\s+(.*))?$/);
  const isoCandidate = dmy
    ? `${dmy[3]}-${dmy[2]}-${dmy[1]}T${dmy[4] || '00:00:00'}`
    : raw.replace(' ', 'T');

  const parsed = new Date(isoCandidate);
  if (Number.isNaN(parsed.getTime())) return false;

  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), 0, 0, 0, 0);
  return parsed.getTime() >= oneMonthAgo.getTime();
}

function normalizePriceNumber(val) {
  if (val === null || val === undefined || val === '') return null;
  let num = typeof val === 'number' ? val : Number(String(val).trim().replace(',', '.'));
  if (!Number.isFinite(num) || num <= 0) return null;
  if (num >= 100000) num = num / 1000;
  return Math.round(num);
}

function mapStationForUI(st, index = 0) {
  const p93 = normalizePriceNumber(st.p93 ?? st.price_93 ?? st.precio_93);
  const p95 = normalizePriceNumber(st.p95 ?? st.price_95 ?? st.precio_95);
  const p97 = normalizePriceNumber(st.p97 ?? st.price_97 ?? st.precio_97);
  const diesel = normalizePriceNumber(st.diesel ?? st.price_diesel ?? st.precio_diesel);
  const kerosene = normalizePriceNumber(st.kerosene ?? st.price_kerosene ?? st.precio_kerosene);

  const resolvedId = st.id || st.external_id || `cne-${index}`;
  const lastUpdated = st.last_updated || st.updated_at || null;

  return {
    id: resolvedId,
    external_id: st.external_id || resolvedId,
    name: st.name || st.nombre || st.brand || 'Estación CNE',
    brand: st.brand || st.marca || 'Sin bandera',
    region: st.region || 'Metropolitana',
    commune: st.commune || st.comuna || 'Sin comuna',
    address: st.address || st.direccion || 'Dirección no disponible',
    lat: st.lat != null ? Number(st.lat) : null,
    lng: st.lng != null ? Number(st.lng) : null,
    p93,
    p95,
    p97,
    diesel,
    kerosene,
    price_93: p93,
    price_95: p95,
    price_97: p97,
    price_diesel: diesel,
    price_kerosene: kerosene,
    last_updated: lastUpdated,
    updated_at: lastUpdated
  };
}

export async function fetchRealCnePrices({
  regionFilter = 'Metropolitana',
  forceRetry = false
} = {}) {
  if (!forceRetry) {
    try {
      const rawCache = localStorage.getItem(CACHE_KEY);
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        const isFresh = Date.now() - Number(parsed.timestamp || 0) < CACHE_TTL_MS;
        if (isFresh && Array.isArray(parsed.stations) && parsed.stations.length > 0) {
          return parsed.stations
            .map(mapStationForUI)
            .filter(st => isWithinLastMonth(st.last_updated || st.updated_at));
        }
      }
    } catch {
      localStorage.removeItem(CACHE_KEY);
    }
  }

  try {
    const { data, error } = await supabase.functions.invoke('cne-proxy', {
      body: { regionFilter, forceRetry }
    });

    if (error) throw new Error(error.message || 'Error invocando cne-proxy');
    if (data?.error) throw new Error(data.error);

    const rawStations = Array.isArray(data)
      ? data
      : Array.isArray(data?.stations)
        ? data.stations
        : [];

    if (rawStations.length > 0) {
      const mapped = rawStations
        .map(mapStationForUI)
        .filter(st => isWithinLastMonth(st.last_updated || st.updated_at));
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), stations: mapped })
        );
      } catch {
        // Ignorar errores de cuota de localStorage
      }
      return mapped;
    }
  } catch (proxyErr) {
    console.warn('Fallo en cne-proxy, usando respaldo de tabla cne_stations:', proxyErr.message);
  }

  const { data: dbStations, error: dbError } = await supabase
    .from('cne_stations')
    .select('*')
    .order('commune', { ascending: true });

  if (!dbError && Array.isArray(dbStations) && dbStations.length > 0) {
    return dbStations
      .map(mapStationForUI)
      .filter(st => isWithinLastMonth(st.last_updated || st.updated_at));
  }

  return [];
}