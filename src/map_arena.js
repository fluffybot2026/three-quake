// Arena Map - Symmetrical 2v2 map geometry and weapon spawns

import { Vector3, BoxGeometry, Mesh, MeshStandardMaterial } from 'three';

export const ARENA_MAP = {
  name: 'Arena',
  spawnSquares: [
    { teamId: 0, position: new Vector3(-30, 0, -30), angle: 0 },
    { teamId: 0, position: new Vector3(30, 0, -30), angle: Math.PI },
    { teamId: 1, position: new Vector3(-30, 0, 30), angle: Math.PI },
    { teamId: 1, position: new Vector3(30, 0, 30), angle: 0 }
  ],
  weaponSpawns: [
    // Mid platform (high ground)
    { weapon: 'ROCKET_LAUNCHER', position: new Vector3(0, 30, 0), timer: 60 },
    // Side passages
    { weapon: 'ASSAULT_RIFLE', position: new Vector3(-40, 10, 0), timer: 30 },
    { weapon: 'ASSAULT_RIFLE', position: new Vector3(40, 10, 0), timer: 30 },
    // Neutral zones
    { weapon: 'GRENADES', position: new Vector3(-20, 5, 0), timer: 10 },
    { weapon: 'GRENADES', position: new Vector3(20, 5, 0), timer: 10 }
  ],
  powerUpSpawns: [
    { type: 'OVERSHIELD', position: new Vector3(0, 10, -20), timer: 30 },
    { type: 'CAMO', position: new Vector3(0, 10, 20), timer: 30 }
  ]
};

export function createArenaGeometry(scene) {
  // TODO: Create collision mesh from Arena geometry
  // TODO: Add visual meshes (placeholder cubes for testing)
  // TODO: Add spawn square markers
  // TODO: Add weapon spawn position markers
}
