import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyLoginToken } from '../../utils/Auth';

const DIGITAL_HOME_PLATFORM_BASE_URL = import.meta.env.VITE_DIGITAL_HOME_PLATFORM_URL;

export function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying authentication...');
  const [errorDetails, setErrorDetails] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    const productId = searchParams.get('productId');
    const sceneId = searchParams.get('sceneId');
    
    if (!token) {
      setStatus('error');
      setMessage('No authentication token provided');
      setErrorDetails('Please access Product Demo from the Digital Home Platform.');
      return;
    }
    
    verifyLoginToken(token).then((result) => {
      if (result) {
        setStatus('success');
        setMessage(`Welcome, ${result.username}!`);
        
        const redirectUrl = new URL('/', window.location.origin);
        if (productId) redirectUrl.searchParams.set('productId', productId);
        if (sceneId) redirectUrl.searchParams.set('sceneId', sceneId);
        
        setTimeout(() => {
          navigate(redirectUrl.pathname + redirectUrl.search, { replace: true });
        }, 1500);
      } else {
        setStatus('error');
        setMessage('Authentication failed');
        setErrorDetails('The authentication token is invalid or has expired. Please try again from the Digital Home Platform.');
        
        setTimeout(() => {
          window.location.href = DIGITAL_HOME_PLATFORM_BASE_URL;
        }, 5000);
      }
    });
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f5f7fa',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%',
      }}>
        {status === 'loading' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid rgba(59, 130, 246, 0.3)',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1.5rem',
            }} />
            <h2 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>
              {message}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Please wait...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              background: '#f87171',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '2.5rem',
              color: 'white',
            }}>
              ✕
            </div>
            <h2 style={{ color: '#f87171', marginBottom: '1rem' }}>
              {message}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>
              {errorDetails}
            </p>
            <a
              href={DIGITAL_HOME_PLATFORM_BASE_URL}
              style={{
                display: 'inline-block',
                padding: '0.75rem 2rem',
                background: '#3b82f6',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
            >
              Return to Digital Home Platform
            </a>
          </>
        )}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}