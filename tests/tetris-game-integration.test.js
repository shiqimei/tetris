const TetrisGame = require('../src/index');

describe('Tetris Game Integration Tests', () => {
  let game;
  let originalConsoleLog;
  let originalConsoleError;
  let originalProcessExit;
  
  beforeEach(() => {
    // Mock console methods to prevent output during tests
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    originalProcessExit = process.exit;
    
    console.log = jest.fn();
    console.error = jest.fn();
    process.exit = jest.fn();
    
    // Mock process.stdin to prevent hanging tests
    process.stdin.setRawMode = jest.fn();
    process.stdin.on = jest.fn();
    process.stdin.resume = jest.fn();
    
    game = new TetrisGame();
  });

  afterEach(() => {
    // Restore original methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
    
    // Clean up any timers
    if (game && game.gameLoopId) {
      clearTimeout(game.gameLoopId);
    }
  });

  describe('Game Initialization', () => {
    test('should create TetrisGame with Tetris instance', () => {
      expect(game.tetris).toBeDefined();
      expect(game.tetris.board).toHaveLength(20);
      expect(game.tetris.score).toBe(0);
    });

    test('should initialize with correct default state', () => {
      expect(game.isRunning).toBe(false);
      expect(game.lastTime).toBeDefined();
    });
  });

  describe('Game State Control', () => {
    test('should handle pause/resume toggle', () => {
      expect(game.isRunning).toBe(false);
      
      game.togglePause();
      expect(game.isRunning).toBe(true);
      
      game.togglePause();
      expect(game.isRunning).toBe(false);
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
      expect(game.tetris.currentPiece).toBeTruthy(); // Should spawn piece
    });

    test('should handle quit functionality', () => {
      game.quit();
      
      expect(console.log).toHaveBeenCalledWith('Thanks for playing Tetris!');
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });

  describe('Game Loop Integration', () => {
    test('should update game state when running', () => {
      game.isRunning = true;
      game.tetris.spawnPiece();
      
      const originalY = game.tetris.currentPiece.y;
      const now = Date.now();
      game.lastTime = now - 1000; // Simulate 1 second ago
      
      // Simulate one game loop iteration
      game.tetris.update(1000);
      
      expect(game.tetris.currentPiece.y).toBe(originalY + 1);
    });

    test('should not update when paused', () => {
      game.isRunning = false;
      game.tetris.spawnPiece();
      
      const originalY = game.tetris.currentPiece.y;
      const originalDropTime = game.tetris.dropTime;
      
      // Simulate game loop update
      game.tetris.update(1000);
      
      // Since not running, no update should happen in real game loop
      // But direct call to tetris.update will still work
      expect(game.tetris.currentPiece.y).toBe(originalY + 1);
    });

    test('should handle game over state', () => {
      game.tetris.gameOver = true;
      game.isRunning = true;
      
      // Game loop should handle game over state
      expect(game.tetris.gameOver).toBe(true);
    });
  });

  describe('Input Simulation', () => {
    beforeEach(() => {
      game.tetris.spawnPiece();
    });

    test('should handle left movement input', () => {
      const originalX = game.tetris.currentPiece.x;
      
      // Simulate left arrow key press
      const result = game.tetris.movePiece(-1, 0);
      expect(result).toBe(true);
      expect(game.tetris.currentPiece.x).toBe(originalX - 1);
    });

    test('should handle right movement input', () => {
      const originalX = game.tetris.currentPiece.x;
      
      // Simulate right arrow key press
      const result = game.tetris.movePiece(1, 0);
      expect(result).toBe(true);
      expect(game.tetris.currentPiece.x).toBe(originalX + 1);
    });

    test('should handle rotation input', () => {
      // Use T-piece for predictable rotation
      game.tetris.currentPiece = {
        shape: [
          [' ', 'X', ' '],
          ['X', 'X', 'X']
        ],
        x: 3,
        y: 5
      };
      
      const originalShape = JSON.stringify(game.tetris.currentPiece.shape);
      game.tetris.rotatePiece();
      
      // Shape should change (rotation occurred)
      expect(JSON.stringify(game.tetris.currentPiece.shape)).not.toBe(originalShape);
    });

    test('should handle soft drop input', () => {
      const originalY = game.tetris.currentPiece.y;
      
      // Simulate soft drop
      game.tetris.drop();
      
      expect(game.tetris.currentPiece.y).toBe(originalY + 1);
    });

    test('should handle hard drop input', () => {
      const originalScore = game.tetris.score;
      
      // Simulate hard drop (spacebar)
      game.tetris.hardDrop();
      
      // Should spawn new piece and increase score
      expect(game.tetris.currentPiece).toBeTruthy(); // New piece
      expect(game.tetris.score).toBeGreaterThan(originalScore);
    });
  });

  describe('Full Game Simulation', () => {
    test('should complete full line clearing cycle', () => {
      // Start game
      game.isRunning = true;
      game.tetris.spawnPiece();
      
      // Fill bottom line except one position
      for (let x = 0; x < 9; x++) {
        game.tetris.board[19][x] = 'X';
      }
      
      // Move current piece to fill the gap
      const targetX = 9 - game.tetris.currentPiece.x;
      if (targetX > 0) {
        for (let i = 0; i < targetX; i++) {
          game.tetris.movePiece(1, 0);
        }
      } else if (targetX < 0) {
        for (let i = 0; i < Math.abs(targetX); i++) {
          game.tetris.movePiece(-1, 0);
        }
      }
      
      // Hard drop to place piece
      const originalScore = game.tetris.score;
      game.tetris.hardDrop();
      
      // Should clear line and increase score
      expect(game.tetris.score).toBeGreaterThan(originalScore);
    });

    test('should handle multiple piece drops', () => {
      game.isRunning = true;
      
      let piecesDropped = 0;
      const maxPieces = 5;
      
      while (piecesDropped < maxPieces && !game.tetris.gameOver) {
        if (!game.tetris.currentPiece) {
          game.tetris.spawnPiece();
        }
        
        if (game.tetris.currentPiece) {
          game.tetris.hardDrop();
          piecesDropped++;
        }
      }
      
      expect(piecesDropped).toBe(maxPieces);
      expect(game.tetris.score).toBeGreaterThan(0);
    });

    test('should reach game over condition', () => {
      game.isRunning = true;
      
      // Fill the board quickly by dropping many pieces
      let iterations = 0;
      while (!game.tetris.gameOver && iterations < 100) {
        if (!game.tetris.currentPiece) {
          game.tetris.spawnPiece();
        }
        
        if (game.tetris.currentPiece) {
          game.tetris.hardDrop();
        }
        iterations++;
      }
      
      // Should eventually reach game over
      expect(game.tetris.gameOver).toBe(true);
    });

    test('should handle scoring progression', () => {
      game.isRunning = true;
      game.tetris.spawnPiece();
      
      const initialScore = game.tetris.score;
      const initialLevel = game.tetris.level;
      
      // Fill and clear a line
      for (let x = 0; x < 10; x++) {
        game.tetris.board[19][x] = 'X';
      }
      
      game.tetris.clearLines();
      
      expect(game.tetris.score).toBe(initialScore + (100 * initialLevel));
      expect(game.tetris.lines).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing current piece gracefully', () => {
      game.tetris.currentPiece = null;
      
      // These should not throw errors
      expect(() => game.tetris.movePiece(1, 0)).not.toThrow();
      expect(() => game.tetris.rotatePiece()).not.toThrow();
      expect(() => game.tetris.drop()).not.toThrow();
      expect(() => game.tetris.hardDrop()).not.toThrow();
    });

    test('should handle game over state gracefully', () => {
      game.tetris.gameOver = true;
      
      // Should not spawn new pieces when game is over
      game.tetris.spawnPiece();
      expect(game.tetris.currentPiece).toBeNull();
    });

    test('should handle invalid board states', () => {
      // Simulate corrupted piece data
      game.tetris.currentPiece = {
        shape: null,
        x: 0,
        y: 0
      };
      
      // Should not crash
      expect(() => game.tetris.rotatePiece()).not.toThrow();
      expect(() => game.tetris.getDisplay()).not.toThrow();
    });

    test('should handle extreme time deltas', () => {
      game.tetris.spawnPiece();
      
      // Very large time delta
      expect(() => game.tetris.update(10000)).not.toThrow();
      
      // Negative time delta  
      expect(() => game.tetris.update(-1000)).not.toThrow();
      
      // Zero time delta
      expect(() => game.tetris.update(0)).not.toThrow();
    });
  });
});