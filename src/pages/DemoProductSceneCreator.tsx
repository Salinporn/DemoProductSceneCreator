import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { createXRStore, XR } from '@react-three/xr';
import { verifyLoginToken } from '../utils/Auth';
import { DemoSceneContent } from '../components/scene/DemoSceneContent';

const xrStore = createXRStore();

export function DemoProductSceneCreator() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying authentication...');
  const [productId, setProductId] = useState<string | null>(null);
  const [sceneId, setSceneId] = useState<string | null>(null);
  const [productName, setProductName] = useState<string | null>(null);
  const [apiBase, setApiBase] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const prodId = searchParams.get('productId');
    const scId = searchParams.get('sceneId');
    const prodName = searchParams.get('productName');
    const api = searchParams.get('api');

    if (!token) {
      setStatus('error');
      setMessage('No authentication token provided');
      return;
    }

    if (!prodId) {
      setStatus('error');
      setMessage('No product ID provided');
      return;
    }

    setProductId(prodId);
    setSceneId(scId);
    setProductName(prodName);
    setApiBase(api || import.meta.env.VITE_API_URL);

    verifyLoginToken(token).then((result) => {
      if (result) {
        setStatus('success');
        setMessage(`Welcome to VR/AR Product Preview!`);
      } else {
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
      }
    });
  }, [searchParams, navigate]);

  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          padding: '3rem',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '90%',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(59, 130, 246, 0.3)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
          }} />
          <h2 style={{ color: '#1e293b', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
            Loading VR/AR Preview
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem' }}>
            {message}
          </p>
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

  if (status === 'error') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          padding: '3rem',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '90%',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: '#ef4444',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            fontSize: '2rem',
            color: '#1e293b',
          }}>
            ✕
          </div>
          <h2 style={{ color: '#1e293b', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
            Authentication Failed
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            {message}
          </p>
          <button
            onClick={() => window.close()}
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: '#1e293b',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  // Success - show VR/AR scene
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas style={{ width: "100vw", height: "100vh", position: "fixed" }}>
        <XR store={xrStore}>
          {productId && (
            <DemoSceneContent
              productId={productId}
              sceneId={sceneId}
              productName={productName}
              apiBase={apiBase}
            />
          )}
        </XR>
      </Canvas>

      {/* Enter VR Button */}
      <div style={{ 
        position: "fixed", 
        width: "100vw", 
        height: "100vh", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "flex-end", 
        pointerEvents: "none" 
      }}>
        <button
          style={{ 
            marginBottom: 20, 
            padding: "12px 24px", 
            backgroundColor: "#4CAF50", 
            color: "#1e293b", 
            border: "none", 
            borderRadius: 8, 
            cursor: "pointer", 
            pointerEvents: "auto",
            fontWeight: "bold",
            fontSize: "16px"
          }}
          onClick={() => {
            xrStore.enterVR().catch((err) => console.warn("Failed to enter VR:", err));
          }}
        >
          Enter VR Preview
        </button>
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