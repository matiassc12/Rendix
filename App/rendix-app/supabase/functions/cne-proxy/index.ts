// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CNE_BASE_URL = 'https://api.cne.cl/api';

let cachedToken: string | null = null;
let tokenFetchedAt = 0;
const TOKEN_TTL_MS = 45 * 60 * 1000;

async function getCneToken(forceNew = false): Promise<string> {
  if (!forceNew && cachedToken && Date.now() - tokenFetchedAt < TOKEN_TTL_MS) {
    return cachedToken;
  }

  const email = Deno.env.get('CNE_API_EMAIL');
  const password = Deno.env.get('CNE_API_PASSWORD');

  if (!email || !password) {
    throw new Error('Faltan secrets CNE_API_EMAIL o CNE_API_PASSWORD en Supabase.');
  }

  const bodyParams = new URLSearchParams();
  bodyParams.append('email', email);
  bodyParams.append('password', password);

  const loginRes = await fetch(`${CNE_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: bodyParams.toString(),
  });

  if (!loginRes.ok) {
    const errText = await loginRes.text();
    throw new Error(`Error login CNE (${loginRes.status}): ${errText}`);
  }

  const loginData = await loginRes.json();
  const token = loginData?.token || loginData?.access_token;

  if (!token) {
    throw new Error('La API CNE no devolvió un token válido.');
  }

  cachedToken = token;
  tokenFetchedAt = Date.now();
  return token;
}

function getOneMonthAgoCutoff(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), 0, 0, 0, 0);
}

function parseUpdateDate(dateStr: any, timeStr: any): { dateObj: Date | null; formatted: string | null } {
  if (!dateStr || typeof dateStr !== 'string') {
    return { dateObj: null, formatted: null };
  }

  const cleanDate = dateStr.trim();
  const cleanTime = typeof timeStr === 'string' && timeStr.trim() ? timeStr.trim() : '00:00:00';

  let isoCandidate = `${cleanDate}T${cleanTime}`;
  const dmyMatch = cleanDate.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (dmyMatch) {
    isoCandidate = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}T${cleanTime}`;
  }

  const parsed = new Date(isoCandidate);
  if (Number.isNaN(parsed.getTime())) {
    return { dateObj: null, formatted: null };
  }

  const displayDate = dmyMatch
    ? `${dmyMatch[1]}-${dmyMatch[2]}-${dmyMatch[3]}`
    : cleanDate;

  return {
    dateObj: parsed,
    formatted: timeStr ? `${displayDate} ${cleanTime.slice(0, 5)}` : displayDate,
  };
}

// La API CNE v4 envía decimales con punto (ej. "1452.000" o "625.000")
function parseClpPrice(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'object') {
    val = val.precio ?? val.valor ?? val.price ?? null;
  }

  let num: number;
  if (typeof val === 'number') {
    num = val;
  } else {
    const clean = String(val).trim().replace(',', '.');
    num = Number(clean);
  }

  if (!Number.isFinite(num) || num <= 0) return null;

  // Resguardo en caso de que algún registro venga multiplicado por 1000
  if (num >= 100000) {
    num = num / 1000;
  }

  return Math.round(num);
}

function extractRecentFuels(raw: any, cutoffDate: Date) {
  let p93: number | null = null;
  let p95: number | null = null;
  let p97: number | null = null;
  let diesel: number | null = null;
  let kerosene: number | null = null;
  let glp: number | null = null;

  let latestDateObj: Date | null = null;
  let latestFormatted: string | null = null;

  const trackLatest = (dateObj: Date | null, formatted: string | null) => {
    if (!dateObj || !formatted) return;
    if (!latestDateObj || dateObj.getTime() > latestDateObj.getTime()) {
      latestDateObj = dateObj;
      latestFormatted = formatted;
    }
  };

  const assignByKey = (keyRaw: string, fuelEntry: any) => {
    const k = String(keyRaw || '').toLowerCase().trim();
    const price = parseClpPrice(fuelEntry);
    if (!price) return;

    const fechaRaw = typeof fuelEntry === 'object' ? fuelEntry?.fecha_actualizacion : null;
    const horaRaw = typeof fuelEntry === 'object' ? fuelEntry?.hora_actualizacion : null;
    const { dateObj, formatted } = parseUpdateDate(fechaRaw, horaRaw);

    if (!dateObj || dateObj.getTime() < cutoffDate.getTime()) {
      return;
    }

    trackLatest(dateObj, formatted);

    if (k === '93' || k.includes('93')) p93 = price;
    else if (k === '95' || k.includes('95')) p95 = price;
    else if (k === '97' || k.includes('97')) p97 = price;
    else if (k.includes('diesel') || k.includes('diésel') || k === 'di' || k.includes('petroleo')) diesel = price;
    else if (k.includes('kerosene') || k.includes('parafina') || k === 'ke') kerosene = price;
    else if (k.includes('glp') || k.includes('licuado')) glp = price;
  };

  if (raw?.precios && typeof raw.precios === 'object' && !Array.isArray(raw.precios)) {
    for (const [fuelKey, fuelObj] of Object.entries(raw.precios)) {
      assignByKey(fuelKey, fuelObj);
    }
  } else if (Array.isArray(raw?.precios)) {
    for (const item of raw.precios) {
      const label = item?.nombre_combustible || item?.tipo_combustible || item?.combustible || item?.codigo || '';
      assignByKey(label, item);
    }
  }

  return {
    p93,
    p95,
    p97,
    diesel,
    kerosene,
    glp,
    lastUpdatedDate: latestFormatted,
  };
}

function normalizeStation(raw: any, index: number, cutoffDate: Date) {
  const { p93, p95, p97, diesel, kerosene, glp, lastUpdatedDate } = extractRecentFuels(raw, cutoffDate);

  if (!lastUpdatedDate) return null;

  const brand =
    raw?.distribuidor?.marca ||
    raw?.distribuidor?.nombre ||
    (typeof raw?.distribuidor === 'string' ? raw.distribuidor : '') ||
    'Sin bandera';

  const ub = raw?.ubicacion || {};
  const commune = ub?.nombre_comuna || raw?.nombre_comuna || 'Sin comuna';
  const region = ub?.nombre_region || raw?.nombre_region || '';
  const codRegion = String(ub?.codigo_region ?? raw?.codigo_region ?? '');
  const address = ub?.direccion || raw?.direccion || 'Dirección no disponible';

  const lat = Number(ub?.latitud ?? raw?.latitud ?? 0) || null;
  const lng = Number(ub?.longitud ?? raw?.longitud ?? 0) || null;

  const stationName =
    raw?.razon_social ||
    raw?.nombre ||
    `${brand} - ${commune}`;

  const id = String(raw?.codigo || raw?.id || `cne-${index}`);

  return {
    id,
    external_id: id,
    name: String(stationName).trim(),
    brand: String(brand).trim(),
    logo: raw?.distribuidor?.logo || null,
    region: String(region).trim(),
    cod_region: codRegion,
    commune: String(commune).trim(),
    address: String(address).trim(),
    lat,
    lng,
    p93,
    p95,
    p97,
    diesel,
    kerosene,
    glp,
    price_93: p93,
    price_95: p95,
    price_97: p97,
    price_diesel: diesel,
    price_kerosene: kerosene,
    price_glp: glp,
    en_mantenimiento: Number(raw?.en_mantenimiento || 0),
    last_updated: lastUpdatedDate,
    updated_at: lastUpdatedDate,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let bodyParams: any = {};
    if (req.method === 'POST') {
      try {
        bodyParams = await req.json();
      } catch {
        bodyParams = {};
      }
    }

    const regionFilter = String(bodyParams?.regionFilter || '').trim();
    const forceRetry = Boolean(bodyParams?.forceRetry);

    let token = await getCneToken(forceRetry);

    let stationsRes = await fetch(`${CNE_BASE_URL}/v4/estaciones`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (stationsRes.status === 401) {
      token = await getCneToken(true);
      stationsRes = await fetch(`${CNE_BASE_URL}/v4/estaciones`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
    }

    if (!stationsRes.ok) {
      const errDetail = await stationsRes.text();
      throw new Error(`Error CNE /v4/estaciones (${stationsRes.status}): ${errDetail}`);
    }

    const rawPayload = await stationsRes.json();

    let rawList: any[] = [];
    if (Array.isArray(rawPayload)) {
      rawList = rawPayload;
    } else if (Array.isArray(rawPayload?.data)) {
      rawList = rawPayload.data;
    } else if (Array.isArray(rawPayload?.estaciones)) {
      rawList = rawPayload.estaciones;
    }

    const cutoffDate = getOneMonthAgoCutoff();

    let normalized = rawList
      .map((item, idx) => normalizeStation(item, idx, cutoffDate))
      .filter(Boolean);

    if (regionFilter && regionFilter.toLowerCase() !== 'todas') {
      const rf = regionFilter.toLowerCase();
      const byRegion = normalized.filter((st) => {
        const regName = st.region.toLowerCase();
        if (rf.includes('metropolitana')) {
          return regName.includes('metropolitana') || st.cod_region === '13';
        }
        return regName.includes(rf) || st.cod_region === rf;
      });

      if (byRegion.length > 0) {
        normalized = byRegion;
      }
    }

    return new Response(
      JSON.stringify({
        total: normalized.length,
        stations: normalized,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || 'Error interno al consultar API CNE v4' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});