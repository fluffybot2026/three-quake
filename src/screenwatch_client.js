// Screenwatch Client - WebRTC peer setup and canvas capture for teammate POV

export class ScreenwatchClient {
  constructor(renderer, onRemoteStream, onStatusChange) {
    this.renderer = renderer;
    this.onRemoteStream = onRemoteStream;
    this.onStatusChange = onStatusChange;
    
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.signalingChannel = null;  // Will be set by parent
    
    this.connectionState = 'disconnected';  // 'connecting', 'connected', 'failed'
    this.iceServers = [
      { urls: ['stun:stun.l.google.com:19302'] },
      { urls: ['stun:stun1.l.google.com:19302'] }
    ];
  }

  async initialize(teammatePeerId, signalingChannel) {
    try {
      this.signalingChannel = signalingChannel;
      this.updateStatus('connecting');
      
      // Create peer connection
      const config = {
        iceServers: this.iceServers
      };
      this.peerConnection = new RTCPeerConnection(config);
      
      // Capture canvas stream from Three.js renderer
      this.localStream = await this.captureCanvasStream(72);
      
      // Add video track to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
      
      // Handle remote video track
      this.peerConnection.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        this.remoteStream = event.streams[0];
        this.onRemoteStream(this.remoteStream);
      };
      
      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', this.peerConnection.connectionState);
        
        if (this.peerConnection.connectionState === 'connected') {
          this.updateStatus('connected');
        } else if (this.peerConnection.connectionState === 'failed') {
          this.updateStatus('failed');
          this.fallbackToScreenshots();
        } else if (this.peerConnection.connectionState === 'disconnected') {
          this.updateStatus('disconnected');
        }
      };
      
      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.signalingChannel.sendICECandidate(event.candidate);
        }
      };
      
      // Create offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      // Send offer to teammate via signaling
      this.signalingChannel.sendOffer(offer);
      
    } catch (error) {
      console.error('Screenwatch initialization failed:', error);
      this.updateStatus('failed');
    }
  }

  async captureCanvasStream(fps = 72) {
    // Capture Three.js canvas as video stream
    const canvas = this.renderer.domElement;
    const stream = canvas.captureStream(fps);
    return stream;
  }

  async receiveAnswer(answer) {
    try {
      const answerDescription = new RTCSessionDescription(answer);
      await this.peerConnection.setRemoteDescription(answerDescription);
    } catch (error) {
      console.error('Failed to set remote description:', error);
      this.updateStatus('failed');
    }
  }

  receiveICECandidate(candidate) {
    try {
      const iceCandidate = new RTCIceCandidate(candidate);
      this.peerConnection.addIceCandidate(iceCandidate);
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  }

  fallbackToScreenshots() {
    // Fallback: send screenshots every 5 seconds if WebRTC fails
    console.warn('WebRTC failed, falling back to screenshot mode');
    setInterval(() => {
      const canvas = this.renderer.domElement;
      const jpegData = canvas.toDataURL('image/jpeg', 0.7);
      this.signalingChannel.sendScreenshot(jpegData);
    }, 5000);
  }

  updateStatus(state) {
    this.connectionState = state;
    this.onStatusChange(state);
  }

  disconnect() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    this.updateStatus('disconnected');
  }
}
