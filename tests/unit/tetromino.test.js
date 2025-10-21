import { describe, test, expect } from '@jest/globals';

/**
 * Tetromino Unit Tests
 *
 * Tests for REQ-1: Core Tetris Gameplay - Seven standard tetromino pieces
 * Design Spec: "Seven standard tetromino pieces (I, O, T, S, Z, J, L)"
 *
 * These tests validate the structure, rotation, and properties of all seven
 * standard Tetris pieces according to classic Tetris specifications.
 */

describe('Tetromino Piece Structure', () => {
  test('should create I-piece with correct shape and color', async () => {
    // TDD RED PHASE: This will fail until Tetromino class is implemented
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const iPiece = new Tetromino('I');

    expect(iPiece.type).toBe('I');
    expect(iPiece.color).toBe('cyan');
    expect(iPiece.shape).toEqual([
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
  });

  test('should create O-piece with correct shape and color', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const oPiece = new Tetromino('O');

    expect(oPiece.type).toBe('O');
    expect(oPiece.color).toBe('yellow');
    expect(oPiece.shape).toEqual([
      [1, 1],
      [1, 1]
    ]);
  });

  test('should create T-piece with correct shape and color', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const tPiece = new Tetromino('T');

    expect(tPiece.type).toBe('T');
    expect(tPiece.color).toBe('purple');
    expect(tPiece.shape).toEqual([
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ]);
  });

  test('should create S-piece with correct shape and color', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const sPiece = new Tetromino('S');

    expect(sPiece.type).toBe('S');
    expect(sPiece.color).toBe('green');
    expect(sPiece.shape).toEqual([
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ]);
  });

  test('should create Z-piece with correct shape and color', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const zPiece = new Tetromino('Z');

    expect(zPiece.type).toBe('Z');
    expect(zPiece.color).toBe('red');
    expect(zPiece.shape).toEqual([
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ]);
  });

  test('should create J-piece with correct shape and color', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const jPiece = new Tetromino('J');

    expect(jPiece.type).toBe('J');
    expect(jPiece.color).toBe('blue');
    expect(jPiece.shape).toEqual([
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ]);
  });

  test('should create L-piece with correct shape and color', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const lPiece = new Tetromino('L');

    expect(lPiece.type).toBe('L');
    expect(lPiece.color).toBe('orange');
    expect(lPiece.shape).toEqual([
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ]);
  });
});

describe('Tetromino Rotation', () => {
  test('should rotate I-piece 90 degrees clockwise', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const iPiece = new Tetromino('I');

    iPiece.rotate();

    expect(iPiece.shape).toEqual([
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0]
    ]);
  });

  test('should rotate T-piece 90 degrees clockwise', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const tPiece = new Tetromino('T');

    tPiece.rotate();

    expect(tPiece.shape).toEqual([
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0]
    ]);
  });

  test('should rotate piece 4 times to return to original orientation', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const tPiece = new Tetromino('T');
    const originalShape = JSON.stringify(tPiece.shape);

    tPiece.rotate();
    tPiece.rotate();
    tPiece.rotate();
    tPiece.rotate();

    expect(JSON.stringify(tPiece.shape)).toBe(originalShape);
  });

  test('O-piece should remain same shape after rotation', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const oPiece = new Tetromino('O');
    const originalShape = JSON.stringify(oPiece.shape);

    oPiece.rotate();

    expect(JSON.stringify(oPiece.shape)).toBe(originalShape);
  });
});

describe('Tetromino Position', () => {
  test('should spawn at top center position', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const piece = new Tetromino('T');

    expect(piece.x).toBe(3); // Center of 10-wide board
    expect(piece.y).toBe(0); // Top of board
  });

  test('should move left when moveLeft() is called', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const piece = new Tetromino('T');
    const originalX = piece.x;

    piece.moveLeft();

    expect(piece.x).toBe(originalX - 1);
  });

  test('should move right when moveRight() is called', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const piece = new Tetromino('T');
    const originalX = piece.x;

    piece.moveRight();

    expect(piece.x).toBe(originalX + 1);
  });

  test('should move down when moveDown() is called', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const piece = new Tetromino('T');
    const originalY = piece.y;

    piece.moveDown();

    expect(piece.y).toBe(originalY + 1);
  });
});
