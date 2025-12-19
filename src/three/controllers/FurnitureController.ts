import * as THREE from 'three';
import { XRControllerBase, ControllerConfig } from './XRControllerBase';


// FurnitureController.ts - Handles furniture manipulation in VR
export class FurnitureEditController extends XRControllerBase {
  private selectedFurnitureId: string | null = null;
  private onFurnitureMove?: (id: string, delta: THREE.Vector3) => void;
  private onFurnitureRotate?: (id: string, deltaY: number) => void;
  private onFurnitureDeselect?: (id: string) => void;
  private moveCheckInProgress: boolean = false;

  constructor(
    config: ControllerConfig = {},
    callbacks?: {
      onFurnitureMove?: (id: string, delta: THREE.Vector3) => void;
      onFurnitureRotate?: (id: string, deltaY: number) => void;
      onFurnitureDeselect?: (id: string) => void;
    }
  ) {
    super(config);
    this.onFurnitureMove = callbacks?.onFurnitureMove;
    this.onFurnitureRotate = callbacks?.onFurnitureRotate;
    this.onFurnitureDeselect = callbacks?.onFurnitureDeselect;
  }

  setSelectedFurniture(id: string | null): void {
    this.selectedFurnitureId = id;
  }

  getSelectedFurniture(): string | null {
    return this.selectedFurnitureId;
  }

  update(
    session: any,
    camera: THREE.Camera,
    delta: number
  ): void {
    if (!this.config.enabled || !this.selectedFurnitureId || !session || !session.inputSources) return;

    // Check for deselection (grip button)
    let shouldCheckInputs = true;
    session.inputSources.forEach((source: any, index: number) => {
      const gamepad = source.gamepad;
      if (!gamepad || !gamepad.buttons) return;

      const gripButton = gamepad.buttons[1];
      if (this.wasButtonJustPressed(index, 1, gripButton?.pressed || false)) {
        if (this.selectedFurnitureId) {
          this.onFurnitureDeselect?.(this.selectedFurnitureId);
          this.selectedFurnitureId = null;
          shouldCheckInputs = false; // Don't process other inputs this frame
        }
      }
    });

    if (!this.selectedFurnitureId || this.moveCheckInProgress || !shouldCheckInputs) return;

    let moveX = 0;
    let moveZ = 0;
    let rotateInput = 0;

    // Get input from controllers
    session.inputSources.forEach((source: any) => {
      const gamepad = source.gamepad;
      if (!gamepad) return;

      if (source.handedness === "right" && gamepad.axes.length >= 4) {
        const x = this.getAxisValue(source, 2);
        const z = this.getAxisValue(source, 3);
        if (this.isAxisActive(x)) moveX = x;
        if (this.isAxisActive(z)) moveZ = z;
      }

      if (source.handedness === "left" && gamepad.axes.length >= 3) {
        const r = this.getAxisValue(source, 2);
        if (this.isAxisActive(r)) rotateInput = -r;
      }
    });

    // Apply movement
    if (Math.abs(moveX) > 0 || Math.abs(moveZ) > 0) {
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, camera.up).normalize();

      const deltaPosition = new THREE.Vector3();
      deltaPosition.addScaledVector(forward, -moveZ * this.config.moveSpeed * delta);
      deltaPosition.addScaledVector(right, moveX * this.config.moveSpeed * delta);

      // Don't call callback if move check is in progress
      if (!this.moveCheckInProgress) {
        this.onFurnitureMove?.(this.selectedFurnitureId, deltaPosition);
      }
    }

    // Apply rotation
    if (Math.abs(rotateInput) > 0) {
      const deltaRotation = rotateInput * this.config.rotateSpeed * delta;
      this.onFurnitureRotate?.(this.selectedFurnitureId, deltaRotation);
    }
  }

  setMoveCheckInProgress(inProgress: boolean): void {
    this.moveCheckInProgress = inProgress;
  }

  reset(): void {
    this.selectedFurnitureId = null;
    this.moveCheckInProgress = false;
    this.prevButtonState.clear();
  }
}