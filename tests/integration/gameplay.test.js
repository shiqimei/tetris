import { describe, test, expect, beforeEach } from '@jest/globals';

/**
 * Gameplay Integration Tests
 *
 * Tests for REQ-1, REQ-2, REQ-3, REQ-4: Complete game flow integration
 * Design Spec: "Game Controller: Orchestrates game loop, coordinates between input/state/rendering"
 *
 * These tests validate the complete game flow from initialization through gameplay
 * to game over, ensuring all components work together correctly.
 */

describe('Game Initialization', () => {
  test('should initialize a new game with default state', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    expect(game.score).toBe(0);
    expect(game.level).toBe(1);
    expect(game.linesCleared).toBe(0);
    expect(game.isGameOver).toBe(false);
    expect(game.isPaused).toBe(false);
    expect(game.board).toBeDefined();
    expect(game.currentPiece).toBeDefined();
    expect(game.nextPiece).toBeDefined();
  });

  test('should spawn first piece at top center', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    expect(game.currentPiece.x).toBe(3);
    expect(game.currentPiece.y).toBe(0);
  });

  test('should generate next piece preview', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    expect(game.nextPiece).toBeDefined();
    expect(['I', 'O', 'T', 'S', 'Z', 'J', 'L']).toContain(game.nextPiece.type);
  });
});

describe('Complete Game Session', () => {
  test('should play through a complete game flow', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    // Move piece left
    game.moveLeft();
    expect(game.currentPiece.x).toBe(2);

    // Move piece right twice
    game.moveRight();
    game.moveRight();
    expect(game.currentPiece.x).toBe(4);

    // Rotate piece
    const originalShape = JSON.stringify(game.currentPiece.shape);
    game.rotate();
    expect(JSON.stringify(game.currentPiece.shape)).not.toBe(originalShape);

    // Soft drop should increase score and move piece down
    const originalY = game.currentPiece.y;
    const originalScore = game.score;
    game.softDrop();
    expect(game.currentPiece.y).toBe(originalY + 1);
    expect(game.score).toBeGreaterThan(originalScore);
  });

  test('should handle piece locking and spawning new piece', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();
    const firstPieceType = game.currentPiece.type;

    // Hard drop current piece
    game.hardDrop();

    // Should spawn next piece
    expect(game.currentPiece).toBeDefined();
    expect(game.currentPiece.y).toBe(0); // Back at top
    // Next piece should be different (or at least a new instance)
    expect(game.nextPiece).toBeDefined();
  });

  test('should clear lines and update score when lines are completed', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    // Manually fill bottom row except one column
    for (let col = 0; col < 9; col++) {
      game.board.grid[19][col] = 1;
    }

    // Place a piece to complete the line
    game.currentPiece.type = 'O';
    game.currentPiece.x = 8;
    game.currentPiece.y = 18;
    game.hardDrop();

    // Should have cleared line and updated score
    expect(game.linesCleared).toBeGreaterThan(0);
    expect(game.score).toBeGreaterThan(0);
  });
});

describe('Pause and Resume', () => {
  test('should pause game when pause() is called', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    game.pause();

    expect(game.isPaused).toBe(true);
  });

  test('should resume game when pause() is called again', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    game.pause();
    game.pause(); // Toggle pause

    expect(game.isPaused).toBe(false);
  });

  test('should not update game state when paused', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();
    game.pause();

    const pieceY = game.currentPiece.y;
    game.update(1000); // Try to update with 1 second delta

    // Piece should not have moved
    expect(game.currentPiece.y).toBe(pieceY);
  });

  test('should not accept movement input when paused', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();
    game.pause();

    const pieceX = game.currentPiece.x;
    game.moveLeft();

    expect(game.currentPiece.x).toBe(pieceX);
  });
});

describe('Game Over Conditions', () => {
  test('should trigger game over when pieces stack to top', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    // Fill board up to the top
    for (let row = 1; row < 20; row++) {
      for (let col = 0; col < 10; col++) {
        game.board.grid[row][col] = 1;
      }
    }

    // Try to spawn a new piece
    game.spawnNewPiece();

    expect(game.isGameOver).toBe(true);
  });

  test('should not accept input after game over', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();
    game.isGameOver = true;

    const pieceX = game.currentPiece.x;
    game.moveLeft();

    expect(game.currentPiece.x).toBe(pieceX);
  });

  test('should display final statistics on game over', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();
    game.score = 1500;
    game.level = 3;
    game.linesCleared = 25;
    game.isGameOver = true;

    const stats = game.getFinalStats();

    expect(stats.score).toBe(1500);
    expect(stats.level).toBe(3);
    expect(stats.linesCleared).toBe(25);
    expect(stats.timePlayedMs).toBeGreaterThanOrEqual(0);
  });
});

describe('Level Progression During Gameplay', () => {
  test('should advance level after clearing 10 lines', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    // Simulate clearing 10 lines
    game.linesCleared = 10;
    game.checkLevelUp();

    expect(game.level).toBe(2);
  });

  test('should increase gravity speed when level increases', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    const level1Gravity = game.gravityDelay;

    game.linesCleared = 10;
    game.checkLevelUp();

    const level2Gravity = game.gravityDelay;

    expect(level2Gravity).toBeLessThan(level1Gravity);
  });
});

describe('Scoring Integration', () => {
  test('should award correct points for single line clear at level 1', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    // Clear one line
    game.handleLineClear(1);

    expect(game.score).toBe(100);
  });

  test('should award correct points for tetris at level 1', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    // Clear four lines
    game.handleLineClear(4);

    expect(game.score).toBe(800);
  });

  test('should scale points by level', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();
    game.level = 5;

    // Clear one line at level 5
    game.handleLineClear(1);

    expect(game.score).toBe(500); // 100 × 5
  });

  test('should combine soft drop and line clear points', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    // Soft drop for 5 cells = 5 points
    game.currentPiece.y = 5;
    game.softDrop();
    game.softDrop();
    game.softDrop();

    const softDropPoints = game.score;

    // Then clear a line = 100 points
    game.handleLineClear(1);

    expect(game.score).toBe(softDropPoints + 100);
  });
});

describe('Piece Movement Validation', () => {
  test('should prevent piece from moving through walls', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    // Move to left edge
    game.currentPiece.x = 0;

    // Try to move further left
    game.moveLeft();

    expect(game.currentPiece.x).toBe(0); // Should not move
  });

  test('should prevent piece from rotating if it would collide', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    // Place I-piece at left edge
    game.currentPiece.type = 'I';
    game.currentPiece.x = 0;

    const originalShape = JSON.stringify(game.currentPiece.shape);

    // Try to rotate (would go out of bounds)
    game.rotate();

    // Rotation should be prevented or piece should be wall-kicked
    // If no wall kick, shape stays same; if wall kick, x position changes
    const rotationHappened = JSON.stringify(game.currentPiece.shape) !== originalShape;
    if (rotationHappened) {
      // Wall kick should have moved piece away from wall
      expect(game.currentPiece.x).toBeGreaterThan(0);
    } else {
      // Rotation was blocked
      expect(game.currentPiece.x).toBe(0);
    }
  });

  test('should lock piece when it reaches bottom', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    const pieceType = game.currentPiece.type;

    // Move piece to bottom
    while (!game.board.isColliding(game.currentPiece)) {
      game.currentPiece.y++;
    }
    game.currentPiece.y--; // Step back to valid position

    // Lock piece
    game.lockPiece();

    // Board should have the piece placed
    expect(game.board.grid[19].some(cell => cell !== 0)).toBe(true);

    // New piece should be spawned
    expect(game.currentPiece.y).toBe(0);
  });
});
