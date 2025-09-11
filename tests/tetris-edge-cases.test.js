const Tetris = require('../src/tetris');

describe('Tetris Edge Cases and Error Handling', () => {
  let tetris;

  beforeEach(() => {
    tetris = new Tetris();
  });

  describe('Boundary Conditions', () => {
    test('should handle movement at exact board boundaries', () => {
      tetris.currentPiece = {
        shape: [['X']],
        x: 0,
        y: 0
      };

      // Test left boundary
      expect(tetris.movePiece(-1, 0)).toBe(false);
      expect(tetris.currentPiece.x).toBe(0);

      // Move to right boundary
      tetris.currentPiece.x = 9;
      expect(tetris.movePiece(1, 0)).toBe(false);
      expect(tetris.currentPiece.x).toBe(9);

      // Test bottom boundary
      tetris.currentPiece.y = 19;
      expect(tetris.movePiece(0, 1)).toBe(false);
    });

    test('should handle wide pieces at board edges', () => {
      // Test I-piece (4 cells wide) at right edge
      tetris.currentPiece = {
        shape: [['X', 'X', 'X', 'X']],
        x: 6, // Should be valid (6+4=10, exactly board width)
        y: 0
      };

      expect(tetris.isValidMove(tetris.currentPiece)).toBe(true);

      // One position further right should be invalid
      tetris.currentPiece.x = 7;
      expect(tetris.isValidMove(tetris.currentPiece)).toBe(false);
    });

    test('should handle rotation of wide pieces near boundaries', () => {
      // Place I-piece vertically near right edge where horizontal rotation would be blocked
      tetris.currentPiece = {
        shape: [['X'], ['X'], ['X'], ['X']], // Vertical I-piece
        x: 8,  // Near right edge - when rotated horizontally would need columns 8,9,10,11
        y: 16  // Valid vertical position
      };

      const originalShape = JSON.parse(JSON.stringify(tetris.currentPiece.shape));
      tetris.rotatePiece();

      // Rotation should be blocked due to right boundary
      expect(tetris.currentPiece.shape).toEqual(originalShape);
    });
  });

  describe('Null and Invalid State Handling', () => {
    test('should handle null currentPiece gracefully', () => {
      tetris.currentPiece = null;

      expect(() => {
        tetris.movePiece(1, 0);
        tetris.rotatePiece();
        tetris.drop();
        tetris.hardDrop();
        tetris.getDisplay();
      }).not.toThrow();

      // Movement with null piece should return false
      expect(tetris.movePiece(1, 0)).toBe(false);
    });

    test('should handle malformed piece shapes', () => {
      tetris.currentPiece = {
        shape: [], // Empty shape
        x: 5,
        y: 10
      };

      expect(() => {
        tetris.isValidMove(tetris.currentPiece);
        tetris.rotatePiece();
      }).not.toThrow();

      // Another malformed shape test
      tetris.currentPiece = {
        shape: [[], ['X']], // Irregular shape
        x: 5,
        y: 10
      };

      expect(() => {
        tetris.isValidMove(tetris.currentPiece);
      }).not.toThrow();
    });

    test('should handle invalid piece positions', () => {
      tetris.currentPiece = {
        shape: [['X']],
        x: -100, // Way outside board
        y: -100
      };

      expect(tetris.isValidMove(tetris.currentPiece)).toBe(false);

      tetris.currentPiece.x = 1000; // Way outside on other side
      tetris.currentPiece.y = 1000;

      expect(tetris.isValidMove(tetris.currentPiece)).toBe(false);
    });
  });

  describe('Extreme Game States', () => {
    test('should handle completely full board except top row', () => {
      // Fill entire board except top row
      for (let y = 1; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          tetris.board[y][x] = 'X';
        }
      }

      // Should still be able to spawn piece
      tetris.spawnPiece();
      expect(tetris.gameOver).toBe(false);
      expect(tetris.currentPiece).toBeTruthy();
    });

    test('should handle board with scattered single cells', () => {
      // Create checkerboard pattern
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          if ((x + y) % 2 === 0) {
            tetris.board[y][x] = 'X';
          }
        }
      }

      tetris.spawnPiece();

      expect(() => {
        tetris.movePiece(1, 0);
        tetris.movePiece(-1, 0);
        tetris.rotatePiece();
        tetris.drop();
      }).not.toThrow();
    });

    test('should handle maximum score and level values', () => {
      tetris.score = Number.MAX_SAFE_INTEGER - 1000;
      tetris.level = 1000;
      tetris.lines = 10000;

      // Should still handle scoring without overflow
      tetris.score += 800 * tetris.level;

      expect(tetris.score).toBeGreaterThan(0);
      expect(tetris.level).toBeGreaterThan(0);
    });
  });

  describe('Rapid Input and Race Conditions', () => {
    test('should handle rapid piece movements', () => {
      tetris.spawnPiece();
      const originalPiece = tetris.currentPiece;

      // Rapidly execute movements
      for (let i = 0; i < 100; i++) {
        tetris.movePiece(1, 0);
        tetris.movePiece(-1, 0);
      }

      // Piece should still be valid
      expect(tetris.currentPiece).toBeTruthy();
      expect(tetris.currentPiece.x).toBeGreaterThanOrEqual(0);
      expect(tetris.currentPiece.x).toBeLessThan(10);
    });

    test('should handle rapid rotations', () => {
      tetris.currentPiece = {
        shape: tetris.pieces[2], // T-piece
        x: 4,
        y: 10
      };

      // Rapidly rotate piece
      for (let i = 0; i < 50; i++) {
        tetris.rotatePiece();
      }

      // Piece should still be in valid state
      expect(tetris.currentPiece).toBeTruthy();
      expect(tetris.isValidMove(tetris.currentPiece)).toBe(true);
    });

    test('should handle simultaneous drop and movement attempts', () => {
      tetris.spawnPiece();

      // Try to move while dropping
      for (let i = 0; i < 20; i++) {
        tetris.movePiece(1, 0);
        tetris.drop();
        tetris.movePiece(-1, 0);
        tetris.drop();
      }

      // Game should remain in consistent state
      expect(tetris.board).toHaveLength(20);
      expect(tetris.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    test('should handle many board state changes without memory leaks', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many operations that create/destroy objects
      for (let i = 0; i < 1000; i++) {
        tetris.getDisplay(); // Creates new array each time
        tetris.spawnPiece();
        if (i % 10 === 0) {
          tetris.reset();
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (< 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('should handle very small and very large time deltas', () => {
      tetris.spawnPiece();

      // Very small time delta
      expect(() => tetris.update(0.001)).not.toThrow();

      // Zero time delta
      expect(() => tetris.update(0)).not.toThrow();

      // Very large time delta
      expect(() => tetris.update(999999999)).not.toThrow();

      // Negative time delta
      expect(() => tetris.update(-1000)).not.toThrow();
    });
  });

  describe('Line Clearing Edge Cases', () => {
    test('should handle clearing lines at board top', () => {
      // Fill top line
      for (let x = 0; x < 10; x++) {
        tetris.board[0][x] = 'X';
      }

      const originalLines = tetris.lines;
      tetris.clearLines();

      expect(tetris.lines).toBe(originalLines + 1);
      expect(tetris.board[0].every(cell => cell === ' ')).toBe(true);
    });

    test('should handle clearing all lines simultaneously', () => {
      // Fill entire board
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          tetris.board[y][x] = 'X';
        }
      }

      tetris.clearLines();

      // All lines should be cleared
      for (let y = 0; y < 20; y++) {
        expect(tetris.board[y].every(cell => cell === ' ')).toBe(true);
      }
      expect(tetris.lines).toBe(20);
    });

    test('should handle non-contiguous line clearing', () => {
      // Fill lines 5, 10, 15 completely
      [5, 10, 15].forEach(row => {
        for (let x = 0; x < 10; x++) {
          tetris.board[row][x] = 'X';
        }
      });

      // Add some scattered pieces
      tetris.board[6][0] = 'X';
      tetris.board[11][5] = 'X';

      const originalLines = tetris.lines;
      tetris.clearLines();

      expect(tetris.lines).toBe(originalLines + 3);
      // Scattered pieces should have moved down
      expect(tetris.board[8][0]).toBe('X'); // Moved down 3 positions
      expect(tetris.board[13][5]).toBe('X'); // Moved down 2 positions
    });
  });

  describe('Piece Placement Edge Cases', () => {
    test('should handle piece placement at board top', () => {
      tetris.currentPiece = {
        shape: [['X']],
        x: 5,
        y: -1 // Partially above board
      };

      expect(() => tetris.placePiece()).not.toThrow();

      // Piece should not be placed above board
      expect(tetris.board[0][5]).toBe(' ');
    });

    test('should handle overlapping piece placement attempts', () => {
      // Place a piece on board
      tetris.board[10][5] = 'X';

      // Try to place another piece in same location
      tetris.currentPiece = {
        shape: [['X']],
        x: 5,
        y: 10
      };

      // This should be prevented by collision detection
      expect(tetris.isValidMove(tetris.currentPiece)).toBe(false);
    });

    test('should handle complex multi-block piece placement', () => {
      // Place T-piece in complex board state
      for (let x = 0; x < 10; x++) {
        if (x !== 4 && x !== 5 && x !== 6) {
          tetris.board[18][x] = 'X'; // Fill row except T-piece area
        }
      }

      tetris.currentPiece = {
        shape: [
          [' ', 'X', ' '],
          ['X', 'X', 'X']
        ],
        x: 4,
        y: 17
      };

      expect(() => tetris.placePiece()).not.toThrow();

      // T-piece should be correctly placed
      expect(tetris.board[17][5]).toBe('X'); // Top of T
      expect(tetris.board[18][4]).toBe('X'); // Left of T base
      expect(tetris.board[18][5]).toBe('X'); // Center of T base
      expect(tetris.board[18][6]).toBe('X'); // Right of T base
    });
  });
});