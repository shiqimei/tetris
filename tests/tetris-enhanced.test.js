const Tetris = require('../src/tetris');

describe('Tetris Enhanced Functionality Tests', () => {
  let tetris;

  beforeEach(() => {
    tetris = new Tetris();
  });

  describe('Piece Definition System', () => {
    test('should have proper piece structure with 7 standard types', () => {
      expect(tetris.pieceDefinitions).toBeDefined();
      expect(tetris.pieceTypes).toEqual(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
      expect(Object.keys(tetris.pieceDefinitions)).toHaveLength(7);
    });

    test('should have 4 rotation states for each piece', () => {
      tetris.pieceTypes.forEach(pieceType => {
        expect(tetris.pieceDefinitions[pieceType]).toHaveLength(4);
      });
    });

    test('should have correct I-piece shapes for all rotations', () => {
      const iPiece = tetris.pieceDefinitions['I'];
      expect(iPiece[0]).toEqual([['X', 'X', 'X', 'X']]);
      expect(iPiece[1]).toEqual([['X'], ['X'], ['X'], ['X']]);
      expect(iPiece[2]).toEqual([['X', 'X', 'X', 'X']]);
      expect(iPiece[3]).toEqual([['X'], ['X'], ['X'], ['X']]);
    });

    test('should have correct T-piece shapes for all rotations', () => {
      const tPiece = tetris.pieceDefinitions['T'];
      expect(tPiece[0]).toEqual([[' ', 'X', ' '], ['X', 'X', 'X']]);
      expect(tPiece[1]).toEqual([['X', ' '], ['X', 'X'], ['X', ' ']]);
      expect(tPiece[2]).toEqual([['X', 'X', 'X'], [' ', 'X', ' ']]);
      expect(tPiece[3]).toEqual([[' ', 'X'], ['X', 'X'], [' ', 'X']]);
    });
  });

  describe('Advanced Piece Spawning', () => {
    test('should spawn piece with proper rotation state tracking', () => {
      tetris.spawnPiece();
      expect(tetris.currentPiece).toBeDefined();
      expect(tetris.currentPiece.type).toBeOneOf(tetris.pieceTypes);
      expect(tetris.currentPiece.rotation).toBe(0);
      expect(tetris.currentPiece.shape).toEqual(
        tetris.pieceDefinitions[tetris.currentPiece.type][0]
      );
    });

    test('should center pieces correctly on spawn', () => {
      for (let i = 0; i < 20; i++) {
        tetris.spawnPiece();
        const pieceWidth = tetris.currentPiece.shape[0].length;
        const expectedX = Math.floor((10 - pieceWidth) / 2);
        expect(tetris.currentPiece.x).toBe(expectedX);
        expect(tetris.currentPiece.y).toBe(0);
      }
    });
  });

  describe('Enhanced Rotation System', () => {
    test('should track rotation state correctly', () => {
      tetris.currentPiece = {
        type: 'T',
        shape: tetris.pieceDefinitions['T'][0],
        rotation: 0,
        x: 4,
        y: 5
      };

      // Test full rotation cycle
      for (let i = 1; i <= 4; i++) {
        tetris.rotatePiece();
        const expectedRotation = i % 4;
        const expectedShape = tetris.pieceDefinitions['T'][expectedRotation];
        expect(tetris.currentPiece.rotation).toBe(expectedRotation);
        expect(tetris.currentPiece.shape).toEqual(expectedShape);
      }
    });

    test('should support counterclockwise rotation', () => {
      tetris.currentPiece = {
        type: 'T',
        shape: tetris.pieceDefinitions['T'][0],
        rotation: 0,
        x: 4,
        y: 5
      };

      tetris.rotatePiece(false); // Counterclockwise
      expect(tetris.currentPiece.rotation).toBe(3);
      expect(tetris.currentPiece.shape).toEqual(tetris.pieceDefinitions['T'][3]);
    });

    test('should handle rotation collision properly', () => {
      // Place I-piece horizontally near bottom
      tetris.currentPiece = {
        type: 'I',
        shape: tetris.pieceDefinitions['I'][0],
        rotation: 0,
        x: 3,
        y: 19
      };

      const originalRotation = tetris.currentPiece.rotation;
      tetris.rotatePiece();

      // Rotation should be blocked due to bottom boundary
      expect(tetris.currentPiece.rotation).toBe(originalRotation);
    });
  });

  describe('Lock Delay System', () => {
    test('should initialize lock delay properties', () => {
      expect(tetris.lockDelay).toBe(500);
      expect(tetris.lockTimer).toBe(0);
      expect(tetris.isLocking).toBe(false);
    });

    test('should trigger lock delay when piece cannot move down', () => {
      // Fill bottom row except center
      for (let x = 0; x < 10; x++) {
        if (x !== 4 && x !== 5) {
          tetris.board[19][x] = 'X';
        }
      }

      // Spawn O-piece at bottom
      tetris.currentPiece = {
        type: 'O',
        shape: tetris.pieceDefinitions['O'][0],
        rotation: 0,
        x: 4,
        y: 18
      };

      // Try to drop - should trigger lock delay
      tetris.drop();
      expect(tetris.isLocking).toBe(true);
      expect(tetris.lockTimer).toBe(0);
    });
  });

  describe('Soft Drop and Hard Drop Mechanics', () => {
    beforeEach(() => {
      tetris.spawnPiece();
    });

    test('should award 1 point per cell for soft drop', () => {
      const originalScore = tetris.score;
      tetris.movePiece(0, 1, true); // Soft drop
      expect(tetris.score).toBe(originalScore + 1);
    });

    test('should award 2 points per cell for hard drop', () => {
      const originalScore = tetris.score;
      const originalY = tetris.currentPiece.y;
      
      tetris.hardDrop();
      
      const dropDistance = 19 - originalY; // Approximate drop distance
      expect(tetris.score).toBeGreaterThanOrEqual(originalScore + dropDistance * 2);
      expect(tetris.currentPiece).toBeDefined(); // New piece spawned
    });

    test('should calculate hard drop distance correctly', () => {
      // Clear board
      tetris.board = tetris.createBoard(20, 10);
      
      tetris.currentPiece = {
        type: 'O',
        shape: tetris.pieceDefinitions['O'][0],
        rotation: 0,
        x: 4,
        y: 5
      };

      const originalScore = tetris.score;
      tetris.hardDrop();
      
      // O-piece from y=5 should drop to y=18 (2x2 piece)
      const expectedScore = originalScore + (18 - 5) * 2;
      expect(tetris.score).toBe(expectedScore);
    });
  });

  describe('Fixed Scoring System', () => {
    test('should use fixed scoring values (not level multiplied)', () => {
      tetris.level = 5; // High level to test fixed scoring
      
      // Clear single line
      for (let x = 0; x < 10; x++) {
        tetris.board[19][x] = 'X';
      }
      
      const originalScore = tetris.score;
      tetris.clearLines();
      
      expect(tetris.score).toBe(originalScore + 100); // Fixed 100, not 100 * level
    });

    test('should award correct points for multiple line clears', () => {
      const testCases = [
        { lines: 1, expectedPoints: 100 },
        { lines: 2, expectedPoints: 300 },
        { lines: 3, expectedPoints: 500 },
        { lines: 4, expectedPoints: 800 }
      ];

      testCases.forEach(({ lines, expectedPoints }) => {
        tetris.reset();
        
        // Fill specified number of lines
        for (let y = 20 - lines; y < 20; y++) {
          for (let x = 0; x < 10; x++) {
            tetris.board[y][x] = 'X';
          }
        }
        
        const originalScore = tetris.score;
        tetris.clearLines();
        
        expect(tetris.score).toBe(originalScore + expectedPoints);
      });
    });
  });

  describe('Game Update Loop', () => {
    beforeEach(() => {
      tetris.spawnPiece();
    });

    test('should update drop timer correctly', () => {
      const originalDropTime = tetris.dropTime;
      tetris.update(500);
      expect(tetris.dropTime).toBe(originalDropTime + 500);
    });

    test('should trigger automatic drop when interval reached', () => {
      const originalY = tetris.currentPiece.y;
      tetris.update(1000); // Full drop interval
      
      // Piece should have moved down or been placed
      expect(tetris.currentPiece.y).toBeGreaterThanOrEqual(originalY);
    });

    test('should handle lock delay timer in update loop', () => {
      // Force locking state
      tetris.isLocking = true;
      tetris.lockTimer = 0;
      
      tetris.update(300);
      expect(tetris.lockTimer).toBe(300);
      
      // Should not place piece yet (300ms < 500ms delay)
      expect(tetris.isLocking).toBe(true);
      
      tetris.update(250); // Total: 550ms > 500ms delay
      expect(tetris.isLocking).toBe(false);
    });
  });

  describe('Game State Management', () => {
    test('should reset all properties correctly', () => {
      // Modify game state
      tetris.score = 5000;
      tetris.level = 10;
      tetris.lines = 95;
      tetris.gameOver = true;
      tetris.dropTime = 500;
      tetris.lockTimer = 300;
      tetris.isLocking = true;
      
      tetris.reset();
      
      expect(tetris.score).toBe(0);
      expect(tetris.level).toBe(1);
      expect(tetris.lines).toBe(0);
      expect(tetris.gameOver).toBe(false);
      expect(tetris.dropTime).toBe(0);
      expect(tetris.dropInterval).toBe(1000);
      expect(tetris.lockTimer).toBe(0);
      expect(tetris.isLocking).toBe(false);
    });

    test('should preserve piece definitions after reset', () => {
      const originalPieceDefinitions = { ...tetris.pieceDefinitions };
      tetris.reset();
      expect(tetris.pieceDefinitions).toEqual(originalPieceDefinitions);
      expect(tetris.pieceTypes).toEqual(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
    });
  });
});

// Custom Jest matcher
expect.extend({
  toBeOneOf(received, array) {
    const pass = array.includes(received);
    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be one of ${array.join(', ')}`
        : `Expected ${received} to be one of ${array.join(', ')}`
    };
  }
});