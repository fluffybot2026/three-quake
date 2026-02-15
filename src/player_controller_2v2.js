// Player Controller 2v2 - Simplified movement and animation

import { Vector3 } from 'three';

export class PlayerController {
  constructor(position = new Vector3()) {
    this.position = position.clone();
    this.velocity = new Vector3();
    this.acceleration = new Vector3();
    
    this.isGrounded = false;
    this.sprintStamina = 100;
    this.maxSprintStamina = 100;
    
    this.moveSpeed = 7.0;
    this.sprintMultiplier = 1.3;
    this.jumpForce = 10.0;
    this.gravity = -20.0;
    this.staminaRegenRate = 50;  // per second
    this.staminaUseRate = 75;    // per second when sprinting
    
    this.moveInput = new Vector3();
    this.moveDirection = new Vector3();
  }

  update(inputState, deltaTime, collisionCallback) {
    // Apply input
    this.applyInput(inputState, deltaTime);
    
    // Apply gravity
    this.applyGravity(deltaTime);
    
    // Apply movement
    this.moveDirection.copy(this.moveInput).normalize();
    const moveSpeed = inputState.sprint && this.sprintStamina > 0 ? 
      this.moveSpeed * this.sprintMultiplier : 
      this.moveSpeed;
    
    this.velocity.x = this.moveDirection.x * moveSpeed;
    this.velocity.z = this.moveDirection.z * moveSpeed;
    
    // Update position
    this.position.addScaledVector(this.velocity, deltaTime);
    
    // Stamina regen/use
    if (inputState.sprint && this.sprintStamina > 0) {
      this.sprintStamina = Math.max(0, this.sprintStamina - this.staminaUseRate * deltaTime);
    } else {
      this.sprintStamina = Math.min(this.maxSprintStamina, this.sprintStamina + this.staminaRegenRate * deltaTime);
    }
    
    // Jump
    if (inputState.jump && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }
    
    // Basic ground check (Y = 0)
    if (this.position.y <= 0) {
      this.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
    }
  }

  applyInput(inputState, deltaTime) {
    // Build movement vector from input
    this.moveInput.set(0, 0, 0);
    
    if (inputState.forward) this.moveInput.z -= 1;
    if (inputState.back) this.moveInput.z += 1;
    if (inputState.left) this.moveInput.x -= 1;
    if (inputState.right) this.moveInput.x += 1;
  }

  applyGravity(deltaTime) {
    if (!this.isGrounded) {
      this.velocity.y += this.gravity * deltaTime;
    }
  }

  getState() {
    // Return position, velocity for network sync
    return {
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      velocity: { x: this.velocity.x, y: this.velocity.y, z: this.velocity.z },
      isGrounded: this.isGrounded,
      stamina: this.sprintStamina
    };
  }

  setState(state) {
    // Receive position, velocity from server (interpolation will smooth this)
    this.position.set(state.position.x, state.position.y, state.position.z);
    this.velocity.set(state.velocity.x, state.velocity.y, state.velocity.z);
    this.isGrounded = state.isGrounded;
    this.sprintStamina = state.stamina;
  }
}
