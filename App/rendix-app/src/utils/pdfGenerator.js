/*
  Nombre del archivo: pdfGenerator.js
  Propósito: Función utilitaria para generar el Reporte Ejecutivo Integral en PDF
  incluyendo KPIs operativos, vehículos con rendimiento manual, guantera digital completa,
  desglose de gastos por categoría/registro e historial de cargas de combustible.
*/

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
  if (!dateStr) return '—';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return escapeHtml(dateStr);
};

const getDocStatusBadge = (dateStr) => {
  if (!dateStr) {
    return `<span style="color: #64748b;">No configurada</span>`;
  }
  const diffDays = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  const formatted = formatDateShort(dateStr);

  if (diffDays < 0) {
    return `<strong style="color: #dc2626;">${formatted}</strong> <span style="background: #fee2e2; color: #b91c1c; padding: 1px 5px; border-radius: 3px; font-size: 10px; font-weight: bold;">VENCIDO</span>`;
  }
  if (diffDays <= 30) {
    return `<strong style="color: #d97706;">${formatted}</strong> <span style="background: #fef3c7; color: #b45309; padding: 1px 5px; border-radius: 3px; font-size: 10px; font-weight: bold;">${diffDays}d</span>`;
  }
  return `<strong style="color: #0f172a;">${formatted}</strong> <span style="background: #dcfce7; color: #15803d; padding: 1px 5px; border-radius: 3px; font-size: 10px; font-weight: bold;">AL DÍA</span>`;
};

export const generatePdfReport = ({
  vehicles = [],
  allVehicles = [],
  fuelRecords = [],
  expenses = [],
  totalFuelCost = 0,
  totalExpenses = 0,
  avgKm = '0.0',
  costPerKm = '0',
  dashVehicleFilter = 'all',
  indicators = { uf: 41226.39, dolar: 994.29 }
}) => {
  const fechaActual = new Date().toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const vehicleLookup = allVehicles.length > 0 ? allVehicles : vehicles;
  const resolveVehicleLabel = (vId) => {
    const found = vehicleLookup.find((v) => v.id === vId);
    if (!found) return 'Vehículo no asignado';
    return `${escapeHtml(found.name)} (${escapeHtml(found.plate || 'S/P')})`;
  };

  const scopeLabel =
    dashVehicleFilter === 'all'
      ? `Flota Completa (${vehicles.length} vehículo${vehicles.length === 1 ? '' : 's'})`
      : vehicles[0]
        ? `${escapeHtml(vehicles[0].name)} • ${escapeHtml(vehicles[0].plate || 'Sin Patente')}`
        : 'Vehículo Seleccionado';

  const totalGeneral = Number(totalFuelCost) + Number(totalExpenses);
  const totalInUf = indicators.uf > 0 ? (totalGeneral / indicators.uf).toFixed(2) : '0.00';
  const totalInUsd = indicators.dolar > 0 ? (totalGeneral / indicators.dolar).toFixed(2) : '0.00';
  const totalLiters = fuelRecords.reduce((acc, r) => acc + Number(r.liters || 0), 0);

  // 1. FILAS DE VEHÍCULOS
  let vehiclesRowsHtml = vehicles
    .map((v) => {
      const lastServiceText =
        v.last_service_date && Number(v.last_service_km) > 0
          ? `${formatDateShort(v.last_service_date)} (${Number(v.last_service_km).toLocaleString('es-CL')} km)`
          : 'Sin registro';

      const manualEff = Number(v.manual_efficiency || 0);
      const effText = manualEff > 0 ? `${manualEff.toFixed(1)} km/L` : 'No definido';

      const imgTag = v.image_url
        ? `<img src="${escapeHtml(v.image_url)}" style="width: 30px; height: 30px; border-radius: 4px; object-fit: cover; vertical-align: middle; margin-right: 8px;" />`
        : `<span style="font-size: 15px; margin-right: 8px;">🚗</span>`;

      return `
        <tr>
          <td style="padding: 9px; border-bottom: 1px solid #cbd5e1; font-weight: bold;">
            <div style="display: flex; align-items: center;">
              ${imgTag} <span>${escapeHtml(v.name || 'N/A')}</span>
            </div>
          </td>
          <td style="padding: 9px; border-bottom: 1px solid #cbd5e1;">${escapeHtml(v.brand || 'N/A')} ${escapeHtml(v.model || '')} (${escapeHtml(v.year || '')})</td>
          <td style="padding: 9px; border-bottom: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">${escapeHtml(v.plate || 'Sin Patente')}</td>
          <td style="padding: 9px; border-bottom: 1px solid #cbd5e1; text-align: right;">${Number(v.currentKm || 0).toLocaleString('es-CL')} km</td>
          <td style="padding: 9px; border-bottom: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: ${manualEff > 0 ? '#16a34a' : '#64748b'};">${effText}</td>
          <td style="padding: 9px; border-bottom: 1px solid #cbd5e1; font-size: 11px; color: #475569;">${lastServiceText}</td>
        </tr>
      `;
    })
    .join('');

  if (vehicles.length === 0) {
    vehiclesRowsHtml = `<tr><td colspan="6" style="padding: 16px; text-align: center; color: #64748b;">No hay vehículos registrados en este filtro.</td></tr>`;
  }

  // 2. FILAS DE GUANTERA DIGITAL (5 DOCUMENTOS)
  let documentsRowsHtml = vehicles
    .map((v) => {
      return `
        <tr style="background: #f1f5f9;">
          <td colspan="3" style="padding: 7px 10px; font-weight: bold; color: #0f172a; border-top: 1px solid #cbd5e1;">
            ${escapeHtml(v.name)} (${escapeHtml(v.plate || 'Sin Patente')})
          </td>
        </tr>
        <tr>
          <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; width: 33%;">Revisión Técnica: ${getDocStatusBadge(v.revision_tecnica_expiration)}</td>
          <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; width: 34%;">Permiso Circulación: ${getDocStatusBadge(v.permiso_circulacion_expiration)}</td>
          <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; width: 33%;">SOAP: ${getDocStatusBadge(v.soap_expiration)}</td>
        </tr>
        <tr>
          <td style="padding: 7px 10px; border-bottom: 1px solid #cbd5e1;">Seguro Privado: ${getDocStatusBadge(v.seguro_privado_expiration)}</td>
          <td colspan="2" style="padding: 7px 10px; border-bottom: 1px solid #cbd5e1;">Licencia de Conducir: ${getDocStatusBadge(v.licencia_conducir_expiration)}</td>
        </tr>
      `;
    })
    .join('');

  if (vehicles.length === 0) {
    documentsRowsHtml = `<tr><td colspan="3" style="padding: 16px; text-align: center; color: #64748b;">Sin documentación para mostrar.</td></tr>`;
  }

  // 3. RESUMEN POR CATEGORÍA Y DETALLE DE GASTOS OPERATIVOS
  const categoryTotals = {};
  expenses.forEach((exp) => {
    const cat = exp.category || 'Otros';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(exp.amount || 0);
  });

  const categoryBadgesHtml = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, sum]) => {
      const pct = totalExpenses > 0 ? Math.round((sum / totalExpenses) * 100) : 0;
      return `
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px;">
          <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">${escapeHtml(cat)} (${pct}%)</div>
          <div style="font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 2px;">$${Math.round(sum).toLocaleString('es-CL')}</div>
        </div>
      `;
    })
    .join('');

  let expensesRowsHtml = expenses
    .map((exp) => {
      const vId = exp.vehicle_id || exp.vehicleId;
      return `
        <tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; white-space: nowrap;">${formatDateShort(exp.date)}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0284c7;">${resolveVehicleLabel(vId)}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">
            <span style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600;">
              ${escapeHtml(exp.category || 'Otros')}
            </span>
          </td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #334155;">${escapeHtml(exp.description || '—')}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #dc2626;">$${Number(exp.amount || 0).toLocaleString('es-CL')}</td>
        </tr>
      `;
    })
    .join('');

  if (expenses.length === 0) {
    expensesRowsHtml = `<tr><td colspan="5" style="padding: 16px; text-align: center; color: #64748b;">No hay gastos operativos (TAG, peajes, mantenciones u otros) registrados.</td></tr>`;
  }

  // 4. HISTORIAL DETALLADO DE CARGAS DE COMBUSTIBLE
  const fuelTypeLabels = {
    '93': '93 Oct.',
    '95': '95 Oct.',
    '97': '97 Oct.',
    diesel: 'Diésel',
    kerosene: 'Kerosene'
  };

  let fuelRowsHtml = fuelRecords
    .map((rec) => {
      const vId = rec.vehicle_id || rec.vehicleId;
      const liters = Number(rec.liters || 0);
      const total = Number(rec.total || 0);
      const pricePerLiter = liters > 0 && total > 0 ? Math.round(total / liters) : 0;
      const odo = Number(rec.odometer || 0);
      const fuelLabel = fuelTypeLabels[String(rec.fuel_type || '95')] || escapeHtml(rec.fuel_type || '95');

      return `
        <tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; white-space: nowrap;">${formatDateShort(rec.date)}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0284c7;">${resolveVehicleLabel(vId)}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(rec.station || '—')}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${fuelLabel}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${liters.toFixed(1)} L</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569;">${pricePerLiter > 0 ? `$${pricePerLiter.toLocaleString('es-CL')}` : '—'}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b;">${odo > 0 ? `${odo.toLocaleString('es-CL')} km` : '—'}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #0f172a;">$${total.toLocaleString('es-CL')}</td>
        </tr>
      `;
    })
    .join('');

  if (fuelRecords.length === 0) {
    fuelRowsHtml = `<tr><td colspan="8" style="padding: 16px; text-align: center; color: #64748b;">No hay cargas de combustible registradas.</td></tr>`;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permite las ventanas emergentes en tu navegador para generar el PDF.');
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>Reporte Ejecutivo Integral - Rendix</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 28px; margin: 0; font-size: 12px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #3b82f6; padding-bottom: 14px; margin-bottom: 20px; }
          .title h1 { margin: 0; color: #0f172a; font-size: 21px; }
          .title p { margin: 4px 0 0 0; color: #475569; font-size: 12px; }
          .scope-pill { display: inline-block; margin-top: 6px; background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
          .badge { background: #3b82f6; color: white; padding: 4px 10px; font-weight: bold; font-size: 10px; border-radius: 4px; display: inline-block; }
          .section-title { font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 22px; margin-bottom: 10px; border-left: 4px solid #3b82f6; padding-left: 8px; page-break-after: avoid; }
          table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 12px; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
          th { background: #f8fafc; color: #334155; text-align: left; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; }
          .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px; }
          .kpi-card { background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 12px; border-radius: 6px; page-break-inside: avoid; }
          .kpi-label { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .kpi-value { font-size: 17px; font-weight: bold; color: #0f172a; margin-top: 3px; }
          .kpi-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
          .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; }
          .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 12px; }
          @media print {
            body { padding: 0; }
            @page { margin: 14mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">
            <h1>Rendix — Reporte Ejecutivo Integral de Flota</h1>
            <p>Control Financiero, Operativo, Cargas de Combustible y Guantera Digital</p>
            <div class="scope-pill">Alcance: ${scopeLabel}</div>
          </div>
          <div style="text-align: right;">
            <span class="badge">DOCUMENTO OFICIAL</span>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #64748b;">Emitido el: ${fechaActual}</p>
          </div>
        </div>

        <div class="section-title">1. Resumen Financiero y Operativo Consolidado</div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Gasto Total Bencina</div>
            <div class="kpi-value" style="color: #0284c7;">$${Number(totalFuelCost).toLocaleString('es-CL')}</div>
            <div class="kpi-sub">${fuelRecords.length} carga(s) • ${totalLiters.toFixed(1)} litros</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Gastos Operativos (TAG/Otros)</div>
            <div class="kpi-value" style="color: #dc2626;">$${Number(totalExpenses).toLocaleString('es-CL')}</div>
            <div class="kpi-sub">${expenses.length} movimiento(s) registrado(s)</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Gasto Consolidado Total</div>
            <div class="kpi-value" style="color: #4f46e5;">$${Number(totalGeneral).toLocaleString('es-CL')}</div>
            <div class="kpi-sub">${totalInUf} UF • US$${totalInUsd} (Findic API)</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Rendimiento Promedio</div>
            <div class="kpi-value" style="color: #16a34a;">${escapeHtml(avgKm)} km/L</div>
            <div class="kpi-sub">Basado en rendimiento manual</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Costo Real por Kilómetro</div>
            <div class="kpi-value" style="color: #0891b2;">$${escapeHtml(costPerKm)} / km</div>
            <div class="kpi-sub">Combustible + gastos operativos</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Indicadores Referenciales</div>
            <div class="kpi-value" style="font-size: 14px; color: #334155;">UF $${Number(indicators.uf).toLocaleString('es-CL', { minimumFractionDigits: 2 })}</div>
            <div class="kpi-sub">Dólar $${Number(indicators.dolar).toLocaleString('es-CL', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div class="section-title">2. Inventario de Vehículos, Rendimiento y Últimas Mantenciones</div>
        <table>
          <thead>
            <tr>
              <th>Vehículo</th>
              <th>Marca y Modelo</th>
              <th>Patente</th>
              <th style="text-align: right;">Odómetro</th>
              <th style="text-align: right;">Rendimiento</th>
              <th>Última Mantención</th>
            </tr>
          </thead>
          <tbody>
            ${vehiclesRowsHtml}
          </tbody>
        </table>

        <div class="section-title">3. Estado de Guantera Digital (Documentación Legal)</div>
        <table>
          <tbody>
            ${documentsRowsHtml}
          </tbody>
        </table>

        <div class="section-title">4. Detalle de Gastos Operativos (TAG, Peajes, Mantenciones y Otros)</div>
        ${categoryBadgesHtml ? `<div class="cat-grid">${categoryBadgesHtml}</div>` : ''}
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Vehículo</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th style="text-align: right;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${expensesRowsHtml}
            ${
              expenses.length > 0
                ? `<tr style="background: #f8fafc; font-weight: bold;">
                    <td colspan="4" style="padding: 9px 10px; text-align: right; border-top: 2px solid #cbd5e1;">TOTAL GASTOS OPERATIVOS:</td>
                    <td style="padding: 9px 10px; text-align: right; color: #dc2626; border-top: 2px solid #cbd5e1;">$${Number(totalExpenses).toLocaleString('es-CL')}</td>
                  </tr>`
                : ''
            }
          </tbody>
        </table>

        <div class="section-title">5. Historial Detallado de Cargas de Combustible</div>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Vehículo</th>
              <th>Estación</th>
              <th>Tipo</th>
              <th style="text-align: right;">Litros</th>
              <th style="text-align: right;">Valor/L</th>
              <th style="text-align: right;">Odómetro</th>
              <th style="text-align: right;">Total Pagado</th>
            </tr>
          </thead>
          <tbody>
            ${fuelRowsHtml}
            ${
              fuelRecords.length > 0
                ? `<tr style="background: #f8fafc; font-weight: bold;">
                    <td colspan="4" style="padding: 9px 10px; text-align: right; border-top: 2px solid #cbd5e1;">TOTALES COMBUSTIBLE:</td>
                    <td style="padding: 9px 10px; text-align: right; border-top: 2px solid #cbd5e1;">${totalLiters.toFixed(1)} L</td>
                    <td colspan="2" style="border-top: 2px solid #cbd5e1;"></td>
                    <td style="padding: 9px 10px; text-align: right; color: #0284c7; border-top: 2px solid #cbd5e1;">$${Number(totalFuelCost).toLocaleString('es-CL')}</td>
                  </tr>`
                : ''
            }
          </tbody>
        </table>

        <div class="footer">
          Generado automáticamente por Rendix Cloud • ${new Date().getFullYear()}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};