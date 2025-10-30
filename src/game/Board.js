/**
 * Board Class
 *
 * Manages the Tetris game board including the grid state, collision detection,
 * piece placement, and line clearing mechanics.
 *
 * REQ-1: Core Tetris Gameplay - Board management, collision detection, line clearing
 * Design Spec: "Clear playfield rendering (standard 10×20 grid)"
 */

/**
 * Standard Tetris board dimensions
 */
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

/**
 * Board class representing the Tetris playfield
 */
export class Board {
  /**
   * Create a new Board with empty grid
   */
  constructor() {
    this.width = BOARD_WIDTH;
    this.height = BOARD_HEIGHT;

    // Initialize grid: 20 rows × 10 columns, all cells empty (0)
    this.grid = Array(BOARD_HEIGHT).fill(null).map(() =>
      Array(BOARD_WIDTH).fill(0)
    );
  }

  /**
   * Check if a piece collides with walls, floor, or placed pieces
   * @param {Tetromino} piece - The piece to check
   * @returns {boolean} True if collision detected, false otherwise
   */
  isColliding(piece) {
    const cells = piece.getFilledCells();

    for (const cell of cells) {
      // Check boundaries
      if (cell.x < 0 || cell.x >= this.width) {
        return true; // Wall collision
      }
      if (cell.y < 0 || cell.y >= this.height) {
        return true; // Top/bottom collision
      }

      // Check collision with placed pieces
      if (this.grid[cell.y][cell.x] !== 0) {
        return true; // Piece collision
      }
    }

    return false;
  }

  /**
   * Check if a piece can be rotated without collision
   * This checks if rotating the piece from its current state would be valid
   * @param {Tetromino} piece - The piece to check (in its CURRENT unrotated state)
   * @returns {boolean} True if rotation would be valid, false otherwise
   */
  canRotate(piece) {
    // Clone the piece to test rotation without modifying original
    const testPiece = piece.clone();
    testPiece.rotate();
    return !this.isColliding(testPiece);
  }

  /**
   * Place a piece permanently on the board
   * @param {Tetromino} piece - The piece to place
   */
  placePiece(piece) {
    const cells = piece.getFilledCells();

    for (const cell of cells) {
      if (cell.y >= 0 && cell.y < this.height &&
          cell.x >= 0 && cell.x < this.width) {
        // Store piece type as a positive number (1-7)
        // This preserves piece information for rendering
        this.grid[cell.y][cell.x] = this._getPieceCode(piece.type);
      }
    }
  }

  /**
   * Get numeric code for piece type
   * @param {string} type - Piece type letter
   * @returns {number} Numeric code (1-7)
   * @private
   */
  _getPieceCode(type) {
    const codes = { I: 1, O: 2, T: 3, S: 4, Z: 5, J: 6, L: 7 };
    return codes[type] || 1;
  }

  /**
   * Check if there are any completed lines
   * @returns {boolean} True if at least one line is complete
   */
  hasCompletedLines() {
    for (let row = 0; row < this.height; row++) {
      if (this.grid[row].every(cell => cell !== 0)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Clear all completed lines and drop lines above
   * @returns {number} Number of lines cleared
   */
  clearLines() {
    let linesCleared = 0;

    // Scan from bottom to top
    for (let row = this.height - 1; row >= 0; row--) {
      // Check if row is complete
      if (this.grid[row].every(cell => cell !== 0)) {
        // Remove this row
        this.grid.splice(row, 1);
        // Add new empty row at top
        this.grid.unshift(Array(this.width).fill(0));
        linesCleared++;
        // Re-check same row index (since rows shifted down)
        row++;
      }
    }

    return linesCleared;
  }

  /**
   * Check if game is over (pieces have stacked to the top)
   * @returns {boolean} True if game is over
   */
  isGameOver() {
    // Check top rows for any placed pieces
    // If spawn area (top rows) is blocked, game is over
    for (let col = 0; col < this.width; col++) {
      if (this.grid[0][col] !== 0 || this.grid[1][col] !== 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get a deep copy of the grid
   * @returns {Array<Array<number>>} Copy of the grid
   */
  getGrid() {
    return this.grid.map(row => [...row]);
  }

  /**
   * Reset the board to empty state
   */
  reset() {
    this.grid = Array(this.height).fill(null).map(() =>
      Array(this.width).fill(0)
    );
  }
}
