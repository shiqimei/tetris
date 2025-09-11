const Tetris = require('../src/tetris');

describe('Tetris Advanced Game Logic', () => {
  let tetris;

  beforeEach(() => {
    tetris = new Tetris();
  });

  describe('Piece Rotation System', () => {
    test('should rotate I-piece correctly', () => {
      // Set specific piece (I-piece is at index 0)
      tetris.currentPiece = {
        shape: tetris.pieces[0], // I-piece horizontal
        x: 3,
        y: 5
      };

      const originalShape = JSON.parse(JSON.stringify(tetris.currentPiece.shape));
      tetris.rotatePiece();
      
      // I-piece should rotate from horizontal to vertical
      expect(tetris.currentPiece.shape).not.toEqual(originalShape);
      expect(tetris.currentPiece.shape.length).toBeGreaterThan(originalShape.length);
    });

    test('should not rotate when blocked by boundaries', () => {
      // Place piece at left edge where rotation would be invalid
      tetris.currentPiece = {
        shape: tetris.pieces[0], // I-piece
        x: 0,
        y: 5
      };

      const originalShape = JSON.parse(JSON.stringify(tetris.currentPiece.shape));
      tetris.rotatePiece();
      
      // Rotation should be blocked, shape should remain the same
      expect(tetris.currentPiece.shape).toEqual(originalShape);
    });

    test('should not rotate when blocked by existing pieces', () => {
      // Place some blocks on the board
      tetris.board[10][5] = 'X';
      tetris.board[11][5] = 'X';

      tetris.currentPiece = {
        shape: tetris.pieces[2], // T-piece
        x: 4,
        y: 9
      };

      const originalShape = JSON.parse(JSON.stringify(tetris.currentPiece.shape));
      tetris.rotatePiece();
      
      // If rotation would overlap with existing pieces, it should be blocked
      expect(tetris.currentPiece.shape).toEqual(originalShape);
    });
  });

  describe('Piece Types and Properties', () => {
    test('should have exactly 7 different piece types', () => {
      const expectedPieceCount = 7; // I, O, T, S, Z, J, L
      expect(tetris.pieces).toHaveLength(expectedPieceCount);
    });

    test('should have unique shapes for each piece type', () => {
      const shapeStrings = tetris.pieces.map(piece => JSON.stringify(piece));
      const uniqueShapes = new Set(shapeStrings);
      expect(uniqueShapes.size).toBe(tetris.pieces.length);
    });

    test('should properly handle O-piece (no rotation change)', () => {
      tetris.currentPiece = {
        shape: tetris.pieces[1], // O-piece
        x: 4,
        y: 5
      };

      const originalShape = JSON.parse(JSON.stringify(tetris.currentPiece.shape));
      tetris.rotatePiece();
      
      // O-piece should look the same after rotation
      expect(tetris.currentPiece.shape).toEqual(originalShape);
    });
  });

  describe('Hard Drop Functionality', () => {
    test('should calculate correct drop distance', () => {
      tetris.spawnPiece();
      const originalScore = tetris.score;
      const startY = tetris.currentPiece.y;
      
      tetris.hardDrop();
      
      // Should have moved to bottom and scored appropriately
      const expectedMinScore = originalScore + (19 - startY) * 2; // 2 points per cell
      expect(tetris.score).toBeGreaterThanOrEqual(expectedMinScore);
    });

    test('should spawn new piece after hard drop', () => {
      tetris.spawnPiece();
      const originalPiece = tetris.currentPiece;
      
      tetris.hardDrop();
      
      expect(tetris.currentPiece).not.toBe(originalPiece);
      expect(tetris.currentPiece).not.toBeNull();
    });

    test('should place piece at correct position with obstacles', () => {
      // Create obstacle in bottom half
      for (let x = 0; x < 10; x++) {
        tetris.board[18][x] = 'X';
      }

      tetris.spawnPiece();
      tetris.hardDrop();
      
      // Piece should be placed above the obstacle
      let foundPlacedPiece = false;
      for (let y = 0; y < 18; y++) {
        for (let x = 0; x < 10; x++) {
          if (tetris.board[y][x] === 'X' && y < 18) {
            foundPlacedPiece = true;
            break;
          }
        }
        if (foundPlacedPiece) break;
      }
      
      expect(foundPlacedPiece).toBe(true);
    });
  });

  describe('Soft Drop Scoring', () => {
    test('should award 1 point per cell for soft drop', () => {
      tetris.spawnPiece();
      const originalScore = tetris.score;
      
      // Perform soft drop (move down with scoring)
      const moved = tetris.movePiece(0, 1, true);
      
      if (moved) {
        expect(tetris.score).toBe(originalScore + 1);
      }
    });

    test('should not award points for regular lateral movement', () => {
      tetris.spawnPiece();
      const originalScore = tetris.score;
      
      tetris.movePiece(1, 0, false); // Move right, not soft drop
      
      expect(tetris.score).toBe(originalScore);
    });
  });

  describe('Multiple Line Clearing', () => {
    test('should clear 2 lines simultaneously and award 300 points per level', () => {
      tetris.level = 2;
      
      // Fill two complete lines
      for (let x = 0; x < 10; x++) {
        tetris.board[18][x] = 'X';
        tetris.board[19][x] = 'X';
      }

      const originalScore = tetris.score;
      tetris.clearLines();
      
      expect(tetris.score).toBe(originalScore + (300 * 2)); // 300 * level
      expect(tetris.lines).toBe(2);
    });

    test('should clear 3 lines simultaneously and award 500 points per level', () => {
      tetris.level = 1;
      
      // Fill three complete lines
      for (let x = 0; x < 10; x++) {
        tetris.board[17][x] = 'X';
        tetris.board[18][x] = 'X';
        tetris.board[19][x] = 'X';
      }

      const originalScore = tetris.score;
      tetris.clearLines();
      
      expect(tetris.score).toBe(originalScore + 500); // 500 * 1
      expect(tetris.lines).toBe(3);
    });

    test('should clear 4 lines (Tetris) and award 800 points per level', () => {
      tetris.level = 1;
      
      // Fill four complete lines
      for (let y = 16; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          tetris.board[y][x] = 'X';
        }
      }

      const originalScore = tetris.score;
      tetris.clearLines();
      
      expect(tetris.score).toBe(originalScore + 800); // 800 * 1
      expect(tetris.lines).toBe(4);
    });
  });

  describe('Level Progression and Speed', () => {
    test('should increase level every 10 lines', () => {
      expect(tetris.level).toBe(1);
      
      tetris.lines = 9;
      tetris.clearLines(); // No lines to clear, but should recalculate level
      expect(tetris.level).toBe(1);
      
      tetris.lines = 10;
      tetris.clearLines();
      expect(tetris.level).toBe(2);
      
      tetris.lines = 25;
      tetris.clearLines();
      expect(tetris.level).toBe(3);
    });

    test('should decrease drop interval as level increases', () => {
      const originalInterval = tetris.dropInterval;
      
      tetris.lines = 10;
      tetris.clearLines(); // Should trigger level 2
      
      expect(tetris.dropInterval).toBeLessThan(originalInterval);
      expect(tetris.dropInterval).toBe(Math.max(100, 1000 - (2 - 1) * 100));
    });

    test('should not allow drop interval below 100ms', () => {
      tetris.lines = 100; // Very high lines to test minimum
      tetris.clearLines();
      
      expect(tetris.dropInterval).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Game Over Conditions', () => {
    test('should trigger game over when piece cannot spawn', () => {
      // Fill top rows to block spawning
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 10; x++) {
          tetris.board[y][x] = 'X';
        }
      }

      expect(tetris.gameOver).toBe(false);
      tetris.spawnPiece();
      expect(tetris.gameOver).toBe(true);
    });

    test('should not spawn new piece when game over', () => {
      tetris.gameOver = true;
      const originalPiece = tetris.currentPiece;
      
      tetris.spawnPiece();
      
      // Should not change current piece when game is over
      expect(tetris.currentPiece).toBe(originalPiece);
    });
  });

  describe('Display and Board State', () => {
    test('should correctly overlay current piece on board display', () => {
      // Clear board
      tetris.board = tetris.createBoard(20, 10);
      
      // Set specific piece at known position
      tetris.currentPiece = {
        shape: [['X', 'X']],
        x: 0,
        y: 0
      };

      const display = tetris.getDisplay();
      
      // Should show the piece at the specified position
      expect(display[0][0]).toBe('X');
      expect(display[0][1]).toBe('X');
    });

    test('should not modify original board when getting display', () => {
      const originalBoard = tetris.board.map(row => [...row]);
      
      tetris.spawnPiece();
      tetris.getDisplay();
      
      // Original board should be unchanged
      expect(tetris.board).toEqual(originalBoard);
    });
  });
});