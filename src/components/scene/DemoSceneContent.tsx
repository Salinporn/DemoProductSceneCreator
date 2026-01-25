import { useEffect, useRef, useState } from "react";
import { Environment, PerspectiveCamera } from "@react-three/drei";
import { useXR } from "@react-three/xr";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { HeadLockedUI } from "../panel/common/HeadLockedUI";
import { VRInstructionPanel } from "../panel/VRInstructionPanel";
import { VRNotificationPanel } from "../panel/common/NotificationPanel";
import { NavigationController, ProductEditController } from "../../core/controllers/XRProductController";
import { makeAuthenticatedRequest } from "../../utils/Api";
import { ProductModel } from "../../core/objects/ProductModel";
import { SceneModel } from "../../core/objects/SceneModel";
import { DemoSceneManager } from "../../core/managers/DemoSceneManager";

interface DemoSceneContentProps {
  productId: string;
  sceneId: string | null;
  productName: string | null;
  apiBase: string | null;
}

interface DemoState {
  showInstructions: boolean;
  showNotification: boolean;
  notificationMessage: string;
  notificationType: "success" | "error" | "info";
  loading: boolean;
  navigationMode: boolean;
  productScale: number;
  productRotationY: number;
}

class DemoSceneLogic {
  private state: DemoState;
  private setState: (updater: Partial<DemoState>) => void;
  private productId: string;
  private sceneId: string | null;
  private productName: string | null;

  // Managers
  public sceneManager: DemoSceneManager | null = null;
  public navigationController: NavigationController | null = null;
  public productController: ProductEditController | null = null;

  // Model URL cache
  public modelUrlCache: Map<number, string> = new Map();

  constructor(
    productId: string,
    sceneId: string | null,
    productName: string | null,
    setState: (updater: Partial<DemoState>) => void
  ) {
    this.productId = productId;
    this.sceneId = sceneId;
    this.productName = productName;
    this.setState = setState;

    this.state = {
      showInstructions: true,
      showNotification: false,
      notificationMessage: "",
      notificationType: "info",
      loading: true,
      navigationMode: false,
      productScale: 1.0,
      productRotationY: 0,
    };
  }

  getState(): DemoState {
    return this.state;
  }

  updateState(update: Partial<DemoState>): void {
    this.state = { ...this.state, ...update };
    this.setState(update);
  }

  initializeManagers(scene: THREE.Scene): void {
    this.sceneManager = new DemoSceneManager(scene);

    this.navigationController = new NavigationController(
      {
        moveSpeed: 2.5,
        rotateSpeed: 1.5,
        deadzone: 0.15,
      },
      (isActive) => {
        this.updateState({ navigationMode: isActive });
      }
    );

    this.productController = new ProductEditController(
      {
        moveSpeed: 1.5,
        rotateSpeed: 1.5,
        deadzone: 0.1,
      },
      {
        onProductMove: (delta) => {
          this.handleProductMove(delta);
        },
        onProductRotate: (deltaY) => {
          this.handleProductRotate(deltaY);
        },
        onProductScale: (delta) => {
          this.handleProductScale(delta);
        },
      }
    );
  }

  setupXRRig(scene: THREE.Scene, camera: THREE.Camera): void {
    if (!this.navigationController) return;

    let rig = scene.getObjectByName("CustomXRRig") as THREE.Group;
    if (!rig) {
      rig = new THREE.Group();
      rig.name = "CustomXRRig";
      scene.add(rig);
    }
    if (camera.parent !== rig) {
      rig.add(camera);
    }
    this.navigationController.setRig(rig);
  }

  cleanup(): void {
    this.sceneManager?.dispose();
    this.navigationController?.reset();
    this.productController?.reset();
    this.modelUrlCache.forEach(url => URL.revokeObjectURL(url));
  }

  async loadScene(): Promise<void> {
    if (!this.sceneManager) return;

    try {
      // Load scene (or use default if no sceneId)
      if (this.sceneId) {
        const response = await makeAuthenticatedRequest(
          `/products/get_display_scene/${this.sceneId}/`
        );

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);

          const sceneModel = new SceneModel(
            this.sceneId,
            'Product Scene',
            parseInt(this.sceneId),
            url
          );

          await this.sceneManager.setSceneModel(sceneModel);
        }
      }
    } catch (error) {
      console.error('Failed to load scene:', error);
      this.showNotificationMessage('Failed to load scene', 'error');
    }
  }

  async loadProduct(): Promise<void> {
    if (!this.sceneManager) return;

    try {
      const response = await makeAuthenticatedRequest(
        `/products/get_product_detail/${this.productId}/`
      );

      if (response.ok) {
        const data = await response.json();
        const modelId = data.product.model_id;

        // Load 3D model
        const modelResponse = await makeAuthenticatedRequest(
          `/products/get_3d_model/${modelId}/`
        );

        if (modelResponse.ok) {
          const blob = await modelResponse.blob();
          const url = URL.createObjectURL(blob);
          this.modelUrlCache.set(modelId, url);

          const productModel = new ProductModel(
            this.productId,
            this.productName || data.product.name,
            modelId,
            url,
            {
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: 1.0,
            }
          );

          await this.sceneManager.setProduct(productModel);
          this.updateState({ loading: false });
        }
      }
    } catch (error) {
      console.error('Error loading product:', error);
      this.showNotificationMessage('Failed to load product', 'error');
      this.updateState({ loading: false });
    }
  }

  showNotificationMessage(
    message: string,
    type: "success" | "error" | "info" = "info"
  ): void {
    this.updateState({
      notificationMessage: message,
      notificationType: type,
      showNotification: true,
    });
  }

  handleToggleInstructions(): void {
    this.updateState({
      showInstructions: !this.state.showInstructions,
    });
  }

  private handleProductMove(delta: THREE.Vector3): void {
    if (!this.sceneManager) return;
    this.sceneManager.moveProduct(delta);
  }

  private handleProductRotate(deltaY: number): void {
    if (!this.sceneManager) return;
    this.sceneManager.rotateProduct(deltaY);
    this.updateState({ productRotationY: this.state.productRotationY + deltaY });
  }

  private handleProductScale(delta: number): void {
    if (!this.sceneManager) return;
    const newScale = Math.max(0.1, Math.min(5.0, this.state.productScale + delta));
    this.sceneManager.scaleProduct(newScale);
    this.updateState({ productScale: newScale });
  }

  updateFrame(session: any, camera: THREE.Camera, delta: number): void {
    if (!session) return;

    this.navigationController?.update(session, camera, delta);

    if (!this.state.navigationMode && this.productController) {
      this.productController.update(session, camera, delta);
    }
  }
}

// Wrapper for R3F hooks
export function DemoSceneContent({ 
  productId, 
  sceneId, 
  productName,
  apiBase 
}: DemoSceneContentProps) {
  const { scene, camera } = useThree();
  const xr = useXR();

  const [state, setState] = useState<DemoState>({
    showInstructions: true,
    showNotification: false,
    notificationMessage: "",
    notificationType: "info",
    loading: true,
    navigationMode: false,
    productScale: 1.0,
    productRotationY: 0,
  });

  const logicRef = useRef<DemoSceneLogic | null>(null);

  useEffect(() => {
    const updateState = (update: Partial<DemoState>) => {
      setState(prev => ({ ...prev, ...update }));
    };

    logicRef.current = new DemoSceneLogic(
      productId,
      sceneId,
      productName,
      updateState
    );
    logicRef.current.initializeManagers(scene);

    return () => {
      logicRef.current?.cleanup();
    };
  }, [productId, sceneId, productName, scene]);

  useEffect(() => {
    if (!xr.session || !logicRef.current) return;
    logicRef.current.setupXRRig(scene, camera);
  }, [xr.session, scene, camera]);

  // Load scene and product
  useEffect(() => {
    if (!logicRef.current) return;
    
    const loadAll = async () => {
      await logicRef.current!.loadScene();
      await logicRef.current!.loadProduct();
    };

    loadAll();
  }, []);

  useFrame((_state, delta) => {
    const session = xr.session;
    if (!session || !logicRef.current) return;
    logicRef.current.updateFrame(session, camera, delta);
  });

  if (!logicRef.current) return null;

  const logic = logicRef.current;

  if (state.loading) {
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

      <group position={[0, 0, 0]}>
        {logic.sceneManager && (
          <>
            {logic.sceneManager.getSceneModel() && (
              <primitive object={logic.sceneManager.getSceneModel()!.getGroup()} />
            )}
            
            {logic.sceneManager.getProduct() && (
              <primitive object={logic.sceneManager.getProduct()!.getGroup()} />
            )}
          </>
        )}
      </group>

      <HeadLockedUI distance={1.6} verticalOffset={0} enabled={state.showInstructions}>
        <VRInstructionPanel 
          show={state.showInstructions} 
          onClose={() => logic.updateState({ showInstructions: false })} 
        />
      </HeadLockedUI>

      <HeadLockedUI distance={1.4} verticalOffset={0} enabled={state.showNotification}>
        <VRNotificationPanel
          show={state.showNotification}
          message={state.notificationMessage}
          type={state.notificationType}
          onClose={() => logic.updateState({ showNotification: false })}
        />
      </HeadLockedUI>
    </>
  );
}