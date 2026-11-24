/*
  Nombre del archivo: DashboardView.jsx
  Propósito: Dashboard ejecutivo de RendixApp con iconografía profesional Lucide,
  KPIs financieros, cotización UF/USD en vivo y gráficos integrados (evolución mensual
  y distribución por categoría) sin necesidad de abrir modales.
*/

import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Car,
  BookOpen,
  FileDown,
  TrendingUp,
  Fuel,
  Gauge,
  CircleDollarSign,
  Wrench,
  Landmark,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { generatePdfReport } from '../utils/pdfGenerator';
import { getDaysUntilExpiration, formatDateCL } from '../utils/dateHelper';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const MONTH_NAMES = {
  '01': 'Ene',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Abr',
  '05': 'May',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Ago',
  '09': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dic'
};

function formatMonthLabel(ym) {
  if (!ym || !ym.includes('-')) return ym;
  const [year, month] = ym.split('-');
  return `${MONTH_NAMES[month] || month} ${year.slice(2)}`;
}

export default function DashboardView({
  vehicles = [],
  filteredVehicles,
  filteredFuels = [],
  filteredExpenses = [],
  totalFuelCost = 0,
  totalExpenses = 0,
  totalCargas = 0,
  avgKm = '0.0',
  costPerKm = '0',
  dashVehicleFilter = 'all',
  setDashVehicleFilter,
  setActiveTab
}) {
  const [indicators, setIndicators] = useState({ uf: 41226.39, dolar: 994.29 });
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('https://findic.cl/api/uf').then((res) => res.json()).catch(() => null),
      fetch('https://findic.cl/api/dolar').then((res) => res.json()).catch(() => null)
    ])
      .then(([ufData, dolarData]) => {
        const ufVal = ufData?.serie?.[0]?.valor || ufData?.valor || 41226.39;
        const dolarVal = dolarData?.serie?.[0]?.valor || dolarData?.valor || 994.29;
        setIndicators({ uf: Number(ufVal), dolar: Number(dolarVal) });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalGeneral = totalFuelCost + totalExpenses;
  const scopedVehicles = filteredVehicles || vehicles;

  // Cálculo de alertas
  let urgentAlerts = 0;
  let warningAlerts = 0;

  vehicles.forEach((v) => {
    const currentKm = Number(v.currentKm || 0);
    const lastServiceKm = Number(v.last_service_km || 0);
    const intervalKm = 10000;
    const nextServiceKm =
      lastServiceKm > 0
        ? lastServiceKm + intervalKm
        : Math.ceil((currentKm + 1) / intervalKm) * intervalKm;
    const remainingKm = nextServiceKm - currentKm;

    if (lastServiceKm > 0 && remainingKm <= 0) urgentAlerts++;
    else if (lastServiceKm > 0 && remainingKm <= 1500) warningAlerts++;

    const docs = [
      v.soap_expiration,
      v.permiso_circulacion_expiration,
      v.revision_tecnica_expiration,
      v.seguro_privado_expiration,
      v.licencia_conducir_expiration
    ];
    docs.forEach((dateStr) => {
      const diffDays = getDaysUntilExpiration(dateStr);
      if (diffDays !== null) {
        if (diffDays < 0) urgentAlerts++;
        else if (diffDays <= 30) warningAlerts++;
      }
    });
  });

  // Datos para Gráfico 1: Tendencia mensual (AreaChart)
  const monthlyTrendData = useMemo(() => {
    const map = {};
    filteredFuels.forEach((f) => {
      const ym = f.date ? String(f.date).substring(0, 7) : null;
      if (!ym) return;
      if (!map[ym]) map[ym] = { ym, bencina: 0, operativos: 0, total: 0 };
      const val = Number(f.total || 0);
      map[ym].bencina += val;
      map[ym].total += val;
    });

    filteredExpenses.forEach((e) => {
      const ym = e.date ? String(e.date).substring(0, 7) : null;
      if (!ym) return;
      if (!map[ym]) map[ym] = { ym, bencina: 0, operativos: 0, total: 0 };
      const val = Number(e.amount || 0);
      map[ym].operativos += val;
      map[ym].total += val;
    });

    return Object.values(map)
      .sort((a, b) => a.ym.localeCompare(b.ym))
      .map((item) => ({
        ...item,
        label: formatMonthLabel(item.ym)
      }));
  }, [filteredFuels, filteredExpenses]);

  // Datos para Gráfico 2: Distribución por Categoría (Donut)
  const categoryBreakdown = useMemo(() => {
    const catMap = {};
    if (totalFuelCost > 0) {
      catMap['Combustible'] = Number(totalFuelCost);
    }
    filteredExpenses.forEach((e) => {
      const cat = e.category || 'Otros';
      catMap[cat] = (catMap[cat] || 0) + Number(e.amount || 0);
    });

    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [totalFuelCost, filteredExpenses]);

  // Últimos 5 movimientos combinados
  const recentActivity = useMemo(() => {
    const fuelItems = filteredFuels.map((f) => ({
      id: `f-${f.id}`,
      type: 'fuel',
      date: f.date || '',
      title: `Carga ${Number(f.liters || 0).toFixed(1)} L${f.station ? ` • ${f.station}` : ''}`,
      vehicleId: f.vehicle_id || f.vehicleId,
      amount: Number(f.total || 0)
    }));

    const expItems = filteredExpenses.map((e) => ({
      id: `e-${e.id}`,
      type: 'expense',
      date: e.date || '',
      title: `${e.category || 'Gasto'}${e.description ? ` • ${e.description}` : ''}`,
      vehicleId: e.vehicle_id || e.vehicleId,
      amount: Number(e.amount || 0)
    }));

    return [...fuelItems, ...expItems]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 5);
  }, [filteredFuels, filteredExpenses]);

  const handleExportPdf = () => {
    generatePdfReport({
      vehicles: scopedVehicles,
      allVehicles: vehicles,
      fuelRecords: filteredFuels,
      expenses: filteredExpenses,
      totalFuelCost,
      totalExpenses,
      avgKm,
      costPerKm,
      dashVehicleFilter,
      indicators
    });
  };

  const kpiCards = [
    {
      label: `Gasto Bencina (${totalCargas})`,
      value: `$${Number(totalFuelCost).toLocaleString('es-CL')}`,
      sub: 'Acumulado combustible',
      accent: '#38bdf8',
      iconBg: 'rgba(56, 189, 248, 0.14)',
      Icon: Fuel
    },
    {
      label: 'Rendimiento Prom.',
      value: `${avgKm}`,
      unit: 'km/l',
      sub: 'Configuración de flota',
      accent: '#22c55e',
      iconBg: 'rgba(34, 197, 94, 0.14)',
      Icon: Gauge
    },
    {
      label: 'Costo Real / Km',
      value: `$${costPerKm}`,
      unit: '/ km',
      sub: 'TCO operativo total',
      accent: '#06b6d4',
      iconBg: 'rgba(6, 182, 212, 0.14)',
      Icon: CircleDollarSign,
      highlight: true
    },
    {
      label: 'Gastos Operativos',
      value: `$${Number(totalExpenses).toLocaleString('es-CL')}`,
      sub: 'TAG, mantenciones y otros',
      accent: '#f43f5e',
      iconBg: 'rgba(244, 63, 94, 0.14)',
      Icon: Wrench
    },
    {
      label: 'Consolidado UF / USD',
      value: `${indicators.uf > 0 ? (totalGeneral / indicators.uf).toFixed(2) : '0.00'} UF`,
      sub: `US$ ${indicators.dolar > 0 ? (totalGeneral / indicators.dolar).toFixed(2) : '0.00'}`,
      accent: '#818cf8',
      iconBg: 'rgba(129, 140, 248, 0.14)',
      Icon: Landmark
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
      {/* BANNER DE ESTADO / ALERTAS */}
      {urgentAlerts > 0 || warningAlerts > 0 ? (
        <div
          onClick={() => setActiveTab('alerts')}
          style={{
            background: urgentAlerts > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.09)',
            border: `1px solid ${urgentAlerts > 0 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
            borderRadius: '14px',
            padding: '13px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: urgentAlerts > 0 ? 'rgba(239, 68, 68, 0.16)' : 'rgba(245, 158, 11, 0.16)',
                color: urgentAlerts > 0 ? '#ef4444' : '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <h4
                style={{
                  margin: 0,
                  color: urgentAlerts > 0 ? '#ef4444' : '#d97706',
                  fontSize: '14px',
                  fontWeight: '800'
                }}
              >
                Atención Requerida en tu Flota
              </h4>
              <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
                {urgentAlerts > 0 ? `${urgentAlerts} alerta(s) urgente(s). ` : ''}
                {warningAlerts > 0 ? `${warningAlerts} vencimiento(s) próximo(s).` : ''}
              </p>
            </div>
          </div>
          <span
            style={{
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: '700',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              padding: '7px 12px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Revisar Alertas <ArrowRight size={14} />
          </span>
        </div>
      ) : (
        <div
          style={{
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.28)',
            borderRadius: '14px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 style={{ margin: 0, color: '#16a34a', fontSize: '14px', fontWeight: '800' }}>
              Flota Operativa al Día
            </h4>
            <p style={{ margin: '1px 0 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
              Todos los documentos legales y mantenciones preventivas están vigentes.
            </p>
          </div>
        </div>
      )}

      {/* CABECERA ALINEADA A LA IZQUIERDA */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <h2
            style={{
              margin: 0,
              fontSize: '24px',
              color: 'var(--text-primary)',
              fontWeight: '900',
              letterSpacing: '-0.5px'
            }}
          >
            Dashboard General
          </h2>
          <p style={{ margin: '3px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Resumen financiero, indicadores económicos y analítica de costos en tiempo real.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-card)',
              padding: '7px 12px',
              borderRadius: '9px',
              border: '1px solid var(--border-color)'
            }}
          >
            <Car size={15} color="#38bdf8" />
            <select
              value={dashVehicleFilter}
              onChange={(e) => setDashVehicleFilter(e.target.value)}
              style={{
                background: 'transparent',
                color: 'var(--text-primary)',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: '700',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all" style={{ background: 'var(--bg-card)' }}>
                Todos los vehículos ({vehicles.length})
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} style={{ background: 'var(--bg-card)' }}>
                  {v.name} ({v.plate})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowGuide(!showGuide)}
            style={{
              background: showGuide ? '#0284c7' : 'var(--bg-card)',
              color: showGuide ? '#ffffff' : 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '8px 13px',
              borderRadius: '9px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <BookOpen size={14} />
            {showGuide ? 'Ocultar Guía' : 'Guía Rápida'}
          </button>

          <button
            onClick={handleExportPdf}
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '9px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.28)'
            }}
          >
            <FileDown size={14} />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* GUÍA RÁPIDA OPCIONAL */}
      {showGuide && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '14px',
            padding: '16px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px'
          }}
        >
          <div style={{ background: 'var(--bg-card-inner)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#38bdf8', marginBottom: '4px' }}>
              1. Flota y Rendimiento
            </div>
            <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              Registra tus vehículos con patente chilena (PRT automática) y define su rendimiento manual (km/L).
            </p>
          </div>
          <div style={{ background: 'var(--bg-card-inner)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#22c55e', marginBottom: '4px' }}>
              2. Costo Real por Km (TCO)
            </div>
            <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              Combina tus cargas de combustible y gastos operativos dividido por los kilómetros estimados recorridos.
            </p>
          </div>
          <div style={{ background: 'var(--bg-card-inner)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#818cf8', marginBottom: '4px' }}>
              3. Cotizador y Guantera
            </div>
            <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              Calcula tarifas de fletes con rutas de Google Maps y respalda tus 5 documentos legales en la nube.
            </p>
          </div>
        </div>
      )}

      {/* INDICADORES ECONÓMICOS FINDIC */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.14)',
              color: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <TrendingUp size={19} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '800' }}>
                Indicadores Económicos • Findic
              </span>
              <span
                style={{
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#22c55e',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  fontSize: '9px',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '999px'
                }}
              >
                EN VIVO
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              Indexación automática de gastos consolidados a UF y Dólar Observado.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px' }}>
              VALOR UF
            </span>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#38bdf8' }}>
              {loading ? '...' : `$${Number(indicators.uf).toLocaleString('es-CL', { minimumFractionDigits: 2 })}`}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '20px', textAlign: 'right' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.5px' }}>
              DÓLAR OBSERVADO
            </span>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#22c55e' }}>
              {loading ? '...' : `$${Number(indicators.dolar).toLocaleString('es-CL', { minimumFractionDigits: 2 })}`}
            </div>
          </div>
        </div>
      </div>

      {/* TARJETAS KPI */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          width: '100%'
        }}
      >
        {kpiCards.map((kpi, idx) => {
          const IconComponent = kpi.Icon;
          return (
            <div
              key={idx}
              style={{
                padding: '16px 18px',
                background: 'var(--bg-card)',
                border: kpi.highlight
                  ? '1px solid rgba(6, 182, 212, 0.45)'
                  : '1px solid var(--border-color)',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px'
                  }}
                >
                  {kpi.label}
                </span>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: kpi.iconBg,
                    color: kpi.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <IconComponent size={16} />
                </div>
              </div>

              <div>
                <div style={{ color: kpi.accent, fontSize: '22px', fontWeight: '900', lineHeight: 1.15 }}>
                  {kpi.value}{' '}
                  {kpi.unit && (
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      {kpi.unit}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {kpi.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECCIÓN DE GRÁFICOS DIRECTOS EN EL DASHBOARD */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '16px',
          width: '100%'
        }}
      >
        {/* GRÁFICO 1: EVOLUCIÓN MENSUAL DE GASTOS */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            gridColumn: 'span 1'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '9px',
                  background: 'rgba(59, 130, 246, 0.14)',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Evolución Mensual de Gastos
                </h3>
                <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  Comparativa entre cargas de combustible y gastos operativos
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', fontWeight: '700' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#38bdf8' }} />
                Combustible
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f43f5e' }} />
                Operativos
              </span>
            </div>
          </div>

          {monthlyTrendData.length === 0 ? (
            <div
              style={{
                height: '250px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-card-inner)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontSize: '13px'
              }}
            >
              Registra cargas o gastos para visualizar la tendencia mensual.
            </div>
          ) : (
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradFuel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="var(--text-secondary)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--text-secondary)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={62}
                    tickFormatter={(val) =>
                      val >= 1000 ? `$${Math.round(val / 1000)}k` : `$${val}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)',
                      fontSize: '12px'
                    }}
                    formatter={(val, name) => [
                      `$${Number(val).toLocaleString('es-CL')}`,
                      name === 'bencina' ? 'Combustible' : 'Gastos Operativos'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="bencina"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradFuel)"
                    dot={{ r: 3.5, fill: '#38bdf8' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="operativos"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradExp)"
                    dot={{ r: 3.5, fill: '#f43f5e' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* GRÁFICO 2: DISTRIBUCIÓN DE COSTOS POR CATEGORÍA */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: 'rgba(16, 185, 129, 0.14)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PieChartIcon size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                Distribución del Gasto Total
              </h3>
              <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                Participación por rubro sobre ${totalGeneral.toLocaleString('es-CL')}
              </p>
            </div>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div
              style={{
                height: '250px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-card-inner)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontSize: '13px'
              }}
            >
              Aún no hay movimientos registrados para distribuir.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: '10px', minHeight: '260px' }}>
              <div style={{ width: '100%', height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={3}
                    >
                      {categoryBreakdown.map((entry, idx) => (
                        <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-card)',
                        borderColor: 'var(--border-color)',
                        borderRadius: '10px',
                        color: 'var(--text-primary)',
                        fontSize: '12px'
                      }}
                      formatter={(val) => [`$${Number(val).toLocaleString('es-CL')}`, 'Monto']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categoryBreakdown.map((item, idx) => {
                  const pct = totalGeneral > 0 ? ((item.value / totalGeneral) * 100).toFixed(1) : '0.0';
                  const color = PIE_COLORS[idx % PIE_COLORS.length];
                  return (
                    <div
                      key={item.name}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '7px 10px',
                        borderRadius: '8px',
                        background: 'var(--bg-card-inner)',
                        border: '1px solid var(--border-color)',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', overflow: 'hidden' }}>
                        <span
                          style={{
                            width: '9px',
                            height: '9px',
                            borderRadius: '50%',
                            background: color,
                            flexShrink: 0
                          }}
                        />
                        <span
                          style={{
                            color: 'var(--text-primary)',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span style={{ fontWeight: '800', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACTIVIDAD RECIENTE */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '18px 20px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: '800', color: 'var(--text-primary)' }}>
              Últimos Movimientos Registrados
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('fuel')}
              style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
            >
              Ver cargas →
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
            >
              Ver gastos →
            </button>
          </div>
        </div>

        {recentActivity.length === 0 ? (
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            No hay movimientos recientes en el filtro seleccionado.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentActivity.map((item) => {
              const veh = vehicles.find((v) => v.id === item.vehicleId);
              const isFuel = item.type === 'fuel';
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'var(--bg-card-inner)',
                    border: '1px solid var(--border-color)',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        background: isFuel ? 'rgba(56, 189, 248, 0.14)' : 'rgba(244, 63, 94, 0.14)',
                        color: isFuel ? '#38bdf8' : '#f43f5e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {isFuel ? <Fuel size={15} /> : <ReceiptIcon size={15} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {veh ? `${veh.name} (${veh.plate})` : 'Vehículo'} • {formatDateCL(item.date)}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: '800',
                      color: isFuel ? '#38bdf8' : '#f43f5e'
                    }}
                  >
                    ${item.amount.toLocaleString('es-CL')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ReceiptIcon({ size = 15 }) {
  return <Wrench size={size} />;
}