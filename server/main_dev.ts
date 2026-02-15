// Development Server - Simple WebSocket server for local 2v2 testing

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

import { GameServer2v2 } from "./game_server_2v2.ts";

interface ClientConnection {
  id: string;
  socket: WebSocket;
  roomId: string;
  teamId: number;
  playerId: number;
}

const clients = new Map<string, ClientConnection>();
const gameServers = new Map<string, GameServer2v2>();

console.log("🎮 End of Times Development Server");
console.log("📡 WebSocket listening on ws://localhost:8000");

const handler = (req: Request): Response => {
  // Upgrade HTTP to WebSocket
  if (req.headers.get("upgrade") === "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    const clientId = crypto.randomUUID();
    console.log(`✅ Client connected: ${clientId}`);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(clientId, socket, data);
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    };

    socket.onclose = () => {
      console.log(`❌ Client disconnected: ${clientId}`);
      const client = clients.get(clientId);
      if (client) {
        clients.delete(clientId);
      }
    };

    socket.onerror = (e) => {
      console.error(`⚠️ WebSocket error for ${clientId}:`, e);
    };

    return response;
  }

  // Serve index.html for root
  if (req.url.endsWith("/") || req.url === "") {
    return new Response(
      `<!DOCTYPE html>
<html>
<head><title>End of Times</title></head>
<body style="background: #000; color: #0f0; font-family: monospace; padding: 20px;">
  <h1>🎮 End of Times Server Running</h1>
  <p>WebSocket: ws://localhost:8000</p>
  <p>HTTP Server: http://localhost:8080</p>
  <p>Open browser: http://localhost:8080/index_dev.html</p>
</body>
</html>`,
      { headers: { "content-type": "text/html" } }
    );
  }

  return new Response("Not Found", { status: 404 });
};

function handleMessage(clientId: string, socket: WebSocket, data: any) {
  const { type } = data;

  switch (type) {
    case "PLAYER_JOIN":
      handlePlayerJoin(clientId, socket, data);
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

function handlePlayerJoin(clientId: string, socket: WebSocket, data: any) {
  const { roomId, teamId, playerId } = data;

  console.log(`🎮 Player ${playerId} joining room ${roomId} (team ${teamId})`);

  const client: ClientConnection = {
    id: clientId,
    socket,
    roomId,
    teamId,
    playerId
  };
  clients.set(clientId, client);

  if (!gameServers.has(roomId)) {
    console.log(`📦 Creating game server for room: ${roomId}`);
    const gameServer = new GameServer2v2(roomId);
    gameServers.set(roomId, gameServer);
    startGameLoop(roomId, gameServer);
  }

  const gameServer = gameServers.get(roomId)!;
  gameServer.registerPlayer(clientId, teamId, playerId, socket);

  socket.send(
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

  gameServer.processPlayerInput(clientId, data.data);
}

function handleScreenwatchOffer(clientId: string, data: any) {
  const client = clients.get(clientId);
  if (!client) return;

  const teammatePeerId = data.to;
  const teammate = Array.from(clients.values()).find(
    (c) => c.id === teammatePeerId && c.roomId === client.roomId
  );

  if (teammate) {
    teammate.socket.send(
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
    teammate.socket.send(
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
    teammate.socket.send(
      JSON.stringify({
        type: "SCREENWATCH_ICE_CANDIDATE",
        candidate: data.candidate,
        from: clientId
      })
    );
  }
}

function handleKillEvent(clientId: string, data: any) {
  const client = clients.get(clientId);
  if (!client) return;

  const gameServer = gameServers.get(client.roomId);
  if (!gameServer) return;

  console.log(
    `💀 Kill: ${data.killerId} (Team ${data.killerTeam}) killed ${data.victimId} with ${data.weapon}`
  );

  gameServer.recordKill(data.killerId, data.victimId, data.weapon);

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
      roomClient.socket.send(killMessage);
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

function startGameLoop(roomId: string, gameServer: GameServer2v2) {
  const tickRate = 72;

  const interval = setInterval(() => {
    gameServer.update();

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
        client.socket.send(stateMessage);
      } catch (e) {
        console.error(`Failed to send state to ${client.id}:`, e);
      }
    }
  }, Math.floor(1000 / tickRate));
}

serve(handler, { hostname: "0.0.0.0", port: 8000 });
console.log("✨ Server ready for connections on ws://0.0.0.0:8000");
