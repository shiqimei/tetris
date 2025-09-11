const Tetris = require('../src/tetris');

describe('Tetris Comprehensive Game Logic Tests', () => {
  let tetris;

  beforeEach(() => {
    tetris = new Tetris();
  });

  describe('Piece Definitions', () => {
    test('should have I-piece with correct shape', () => {
      const iPiece = tetris.pieces[0];
      expect(iPiece).toEqual([
        ['X', 'X', 'X', 'X']
      ]);
    });

    test('should have O-piece with correct shape', () => {
      const oPiece = tetris.pieces[1];
      expect(oPiece).toEqual([
        ['X', 'X'],
        ['X', 'X']
      ]);
    });

    test('should have T-piece with correct shape', () => {
      const tPiece = tetris.pieces[2];
      expect(tPiece).toEqual([
        [' ', 'X', ' '],
        ['X', 'X', 'X']
      ]);
    });

    test('should have all pieces with correct count', () => {
      expect(tetris.pieces).toHaveLength(7);
      // Verify each piece has a valid shape
      tetris.pieces.forEach((piece, index) => {
        expect(Array.isArray(piece)).toBe(true);
        expect(piece.length).toBeGreaterThan(0);
        piece.forEach(row => {
          expect(Array.isArray(row)).toBe(true);
          expect(row.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Piece Spawning', () => {
    test('should spawn piece at correct starting position', () => {
      tetris.spawnPiece();
      expect(tetris.currentPiece).not.toBeNull();
      expect(tetris.currentPiece.y).toBe(0);
      expect(tetris.currentPiece.x).toBeGreaterThanOrEqual(0);
      expect(tetris.currentPiece.x).toBeLessThan(10);
    });

    test('should detect game over when spawning at blocked position', () => {
      // Block the spawn area
      for (let x = 0; x < 10; x++) {
        tetris.board[0][x] = 'X';
        tetris.board[1][x] = 'X';
      }
      
      tetris.spawnPiece();
      expect(tetris.gameOver).toBe(true);
    });

    test('should spawn random pieces', () => {
      const spawnedPieces = new Set();
      
      // Spawn many pieces to test randomness
      for (let i = 0; i < 50; i++) {
        tetris.spawnPiece();
        if (tetris.currentPiece) {
          spawnedPieces.add(JSON.stringify(tetris.currentPiece.shape));
        }
        tetris.currentPiece = null; // Reset for next spawn
      }
      
      // Should have spawned multiple different pieces
      expect(spawnedPieces.size).toBeGreaterThan(1);
    });
  });

  describe('Piece Rotation', () => {
    test('should rotate T-piece correctly', () => {
      // Manually set a T-piece
      tetris.currentPiece = {
        shape: [
          [' ', 'X', ' '],
          ['X', 'X', 'X']
        ],
        x: 4,
        y: 5
      };

      const originalShape = JSON.stringify(tetris.currentPiece.shape);
      tetris.rotatePiece();
      const rotatedShape = JSON.stringify(tetris.currentPiece.shape);
      
      expect(rotatedShape).not.toBe(originalShape);
    });

    test('should not rotate if rotation would cause collision', () => {
      // Set piece near wall where rotation would fail
      tetris.currentPiece = {
        shape: [
          ['X', 'X', 'X', 'X']
        ],
        x: 8, // Near right wall
        y: 5
      };

      const originalShape = JSON.stringify(tetris.currentPiece.shape);
      tetris.rotatePiece();
      
      // Shape should remain unchanged due to wall collision
      expect(JSON.stringify(tetris.currentPiece.shape)).toBe(originalShape);
    });
  });

  describe('Hard Drop Functionality', () => {
    test('should drop piece to bottom and add score', () => {
      tetris.currentPiece = {
        shape: [['X']],
        x: 5,
        y: 0
      };

      const originalScore = tetris.score;
      tetris.hardDrop();
      
      expect(tetris.score).toBeGreaterThan(originalScore);
      expect(tetris.currentPiece).not.toBeNull(); // New piece should spawn
    });

    test('should place piece correctly after hard drop', () => {
      tetris.currentPiece = {
        shape: [['X']],
        x: 5,
        y: 0
      };

      tetris.hardDrop();
      
      // Check that piece was placed at bottom
      expect(tetris.board[19][5]).toBe('X');
    });
  });

  describe('Multiple Line Clearing', () => {
    test('should clear multiple lines simultaneously', () => {
      // Fill two complete lines
      for (let x = 0; x < 10; x++) {
        tetris.board[18][x] = 'X';
        tetris.board[19][x] = 'X';
      }

      const originalLines = tetris.lines;
      const originalScore = tetris.score;
      
      tetris.clearLines();
      
      expect(tetris.lines).toBe(originalLines + 2);
      expect(tetris.score).toBe(originalScore + (300 * tetris.level)); // Double line score
      
      // Both lines should be cleared
      expect(tetris.board[18].every(cell => cell === ' ')).toBe(true);
      expect(tetris.board[19].every(cell => cell === ' ')).toBe(true);
    });

    test('should handle Tetris (4 lines) with correct scoring', () => {
      // Fill four complete lines
      for (let y = 16; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          tetris.board[y][x] = 'X';
        }
      }

      const originalScore = tetris.score;
      tetris.clearLines();
      
      expect(tetris.score).toBe(originalScore + (800 * tetris.level)); // Tetris score
    });
  });

  describe('Level Progression', () => {
    test('should increase level every 10 lines', () => {
      tetris.lines = 9;
      
      // Clear one line to reach 10 total
      for (let x = 0; x < 10; x++) {
        tetris.board[19][x] = 'X';
      }
      
      tetris.clearLines();
      expect(tetris.level).toBe(2);
      expect(tetris.dropInterval).toBeLessThan(1000); // Speed should increase
    });

    test('should adjust drop speed with level', () => {
      const originalInterval = tetris.dropInterval;
      tetris.level = 5;
      tetris.lines = 40; // Trigger level recalculation
      
      // Simulate line clear to update drop interval
      for (let x = 0; x < 10; x++) {
        tetris.board[19][x] = 'X';
      }
      tetris.clearLines();
      
      expect(tetris.dropInterval).toBeLessThan(originalInterval);
    });
  });

  describe('Soft Drop Scoring', () => {
    test('should award points for soft drop', () => {
      tetris.currentPiece = {
        shape: [['X']],
        x: 5,
        y: 10
      };

      const originalScore = tetris.score;
      const moved = tetris.movePiece(0, 1, true); // Soft drop
      
      if (moved) {
        expect(tetris.score).toBe(originalScore + 1);
      }
    });
  });

  describe('Game State Management', () => {
    test('should reset game state correctly', () => {
      // Modify game state
      tetris.score = 1000;
      tetris.level = 5;
      tetris.lines = 25;
      tetris.gameOver = true;
      tetris.board[10][5] = 'X';

      tetris.reset();

      expect(tetris.score).toBe(0);
      expect(tetris.level).toBe(1);
      expect(tetris.lines).toBe(0);
      expect(tetris.gameOver).toBe(false);
      expect(tetris.board[10][5]).toBe(' ');
    });

    test('should update game with time delta', () => {
      tetris.spawnPiece();
      const originalY = tetris.currentPiece.y;
      
      // Simulate time passing greater than drop interval
      tetris.update(1500); // 1.5 seconds
      
      // Piece should have moved down or been placed
      expect(tetris.currentPiece.y).toBeGreaterThanOrEqual(originalY);
    });
  });

  describe('Display Generation', () => {
    test('should generate correct display with active piece', () => {
      tetris.currentPiece = {
        shape: [['X']],
        x: 5,
        y: 10
      };

      const display = tetris.getDisplay();
      
      expect(display).toHaveLength(20);
      expect(display[0]).toHaveLength(10);
      expect(display[10][5]).toBe('X'); // Active piece should be visible
    });

    test('should show placed pieces in display', () => {
      tetris.board[15][3] = 'X';
      
      const display = tetris.getDisplay();
      expect(display[15][3]).toBe('X');
    });
  });

  describe('Boundary Collision Tests', () => {
    test('should prevent movement beyond board boundaries', () => {
      tetris.currentPiece = {
        shape: [['X']],
        x: 0,
        y: 10
      };

      // Should not be able to move left beyond boundary
      expect(tetris.movePiece(-1, 0)).toBe(false);
      expect(tetris.currentPiece.x).toBe(0);

      tetris.currentPiece.x = 9;
      // Should not be able to move right beyond boundary
      expect(tetris.movePiece(1, 0)).toBe(false);
      expect(tetris.currentPiece.x).toBe(9);
    });

    test('should prevent movement beyond bottom boundary', () => {
      tetris.currentPiece = {
        shape: [['X']],
        x: 5,
        y: 19
      };

      // Should not be able to move down beyond bottom
      expect(tetris.movePiece(0, 1)).toBe(false);
    });
  });
});