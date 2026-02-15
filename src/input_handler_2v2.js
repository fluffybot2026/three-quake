// Input Handler 2v2 - Capture keyboard and mouse input for player movement

export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.inputState = {
      forward: false,
      back: false,
      left: false,
      right: false,
      jump: false,
      sprint: false,
      fireWeapon: false,
      rewindActivate: false,
      grenadeThrow: false
    };
    
    this.mouseLook = {
      yaw: 0,
      pitch: 0,
      sensitivity: 0.003
    };
    
    this.setupListeners();
  }

  setupListeners() {
    // Keyboard input
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
    
    // Mouse movement (for camera look)
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('click', () => this.canvas.requestPointerLock?.());
    
    // Mouse button
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
  }

  onKeyDown(e) {
    const key = e.key.toLowerCase();
    
    switch (key) {
      case 'w': this.inputState.forward = true; break;
      case 's': this.inputState.back = true; break;
      case 'a': this.inputState.left = true; break;
      case 'd': this.inputState.right = true; break;
      case ' ': this.inputState.jump = true; e.preventDefault(); break;
      case 'shift': this.inputState.sprint = true; break;
      case 'e': this.inputState.rewindActivate = true; break;
      case 'q': this.inputState.grenadeThrow = true; break;
    }
  }

  onKeyUp(e) {
    const key = e.key.toLowerCase();
    
    switch (key) {
      case 'w': this.inputState.forward = false; break;
      case 's': this.inputState.back = false; break;
      case 'a': this.inputState.left = false; break;
      case 'd': this.inputState.right = false; break;
      case ' ': this.inputState.jump = false; break;
      case 'shift': this.inputState.sprint = false; break;
      case 'e': this.inputState.rewindActivate = false; break;
      case 'q': this.inputState.grenadeThrow = false; break;
    }
  }

  onMouseMove(e) {
    if (document.pointerLockElement === this.canvas) {
      this.mouseLook.yaw -= e.movementX * this.mouseLook.sensitivity;
      this.mouseLook.pitch -= e.movementY * this.mouseLook.sensitivity;
      
      // Clamp pitch to prevent flipping
      this.mouseLook.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.mouseLook.pitch));
    }
  }

  onMouseDown(e) {
    if (e.button === 0) {  // Left click
      this.inputState.fireWeapon = true;
    }
  }

  onMouseUp(e) {
    if (e.button === 0) {
      this.inputState.fireWeapon = false;
    }
  }

  getInputState() {
    return {
      ...this.inputState,
      yaw: this.mouseLook.yaw,
      pitch: this.mouseLook.pitch
    };
  }

  resetFireInput() {
    this.inputState.fireWeapon = false;
  }
}
