import * as THREE from 'three';
import { XRControllerBase, ControllerConfig } from './XRControllerBase';

// NavigationController.ts - Handles VR navigation
export class NavigationController extends XRControllerBase {
  private rig: THREE.Group | null = null;
  private isNavigating: boolean = false;
  private onNavigationModeChange?: (isActive: boolean) => void;

  constructor(
    config: ControllerConfig = {},
    onNavigationModeChange?: (isActive: boolean) => void
  ) {
    super(config);
    this.onNavigationModeChange = onNavigationModeChange;
  }

  setRig(rig: THREE.Group): void {
    this.rig = rig;
  }

  getRig(): THREE.Group | null {
    return this.rig;
  }

  isNavigationActive(): boolean {
    return this.isNavigating;
  }

  update(
    session: any,
    camera: THREE.Camera,
    delta: number
  ): void {
    if (!this.config.enabled || !this.rig || !session || !session.inputSources) return;

    let isGripPressed = false;
    let moveX = 0;
    let moveZ = 0;
    let rotateInput = 0;

    // Check all input sources
    session.inputSources.forEach((source: any) => {
      const gamepad = source.gamepad;
      if (!gamepad) return;

      const gripButton = gamepad.buttons[1];
      const squeezeButton = gamepad.buttons[2];
      
      if ((gripButton && gripButton.pressed) || (squeezeButton && squeezeButton.pressed)) {
        isGripPressed = true;

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
      }
    });

    // Update navigation state
    if (isGripPressed !== this.isNavigating) {
      this.isNavigating = isGripPressed;
      this.onNavigationModeChange?.(this.isNavigating);
    }

    if (!isGripPressed) return;

    // Apply rotation
    if (Math.abs(rotateInput) > 0) {
      const rotationDelta = rotateInput * this.config.rotateSpeed * delta;
      this.rig.rotateY(rotationDelta);
    }

    // Apply movement
    if (Math.abs(moveX) > 0 || Math.abs(moveZ) > 0) {
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, camera.up).normalize();

      const movement = new THREE.Vector3();
      movement.addScaledVector(forward, -moveZ * this.config.moveSpeed * delta);
      movement.addScaledVector(right, moveX * this.config.moveSpeed * delta);

      this.rig.position.add(movement);
    }
  }

  reset(): void {
    this.isNavigating = false;
    this.prevButtonState.clear();
  }
}