// SceneContentOOP.tsx - Complete working integration with OOP classes
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Environment, PerspectiveCamera } from "@react-three/drei";
import { useXRStore, useXR } from "@react-three/xr";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// UI Components (unchanged)
import { CatalogToggle } from "../panel/furniture/FurnitureCatalogToggle";
import { VRInstructionPanel } from "../panel/VRInstructionPanel";
import { VRFurniturePanel } from "../panel/furniture/FurniturePanel";
import { VRSlider } from "../panel/VRSlider";
import { HeadLockedUI } from "../panel/common/HeadLockedUI";
import { VRControlPanel } from "../panel/control/ControlPanel";
import { ControlPanelToggle } from "../panel/control/ControlPanelToggle";
import { VRNotificationPanel } from "../panel/common/NotificationPanel";

// OOP Classes
import { SceneManager } from "../../three/managers/SceneManager";
import { FurnitureItem, FurnitureMetadata } from "../../three/objects/FurnitureItem";
import { HomeModel } from "../../three/objects/HomeModel";
import { NavigationController, FurnitureEditController } from "../../three/controllers/XRControllerBase";

// Utils
import { makeAuthenticatedRequest, logout } from "../../utils/Auth";

const DIGITAL_HOME_PLATFORM_BASE_URL = import.meta.env.VITE_DIGITAL_HOME_PLATFORM_URL;

interface SceneContentProps {
  homeId: string;
  digitalHome?: {
    spatialData?: {
      boundary?: {
        min_x: number;
        max_x: number;
        min_y: number;
        max_y: number;
        min_z: number;
        max_z: number;
      };
    };
  };
}

export function SceneContentOOP({ homeId, digitalHome }: SceneContentProps) {
  const navigate = useNavigate();
  const { scene, camera } = useThree();
  const xr = useXR();
  const xrStore = useXRStore();
  
  // OOP Managers and Controllers
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const navigationControllerRef = useRef<NavigationController | null>(null);
  const furnitureControllerRef = useRef<FurnitureEditController | null>(null);
  
  // UI State
  const [showSlider, setShowSlider] = useState(false);
  const [showFurniture, setShowFurniture] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<"success" | "error" | "info">("info");
  
  // Scene State
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [navigationMode, setNavigationMode] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // Slider values
  const [sliderValue, setSliderValue] = useState(1.0);
  const [rotationValue, setRotationValue] = useState(0);
  
  // Furniture catalog
  const [furnitureCatalog, setFurnitureCatalog] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [modelUrlCache, setModelUrlCache] = useState<Map<number, string>>(new Map());

  const uiLocked = showFurniture || showControlPanel || showInstructions || showSlider || showNotification;

  // Show notification helper
  const showNotificationMessage = (message: string, type: "success" | "error" | "info" = "info") => {
    setShowControlPanel(false);
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
  };

  // Initialize Scene Manager and Controllers
  useEffect(() => {
    const sceneManager = new SceneManager(scene, {
      enableCollisionDetection: true,
      enableDebugMode: false,
      floorLevel: 0,
    });
    sceneManagerRef.current = sceneManager;

    // Initialize Navigation Controller
    const navController = new NavigationController(
      {
        moveSpeed: 2.5,
        rotateSpeed: 1.5,
        deadzone: 0.15,
      },
      (isActive) => {
        setNavigationMode(isActive);
      }
    );
    navigationControllerRef.current = navController;

    // Initialize Furniture Edit Controller
    const furnitureController = new FurnitureEditController(
      {
        moveSpeed: 1.5,
        rotateSpeed: 1.5,
        deadzone: 0.1,
      },
      {
        onFurnitureMove: async (id, delta) => {
          const furniture = sceneManager.getFurniture(id);
          if (!furniture) return;

          const currentPos = furniture.getPosition();
          const newPos: [number, number, number] = [
            currentPos[0] + delta.x,
            currentPos[1] + delta.y,
            currentPos[2] + delta.z,
          ];

          await sceneManager.moveFurniture(id, newPos);
        },
        onFurnitureRotate: (id, deltaY) => {
          const furniture = sceneManager.getFurniture(id);
          if (!furniture) return;

          const currentRot = furniture.getRotation();
          const newRot: [number, number, number] = [
            currentRot[0],
            currentRot[1] + deltaY,
            currentRot[2],
          ];

          sceneManager.rotateFurniture(id, newRot);
          
          // Update rotation slider
          const twoPi = Math.PI * 2;
          let normalizedRotation = newRot[1] % twoPi;
          if (normalizedRotation < 0) normalizedRotation += twoPi;
          setRotationValue(normalizedRotation);
        },
        onFurnitureDeselect: (id) => {
          sceneManager.deselectFurniture(id);
          setSelectedItemId(null);
          setShowSlider(false);
        },
      }
    );
    furnitureControllerRef.current = furnitureController;

    return () => {
      sceneManager.dispose();
      navController.reset();
      furnitureController.reset();
    };
  }, [scene, homeId]);

  // Setup XR Rig for navigation
  useEffect(() => {
    if (!xr.session || !navigationControllerRef.current) return;

    let rig = scene.getObjectByName("CustomXRRig") as THREE.Group;
    if (!rig) {
      rig = new THREE.Group();
      rig.name = "CustomXRRig";
      scene.add(rig);
    }
    if (camera.parent !== rig) {
      rig.add(camera);
    }
    navigationControllerRef.current.setRig(rig);
  }, [xr.session, scene, camera]);

  // Load Home Model
  useEffect(() => {
    const loadHome = async () => {
      if (!sceneManagerRef.current) return;

      try {
        const response = await makeAuthenticatedRequest(`/digitalhomes/download_digital_home/${homeId}/`);
        
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          
          const homeModel = new HomeModel(
            homeId,
            'Digital Home',
            parseInt(homeId),
            url,
            digitalHome?.spatialData?.boundary
          );

          await sceneManagerRef.current.setHomeModel(homeModel);
        }
      } catch (error) {
        console.error('Failed to load home:', error);
      }
    };

    loadHome();
  }, [homeId, digitalHome]);

  // Load furniture catalog
  useEffect(() => {
    const loadFurnitureCatalog = async () => {
      setCatalogLoading(true);
      try {
        const response = await makeAuthenticatedRequest('/digitalhomes/list_available_items/');

        if (response.ok) {
          const data = await response.json();
          const items = data.available_items.map((item: any) => ({
            id: item.id.toString(),
            name: item.name,
            description: item.description,
            model_id: item.model_id,
            image: item.image,
            category: item.category,
            type: item.type,
            is_container: item.is_container,
          }));

          setFurnitureCatalog(items);

          // Preload models
          for (const item of items) {
            await loadFurnitureModel(item.model_id);
          }
        }
      } catch (error) {
        console.error('Error loading furniture catalog:', error);
      } finally {
        setCatalogLoading(false);
      }
    };

    loadFurnitureCatalog();

    return () => {
      modelUrlCache.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Load furniture model helper
  const loadFurnitureModel = async (modelId: number) => {
    if (modelUrlCache.has(modelId)) return;

    try {
      const response = await makeAuthenticatedRequest(`/products/get_3d_model/${modelId}/`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setModelUrlCache(prev => new Map(prev).set(modelId, url));
      }
    } catch (error) {
      console.error(`Error loading model ${modelId}:`, error);
    }
  };

  // Load deployed items
  useEffect(() => {
    const loadDeployedItems = async () => {
      if (!sceneManagerRef.current || modelUrlCache.size === 0) return;
      
      setLoading(true);
      try {
        const response = await makeAuthenticatedRequest(`/digitalhomes/get_deployed_items_details/${homeId}/`);

        if (response.ok) {
          const data = await response.json();

          for (const itemObj of data.deployed_items) {
            const itemId = Object.keys(itemObj)[0];
            const itemData = itemObj[itemId];

            const modelPath = modelUrlCache.get(itemData.model_id);
            if (!modelPath) continue;

            const metadata: FurnitureMetadata = {
              description: itemData.description,
              category: itemData.category,
              type: itemData.type,
              isContainer: itemData.is_container,
            };

            const furniture = new FurnitureItem(
              itemId,
              itemData.name,
              itemData.model_id,
              modelPath,
              metadata,
              {
                position: itemData.spatialData.positions,
                rotation: itemData.spatialData.rotation,
                scale: itemData.spatialData.scale[0],
              }
            );

            await sceneManagerRef.current.addFurniture(furniture);
          }
          
          // After all furniture loaded, update all collisions
          if (sceneManagerRef.current) {
            setTimeout(async () => {
              await sceneManagerRef.current!.updateAllCollisions();
              console.log('✅ All collisions updated after loading');
            }, 200);
          }
        }
      } catch (error) {
        console.error('Error loading deployed items:', error);
      } finally {
        setLoading(false);
      }
    };

    if (modelUrlCache.size > 0) {
      loadDeployedItems();
    }
  }, [homeId, modelUrlCache.size]);

  // Update loop - run controllers
  useFrame((_state, delta) => {
    const session = xr.session;
    if (!session) return;

    // Update navigation
    navigationControllerRef.current?.update(session, camera, delta);

    // Update furniture controller when not navigating
    if (!navigationMode && selectedItemId && furnitureControllerRef.current) {
      furnitureControllerRef.current.update(session, camera, delta);
    }
  });

  // UI Handlers
  const handleToggleUI = () => {
    if (showControlPanel) {
      setShowControlPanel(false);
    }
    if (showInstructions) {
      setShowInstructions(false);
      setShowFurniture(true);
    } else if (showFurniture) {
      setShowFurniture(false);
      if (selectedItemId) setShowSlider(true);
    } else {
      setShowFurniture(true);
      setShowSlider(false);
    }
  };

  const handleToggleControlPanel = () => {
    setShowControlPanel(prev => {
      const newState = !prev;
      if (newState) {
        setShowFurniture(false);
        setShowSlider(false);
        setShowInstructions(false);
      }
      return newState;
    });
  };

  const handleSaveScene = async () => {
    if (saving || !sceneManagerRef.current) return;
    
    setSaving(true);
    try {
      const sceneData = sceneManagerRef.current.serializeScene();
      
      const formData = new FormData();
      formData.append('id', homeId);
      formData.append('deployedItems', JSON.stringify(sceneData.deployedItems));

      const response = await makeAuthenticatedRequest('/digitalhomes/update_home_design/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        showNotificationMessage('Scene saved successfully!', 'success');
      } else {
        const error = await response.json();
        showNotificationMessage(`Failed to save scene: ${error.error}`, 'error');
      }
    } catch (error) {
      console.error('Error saving scene:', error);
      showNotificationMessage('Error saving scene. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleHelp = () => {
    setShowInstructions(true);
    setShowFurniture(false);
    setShowSlider(false);
    setShowControlPanel(false);
  };

  const handleBackToHome = async () => {
    const session = xrStore.getState().session;
    if (session) {
      try {
        await session.end();
        setTimeout(() => navigate("/"), 300);
      } catch (error) {
        console.error("Error exiting VR session:", error);
        navigate("/");
      }
    } else {
      navigate("/");
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = DIGITAL_HOME_PLATFORM_BASE_URL;
  };

  const handleSelectFurniture = (f: any) => {
    if (!sceneManagerRef.current) return;

    const catalogId = f.id;
    const allFurniture = sceneManagerRef.current.getAllFurniture();
    
    // Check if already placed
    const existingFurniture = allFurniture.find(item => {
      const placedCatalogId = item.getId().split('-')[0];
      return placedCatalogId === catalogId;
    });

    if (existingFurniture) {
      // Remove furniture
      sceneManagerRef.current.removeFurniture(existingFurniture.getId());
      if (selectedItemId === existingFurniture.getId()) {
        setSelectedItemId(null);
        setShowSlider(false);
      }
      return;
    }

    // Add new furniture
    const modelPath = modelUrlCache.get(f.model_id);
    if (!modelPath) {
      console.warn('Model not loaded yet for:', f.name);
      return;
    }

    const spawnPos = sceneManagerRef.current.calculateSpawnPosition(camera, 2);
    const uniqueId = `${f.id}-${Date.now()}`;

    const metadata: FurnitureMetadata = {
      description: f.description,
      category: f.category,
      type: f.type,
      isContainer: f.is_container,
      image: f.image,
    };

    const newFurniture = new FurnitureItem(
      uniqueId,
      f.name,
      f.model_id,
      modelPath,
      metadata,
      {
        position: spawnPos,
        rotation: [0, 0, 0],
        scale: sliderValue,
      }
    );

    sceneManagerRef.current.addFurniture(newFurniture).then(() => {
      sceneManagerRef.current!.selectFurniture(uniqueId);
      setSelectedItemId(uniqueId);
      furnitureControllerRef.current?.setSelectedFurniture(uniqueId);
      
      // Initialize last valid position
      newFurniture['lastValidPosition'] = [...spawnPos] as [number, number, number];
      
      setRotationValue(0);
      setShowSlider(true);
      setShowFurniture(false);
    });
  };

  const handleSelectItem = (id: string) => {
    if (!sceneManagerRef.current) return;

    if (selectedItemId === id) {
      sceneManagerRef.current.deselectFurniture(id);
      setSelectedItemId(null);
      setShowSlider(false);
      furnitureControllerRef.current?.setSelectedFurniture(null);
      return;
    }

    sceneManagerRef.current.selectFurniture(id);
    setSelectedItemId(id);
    setShowSlider(true);
    
    // Sync with controller
    furnitureControllerRef.current?.setSelectedFurniture(id);

    const furniture = sceneManagerRef.current.getFurniture(id);
    if (furniture) {
      // Store initial position as last valid position
      const currentPos = furniture.getPosition();
      furniture['lastValidPosition'] = [...currentPos] as [number, number, number];
      
      const rotation = furniture.getRotation();
      const scale = furniture.getScale();
      
      // Update rotation slider
      const twoPi = Math.PI * 2;
      let normalizedRotation = rotation[1] % twoPi;
      if (normalizedRotation < 0) normalizedRotation += twoPi;
      setRotationValue(normalizedRotation);
      
      // Update scale slider
      const scaleValue = typeof scale === 'number' ? scale : scale[0];
      setSliderValue(scaleValue);
    }
  };

  const handleScaleChange = (newScale: number) => {
    setSliderValue(newScale);
    if (selectedItemId && sceneManagerRef.current) {
      sceneManagerRef.current.scaleFurniture(selectedItemId, newScale);
    }
  };

  const handleRotationSliderChange = (newRotation: number) => {
    setRotationValue(newRotation);
    if (selectedItemId && sceneManagerRef.current) {
      const furniture = sceneManagerRef.current.getFurniture(selectedItemId);
      if (furniture) {
        const currentRot = furniture.getRotation();
        sceneManagerRef.current.rotateFurniture(selectedItemId, [currentRot[0], newRotation, currentRot[2]]);
      }
    }
  };

  // Get placed furniture IDs for catalog
  const placedCatalogIds = React.useMemo(() => {
    if (!sceneManagerRef.current) return [];
    return sceneManagerRef.current.getAllFurniture().map(item => item.getId().split('-')[0]);
  }, [sceneManagerRef.current?.getAllFurniture().length]);

  if (loading) {
    return (
      <>
        <color args={["#808080"]} attach="background" />
        <PerspectiveCamera makeDefault position={[0, 1.6, 2]} fov={75} />
        <ambientLight intensity={0.5} />
        <group position={[0, 1.6, -2]}>
          <mesh>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial color="#4CAF50" wireframe />
          </mesh>
        </group>
      </>
    );
  }

  return (
    <>
      <color args={["#808080"]} attach="background" />
      <PerspectiveCamera makeDefault position={[0, 1.6, 2]} fov={75} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <Environment preset="warehouse" />

      {/* Render 3D objects from SceneManager - demonstrates encapsulation */}
      <group position={[0, 0, 0]}>
        {sceneManagerRef.current && (
          <>
            {/* Home Model */}
            {sceneManagerRef.current.getHomeModel() && (
              <primitive object={sceneManagerRef.current.getHomeModel()!.getGroup()} />
            )}
            
            {/* Furniture Items */}
            {sceneManagerRef.current.getAllFurniture().map((furniture) => (
              <primitive
                key={furniture.getId()}
                object={furniture.getGroup()}
                onClick={(e: any) => {
                  if (!navigationMode && !uiLocked) {
                    e.stopPropagation();
                    handleSelectItem(furniture.getId());
                  }
                }}
              />
            ))}
          </>
        )}
      </group>
      
      <CatalogToggle onToggle={handleToggleUI} />
      <ControlPanelToggle onToggle={handleToggleControlPanel} />

      <HeadLockedUI distance={1.6} verticalOffset={0} enabled={showInstructions}>
        <VRInstructionPanel show={showInstructions} onClose={() => setShowInstructions(false)} />
      </HeadLockedUI>

      <HeadLockedUI distance={1.7} verticalOffset={0} enabled={showFurniture}>
        <VRFurniturePanel
          show={showFurniture}
          catalog={furnitureCatalog}
          loading={catalogLoading}
          onSelectItem={handleSelectFurniture}
          placedFurnitureIds={placedCatalogIds}
        />
      </HeadLockedUI>

      <HeadLockedUI distance={1.7} verticalOffset={0} enabled={showControlPanel}>
        <VRControlPanel
          show={showControlPanel}
          onSave={handleSaveScene}
          onHelp={handleHelp}
          onBack={handleBackToHome}
          onLogout={handleLogout}
          saving={saving}
          onClose={() => setShowControlPanel(false)}
        />
      </HeadLockedUI>

      <HeadLockedUI distance={1.4} enabled={showSlider && selectedItemId !== null}>
        <group>
          <VRSlider
            show={showSlider && selectedItemId !== null}
            value={sliderValue}
            onChange={handleScaleChange}
            label="Scale"
            min={0.1}
            max={2}
            position={[0, 0.3, 0]}
            onClose={() => setShowSlider(false)}
          />
          <VRSlider
            show={null}
            value={rotationValue}
            onChange={handleRotationSliderChange}
            label="Rotation"
            min={0}
            max={Math.PI * 2}
            position={[0, -0.75, 0]}
            showDegrees={true}
            onClose={() => setShowSlider(false)}
          />
        </group>
      </HeadLockedUI>

      <HeadLockedUI distance={1.4} verticalOffset={0} enabled={showNotification}>
        <VRNotificationPanel
          show={showNotification}
          message={notificationMessage}
          type={notificationType}
          onClose={() => {
            setShowNotification(false);
            setShowControlPanel(true);
          }}
        />
      </HeadLockedUI>
    </>
  );
}