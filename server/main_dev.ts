// Development Server - Simple WebSocket server for local 2v2 testing

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { WebSocketServer } from "https://deno.land/x/websockets@v0.1.9/mod.ts";

import { GameServer2v2 } from "./game_server_2v2.ts";

interface ClientConnection {
  id: string;
  ws: any;
  roomId: string;
  teamId: number;
  playerId: number;
}

const clients = new Map<string, ClientConnection>();
const gameServers = new Map<string, GameServer2v2>();

const wss = new WebSocketServer(8000);

console.log("🎮 End of Times Development Server");
console.log("📡 WebSocket listening on ws://localhost:8000");
console.log("🌐 Open http://localhost:8080 in browser (run live-server in root)");

wss.on("connection", async (ws: any) => {
  const clientId = crypto.randomUUID();
  console.log(`✅ Client connected: ${clientId}`);

  ws.on("message", (msg: string) => {
    try {
      const data = JSON.parse(msg);
      handleMessage(clientId, ws, data);
    } catch (e) {
      console.error("Failed to parse message:", e);
    }
  });

  ws.on("close", () => {
    console.log(`❌ Client disconnected: ${clientId}`);
    const client = clients.get(clientId);
    if (client) {
      clients.delete(clientId);
      // TODO: Remove from game server
    }
  });

  ws.on("error", (e: any) => {
    console.error(`⚠️ WebSocket error for ${clientId}:`, e);
  });
});

function handleMessage(clientId: string, ws: any, data: any) {
  const { type } = data;

  switch (type) {
    case "PLAYER_JOIN":
      handlePlayerJoin(clientId, ws, data);
      break;
    case "PLAYER_INPUT":
      handlePlayerInput(clientId, data);
      break;
    case "SCREENWATCH_OFFER":
      handleScreenwatchOffer(clientId, data);
      break;
    case "SCREENWATCH_ANSWER":
      handleScreenwatchAnswer(clientId, data);
      break;
    case "SCREENWATCH_ICE_CANDIDATE":
      handleScreenwatchICE(clientId, data);
      break;
    case "KILL_EVENT":
      handleKillEvent(clientId, data);
      break;
    case "HITSCAN_FIRE":
      handleHitscanFire(clientId, data);
      break;
    case "PROJECTILE_FIRED":
      handleProjectileFired(clientId, data);
      break;
    default:
      console.log(`Unknown message type: ${type}`);
  }
}

function handleKillEvent(clientId: string, data: any) {
  const client = clients.get(clientId);
  if (!client) return;

  const gameServer = gameServers.get(client.roomId);
  if (!gameServer) return;

  // Record kill in game state
  console.log(
    `💀 Kill: ${data.killerId} (Team ${data.killerTeam}) killed ${data.victimId} with ${data.weapon}`
  );

  gameServer.recordKill(data.killerId, data.victimId, data.weapon);

  // Broadcast kill event to all players in room
  const roomClients = Array.from(clients.values()).filter(
    (c) => c.roomId === client.roomId
  );

  const killMessage = JSON.stringify({
    type: "KILL_EVENT",
    killerId: data.killerId,
    victimId: data.victimId,
    weapon: data.weapon,
    timestamp: Date.now()
  });

  for (const roomClient of roomClients) {
    try {
      roomClient.ws.send(killMessage);
    } catch (e) {
      console.error(`Failed to broadcast kill to ${roomClient.id}:`, e);
    }
  }
}

function handleHitscanFire(clientId: string, data: any) {
  const client = clients.get(clientId);
  if (!client) return;

  console.log(
    `🔫 Hitscan: ${data.shooterId} fired ${data.weapon} at ${data.victimId}`
  );
}

function handleProjectileFired(clientId: string, data: any) {
  const client = clients.get(clientId);
  if (!client) return;

  console.log(`🚀 Projectile: ${data.shooterId} fired ${data.weapon}`);
}

function handlePlayerJoin(clientId: string, ws: any, data: any) {
  const { roomId, teamId, playerId } = data;

  console.log(`🎮 Player ${playerId} joining room ${roomId} (team ${teamId})`);

  // Register client
  const client: ClientConnection = {
    id: clientId,
    ws,
    roomId,
    teamId,
    playerId
  };
  clients.set(clientId, client);

  // Get or create game server for this room
  if (!gameServers.has(roomId)) {
    console.log(`📦 Creating game server for room: ${roomId}`);
    const gameServer = new GameServer2v2(roomId);
    gameServers.set(roomId, gameServer);

    // Start game tick loop (72 Hz)
    startGameLoop(roomId, gameServer);
  }

  const gameServer = gameServers.get(roomId)!;

  // Register player with game server
  gameServer.registerPlayer(clientId, teamId, playerId, ws);

  // Send join confirmation
  ws.send(
    JSON.stringify({
      type: "PLAYER_JOIN_CONFIRMED",
      clientId,
      roomId,
      playerId
    })
  );
}

function handlePlayerInput(clientId: string, data: any) {
  const client = clients.get(clientId);
  if (!client) return;

  const gameServer = gameServers.get(client.roomId);
  if (!gameServer) return;

  // Forward input to server (binary buffer)
  gameServer.processPlayerInput(clientId, data.data);
}

function handleScreenwatchOffer(clientId: string, data: any) {
  const client = clients.get(clientId);
  if (!client) return;

  const gameServer = gameServers.get(client.roomId);
  if (!gameServer) return;

  // Forward offer to teammate
  const teammatePeerId = data.to;
  const teammate = Array.from(clients.values()).find(
    (c) => c.id === teammatePeerId && c.roomId === client.roomId
  );

  if (teammate) {
    teammate.ws.send(
      JSON.stringify({
        type: "SCREENWATCH_OFFER",
        offer: data.offer,
        from: clientId
      })
    );
  }
}

function handleScreenwatchAnswer(clientId: string, data: any) {
  const client = clients.get(clientId);
  if (!client) return;

  const teammatePeerId = data.to;
  const teammate = Array.from(clients.values()).find(
    (c) => c.id === teammatePeerId && c.roomId === client.roomId
  );

  if (teammate) {
    teammate.ws.send(
      JSON.stringify({
        type: "SCREENWATCH_ANSWER",
        answer: data.answer,
        from: clientId
      })
    );
  }
}

function handleScreenwatchICE(clientId: string, data: any) {
  const client = clients.get(clientId);
  if (!client) return;

  const teammatePeerId = data.to;
  const teammate = Array.from(clients.values()).find(
    (c) => c.id === teammatePeerId && c.roomId === client.roomId
  );

  if (teammate) {
    teammate.ws.send(
      JSON.stringify({
        type: "SCREENWATCH_ICE_CANDIDATE",
        candidate: data.candidate,
        from: clientId
      })
    );
  }
}

function startGameLoop(roomId: string, gameServer: GameServer2v2) {
  const tickRate = 72;
  const deltaTime = 1 / tickRate;
  let lastTime = Date.now();

  const interval = setInterval(() => {
    const now = Date.now();
    const elapsed = (now - lastTime) / 1000;
    lastTime = now;

    // Update game server
    gameServer.update();

    // Broadcast state to all players in room
    const roomClients = Array.from(clients.values()).filter(
      (c) => c.roomId === roomId
    );

    const stateMessage = JSON.stringify({
      type: "ENTITY_UPDATE",
      gameTime: gameServer.gameTime,
      players: (gameServer as any).players
        ? Array.from((gameServer as any).players.values())
        : [],
      teams: (gameServer as any).teams
    });

    for (const client of roomClients) {
      try {
        client.ws.send(stateMessage);
      } catch (e) {
        console.error(`Failed to send state to ${client.id}:`, e);
      }
    }
  }, Math.floor(1000 / tickRate));
}

console.log("✨ Server ready for connections");
