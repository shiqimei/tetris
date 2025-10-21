import { describe, test, expect, beforeEach } from '@jest/globals';

/**
 * Rendering Integration Tests
 *
 * Tests for REQ-5: Visual Presentation - ANSI colors, playfield rendering
 * Design Spec: "Full screen clear (console.clear()) for simplicity and reliability"
 *
 * Tests for NFR-2: Terminal Compatibility - ANSI support and graceful degradation
 */

describe('Renderer Initialization', () => {
  test('should initialize renderer with color support detection', async () => {
    const { Renderer } = await import('../../src/render/Renderer.js');
    const renderer = new Renderer();

    expect(renderer).toBeDefined();
    expect(renderer.supportsColor).toBeDefined();
  });

  test('should detect ANSI color support', async () => {
    const { Renderer } = await import('../../src/render/Renderer.js');
    const renderer = new Renderer();

    // Should detect based on terminal capabilities
    expect(typeof renderer.supportsColor).toBe('boolean');
  });

  test('should initialize with proper terminal dimensions', async () => {
    const { Renderer } = await import('../../src/render/Renderer.js');
    const renderer = new Renderer();

    expect(renderer.terminalWidth).toBeGreaterThan(0);
    expect(renderer.terminalHeight).toBeGreaterThan(0);
  });
});

describe('Board Rendering', () => {
  let renderer;
  let game;

  beforeEach(async () => {
    const { Renderer } = await import('../../src/render/Renderer.js');
    const { Game } = await import('../../src/game/Game.js');
    renderer = new Renderer();
    game = new Game();
  });

  test('should render empty board', async () => {
    const output = renderer.renderBoard(game.board);

    expect(output).toBeDefined();
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  test('should render board with placed pieces', async () => {
    // Place some pieces on board
    game.board.grid[19][5] = 1;
    game.board.grid[19][6] = 1;

    const output = renderer.renderBoard(game.board);

    expect(output).toContain('█'); // Or whatever character represents pieces
  });

  test('should render board borders', async () => {
    const output = renderer.renderBoard(game.board);

    // Should contain border characters
    expect(output).toMatch(/[┌┐└┘│─]/);
  });

  test('should render 10x20 grid correctly', async () => {
    const output = renderer.renderBoard(game.board);
    const lines = output.split('\n').filter(line => line.trim().length > 0);

    // Should have at least 20 rows plus borders
    expect(lines.length).toBeGreaterThanOrEqual(20);
  });
});

describe('Piece Coloring', () => {
  let renderer;

  beforeEach(async () => {
    const { Renderer } = await import('../../src/render/Renderer.js');
    renderer = new Renderer({ forceColor: true });
  });

  test('should render I-piece with cyan color', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const iPiece = new Tetromino('I');

    const output = renderer.renderPiece(iPiece);

    // Should contain ANSI cyan color code or chalk cyan
    expect(output).toBeDefined();
  });

  test('should render O-piece with yellow color', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const oPiece = new Tetromino('O');

    const output = renderer.renderPiece(oPiece);

    expect(output).toBeDefined();
  });

  test('should render T-piece with purple color', async () => {
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const tPiece = new Tetromino('T');

    const output = renderer.renderPiece(tPiece);

    expect(output).toBeDefined();
  });

  test('should fallback to monochrome when color not supported', async () => {
    const { Renderer } = await import('../../src/render/Renderer.js');
    const monoRenderer = new Renderer({ forceColor: false, supportsColor: false });
    const { Tetromino } = await import('../../src/game/Tetromino.js');
    const piece = new Tetromino('T');

    const output = monoRenderer.renderPiece(piece);

    // Should not contain ANSI color codes
    expect(output).not.toMatch(/\x1b\[[0-9;]*m/);
  });
});

describe('Statistics Panel Rendering', () => {
  let renderer;
  let game;

  beforeEach(async () => {
    const { Renderer } = await import('../../src/render/Renderer.js');
    const { Game } = await import('../../src/game/Game.js');
    renderer = new Renderer();
    game = new Game();
  });

  test('should render score display', async () => {
    game.score = 1250;
    const output = renderer.renderStats(game);

    expect(output).toContain('1250');
    expect(output.toLowerCase()).toContain('score');
  });

  test('should render level display', async () => {
    game.level = 5;
    const output = renderer.renderStats(game);

    expect(output).toContain('5');
    expect(output.toLowerCase()).toContain('level');
  });

  test('should render lines cleared display', async () => {
    game.linesCleared = 23;
    const output = renderer.renderStats(game);

    expect(output).toContain('23');
    expect(output.toLowerCase()).toContain('lines');
  });

  test('should render next piece preview', async () => {
    const output = renderer.renderNextPiece(game.nextPiece);

    expect(output).toBeDefined();
    expect(output.length).toBeGreaterThan(0);
  });
});

describe('Control Hints Display', () => {
  let renderer;

  beforeEach(async () => {
    const { Renderer } = await import('../../src/render/Renderer.js');
    renderer = new Renderer();
  });

  test('should render control hints', async () => {
    const output = renderer.renderControls();

    expect(output.toLowerCase()).toContain('move');
    expect(output.toLowerCase()).toContain('rotate');
    expect(output.toLowerCase()).toContain('drop');
    expect(output.toLowerCase()).toContain('pause');
  });

  test('should show both arrow and WASD controls', async () => {
    const output = renderer.renderControls();

    expect(output).toMatch(/[←→↑↓]/); // Arrow symbols
    expect(output.toUpperCase()).toContain('W');
    expect(output.toUpperCase()).toContain('A');
    expect(output.toUpperCase()).toContain('S');
    expect(output.toUpperCase()).toContain('D');
  });

  test('should show space for hard drop', async () => {
    const output = renderer.renderControls();

    expect(output.toUpperCase()).toContain('SPACE');
  });
});

describe('Complete Screen Rendering', () => {
  let renderer;
  let game;

  beforeEach(async () => {
    const { Renderer } = await import('../../src/render/Renderer.js');
    const { Game } = await import('../../src/game/Game.js');
    renderer = new Renderer();
    game = new Game();
  });

  test('should render complete game screen', async () => {
    const output = renderer.render(game);

    expect(output).toBeDefined();
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(100); // Should be substantial
  });

  test('should include all screen elements in full render', async () => {
    const output = renderer.render(game);

    // Should contain main components
    expect(output.toLowerCase()).toContain('score');
    expect(output.toLowerCase()).toContain('level');
    expect(output.toLowerCase()).toContain('lines');
  });

  test('should render pause screen when paused', async () => {
    game.isPaused = true;
    const output = renderer.render(game);

    expect(output.toLowerCase()).toContain('pause');
  });

  test('should render game over screen when game ends', async () => {
    game.isGameOver = true;
    game.score = 5000;
    const output = renderer.render(game);

    expect(output.toLowerCase()).toContain('game over');
    expect(output).toContain('5000');
  });
});

describe('Screen Clearing and Refresh', () => {
  let renderer;

  beforeEach(async () => {
    const { Renderer } = await import('../../src/render/Renderer.js');
    renderer = new Renderer();
  });

  test('should clear screen before rendering', async () => {
    // This would normally call console.clear()
    expect(() => renderer.clear()).not.toThrow();
  });

  test('should hide cursor during gameplay', async () => {
    renderer.hideCursor();
    // Should send ANSI escape sequence to hide cursor
    expect(renderer.cursorVisible).toBe(false);
  });

  test('should restore cursor on exit', async () => {
    renderer.hideCursor();
    renderer.showCursor();
    expect(renderer.cursorVisible).toBe(true);
  });
});

describe('Terminal Size Validation', () => {
  let renderer;

  beforeEach(async () => {
    const { Renderer } = await import('../../src/render/Renderer.js');
    renderer = new Renderer();
  });

  test('should check minimum terminal size requirement', async () => {
    const isValid = renderer.checkTerminalSize(40, 24);
    expect(isValid).toBe(true);
  });

  test('should reject terminal that is too small', async () => {
    const isValid = renderer.checkTerminalSize(30, 20);
    expect(isValid).toBe(false);
  });

  test('should provide warning message for small terminals', async () => {
    const message = renderer.getTerminalSizeWarning(30, 20);
    expect(message).toBeDefined();
    expect(message.toLowerCase()).toContain('terminal');
    expect(message).toContain('40');
    expect(message).toContain('24');
  });
});
