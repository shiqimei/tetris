#!/usr/bin/env node

/**
 * PyTetris - Terminal Tetris Game
 *
 * Main entry point for the game. Initializes all components and starts the game.
 *
 * REQ-6: Game State Management - Start, pause, resume, clean exit
 * NFR-6: Deployment - Simple npm package installation, single command to start
 */

import { Game } from './game/Game.js';
import { GameLoop } from './game/GameLoop.js';
import { InputHandler } from './input/InputHandler.js';
import { Renderer } from './render/Renderer.js';

/**
 * Main game controller
 */
class PyTetris {
  constructor() {
    this.game = new Game();
    this.renderer = new Renderer();
    this.inputHandler = new InputHandler();
    this.gameLoop = null;
    this.running = false;
  }

  /**
   * Initialize and start the game
   */
  async start() {
    // Check terminal size
    if (!this.renderer.checkTerminalSize()) {
      console.error(this.renderer.getTerminalSizeWarning());
      process.exit(1);
    }

    // Set up cleanup handlers
    this._setupCleanupHandlers();

    // Hide cursor for cleaner display
    this.renderer.hideCursor();

    // Set up input handling
    this.inputHandler.start();
    this.inputHandler.on('action', (action) => this._handleAction(action));

    // Start the game
    this.game.start();
    this.running = true;

    // Create game loop
    this.gameLoop = new GameLoop((deltaTime) => {
      this.game.update(deltaTime);
      this.renderer.display(this.game);
    }, { targetFPS: 30 });

    // Initial render
    this.renderer.display(this.game);

    // Start game loop
    this.gameLoop.start();
  }

  /**
   * Handle input actions
   * @param {string} action - Action name
   * @private
   */
  _handleAction(action) {
    if (!this.running) return;

    switch (action) {
      case 'moveLeft':
        this.game.moveLeft();
        break;
      case 'moveRight':
        this.game.moveRight();
        break;
      case 'softDrop':
        this.game.softDrop();
        break;
      case 'hardDrop':
        this.game.hardDrop();
        break;
      case 'rotate':
        this.game.rotate();
        break;
      case 'pause':
        this.game.pause();
        if (this.game.isPaused) {
          this.gameLoop.pause();
        } else {
          this.gameLoop.resume();
        }
        break;
      case 'restart':
        if (this.game.isGameOver) {
          this.game.start();
          this.gameLoop.resume();
        }
        break;
      case 'quit':
        this.cleanup();
        process.exit(0);
        break;
    }

    // Immediate render for responsive feel
    if (!this.game.isPaused) {
      this.renderer.display(this.game);
    }
  }

  /**
   * Set up cleanup handlers for graceful exit
   * @private
   */
  _setupCleanupHandlers() {
    const cleanup = () => {
      this.cleanup();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', () => this.cleanup());
  }

  /**
   * Clean up resources and restore terminal
   */
  cleanup() {
    if (this.gameLoop) {
      this.gameLoop.cleanup();
    }
    if (this.inputHandler) {
      this.inputHandler.cleanup();
    }
    this.renderer.showCursor();
    this.renderer.clear();
    this.running = false;
  }
}

// Start the game if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const game = new PyTetris();
  game.start().catch((error) => {
    console.error('Error starting game:', error);
    process.exit(1);
  });
}

export { PyTetris };
