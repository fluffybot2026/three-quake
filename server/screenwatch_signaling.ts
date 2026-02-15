// Screenwatch Signaling - Server-side WebRTC peer introduction for teammates

export interface PeerInfo {
  clientId: string;
  roomId: string;
  teammatePeerId: string;
}

export class ScreenwatchSignaling {
  private peers: Map<string, PeerInfo> = new Map();

  registerPeer(clientId: string, roomId: string, teammatePeerId: string) {
    // TODO: Store peer info
    this.peers.set(clientId, { clientId, roomId, teammatePeerId });
  }

  introducePeers(clientIdA: string, clientIdB: string): boolean {
    // TODO: Tell both clients about each other
    // TODO: Exchange peer info for WebRTC connection
    // TODO: Return true if successful
    return false;
  }

  forwardOffer(fromClientId: string, toClientId: string, offer: RTCSessionDescriptionInit) {
    // TODO: Forward WebRTC offer from one client to another
  }

  forwardAnswer(fromClientId: string, toClientId: string, answer: RTCSessionDescriptionInit) {
    // TODO: Forward WebRTC answer from one client to another
  }

  forwardICECandidate(fromClientId: string, toClientId: string, candidate: RTCIceCandidate) {
    // TODO: Forward ICE candidate for NAT traversal
  }

  removePeer(clientId: string) {
    // TODO: Clean up peer info when client disconnects
    this.peers.delete(clientId);
  }
}
