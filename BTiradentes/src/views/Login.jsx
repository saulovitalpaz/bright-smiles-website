import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a brief loading state
    await new Promise(r => setTimeout(r, 600));

    const result = login(email, password);
    if (!result.success) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="login-page">
      {/* Subtle background photo */}
      <div className="login-bg-photo"></div>

      {/* Decorative shapes */}
      <div className="login-shape login-shape-1"></div>
      <div className="login-shape login-shape-2"></div>

      <div className="login-container">
        <div className="login-card">
          {/* Logo / Header */}
          <div className="login-header">
            <div className="login-logo-icon">
              <span className="material-symbols-outlined" style={{fontSize: '32px'}}>pets</span>
            </div>
            <h1>Dra. Brenda Tiradentes</h1>
            <p className="login-subtitle">Fisioterapia & Acupuntura Veterinária</p>
          </div>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="email">Email</label>
              <div className="login-input-wrapper">
                <span className="material-symbols-outlined input-icon">mail</span>
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Senha</label>
              <div className="login-input-wrapper">
                <span className="material-symbols-outlined input-icon">lock</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error">
                <span className="material-symbols-outlined" style={{fontSize: '16px'}}>error</span>
                {error}
              </div>
            )}

            <button type="submit" className="login-submit" disabled={isLoading}>
              {isLoading ? (
                <span className="login-spinner"></span>
              ) : (
                <>
                  Acessar Portal
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <p className="login-footer-text">
            Portal exclusivo · The Radiant Clinician
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
