// Gameplay 2v2 - Team-based game rules engine

export class Gameplay2v2 {
  constructor() {
    this.teams = [
      { id: 0, color: 'blue', kills: 0, deaths: 0, players: [], rewindCharges: 2 },
      { id: 1, color: 'red', kills: 0, deaths: 0, players: [], rewindCharges: 2 }
    ];
    this.rewindCooldown = 0;
    this.rewindCooldownMax = 10;
    this.rewindMaxCooldown = 10;
    
    this.matchEndKills = 10;
    this.isMatchOver = false;
    this.matchWinner = null;
    this.matchTime = 0;
    this.matchDuration = 900;  // 15 minutes
    
    this.killFeed = [];  // Recent kills for HUD
    this.maxKillFeedLength = 5;
  }

  recordKill(killerId, killerTeamId, victimId, victimTeamId, weapon) {
    // Only record if not already recorded
    if (!killerId || !victimId) return;
    
    // Update team stats
    this.teams[killerTeamId].kills++;
    this.teams[victimTeamId].deaths++;
    
    // Add to kill feed
    const killEvent = {
      killerId,
      killerTeam: killerTeamId,
      victimId,
      victimTeam: victimTeamId,
      weapon,
      timestamp: this.matchTime
    };
    
    this.killFeed.push(killEvent);
    if (this.killFeed.length > this.maxKillFeedLength) {
      this.killFeed.shift();
    }
    
    console.log(`Kill: ${killerId} (Team ${killerTeamId}) killed ${victimId} (Team ${victimTeamId}) with ${weapon}`);
    
    // Check win condition
    this.checkWinCondition();
    
    return killEvent;
  }

  canActivateRewind(teamId, matchTime) {
    const team = this.teams[teamId];
    
    // Can't rewind if: no charges, in final 30s, cooldown active
    if (team.rewindCharges <= 0) return false;
    if (this.rewindCooldown > 0) return false;
    if (matchTime > this.matchDuration - 30) return false;  // Can't rewind final 30s
    
    return true;
  }

  activateRewind(teamId, matchTime) {
    if (!this.canActivateRewind(teamId, matchTime)) return false;
    
    const team = this.teams[teamId];
    team.rewindCharges--;
    this.rewindCooldown = this.rewindCooldownMax;
    
    console.log(`Team ${teamId} activated rewind! Charges: ${team.rewindCharges}`);
    
    return true;
  }

  checkWinCondition() {
    if (this.isMatchOver) return;
    
    // First to 10 wins
    if (this.teams[0].kills >= this.matchEndKills) {
      this.endMatch(0);
    } else if (this.teams[1].kills >= this.matchEndKills) {
      this.endMatch(1);
    }
  }

  endMatch(winnerTeamId) {
    this.isMatchOver = true;
    this.matchWinner = winnerTeamId;
    console.log(`Match ended! Team ${winnerTeamId} wins!`);
  }

  update(deltaTime) {
    if (this.isMatchOver) return;
    
    this.matchTime += deltaTime;
    
    // Tick rewind cooldown
    if (this.rewindCooldown > 0) {
      this.rewindCooldown -= deltaTime;
    }
    
    // Check time-based match end
    if (this.matchTime >= this.matchDuration) {
      // Whoever has more kills wins (or tie if equal)
      const winner = this.teams[0].kills > this.teams[1].kills ? 0 : 1;
      this.endMatch(winner);
    }
  }

  getTeamStats(teamId) {
    const team = this.teams[teamId];
    return {
      kills: team.kills,
      deaths: team.deaths,
      rewindCharges: team.rewindCharges,
      color: team.color
    };
  }

  getRecentKills() {
    return [...this.killFeed];  // Return copy
  }
}
