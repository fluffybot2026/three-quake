// Game Loop 2v2 - Main game loop integration for 2v2 gameplay

import { PlayerController } from './player_controller_2v2.js';
import { InputHandler } from './input_handler_2v2.js';
import { ScreenwatchClient } from './screenwatch_client.js';
import { ScreenwatchUI } from './screenwatch_ui.js';
import { ARENA_MAP, createArenaGeometry } from './map_arena.js';
import { serializePlayerInput, serializeEntityUpdate } from './network_protocol_2v2.js';

export class GameLoop2v2 {
  constructor(renderer, scene, networkHandler) {
    this.renderer = renderer;
    this.scene = scene;
    this.networkHandler = networkHandler;
    
    // Player state
    this.localPlayer = null;
    this.remotePlayers = new Map();
    this.inputHandler = null;
    this.gameTime = 0;
    this.tickRate = 72;  // 72 Hz
    this.deltaTime = 1 / this.tickRate;
    
    // Screenwatch
    this.screenwatch = null;
    this.screenwatchUI = null;
  }

  async initialize(localPlayerId, teamId, teammatePeerId) {
    console.log('Initializing game loop...');
    
    // Create arena geometry
    createArenaGeometry(this.scene);
    
    // Initialize local player
    const spawnSquare = ARENA_MAP.spawnSquares[localPlayerId];
    this.localPlayer = new PlayerController(spawnSquare.position.clone());
    this.localPlayer.id = localPlayerId;
    this.localPlayer.teamId = teamId;
    
    // Create input handler
    this.inputHandler = new InputHandler(this.renderer.domElement);
    
    // Initialize screenwatch
    await this.initializeScreenwatch(teammatePeerId);
    
    console.log('Game loop initialized');
  }

  async initializeScreenwatch(teammatePeerId) {
    const signalingChannel = {
      sendOffer: (offer) => {
        this.networkHandler.sendMessage({
          type: 'SCREENWATCH_OFFER',
          offer: offer,
          to: teammatePeerId
        });
      },
      sendAnswer: (answer) => {
        this.networkHandler.sendMessage({
          type: 'SCREENWATCH_ANSWER',
          answer: answer,
          to: teammatePeerId
        });
      },
      sendICECandidate: (candidate) => {
        this.networkHandler.sendMessage({
          type: 'SCREENWATCH_ICE_CANDIDATE',
          candidate: candidate,
          to: teammatePeerId
        });
      },
      sendScreenshot: (jpegData) => {
        this.networkHandler.sendMessage({
          type: 'SCREENWATCH_SCREENSHOT',
          data: jpegData,
          to: teammatePeerId
        });
      }
    };
    
    // Create screenwatch client
    this.screenwatch = new ScreenwatchClient(
      this.renderer,
      (remoteStream) => this.onRemoteStreamReceived(remoteStream),
      (status) => this.onScreenwatchStatusChange(status)
    );
    
    // Initialize screenwatch
    await this.screenwatch.initialize(teammatePeerId, signalingChannel);
    
    // Create screenwatch UI
    this.screenwatchUI = new ScreenwatchUI(document.body);
  }

  onRemoteStreamReceived(remoteStream) {
    console.log('Remote stream received, creating PiP window');
    this.screenwatchUI.createPiPWindow(remoteStream);
  }

  onScreenwatchStatusChange(status) {
    console.log('Screenwatch status:', status);
    this.screenwatchUI.setConnectionStatus(status);
  }

  update(deltaTime) {
    this.gameTime += deltaTime;
    
    // Get input state
    const inputState = this.inputHandler.getInputState();
    
    // Update local player
    this.localPlayer.update(inputState, deltaTime);
    
    // Send input to server
    this.sendPlayerInput(inputState);
  }

  sendPlayerInput(inputState) {
    const serialized = serializePlayerInput(inputState);
    this.networkHandler.sendUnreliable({
      type: 'PLAYER_INPUT',
      data: serialized,
      timestamp: this.gameTime
    });
  }

  receiveEntityUpdate(updateData) {
    // Deserialize and apply entity updates from server
    const data = JSON.parse(updateData);
    
    // Update remote players
    for (const playerData of data.players) {
      if (playerData.id === this.localPlayer.id) continue;  // Skip local player
      
      if (!this.remotePlayers.has(playerData.id)) {
        const remotePlayer = new PlayerController(
          new THREE.Vector3(playerData.pos.x, playerData.pos.y, playerData.pos.z)
        );
        remotePlayer.id = playerData.id;
        this.remotePlayers.set(playerData.id, remotePlayer);
      }
      
      const remotePlayer = this.remotePlayers.get(playerData.id);
      remotePlayer.setState({
        position: playerData.pos,
        velocity: playerData.vel,
        isGrounded: true,
        stamina: 100
      });
    }
  }

  render() {
    // TODO: Render local player + remote players
    // TODO: Render weapons + projectiles
    // TODO: Update camera to follow local player
  }

  shutdown() {
    if (this.screenwatch) {
      this.screenwatch.disconnect();
    }
    if (this.screenwatchUI) {
      this.screenwatchUI.destroy();
    }
  }
}
