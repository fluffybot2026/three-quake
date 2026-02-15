// Weapons 2v2 - Weapon definitions and hit detection

export const WEAPONS = {
  BATTLE_RIFLE: {
    name: 'Battle Rifle',
    ammo: Infinity,
    fireRate: 0.1,
    damage: 20,
    hitType: 'hitscan',
    range: 300
  },
  ROCKET_LAUNCHER: {
    name: 'Rocket Launcher',
    ammo: 10,
    fireRate: 0.5,
    damage: 100,
    hitType: 'projectile',
    splash: 150
  },
  SNIPER_RIFLE: {
    name: 'Sniper Rifle',
    ammo: 12,
    fireRate: 1.0,
    damage: 150,
    hitType: 'hitscan',
    range: 500
  },
  ASSAULT_RIFLE: {
    name: 'Assault Rifle',
    ammo: 60,
    fireRate: 0.1,
    damage: 15,
    hitType: 'hitscan',
    range: 200
  },
  GRENADES: {
    name: 'Grenades',
    ammo: 8,
    fireRate: 0.3,
    damage: 80,
    hitType: 'projectile',
    splash: 100
  }
};

export class HitDetection {
  raycast(origin, direction, range, excludeId) {
    // TODO: Three.js raycaster to find hit player
  }

  projectileCollision(projectile, positions) {
    // TODO: Check if projectile hits any player
  }

  calculateDamage(weapon, distance) {
    // TODO: Apply damage falloff if applicable
  }
}
