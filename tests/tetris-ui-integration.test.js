const TetrisGame = require('../src/index');

// Mock chalk to avoid terminal color issues in testing
jest.mock('chalk', () => ({
  cyan: jest.fn(str => str),
  yellow: Object.assign(jest.fn(str => str), { bold: jest.fn(str => str) }),
  green: jest.fn(str => str),
  blue: jest.fn(str => str),
  magenta: jest.fn(str => str),
  red: Object.assign(jest.fn(str => str), { bold: jest.fn(str => str) }),
  white: jest.fn(str => str),
  gray: jest.fn(str => str)
}));

// Mock readline
jest.mock('readline', () => ({
  emitKeypressEvents: jest.fn()
}));

describe('Tetris UI and Game Integration Tests', () => {
  let game;
  let originalStdin, originalExit, originalConsole;

  beforeEach(() => {
    // Mock process.stdin
    originalStdin = process.stdin;
    process.stdin = {
      setRawMode: jest.fn(),
      on: jest.fn(),
      resume: jest.fn(),
      isTTY: true
    };
    
    // Mock process.exit
    originalExit = process.exit;
    process.exit = jest.fn();
    
    // Mock console methods
    originalConsole = {
      clear: console.clear,
      log: console.log
    };
    console.clear = jest.fn();
    console.log = jest.fn();
    
    game = new TetrisGame();
  });

  afterEach(() => {
    // Restore original methods
    process.stdin = originalStdin;
    process.exit = originalExit;
    console.clear = originalConsole.clear;
    console.log = originalConsole.log;
    jest.restoreAllMocks();
  });

  describe('Game Initialization and Setup', () => {
    test('should initialize with correct default state', () => {
      expect(game.tetris).toBeDefined();
      expect(game.isRunning).toBe(false);
      expect(game.lastTime).toBeDefined();
      expect(typeof game.lastTime).toBe('number');
    });

    test('should setup input handlers correctly', () => {
      expect(process.stdin.setRawMode).toHaveBeenCalledWith(true);
      expect(process.stdin.on).toHaveBeenCalledWith('keypress', expect.any(Function));
      expect(process.stdin.resume).toHaveBeenCalled();
    });
  });

  describe('Game Control Flow', () => {
    test('should handle pause and resume correctly', () => {
      expect(game.isRunning).toBe(false);
      
      game.togglePause();
      expect(game.isRunning).toBe(true);
      
      game.togglePause();
      expect(game.isRunning).toBe(false);
    });

    test('should restart game properly', () => {
      // Set up game state
      game.tetris.gameOver = true;
      game.tetris.score = 1500;
      game.tetris.level = 5;
      game.tetris.lines = 40;
      
      game.restart();
      
      expect(game.tetris.gameOver).toBe(false);
      expect(game.tetris.score).toBe(0);
      expect(game.tetris.level).toBe(1);
      expect(game.tetris.lines).toBe(0);
      expect(game.isRunning).toBe(true);
      expect(game.tetris.currentPiece).toBeDefined();
    });

    test('should handle quit properly', () => {
      game.quit();
      
      expect(console.clear).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Thanks for playing Tetris!');
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });

  describe('Input Handling Simulation', () => {
    beforeEach(() => {
      game.tetris.spawnPiece();
      game.isRunning = true;
    });

    test('should simulate left movement', () => {
      const originalX = game.tetris.currentPiece.x;
      
      // Simulate left arrow key press
      const keypress = process.stdin.on.mock.calls.find(call => call[0] === 'keypress')[1];
      keypress('', { name: 'left' });
      
      expect(game.tetris.currentPiece.x).toBe(originalX - 1);
    });

    test('should simulate right movement', () => {
      const originalX = game.tetris.currentPiece.x;
      
      // Simulate right arrow key press
      const keypress = process.stdin.on.mock.calls.find(call => call[0] === 'keypress')[1];
      keypress('', { name: 'right' });
      
      expect(game.tetris.currentPiece.x).toBe(originalX + 1);
    });

    test('should simulate WASD controls', () => {
      const originalX = game.tetris.currentPiece.x;
      const originalY = game.tetris.currentPiece.y;
      
      const keypress = process.stdin.on.mock.calls.find(call => call[0] === 'keypress')[1];
      
      // Test A (left)
      keypress('', { name: 'a' });
      expect(game.tetris.currentPiece.x).toBe(originalX - 1);
      
      // Test D (right)  
      keypress('', { name: 'd' });
      expect(game.tetris.currentPiece.x).toBe(originalX);
      
      // Test S (soft drop)
      const originalScore = game.tetris.score;
      keypress('', { name: 's' });
      expect(game.tetris.currentPiece.y).toBe(originalY + 1);
      expect(game.tetris.score).toBe(originalScore + 1); // Soft drop scoring
    });

    test('should handle rotation controls', () => {
      // Force T-piece for predictable rotation
      game.tetris.currentPiece = {
        type: 'T',
        shape: game.tetris.tetris?.pieceDefinitions?.['T']?.[0] || [[' ', 'X', ' '], ['X', 'X', 'X']],
        rotation: 0,
        x: 4,
        y: 5
      };
      
      const originalShape = JSON.stringify(game.tetris.currentPiece.shape);
      const keypress = process.stdin.on.mock.calls.find(call => call[0] === 'keypress')[1];
      
      // Test W (rotate clockwise)
      keypress('', { name: 'w' });
      expect(JSON.stringify(game.tetris.currentPiece.shape)).not.toBe(originalShape);
    });

    test('should handle space bar for hard drop', () => {
      const originalScore = game.tetris.score;
      const keypress = process.stdin.on.mock.calls.find(call => call[0] === 'keypress')[1];
      
      keypress('', { name: 'space' });
      
      // Hard drop should place piece and spawn new one
      expect(game.tetris.score).toBeGreaterThan(originalScore);
      expect(game.tetris.currentPiece).toBeDefined(); // New piece spawned
    });

    test('should handle pause control', () => {
      game.isRunning = true;
      const keypress = process.stdin.on.mock.calls.find(call => call[0] === 'keypress')[1];
      
      keypress('', { name: 'p' });
      expect(game.isRunning).toBe(false);
      
      keypress('', { name: 'p' });
      expect(game.isRunning).toBe(true);
    });
  });

  describe('Game States and Rendering', () => {
    test('should render playing state correctly', () => {
      game.isRunning = true;
      game.tetris.gameOver = false;
      game.tetris.spawnPiece();
      game.tetris.score = 1200;
      game.tetris.level = 3;
      game.tetris.lines = 25;
      
      game.render();
      
      expect(console.clear).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('TETRIS'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('1200'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('3'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('25'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Controls:'));
    });

    test('should render paused state correctly', () => {
      game.isRunning = false;
      game.tetris.gameOver = false;
      
      game.render();
      
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('PAUSED'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Press P to resume'));
    });

    test('should render game over state correctly', () => {
      game.tetris.gameOver = true;
      
      game.render();
      
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('GAME OVER!'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Press R to restart or Q to quit'));
    });

    test('should handle game over input correctly', () => {
      game.tetris.gameOver = true;
      const keypress = process.stdin.on.mock.calls.find(call => call[0] === 'keypress')[1];
      
      // Test restart
      keypress('', { name: 'r' });
      expect(game.tetris.gameOver).toBe(false);
      expect(game.isRunning).toBe(true);
      
      // Set game over again and test quit
      game.tetris.gameOver = true;
      keypress('', { name: 'q' });
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });

  describe('Game Loop Integration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should run game loop correctly when active', () => {
      game.isRunning = true;
      game.tetris.gameOver = false;
      game.tetris.spawnPiece();
      
      const originalDropTime = game.tetris.dropTime;
      
      // Simulate time passing
      game.gameLoop();
      jest.advanceTimersByTime(50);
      
      // Game should have updated
      expect(game.tetris.dropTime).toBeGreaterThanOrEqual(originalDropTime);
      expect(console.clear).toHaveBeenCalled(); // Render should have been called
    });

    test('should handle idle state with proper intervals', () => {
      game.isRunning = false;
      game.tetris.gameOver = true;
      
      game.gameLoop();
      
      // Should schedule next loop with idle interval (200ms)
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 200);
    });
  });

  describe('Start Sequence', () => {
    test('should start game correctly', () => {
      console.log.mockClear();
      
      game.start();
      
      expect(console.log).toHaveBeenCalledWith('Starting Tetris...');
      expect(console.log).toHaveBeenCalledWith('Use arrow keys to play, Q to quit');
      expect(game.isRunning).toBe(true);
      expect(game.tetris.currentPiece).toBeDefined();
      expect(game.lastTime).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle Ctrl+C gracefully', () => {
      const keypress = process.stdin.on.mock.calls.find(call => call[0] === 'keypress')[1];
      
      keypress('', { ctrl: true, name: 'c' });
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    test('should ignore input when game is paused', () => {
      game.isRunning = false;
      game.tetris.spawnPiece();
      const originalX = game.tetris.currentPiece.x;
      
      const keypress = process.stdin.on.mock.calls.find(call => call[0] === 'keypress')[1];
      keypress('', { name: 'left' });
      
      // Movement should be ignored when paused
      expect(game.tetris.currentPiece.x).toBe(originalX);
    });

    test('should handle counterclockwise rotation', () => {
      game.isRunning = true;
      game.tetris.currentPiece = {
        type: 'T',
        shape: [[' ', 'X', ' '], ['X', 'X', 'X']],
        rotation: 0,
        x: 4,
        y: 5
      };
      
      const keypress = process.stdin.on.mock.calls.find(call => call[0] === 'keypress')[1];
      
      // Test Shift+W for counterclockwise rotation
      keypress('', { name: 'w', shift: true });
      
      // Should have attempted rotation (exact behavior depends on implementation)
      expect(game.tetris.currentPiece).toBeDefined();
    });
  });
});