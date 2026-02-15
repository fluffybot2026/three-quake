// Screenwatch UI - Picture-in-picture teammate POV rendering and controls

export class ScreenwatchUI {
  constructor(container) {
    this.container = container;
    this.videoElement = null;
    this.isExpanded = false;
    this.isVisible = true;
  }

  createPiPWindow(videoStream) {
    // TODO: Create video element for teammate POV
    // TODO: Position bottom-right corner (25% of screen)
    // TODO: Add border + rounded corners
    // TODO: Add click handlers for expand/collapse
    // TODO: Append to container
  }

  onClickExpand() {
    // TODO: Expand PiP to 50% of screen
    // TODO: Make collapsible via click
    this.isExpanded = !this.isExpanded;
    this.updateLayout();
  }

  onToggleVisibility() {
    // TODO: Hide/show teammate POV (Tab key)
    this.isVisible = !this.isVisible;
    this.updateLayout();
  }

  updateLayout() {
    // TODO: Update CSS based on isExpanded + isVisible
  }

  setConnectionStatus(status) {
    // TODO: Show connection indicator (Green/Yellow/Red)
    // Green = stable, Yellow = latency, Red = disconnected
  }

  showFallback(screenshotData) {
    // TODO: Show screenshot fallback if WebRTC fails
    // TODO: Update every 5 seconds
  }
}
