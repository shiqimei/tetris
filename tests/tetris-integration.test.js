const Tetris = require('../src/tetris');
const TetrisGame = require('../src/index');

describe('Tetris Integration Tests', () => {
  let tetris;

  beforeEach(() => {
    tetris = new Tetris();
  });

  describe('Game Loop Integration', () => {
    test('should update game state over time', () => {
      tetris.spawnPiece();
      const originalY = tetris.currentPiece.y;
      const originalDropTime = tetris.dropTime;
      
      // Simulate enough time to trigger a drop
      tetris.update(1500); // More than dropInterval (1000ms)
      
      // Piece should have moved down or been placed
      expect(tetris.dropTime).toBeGreaterThanOrEqual(0);
      expect(tetris.currentPiece.y).toBeGreaterThanOrEqual(originalY);
    });

    test('should not update when game is over', () => {
      tetris.gameOver = true;
      tetris.spawnPiece();
      const originalState = JSON.parse(JSON.stringify(tetris.board));
      
      tetris.update(2000);
      
      expect(tetris.board).toEqual(originalState);
    });

    test('should handle rapid updates without breaking', () => {
      tetris.spawnPiece();
      
      // Simulate many rapid updates
      for (let i = 0; i < 100; i++) {
        tetris.update(10); // Small time increments
      }
      
      // Game should still be in valid state
      expect(tetris.currentPiece).toBeTruthy();
      expect(tetris.board).toHaveLength(20);
      expect(tetris.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Complete Game Flow Integration', () => {
    test('should handle complete piece lifecycle', () => {
      const originalScore = tetris.score;
      
      // Spawn piece
      tetris.spawnPiece();
      expect(tetris.currentPiece).toBeTruthy();
      
      // Move piece around
      tetris.movePiece(1, 0); // Move right
      tetris.movePiece(-1, 0); // Move left  
      tetris.rotatePiece(); // Rotate
      
      // Hard drop to complete lifecycle
      tetris.hardDrop();
      
      // Should have new piece and updated score
      expect(tetris.currentPiece).toBeTruthy();
      expect(tetris.score).toBeGreaterThan(originalScore);
    });

    test('should handle line clearing in complete game context', () => {
      // Setup: Fill bottom row except one cell
      for (let x = 0; x < 9; x++) {
        tetris.board[19][x] = 'X';
      }
      
      // Spawn piece and position it to complete the line
      tetris.currentPiece = {
        shape: [['X']],
        x: 9,
        y: 18
      };
      
      const originalLines = tetris.lines;
      const originalScore = tetris.score;
      
      // Drop piece to complete line
      tetris.drop();
      
      // Line should be cleared and score updated
      expect(tetris.lines).toBe(originalLines + 1);
      expect(tetris.score).toBeGreaterThan(originalScore);
      expect(tetris.board[19].every(cell => cell === ' ')).toBe(true);
    });

    test('should handle multiple consecutive line clears', () => {
      // Fill multiple lines leaving space for I-piece
      for (let y = 16; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          if (x !== 4) { // Leave column 4 empty
            tetris.board[y][x] = 'X';
          }
        }
      }
      
      // Place I-piece vertically in the empty column
      tetris.currentPiece = {
        shape: [['X'], ['X'], ['X'], ['X']],
        x: 4,
        y: 16
      };
      
      const originalScore = tetris.score;
      
      tetris.drop(); // This should complete 4 lines (Tetris!)
      
      expect(tetris.score).toBe(originalScore + 800); // Tetris score
      expect(tetris.lines).toBe(4);
    });
  });

  describe('Game State Management Integration', () => {
    test('should properly reset all game state', () => {
      // Modify game state
      tetris.spawnPiece();
      tetris.score = 1000;
      tetris.level = 5;
      tetris.lines = 50;
      tetris.gameOver = true;
      tetris.board[10][5] = 'X';
      
      // Reset game
      tetris.reset();
      
      // All state should be back to defaults
      expect(tetris.currentPiece).toBeNull();
      expect(tetris.score).toBe(0);
      expect(tetris.level).toBe(1);
      expect(tetris.lines).toBe(0);
      expect(tetris.gameOver).toBe(false);
      expect(tetris.dropTime).toBe(0);
      expect(tetris.dropInterval).toBe(1000);
      
      // Board should be empty
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          expect(tetris.board[y][x]).toBe(' ');
        }
      }
    });

    test('should maintain consistent game state during play', () => {
      tetris.spawnPiece();
      
      // Perform various operations
      for (let i = 0; i < 10; i++) {
        tetris.movePiece(1, 0);
        tetris.movePiece(-1, 0);
        tetris.rotatePiece();
        tetris.update(100);
      }
      
      // Game state should remain consistent
      expect(tetris.board).toHaveLength(20);
      expect(tetris.board[0]).toHaveLength(10);
      expect(tetris.score).toBeGreaterThanOrEqual(0);
      expect(tetris.level).toBeGreaterThanOrEqual(1);
      expect(tetris.lines).toBeGreaterThanOrEqual(0);
      expect(typeof tetris.gameOver).toBe('boolean');
    });
  });

  describe('Performance Integration Tests', () => {
    test('should handle large number of pieces without performance degradation', () => {
      const startTime = Date.now();
      
      // Simulate placing many pieces quickly
      for (let i = 0; i < 100; i++) {
        tetris.spawnPiece();
        if (tetris.gameOver) {
          tetris.reset();
          tetris.spawnPiece();
        }
        tetris.hardDrop();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (< 1 second for 100 pieces)
      expect(duration).toBeLessThan(1000);
    });

    test('should maintain stable memory usage pattern', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many game operations
      for (let i = 0; i < 50; i++) {
        tetris.spawnPiece();
        tetris.movePiece(1, 0);
        tetris.rotatePiece();
        tetris.getDisplay();
        tetris.hardDrop();
        
        if (i % 10 === 0) {
          tetris.reset();
        }
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (< 10MB for this test)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Error Recovery Integration', () => {
    test('should recover from invalid game states', () => {
      // Corrupt game state intentionally
      tetris.currentPiece = {
        shape: null,
        x: -100,
        y: -100
      };
      
      // Game should handle this gracefully
      expect(() => {
        tetris.update(100);
        tetris.getDisplay();
      }).not.toThrow();
    });

    test('should handle boundary condition edge cases', () => {
      // Test extreme values
      tetris.level = 1000;
      tetris.lines = 999999;
      tetris.score = Number.MAX_SAFE_INTEGER;
      
      expect(() => {
        tetris.clearLines();
        tetris.update(1000);
      }).not.toThrow();
      
      // Values should remain reasonable
      expect(tetris.dropInterval).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Randomization and Piece Distribution', () => {
    test('should generate different pieces over multiple spawns', () => {
      const pieceTypes = new Set();
      
      // Spawn many pieces and track types
      for (let i = 0; i < 50; i++) {
        tetris.spawnPiece();
        if (!tetris.gameOver && tetris.currentPiece) {
          pieceTypes.add(JSON.stringify(tetris.currentPiece.shape));
        }
        
        // Clear board periodically to prevent game over
        if (i % 10 === 0) {
          tetris.reset();
        }
      }
      
      // Should have generated multiple different piece types
      expect(pieceTypes.size).toBeGreaterThan(3);
    });

    test('should spawn pieces at reasonable starting positions', () => {
      const positions = [];
      
      for (let i = 0; i < 20; i++) {
        tetris.reset();
        tetris.spawnPiece();
        
        if (tetris.currentPiece) {
          positions.push({
            x: tetris.currentPiece.x,
            y: tetris.currentPiece.y
          });
        }
      }
      
      // All pieces should start at top of board (y = 0)
      expect(positions.every(pos => pos.y === 0)).toBe(true);
      
      // X positions should be reasonable (centered-ish)
      expect(positions.every(pos => pos.x >= 0 && pos.x <= 8)).toBe(true);
    });
  });
});