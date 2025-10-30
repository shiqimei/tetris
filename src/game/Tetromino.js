/**
 * Tetromino Class
 *
 * Represents a Tetris piece with its shape, color, position, and rotation logic.
 * Implements all seven standard Tetris pieces (I, O, T, S, Z, J, L) according to
 * classic Tetris specifications.
 *
 * REQ-1: Core Tetris Gameplay - Seven standard tetromino pieces
 */

/**
 * Piece shape definitions
 * Each piece is represented as a 2D array where 1 = filled cell, 0 = empty cell
 * Shapes follow classic Tetris specifications
 */
const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ]
};

/**
 * Color assignments for each piece type
 * Following classic Tetris color scheme
 */
const COLORS = {
  I: 'cyan',
  O: 'yellow',
  T: 'purple',
  S: 'green',
  Z: 'red',
  J: 'blue',
  L: 'orange'
};

/**
 * Tetromino class representing a Tetris piece
 */
export class Tetromino {
  /**
   * Create a new Tetromino piece
   * @param {string} type - Piece type ('I', 'O', 'T', 'S', 'Z', 'J', 'L')
   */
  constructor(type) {
    if (!SHAPES[type]) {
      throw new Error(`Invalid piece type: ${type}`);
    }

    this.type = type;
    this.color = COLORS[type];

    // Deep copy the shape to avoid mutation
    this.shape = SHAPES[type].map(row => [...row]);

    // Spawn position: top center of 10-wide board
    this.x = 3;
    this.y = 0;
  }

  /**
   * Rotate the piece 90 degrees clockwise
   * Uses matrix rotation algorithm: transpose then reverse each row
   * O-piece rotation is handled specially (no visual change)
   */
  rotate() {
    // O-piece doesn't change when rotated
    if (this.type === 'O') {
      return;
    }

    // Transpose the matrix (swap rows and columns)
    const transposed = this.shape[0].map((_, colIndex) =>
      this.shape.map(row => row[colIndex])
    );

    // Reverse each row to complete 90-degree clockwise rotation
    this.shape = transposed.map(row => row.reverse());
  }

  /**
   * Move the piece left by one cell
   */
  moveLeft() {
    this.x -= 1;
  }

  /**
   * Move the piece right by one cell
   */
  moveRight() {
    this.x += 1;
  }

  /**
   * Move the piece down by one cell
   */
  moveDown() {
    this.y += 1;
  }

  /**
   * Get the filled cells of this piece relative to its position
   * @returns {Array<{x: number, y: number}>} Array of filled cell positions
   */
  getFilledCells() {
    const cells = [];
    for (let row = 0; row < this.shape.length; row++) {
      for (let col = 0; col < this.shape[row].length; col++) {
        if (this.shape[row][col] === 1) {
          cells.push({
            x: this.x + col,
            y: this.y + row
          });
        }
      }
    }
    return cells;
  }

  /**
   * Create a deep copy of this tetromino
   * @returns {Tetromino} A new Tetromino instance with the same state
   */
  clone() {
    const cloned = new Tetromino(this.type);
    cloned.shape = this.shape.map(row => [...row]);
    cloned.x = this.x;
    cloned.y = this.y;
    return cloned;
  }
}
