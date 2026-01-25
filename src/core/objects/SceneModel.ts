import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class SceneModel {
  protected id: string;
  protected name: string;
  protected modelId: number;
  protected modelPath: string | null;
  protected group: THREE.Group;
  protected modelGroup: THREE.Group;
  protected loader: GLTFLoader;

  constructor(
    id: string,
    name: string,
    modelId: number,
    modelPath: string | null
  ) {
    this.id = id;
    this.name = name;
    this.modelId = modelId;
    this.modelPath = modelPath;
    
    this.group = new THREE.Group();
    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);
    
    this.loader = new GLTFLoader();
  }

  getId(): string { return this.id; }
  getName(): string { return this.name; }
  getModelId(): number { return this.modelId; }
  getModelPath(): string | null { return this.modelPath; }
  getGroup(): THREE.Group { return this.group; }
  getModelGroup(): THREE.Group { return this.modelGroup; }

  async loadModel(scene: THREE.Scene): Promise<void> {
    if (!this.modelPath) {
      return;
    }

    try {
      const gltf = await new Promise<any>((resolve, reject) => {
        this.loader.load(
          this.modelPath!,
          (gltf) => resolve(gltf),
          undefined,
          reject
        );
      });

      const clonedModel = gltf.scene.clone();
      this.modelGroup.clear();
      
      // Align to floor
      const box = new THREE.Box3().setFromObject(clonedModel);
      const minY = box.min.y;
      clonedModel.position.y = -minY;
      
      this.modelGroup.add(clonedModel);
    } catch (error) {
      console.error(`Failed to load scene for ${this.name}:`, error);
    }
  }

  dispose(): void {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
    
    this.group.clear();
  }
}