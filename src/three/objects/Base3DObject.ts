// Base3DObject.ts - Base class for all 3D objects in the scene
import * as THREE from 'three';

export interface Transform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number | [number, number, number];
}

export abstract class Base3DObject {
  protected id: string;
  protected name: string;
  protected modelId: number;
  protected modelPath: string | null;
  protected transform: Transform;
  protected group: THREE.Group;
  protected modelGroup: THREE.Group;

  constructor(
    id: string,
    name: string,
    modelId: number,
    modelPath: string | null,
    initialTransform: Partial<Transform> = {}
  ) {
    this.id = id;
    this.name = name;
    this.modelId = modelId;
    this.modelPath = modelPath;
    
    this.transform = {
      position: initialTransform.position || [0, 0, 0],
      rotation: initialTransform.rotation || [0, 0, 0],
      scale: initialTransform.scale || 1,
    };

    this.group = new THREE.Group();
    this.modelGroup = new THREE.Group();
    this.group.add(this.modelGroup);
    
    this.updateTransform();
  }

  // Getters
  getId(): string { return this.id; }
  getName(): string { return this.name; }
  getModelId(): number { return this.modelId; }
  getModelPath(): string | null { return this.modelPath; }
  getGroup(): THREE.Group { return this.group; }
  getModelGroup(): THREE.Group { return this.modelGroup; }
  
  getPosition(): [number, number, number] {
    return [...this.transform.position] as [number, number, number];
  }
  
  getRotation(): [number, number, number] {
    return [...this.transform.rotation] as [number, number, number];
  }
  
  getScale(): number | [number, number, number] {
    return this.transform.scale;
  }

  // Setters
  setPosition(position: [number, number, number]): void {
    this.transform.position = [...position] as [number, number, number];
    this.updateTransform();
  }

  setRotation(rotation: [number, number, number]): void {
    this.transform.rotation = [...rotation] as [number, number, number];
    this.updateTransform();
  }

  setScale(scale: number | [number, number, number]): void {
    if (typeof scale === 'number') {
      this.transform.scale = scale;
    } else {
      this.transform.scale = [...scale] as [number, number, number];
    }
    this.updateTransform();
  }

  // Update the Three.js group transform from internal transform
  protected updateTransform(): void {
    this.group.position.set(...this.transform.position);
    this.group.rotation.set(...this.transform.rotation);
    
    if (typeof this.transform.scale === 'number') {
      this.group.scale.set(this.transform.scale, this.transform.scale, this.transform.scale);
    } else {
      this.group.scale.set(...this.transform.scale);
    }
    
    // Force Three.js to update the transform matrices
    this.group.updateMatrix();
    this.group.updateMatrixWorld(true);
  }

  // Load and setup the 3D model
  async loadModel(scene: THREE.Scene): Promise<void> {
    if (!this.modelPath) {
      console.warn(`No model path for ${this.name}`);
      return;
    }

    try {
      const model = await this.fetchModel(this.modelPath);
      this.setupModel(model);
      this.onModelLoaded(model);
    } catch (error) {
      console.error(`Failed to load model for ${this.name}:`, error);
      this.onModelLoadError(error);
    }
  }

  // Abstract methods to be implemented by subclasses
  protected abstract fetchModel(path: string): Promise<THREE.Group>;
  protected abstract setupModel(model: THREE.Group): void;
  protected abstract onModelLoaded(model: THREE.Group): void;
  protected abstract onModelLoadError(error: unknown): void;

  // Cleanup
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