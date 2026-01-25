import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ProductViewer } from '../components/ProductViewer';
import { checkAuth } from '../utils/Auth';
import { fetchProductData, fetchProductModel, fetchDisplayScene, fetchTextures } from '../utils/Api';

interface ProductData {
  id: number;
  name: string;
  description: string;
  digital_price: string;
  physical_price: string;
  category: string;
  type: string;
  image: string;
  stock: number;
  reviews: number[];
  rating: number;
  model_id: number;
  display_scenes_ids: number[];
}

export function ProductDemo() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Product data
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [sceneUrl, setSceneUrl] = useState<string | null>(null);
  const [textures, setTextures] = useState<any[]>([]);
  
  // Get parameters from URL
  const productId = searchParams.get('productId');
  const sceneId = searchParams.get('sceneId');
  const productName = searchParams.get('productName');

  useEffect(() => {
    initializeDemo();
  }, [productId, sceneId]);

  const initializeDemo = async () => {
    try {
      setLoading(true);
      setError(null);

      const authResult = await checkAuth();
      
      if (!authResult.logged_in) {
        console.error('❌ Not authenticated');
        navigate('/unauthorized');
        return;
      }

      if (!productId) {
        setError('No product ID provided');
        return;
      }

      const product = await fetchProductData(parseInt(productId));
      
      if (!product) {
        setError('Product not found');
        return;
      }
      
      setProductData(product);

      if (product.model_id) {
        console.log('🎨 Fetching 3D model...');
        const modelData = await fetchProductModel(product.model_id);
        setModelUrl(modelData);

        const textureData = await fetchTextures(product.model_id);
        setTextures(textureData);
      }

      const targetSceneId = sceneId 
        ? parseInt(sceneId) 
        : product.display_scenes_ids?.[0];

      if (targetSceneId) {
        const scene = await fetchDisplayScene(targetSceneId);
        setSceneUrl(scene);
      }

      setLoading(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product demo');
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.close();
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#000',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid #333',
          borderTop: '4px solid #fff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ marginTop: '1rem', fontSize: '1.2rem' }}>
          Loading VR/AR Experience...
        </p>
        {productName && (
          <p style={{ marginTop: '0.5rem', color: '#888' }}>
            {productName}
          </p>
        )}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#000',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem',
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '1rem',
        }}>
          ⚠️
        </div>
        <h1 style={{ marginBottom: '1rem' }}>Error</h1>
        <p style={{ color: '#888', marginBottom: '2rem', textAlign: 'center' }}>
          {error}
        </p>
        <button
          onClick={handleBack}
          style={{
            padding: '0.75rem 2rem',
            background: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#000',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #333',
        color: '#fff',
        zIndex: 100,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
            {productData?.name || 'Product Demo'}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#888', fontSize: '0.9rem' }}>
            VR/AR Preview Mode
          </p>
        </div>
        <button
          onClick={handleBack}
          style={{
            padding: '0.5rem 1.5rem',
            background: 'transparent',
            color: '#fff',
            border: '1px solid #fff',
            borderRadius: '6px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = '#000';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#fff';
          }}
        >
          ← Back to Shop
        </button>
      </div>

      {/* 3D Viewer */}
      <div style={{ flex: 1, position: 'relative' }}>
        {productData && modelUrl && (
          <ProductViewer
            productData={productData}
            modelUrl={modelUrl}
            sceneUrl={sceneUrl}
            textures={textures}
          />
        )}
      </div>

      {/* Product Info */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        left: '2rem',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid #333',
        color: '#fff',
        maxWidth: '300px',
        zIndex: 10,
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>
          {productData?.name}
        </h3>
        <p style={{ margin: '0 0 1rem 0', color: '#888', fontSize: '0.9rem' }}>
          {productData?.category}
        </p>
        
        {productData?.digital_price && (
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ color: '#888', fontSize: '0.9rem' }}>Digital: </span>
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              ${productData.digital_price}
            </span>
          </div>
        )}
        
        {productData?.physical_price && (
          <div>
            <span style={{ color: '#888', fontSize: '0.9rem' }}>Physical: </span>
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              ${productData.physical_price}
            </span>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        top: '6rem',
        right: '2rem',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '1rem',
        borderRadius: '12px',
        border: '1px solid #333',
        color: '#fff',
        zIndex: 10,
        fontSize: '0.9rem',
      }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
          🎮 Controls
        </div>
        <div style={{ color: '#888', lineHeight: '1.6' }}>
          • Rotate: Left click + drag<br />
          • Zoom: Scroll wheel<br />
          • Pan: Right click + drag<br />
          • VR Mode: Click VR button (if available)
        </div>
      </div>
    </div>
  );
}