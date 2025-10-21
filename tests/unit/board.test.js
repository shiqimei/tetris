import { describe, test, expect, beforeEach } from '@jest/globals';

/**
 * Board Unit Tests
 *
 * Tests for REQ-1: Core Tetris Gameplay - Board management, collision detection, line clearing
 * Design Spec: "Clear playfield rendering (standard 10×20 grid)"
 *
 * These tests validate the game board, piece placement, collision detection,
 * and line clearing mechanics.
 */

describe('Board Initialization', () => {
  test('should create a 10x20 grid', async () => {
    const { Board } = await import('../../src/game/Board.js');
    const board = new Board();

    expect(board.grid.length).toBe(20); // 20 rows
    expect(board.grid[0].length).toBe(10); // 10 columns
  });

  test('should initialize all cells as empty', async () => {
    const { Board } = await import('../../src/game/Board.js');
    const board = new Board();

    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < 10; col++) {
        expect(board.grid[row][col]).toBe(0);
      }
    }
  });
});

describe('Collision Detection', () => {
  let board;

  beforeEach(async () => {
    const { Board } = await import('../../src/game/Board.js');
    board = new Board();
  });

  test('should detect collision with left wall', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const piece = new Tetromino('T');
    piece.x = -1; // Off the left edge

    expect(board.isColliding(piece)).toBe(true);
  });

  test('should detect collision with right wall', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const piece = new Tetromino('T');
    piece.x = 10; // Off the right edge

    expect(board.isColliding(piece)).toBe(true);
  });

  test('should detect collision with bottom', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const piece = new Tetromino('T');
    piece.y = 20; // Below the bottom

    expect(board.isColliding(piece)).toBe(true);
  });

  test('should detect collision with placed pieces', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');

    // Place a piece at the bottom
    board.grid[19][5] = 1;

    const piece = new Tetromino('T');
    piece.x = 4;
    piece.y = 18; // Would overlap with placed piece

    expect(board.isColliding(piece)).toBe(true);
  });

  test('should not detect collision in valid position', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const piece = new Tetromino('T');
    piece.x = 3;
    piece.y = 5;

    expect(board.isColliding(piece)).toBe(false);
  });

  test('should prevent rotation if it would cause collision', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const piece = new Tetromino('I');
    piece.x = 0; // Against left wall
    piece.rotate(); // Try to rotate

    expect(board.canRotate(piece)).toBe(false);
  });
});

describe('Piece Placement', () => {
  let board;

  beforeEach(async () => {
    const { Board } = await import('../../src/game/Board.js');
    board = new Board();
  });

  test('should place piece on board', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const piece = new Tetromino('O');
    piece.x = 4;
    piece.y = 18;

    board.placePiece(piece);

    expect(board.grid[18][4]).toBeGreaterThan(0);
    expect(board.grid[18][5]).toBeGreaterThan(0);
    expect(board.grid[19][4]).toBeGreaterThan(0);
    expect(board.grid[19][5]).toBeGreaterThan(0);
  });

  test('should store piece color information when placing', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const piece = new Tetromino('T');
    piece.x = 4;
    piece.y = 18;

    board.placePiece(piece);

    // Should store color code or piece type
    expect(board.grid[19][5]).toBeTruthy();
  });
});

describe('Line Clearing', () => {
  let board;

  beforeEach(async () => {
    const { Board } = await import('../../src/game/Board.js');
    board = new Board();
  });

  test('should detect completed line', async () => {
    // Fill bottom row completely
    for (let col = 0; col < 10; col++) {
      board.grid[19][col] = 1;
    }

    expect(board.hasCompletedLines()).toBe(true);
  });

  test('should not detect incomplete line as completed', async () => {
    // Fill bottom row partially
    for (let col = 0; col < 9; col++) {
      board.grid[19][col] = 1;
    }

    expect(board.hasCompletedLines()).toBe(false);
  });

  test('should clear single completed line', async () => {
    // Fill bottom row
    for (let col = 0; col < 10; col++) {
      board.grid[19][col] = 1;
    }

    const linesCleared = board.clearLines();

    expect(linesCleared).toBe(1);
    // Bottom row should now be empty
    expect(board.grid[19].every(cell => cell === 0)).toBe(true);
  });

  test('should clear multiple completed lines', async () => {
    // Fill bottom 3 rows
    for (let row = 17; row < 20; row++) {
      for (let col = 0; col < 10; col++) {
        board.grid[row][col] = 1;
      }
    }

    const linesCleared = board.clearLines();

    expect(linesCleared).toBe(3);
  });

  test('should drop lines above cleared lines', async () => {
    // Place a piece on row 17
    board.grid[17][5] = 1;

    // Fill row 19 completely
    for (let col = 0; col < 10; col++) {
      board.grid[19][col] = 1;
    }

    board.clearLines();

    // Piece should drop from row 17 to row 18
    expect(board.grid[18][5]).toBe(1);
    expect(board.grid[17][5]).toBe(0);
  });

  test('should clear tetris (4 lines) correctly', async () => {
    // Fill bottom 4 rows
    for (let row = 16; row < 20; row++) {
      for (let col = 0; col < 10; col++) {
        board.grid[row][col] = 1;
      }
    }

    const linesCleared = board.clearLines();

    expect(linesCleared).toBe(4);
  });
});

describe('Game Over Detection', () => {
  let board;

  beforeEach(async () => {
    const { Board } = await import('../../src/game/Board.js');
    board = new Board();
  });

  test('should detect game over when pieces reach top', async () => {
    // Fill top rows
    for (let col = 0; col < 10; col++) {
      board.grid[0][col] = 1;
    }

    expect(board.isGameOver()).toBe(true);
  });

  test('should not detect game over when board has space', async () => {
    // Place some pieces but leave top clear
    for (let col = 0; col < 10; col++) {
      board.grid[19][col] = 1;
    }

    expect(board.isGameOver()).toBe(false);
  });
});
