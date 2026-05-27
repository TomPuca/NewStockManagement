import React, { useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import './Login.css';

const ALLOWED_EMAIL = 'hung1504@gmail.com';

function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;

      if (email !== ALLOWED_EMAIL) {
        // Immediately sign out unauthorized accounts
        await signOut(auth);
        setError(`Account "${email}" is not authorized. Please sign in with ${ALLOWED_EMAIL}.`);
      }
      // If authorized, the onAuthStateChanged listener in App.jsx will update the app state automatically.
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else {
        setError('An error occurred. Please try again.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-backdrop" />
      <div className="login-card">
        <div className="login-icon-wrapper">
          <div className="login-icon">📈</div>
        </div>
        <h1 className="login-title premium-title">Stock Portal</h1>
        <p className="login-subtitle">Manage your investment portfolio efficiently</p>

        <div className="login-divider" />

        <button
          id="google-sign-in-btn"
          className={`login-google-btn ${loading ? 'loading' : ''}`}
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <span className="login-spinner" />
          ) : (
            <GoogleIcon />
          )}
          <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
        </button>

        {error && (
          <div className="login-error" role="alert">
            <span className="login-error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <p className="login-access-note">
          🔒 Authorized access only
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default Login;
