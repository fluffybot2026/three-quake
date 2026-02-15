// Game Loop 2v2 - Main game loop integration for 2v2 gameplay

import { PlayerController } from './player_controller_2v2.js';
import { InputHandler } from './input_handler_2v2.js';
import { ScreenwatchClient } from './screenwatch_client.js';
import { ScreenwatchUI } from './screenwatch_ui.js';
import { ARENA_MAP, createArenaGeometry } from './map_arena.js';
import { serializePlayerInput, serializeEntityUpdate } from './network_protocol_2v2.js';
import { NetworkClient } from './network_client.js';

export class GameLoop2v2 {
  constructor(renderer, scene, networkClient = null) {
    this.renderer = renderer;
    this.scene = scene;
    this.networkClient = networkClient;
    
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

  async initialize(localPlayerId, teamId, teammatePeerId, roomId = 'dev-room') {
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
    
    // Connect to server if network client provided
    if (this.networkClient) {
      await this.connectToServer(roomId, teamId, localPlayerId);
    }
    
    // Initialize screenwatch
    await this.initializeScreenwatch(teammatePeerId);
    
    console.log('Game loop initialized');
  }

  async connectToServer(roomId, teamId, playerId) {
    try {
      await this.networkClient.connect();
      
      // Register with server
      this.networkClient.send({
        type: 'PLAYER_JOIN',
        roomId,
        teamId,
        playerId
      });
      
      // Handle server messages
      this.networkClient.on('PLAYER_JOIN_CONFIRMED', (data) => {
        console.log('✅ Joined server:', data);
      });
      
      this.networkClient.on('ENTITY_UPDATE', (data) => {
        this.receiveEntityUpdate(data);
      });
      
      this.networkClient.on('MATCH_START', (data) => {
        console.log('🎮 Match started!');
      });
      
      this.networkClient.on('SCREENWATCH_OFFER', (data) => {
        this.screenwatch.receiveOffer(data.offer);
      });
      
      this.networkClient.on('SCREENWATCH_ANSWER', (data) => {
        this.screenwatch.receiveAnswer(data.answer);
      });
      
      this.networkClient.on('SCREENWATCH_ICE_CANDIDATE', (data) => {
        this.screenwatch.receiveICECandidate(data.candidate);
      });
    } catch (e) {
      console.error('Failed to connect to server:', e);
    }
  }

  async initializeScreenwatch(teammatePeerId) {
    const signalingChannel = {
      sendOffer: (offer) => {
        if (this.networkClient) {
          this.networkClient.send({
            type: 'SCREENWATCH_OFFER',
            offer: offer,
            to: teammatePeerId
          });
        }
      },
      sendAnswer: (answer) => {
        if (this.networkClient) {
          this.networkClient.send({
            type: 'SCREENWATCH_ANSWER',
            answer: answer,
            to: teammatePeerId
          });
        }
      },
      sendICECandidate: (candidate) => {
        if (this.networkClient) {
          this.networkClient.send({
            type: 'SCREENWATCH_ICE_CANDIDATE',
            candidate: candidate,
            to: teammatePeerId
          });
        }
      },
      sendScreenshot: (jpegData) => {
        if (this.networkClient) {
          this.networkClient.send({
            type: 'SCREENWATCH_SCREENSHOT',
            data: jpegData,
            to: teammatePeerId
          });
        }
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
    if (!this.networkClient) return;
    
    const serialized = serializePlayerInput(inputState);
    this.networkClient.send({
      type: 'PLAYER_INPUT',
      data: Array.from(new Uint8Array(serialized)),
      timestamp: this.gameTime
    });
  }

  receiveEntityUpdate(data) {
    // Update remote players from server state
    if (!data.players) return;
    
    for (const playerData of data.players) {
      if (playerData.id === this.localPlayer.id) continue;  // Skip local player
      
      if (!this.remotePlayers.has(playerData.id)) {
        const remotePlayer = new PlayerController(
          new (require('three')).Vector3(playerData.position.x, playerData.position.y, playerData.position.z)
        );
        remotePlayer.id = playerData.id;
        this.remotePlayers.set(playerData.id, remotePlayer);
      }
      
      const remotePlayer = this.remotePlayers.get(playerData.id);
      remotePlayer.setState({
        position: playerData.position,
        velocity: playerData.velocity,
        isGrounded: playerData.isGrounded,
        stamina: playerData.sprintStamina
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
