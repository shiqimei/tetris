const TetrisGame = require('../src/index');

describe('Tetris Integration Tests', () => {
  let game;
  let originalConsole;
  let consoleOutput;
  let originalProcessStdin;

  beforeEach(() => {
    // Mock console methods
    originalConsole = {
      clear: console.clear,
      log: console.log
    };
    consoleOutput = [];
    console.clear = jest.fn();
    console.log = jest.fn((msg) => consoleOutput.push(msg));

    // Mock process.stdin
    originalProcessStdin = process.stdin;
    process.stdin = {
      isTTY: true,
      setRawMode: jest.fn(),
      on: jest.fn(),
      resume: jest.fn()
    };

    // Mock process methods
    process.on = jest.fn();
    process.exit = jest.fn();
  });

  afterEach(() => {
    // Restore original console methods
    console.clear = originalConsole.clear;
    console.log = originalConsole.log;

    // Restore process.stdin
    process.stdin = originalProcessStdin;
    
    if (game) {
      game = null;
    }
  });

  describe('Game Initialization', () => {
    test('should initialize TetrisGame with correct default state', () => {
      game = new TetrisGame();
      
      expect(game.tetris).toBeDefined();
      expect(game.isRunning).toBe(false);
      expect(game.lastTime).toBeDefined();
    });

    test('should setup input handling during construction', () => {
      game = new TetrisGame();
      
      // Verify stdin methods were called
      expect(process.stdin.setRawMode).toHaveBeenCalledWith(true);
      expect(process.stdin.on).toHaveBeenCalled();
      expect(process.stdin.resume).toHaveBeenCalled();
    });
  });

  describe('Game Controls', () => {
    beforeEach(() => {
      game = new TetrisGame();
      game.isRunning = true;
      game.tetris.spawnPiece();
    });

    test('should handle pause/resume toggle', () => {
      const initialState = game.isRunning;
      game.togglePause();
      expect(game.isRunning).toBe(!initialState);
      
      game.togglePause();
      expect(game.isRunning).toBe(initialState);
    });

    test('should restart game correctly', () => {
      // Modify game state
      game.tetris.score = 1000;
      game.tetris.gameOver = true;
      game.isRunning = false;
      
      game.restart();
      
      expect(game.tetris.score).toBe(0);
      expect(game.tetris.gameOver).toBe(false);
      expect(game.isRunning).toBe(true);
      expect(game.tetris.currentPiece).not.toBeNull();
    });

    test('should quit game gracefully', () => {
      game.quit();
      
      expect(console.clear).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Thanks for playing Tetris!');
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });

  describe('Game Rendering', () => {
    beforeEach(() => {
      game = new TetrisGame();
      game.tetris.spawnPiece();
    });

    test('should render game display correctly', () => {
      game.render();
      
      expect(console.clear).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalled();
      
      // Check that score, level, and lines are displayed
      const output = consoleOutput.join(' ');
      expect(output).toContain('TETRIS');
      expect(output).toContain('Score:');
      expect(output).toContain('Level:');
      expect(output).toContain('Lines:');
    });

    test('should show game over screen when game ends', () => {
      game.tetris.gameOver = true;
      game.render();
      
      const output = consoleOutput.join(' ');
      expect(output).toContain('GAME OVER!');
      expect(output).toContain('Press R to restart or Q to quit');
    });

    test('should show pause screen when paused', () => {
      game.isRunning = false;
      game.render();
      
      const output = consoleOutput.join(' ');
      expect(output).toContain('PAUSED');
      expect(output).toContain('Press P to resume');
    });

    test('should show controls when game is running', () => {
      game.isRunning = true;
      game.render();
      
      const output = consoleOutput.join(' ');
      expect(output).toContain('Controls:');
      expect(output).toContain('Move/Rotate');
      expect(output).toContain('Hard Drop');
      expect(output).toContain('Pause');
      expect(output).toContain('Quit');
    });
  });

  describe('Full Game Simulation', () => {
    test('should complete a full game cycle', () => {
      game = new TetrisGame();
      
      // Simulate starting the game
      game.isRunning = true;
      game.tetris.spawnPiece();
      
      const initialPiece = game.tetris.currentPiece;
      expect(initialPiece).not.toBeNull();
      
      // Simulate piece movement
      const moved = game.tetris.movePiece(1, 0);
      expect(moved).toBe(true);
      
      // Simulate hard drop
      game.tetris.hardDrop();
      
      // Should spawn new piece
      expect(game.tetris.currentPiece).not.toBeNull();
      expect(game.tetris.currentPiece).not.toBe(initialPiece);
    });

    test('should handle line clearing in full game context', () => {
      game = new TetrisGame();
      
      // Fill bottom row except one cell
      for (let x = 0; x < 9; x++) {
        game.tetris.board[19][x] = 'X';
      }
      
      // Create a piece that will complete the line
      game.tetris.currentPiece = {
        shape: [['X']],
        x: 9,
        y: 18
      };
      
      const originalScore = game.tetris.score;
      game.tetris.drop();
      
      // Should have cleared line and increased score
      expect(game.tetris.score).toBeGreaterThan(originalScore);
      expect(game.tetris.lines).toBe(1);
    });
  });
});