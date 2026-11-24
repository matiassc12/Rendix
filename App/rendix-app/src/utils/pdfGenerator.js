/*
  Nombre del archivo: src/utils/pdfGenerator.js
  Propósito: Genera un reporte ejecutivo imprimible (PDF) de 5 secciones con KPIs financieros,
  conversión UF/USD (Findic API), inventario vehicular, estado de los 5 documentos legales
  en hora local, desglose de gastos operativos e historial de cargas de combustible.
*/

import { getDaysUntilExpiration, formatDateCL } from './dateHelper';

const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatDateShort = (dateStr) => {
  return escapeHtml(formatDateCL(dateStr));
};

const formatCurrency = (amount) => {
  return `$${Math.round(Number(amount || 0)).toLocaleString('es-CL')}`;
};

const getFuelTypeLabel = (fuelType) => {
  switch (String(fuelType || '').toLowerCase()) {
    case '93':
    case 'p93':
      return 'Gasolina 93';
    case '95':
    case 'p95':
      return 'Gasolina 95';
    case '97':
    case 'p97':
      return 'Gasolina 97';
    case 'diesel':
      return 'Diésel';
    case 'kerosene':
      return 'Kerosene';
    default:
      return escapeHtml(fuelType || '—');
  }
};

const getDocStatusBadge = (dateStr) => {
  const diffDays = getDaysUntilExpiration(dateStr);
  if (diffDays === null) {
    return `<span style="color: #64748b;">No configurada</span>`;
  }
  const formatted = formatDateShort(dateStr);

  if (diffDays < 0) {
    return `<strong style="color: #dc2626;">${formatted}</strong> <span style="background: #fee2e2; color: #b91c1c; padding: 1px 5px; border-radius: 3px; font-size: 10px; font-weight: bold;">VENCIDO</span>`;
  }
  if (diffDays <= 30) {
    return `<strong style="color: #d97706;">${formatted}</strong> <span style="background: #fef3c7; color: #b45309; padding: 1px 5px; border-radius: 3px; font-size: 10px; font-weight: bold;">${diffDays}d</span>`;
  }
  return `<strong style="color: #0f172a;">${formatted}</strong> <span style="background: #dcfce7; color: #15803d; padding: 1px 5px; border-radius: 3px; font-size: 10px; font-weight: bold;">AL DÍA</span>`;
};

export function generatePdfReport({
  vehicles = [],
  allVehicles = [],
  fuelRecords = [],
  expenses = [],
  totalFuelCost = 0,
  totalExpenses = 0,
  avgKm = '0.0',
  costPerKm = '0',
  dashVehicleFilter = 'all',
  indicators = { uf: 0, dolar: 0 }
}) {
  const vehicleCatalog = allVehicles.length > 0 ? allVehicles : vehicles;

  const resolveVehicleLabel = (vId) => {
    const found = vehicleCatalog.find((v) => v.id === vId);
    if (!found) return 'Vehículo no registrado';
    return `${escapeHtml(found.name)} (${escapeHtml(found.plate || 'S/P')})`;
  };

  const selectedVehicleObj =
    dashVehicleFilter !== 'all'
      ? vehicleCatalog.find((v) => v.id === dashVehicleFilter)
      : null;

  const scopeTitle = selectedVehicleObj
    ? `${escapeHtml(selectedVehicleObj.name)} — Patente ${escapeHtml(selectedVehicleObj.plate || 'SIN PATENTE')}`
    : `Flota Completa (${vehicles.length} vehículo${vehicles.length === 1 ? '' : 's'})`;

  const now = new Date();
  const emissionDate = now.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const emissionTime = now.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalGeneral = Number(totalFuelCost || 0) + Number(totalExpenses || 0);
  const ufRate = Number(indicators?.uf || 0);
  const usdRate = Number(indicators?.dolar || 0);
  const totalUF = ufRate > 0 ? (totalGeneral / ufRate).toFixed(2) : '0.00';
  const totalUSD = usdRate > 0 ? (totalGeneral / usdRate).toFixed(2) : '0.00';

  // Agrupación de gastos por categoría (Sección 4)
  const categoryTotals = {};
  expenses.forEach((exp) => {
    const cat = exp.category || 'Otro';
    if (!categoryTotals[cat]) {
      categoryTotals[cat] = { count: 0, amount: 0 };
    }
    categoryTotals[cat].count += 1;
    categoryTotals[cat].amount += Number(exp.amount || 0);
  });

  const sortedCategories = Object.entries(categoryTotals).sort(
    (a, b) => b[1].amount - a[1].amount
  );

  // Totales de combustible (Sección 5)
  const totalLiters = fuelRecords.reduce((acc, r) => acc + Number(r.liters || 0), 0);

  // Filas Sección 2: Inventario
  const inventoryRowsHtml =
    vehicles.length === 0
      ? `<tr><td colspan="6" style="text-align:center;color:#64748b;padding:14px;">Sin vehículos registrados en este filtro.</td></tr>`
      : vehicles
          .map((v) => {
            const avatar = v.image_url
              ? `<img src="${escapeHtml(v.image_url)}" alt="${escapeHtml(v.name)}" style="width:42px;height:30px;object-fit:cover;border-radius:4px;border:1px solid #cbd5e1;" onerror="this.style.display='none'" />`
              : `<div style="width:42px;height:30px;background:#e2e8f0;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:14px;">🚗</div>`;

            const effText =
              Number(v.manual_efficiency) > 0
                ? `${Number(v.manual_efficiency).toFixed(1)} km/L`
                : 'No definido';

            const serviceText =
              Number(v.last_service_km) > 0
                ? `${Number(v.last_service_km).toLocaleString('es-CL')} km${v.last_service_date ? ` (${formatDateShort(v.last_service_date)})` : ''}`
                : 'Sin registro';

            return `
              <tr>
                <td style="width:50px;">${avatar}</td>
                <td>
                  <strong>${escapeHtml(v.name)}</strong><br/>
                  <span style="font-size:10px;color:#475569;">${escapeHtml(v.brand)} ${escapeHtml(v.model)} (${escapeHtml(v.year)})</span>
                </td>
                <td><span style="background:#f1f5f9;border:1px solid #cbd5e1;padding:2px 6px;border-radius:4px;font-weight:700;font-size:11px;">${escapeHtml(v.plate || 'S/P')}</span></td>
                <td style="text-align:right;font-weight:600;">${Number(v.currentKm || 0).toLocaleString('es-CL')} km</td>
                <td style="text-align:right;font-weight:700;color:#15803d;">${effText}</td>
                <td style="font-size:11px;color:#334155;">${serviceText}</td>
              </tr>
            `;
          })
          .join('');

  // Filas Sección 3: Guantera Digital (5 documentos)
  const documentsRowsHtml =
    vehicles.length === 0
      ? `<tr><td colspan="6" style="text-align:center;color:#64748b;padding:14px;">Sin vehículos para evaluar documentación.</td></tr>`
      : vehicles
          .map(
            (v) => `
              <tr>
                <td>
                  <strong>${escapeHtml(v.name)}</strong><br/>
                  <span style="font-size:10px;color:#64748b;">${escapeHtml(v.plate || 'S/P')}</span>
                </td>
                <td>${getDocStatusBadge(v.soap_expiration)}</td>
                <td>${getDocStatusBadge(v.permiso_circulacion_expiration)}</td>
                <td>${getDocStatusBadge(v.revision_tecnica_expiration)}</td>
                <td>${getDocStatusBadge(v.seguro_privado_expiration)}</td>
                <td>${getDocStatusBadge(v.licencia_conducir_expiration)}</td>
              </tr>
            `
          )
          .join('');

  // Filas Sección 4A: Resumen por Categoría
  const categorySummaryRowsHtml =
    sortedCategories.length === 0
      ? `<tr><td colspan="4" style="text-align:center;color:#64748b;padding:12px;">Sin gastos operativos registrados.</td></tr>`
      : sortedCategories
          .map(([cat, info]) => {
            const pct =
              totalExpenses > 0 ? ((info.amount / totalExpenses) * 100).toFixed(1) : '0.0';
            return `
              <tr>
                <td><strong>${escapeHtml(cat)}</strong></td>
                <td style="text-align:center;">${info.count}</td>
                <td style="text-align:right;font-weight:700;">${formatCurrency(info.amount)}</td>
                <td style="text-align:right;color:#475569;">${pct}%</td>
              </tr>
            `;
          })
          .join('');

  // Filas Sección 4B: Detalle de Gastos Operativos
  const expenseRowsHtml =
    expenses.length === 0
      ? `<tr><td colspan="5" style="text-align:center;color:#64748b;padding:14px;">No hay movimientos de gastos operativos en este período.</td></tr>`
      : expenses
          .map((exp) => {
            const vId = exp.vehicle_id || exp.vehicleId;
            return `
              <tr>
                <td>${formatDateShort(exp.date)}</td>
                <td>${resolveVehicleLabel(vId)}</td>
                <td><span style="background:#f1f5f9;border:1px solid #cbd5e1;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:600;">${escapeHtml(exp.category || 'General')}</span></td>
                <td style="color:#334155;">${escapeHtml(exp.description || '—')}</td>
                <td style="text-align:right;font-weight:700;color:#be123c;">${formatCurrency(exp.amount)}</td>
              </tr>
            `;
          })
          .join('');

  // Filas Sección 5: Historial de Cargas de Combustible
  const fuelRowsHtml =
    fuelRecords.length === 0
      ? `<tr><td colspan="7" style="text-align:center;color:#64748b;padding:14px;">No hay cargas de combustible registradas.</td></tr>`
      : fuelRecords
          .map((rec) => {
            const vId = rec.vehicle_id || rec.vehicleId;
            const liters = Number(rec.liters || 0);
            const total = Number(rec.total || 0);
            const unitPrice = liters > 0 && total > 0 ? Math.round(total / liters) : 0;
            const odo = Number(rec.odometer || 0);

            return `
              <tr>
                <td>${formatDateShort(rec.date)}</td>
                <td>${resolveVehicleLabel(vId)}</td>
                <td>${getFuelTypeLabel(rec.fuel_type)}</td>
                <td>${escapeHtml(rec.station || '—')}</td>
                <td style="text-align:right;">${odo > 0 ? `${odo.toLocaleString('es-CL')} km` : '—'}</td>
                <td style="text-align:right;font-weight:600;">${liters.toFixed(2)} L</td>
                <td style="text-align:right;color:#475569;">${unitPrice > 0 ? `${formatCurrency(unitPrice)}/L` : '—'}</td>
                <td style="text-align:right;font-weight:700;color:#15803d;">${formatCurrency(total)}</td>
              </tr>
            `;
          })
          .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Reporte Ejecutivo RendixApp - ${escapeHtml(emissionDate)}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 14mm 12mm;
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 0;
          font-size: 11px;
          line-height: 1.4;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #1d4ed8;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .brand h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        .brand h1 span {
          color: #2563eb;
        }
        .brand p {
          margin: 3px 0 0 0;
          font-size: 11px;
          color: #475569;
          font-weight: 600;
        }
        .meta {
          text-align: right;
          font-size: 10px;
          color: #475569;
        }
        .meta strong {
          color: #0f172a;
        }
        .section {
          margin-bottom: 18px;
          page-break-inside: avoid;
        }
        .section-allow-break {
          margin-bottom: 18px;
        }
        .section-title {
          font-size: 13px;
          font-weight: 800;
          color: #1e3a8a;
          background: #eff6ff;
          border-left: 4px solid #2563eb;
          padding: 6px 10px;
          margin: 0 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 10px;
        }
        .kpi-card {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 12px;
          background: #f8fafc;
        }
        .kpi-label {
          font-size: 9px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
        }
        .kpi-value {
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
          margin-top: 3px;
        }
        .kpi-sub {
          font-size: 9px;
          color: #64748b;
          margin-top: 2px;
        }
        .indicators-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 7px 12px;
          font-size: 10px;
          color: #334155;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
        }
        th {
          background: #f1f5f9;
          color: #334155;
          font-weight: 800;
          text-align: left;
          padding: 7px 8px;
          border-top: 1px solid #cbd5e1;
          border-bottom: 1px solid #cbd5e1;
          font-size: 9.5px;
          text-transform: uppercase;
        }
        td {
          padding: 6px 8px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: middle;
        }
        tr:nth-child(even) td {
          background: #fafbfc;
        }
        tfoot td {
          background: #f1f5f9 !important;
          font-weight: 800;
          border-top: 1.5px solid #94a3b8;
          border-bottom: 1.5px solid #94a3b8;
        }
        .footer {
          margin-top: 20px;
          padding-top: 8px;
          border-top: 1px solid #cbd5e1;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <!-- ENCABEZADO -->
      <div class="header">
        <div class="brand">
          <h1>Rendix<span>App</span></h1>
          <p>Informe Ejecutivo de Gestión Vehicular, Normativa y Costos Operativos</p>
        </div>
        <div class="meta">
          <div><strong>Alcance:</strong> ${scopeTitle}</div>
          <div><strong>Fecha de emisión:</strong> ${escapeHtml(emissionDate)} • ${escapeHtml(emissionTime)}</div>
          <div><strong>Plataforma:</strong> Rendix Cloud • Duoc UC</div>
        </div>
      </div>

      <!-- SECCIÓN 1: RESUMEN FINANCIERO E INDICADORES ECONÓMICOS -->
      <div class="section">
        <h2 class="section-title">1. Resumen Financiero Ejecutivo e Indexación (Findic API)</h2>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Gasto Total Combustible (${fuelRecords.length} cargas)</div>
            <div class="kpi-value" style="color:#0284c7;">${formatCurrency(totalFuelCost)}</div>
            <div class="kpi-sub">${totalLiters.toFixed(1)} litros acumulados</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Gastos Operativos (${expenses.length} mov.)</div>
            <div class="kpi-value" style="color:#be123c;">${formatCurrency(totalExpenses)}</div>
            <div class="kpi-sub">TAG, mantenciones, peajes y otros</div>
          </div>
          <div class="kpi-card" style="background:#eff6ff;border-color:#93c5fd;">
            <div class="kpi-label">Gasto Total Consolidado</div>
            <div class="kpi-value" style="color:#1d4ed8;">${formatCurrency(totalGeneral)}</div>
            <div class="kpi-sub"><strong>${totalUF} UF</strong> • <strong>US$ ${totalUSD}</strong></div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Rendimiento Promedio Flota</div>
            <div class="kpi-value" style="color:#15803d;">${escapeHtml(avgKm)} km/L</div>
            <div class="kpi-sub">Configuración manual por vehículo</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Costo Real por Kilómetro</div>
            <div class="kpi-value" style="color:#0891b2;">$${escapeHtml(costPerKm)} / km</div>
            <div class="kpi-sub">Combustible + gastos operativos</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Unidades Evaluadas</div>
            <div class="kpi-value">${vehicles.length}</div>
            <div class="kpi-sub">${selectedVehicleObj ? 'Vista individual' : 'Consolidado de flota'}</div>
          </div>
        </div>
        <div class="indicators-bar">
          <span><strong>Referencia Económica del Día (Findic.cl):</strong></span>
          <span>Valor UF: <strong>${ufRate > 0 ? `$${ufRate.toLocaleString('es-CL', { minimumFractionDigits: 2 })}` : 'No disponible'}</strong></span>
          <span>Dólar Observado: <strong>${usdRate > 0 ? `$${usdRate.toLocaleString('es-CL', { minimumFractionDigits: 2 })}` : 'No disponible'}</strong></span>
        </div>
      </div>

      <!-- SECCIÓN 2: INVENTARIO VEHICULAR -->
      <div class="section">
        <h2 class="section-title">2. Inventario Vehicular y Estado de Mantención</h2>
        <table>
          <thead>
            <tr>
              <th>Foto</th>
              <th>Vehículo / Modelo</th>
              <th>Patente</th>
              <th style="text-align:right;">Odómetro</th>
              <th style="text-align:right;">Rendimiento</th>
              <th>Última Mantención</th>
            </tr>
          </thead>
          <tbody>
            ${inventoryRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- SECCIÓN 3: GUANTERA DIGITAL (5 DOCUMENTOS) -->
      <div class="section">
        <h2 class="section-title">3. Guantera Digital — Control de Vencimientos Legales (5 Documentos)</h2>
        <table>
          <thead>
            <tr>
              <th>Vehículo</th>
              <th>SOAP</th>
              <th>Permiso Circulación</th>
              <th>Revisión Técnica</th>
              <th>Seguro Privado</th>
              <th>Licencia Conducir</th>
            </tr>
          </thead>
          <tbody>
            ${documentsRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- SECCIÓN 4: GASTOS OPERATIVOS (RESUMEN + DETALLE) -->
      <div class="section-allow-break">
        <h2 class="section-title">4. Gastos Operativos — Resumen por Categoría y Detalle</h2>
        <table style="margin-bottom: 12px;">
          <thead>
            <tr>
              <th>Categoría</th>
              <th style="text-align:center;">Registros</th>
              <th style="text-align:right;">Subtotal</th>
              <th style="text-align:right;">Participación</th>
            </tr>
          </thead>
          <tbody>
            ${categorySummaryRowsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td>TOTAL GASTOS OPERATIVOS</td>
              <td style="text-align:center;">${expenses.length}</td>
              <td style="text-align:right;color:#be123c;">${formatCurrency(totalExpenses)}</td>
              <td style="text-align:right;">100%</td>
            </tr>
          </tfoot>
        </table>

        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Vehículo</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th style="text-align:right;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${expenseRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- SECCIÓN 5: HISTORIAL DE COMBUSTIBLE -->
      <div class="section-allow-break">
        <h2 class="section-title">5. Historial Completo de Cargas de Combustible</h2>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Vehículo</th>
              <th>Combustible</th>
              <th>Estación</th>
              <th style="text-align:right;">Odómetro</th>
              <th style="text-align:right;">Litros</th>
              <th style="text-align:right;">Precio/L</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${fuelRowsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5">TOTAL COMBUSTIBLE (${fuelRecords.length} cargas)</td>
              <td style="text-align:right;">${totalLiters.toFixed(2)} L</td>
              <td></td>
              <td style="text-align:right;color:#15803d;">${formatCurrency(totalFuelCost)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="footer">
        <span>Documento generado automáticamente por RendixApp (Gestión Inteligente de Flotas).</span>
        <span>Los vencimientos están calculados según fecha local (${escapeHtml(emissionDate)}).</span>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permite las ventanas emergentes (pop-ups) en tu navegador para generar el reporte PDF.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    printWindow.focus();
    printWindow.print();
  };

  printWindow.onload = () => setTimeout(triggerPrint, 250);
  setTimeout(triggerPrint, 900);
}