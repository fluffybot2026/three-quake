// Screenwatch Signaling - Server-side WebRTC peer introduction for teammates

export interface PeerInfo {
  clientId: string;
  roomId: string;
  teamId: number;
  playerId: number;
  teammatePeerId?: string;
  ws?: any;  // WebSocket connection
}

export class ScreenwatchSignaling {
  private peers: Map<string, PeerInfo> = new Map();
  private roomTeams: Map<string, Map<number, string[]>> = new Map();  // roomId -> teamId -> [playerIds]

  registerPeer(clientId: string, roomId: string, teamId: number, playerId: number, ws: any) {
    const peerInfo: PeerInfo = {
      clientId,
      roomId,
      teamId,
      playerId,
      ws
    };
    
    this.peers.set(clientId, peerInfo);
    
    // Track players by room and team
    if (!this.roomTeams.has(roomId)) {
      this.roomTeams.set(roomId, new Map());
    }
    
    const teams = this.roomTeams.get(roomId)!;
    if (!teams.has(teamId)) {
      teams.set(teamId, []);
    }
    
    teams.get(teamId)!.push(clientId);
  }

  introducePeers(clientIdA: string, clientIdB: string): boolean {
    const peerA = this.peers.get(clientIdA);
    const peerB = this.peers.get(clientIdB);
    
    if (!peerA || !peerB) return false;
    
    // Pair teammates
    peerA.teammatePeerId = clientIdB;
    peerB.teammatePeerId = clientIdA;
    
    // Notify both clients about their teammate
    if (peerA.ws) {
      peerA.ws.send(JSON.stringify({
        type: 'SCREENWATCH_TEAMMATE_READY',
        teammatePeerId: clientIdB,
        teammateName: `Player ${peerB.playerId}`
      }));
    }
    
    if (peerB.ws) {
      peerB.ws.send(JSON.stringify({
        type: 'SCREENWATCH_TEAMMATE_READY',
        teammatePeerId: clientIdA,
        teammateName: `Player ${peerA.playerId}`
      }));
    }
    
    return true;
  }

  forwardOffer(fromClientId: string, toClientId: string, offer: any) {
    const toPeer = this.peers.get(toClientId);
    if (!toPeer || !toPeer.ws) return;
    
    toPeer.ws.send(JSON.stringify({
      type: 'SCREENWATCH_OFFER',
      offer: offer,
      from: fromClientId
    }));
  }

  forwardAnswer(fromClientId: string, toClientId: string, answer: any) {
    const toPeer = this.peers.get(toClientId);
    if (!toPeer || !toPeer.ws) return;
    
    toPeer.ws.send(JSON.stringify({
      type: 'SCREENWATCH_ANSWER',
      answer: answer,
      from: fromClientId
    }));
  }

  forwardICECandidate(fromClientId: string, toClientId: string, candidate: any) {
    const toPeer = this.peers.get(toClientId);
    if (!toPeer || !toPeer.ws) return;
    
    toPeer.ws.send(JSON.stringify({
      type: 'SCREENWATCH_ICE_CANDIDATE',
      candidate: candidate,
      from: fromClientId
    }));
  }

  forwardScreenshot(fromClientId: string, toClientId: string, jpegData: string) {
    const toPeer = this.peers.get(toClientId);
    if (!toPeer || !toPeer.ws) return;
    
    toPeer.ws.send(JSON.stringify({
      type: 'SCREENWATCH_SCREENSHOT',
      data: jpegData,
      from: fromClientId
    }));
  }

  removePeer(clientId: string) {
    const peer = this.peers.get(clientId);
    if (!peer) return;
    
    // Remove from room tracking
    const teams = this.roomTeams.get(peer.roomId);
    if (teams) {
      const players = teams.get(peer.teamId);
      if (players) {
        const idx = players.indexOf(clientId);
        if (idx >= 0) players.splice(idx, 1);
      }
    }
    
    this.peers.delete(clientId);
  }
  
  getTeammateId(clientId: string): string | undefined {
    return this.peers.get(clientId)?.teammatePeerId;
  }
}
