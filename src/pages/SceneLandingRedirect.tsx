import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeAuthenticatedRequest } from '../utils/Auth';

export function SceneLandingRedirect() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Loading your space…');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await makeAuthenticatedRequest('/digitalhomes/get_digital_homes/');
        if (cancelled) return;
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          setMessage(err.error || 'Could not load your homes.');
          return;
        }
        const data = await response.json();
        const homes: { id: number }[] = data.digital_homes || [];
        if (homes.length === 0) {
          setMessage('No digital homes found. Create one from Digital Home, then return here.');
          return;
        }
        navigate(`/scene/${homes[0].id}`, { replace: true });
      } catch {
        if (!cancelled) setMessage('Something went wrong. Try again later.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
        color: '#1e293b',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 420, padding: '2rem' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(59, 130, 246, 0.3)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.9s linear infinite',
            margin: '0 auto 1rem',
          }}
        />
        <p style={{ margin: 0, fontSize: '1rem' }}>{message}</p>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
