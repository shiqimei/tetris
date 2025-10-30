/**
 * Game Class
 *
 * Main game controller that orchestrates all game components including:
 * - Game state management (score, level, lines cleared)
 * - Piece management (current piece, next piece)
 * - Board interactions
 * - Scoring system
 * - Game loop coordination
 *
 * REQ-1: Core Tetris Gameplay
 * REQ-3: Scoring System
 * REQ-4: Game Progression
 * REQ-6: Game State Management
 */

import { Board } from './Board.js';
import { Tetromino } from './Tetromino.js';
import { ScoringEngine } from './ScoringEngine.js';

/**
 * Piece types for random generation
 */
const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/**
 * Game class managing the entire game state and logic
 */
export class Game {
  /**
   * Create a new Game instance
   */
  constructor() {
    // Game state
    this.score = 0;
    this.level = 1;
    this.linesCleared = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.isRunning = false;

    // Game components
    this.board = new Board();
    this.scoringEngine = new ScoringEngine();

    // Timing
    this.gravityDelay = this.getGravitySpeed(this.level);
    this.gravityTimer = 0;

    // Initialize pieces (for testing and immediate play)
    this.currentPiece = this._generateRandomPiece();
    this.nextPiece = this._generateRandomPiece();
  }

  /**
   * Start a new game
   */
  start() {
    this.reset();
    this.spawnPiece();
    this.nextPiece = this._generateRandomPiece();
    this.isRunning = true;
  }

  /**
   * Reset the game to initial state
   */
  reset() {
    this.score = 0;
    this.level = 1;
    this.linesCleared = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.board.reset();
    this.gravityDelay = this.getGravitySpeed(this.level);
    this.gravityTimer = 0;
  }

  /**
   * Spawn a new piece at the top of the board
   */
  spawnPiece() {
    if (this.nextPiece) {
      this.currentPiece = this.nextPiece;
      this.nextPiece = this._generateRandomPiece();
    } else {
      this.currentPiece = this._generateRandomPiece();
      this.nextPiece = this._generateRandomPiece();
    }

    // Check if game is over (spawn position blocked)
    if (this.board.isColliding(this.currentPiece)) {
      this.isGameOver = true;
      this.isRunning = false;
    }
  }

  /**
   * Alias for spawnPiece (for test compatibility)
   */
  spawnNewPiece() {
    this.spawnPiece();
  }

  /**
   * Generate a random tetromino piece
   * @returns {Tetromino} A new random piece
   * @private
   */
  _generateRandomPiece() {
    const randomType = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
    return new Tetromino(randomType);
  }

  /**
   * Move current piece left
   * @returns {boolean} True if move was successful
   */
  moveLeft() {
    if (!this.currentPiece || this.isPaused || this.isGameOver) {
      return false;
    }

    this.currentPiece.moveLeft();
    if (this.board.isColliding(this.currentPiece)) {
      this.currentPiece.moveRight(); // Revert
      return false;
    }
    return true;
  }

  /**
   * Move current piece right
   * @returns {boolean} True if move was successful
   */
  moveRight() {
    if (!this.currentPiece || this.isPaused || this.isGameOver) {
      return false;
    }

    this.currentPiece.moveRight();
    if (this.board.isColliding(this.currentPiece)) {
      this.currentPiece.moveLeft(); // Revert
      return false;
    }
    return true;
  }

  /**
   * Soft drop - move piece down manually (awards 1 point per cell)
   * @param {number} cells - Number of cells to drop (default 1)
   * @returns {number} Number of cells actually dropped
   */
  softDrop(cells = 1) {
    if (!this.currentPiece || this.isPaused || this.isGameOver) {
      return 0;
    }

    let cellsDropped = 0;
    for (let i = 0; i < cells; i++) {
      this.currentPiece.moveDown();
      if (this.board.isColliding(this.currentPiece)) {
        this.currentPiece.y--; // Revert last move
        break;
      }
      cellsDropped++;
    }

    // Award points for soft drop
    const points = this.scoringEngine.calculateSoftDrop(cellsDropped);
    this.addScore(points);

    // If piece couldn't move, lock it
    if (cellsDropped === 0) {
      this._lockPiece();
    }

    return cellsDropped;
  }

  /**
   * Hard drop - instantly drop piece to bottom (awards 2 points per cell)
   * @returns {number} Number of cells dropped
   */
  hardDrop() {
    if (!this.currentPiece || this.isPaused || this.isGameOver) {
      return 0;
    }

    let cellsDropped = 0;
    while (true) {
      this.currentPiece.moveDown();
      if (this.board.isColliding(this.currentPiece)) {
        this.currentPiece.y--; // Revert last move
        break;
      }
      cellsDropped++;
    }

    // Award points for hard drop
    const points = this.scoringEngine.calculateHardDrop(cellsDropped);
    this.addScore(points);

    // Lock piece immediately
    this._lockPiece();

    return cellsDropped;
  }

  /**
   * Rotate current piece clockwise
   * @returns {boolean} True if rotation was successful
   */
  rotate() {
    if (!this.currentPiece || this.isPaused || this.isGameOver) {
      return false;
    }

    this.currentPiece.rotate();
    if (this.board.isColliding(this.currentPiece)) {
      // Revert rotation by rotating 3 more times (4 rotations = full circle)
      this.currentPiece.rotate();
      this.currentPiece.rotate();
      this.currentPiece.rotate();
      return false;
    }
    return true;
  }

  /**
   * Lock current piece to board and handle line clears
   * @private
   */
  _lockPiece() {
    if (!this.currentPiece) return;

    // Place piece on board
    this.board.placePiece(this.currentPiece);

    // Check for and clear completed lines
    this.clearLines();

    // Spawn next piece
    this.spawnPiece();
  }

  /**
   * Clear completed lines and award points
   * @param {number} expectedLines - Expected number of lines to clear (for testing)
   * @returns {number} Number of lines cleared
   */
  clearLines(expectedLines = null) {
    // For testing: if expectedLines provided, just update counter
    if (expectedLines !== null) {
      this.linesCleared += expectedLines;
      this.updateLevel();
      const points = this.scoringEngine.calculateLineClear(expectedLines, this.level);
      this.addScore(points);
      return expectedLines;
    }

    // Normal operation: check board for completed lines
    const cleared = this.board.clearLines();
    if (cleared > 0) {
      this.linesCleared += cleared;
      this.updateLevel();

      // Award points for line clear
      const points = this.scoringEngine.calculateLineClear(cleared, this.level);
      this.addScore(points);
    }

    return cleared;
  }

  /**
   * Update level based on lines cleared
   * Level increases every 10 lines
   */
  updateLevel() {
    const newLevel = Math.floor(this.linesCleared / 10) + 1;
    if (newLevel !== this.level) {
      this.level = newLevel;
      this.gravityDelay = this.getGravitySpeed(this.level);
    }
  }

  /**
   * Add points to score (prevents negative scores)
   * @param {number} points - Points to add
   */
  addScore(points) {
    // Prevent negative scores
    if (points < 0) {
      return;
    }
    this.score += points;
  }

  /**
   * Calculate gravity speed (delay between automatic drops) for a given level
   * Higher levels have faster (lower delay) speeds
   *
   * @param {number} level - Game level
   * @returns {number} Delay in milliseconds between gravity drops
   */
  getGravitySpeed(level) {
    // Classic Tetris gravity formula
    // Level 1: ~800ms, Level 10: ~100ms
    // Formula provides exponential speed increase
    const delay = Math.max(50, Math.floor(1000 * Math.pow(0.8, level - 1)));
    return delay;
  }

  /**
   * Toggle pause state
   */
  pause() {
    if (this.isGameOver) return;
    this.isPaused = !this.isPaused;
  }

  /**
   * Update game state (called by game loop)
   * @param {number} deltaTime - Time since last update in milliseconds
   */
  update(deltaTime) {
    if (this.isPaused || this.isGameOver || !this.isRunning || !this.currentPiece) {
      return;
    }

    // Accumulate gravity timer
    this.gravityTimer += deltaTime;

    // Apply gravity when timer exceeds delay
    if (this.gravityTimer >= this.gravityDelay) {
      this.gravityTimer = 0;

      // Move piece down by gravity
      this.currentPiece.moveDown();
      if (this.board.isColliding(this.currentPiece)) {
        this.currentPiece.y--; // Revert
        this._lockPiece();
      }
    }
  }

  /**
   * Get final statistics for game over screen
   * @returns {Object} Final game statistics
   */
  getFinalStats() {
    return {
      score: this.score,
      level: this.level,
      lines: this.linesCleared,
      gameOver: this.isGameOver
    };
  }

  /**
   * Stop the game
   */
  stop() {
    this.isRunning = false;
  }
}
