// Combat System - Weapon firing, hit detection, kill tracking

import { Vector3, Raycaster } from 'three';
import { WEAPONS, HitDetection, Projectile } from './weapons_2v2.js';

export class CombatSystem {
  constructor(scene, players, networkClient) {
    this.scene = scene;
    this.players = players;
    this.networkClient = networkClient;
    
    this.hitDetection = new HitDetection(scene);
    this.projectiles = [];
    this.projectileId = 0;
    
    this.lastFireTime = 0;
    this.currentWeapon = 'BATTLE_RIFLE';
  }

  setCurrentWeapon(weapon) {
    this.currentWeapon = weapon;
  }

  fireWeapon(shooter, direction, position) {
    const now = Date.now();
    const weaponDef = WEAPONS[this.currentWeapon];
    
    if (!weaponDef) return;
    
    // Check fire rate
    const timeSinceLastFire = (now - this.lastFireTime) / 1000;
    if (timeSinceLastFire < weaponDef.fireRate) {
      return;  // Too soon
    }
    
    this.lastFireTime = now;
    
    // Hitscan weapons
    if (weaponDef.hitType === 'hitscan') {
      this.fireHitscan(shooter, direction, position, weaponDef);
    }
    // Projectile weapons
    else if (weaponDef.hitType === 'projectile') {
      this.fireProjectile(shooter, direction, position, weaponDef);
    }
  }

  fireHitscan(shooter, direction, position, weaponDef) {
    // Raycast check
    const result = this.hitDetection.raycast(
      new Vector3(position.x, position.y, position.z),
      new Vector3(direction.x, direction.y, direction.z),
      weaponDef.range,
      shooter.id,
      Array.from(this.players.values())
    );

    if (result.hit) {
      this.onHit(shooter, result.player, weaponDef);
      
      // Send to server
      if (this.networkClient) {
        this.networkClient.send({
          type: 'HITSCAN_FIRE',
          shooterId: shooter.id,
          victimId: result.player.id,
          weapon: this.currentWeapon,
          position: { x: position.x, y: position.y, z: position.z },
          direction: { x: direction.x, y: direction.y, z: direction.z },
          distance: result.distance
        });
      }
    } else {
      // Just a shot in the void
      if (this.networkClient) {
        this.networkClient.send({
          type: 'HITSCAN_FIRE',
          shooterId: shooter.id,
          victimId: null,
          weapon: this.currentWeapon,
          position: { x: position.x, y: position.y, z: position.z },
          direction: { x: direction.x, y: direction.y, z: direction.z },
          distance: weaponDef.range
        });
      }
    }
  }

  fireProjectile(shooter, direction, position, weaponDef) {
    const projectile = new Projectile(
      `proj_${this.projectileId++}`,
      { x: position.x, y: position.y, z: position.z },
      {
        x: direction.x * 30,  // Projectile speed
        y: direction.y * 30,
        z: direction.z * 30
      },
      this.currentWeapon,
      shooter.id
    );

    this.projectiles.push(projectile);

    // Send to server
    if (this.networkClient) {
      this.networkClient.send({
        type: 'PROJECTILE_FIRED',
        projectileId: projectile.id,
        shooterId: shooter.id,
        weapon: this.currentWeapon,
        position: projectile.position,
        velocity: projectile.velocity
      });
    }
  }

  onHit(shooter, victim, weapon) {
    // Calculate damage
    const distance = Math.sqrt(
      Math.pow(shooter.position.x - victim.position.x, 2) +
      Math.pow(shooter.position.y - victim.position.y, 2) +
      Math.pow(shooter.position.z - victim.position.z, 2)
    );
    
    let damage = weapon.damage;
    
    // Apply falloff for hitscan
    if (weapon.hitType === 'hitscan' && distance > weapon.range * 0.5) {
      const falloff = 1 - (distance - weapon.range * 0.5) / (weapon.range * 0.5);
      damage *= Math.max(0.5, falloff);
    }

    // Apply damage
    victim.health -= damage;
    
    console.log(`💥 Hit! ${shooter.id} → ${victim.id} for ${Math.floor(damage)} damage`);

    // Check death
    if (victim.health <= 0) {
      this.onKill(shooter, victim, weapon);
    }
  }

  onKill(shooter, victim, weapon) {
    console.log(`☠️ Kill! ${shooter.id} killed ${victim.id} with ${weapon.name}`);

    // Send kill to server
    if (this.networkClient) {
      this.networkClient.send({
        type: 'KILL_EVENT',
        killerId: shooter.id,
        killerTeam: shooter.teamId,
        victimId: victim.id,
        victimTeam: victim.teamId,
        weapon: weapon.name,
        timestamp: Date.now()
      });
    }

    // Reset victim
    victim.health = 100;
    victim.shield = 0;
    victim.position = { x: 0, y: 0, z: 0 };  // Respawn (temp)
  }

  updateProjectiles(deltaTime) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(deltaTime);

      if (!proj.isAlive()) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with players
      for (const player of this.players.values()) {
        if (player.id === proj.playerId) continue;  // Skip shooter

        const result = this.hitDetection.projectileCollision(
          proj,
          [player]
        );

        if (result.hit) {
          const shooter = Array.from(this.players.values()).find(p => p.id === proj.playerId);
          if (shooter) {
            const weaponDef = WEAPONS[proj.weapon];
            
            // Direct hit damage
            this.onHit(shooter, player, weaponDef);
            
            // Splash damage to nearby players
            const splashPos = new Vector3(proj.position.x, proj.position.y, proj.position.z);
            const splashDamages = this.hitDetection.splashDamage(
              splashPos,
              weaponDef.splashRadius,
              weaponDef.splash,
              Array.from(this.players.values()),
              proj.playerId
            );

            for (const { player: affectedPlayer, damage } of splashDamages) {
              if (affectedPlayer.id !== player.id) {
                affectedPlayer.health -= damage;
                if (affectedPlayer.health <= 0) {
                  this.onKill(shooter, affectedPlayer, weaponDef);
                }
              }
            }
          }

          this.projectiles.splice(i, 1);
          break;
        }
      }
    }
  }

  clear() {
    this.projectiles = [];
    this.projectileId = 0;
  }
}
