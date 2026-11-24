/*
  Nombre del archivo: DocumentsView.jsx
  Propósito: Billetera Digital de documentos de la flota con persistencia y limpieza de archivos en Supabase Storage.
*/

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getDaysUntilExpiration } from '../utils/dateHelper';

function extractStoragePathFromPublicUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const marker = '/object/public/vehicle-docs/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
}

export default function DocumentsView({ vehicles = [], onSaveDocuments, showToast }) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || '');

  useEffect(() => {
    if (!vehicles.length) {
      setSelectedVehicleId('');
      return;
    }
    const exists = vehicles.some(v => v.id === selectedVehicleId);
    if (!exists) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [vehicles, selectedVehicleId]);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];

  const [formData, setFormData] = useState({
    soap_expiration: '',
    permiso_circulacion_expiration: '',
    revision_tecnica_expiration: '',
    seguro_privado_expiration: '',
    licencia_conducir_expiration: '',
    soap_file: '',
    permiso_file: '',
    revision_file: '',
    seguro_file: '',
    licencia_file: ''
  });

  const [uploadingField, setUploadingField] = useState(null);
  const [saving, setSaving] = useState(false);

  // Solo sincroniza al cambiar de vehículo seleccionado
  useEffect(() => {
    if (!selectedVehicle) return;
    setFormData({
      soap_expiration: selectedVehicle.soap_expiration || '',
      permiso_circulacion_expiration: selectedVehicle.permiso_circulacion_expiration || '',
      revision_tecnica_expiration: selectedVehicle.revision_tecnica_expiration || '',
      seguro_privado_expiration: selectedVehicle.seguro_privado_expiration || '',
      licencia_conducir_expiration: selectedVehicle.licencia_conducir_expiration || '',
      soap_file: selectedVehicle.soap_file || '',
      permiso_file: selectedVehicle.permiso_file || '',
      revision_file: selectedVehicle.revision_file || '',
      seguro_file: selectedVehicle.seguro_file || '',
      licencia_file: selectedVehicle.licencia_file || ''
    });
  }, [selectedVehicle?.id]);

  const notify = (msg) => {
    if (showToast) showToast(msg);
    else alert(msg);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (fileKey, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selectedVehicle) return;

    if (file.size > 10 * 1024 * 1024) {
      notify('⚠️ El archivo supera el límite máximo de 10 MB.');
      return;
    }

    setUploadingField(fileKey);

    try {
      const rawExt = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'bin';
      const safeExt = rawExt.replace(/[^a-z0-9]/g, '') || 'bin';
      const fileName = `${selectedVehicle.id}_${fileKey}_${Date.now()}.${safeExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-docs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error al subir documento:', uploadError);
        notify(`❌ Error al subir: ${uploadError.message}`);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('vehicle-docs')
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl || '';
      setFormData(prev => ({ ...prev, [fileKey]: publicUrl }));
      notify('✨ Archivo adjuntado. Presiona "Guardar Billetera Digital" para confirmar.');
    } catch (err) {
      console.error('Excepción al subir archivo:', err);
      notify('❌ Ocurrió un error inesperado al subir el archivo.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleRemoveFile = async (fileKey) => {
    if (!window.confirm('¿Deseas quitar este documento?')) return;

    const currentUrl = formData[fileKey];
    const storagePath = extractStoragePathFromPublicUrl(currentUrl);

    if (storagePath) {
      const { error: removeErr } = await supabase.storage
        .from('vehicle-docs')
        .remove([storagePath]);
      if (removeErr) {
        console.warn('No se pudo eliminar archivo del storage:', removeErr.message);
      }
    }

    setFormData(prev => ({ ...prev, [fileKey]: '' }));
    notify('🗑️ Documento quitado. Guarda los cambios para actualizar la ficha.');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedVehicle || !onSaveDocuments) return;

    setSaving(true);
    try {
      const cleanedData = {
        soap_expiration: formData.soap_expiration || null,
        permiso_circulacion_expiration: formData.permiso_circulacion_expiration || null,
        revision_tecnica_expiration: formData.revision_tecnica_expiration || null,
        seguro_privado_expiration: formData.seguro_privado_expiration || null,
        licencia_conducir_expiration: formData.licencia_conducir_expiration || null,
        soap_file: formData.soap_file || null,
        permiso_file: formData.permiso_file || null,
        revision_file: formData.revision_file || null,
        seguro_file: formData.seguro_file || null,
        licencia_file: formData.licencia_file || null
      };

      await onSaveDocuments(selectedVehicle.id, cleanedData);
    } finally {
      setSaving(false);
    }
  };

  if (!vehicles || vehicles.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
        <h2>📁 Billetera Digital</h2>
        <p>No hay vehículos registrados en tu flota. Agrega uno primero en "Mis Vehículos".</p>
      </div>
    );
  }

  const docFields = [
    { key: 'soap_expiration', fileKey: 'soap_file', label: 'SOAP (Seguro Obligatorio)', icon: '🛡️' },
    { key: 'permiso_circulacion_expiration', fileKey: 'permiso_file', label: 'Permiso de Circulación', icon: '📄' },
    { key: 'revision_tecnica_expiration', fileKey: 'revision_file', label: 'Revisión Técnica / Gases', icon: '🔍' },
    { key: 'seguro_privado_expiration', fileKey: 'seguro_file', label: 'Seguro Privado / Cobertura', icon: '💼' },
    { key: 'licencia_conducir_expiration', fileKey: 'licencia_file', label: 'Licencia de Conducir', icon: '🪪' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
      <div>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '950', color: 'var(--text-primary)' }}>
          📁 Billetera Digital de Documentos
        </h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
          Guarda los documentos oficiales y controla sus fechas de expiración en un solo lugar seguro.
        </p>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
          Seleccionar Vehículo a Consultar:
        </label>
        <select
          value={selectedVehicle?.id || ''}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
          style={{ background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: '10px', fontSize: '14px', fontWeight: '800' }}
        >
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>
              {v.name} - Patente: {v.plate || 'S/P'}
            </option>
          ))}
        </select>
      </div>

      {selectedVehicle && (
        <div style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-inner) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
        }}>
          {selectedVehicle.image_url ? (
            <img
              src={selectedVehicle.image_url}
              alt={selectedVehicle.name}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              style={{ width: '160px', height: '110px', objectFit: 'cover', borderRadius: '12px', border: '2px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
            />
          ) : (
            <div style={{ width: '160px', height: '110px', background: 'var(--bg-card-inner)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '42px', border: '2px solid var(--border-color)' }}>
              🚘
            </div>
          )}

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '220px' }}>
            <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', border: '1px solid rgba(56, 189, 248, 0.3)', width: 'fit-content' }}>
              {selectedVehicle.brand || 'Vehículo'} {selectedVehicle.model || ''} ({selectedVehicle.year || '202X'})
            </span>

            <h3 style={{ margin: 0, fontSize: '26px', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              {selectedVehicle.name}
            </h3>

            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700', marginTop: '2px', flexWrap: 'wrap' }}>
              <span>
                Patente:{' '}
                <strong style={{ color: 'var(--text-primary)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  {selectedVehicle.plate || 'SIN PATENTE'}
                </strong>
              </span>
              <span>
                Kilometraje Actual:{' '}
                <strong style={{ color: '#38bdf8' }}>{Number(selectedVehicle.currentKm || 0).toLocaleString('es-CL')} km</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: 'var(--text-primary)' }}>
          Documentos Guardados en la Billetera
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {docFields.map(doc => {
            const dateVal = formData[doc.key] || '';
            const fileVal = formData[doc.fileKey] || '';
            const diffDays = getDaysUntilExpiration(dateVal);
            const isNear = diffDays !== null && diffDays <= 30;

            return (
              <div key={doc.key} style={{ background: 'var(--bg-card-inner)', border: `1px solid ${isNear ? '#ef4444' : 'var(--border-color)'}`, borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{doc.icon}</span> {doc.label}
                  </span>
                  {isNear && (
                    <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '2px 6px', borderRadius: '6px' }}>
                      {diffDays < 0 ? 'Vencido' : 'Por vencer'}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>Fecha de Vencimiento:</label>
                  <input
                    type="date"
                    value={dateVal}
                    onChange={(e) => handleChange(doc.key, e.target.value)}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 10px', borderRadius: '8px', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>Documento en Billetera:</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
                    {fileVal ? (
                      <a
                        href={fileVal}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          color: '#38bdf8',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '800',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title="Ver / Descargar documento"
                      >
                        <span>📥</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Ver Documento Adjunto</span>
                      </a>
                    ) : (
                      <span style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        Sin archivo adjunto
                      </span>
                    )}

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {fileVal && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(doc.fileKey)}
                          style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Quitar documento"
                        >
                          🗑️
                        </button>
                      )}

                      <label style={{ background: '#3b82f6', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', margin: 0 }}>
                        {uploadingField === doc.fileKey ? 'Subiendo...' : (fileVal ? '🔄 Cambiar' : '📎 Adjuntar')}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          disabled={uploadingField === doc.fileKey}
                          onChange={(e) => handleFileUpload(doc.fileKey, e)}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button
            type="submit"
            disabled={saving || Boolean(uploadingField)}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              border: 'none',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '10px',
              fontWeight: '900',
              fontSize: '14px',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
            }}
          >
            {saving ? 'Guardando...' : '💾 Guardar Billetera Digital'}
          </button>
        </div>
      </form>
    </div>
  );
}