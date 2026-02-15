// Screenwatch UI - Picture-in-picture teammate POV rendering and controls

export class ScreenwatchUI {
  constructor(container) {
    this.container = container;
    this.pipWindow = null;
    this.videoElement = null;
    this.statusIndicator = null;
    this.isExpanded = false;
    this.isVisible = true;
  }

  createPiPWindow(videoStream) {
    // Create container for PiP window
    this.pipWindow = document.createElement('div');
    this.pipWindow.id = 'screenwatch-pip';
    this.pipWindow.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 25vw;
      height: 25vh;
      border: 2px solid #0f0;
      border-radius: 8px;
      background: #000;
      cursor: pointer;
      box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
      z-index: 100;
      overflow: hidden;
    `;
    
    // Create video element
    this.videoElement = document.createElement('video');
    this.videoElement.srcObject = videoStream;
    this.videoElement.autoplay = true;
    this.videoElement.muted = true;
    this.videoElement.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
    `;
    
    // Create status indicator
    this.statusIndicator = document.createElement('div');
    this.statusIndicator.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #0f0;
      box-shadow: 0 0 5px #0f0;
    `;
    
    this.pipWindow.appendChild(this.videoElement);
    this.pipWindow.appendChild(this.statusIndicator);
    this.container.appendChild(this.pipWindow);
    
    // Add event listeners
    this.pipWindow.addEventListener('click', () => this.onClickExpand());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.onToggleVisibility();
      }
    });
  }

  onClickExpand() {
    this.isExpanded = !this.isExpanded;
    this.updateLayout();
  }

  onToggleVisibility() {
    this.isVisible = !this.isVisible;
    this.updateLayout();
  }

  updateLayout() {
    if (!this.pipWindow) return;
    
    if (!this.isVisible) {
      this.pipWindow.style.display = 'none';
      return;
    }
    
    this.pipWindow.style.display = 'block';
    
    if (this.isExpanded) {
      // Expand to 50% of screen, center-right
      this.pipWindow.style.cssText = `
        position: fixed;
        right: 0;
        bottom: 0;
        width: 50vw;
        height: 100vh;
        border: 2px solid #0f0;
        border-radius: 0;
        background: #000;
        cursor: pointer;
        box-shadow: inset 0 0 10px rgba(0, 255, 0, 0.3);
        z-index: 100;
        overflow: hidden;
      `;
    } else {
      // Back to corner
      this.pipWindow.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 25vw;
        height: 25vh;
        border: 2px solid #0f0;
        border-radius: 8px;
        background: #000;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        z-index: 100;
        overflow: hidden;
      `;
    }
  }

  setConnectionStatus(status) {
    if (!this.statusIndicator) return;
    
    let color = '#f00';  // Red = disconnected/failed
    if (status === 'connected') color = '#0f0';  // Green = connected
    if (status === 'connecting') color = '#ff0';  // Yellow = connecting
    
    this.statusIndicator.style.background = color;
    this.statusIndicator.style.boxShadow = `0 0 5px ${color}`;
  }

  showFallback(screenshotData) {
    if (!this.videoElement) return;
    
    // Create image element for screenshot fallback
    const img = new Image();
    img.src = screenshotData;
    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
    `;
    
    // Replace video with image temporarily
    this.videoElement.style.display = 'none';
    if (this.videoElement.nextSibling) {
      this.pipWindow.removeChild(this.videoElement.nextSibling);
    }
    this.pipWindow.insertBefore(img, this.statusIndicator);
  }

  destroy() {
    if (this.pipWindow) {
      this.container.removeChild(this.pipWindow);
      this.pipWindow = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }
}
