// UI Screens - Pre/post-match and menu screens

export class PreMatchScreen {
  constructor(container) {
    this.container = container;
  }

  show(teamId, map, playbook) {
    // TODO: Show team assignment
    // TODO: Show map preview with weapon spawns
    // TODO: Show playbook details
    // TODO: Show 10s countdown to match start
    // TODO: Hide screen when match starts
  }
}

export class PostMatchScreen {
  constructor(container) {
    this.container = container;
  }

  show(stats, teamWinner, nextRotation) {
    // TODO: Show full scoreboard (KDR, impact score)
    // TODO: Show team that won
    // TODO: Show who plays next (rotation animation)
    // TODO: Show 5s countdown to next match
    // TODO: Auto-transition after countdown
  }
}

export class LobbyScreen {
  constructor(container) {
    this.container = container;
  }

  show() {
    // TODO: Show waiting for players
    // TODO: Show who joined
    // TODO: Show "Ready" button
  }
}
