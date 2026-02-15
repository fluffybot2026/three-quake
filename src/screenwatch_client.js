// Screenwatch Client - WebRTC peer setup and canvas capture for teammate POV

export class ScreenwatchClient {
  constructor(renderer, serverId) {
    this.renderer = renderer;
    this.serverId = serverId;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
  }

  async initialize(teammatePeerId) {
    // TODO: Create WebRTC peer connection
    // TODO: Capture canvas stream from Three.js renderer (72 Hz)
    // TODO: Add video track to peer connection
    // TODO: Wait for remote video track from teammate
  }

  async captureCanvasStream(fps = 72) {
    // TODO: Use renderer.domElement.captureStream(fps)
    // TODO: Return MediaStream object
  }

  async createOffer() {
    // TODO: Create WebRTC offer
    // TODO: Return offer for signaling to server
  }

  async receiveAnswer(answer) {
    // TODO: Set remote description from teammate's answer
    // TODO: Start receiving video track
  }

  onRemoteVideoTrack(videoElement) {
    // TODO: Receive video track from teammate
    // TODO: Set srcObject on video element
    // TODO: Composite into corner of screen
  }

  disconnect() {
    // TODO: Close peer connection
    // TODO: Stop streams
  }
}
