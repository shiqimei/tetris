import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

/**
 * Game Loop Integration Tests
 *
 * Tests for Design Spec: "Use setTimeout with delta-time calculation. This provides
 * precise control over game speed, enables proper pause functionality"
 *
 * Tests for NFR-1: Performance - Consistent 30-60 FPS rendering rate
 */

describe('Game Loop Initialization', () => {
  test('should initialize game loop with proper timing', async () => {
    const { GameLoop } = await import('../../src/game/GameLoop.js');
    const loop = new GameLoop();

    expect(loop).toBeDefined();
    expect(loop.isRunning).toBe(false);
    expect(loop.targetFPS).toBeGreaterThanOrEqual(30);
    expect(loop.targetFPS).toBeLessThanOrEqual(60);
  });

  test('should start game loop when start() is called', async () => {
    const { GameLoop } = await import('../../src/game/GameLoop.js');
    const loop = new GameLoop();

    loop.start();

    expect(loop.isRunning).toBe(true);
  });

  test('should stop game loop when stop() is called', async () => {
    const { GameLoop } = await import('../../src/game/GameLoop.js');
    const loop = new GameLoop();

    loop.start();
    loop.stop();

    expect(loop.isRunning).toBe(false);
  });
});

describe('Delta Time Calculation', () => {
  test('should calculate delta time between frames', async () => {
    const { GameLoop } = await import('../../src/game/GameLoop.js');
    let deltaTime = 0;

    const loop = new GameLoop((dt) => {
      deltaTime = dt;
    });

    loop.start();

    // Wait for at least one frame
    await new Promise(resolve => setTimeout(resolve, 50));

    loop.stop();

    expect(deltaTime).toBeGreaterThan(0);
    expect(deltaTime).toBeLessThan(1000); // Should be reasonable (less than 1 second)
  });

  test('should maintain consistent timing across frames', async () => {
    const { GameLoop } = await import('../../src/game/GameLoop.js');
    const deltaTimes = [];

    const loop = new GameLoop((dt) => {
      deltaTimes.push(dt);
    });

    loop.start();

    // Run for a short period
    await new Promise(resolve => setTimeout(resolve, 200));

    loop.stop();

    expect(deltaTimes.length).toBeGreaterThan(3);

    // Delta times should be relatively consistent (within 50% variance)
    const avgDelta = deltaTimes.reduce((a, b) => a + b, 0) / deltaTimes.length;
    const maxVariance = avgDelta * 0.5;

    deltaTimes.forEach(dt => {
      expect(Math.abs(dt - avgDelta)).toBeLessThan(maxVariance);
    });
  });
});

describe('Frame Rate Control', () => {
  test('should target 60 FPS by default', async () => {
    const { GameLoop } = await import('../../src/game/GameLoop.js');
    const loop = new GameLoop();

    expect(loop.targetFPS).toBe(60);
  });

  test('should allow custom FPS target', async () => {
    const { GameLoop } = await import('../../src/game/GameLoop.js');
    const loop = new GameLoop(null, { targetFPS: 30 });

    expect(loop.targetFPS).toBe(30);
  });

  test('should throttle to target FPS', async () => {
    const { GameLoop } = await import('../../src/game/GameLoop.js');
    let frameCount = 0;

    const loop = new GameLoop(() => {
      frameCount++;
    }, { targetFPS: 30 });

    loop.start();

    // Run for 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));

    loop.stop();

    // Should be approximately 30 frames (±20% tolerance)
    expect(frameCount).toBeGreaterThan(24);
    expect(frameCount).toBeLessThan(36);
  });
});

describe('Pause Functionality', () => {
  test('should pause game loop updates', async () => {
    const { GameLoop } = await import('../../src/game/GameLoop.js');
    let updateCount = 0;

    const loop = new GameLoop(() => {
      updateCount++;
    });

    loop.start();
    await new Promise(resolve => setTimeout(resolve, 100));

    const countBeforePause = updateCount;

    loop.pause();
    await new Promise(resolve => setTimeout(resolve, 100));

    loop.stop();

    // Update count should not have increased during pause
    expect(updateCount).toBe(countBeforePause);
  });

  test('should resume game loop after pause', async () => {
    const { GameLoop } = await import('../../src/game/GameLoop.js');
    let updateCount = 0;

    const loop = new GameLoop(() => {
      updateCount++;
    });

    loop.start();
    loop.pause();
    loop.resume();

    await new Promise(resolve => setTimeout(resolve, 100));

    loop.stop();

    expect(updateCount).toBeGreaterThan(0);
  });
});

describe('Gravity System Integration', () => {
  let game;

  beforeEach(async () => {
    const { Game } = await import('../../src/game/Game.js');
    game = new Game();
  });

  test('should move piece down automatically based on gravity', async () => {
    const initialY = game.currentPiece.y;

    game.start();

    // Wait for gravity to take effect
    const gravityDelay = game.getGravitySpeed(game.level);
    await new Promise(resolve => setTimeout(resolve, gravityDelay + 100));

    game.stop();

    expect(game.currentPiece.y).toBeGreaterThan(initialY);
  });

  test('should increase gravity speed at higher levels', async () => {
    const level1Gravity = game.getGravitySpeed(1);
    const level5Gravity = game.getGravitySpeed(5);
    const level10Gravity = game.getGravitySpeed(10);

    expect(level5Gravity).toBeLessThan(level1Gravity);
    expect(level10Gravity).toBeLessThan(level5Gravity);
  });

  test('should apply gravity without awarding points', async () => {
    const initialScore = game.score;
    const initialY = game.currentPiece.y;

    game.start();

    // Wait for gravity
    await new Promise(resolve => setTimeout(resolve, game.getGravitySpeed(1) + 100));

    game.stop();

    // Piece should move down but score should not change
    expect(game.currentPiece.y).toBeGreaterThan(initialY);
    expect(game.score).toBe(initialScore);
  });
});

describe('Performance Requirements', () => {
  test('should maintain 30+ FPS under normal conditions', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();
    let frameCount = 0;
    let lastTime = Date.now();

    const testDuration = 1000; // 1 second

    game.onRender = () => {
      frameCount++;
    };

    game.start();

    await new Promise(resolve => setTimeout(resolve, testDuration));

    game.stop();

    const fps = frameCount / (testDuration / 1000);

    expect(fps).toBeGreaterThanOrEqual(30); // NFR-1: Consistent 30-60 FPS
  });

  test('should complete frame update within 33ms (30 FPS)', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();
    const updateTimes = [];

    game.onUpdate = () => {
      const start = Date.now();
      game.update(16); // Simulate 60 FPS delta
      const end = Date.now();
      updateTimes.push(end - start);
    };

    game.start();
    await new Promise(resolve => setTimeout(resolve, 500));
    game.stop();

    // Most updates should complete quickly
    const avgUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
    expect(avgUpdateTime).toBeLessThan(33); // Should be fast enough for 30 FPS
  });
});

describe('Cleanup and Exit', () => {
  test('should clean up resources on stop', async () => {
    const { GameLoop } = await import('../../src/game/GameLoop.js');
    const loop = new GameLoop();

    loop.start();
    loop.stop();

    expect(loop.isRunning).toBe(false);
    expect(loop.timerId).toBeNull();
  });

  test('should restore terminal state on game exit', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    game.start();
    game.stop();

    // Should call cleanup functions
    expect(game.cleanupCalled).toBe(true);
  });

  test('should handle SIGINT for clean exit', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    game.start();

    // Simulate SIGINT
    game.handleExit();

    expect(game.isRunning).toBe(false);
    expect(game.cleanupCalled).toBe(true);
  });
});

describe('Input Integration with Game Loop', () => {
  test('should process input during game loop', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    const initialX = game.currentPiece.x;

    game.start();

    // Simulate input
    game.handleInput('moveLeft');

    await new Promise(resolve => setTimeout(resolve, 50));

    game.stop();

    expect(game.currentPiece.x).toBeLessThan(initialX);
  });

  test('should queue and process multiple inputs', async () => {
    const { Game } = await import('../../src/game/Game.js');
    const game = new Game();

    game.start();

    // Queue multiple inputs
    game.handleInput('moveLeft');
    game.handleInput('moveLeft');
    game.handleInput('rotate');

    await new Promise(resolve => setTimeout(resolve, 100));

    game.stop();

    // All inputs should have been processed
    expect(game.currentPiece.x).toBeLessThan(3); // Moved left twice
  });
});
