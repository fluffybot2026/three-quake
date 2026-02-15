// Network Protocol 2v2 - Message types and serialization for 2v2 gameplay

export const MESSAGE_TYPES = {
  // Connection
  PLAYER_JOIN: 'player_join',
  PLAYER_READY: 'player_ready',
  MATCH_START: 'match_start',
  
  // Input (Client → Server, unreliable, 72 Hz)
  PLAYER_INPUT: 'player_input',
  
  // State (Server → Client, unreliable, 72 Hz)
  ENTITY_UPDATE: 'entity_update',
  
  // Gameplay events (Server → Client, reliable)
  PLAYER_SPAWN: 'player_spawn',
  PLAYER_DEATH: 'player_death',
  WEAPON_PICKUP: 'weapon_pickup',
  KILL_EVENT: 'kill_event',
  MATCH_END: 'match_end',
  
  // Rewind (Server → Client, reliable)
  REWIND_ACTIVATE: 'rewind_activate',
  REWIND_STATE: 'rewind_state',
  
  // Screenwatch (P2P signaling)
  SCREENWATCH_OFFER: 'screenwatch_offer',
  SCREENWATCH_ANSWER: 'screenwatch_answer',
  SCREENWATCH_ICE_CANDIDATE: 'screenwatch_ice_candidate'
};

export function serializePlayerInput(inputState) {
  // Pack input into compact binary format (72 Hz rate)
  const view = new DataView(new ArrayBuffer(12));
  let offset = 0;
  
  // Flags (1 byte)
  let flags = 0;
  if (inputState.forward) flags |= 0x01;
  if (inputState.back) flags |= 0x02;
  if (inputState.left) flags |= 0x04;
  if (inputState.right) flags |= 0x08;
  if (inputState.jump) flags |= 0x10;
  if (inputState.sprint) flags |= 0x20;
  if (inputState.fireWeapon) flags |= 0x40;
  if (inputState.rewindActivate) flags |= 0x80;
  
  view.setUint8(offset++, flags);
  
  // Mouse look: yaw + pitch (float32 each, 4 bytes each)
  view.setFloat32(offset, inputState.yaw, true);
  offset += 4;
  view.setFloat32(offset, inputState.pitch, true);
  offset += 4;
  
  // Timestamp (uint32, 4 bytes)
  view.setUint32(offset, Math.floor(Date.now() % 0xFFFFFFFF), true);
  offset += 4;
  
  return view.buffer;
}

export function deserializePlayerInput(buffer) {
  const view = new DataView(buffer);
  const flags = view.getUint8(0);
  
  return {
    forward: !!(flags & 0x01),
    back: !!(flags & 0x02),
    left: !!(flags & 0x04),
    right: !!(flags & 0x08),
    jump: !!(flags & 0x10),
    sprint: !!(flags & 0x20),
    fireWeapon: !!(flags & 0x40),
    rewindActivate: !!(flags & 0x80),
    yaw: view.getFloat32(1, true),
    pitch: view.getFloat32(5, true),
    timestamp: view.getUint32(9, true)
  };
}

export function serializeEntityUpdate(players, projectiles) {
  // Serialize all entity positions + states for 72 Hz broadcast
  const json = {
    players: players.map(p => ({
      id: p.id,
      pos: { x: p.position.x, y: p.position.y, z: p.position.z },
      vel: { x: p.velocity.x, y: p.velocity.y, z: p.velocity.z },
      rot: { yaw: p.yaw, pitch: p.pitch },
      health: p.health,
      shield: p.shield,
      weapon: p.currentWeapon,
      anim: p.animation
    })),
    projectiles: projectiles.map(proj => ({
      id: proj.id,
      pos: { x: proj.position.x, y: proj.position.y, z: proj.position.z },
      vel: { x: proj.velocity.x, y: proj.velocity.y, z: proj.velocity.z },
      weapon: proj.weapon
    }))
  };
  
  return JSON.stringify(json);
}

export function deserializeEntityUpdate(jsonString) {
  return JSON.parse(jsonString);
}

export function serializeKillEvent(killerId, victimId, weapon) {
  return JSON.stringify({
    killerId,
    victimId,
    weapon,
    timestamp: Date.now()
  });
}

export function serializeRewindActivate(teamId, timestamp) {
  return JSON.stringify({
    teamId,
    timestamp
  });
}
