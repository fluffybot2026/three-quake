// Game Server 2v2 - Dedicated server for 2v2 matches

import { RewindEngine } from './rewind_engine.ts';
import { ScreenwatchSignaling } from './screenwatch_signaling.ts';

interface Player {
  id: string;
  teamId: number;
  playerId: number;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  rotation: { yaw: number; pitch: number };
  health: number;
  shield: number;
  currentWeapon: string;
  animation: string;
  isGrounded: boolean;
  sprintStamina: number;
}

export class GameServer2v2 {
  private roomId: string;
  private players: Map<string, Player> = new Map();
  private teams = [
    { id: 0, kills: 0, rewindCharges: 2 },
    { id: 1, kills: 0, rewindCharges: 2 }
  ];
  
  private rewindEngine: RewindEngine;
  private screenwatchSignaling: ScreenwatchSignaling;
  
  private tickRate = 72;
  private deltaTime = 1 / this.tickRate;
  private gameTime = 0;
  private matchDuration = 900;  // 15 minutes max
  private isMatchActive = false;
  
  private rewindCooldown = 0;
  private rewindCooldownMax = 10;

  constructor(roomId: string) {
    this.roomId = roomId;
    this.rewindEngine = new RewindEngine();
    this.screenwatchSignaling = new ScreenwatchSignaling();
  }

  async registerPlayer(clientId: string, teamId: number, playerId: number, ws: any): Promise<void> {
    console.log(`Player ${playerId} (team ${teamId}) registered`);
    
    // Create player state
    const spawnPosition = this.getSpawnPosition(playerId);
    const player: Player = {
      id: clientId,
      teamId,
      playerId,
      position: { x: spawnPosition.x, y: spawnPosition.y, z: spawnPosition.z },
      velocity: { x: 0, y: 0, z: 0 },
      rotation: { yaw: 0, pitch: 0 },
      health: 100,
      shield: 0,
      currentWeapon: 'BATTLE_RIFLE',
      animation: 'idle',
      isGrounded: true,
      sprintStamina: 100
    };
    
    this.players.set(clientId, player);
    
    // Register with screenwatch signaling
    this.screenwatchSignaling.registerPeer(clientId, this.roomId, teamId, playerId, ws);
    
    // If we have all 4 players, introduce teammates
    if (this.players.size === 4) {
      this.introduceTeammates();
      this.startMatch();
    }
  }

  private introduceTeammates(): void {
    const playerIds = Array.from(this.players.keys());
    
    // Pair teammates
    // Team 0: players 0 + 1
    // Team 1: players 2 + 3
    if (playerIds.length >= 4) {
      const team0 = [playerIds[0], playerIds[1]];
      const team1 = [playerIds[2], playerIds[3]];
      
      this.screenwatchSignaling.introducePeers(team0[0], team0[1]);
      this.screenwatchSignaling.introducePeers(team1[0], team1[1]);
    }
  }

  private getSpawnPosition(playerId: number): { x: number; y: number; z: number } {
    const spawns = [
      { x: -30, y: 1, z: -30 },
      { x: 30, y: 1, z: -30 },
      { x: -30, y: 1, z: 30 },
      { x: 30, y: 1, z: 30 }
    ];
    return spawns[playerId] || { x: 0, y: 1, z: 0 };
  }

  startMatch(): void {
    this.isMatchActive = true;
    this.gameTime = 0;
    console.log('Match started!');
    
    // Broadcast to all players
    this.broadcastToAll({
      type: 'MATCH_START',
      gameTime: this.gameTime
    });
  }

  processPlayerInput(clientId: string, inputData: any): void {
    const player = this.players.get(clientId);
    if (!player) return;
    
    // Handle both ArrayBuffer and array formats
    let inputBuffer: Uint8Array;
    if (inputData instanceof ArrayBuffer) {
      inputBuffer = new Uint8Array(inputData);
    } else if (Array.isArray(inputData)) {
      inputBuffer = new Uint8Array(inputData);
    } else {
      return;
    }
    
    // Deserialize input
    const view = new DataView(inputBuffer.buffer, inputBuffer.byteOffset, inputBuffer.length);
    if (view.byteLength < 9) return;
    
    const flags = view.getUint8(0);
    const yaw = view.getFloat32(1, true);
    const pitch = view.getFloat32(5, true);
    
    // Parse input flags
    const forward = !!(flags & 0x01);
    const back = !!(flags & 0x02);
    const left = !!(flags & 0x04);
    const right = !!(flags & 0x08);
    const jump = !!(flags & 0x10);
    const sprint = !!(flags & 0x20);
    const fireWeapon = !!(flags & 0x40);
    const rewindActivate = !!(flags & 0x80);
    
    // Update player rotation
    player.rotation.yaw = yaw;
    player.rotation.pitch = pitch;
    
    // Handle movement
    const moveSpeed = sprint ? 7.0 * 1.3 : 7.0;
    let moveX = 0, moveZ = 0;
    
    if (forward) moveZ -= moveSpeed;
    if (back) moveZ += moveSpeed;
    if (left) moveX -= moveSpeed;
    if (right) moveX += moveSpeed;
    
    player.velocity.x = moveX;
    player.velocity.z = moveZ;
    
    // Handle jump
    if (jump && player.isGrounded) {
      player.velocity.y = 10;
      player.isGrounded = false;
    }
    
    // Handle sprint stamina
    if (sprint && player.sprintStamina > 0) {
      player.sprintStamina -= this.deltaTime * 75;
    } else {
      player.sprintStamina = Math.min(100, player.sprintStamina + this.deltaTime * 50);
    }
    
    // Handle rewind activation
    if (rewindActivate && this.rewindCooldown <= 0) {
      this.activateRewind(player.teamId);
    }
    
    // Handle fire weapon (server-side validation)
    if (fireWeapon) {
      // Could add weapon firing here but client handles it
    }
  }

  recordKill(killerId: string, victimId: string, weapon: string): void {
    const killer = this.players.get(killerId);
    const victim = this.players.get(victimId);
    
    if (!killer || !victim) return;
    
    // Update team kills
    this.teams[killer.teamId].kills++;
    
    // Reset victim health
    victim.health = 100;
    victim.shield = 0;
    
    // Check win condition
    if (this.teams[killer.teamId].kills >= 10) {
      this.endMatch();
    }
    
    console.log(`✅ Kill recorded: Team ${killer.teamId} now has ${this.teams[killer.teamId].kills} kills`);
  }

  activateRewind(teamId: number): void {
    const team = this.teams[teamId];
    
    if (team.rewindCharges <= 0) return;
    if (this.rewindCooldown > 0) return;
    if (this.gameTime > this.matchDuration - 30) return;  // Can't rewind final 30s
    
    team.rewindCharges--;
    this.rewindCooldown = this.rewindCooldownMax;
    
    console.log(`Team ${teamId} activated rewind! Charges left: ${team.rewindCharges}`);
    
    // Restore game state from 30 seconds ago
    const targetTime = this.gameTime - 30;
    const restoredState = this.rewindEngine.rollback(targetTime);
    
    if (restoredState) {
      // Apply restored state to all players
      this.applyGameState(restoredState);
    }
    
    // Broadcast rewind event
    this.broadcastToAll({
      type: 'REWIND_ACTIVATED',
      teamId,
      gameTime: this.gameTime
    });
  }

  private applyGameState(state: any): void {
    // TODO: Apply snapshots from rewind engine to current game state
  }

  update(): void {
    if (!this.isMatchActive) return;
    
    // Tick game time
    this.gameTime += this.deltaTime;
    
    // Capture snapshot every 0.5 seconds
    const gameState = {
      players: Array.from(this.players.values()),
      projectiles: [],
      pickups: [],
      weaponSpawns: {}
    };
    this.rewindEngine.captureSnapshot(gameState, this.gameTime);
    
    // Update rewind cooldown
    if (this.rewindCooldown > 0) {
      this.rewindCooldown -= this.deltaTime;
    }
    
    // Apply gravity to players
    for (const player of this.players.values()) {
      player.velocity.y -= 20 * this.deltaTime;
      
      // Update position
      player.position.x += player.velocity.x * this.deltaTime;
      player.position.y += player.velocity.y * this.deltaTime;
      player.position.z += player.velocity.z * this.deltaTime;
      
      // Ground check
      if (player.position.y <= 0) {
        player.position.y = 0;
        player.velocity.y = 0;
        player.isGrounded = true;
      }
    }
    
    // Check match end condition
    if (this.teams[0].kills >= 10 || this.teams[1].kills >= 10 || this.gameTime >= this.matchDuration) {
      this.endMatch();
    }
  }

  private endMatch(): void {
    this.isMatchActive = false;
    const winner = this.teams[0].kills >= 10 ? 0 : (this.teams[1].kills >= 10 ? 1 : -1);
    
    console.log(`Match ended! Winner: Team ${winner}`);
    
    this.broadcastToAll({
      type: 'MATCH_END',
      winner,
      finalStats: {
        team0Kills: this.teams[0].kills,
        team1Kills: this.teams[1].kills
      }
    });
  }

  broadcastToAll(message: any): void {
    // TODO: Send message to all players in room
    console.log('Broadcasting:', message);
  }

  broadcastState(): void {
    const state = {
      type: 'ENTITY_UPDATE',
      gameTime: this.gameTime,
      players: Array.from(this.players.values()),
      teams: this.teams.map(t => ({
        id: t.id,
        kills: t.kills,
        rewindCharges: t.rewindCharges
      }))
    };
    
    this.broadcastToAll(state);
  }

  shutdown(): void {
    this.rewindEngine.clear();
    this.players.clear();
    console.log('Game server shut down');
  }
}
