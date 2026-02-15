// HUD 2v2 - Player heads-up display

export class HUD2v2 {
  constructor(container) {
    this.container = container;
    this.elements = {};
  }

  createScoreboard() {
    // TODO: Create scoreboard element (top center)
    // TODO: Show Blue vs Red kills + match number
  }

  createHealthBar() {
    // TODO: Create health + shield indicator (center bottom)
    // TODO: Update on health changes
  }

  createAmmoCounter() {
    // TODO: Create ammo counter (top right)
    // TODO: Update on weapon changes
  }

  createRewindUI() {
    // TODO: Create rewind charges display (E key indicator)
    // TODO: Show 2 circles, fills as used
    // TODO: Show 10s cooldown timer
  }

  createKillFeed() {
    // TODO: Create kill feed (top right below ammo)
    // TODO: Show recent kills + rewind events
  }

  createMinimap() {
    // TODO: Create minimap (top left)
    // TODO: Show all players + weapons
  }

  update(gameState, localPlayer) {
    // TODO: Update all HUD elements each frame
  }
}
