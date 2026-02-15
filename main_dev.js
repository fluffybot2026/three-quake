// Development Main - Boot End of Times instead of Quake

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@r128/build/three.module.js';
import { GameLoop2v2 } from './src/game_loop_2v2.js';
import { NetworkClient } from './src/network_client.js';

let gameLoop;
let renderer;
let scene;
let camera;

// Get URL params to determine player/team
const params = new URLSearchParams(window.location.search);
const playerId = parseInt(params.get('playerId')) || 0;
const teamId = parseInt(params.get('teamId')) || (playerId < 2 ? 0 : 1);
const teammatePeerId = params.get('teammatePeerId') || null;
const roomId = params.get('roomId') || 'dev-room';

console.log(`🎮 End of Times Dev Build`);
console.log(`   Player: ${playerId}, Team: ${teamId}, Room: ${roomId}`);
console.log(`   URL: http://localhost:8080?playerId=0&teamId=0&roomId=dev-room`);
console.log(`   Open second tab with different playerId to test 2-player`);

async function main() {
  try {
    // Setup Three.js
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x1a1a2e);
    renderer.shadowMap.enabled = true;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1a1a2e, 200, 500);

    // Camera
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create network client
    const networkClient = new NetworkClient('ws://localhost:8000');

    // Create game loop
    gameLoop = new GameLoop2v2(renderer, scene, networkClient);

    // Determine teammate (same team, other player)
    const myTeammatePeerId = playerId === 0 ? 1 : 0;

    // Initialize game
    await gameLoop.initialize(playerId, teamId, myTeammatePeerId, roomId);

    // Start render loop
    let lastTime = performance.now();

    function animate(currentTime) {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      // Update game
      gameLoop.update(deltaTime);

      // Update camera to follow local player
      const playerPos = gameLoop.localPlayer.position;
      camera.position.x = playerPos.x;
      camera.position.y = playerPos.y + 1.8;
      camera.position.z = playerPos.z;

      // Render
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

    // Handle window resize
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });

    // Show instructions
    showInstructions();
  } catch (error) {
    console.error('Fatal error:', error);
    alert(`Failed to start game:\n${error.message}`);
  }
}

function showInstructions() {
  const div = document.createElement('div');
  div.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0,0,0,0.7);
    color: #0f0;
    padding: 15px;
    font-family: monospace;
    font-size: 12px;
    max-width: 400px;
    z-index: 1000;
  `;
  div.innerHTML = `
    <div style="margin-bottom: 10px; font-weight: bold;">🎮 END OF TIMES DEV</div>
    <div style="margin-bottom: 10px;">
      <b>WASD</b> - Move<br>
      <b>Space</b> - Jump<br>
      <b>Shift</b> - Sprint<br>
      <b>Mouse</b> - Look around (click to lock)
    </div>
    <div style="margin-bottom: 10px;">
      <b>Status:</b> <span id="status">Connecting...</span>
    </div>
    <div style="font-size: 11px;">
      To test 2-player:<br>
      Open new tab:<br>
      <a href="?playerId=1&teamId=1&roomId=dev-room" style="color: #0f0;">
        Player 2 (Team 1)
      </a>
    </div>
  `;
  document.body.appendChild(div);

  // Update status
  setTimeout(() => {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = 'Ready!';
      statusEl.style.color = '#0f0';
    }
  }, 2000);
}

main();
