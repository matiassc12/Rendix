/*
  Nombre del archivo: Auth.jsx
  Propósito: Pantalla de inicio de sesión y registro de usuarios con Supabase Auth.
*/

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (isSignUp) {
        // Registrar nuevo usuario
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });

        if (error) throw error;

        setMessage({
          text: '¡Registro exitoso! Revisa tu correo o inicia sesión.',
          type: 'success'
        });
        setIsSignUp(false);
      } else {
        // Iniciar sesión
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data.session) {
          onLoginSuccess(data.session);
        }
      }
    } catch (err) {
      setMessage({ text: err.message || 'Error en la autenticación', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      padding: '16px'
    }}>
      <div style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '400px',
        padding: '32px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
      }}>
        
        {/* LOGO Y TÍTULO */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>⚡</div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Rendix Cloud</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '6px' }}>
            {isSignUp ? 'Crea tu cuenta para gestionar tu garaje' : 'Ingresa a tu cuenta'}
          </p>
        </div>

        {/* MENSAJES DE ERROR / ÉXITO */}
        {message.text && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            color: message.type === 'error' ? '#fca5a5' : '#86efac',
            border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
          }}>
            {message.text}
          </div>
        )}

        {/* FORMULARIO */}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
              Correo electrónico
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
              Contraseña
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px',
              boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Cargando...' : isSignUp ? 'Registrarse' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* CAMBIO ENTRE LOGIN Y REGISTRO */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#94a3b8' }}>
          {isSignUp ? '¿Ya tienes una cuenta?' : '¿No tienes cuenta todavía?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage({ text: '', type: '' });
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#818cf8',
              fontWeight: '700',
              cursor: 'pointer',
              padding: 0
            }}
          >
            {isSignUp ? 'Inicia sesión' : 'Regístrate aquí'}
          </button>
        </div>

      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #334155',
  backgroundColor: '#0f172a',
  color: '#f8fafc',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box'
};