// Network Client - WebSocket connection to game server

export class NetworkClient {
  constructor(url = 'ws://localhost:8000') {
    this.url = url;
    this.ws = null;
    this.clientId = null;
    this.isConnected = false;
    this.messageHandlers = new Map();
    this.pendingData = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('✅ Connected to server');
          this.isConnected = true;
          
          // Flush any pending messages
          while (this.pendingData.length > 0) {
            const msg = this.pendingData.shift();
            this.ws.send(JSON.stringify(msg));
          }
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (e) {
            console.error('Failed to parse message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('❌ Disconnected from server');
          this.isConnected = false;
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  handleMessage(data) {
    const handler = this.messageHandlers.get(data.type);
    if (handler) {
      handler(data);
    } else {
      console.log('No handler for message type:', data.type);
    }
  }

  on(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
  }

  send(message) {
    if (!this.isConnected) {
      this.pendingData.push(message);
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (e) {
      console.error('Failed to send message:', e);
      this.pendingData.push(message);
    }
  }

  sendBinary(messageType, data) {
    this.send({
      type: messageType,
      data: Array.from(new Uint8Array(data))
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}
