import * as THREE from 'three';
import { ProductModel } from '../objects/ProductModel';
import { SceneModel } from '../objects/SceneModel';

export class DemoSceneManager {
  protected scene: THREE.Scene;
  protected sceneModel: SceneModel | null = null;
  protected product: ProductModel | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  async setSceneModel(sceneModel: SceneModel): Promise<void> {
    if (this.sceneModel) {
      this.scene.remove(this.sceneModel.getGroup());
      this.sceneModel.dispose();
    }

    this.sceneModel = sceneModel;
    this.scene.add(sceneModel.getGroup());
    
    await sceneModel.loadModel(this.scene);
  }

  getSceneModel(): SceneModel | null {
    return this.sceneModel;
  }

  async setProduct(product: ProductModel): Promise<void> {
    if (this.product) {
      this.scene.remove(this.product.getGroup());
      this.product.dispose();
    }

    this.product = product;
    this.scene.add(product.getGroup());
    
    await product.loadModel(this.scene);
  }

  getProduct(): ProductModel | null {
    return this.product;
  }

  moveProduct(delta: THREE.Vector3): void {
    if (!this.product) return;
    
    const currentPos = this.product.getPosition();
    const newPos: [number, number, number] = [
      currentPos[0] + delta.x,
      currentPos[1] + delta.y,
      currentPos[2] + delta.z,
    ];
    
    this.product.setPosition(newPos);
  }

  rotateProduct(deltaY: number): void {
    if (!this.product) return;
    
    const currentRot = this.product.getRotation();
    const newRot: [number, number, number] = [
      currentRot[0],
      currentRot[1] + deltaY,
      currentRot[2],
    ];
    
    this.product.setRotation(newRot);
  }

  scaleProduct(scale: number): void {
    if (!this.product) return;
    this.product.setScale(scale);
  }

  dispose(): void {
    if (this.product) {
      this.scene.remove(this.product.getGroup());
      this.product.dispose();
      this.product = null;
    }
    
    if (this.sceneModel) {
      this.scene.remove(this.sceneModel.getGroup());
      this.sceneModel.dispose();
      this.sceneModel = null;
    }
  }
}