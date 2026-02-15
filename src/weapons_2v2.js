// Weapons 2v2 - Weapon definitions and hit detection

import { Raycaster, Vector3 } from 'three';

export const WEAPONS = {
  BATTLE_RIFLE: {
    name: 'Battle Rifle',
    ammo: Infinity,
    maxAmmo: Infinity,
    fireRate: 0.1,
    damage: 20,
    hitType: 'hitscan',
    range: 300,
    accuracy: 0.95,
    knockback: 5
  },
  ROCKET_LAUNCHER: {
    name: 'Rocket Launcher',
    ammo: 10,
    maxAmmo: 10,
    fireRate: 0.5,
    damage: 100,
    hitType: 'projectile',
    range: 500,
    splash: 150,
    splashRadius: 20,
    knockback: 50
  },
  SNIPER_RIFLE: {
    name: 'Sniper Rifle',
    ammo: 12,
    maxAmmo: 12,
    fireRate: 1.0,
    damage: 150,
    hitType: 'hitscan',
    range: 500,
    accuracy: 1.0,
    knockback: 10
  },
  ASSAULT_RIFLE: {
    name: 'Assault Rifle',
    ammo: 60,
    maxAmmo: 60,
    fireRate: 0.1,
    damage: 15,
    hitType: 'hitscan',
    range: 200,
    accuracy: 0.85,
    knockback: 3
  },
  GRENADES: {
    name: 'Grenades',
    ammo: 8,
    maxAmmo: 8,
    fireRate: 0.3,
    damage: 80,
    hitType: 'projectile',
    range: 150,
    splash: 100,
    splashRadius: 25,
    knockback: 30
  }
};

export class HitDetection {
  constructor(scene) {
    this.scene = scene;
    this.raycaster = new Raycaster();
  }

  raycast(origin, direction, range, excludeId, players) {
    // Use Three.js raycaster to find hit player
    this.raycaster.set(origin, direction.normalize());
    
    // Create bounding spheres for players (hitboxes)
    const objects = players
      .filter(p => p.id !== excludeId)
      .map(p => {
        // Create invisible sphere as hitbox
        const sphere = new THREE.Sphere(p.position, 1.0);  // 1m radius hitbox
        return { player: p, sphere };
      });
    
    // Check which players are hit
    for (const { player, sphere } of objects) {
      if (this.raycaster.ray.distanceToPoint(sphere.center) <= sphere.radius) {
        const distance = origin.distanceTo(player.position);
        if (distance <= range) {
          return { hit: true, player, distance };
        }
      }
    }
    
    return { hit: false };
  }

  projectileCollision(projectile, players) {
    // Check if projectile hits any player (sphere collision)
    const projectilePos = new Vector3(
      projectile.position.x,
      projectile.position.y,
      projectile.position.z
    );
    
    for (const player of players) {
      const playerPos = new Vector3(
        player.position.x,
        player.position.y,
        player.position.z
      );
      
      const distance = projectilePos.distanceTo(playerPos);
      if (distance <= 1.0) {  // 1m collision radius
        return { hit: true, player };
      }
    }
    
    return { hit: false };
  }

  splashDamage(impactPos, splashRadius, damage, players, excludeId) {
    // Calculate splash damage for all players in radius
    const affectedPlayers = [];
    
    for (const player of players) {
      if (player.id === excludeId) continue;
      
      const playerPos = new Vector3(
        player.position.x,
        player.position.y,
        player.position.z
      );
      
      const distance = impactPos.distanceTo(playerPos);
      if (distance <= splashRadius) {
        // Damage falloff based on distance
        const damageModifier = 1.0 - (distance / splashRadius);
        affectedPlayers.push({
          player,
          damage: Math.floor(damage * damageModifier)
        });
      }
    }
    
    return affectedPlayers;
  }

  calculateDamage(weapon, distance) {
    // Apply damage falloff for long-range hitscan weapons
    const weaponDef = WEAPONS[weapon];
    if (!weaponDef) return 0;
    
    let damage = weaponDef.damage;
    
    // Simple linear falloff after 50% of range
    if (distance > weaponDef.range * 0.5) {
      const falloffStart = weaponDef.range * 0.5;
      const falloff = (distance - falloffStart) / (weaponDef.range * 0.5);
      damage *= Math.max(0.5, 1.0 - falloff);  // Min 50% damage
    }
    
    return Math.floor(damage);
  }
}

export class Projectile {
  constructor(id, position, velocity, weapon, playerId) {
    this.id = id;
    this.position = { x: position.x, y: position.y, z: position.z };
    this.velocity = { x: velocity.x, y: velocity.y, z: velocity.z };
    this.weapon = weapon;
    this.playerId = playerId;
    this.age = 0;
    this.maxAge = 30;  // 30 seconds max lifetime
    this.gravity = weapon === 'GRENADES' ? 20 : 0;  // Grenades fall, rockets don't
  }

  update(deltaTime) {
    // Apply physics
    if (this.gravity > 0) {
      this.velocity.y -= this.gravity * deltaTime;
    }
    
    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    // Ground collision
    if (this.position.y <= 0) {
      this.position.y = 0;
      if (this.weapon === 'GRENADES') {
        this.velocity.y *= -0.6;  // Bounce
        this.velocity.x *= 0.8;
        this.velocity.z *= 0.8;
      }
    }
    
    this.age += deltaTime;
  }

  isAlive() {
    return this.age < this.maxAge && this.position.y >= -10;  // Die if below floor
  }
}
