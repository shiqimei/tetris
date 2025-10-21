import { describe, test, expect, beforeEach } from '@jest/globals';

/**
 * Input Handling Unit Tests
 *
 * Tests for REQ-2: Player Controls - Dual control schemes (Arrow keys and WASD)
 * Design Spec: "Raw mode with keypress events. This is the standard approach for
 * terminal games, provides necessary responsiveness"
 *
 * Tests for NFR-5: User Experience - Immediate keypress detection (raw mode input)
 */

describe('Input Handler Initialization', () => {
  test('should initialize input handler with raw mode', async () => {
    const { InputHandler } = await import('../../src/input/InputHandler.js');
    const handler = new InputHandler();

    expect(handler).toBeDefined();
    expect(handler.rawModeEnabled).toBe(false); // Not enabled until start()
  });

  test('should enable raw mode when start() is called', async () => {
    const { InputHandler } = await import('../../src/input/InputHandler.js');
    const handler = new InputHandler();

    handler.start();

    expect(handler.rawModeEnabled).toBe(true);
  });

  test('should disable raw mode when stop() is called', async () => {
    const { InputHandler } = await import('../../src/input/InputHandler.js');
    const handler = new InputHandler();

    handler.start();
    handler.stop();

    expect(handler.rawModeEnabled).toBe(false);
  });
});

describe('Arrow Key Controls', () => {
  let handler;

  beforeEach(async () => {
    const { InputHandler } = await import('../../src/input/InputHandler.js');
    handler = new InputHandler();
  });

  test('should map left arrow to move left action', async () => {
    const action = handler.mapKeyToAction({ name: 'left' });

    expect(action).toBe('moveLeft');
  });

  test('should map right arrow to move right action', async () => {
    const action = handler.mapKeyToAction({ name: 'right' });

    expect(action).toBe('moveRight');
  });

  test('should map down arrow to soft drop action', async () => {
    const action = handler.mapKeyToAction({ name: 'down' });

    expect(action).toBe('softDrop');
  });

  test('should map up arrow to rotate action', async () => {
    const action = handler.mapKeyToAction({ name: 'up' });

    expect(action).toBe('rotate');
  });

  test('should map space to hard drop action', async () => {
    const action = handler.mapKeyToAction({ name: 'space' });

    expect(action).toBe('hardDrop');
  });
});

describe('WASD Controls', () => {
  let handler;

  beforeEach(async () => {
    const { InputHandler } = await import('../../src/input/InputHandler.js');
    handler = new InputHandler();
  });

  test('should map A key to move left action', async () => {
    const action = handler.mapKeyToAction({ name: 'a', sequence: 'a' });

    expect(action).toBe('moveLeft');
  });

  test('should map D key to move right action', async () => {
    const action = handler.mapKeyToAction({ name: 'd', sequence: 'd' });

    expect(action).toBe('moveRight');
  });

  test('should map S key to soft drop action', async () => {
    const action = handler.mapKeyToAction({ name: 's', sequence: 's' });

    expect(action).toBe('softDrop');
  });

  test('should map W key to rotate action', async () => {
    const action = handler.mapKeyToAction({ name: 'w', sequence: 'w' });

    expect(action).toBe('rotate');
  });
});

describe('Game Control Keys', () => {
  let handler;

  beforeEach(async () => {
    const { InputHandler } = await import('../../src/input/InputHandler.js');
    handler = new InputHandler();
  });

  test('should map P key to pause action', async () => {
    const action = handler.mapKeyToAction({ name: 'p', sequence: 'p' });

    expect(action).toBe('pause');
  });

  test('should map Q key to quit action', async () => {
    const action = handler.mapKeyToAction({ name: 'q', sequence: 'q' });

    expect(action).toBe('quit');
  });

  test('should map Escape key to quit action', async () => {
    const action = handler.mapKeyToAction({ name: 'escape', sequence: '\x1b' });

    expect(action).toBe('quit');
  });

  test('should map R key to restart action', async () => {
    const action = handler.mapKeyToAction({ name: 'r', sequence: 'r' });

    expect(action).toBe('restart');
  });
});

describe('Input Event Handling', () => {
  let handler;
  let capturedActions;

  beforeEach(async () => {
    const { InputHandler } = await import('../../src/input/InputHandler.js');
    handler = new InputHandler();
    capturedActions = [];

    handler.on('action', (action) => {
      capturedActions.push(action);
    });
  });

  test('should emit action events when keys are pressed', async () => {
    handler.handleKeyPress({ name: 'left' });

    expect(capturedActions).toContain('moveLeft');
  });

  test('should handle multiple rapid keypresses', async () => {
    handler.handleKeyPress({ name: 'left' });
    handler.handleKeyPress({ name: 'right' });
    handler.handleKeyPress({ name: 'down' });

    expect(capturedActions.length).toBe(3);
    expect(capturedActions).toEqual(['moveLeft', 'moveRight', 'softDrop']);
  });

  test('should ignore unknown keys', async () => {
    const action = handler.mapKeyToAction({ name: 'x', sequence: 'x' });

    expect(action).toBeNull();
  });
});

describe('Input Response Time', () => {
  test('should process input within 50ms target', async () => {
    const { InputHandler } = await import('../../src/input/InputHandler.js');
    const handler = new InputHandler();
    let actionReceived = false;

    handler.on('action', () => {
      actionReceived = true;
    });

    const startTime = Date.now();
    handler.handleKeyPress({ name: 'left' });

    // In real implementation, this should complete quickly
    await new Promise(resolve => setTimeout(resolve, 0));

    const elapsed = Date.now() - startTime;

    expect(actionReceived).toBe(true);
    expect(elapsed).toBeLessThan(50); // NFR-1: Input latency under 50ms
  });
});

describe('Case Insensitivity', () => {
  let handler;

  beforeEach(async () => {
    const { InputHandler } = await import('../../src/input/InputHandler.js');
    handler = new InputHandler();
  });

  test('should handle uppercase WASD keys', async () => {
    expect(handler.mapKeyToAction({ name: 'A', sequence: 'A' })).toBe('moveLeft');
    expect(handler.mapKeyToAction({ name: 'D', sequence: 'D' })).toBe('moveRight');
    expect(handler.mapKeyToAction({ name: 'S', sequence: 'S' })).toBe('softDrop');
    expect(handler.mapKeyToAction({ name: 'W', sequence: 'W' })).toBe('rotate');
  });

  test('should handle lowercase WASD keys', async () => {
    expect(handler.mapKeyToAction({ name: 'a', sequence: 'a' })).toBe('moveLeft');
    expect(handler.mapKeyToAction({ name: 'd', sequence: 'd' })).toBe('moveRight');
    expect(handler.mapKeyToAction({ name: 's', sequence: 's' })).toBe('softDrop');
    expect(handler.mapKeyToAction({ name: 'w', sequence: 'w' })).toBe('rotate');
  });
});
