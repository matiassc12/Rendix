/*
  Nombre del archivo: pdfGenerator.js
  Propósito: Función utilitaria para generar el Reporte Ejecutivo en PDF 
  incluyendo miniaturas de imagen para cada vehículo de la flota.
*/

export const generatePdfReport = ({ vehicles = [], totalFuelCost = 0, totalExpenses = 0, indicators = { uf: 41226.39, dolar: 994.29 } }) => {
  const fechaActual = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
  const totalGeneral = totalFuelCost + totalExpenses;
  const totalInUf = indicators.uf > 0 ? (totalGeneral / indicators.uf).toFixed(2) : '0.00';
  const totalInUsd = indicators.dolar > 0 ? (totalGeneral / indicators.dolar).toFixed(2) : '0.00';

  let vehiclesRowsHtml = vehicles.map(v => {
    const lastServiceText = v.last_service_date && v.last_service_km > 0 
      ? `${v.last_service_date} (${Number(v.last_service_km).toLocaleString('es-CL')} km)` 
      : 'Sin registro';

    const imgTag = v.image_url 
      ? `<img src="${v.image_url}" style="width: 32px; height: 32px; border-radius: 4px; object-fit: cover; vertical-align: middle; margin-right: 8px;" />` 
      : `<span style="font-size: 16px; margin-right: 8px;">🚗</span>`;

    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #cbd5e1; font-weight: bold; display: flex; align-items: center;">
          ${imgTag} ${v.name || 'N/A'}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #cbd5e1;">${v.brand || 'N/A'} ${v.model || ''} (${v.year || ''})</td>
        <td style="padding: 10px; border-bottom: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">${v.plate || 'Sin Patente'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #cbd5e1; text-align: right;">${Number(v.currentKm || 0).toLocaleString('es-CL')} km</td>
        <td style="padding: 10px; border-bottom: 1px solid #cbd5e1; font-size: 12px; color: #475569;">${lastServiceText}</td>
      </tr>
    `;
  }).join('');

  if (vehicles.length === 0) {
    vehiclesRowsHtml = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: #64748b;">No hay vehículos registrados en la flota.</td></tr>`;
  }

  let documentsRowsHtml = vehicles.map(v => {
    return `
      <tr style="background: #f1f5f9;">
        <td colspan="5" style="padding: 8px 12px; font-weight: bold; color: #1e293b;">
          Vehículo: ${v.name} (${v.plate || 'Sin Patente'})
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">Revisión Técnica: <strong>${v.revision_tecnica_expiration || 'No configurada'}</strong></td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;" colspan="2">Permiso de Circulación: <strong>${v.permiso_circulacion_expiration || 'No configurada'}</strong></td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;" colspan="2">SOAP: <strong>${v.soap_expiration || 'No configurada'}</strong></td>
      </tr>
    `;
  }).join('');

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Reporte Ejecutivo Integral - Rendix</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 30px; margin: 0; }
          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #3b82f6; padding-bottom: 15px; margin-bottom: 25px; }
          .title h1 { margin: 0; color: #0f172a; font-size: 22px; }
          .title p { margin: 4px 0 0 0; color: #64748b; font-size: 13px; }
          .badge { background: #3b82f6; color: white; padding: 4px 10px; font-weight: bold; font-size: 11px; border-radius: 4px; display: inline-block; }
          .section-title { font-size: 15px; font-weight: bold; color: #1e293b; margin-top: 25px; margin-bottom: 10px; border-left: 4px solid #3b82f6; padding-left: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 13px; }
          th { background: #f8fafc; color: #334155; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; }
          .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
          .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; }
          .kpi-label { font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .kpi-value { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">
            <h1>Rendix - Reporte Ejecutivo Integral de Flota</h1>
            <p>Control Financiero, Operativo y Guantera Digital</p>
          </div>
          <div>
            <span class="badge">DOCUMENTO OFICIAL</span>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">Emitido el: ${fechaActual}</p>
          </div>
        </div>

        <div class="section-title">1. Resumen Financiero Global</div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Gasto Total Bencina</div>
            <div class="kpi-value" style="color: #0284c7;">$${Number(totalFuelCost).toLocaleString('es-CL')}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Gastos Operativos (TAG/Otros)</div>
            <div class="kpi-value" style="color: #dc2626;">$${Number(totalExpenses).toLocaleString('es-CL')}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Gasto Consolidado Total</div>
            <div class="kpi-value" style="color: #4f46e5;">$${Number(totalGeneral).toLocaleString('es-CL')}</div>
          </div>
        </div>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 13px;">
          <strong>Conversión Financiera en Vivo (Findic API):</strong> 
          Este gasto equivale a <span style="color: #0284c7; font-weight: bold;">${totalInUf} UF</span> y <span style="color: #16a34a; font-weight: bold;">US$${totalInUsd}</span>.
        </div>

        <div class="section-title">2. Inventario de Vehículos y Últimas Mantenciones</div>
        <table>
          <thead>
            <tr>
              <th>Vehículo</th>
              <th>Marca y Modelo</th>
              <th>Patente</th>
              <th style="text-align: right;">Odómetro</th>
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

        <div class="footer">
          Generado automáticamente por Rendix Cloud • Duoc UC • ${new Date().getFullYear()}
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};