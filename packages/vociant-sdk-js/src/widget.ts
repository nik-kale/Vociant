/**
 * Vociant Widget
 *
 * Pre-built UI component for voice agent interaction
 */

import { VociantClient } from './vociant-client';
import type { VociantWidgetConfig, WidgetTheme } from './types';

export class VociantWidget {
  private client: VociantClient;
  private config: VociantWidgetConfig;
  private container: HTMLElement | null = null;
  private isOpen: boolean = false;
  private isMinimized: boolean = true;

  constructor(config: VociantWidgetConfig) {
    this.config = {
      position: 'bottom-right',
      theme: {},
      autoStart: false,
      ...config,
    };

    this.client = new VociantClient(config);
    this.init();
  }

  /**
   * Initialize widget
   */
  private init(): void {
    // Find or create container
    if (this.config.container) {
      if (typeof this.config.container === 'string') {
        this.container = document.querySelector(this.config.container);
      } else {
        this.container = this.config.container;
      }
    }

    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'vociant-widget-root';
      document.body.appendChild(this.container);
    }

    // Render widget
    this.render();

    // Setup event listeners
    this.setupEventListeners();

    // Auto-start if configured
    if (this.config.autoStart) {
      this.open();
    }
  }

  /**
   * Render widget UI
   */
  private render(): void {
    if (!this.container) return;

    const theme = this.getTheme();
    const position = this.getPositionStyles();

    this.container.innerHTML = `
      <div id="vociant-widget" style="${position} position: fixed; z-index: 9999; font-family: ${theme.fontFamily};">
        <!-- Minimized Button -->
        <div id="vociant-widget-button"
             style="display: ${this.isMinimized ? 'flex' : 'none'};
                    align-items: center;
                    justify-content: center;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: ${theme.primaryColor};
                    color: ${theme.textColor};
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    transition: transform 0.2s;">
          ${this.config.avatarUrl
            ? `<img src="${this.config.avatarUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="Agent" />`
            : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                 <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                 <line x1="12" x2="12" y1="19" y2="22"></line>
               </svg>`
          }
        </div>

        <!-- Expanded Chat Window -->
        <div id="vociant-widget-window"
             style="display: ${this.isMinimized ? 'none' : 'flex'};
                    flex-direction: column;
                    width: 380px;
                    height: 600px;
                    max-height: 90vh;
                    background: ${theme.backgroundColor};
                    border-radius: ${theme.borderRadius}px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                    overflow: hidden;">
          <!-- Header -->
          <div style="display: flex;
                      align-items: center;
                      justify-content: space-between;
                      padding: 16px;
                      background: ${theme.primaryColor};
                      color: ${theme.textColor};">
            <div style="display: flex; align-items: center; gap: 12px;">
              ${this.config.avatarUrl
                ? `<img src="${this.config.avatarUrl}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" alt="Agent" />`
                : ''
              }
              <div>
                <div style="font-weight: 600; font-size: 16px;">Voice Agent</div>
                <div id="vociant-status" style="font-size: 12px; opacity: 0.9;">Click to start</div>
              </div>
            </div>
            <button id="vociant-close-btn"
                    style="background: none;
                           border: none;
                           color: ${theme.textColor};
                           cursor: pointer;
                           padding: 4px;
                           opacity: 0.8;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Transcript -->
          <div id="vociant-transcript"
               style="flex: 1;
                      overflow-y: auto;
                      padding: 16px;
                      display: flex;
                      flex-direction: column;
                      gap: 12px;">
            ${this.config.greeting
              ? `<div style="padding: 12px;
                            background: ${theme.primaryColor}20;
                            border-radius: 8px;
                            font-size: 14px;
                            color: ${theme.textColor};">
                   ${this.config.greeting}
                 </div>`
              : ''
            }
          </div>

          <!-- Controls -->
          <div style="padding: 16px;
                      border-top: 1px solid #e5e7eb;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      gap: 12px;">
            <button id="vociant-mic-btn"
                    style="width: 56px;
                           height: 56px;
                           border-radius: 50%;
                           border: none;
                           background: ${theme.primaryColor};
                           color: ${theme.textColor};
                           cursor: pointer;
                           display: flex;
                           align-items: center;
                           justify-content: center;
                           transition: transform 0.2s;
                           box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <svg id="vociant-mic-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" x2="12" y1="19" y2="22"></line>
              </svg>
            </button>
            <button id="vociant-disconnect-btn"
                    style="padding: 8px 16px;
                           border-radius: 8px;
                           border: 1px solid #e5e7eb;
                           background: white;
                           color: #6b7280;
                           cursor: pointer;
                           font-size: 14px;
                           display: none;">
              Disconnect
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachEventHandlers();
  }

  /**
   * Get theme with defaults
   */
  private getTheme(): Required<WidgetTheme> {
    return {
      primaryColor: this.config.theme?.primaryColor || '#3b82f6',
      textColor: this.config.theme?.textColor || '#ffffff',
      backgroundColor: this.config.theme?.backgroundColor || '#ffffff',
      fontFamily: this.config.theme?.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderRadius: this.config.theme?.borderRadius || 12,
    };
  }

  /**
   * Get position styles based on config
   */
  private getPositionStyles(): string {
    const offset = '20px';
    switch (this.config.position) {
      case 'bottom-right':
        return `bottom: ${offset}; right: ${offset};`;
      case 'bottom-left':
        return `bottom: ${offset}; left: ${offset};`;
      case 'top-right':
        return `top: ${offset}; right: ${offset};`;
      case 'top-left':
        return `top: ${offset}; left: ${offset};`;
      default:
        return `bottom: ${offset}; right: ${offset};`;
    }
  }

  /**
   * Attach DOM event handlers
   */
  private attachEventHandlers(): void {
    const button = document.getElementById('vociant-widget-button');
    const closeBtn = document.getElementById('vociant-close-btn');
    const micBtn = document.getElementById('vociant-mic-btn');
    const disconnectBtn = document.getElementById('vociant-disconnect-btn');

    button?.addEventListener('click', () => this.open());
    closeBtn?.addEventListener('click', () => this.close());
    micBtn?.addEventListener('click', () => this.toggleMicrophone());
    disconnectBtn?.addEventListener('click', () => this.disconnect());

    // Hover effects
    button?.addEventListener('mouseenter', (e) => {
      (e.target as HTMLElement).style.transform = 'scale(1.05)';
    });
    button?.addEventListener('mouseleave', (e) => {
      (e.target as HTMLElement).style.transform = 'scale(1)';
    });

    micBtn?.addEventListener('mouseenter', (e) => {
      (e.target as HTMLElement).style.transform = 'scale(1.05)';
    });
    micBtn?.addEventListener('mouseleave', (e) => {
      (e.target as HTMLElement).style.transform = 'scale(1)';
    });
  }

  /**
   * Setup client event listeners
   */
  private setupEventListeners(): void {
    this.client.on('connected', () => {
      this.updateStatus('Connected');
      this.showDisconnectButton();
    });

    this.client.on('disconnected', () => {
      this.updateStatus('Disconnected');
      this.hideDisconnectButton();
    });

    this.client.on('message', (data) => {
      this.addMessageToTranscript(data.role, data.text);
    });

    this.client.on('listening', () => {
      this.updateStatus('Listening...');
      this.setMicIconListening();
    });

    this.client.on('speaking', () => {
      this.updateStatus('Speaking...');
      this.setMicIconDefault();
    });

    this.client.on('error', (data) => {
      this.updateStatus(`Error: ${data.error}`);
    });
  }

  /**
   * Open widget
   */
  private open(): void {
    this.isMinimized = false;
    this.isOpen = true;
    const button = document.getElementById('vociant-widget-button');
    const window = document.getElementById('vociant-widget-window');

    if (button) button.style.display = 'none';
    if (window) window.style.display = 'flex';

    // Auto-connect
    if (this.client.getConnectionState().status === 'disconnected') {
      this.toggleMicrophone();
    }
  }

  /**
   * Close widget
   */
  private close(): void {
    this.isMinimized = true;
    this.isOpen = false;
    const button = document.getElementById('vociant-widget-button');
    const window = document.getElementById('vociant-widget-window');

    if (button) button.style.display = 'flex';
    if (window) window.style.display = 'none';
  }

  /**
   * Toggle microphone
   */
  private async toggleMicrophone(): Promise<void> {
    const state = this.client.getConnectionState();

    if (state.status === 'disconnected' || state.status === 'error') {
      try {
        await this.client.connect();
      } catch (error) {
        console.error('Failed to connect:', error);
      }
    }
  }

  /**
   * Disconnect
   */
  private disconnect(): void {
    this.client.disconnect();
  }

  /**
   * Update status text
   */
  private updateStatus(text: string): void {
    const statusEl = document.getElementById('vociant-status');
    if (statusEl) {
      statusEl.textContent = text;
    }
  }

  /**
   * Add message to transcript
   */
  private addMessageToTranscript(role: 'user' | 'assistant', text: string): void {
    const transcript = document.getElementById('vociant-transcript');
    if (!transcript) return;

    const theme = this.getTheme();
    const isUser = role === 'user';

    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.5;
      max-width: 80%;
      align-self: ${isUser ? 'flex-end' : 'flex-start'};
      background: ${isUser ? theme.primaryColor : '#f3f4f6'};
      color: ${isUser ? theme.textColor : '#111827'};
    `;
    messageEl.textContent = text;

    transcript.appendChild(messageEl);
    transcript.scrollTop = transcript.scrollHeight;
  }

  /**
   * Show disconnect button
   */
  private showDisconnectButton(): void {
    const btn = document.getElementById('vociant-disconnect-btn');
    if (btn) btn.style.display = 'block';
  }

  /**
   * Hide disconnect button
   */
  private hideDisconnectButton(): void {
    const btn = document.getElementById('vociant-disconnect-btn');
    if (btn) btn.style.display = 'none';
  }

  /**
   * Set mic icon to listening state
   */
  private setMicIconListening(): void {
    const micBtn = document.getElementById('vociant-mic-btn');
    if (micBtn) {
      micBtn.style.animation = 'pulse 1.5s ease-in-out infinite';
    }
  }

  /**
   * Set mic icon to default state
   */
  private setMicIconDefault(): void {
    const micBtn = document.getElementById('vociant-mic-btn');
    if (micBtn) {
      micBtn.style.animation = 'none';
    }
  }

  /**
   * Destroy widget
   */
  destroy(): void {
    this.client.disconnect();
    if (this.container) {
      this.container.remove();
    }
  }
}

// Add pulse animation to document if not exists
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `;
  document.head.appendChild(style);
}
