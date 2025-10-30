/**
 * InputHandler Class
 *
 * Manages keyboard input for the Tetris game including:
 * - Raw mode terminal input
 * - Dual control schemes (Arrow keys and WASD)
 * - Game control keys (pause, quit, restart)
 * - Event-driven architecture for responsive controls
 *
 * REQ-2: Player Controls - Dual control schemes
 * NFR-1: Performance - Input latency under 50ms
 * NFR-5: User Experience - Immediate keypress detection (raw mode input)
 */

import { EventEmitter } from 'events';

/**
 * Key mappings for game controls
 * Supports both arrow keys and WASD for movement
 */
const KEY_MAPPINGS = {
  // Arrow keys
  'left': 'moveLeft',
  'right': 'moveRight',
  'down': 'softDrop',
  'up': 'rotate',
  'space': 'hardDrop',

  // WASD keys (case insensitive)
  'a': 'moveLeft',
  'A': 'moveLeft',
  'd': 'moveRight',
  'D': 'moveRight',
  's': 'softDrop',
  'S': 'softDrop',
  'w': 'rotate',
  'W': 'rotate',

  // Game control keys
  'p': 'pause',
  'P': 'pause',
  'q': 'quit',
  'Q': 'quit',
  'escape': 'quit',
  'r': 'restart',
  'R': 'restart'
};

/**
 * InputHandler class for managing keyboard input
 * Extends EventEmitter for event-driven architecture
 */
export class InputHandler extends EventEmitter {
  /**
   * Create a new InputHandler
   */
  constructor() {
    super();
    this.rawModeEnabled = false;
    this.listening = false;
  }

  /**
   * Start listening for keyboard input in raw mode
   * Enables immediate keypress detection without Enter
   */
  start() {
    if (this.listening) return;

    // Check if we're in a terminal environment (not in tests)
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      // Set up keypress listener
      process.stdin.on('data', this._handleStdinData.bind(this));
    }

    this.rawModeEnabled = true;
    this.listening = true;
  }

  /**
   * Stop listening for keyboard input and restore terminal
   */
  stop() {
    if (!this.listening) return;

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeAllListeners('data');
    }

    this.rawModeEnabled = false;
    this.listening = false;
  }

  /**
   * Handle raw stdin data
   * @param {string} data - Raw input data
   * @private
   */
  _handleStdinData(data) {
    // Convert raw data to keypress-like object
    const key = this._parseRawInput(data);
    this.handleKeyPress(key);
  }

  /**
   * Parse raw terminal input into keypress object
   * @param {string} data - Raw input data
   * @returns {Object} Keypress object with name and sequence
   * @private
   */
  _parseRawInput(data) {
    // Handle special keys
    if (data === '\x1b') {
      return { name: 'escape', sequence: data };
    }
    if (data === '\x1b[A') {
      return { name: 'up', sequence: data };
    }
    if (data === '\x1b[B') {
      return { name: 'down', sequence: data };
    }
    if (data === '\x1b[C') {
      return { name: 'right', sequence: data };
    }
    if (data === '\x1b[D') {
      return { name: 'left', sequence: data };
    }
    if (data === ' ') {
      return { name: 'space', sequence: data };
    }
    if (data === '\r' || data === '\n') {
      return { name: 'return', sequence: data };
    }
    if (data === '\x03') {
      // Ctrl+C
      return { name: 'ctrl-c', sequence: data };
    }

    // Regular character keys
    return { name: data, sequence: data };
  }

  /**
   * Handle a keypress event and emit corresponding action
   * @param {Object} key - Keypress object with name and optional sequence
   */
  handleKeyPress(key) {
    if (!key || !key.name) return;

    // Map key to action
    const action = this.mapKeyToAction(key);

    // Emit action event if valid
    if (action) {
      this.emit('action', action);
    }

    // Handle Ctrl+C specially
    if (key.name === 'ctrl-c') {
      this.emit('action', 'quit');
    }
  }

  /**
   * Map a key to a game action
   * @param {Object} key - Keypress object with name property
   * @returns {string|null} Action name or null if unknown key
   */
  mapKeyToAction(key) {
    if (!key || !key.name) return null;

    const action = KEY_MAPPINGS[key.name];
    return action || null;
  }

  /**
   * Register an action handler
   * @param {string} action - Action name
   * @param {Function} callback - Handler function
   */
  onAction(action, callback) {
    this.on(action, callback);
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.stop();
    this.removeAllListeners();
  }
}
