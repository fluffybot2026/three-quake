// Player Renderer - 3D model rendering for players

import { Vector3, BoxGeometry, ConeGeometry, Mesh, MeshStandardMaterial, Group } from 'three';

export class PlayerRenderer {
  constructor(scene) {
    this.scene = scene;
    this.playerMeshes = new Map();  // playerId -> Group
    this.materials = {
      blue: new MeshStandardMaterial({ color: 0x0088ff, metalness: 0.3, roughness: 0.6 }),
      red: new MeshStandardMaterial({ color: 0xff0000, metalness: 0.3, roughness: 0.6 }),
      green: new MeshStandardMaterial({ color: 0x00ff00, metalness: 0.3, roughness: 0.6 })
    };
  }

  createPlayerModel(playerId, teamId) {
    // Create a simple player model (capsule shape)
    const group = new Group();
    group.name = `player_${playerId}`;

    const teamColor = teamId === 0 ? 'blue' : 'red';
    const material = this.materials[teamColor];

    // Body (cylinder)
    const bodyGeom = new BoxGeometry(0.6, 1.4, 0.6);
    const body = new Mesh(bodyGeom, material);
    body.position.y = 0.7;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head (sphere)
    const headGeom = new BoxGeometry(0.5, 0.5, 0.5);
    const head = new Mesh(headGeom, material);
    head.position.y = 1.7;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // Indicator (cone pointing in look direction)
    const indicatorGeom = new ConeGeometry(0.2, 0.4, 8);
    const indicator = new Mesh(indicatorGeom, material);
    indicator.position.y = 1.7;
    indicator.position.z = 0.4;
    indicator.castShadow = true;
    group.add(indicator);

    group.position.y = 0;
    group.castShadow = true;

    this.scene.add(group);
    this.playerMeshes.set(playerId, group);

    return group;
  }

  updatePlayerPosition(playerId, position, rotation) {
    const mesh = this.playerMeshes.get(playerId);
    if (!mesh) return;

    mesh.position.set(position.x, position.y, position.z);
    
    // Rotate to face look direction
    if (rotation) {
      mesh.rotation.order = 'YXZ';
      mesh.rotation.y = rotation.yaw;
      mesh.rotation.x = rotation.pitch;
    }
  }

  removePlayer(playerId) {
    const mesh = this.playerMeshes.get(playerId);
    if (mesh) {
      this.scene.remove(mesh);
      this.playerMeshes.delete(playerId);
    }
  }

  getPlayerMesh(playerId) {
    return this.playerMeshes.get(playerId);
  }
}
