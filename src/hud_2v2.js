// HUD 2v2 - Player heads-up display

export class HUD2v2 {
  constructor(container) {
    this.container = container;
    this.elements = {};
    this.killFeedItems = [];
    this.maxKillFeedItems = 5;
    
    this.createHUDElements();
  }

  createHUDElements() {
    // Scoreboard (top center)
    this.elements.scoreboard = document.createElement('div');
    this.elements.scoreboard.id = 'scoreboard';
    this.elements.scoreboard.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      padding: 15px 30px;
      border: 2px solid #0f0;
      border-radius: 8px;
      font-family: monospace;
      font-size: 16px;
      text-align: center;
      z-index: 100;
    `;
    this.elements.scoreboard.innerHTML = `
      <div style="color: #00f; font-weight: bold;">BLUE: <span id="score-blue">0</span></div>
      <div style="color: #f00; font-weight: bold;">RED: <span id="score-red">0</span></div>
    `;
    this.container.appendChild(this.elements.scoreboard);

    // Health + Shield (center bottom)
    this.elements.health = document.createElement('div');
    this.elements.health.id = 'health';
    this.elements.health.style.cssText = `
      position: fixed;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      padding: 10px;
      border: 2px solid #f00;
      border-radius: 8px;
      font-family: monospace;
      z-index: 100;
      width: 300px;
    `;
    this.elements.health.innerHTML = `
      <div style="font-size: 12px; color: #fff; margin-bottom: 5px;">HEALTH</div>
      <div style="background: #333; height: 20px; border: 1px solid #fff; position: relative;">
        <div id="health-bar" style="background: #f00; height: 100%; width: 100%; transition: width 0.1s;"></div>
      </div>
      <div style="font-size: 12px; color: #fff; margin-top: 5px;">
        <span id="health-text">100</span> / 100
      </div>
    `;
    this.container.appendChild(this.elements.health);

    // Ammo + Weapon (top right)
    this.elements.ammo = document.createElement('div');
    this.elements.ammo.id = 'ammo';
    this.elements.ammo.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: #0f0;
      padding: 15px;
      border: 2px solid #0f0;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      z-index: 100;
      min-width: 150px;
    `;
    this.elements.ammo.innerHTML = `
      <div style="margin-bottom: 10px;">
        <div id="weapon-name" style="font-weight: bold;">BATTLE RIFLE</div>
      </div>
      <div style="font-size: 18px; font-weight: bold;">
        <span id="ammo-current">∞</span> / <span id="ammo-max">∞</span>
      </div>
    `;
    this.container.appendChild(this.elements.ammo);

    // Rewind charges (bottom left)
    this.elements.rewind = document.createElement('div');
    this.elements.rewind.id = 'rewind';
    this.elements.rewind.style.cssText = `
      position: fixed;
      bottom: 40px;
      left: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: #0f0;
      padding: 15px;
      border: 2px solid #0f0;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 100;
    `;
    this.elements.rewind.innerHTML = `
      <div style="margin-bottom: 10px;">REWIND [E]</div>
      <div id="rewind-charges" style="display: flex; gap: 5px;">
        <div style="width: 20px; height: 20px; border: 2px solid #0f0; border-radius: 50%; background: #0f0;"></div>
        <div style="width: 20px; height: 20px; border: 2px solid #0f0; border-radius: 50%; background: #0f0;"></div>
      </div>
      <div id="rewind-cooldown" style="margin-top: 10px; font-size: 10px;">Ready</div>
    `;
    this.container.appendChild(this.elements.rewind);

    // Kill feed (top right, below ammo)
    this.elements.killFeed = document.createElement('div');
    this.elements.killFeed.id = 'kill-feed';
    this.elements.killFeed.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      padding: 10px;
      border: 2px solid #888;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 100;
      max-width: 250px;
    `;
    this.container.appendChild(this.elements.killFeed);
  }

  updateScore(blueKills, redKills) {
    const blueEl = document.getElementById('score-blue');
    const redEl = document.getElementById('score-red');
    if (blueEl) blueEl.textContent = blueKills;
    if (redEl) redEl.textContent = redKills;
  }

  updateHealth(health, maxHealth, shield) {
    const healthBar = document.getElementById('health-bar');
    const healthText = document.getElementById('health-text');
    
    const percent = (health / maxHealth) * 100;
    if (healthBar) healthBar.style.width = percent + '%';
    if (healthText) healthText.textContent = Math.floor(health);
    
    // Color change based on health
    if (healthBar) {
      if (health > maxHealth * 0.66) {
        healthBar.style.background = '#0f0';  // Green
      } else if (health > maxHealth * 0.33) {
        healthBar.style.background = '#ff0';  // Yellow
      } else {
        healthBar.style.background = '#f00';  // Red
      }
    }
  }

  updateAmmo(weaponName, ammo, maxAmmo) {
    const weaponEl = document.getElementById('weapon-name');
    const ammoCurrentEl = document.getElementById('ammo-current');
    const ammoMaxEl = document.getElementById('ammo-max');
    
    if (weaponEl) weaponEl.textContent = weaponName;
    if (ammoCurrentEl) ammoCurrentEl.textContent = ammo === Infinity ? '∞' : ammo;
    if (ammoMaxEl) ammoMaxEl.textContent = maxAmmo === Infinity ? '∞' : maxAmmo;
  }

  updateRewindCharges(charges, maxCharges, cooldown) {
    const chargesEl = document.getElementById('rewind-charges');
    const cooldownEl = document.getElementById('rewind-cooldown');
    
    if (chargesEl) {
      chargesEl.innerHTML = '';
      for (let i = 0; i < maxCharges; i++) {
        const circle = document.createElement('div');
        circle.style.cssText = `
          width: 20px;
          height: 20px;
          border: 2px solid #0f0;
          border-radius: 50%;
          background: ${i < charges ? '#0f0' : 'transparent'};
        `;
        chargesEl.appendChild(circle);
      }
    }
    
    if (cooldownEl) {
      if (cooldown > 0) {
        cooldownEl.textContent = `${cooldown.toFixed(1)}s`;
        cooldownEl.style.color = '#f00';
      } else {
        cooldownEl.textContent = 'Ready';
        cooldownEl.style.color = '#0f0';
      }
    }
  }

  addKillFeed(killerName, victimName, weapon) {
    const killFeedEl = document.getElementById('kill-feed');
    if (!killFeedEl) return;

    const item = document.createElement('div');
    item.style.cssText = `
      padding: 5px 0;
      font-size: 11px;
      color: #fff;
      border-bottom: 1px solid #444;
    `;
    item.innerHTML = `<span style="color: #0f0;">${killerName}</span> killed <span style="color: #f00;">${victimName}</span> with ${weapon}`;

    killFeedEl.insertBefore(item, killFeedEl.firstChild);
    this.killFeedItems.push(item);

    // Remove oldest items if too many
    while (this.killFeedItems.length > this.maxKillFeedItems) {
      const oldest = this.killFeedItems.shift();
      if (oldest.parentNode) {
        oldest.parentNode.removeChild(oldest);
      }
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (item.parentNode) {
        item.parentNode.removeChild(item);
      }
    }, 5000);
  }

  update(gameState, localPlayer) {
    if (!gameState) return;
    
    // Update score
    const blueKills = gameState.teams?.[0]?.kills || 0;
    const redKills = gameState.teams?.[1]?.kills || 0;
    this.updateScore(blueKills, redKills);
    
    // Update player health
    if (localPlayer) {
      this.updateHealth(localPlayer.health, 100, localPlayer.shield);
      this.updateAmmo(
        localPlayer.currentWeapon || 'BATTLE RIFLE',
        localPlayer.ammo || Infinity,
        localPlayer.maxAmmo || Infinity
      );
    }
  }
}
