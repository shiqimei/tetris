import { describe, test, expect, beforeEach } from '@jest/globals';

/**
 * Scoring System Unit Tests
 *
 * Tests for REQ-3: Scoring System - Soft drop, hard drop, and line clear scoring
 * Design Spec: "Line clear scoring following classic Tetris formula:
 *   - Single line: 100 × level
 *   - Double lines: 300 × level
 *   - Triple lines: 500 × level
 *   - Tetris (4 lines): 800 × level"
 *
 * Tests for REQ-4: Game Progression - Level advancement and scoring
 */

describe('Soft Drop Scoring', () => {
  test('should award 1 point per cell for soft drop', async () => {
    const { ScoringEngine } = await import('../../src/game/ScoringEngine.js');
    const scoring = new ScoringEngine();

    const points = scoring.calculateSoftDrop(5); // 5 cells dropped

    expect(points).toBe(5);
  });

  test('should award 0 points for gravity drops', async () => {
    const { ScoringEngine } = await import('../../src/game/ScoringEngine.js');
    const scoring = new ScoringEngine();

    const points = scoring.calculateGravityDrop(10);

    expect(points).toBe(0);
  });

  test('should accumulate soft drop points', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    game.softDrop(3);
    game.softDrop(2);

    expect(game.score).toBe(5);
  });
});

describe('Hard Drop Scoring', () => {
  test('should award 2 points per cell for hard drop', async () => {
    const { ScoringEngine } = await import('../../src/game/ScoringEngine.js');
    const scoring = new ScoringEngine();

    const points = scoring.calculateHardDrop(5); // 5 cells dropped

    expect(points).toBe(10);
  });

  test('should calculate hard drop distance correctly', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    // Place piece at y=5, hard drop should go to bottom
    game.currentPiece.y = 5;
    const distanceDropped = game.hardDrop();

    expect(distanceDropped).toBeGreaterThan(0);
    expect(game.score).toBe(distanceDropped * 2);
  });
});

describe('Line Clear Scoring', () => {
  test('should award 100 points for single line at level 1', async () => {
    const { ScoringEngine } = await import('../../src/game/ScoringEngine.js');
    const scoring = new ScoringEngine();

    const points = scoring.calculateLineClear(1, 1); // 1 line, level 1

    expect(points).toBe(100);
  });

  test('should award 300 points for double lines at level 1', async () => {
    const { ScoringEngine } = await import('../../src/game/ScoringEngine.js');
    const scoring = new ScoringEngine();

    const points = scoring.calculateLineClear(2, 1);

    expect(points).toBe(300);
  });

  test('should award 500 points for triple lines at level 1', async () => {
    const { ScoringEngine } = await import('../../src/game/ScoringEngine.js');
    const scoring = new ScoringEngine();

    const points = scoring.calculateLineClear(3, 1);

    expect(points).toBe(500);
  });

  test('should award 800 points for tetris (4 lines) at level 1', async () => {
    const { ScoringEngine } = await import('../../src/game/ScoringEngine.js');
    const scoring = new ScoringEngine();

    const points = scoring.calculateLineClear(4, 1);

    expect(points).toBe(800);
  });

  test('should scale line clear points by level', async () => {
    const { ScoringEngine } = await import('../../src/game/ScoringEngine.js');
    const scoring = new ScoringEngine();

    expect(scoring.calculateLineClear(1, 5)).toBe(500); // 100 × 5
    expect(scoring.calculateLineClear(2, 5)).toBe(1500); // 300 × 5
    expect(scoring.calculateLineClear(3, 5)).toBe(2500); // 500 × 5
    expect(scoring.calculateLineClear(4, 5)).toBe(4000); // 800 × 5
  });

  test('should scale line clear points at level 10', async () => {
    const { ScoringEngine } = await import('../../src/game/ScoringEngine.js');
    const scoring = new ScoringEngine();

    expect(scoring.calculateLineClear(4, 10)).toBe(8000); // 800 × 10
  });
});

describe('Level Progression', () => {
  test('should start at level 1', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    expect(game.level).toBe(1);
  });

  test('should advance level after clearing 10 lines', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    game.linesCleared = 10;
    game.updateLevel();

    expect(game.level).toBe(2);
  });

  test('should advance to level 3 after 20 lines', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    game.linesCleared = 20;
    game.updateLevel();

    expect(game.level).toBe(3);
  });

  test('should track total lines cleared', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    game.clearLines(4); // Clear tetris

    expect(game.linesCleared).toBe(4);
  });
});

describe('Gravity Speed', () => {
  test('should increase fall speed with each level', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    const level1Speed = game.getGravitySpeed(1);
    const level2Speed = game.getGravitySpeed(2);
    const level5Speed = game.getGravitySpeed(5);

    // Higher levels should have faster (lower delay) speeds
    expect(level2Speed).toBeLessThan(level1Speed);
    expect(level5Speed).toBeLessThan(level2Speed);
  });

  test('should calculate gravity delay based on level', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    // Level 1 should be slowest
    expect(game.getGravitySpeed(1)).toBeGreaterThan(500);

    // Level 10 should be much faster
    expect(game.getGravitySpeed(10)).toBeLessThan(200);
  });
});

describe('Score Display and Tracking', () => {
  test('should maintain cumulative score', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    game.addScore(100);
    game.addScore(300);
    game.addScore(50);

    expect(game.score).toBe(450);
  });

  test('should never have negative score', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    game.score = 0;
    // Even if somehow negative points are attempted
    game.addScore(-50);

    expect(game.score).toBeGreaterThanOrEqual(0);
  });
});
