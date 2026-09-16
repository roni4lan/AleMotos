// ============================================
// Ale Motos — Login Page
// ============================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { BUSINESS_NAME } from '../../theme';
import { useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import logo from '../../assets/logo.png';

export function LoginPage() {
  const { login, error, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f4f4f5',
      padding: '1.5rem',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
      }}>
        {/* Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
          }}>
            <img src={logo} alt="Ale Motos Logo" style={{ width: '88px', height: '88px', objectFit: 'contain' }} />
          </div>
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: 800,
            color: '#18181b',
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.025em'
          }}>
            {BUSINESS_NAME}
          </h1>
          <p style={{ 
            color: '#71717a', 
            fontSize: '1.1rem',
            margin: 0
          }}>
            Sistema de Gestión
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '1.25rem',
          padding: '2.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          border: '1px solid #f4f4f5'
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#3f3f46',
                marginBottom: '0.5rem'
              }}>
                Email
              </label>
              <input
                type="email"
                placeholder="admin@alemotos.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                style={{
                  width: '100%',
                  borderRadius: '0.75rem',
                  border: '1px solid #e4e4e7',
                  backgroundColor: '#fafafa',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  color: '#18181b',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#dc2626';
                  e.target.style.backgroundColor = '#ffffff';
                  e.target.style.boxShadow = '0 0 0 4px rgba(220, 38, 38, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e4e4e7';
                  e.target.style.backgroundColor = '#fafafa';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#3f3f46',
                marginBottom: '0.5rem'
              }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    borderRadius: '0.75rem',
                    border: '1px solid #e4e4e7',
                    backgroundColor: '#fafafa',
                    padding: '0.75rem 3rem 0.75rem 1rem',
                    fontSize: '1rem',
                    color: '#18181b',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    letterSpacing: showPassword ? 'normal' : '0.1em'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#dc2626';
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.boxShadow = '0 0 0 4px rgba(220, 38, 38, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e4e4e7';
                    e.target.style.backgroundColor = '#fafafa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#a1a1aa',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#52525b'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#a1a1aa'}
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.75rem',
                padding: '1rem',
                color: '#dc2626',
                fontSize: '0.9rem',
                fontWeight: 500,
                marginBottom: '1.5rem',
              }}>
                <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                background: 'linear-gradient(to right, #dc2626, #b91c1c)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.875rem 1.5rem',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.2), 0 2px 4px -2px rgba(220, 38, 38, 0.2)',
                opacity: isLoading ? 0.7 : 1,
              }}
              onMouseOver={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(220, 38, 38, 0.3), 0 4px 6px -4px rgba(220, 38, 38, 0.3)';
                }
              }}
              onMouseOut={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(220, 38, 38, 0.2), 0 2px 4px -2px rgba(220, 38, 38, 0.2)';
                }
              }}
            >
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: '2rem',
          fontSize: '0.875rem',
          color: '#a1a1aa',
          fontWeight: 500
        }}>
          Demo: admin@alemotos.com / admin123
        </p>
      </div>
    </div>
  );
}
