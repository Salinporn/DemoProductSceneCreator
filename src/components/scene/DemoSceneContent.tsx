import { useEffect, useRef, useState } from "react";
import { Environment, PerspectiveCamera } from "@react-three/drei";
import { useXR } from "@react-three/xr";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { HeadLockedUI } from "../panel/common/HeadLockedUI";
import { VRInstructionPanel } from "../panel/VRInstructionPanel";
import { VRNotificationPanel } from "../panel/common/NotificationPanel";
import { VRSidebar } from "../panel/sidebar/VRSidebar";
import { VRProductCatalogPanel, StoreProduct } from "../panel/catalog/ProductCatalogPanel";
import { VRSceneCatalogPanel, SceneEntry } from "../panel/catalog/SceneCatalogPanel";
import { VRCartCatalogPanel, CartProduct } from "../panel/catalog/CartCatalogPanel";
import { NavigationController, ProductEditController } from "../../core/controllers/XRProductController";
import { makeAuthenticatedRequest } from "../../utils/API";
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

  activePanel: "products" | "scenes" | "instructions" | "cart" | null;
  allProducts: StoreProduct[];
  productsLoading: boolean;
  currentProductId: string;
  currentSceneId: string | null;
  scenes: SceneEntry[];
  scenesLoading: boolean;
  cartProducts: CartProduct[];
  cartLoading: boolean;
}

class DemoSceneLogic {
  private state: DemoState;
  private setState: (updater: Partial<DemoState>) => void;

  public sceneManager: DemoSceneManager | null = null;
  public navigationController: NavigationController | null = null;
  public productController: ProductEditController | null = null;

  public modelUrlCache: Map<number, string> = new Map();
  public sceneUrlCache: Map<number, string> = new Map();

  private sceneEntryMap: Map<string, SceneEntry> = new Map();

  constructor(
    productId: string,
    sceneId: string | null,
    productName: string | null,
    setState: (updater: Partial<DemoState>) => void
  ) {
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
      activePanel: null,
      allProducts: [],
      productsLoading: true,
      currentProductId: productId,
      currentSceneId: sceneId,
      scenes: [],
      scenesLoading: true,
      cartProducts: [],
      cartLoading: false,
    };
  }

  getState(): DemoState {
    return this.state;
  }

  getSceneEntry(sceneId: string): SceneEntry | undefined {
    return this.sceneEntryMap.get(sceneId);
  }

  updateState(update: Partial<DemoState>): void {
    this.state = { ...this.state, ...update };
    this.setState(update);
  }

  initializeManagers(scene: THREE.Scene): void {
    this.sceneManager = new DemoSceneManager(scene);

    this.navigationController = new NavigationController(
      { moveSpeed: 2.5, rotateSpeed: 1.5, deadzone: 0.15 },
      (isActive) => this.updateState({ navigationMode: isActive })
    );

    this.productController = new ProductEditController(
      { moveSpeed: 1.5, rotateSpeed: 1.5, deadzone: 0.1 },
      {
        onProductMove: (delta) => this.handleProductMove(delta),
        onProductRotate: (deltaY) => this.handleProductRotate(deltaY),
        onProductScale: (delta) => this.handleProductScale(delta),
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
    if (camera.parent !== rig) rig.add(camera);
    this.navigationController.setRig(rig);
  }

  cleanup(): void {
    this.sceneManager?.dispose();
    this.navigationController?.reset();
    this.productController?.reset();
    this.modelUrlCache.forEach((url) => URL.revokeObjectURL(url));
    this.sceneUrlCache.forEach((url) => URL.revokeObjectURL(url));
  }

  async loadScene(): Promise<void> {
    if (!this.sceneManager) return;
    
    // If currentSceneId is null, don't load any scene
    if (!this.state.currentSceneId) {
      // Clear any existing scene
      if (this.sceneManager.getSceneModel()) {
        const oldScene = this.sceneManager.getSceneModel();
        if (oldScene) {
          this.sceneManager.getSceneModel()?.dispose();
        }
      }
      return;
    }
    
    try {
      const sceneId = this.state.currentSceneId;
      const entry = this.sceneEntryMap.get(String(sceneId));

      let endpoint: string;
      let cacheKey: number;
      let sceneLabel: string;

      if (entry?.type === "digital_home" && entry.homeId != null) {
        endpoint = `/digitalhomes/download_digital_home/${entry.homeId}/`;
        cacheKey = entry.homeId;
        sceneLabel = entry.label;
      } else {
        endpoint = `/products/get_display_scene/${sceneId}/`;
        cacheKey = parseInt(sceneId);
        sceneLabel = "Default Room";
      }

      let url = this.sceneUrlCache.get(cacheKey) || null;
      if (!url) {
        const response = await makeAuthenticatedRequest(endpoint);
        if (!response.ok) return;
        const blob = await response.blob();
        url = URL.createObjectURL(blob);
        this.sceneUrlCache.set(cacheKey, url);
      }

      const sceneModel = new SceneModel(sceneId, sceneLabel, cacheKey, url);
      await this.sceneManager.setSceneModel(sceneModel);
    } catch (error) {
      console.error("Failed to load scene:", error);
      this.showNotificationMessage("Failed to load scene", "error");
    }
  }

  async loadProduct(): Promise<void> {
    if (!this.sceneManager) return;
    try {
      const productId = this.state.currentProductId;
      const response = await makeAuthenticatedRequest(
        `/products/get_product_detail/${productId}/`
      );
      if (!response.ok) return;

      const data = await response.json();
      const product = data.product;
      const modelId = product.model_id;

      let url = this.modelUrlCache.get(modelId) || null;
      if (!url) {
        const modelResponse = await makeAuthenticatedRequest(
          `/products/get_3d_model/${modelId}/`
        );
        if (!modelResponse.ok) return;
        const blob = await modelResponse.blob();
        url = URL.createObjectURL(blob);
        this.modelUrlCache.set(modelId, url);
      }

      const productModel = new ProductModel(
        productId,
        product.name,
        modelId,
        url,
        { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1.0 }
      );

      await this.sceneManager.setProduct(productModel);

      const sceneIds: number[] = product.display_scenes_ids || [];
      const productScenes: SceneEntry[] = sceneIds.map((id, idx) => ({
        id,
        label: `Room ${idx + 1}`,
        type: "display_scene" as const,
      }));

      const homeScenes = await this.fetchDigitalHomeScenes();
      const allScenes: SceneEntry[] = [...productScenes, ...homeScenes];

      this.sceneEntryMap.clear();
      allScenes.forEach((entry) => {
        this.sceneEntryMap.set(String(entry.id), entry);
      });
      
      let initialSceneId = this.state.currentSceneId;
      let shouldLoadScene = false;
      
      if (!initialSceneId) {
        if (homeScenes.length > 0) {
          const defaultScene = homeScenes[0];
          initialSceneId = String(defaultScene.id);
          shouldLoadScene = true;
          
          this.showNotificationMessage(
            `Using your digital home: ${defaultScene.label}`,
            "info"
          );
        } else {
          this.showNotificationMessage(
            "No digital home available. Please create a digital home to view products in VR.",
            "error"
          );
          initialSceneId = null;
        }
      } else {
        const currentSceneStillExists = allScenes.some(s => String(s.id) === String(initialSceneId));
        if (!currentSceneStillExists) {
          if (homeScenes.length > 0) {
            const defaultScene = homeScenes[0];
            initialSceneId = String(defaultScene.id);
            shouldLoadScene = true;
            
            this.showNotificationMessage(
              `Switched to your digital home: ${defaultScene.label}`,
              "info"
            );
          } else {
            initialSceneId = null;
            this.showNotificationMessage(
              "No digital home available. Please create a digital home to view products in VR.",
              "error"
            );
          }
        }
      }

      if (shouldLoadScene) {
        this.state.currentSceneId = initialSceneId;
        await this.loadScene();
      }

      this.updateState({
        loading: false,
        productScale: 1.0,
        productRotationY: 0,
        scenes: allScenes,
        scenesLoading: false,
        currentSceneId: initialSceneId,
      });
    } catch (error) {
      console.error("Error loading product:", error);
      this.showNotificationMessage("Failed to load product", "error");
      this.updateState({ loading: false, scenesLoading: false });
    }
  }

  async fetchAllProducts(): Promise<void> {
    try {
      const response = await makeAuthenticatedRequest("/products/list/", {
        method: "POST",
        body: new URLSearchParams({}),
      });
      if (!response.ok) {
        this.updateState({ productsLoading: false });
        return;
      }
      const data = await response.json();
      this.updateState({
        allProducts: data.products || [],
        productsLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch products:", error);
      this.updateState({ productsLoading: false });
    }
  }

  async fetchCartItems(): Promise<void> {
    this.updateState({ cartLoading: true });
    try {
      const cartResponse = await makeAuthenticatedRequest("/carts/view/");
      if (!cartResponse.ok) {
        this.updateState({ cartLoading: false, cartProducts: [] });
        return;
      }

      const cartData = await cartResponse.json();
      const cartItems = cartData.items || [];

      const productPromises = cartItems.map(async (item: any) => {
        try {
          const productResponse = await makeAuthenticatedRequest(
            `/products/get_product_detail/${item.product_id}/`
          );
          if (!productResponse.ok) return null;

          const productData = await productResponse.json();
          const product = productData.product;

          return {
            id: product.id,
            name: product.name,
            description: product.description,
            category: product.category,
            product_type: product.type,
            digital_price: product.digital_price,
            physical_price: product.physical_price,
            image: product.image,
            rating: product.rating,
            display_scenes_ids: product.display_scenes_ids,
            model_id: product.model_id,
            quantity: item.quantity,
            cart_item_id: item.id,
          } as CartProduct;
        } catch (error) {
          console.error(`Failed to fetch product ${item.product_id}:`, error);
          return null;
        }
      });

      const products = await Promise.all(productPromises);
      const validProducts = products.filter((p): p is CartProduct => p !== null);

      this.updateState({
        cartProducts: validProducts,
        cartLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch cart items:", error);
      this.updateState({ cartLoading: false, cartProducts: [] });
      this.showNotificationMessage("Failed to load cart items", "error");
    }
  }

  async fetchDigitalHomeScenes(): Promise<SceneEntry[]> {
    try {
      const response = await makeAuthenticatedRequest(
        "/digitalhomes/get_digital_homes/"
      );
      if (!response.ok) return [];

      const data = await response.json();
      const homes: Array<{
        id: number;
        name: string;
        home_id: number;
      }> = data.digital_homes || [];

      return homes.map((home) => ({
        id: `dh-${home.id}`,
        label: home.name,
        type: "digital_home" as const,
        homeId: home.id,
      }));
    } catch (error) {
      console.error("Failed to fetch digital homes for scene catalog:", error);
      return [];
    }
  }

  async switchProduct(product: StoreProduct | CartProduct): Promise<void> {
    if (String(product.id) === this.state.currentProductId) return;

    if (!this.state.currentSceneId) {
      this.showNotificationMessage(
        "Please select a digital home from the Scenes panel to view products.",
        "error"
      );
      return;
    }

    const currentScene = this.sceneEntryMap.get(String(this.state.currentSceneId));
    
    if (currentScene && currentScene.type === "display_scene") {
      const currentSceneId = Number(this.state.currentSceneId);
      const productScenes = product.display_scenes_ids || [];
      
      if (!productScenes.includes(currentSceneId)) {
        this.showNotificationMessage(
          "This product cannot be viewed in the current room. Please switch to your digital home first.",
          "error"
        );
        return;
      }
    }

    const newProductId = String(product.id);
    this.updateState({ 
      loading: true, 
      scenesLoading: true,
      currentProductId: newProductId
    });
    this.state.currentProductId = newProductId;
    
    await this.loadProduct();
    this.showNotificationMessage(`Switched to: ${product.name}`, "info");
  }

  async switchScene(scene: SceneEntry): Promise<void> {
    if (String(scene.id) === String(this.state.currentSceneId)) return;

    this.sceneEntryMap.set(String(scene.id), scene);

    this.updateState({ loading: true, currentSceneId: String(scene.id) });
    this.state.currentSceneId = String(scene.id);

    await this.loadScene();
    this.updateState({ loading: false });
    this.showNotificationMessage(`Switched to: ${scene.label}`, "info");
  }

  handleSidebarSelect(itemId: string): void {
    if (this.state.activePanel === itemId) {
      this.updateState({ activePanel: null });
      return;
    }

    if (itemId === "instructions") {
      this.updateState({ showInstructions: true, activePanel: "instructions" });
    } else if (itemId === "cart") {
      this.fetchCartItems();
      this.updateState({ activePanel: "cart" });
    } else {
      this.updateState({ activePanel: itemId as "products" | "scenes" | null });
    }
  }

  handleExitToStore(): void {
    window.close();
  }

  closePanel(): void {
    this.updateState({ activePanel: null });
  }

  showNotificationMessage(message: string, type: "success" | "error" | "info" = "info"): void {
    this.updateState({
      notificationMessage: message,
      notificationType: type,
      showNotification: true,
    });
  }

  private handleProductMove(delta: THREE.Vector3): void {
    this.sceneManager?.moveProduct(delta);
  }

  private handleProductRotate(deltaY: number): void {
    this.sceneManager?.rotateProduct(deltaY);
    this.updateState({ productRotationY: this.state.productRotationY + deltaY });
  }

  private handleProductScale(delta: number): void {
    const newScale = Math.max(0.1, Math.min(5.0, this.state.productScale + delta));
    this.sceneManager?.scaleProduct(newScale);
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

export function DemoSceneContent({
  productId,
  sceneId,
  productName,
  apiBase,
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
    activePanel: null,
    allProducts: [],
    productsLoading: true,
    currentProductId: productId,
    currentSceneId: sceneId,
    scenes: [],
    scenesLoading: true,
    cartProducts: [],
    cartLoading: false,
  });

  const logicRef = useRef<DemoSceneLogic | null>(null);

  useEffect(() => {
    const updateState = (update: Partial<DemoState>) => {
      setState((prev) => ({ ...prev, ...update }));
    };

    logicRef.current = new DemoSceneLogic(productId, sceneId, productName, updateState);
    logicRef.current.initializeManagers(scene);

    return () => {
      logicRef.current?.cleanup();
    };
  }, [productId, sceneId, productName, scene]);

  useEffect(() => {
    if (!xr.session || !logicRef.current) return;
    logicRef.current.setupXRRig(scene, camera);
  }, [xr.session, scene, camera]);

  useEffect(() => {
    if (!logicRef.current) return;
    const logic = logicRef.current;

    const loadAll = async () => {
      await logic.loadScene();
      await logic.loadProduct();
      await logic.fetchAllProducts();
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

  const showProductsPanel = state.activePanel === "products";
  const showScenesPanel = state.activePanel === "scenes";
  const showCartPanel = state.activePanel === "cart";
  const showInstructionsPanel = state.activePanel === "instructions" && state.showInstructions;

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

      <HeadLockedUI distance={1.6} horizontalOffset={0} verticalOffset={0} enabled={true}>
        <VRSidebar
          show={true}
          activePanel={state.activePanel}
          onItemSelect={(itemId) => logic.handleSidebarSelect(itemId)}
        />
      </HeadLockedUI>

      <HeadLockedUI distance={1.5} horizontalOffset={0.05} verticalOffset={0} enabled={showProductsPanel}>
        <VRProductCatalogPanel
          show={showProductsPanel}
          products={state.allProducts}
          loading={state.productsLoading}
          currentProductId={state.currentProductId}
          currentSceneId={state.currentSceneId}
          currentSceneType={
            state.currentSceneId ? logic.getSceneEntry(String(state.currentSceneId))?.type || null : null
          }
          onSelectProduct={(product) => {
            logic.switchProduct(product);
            logic.closePanel();
          }}
          onClose={() => logic.closePanel()}
        />
      </HeadLockedUI>

      <HeadLockedUI distance={1.5} horizontalOffset={0.05} verticalOffset={0} enabled={showScenesPanel}>
        <VRSceneCatalogPanel
          show={showScenesPanel}
          scenes={state.scenes}
          loading={state.scenesLoading}
          currentSceneId={state.currentSceneId}
          onSelectScene={(scene) => {
            logic.switchScene(scene);
            logic.closePanel();
          }}
          onClose={() => logic.closePanel()}
        />
      </HeadLockedUI>

      <HeadLockedUI distance={1.5} horizontalOffset={0.05} verticalOffset={0} enabled={showCartPanel}>
        <VRCartCatalogPanel
          show={showCartPanel}
          products={state.cartProducts}
          loading={state.cartLoading}
          currentProductId={state.currentProductId}
          currentSceneId={state.currentSceneId}
          currentSceneType={
            state.currentSceneId ? logic.getSceneEntry(String(state.currentSceneId))?.type || null : null
          }
          onSelectProduct={(product) => {
            logic.switchProduct(product);
            logic.closePanel();
          }}
          onClose={() => logic.closePanel()}
        />
      </HeadLockedUI>

      <HeadLockedUI distance={1.6} verticalOffset={0} enabled={showInstructionsPanel}>
        <VRInstructionPanel
          show={showInstructionsPanel}
          onClose={() => logic.updateState({ showInstructions: false, activePanel: null })}
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