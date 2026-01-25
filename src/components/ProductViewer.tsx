import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';

interface ProductViewerProps {
  productData: {
    id: number;
    name: string;
    description: string;
    category: string;
  };
  modelUrl: string;
  sceneUrl: string | null;
  textures: any[];
}

export function ProductViewer({ productData, modelUrl, sceneUrl, textures }: ProductViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const productModelRef = useRef<THREE.Group | null>(null);
  const roomModelRef = useRef<THREE.Group | null>(null);
  const loaderRef = useRef<GLTFLoader>(new GLTFLoader());
  const animationFrameRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [vrSupported, setVrSupported] = useState(false);
  const [productScale, setProductScale] = useState(1);
  const [productRotation, setProductRotation] = useState(0);

  useEffect(() => {
    initScene();
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current) {
      loadModels();
    }
  }, [modelUrl, sceneUrl]);

  const initScene = () => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(3, 3, 3);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Enable XR (VR/AR)
    renderer.xr.enabled = true;
    rendererRef.current = renderer;

    containerRef.current.appendChild(renderer.domElement);

    // Add VR button if supported
    if ('xr' in navigator) {
      navigator.xr?.isSessionSupported('immersive-vr').then((supported) => {
        if (supported && containerRef.current) {
          setVrSupported(true);
          const vrButton = VRButton.createButton(renderer);
          containerRef.current.appendChild(vrButton);
        }
      });
    }

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Add hemisphere light for better ambient lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
    scene.add(hemiLight);

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.5;
    controls.maxDistance = 20;
    controls.target.set(0, 1, 0);
    controlsRef.current = controls;

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Start animation loop
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  const loadModels = async () => {
    if (!sceneRef.current) return;

    setIsLoading(true);

    try {
      // Load product model
      if (modelUrl && !isDataUrl(modelUrl)) {
        console.warn('Model URL is not a data URL, converting...');
      }

      const productGltf = await loaderRef.current.loadAsync(modelUrl);
      const productModel = productGltf.scene;
      
      // Center and scale the model
      const box = new THREE.Box3().setFromObject(productModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim; // Scale to fit in 2 units
      
      productModel.position.sub(center);
      productModel.scale.multiplyScalar(scale);
      productModel.position.y = 0.5; // Lift off ground
      
      // Enable shadows
      productModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Remove old product model if exists
      if (productModelRef.current) {
        sceneRef.current.remove(productModelRef.current);
      }

      productModelRef.current = productModel;
      sceneRef.current.add(productModel);

      // Load room/scene if provided
      if (sceneUrl) {
        const roomGltf = await loaderRef.current.loadAsync(sceneUrl);
        const roomModel = roomGltf.scene;
        
        roomModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.receiveShadow = true;
          }
        });

        // Remove old room model if exists
        if (roomModelRef.current) {
          sceneRef.current.remove(roomModelRef.current);
        }

        roomModelRef.current = roomModel;
        sceneRef.current.add(roomModel);
      } else {
        // Add a simple floor if no scene provided
        addFloor();
      }

      setIsLoading(false);

    } catch (error) {
      console.error('Error loading models:', error);
      setIsLoading(false);
    }
  };

  const addFloor = () => {
    if (!sceneRef.current) return;

    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'floor';
    sceneRef.current.add(floor);

    // Add a subtle grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x000000, 0x000000);
    gridHelper.material.opacity = 0.1;
    gridHelper.material.transparent = true;
    sceneRef.current.add(gridHelper);
  };

  const animate = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    animationFrameRef.current = rendererRef.current.setAnimationLoop(() => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
    });
  };

  const cleanup = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (rendererRef.current) {
      rendererRef.current.dispose();
    }

    if (containerRef.current && rendererRef.current?.domElement) {
      containerRef.current.removeChild(rendererRef.current.domElement);
    }
  };

  const handleScaleChange = (delta: number) => {
    if (productModelRef.current) {
      const newScale = Math.max(0.1, Math.min(5, productScale + delta));
      setProductScale(newScale);
      
      const currentScale = productModelRef.current.scale.x;
      const scaleFactor = newScale / productScale;
      productModelRef.current.scale.multiplyScalar(scaleFactor);
    }
  };

  const handleRotationChange = (delta: number) => {
    if (productModelRef.current) {
      const newRotation = productRotation + delta;
      setProductRotation(newRotation);
      productModelRef.current.rotation.y = (newRotation * Math.PI) / 180;
    }
  };

  const resetTransform = () => {
    if (productModelRef.current) {
      setProductScale(1);
      setProductRotation(0);
      productModelRef.current.rotation.y = 0;
      // Reset to original scale (would need to store initial scale)
    }
  };

  const isDataUrl = (url: string): boolean => {
    return url.startsWith('data:');
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '2rem',
          borderRadius: '12px',
          color: '#fff',
          textAlign: 'center',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #333',
            borderTop: '4px solid #fff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p>Loading 3D Model...</p>
        </div>
      )}

      {/* Transform Controls */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        right: '2rem',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '1rem',
        borderRadius: '12px',
        border: '1px solid #333',
        color: '#fff',
        minWidth: '200px',
      }}>
        <div style={{ marginBottom: '1rem', fontWeight: '600', fontSize: '0.9rem' }}>
          Product Controls
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.25rem' }}>
            Scale: {productScale.toFixed(2)}x
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => handleScaleChange(-0.1)} style={buttonStyle}>−</button>
            <button onClick={() => handleScaleChange(0.1)} style={buttonStyle}>+</button>
          </div>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.25rem' }}>
            Rotation: {productRotation}°
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => handleRotationChange(-15)} style={buttonStyle}>↶</button>
            <button onClick={() => handleRotationChange(15)} style={buttonStyle}>↷</button>
          </div>
        </div>

        <button 
          onClick={resetTransform}
          style={{
            ...buttonStyle,
            width: '100%',
            background: '#fff',
            color: '#000',
          }}
        >
          Reset
        </button>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.5rem',
  background: 'transparent',
  border: '1px solid #555',
  borderRadius: '6px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '1rem',
  transition: 'all 0.2s',
};