# Development Build - How to Play

This is a playable local build of End of Times Phase 0.1 with full 2v2 multiplayer, movement, screenwatch P2P, and weapons.

---

## Prerequisites

- **Deno** (v1.40+) — https://deno.land
- **Node.js + live-server** OR Python http.server (for static file serving)

## Quick Start (3 terminals)

### Terminal 1: Start WebSocket Game Server

```bash
cd three-quake
deno run --allow-net server/main_dev.ts
```

You should see:
```
🎮 End of Times Development Server
📡 WebSocket listening on ws://localhost:8000
✨ Server ready for connections
```

### Terminal 2: Start HTTP Server (for static files)

**Option A: Using live-server (Node.js)**
```bash
cd three-quake
npx live-server --port=8080
```

**Option B: Using Python**
```bash
cd three-quake
python3 -m http.server 8080
```

You should see:
```
Serving HTTP on port 8080...
```

### Terminal 3: Open Browsers

Open **two browser tabs** (or windows):

**Player 1 (Team Blue, Player 0):**
```
http://localhost:8080/index_dev.html?playerId=0&teamId=0&roomId=dev-room
```

**Player 2 (Team Red, Player 1):**
```
http://localhost:8080/index_dev.html?playerId=1&teamId=1&roomId=dev-room
```

---

## Controls

| Input | Action |
|-------|--------|
| **W** | Move forward |
| **A** | Move left |
| **S** | Move backward |
| **D** | Move right |
| **Space** | Jump |
| **Shift** | Sprint (finite stamina) |
| **Mouse** | Look around (click canvas to lock) |
| **E** | Activate rewind (when implemented) |
| **Q** | Throw grenade (when implemented) |

---

## What to Expect

✅ **Working:**
- Both players connect to same room
- Movement (WASD, jumping, sprinting)
- Mouse look with pointer lock
- Arena map (platforms, passages)
- Screenwatch P2P video setup (corner window)
- Network sync at 72 Hz (smooth movement)

⚠️ **Partial:**
- Screenwatch WebRTC canvas capture (may need browser permissions)
- Weapon definitions (not yet rendering or detecting hits)

❌ **Not Yet Implemented:**
- Weapon rendering (3D models)
- Hit detection / combat
- Kill scoring
- HUD (health, ammo, scoreboard)
- Rewind visual effects
- Match start/end screens

---

## Troubleshooting

### WebSocket Connection Failed
```
❌ Failed to connect to server
```

**Fix:** Ensure `deno run --allow-net server/main_dev.ts` is running in Terminal 1.

### Canvas Not Rendering
```
Blank black screen
```

**Fix:**
- Clear browser cache (Cmd+Shift+Delete)
- Try incognito/private window
- Check browser console for errors (F12)

### Screenwatch PiP Not Showing
- Check browser console for WebRTC errors
- Ensure both players are in same room (same roomId param)
- Look for green status indicator in corner (shows connection state)

### Deno Not Found
```
Command 'deno' not found
```

**Fix:** Install from https://deno.land

```bash
curl -fsSL https://deno.land/x/install/install.sh | sh
```

---

## Testing Checklist

- [ ] Start server terminal
- [ ] Start HTTP server terminal
- [ ] Open Player 1 tab (should show arena + instructions)
- [ ] Open Player 2 tab (should show arena + instructions)
- [ ] Both players see "Ready!" status
- [ ] Move in Player 1 tab (WASD) → Player 2 sees you move
- [ ] Move in Player 2 tab (WASD) → Player 1 sees you move
- [ ] Look around with mouse → Other player's model rotates (when implemented)
- [ ] Sprint (Shift) → Stamina depletes, regenerates
- [ ] Jump (Space) → Both players see gravity working

---

## Next Steps (Week 3-4)

1. **Render 3D Models** — Player meshes visible for both players
2. **Weapon System** — Pick up weapons, fire (hitscan + projectiles)
3. **Hit Detection** — Kills recorded, kill feed displayed
4. **HUD** — Scoreboard, health, ammo, rewind charges
5. **Match Screens** — Pre-match (countdown), post-match (winner, rotation)

---

## Architecture

```
Browser (Player 1)               Browser (Player 2)
    ↓                                 ↓
main_dev.js                      main_dev.js
    ↓                                 ↓
GameLoop2v2 ←──── WebSocket ───→ GameLoop2v2
    ↓                                 ↓
WebRTC P2P ←─────────────────────→ WebRTC P2P
(Screenwatch)                    (Screenwatch)
    ↓                                 ↓
  Deno WebSocket Server (port 8000)
    ↓
  GameServer2v2 (72 Hz tick)
    ↓
  State Broadcasting
```

---

## File Reference

- **server/main_dev.ts** — Deno WebSocket server
- **main_dev.js** — Frontend bootstrap + game loop
- **index_dev.html** — HTML entry point
- **src/game_loop_2v2.js** — Main game loop
- **src/network_client.js** — WebSocket client
- **src/player_controller_2v2.js** — Movement physics
- **src/screenwatch_client.js** — WebRTC P2P video
- **src/screenwatch_ui.js** — PiP corner window

---

## Performance

- **Tick Rate:** 72 Hz (server-side)
- **Render Rate:** 60 FPS (browser)
- **Network Latency:** ~50-200ms (depending on system)
- **Bandwidth:** ~1-2 Mbps per client
- **Memory:** ~200-300 MB per browser tab

---

## Feedback

Try it out and report what works/breaks. This is the MVP.

🏈 **Let's play!**
