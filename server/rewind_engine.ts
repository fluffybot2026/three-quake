// Rewind Engine - Server-side game state snapshots and rollback

interface GameStateSnapshot {
  timestamp: number;
  playerStates: Array<{
    id: string;
    position: [number, number, number];
    velocity: [number, number, number];
    health: number;
    shield: number;
    weapon: string;
    animation: string;
  }>;
  projectiles: Array<{
    id: string;
    position: [number, number, number];
    velocity: [number, number, number];
    weapon: string;
    age: number;
  }>;
  pickups: Array<{
    id: string;
    position: [number, number, number];
    type: string;
    respawnTime: number;
  }>;
  worldState: {
    time: number;
    weaponSpawns: Record<string, number>;
  };
}

export class RewindEngine {
  private snapshots: GameStateSnapshot[] = [];
  private maxSnapshots = 144;  // 144 snapshots × 0.5s = 72 seconds
  private currentTime = 0;
  private snapshotInterval = 0.5;  // seconds
  private lastSnapshotTime = 0;
  private rewindWindow = 30;  // Can rewind up to 30 seconds

  captureSnapshot(gameState: any, time: number) {
    // Only capture every 0.5 seconds
    if (time - this.lastSnapshotTime < this.snapshotInterval) {
      return;
    }
    
    this.lastSnapshotTime = time;
    this.currentTime = time;
    
    const snapshot: GameStateSnapshot = {
      timestamp: time,
      playerStates: gameState.players.map((p: any) => ({
        id: p.id,
        position: [p.position.x, p.position.y, p.position.z] as [number, number, number],
        velocity: [p.velocity.x, p.velocity.y, p.velocity.z] as [number, number, number],
        health: p.health,
        shield: p.shield,
        weapon: p.currentWeapon,
        animation: p.animation
      })),
      projectiles: gameState.projectiles.map((proj: any) => ({
        id: proj.id,
        position: [proj.position.x, proj.position.y, proj.position.z] as [number, number, number],
        velocity: [proj.velocity.x, proj.velocity.y, proj.velocity.z] as [number, number, number],
        weapon: proj.weapon,
        age: proj.age
      })),
      pickups: gameState.pickups.map((p: any) => ({
        id: p.id,
        position: [p.position.x, p.position.y, p.position.z] as [number, number, number],
        type: p.type,
        respawnTime: p.respawnTime
      })),
      worldState: {
        time: time,
        weaponSpawns: { ...gameState.weaponSpawns }
      }
    };
    
    // Add to circular buffer
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  rollback(targetTime: number): GameStateSnapshot | null {
    // Find nearest snapshot before targetTime
    for (let i = this.snapshots.length - 1; i >= 0; i--) {
      if (this.snapshots[i].timestamp <= targetTime) {
        return this.snapshots[i];
      }
    }
    
    return null;
  }

  getRewindableTime(): number {
    // Return oldest rewindable time (currentTime - 30s, but not before oldest snapshot)
    if (this.snapshots.length === 0) return this.currentTime;
    
    const oldestSnapshot = this.snapshots[0].timestamp;
    const rewindThreshold = this.currentTime - this.rewindWindow;
    
    return Math.max(oldestSnapshot, rewindThreshold);
  }

  canRewind(teamId: number, rewindCharges: number[], matchTime: number, matchDuration: number): boolean {
    // Can't rewind if: no charges, in final 30s of match
    if (rewindCharges[teamId] <= 0) return false;
    if (matchTime > matchDuration - 30) return false;
    
    return true;
  }

  getSnapshot(index: number): GameStateSnapshot | null {
    if (index < 0 || index >= this.snapshots.length) {
      return null;
    }
    return this.snapshots[index];
  }

  getSnapshotCount(): number {
    return this.snapshots.length;
  }

  clear() {
    this.snapshots = [];
    this.currentTime = 0;
    this.lastSnapshotTime = 0;
  }
}
