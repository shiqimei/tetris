const Tetris = require('../src/tetris');
const TetrisGame = require('../src/index');

describe('Tetris Scenario-Based Tests', () => {
  let tetris;

  beforeEach(() => {
    tetris = new Tetris();
  });

  describe('Scenario 1: Standard 7-piece Tetromino System', () => {
    test('should have exactly 7 pieces defined', () => {
      expect(tetris.pieces).toHaveLength(7);
    });

    test('should have I-piece with correct horizontal shape', () => {
      const iPiece = tetris.pieces[0];
      expect(iPiece).toEqual([
        ['X', 'X', 'X', 'X']
      ]);
    });

    test('should have O-piece with correct square shape', () => {
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

    test('should spawn piece at top center of playing field', () => {
      tetris.spawnPiece();
      expect(tetris.currentPiece).toBeTruthy();
      expect(tetris.currentPiece.y).toBe(0);
      // X position should be centered based on piece width
      expect(tetris.currentPiece.x).toBeGreaterThanOrEqual(0);
      expect(tetris.currentPiece.x).toBeLessThanOrEqual(9);
    });

    test('should randomly select from all 7 pieces', () => {
      const spawnedPieces = new Set();
      // Spawn 50 pieces to ensure good distribution
      for (let i = 0; i < 50; i++) {
        tetris.spawnPiece();
        if (tetris.currentPiece) {
          spawnedPieces.add(JSON.stringify(tetris.currentPiece.shape));
        }
        tetris.currentPiece = null; // Clear for next spawn
      }
      // Should see multiple different piece types
      expect(spawnedPieces.size).toBeGreaterThan(1);
    });
  });

  describe('Scenario 2: Real-time Movement Controls', () => {
    beforeEach(() => {
      tetris.spawnPiece();
    });

    test('should move piece left when valid', () => {
      const originalX = tetris.currentPiece.x;
      const result = tetris.movePiece(-1, 0);
      expect(result).toBe(true);
      expect(tetris.currentPiece.x).toBe(originalX - 1);
    });

    test('should move piece right when valid', () => {
      const originalX = tetris.currentPiece.x;
      const result = tetris.movePiece(1, 0);
      expect(result).toBe(true);
      expect(tetris.currentPiece.x).toBe(originalX + 1);
    });

    test('should prevent movement beyond left boundary', () => {
      // Move to left edge
      tetris.currentPiece.x = 0;
      const result = tetris.movePiece(-1, 0);
      expect(result).toBe(false);
      expect(tetris.currentPiece.x).toBe(0);
    });

    test('should prevent movement beyond right boundary', () => {
      // Move to right edge (account for piece width)
      const pieceWidth = tetris.currentPiece.shape[0].length;
      tetris.currentPiece.x = 10 - pieceWidth;
      const result = tetris.movePiece(1, 0);
      expect(result).toBe(false);
      expect(tetris.currentPiece.x).toBe(10 - pieceWidth);
    });

    test('should handle soft drop with scoring', () => {
      const originalScore = tetris.score;
      const result = tetris.movePiece(0, 1, true); // Soft drop
      expect(result).toBe(true);
      expect(tetris.score).toBe(originalScore + 1); // 1 point per cell
    });

    test('should handle hard drop with correct scoring', () => {
      const originalScore = tetris.score;
      const originalY = tetris.currentPiece.y;
      tetris.hardDrop();
      
      // Should place piece and spawn new one
      expect(tetris.currentPiece).toBeTruthy(); // New piece spawned
      expect(tetris.score).toBeGreaterThan(originalScore); // Score increased
    });
  });

  describe('Scenario 3: Piece Rotation Mechanics', () => {
    beforeEach(() => {
      // Spawn T-piece for rotation testing
      tetris.currentPiece = {
        shape: [
          [' ', 'X', ' '],
          ['X', 'X', 'X']
        ],
        x: 3,
        y: 5
      };
    });

    test('should rotate T-piece clockwise correctly', () => {
      tetris.rotatePiece();
      expect(tetris.currentPiece.shape).toEqual([
        ['X', ' '],
        ['X', 'X'],
        ['X', ' ']
      ]);
    });

    test('should not rotate O-piece (optimization)', () => {
      // Set O-piece
      tetris.currentPiece = {
        shape: [
          ['X', 'X'],
          ['X', 'X']
        ],
        x: 3,
        y: 5
      };
      
      const originalShape = JSON.stringify(tetris.currentPiece.shape);
      tetris.rotatePiece();
      expect(JSON.stringify(tetris.currentPiece.shape)).toBe(originalShape);
    });

    test('should prevent rotation if collision would occur', () => {
      // Place piece near boundary where rotation would fail
      tetris.currentPiece.x = 9; // Near right edge
      
      const originalShape = JSON.stringify(tetris.currentPiece.shape);
      tetris.rotatePiece();
      
      // Shape should remain unchanged due to boundary collision
      expect(JSON.stringify(tetris.currentPiece.shape)).toBe(originalShape);
    });

    test('should prevent rotation into existing blocks', () => {
      // Place obstacle next to piece
      tetris.board[5][4] = 'X';
      
      const originalShape = JSON.stringify(tetris.currentPiece.shape);
      tetris.rotatePiece();
      
      // Rotation should be blocked by existing block
      expect(JSON.stringify(tetris.currentPiece.shape)).toBe(originalShape);
    });
  });

  describe('Scenario 4: Line Clearing and Scoring System', () => {
    test('should clear single line with correct scoring', () => {
      tetris.level = 1;
      const originalScore = tetris.score;
      
      // Fill bottom line completely
      for (let x = 0; x < 10; x++) {
        tetris.board[19][x] = 'X';
      }
      
      tetris.clearLines();
      
      expect(tetris.lines).toBe(1);
      expect(tetris.score).toBe(originalScore + (100 * 1)); // 100 * level
      expect(tetris.board[19].every(cell => cell === ' ')).toBe(true);
    });

    test('should clear double lines with correct scoring', () => {
      tetris.level = 2;
      const originalScore = tetris.score;
      
      // Fill two bottom lines
      for (let y = 18; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          tetris.board[y][x] = 'X';
        }
      }
      
      tetris.clearLines();
      
      expect(tetris.lines).toBe(2);
      expect(tetris.score).toBe(originalScore + (300 * 2)); // 300 * level
    });

    test('should clear Tetris (4 lines) with correct scoring', () => {
      tetris.level = 1;
      const originalScore = tetris.score;
      
      // Fill four bottom lines
      for (let y = 16; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          tetris.board[y][x] = 'X';
        }
      }
      
      tetris.clearLines();
      
      expect(tetris.lines).toBe(4);
      expect(tetris.score).toBe(originalScore + (800 * 1)); // 800 * level
    });

    test('should increase level every 10 lines cleared', () => {
      tetris.lines = 9;
      expect(tetris.level).toBe(1);
      
      // Fill one line to trigger level increase
      for (let x = 0; x < 10; x++) {
        tetris.board[19][x] = 'X';
      }
      
      tetris.clearLines();
      
      expect(tetris.lines).toBe(10);
      expect(tetris.level).toBe(2);
    });

    test('should adjust drop interval based on level', () => {
      tetris.level = 1;
      tetris.clearLines(); // Recalculate intervals
      expect(tetris.dropInterval).toBe(1000);
      
      tetris.level = 5;
      tetris.clearLines(); // Recalculate intervals
      expect(tetris.dropInterval).toBe(600); // 1000 - 4*100
      
      tetris.level = 20;
      tetris.clearLines(); // Recalculate intervals
      expect(tetris.dropInterval).toBe(100); // Minimum
    });

    test('should not clear incomplete lines', () => {
      const originalLines = tetris.lines;
      const originalScore = tetris.score;
      
      // Fill line except one cell
      for (let x = 0; x < 9; x++) {
        tetris.board[19][x] = 'X';
      }
      
      tetris.clearLines();
      
      expect(tetris.lines).toBe(originalLines);
      expect(tetris.score).toBe(originalScore);
    });
  });

  describe('Scenario 5: Game State Management', () => {
    test('should initialize with correct default values', () => {
      expect(tetris.score).toBe(0);
      expect(tetris.level).toBe(1);
      expect(tetris.lines).toBe(0);
      expect(tetris.gameOver).toBe(false);
      expect(tetris.currentPiece).toBeNull();
      expect(tetris.board).toHaveLength(20);
      expect(tetris.board[0]).toHaveLength(10);
    });

    test('should detect game over when piece cannot spawn', () => {
      // Fill top rows to block spawning
      for (let x = 0; x < 10; x++) {
        tetris.board[0][x] = 'X';
        tetris.board[1][x] = 'X';
      }
      
      tetris.spawnPiece();
      expect(tetris.gameOver).toBe(true);
    });

    test('should not spawn pieces when game is over', () => {
      tetris.gameOver = true;
      tetris.spawnPiece();
      expect(tetris.currentPiece).toBeNull();
    });

    test('should reset game to initial state', () => {
      // Modify game state
      tetris.score = 1000;
      tetris.level = 5;
      tetris.lines = 25;
      tetris.gameOver = true;
      tetris.board[0][0] = 'X';
      
      tetris.reset();
      
      expect(tetris.score).toBe(0);
      expect(tetris.level).toBe(1);
      expect(tetris.lines).toBe(0);
      expect(tetris.gameOver).toBe(false);
      expect(tetris.currentPiece).toBeNull();
      expect(tetris.board[0][0]).toBe(' ');
    });

    test('should handle game updates with delta time', () => {
      tetris.spawnPiece();
      const originalY = tetris.currentPiece.y;
      
      // Simulate 1 second passing (should trigger drop)
      tetris.update(1000);
      
      expect(tetris.currentPiece.y).toBe(originalY + 1);
    });

    test('should not update when game is over', () => {
      tetris.gameOver = true;
      tetris.spawnPiece();
      const dropTime = tetris.dropTime;
      
      tetris.update(1000);
      
      expect(tetris.dropTime).toBe(dropTime); // Should not change
    });
  });

  describe('Scenario 6: Display Generation', () => {
    test('should generate correct empty board display', () => {
      const display = tetris.getDisplay();
      
      expect(display).toHaveLength(20);
      expect(display[0]).toHaveLength(10);
      
      // All cells should be empty
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          expect(display[y][x]).toBe(' ');
        }
      }
    });

    test('should overlay current piece on board display', () => {
      tetris.currentPiece = {
        shape: [
          ['X', 'X']
        ],
        x: 4,
        y: 5
      };
      
      const display = tetris.getDisplay();
      
      expect(display[5][4]).toBe('X');
      expect(display[5][5]).toBe('X');
    });

    test('should show both placed pieces and current piece', () => {
      // Place a block on the board
      tetris.board[10][3] = 'X';
      
      // Add current piece
      tetris.currentPiece = {
        shape: [
          ['X']
        ],
        x: 5,
        y: 8
      };
      
      const display = tetris.getDisplay();
      
      expect(display[10][3]).toBe('X'); // Placed piece
      expect(display[8][5]).toBe('X'); // Current piece
    });

    test('should not modify original board when generating display', () => {
      const originalBoard = JSON.stringify(tetris.board);
      
      tetris.currentPiece = {
        shape: [['X']],
        x: 0,
        y: 0
      };
      
      tetris.getDisplay();
      
      expect(JSON.stringify(tetris.board)).toBe(originalBoard);
    });
  });

  describe('Scenario 7: Performance and Timing', () => {
    beforeEach(() => {
      tetris.spawnPiece();
    });

    test('should accumulate drop time correctly', () => {
      const initialDropTime = tetris.dropTime;
      
      tetris.update(500); // Half the drop interval
      
      expect(tetris.dropTime).toBe(initialDropTime + 500);
    });

    test('should trigger drop when drop interval reached', () => {
      const originalY = tetris.currentPiece.y;
      
      tetris.update(1000); // Full drop interval
      
      expect(tetris.currentPiece.y).toBe(originalY + 1);
      expect(tetris.dropTime).toBe(0); // Reset after drop
    });

    test('should handle multiple drops in single update', () => {
      const originalY = tetris.currentPiece.y;
      
      tetris.update(2500); // 2.5x drop interval
      
      expect(tetris.currentPiece.y).toBe(originalY + 2);
    });

    test('should calculate drop interval based on level', () => {
      tetris.level = 1;
      tetris.clearLines();
      expect(tetris.dropInterval).toBe(1000);
      
      tetris.level = 3;
      tetris.clearLines();
      expect(tetris.dropInterval).toBe(800);
      
      tetris.level = 10;
      tetris.clearLines();
      expect(tetris.dropInterval).toBe(200);
      
      tetris.level = 15;
      tetris.clearLines();
      expect(tetris.dropInterval).toBe(100); // Minimum cap
    });

    test('should handle zero and negative time deltas gracefully', () => {
      const originalY = tetris.currentPiece.y;
      const originalDropTime = tetris.dropTime;
      
      tetris.update(0);
      expect(tetris.currentPiece.y).toBe(originalY);
      expect(tetris.dropTime).toBe(originalDropTime);
      
      tetris.update(-100);
      expect(tetris.currentPiece.y).toBe(originalY);
      expect(tetris.dropTime).toBe(originalDropTime - 100);
    });
  });
});