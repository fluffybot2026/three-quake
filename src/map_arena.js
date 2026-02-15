// Arena Map - Symmetrical 2v2 map geometry and weapon spawns

import { Vector3, BoxGeometry, PlaneGeometry, Mesh, MeshStandardMaterial, Color } from 'three';

export const ARENA_MAP = {
  name: 'Arena',
  bounds: {
    min: new Vector3(-100, 0, -100),
    max: new Vector3(100, 50, 100)
  },
  spawnSquares: [
    { playerId: 0, teamId: 0, position: new Vector3(-30, 1, -30), angle: 0 },
    { playerId: 1, teamId: 0, position: new Vector3(30, 1, -30), angle: Math.PI },
    { playerId: 2, teamId: 1, position: new Vector3(-30, 1, 30), angle: Math.PI },
    { playerId: 3, teamId: 1, position: new Vector3(30, 1, 30), angle: 0 }
  ],
  weaponSpawns: [
    // Mid platform (high ground) - Rocket
    { weapon: 'ROCKET_LAUNCHER', position: new Vector3(0, 32, 0), respawnTimer: 60, active: true },
    // Side passages - Assault Rifles
    { weapon: 'ASSAULT_RIFLE', position: new Vector3(-40, 12, 0), respawnTimer: 30, active: true },
    { weapon: 'ASSAULT_RIFLE', position: new Vector3(40, 12, 0), respawnTimer: 30, active: true },
    // Neutral zones - Grenades
    { weapon: 'GRENADES', position: new Vector3(-20, 2, 0), respawnTimer: 10, active: true },
    { weapon: 'GRENADES', position: new Vector3(20, 2, 0), respawnTimer: 10, active: true }
  ],
  powerUpSpawns: [
    { type: 'OVERSHIELD', position: new Vector3(0, 12, -20), respawnTimer: 30, active: true },
    { type: 'CAMO', position: new Vector3(0, 12, 20), respawnTimer: 30, active: true }
  ],
  geometry: {
    // Floor
    floor: { position: new Vector3(0, -1, 0), size: new Vector3(200, 1, 200) },
    // Mid platform (high ground)
    midPlatform: { position: new Vector3(0, 30, 0), size: new Vector3(20, 2, 20) },
    // Side balconies
    leftBalcony: { position: new Vector3(-35, 12, 0), size: new Vector3(15, 2, 40) },
    rightBalcony: { position: new Vector3(35, 12, 0), size: new Vector3(15, 2, 40) },
    // Low passages
    lowLeft: { position: new Vector3(-50, 5, 0), size: new Vector3(20, 10, 50) },
    lowRight: { position: new Vector3(50, 5, 0), size: new Vector3(20, 10, 50) }
  }
};

export function createArenaGeometry(scene) {
  const materials = {
    floor: new MeshStandardMaterial({ color: 0x333333 }),
    platform: new MeshStandardMaterial({ color: 0x444444 }),
    balcony: new MeshStandardMaterial({ color: 0x555555 })
  };

  // Floor
  const floorGeom = new BoxGeometry(200, 1, 200);
  const floor = new Mesh(floorGeom, materials.floor);
  floor.position.y = -1;
  scene.add(floor);

  // Mid platform
  const midGeom = new BoxGeometry(20, 2, 20);
  const mid = new Mesh(midGeom, materials.platform);
  mid.position.set(0, 30, 0);
  scene.add(mid);

  // Side balconies
  const balconyGeom = new BoxGeometry(15, 2, 40);
  const left = new Mesh(balconyGeom, materials.balcony);
  left.position.set(-35, 12, 0);
  scene.add(left);

  const right = new Mesh(balconyGeom, materials.balcony);
  right.position.set(35, 12, 0);
  scene.add(right);

  // Low passages (walls for navigation)
  const passageGeom = new BoxGeometry(20, 10, 50);
  const leftPass = new Mesh(passageGeom, materials.balcony);
  leftPass.position.set(-50, 5, 0);
  scene.add(leftPass);

  const rightPass = new Mesh(passageGeom, materials.balcony);
  rightPass.position.set(50, 5, 0);
  scene.add(rightPass);

  return { floor, mid, left, right, leftPass, rightPass };
}

export function getCollisionGeometry() {
  // Return array of bounding boxes for collision detection
  return [
    // Floor (broad)
    { position: new Vector3(0, -1, 0), size: new Vector3(200, 1, 200) },
    // Mid platform
    { position: new Vector3(0, 30, 0), size: new Vector3(20, 2, 20) },
    // Balconies
    { position: new Vector3(-35, 12, 0), size: new Vector3(15, 2, 40) },
    { position: new Vector3(35, 12, 0), size: new Vector3(15, 2, 40) },
    // Low passages
    { position: new Vector3(-50, 5, 0), size: new Vector3(20, 10, 50) },
    { position: new Vector3(50, 5, 0), size: new Vector3(20, 10, 50) }
  ];
}
