const Tetris = require('../src/tetris');
const TetrisGame = require('../src/index');

// Mock chalk for UI tests
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

describe('Tetris Simulation Scenarios', () => {
  let tetris;

  beforeEach(() => {
    tetris = new Tetris();
  });

  describe('Scenario 1: Basic Game Board Operations', () => {
    test('should initialize board with correct dimensions', () => {
      expect(tetris.board).toHaveLength(20);
      expect(tetris.board[0]).toHaveLength(10);
      
      // Verify all cells are empty
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          expect(tetris.board[y][x]).toBe(' ');
        }
      }
    });

    test('should spawn pieces at correct positions', () => {
      for (let i = 0; i < 10; i++) {
        tetris.spawnPiece();
        expect(tetris.currentPiece).toBeDefined();
        expect(tetris.currentPiece.y).toBe(0);
        expect(tetris.currentPiece.x).toBeGreaterThanOrEqual(0);
        expect(tetris.currentPiece.x).toBeLessThan(10);
      }
    });

    test('should provide all 7 piece types', () => {
      const spawnedTypes = new Set();
      
      // Try to spawn pieces to see all types (may take multiple attempts)
      for (let i = 0; i < 100 && spawnedTypes.size < 7; i++) {
        tetris.spawnPiece();
        if (tetris.currentPiece) {
          spawnedTypes.add(tetris.currentPiece.type);
        }
      }
      
      expect(spawnedTypes.size).toBe(7);
      expect([...spawnedTypes].sort()).toEqual(['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
    });
  });

  describe('Scenario 2: Movement and Collision Detection', () => {
    beforeEach(() => {
      tetris.spawnPiece();
    });

    test('should handle boundary collisions correctly', () => {
      // Move to left edge
      while (tetris.movePiece(-1, 0)) {
        // Keep moving left until blocked
      }
      expect(tetris.currentPiece.x).toBeGreaterThanOrEqual(0);
      
      // Try to move beyond left boundary
      const leftBlocked = tetris.movePiece(-1, 0);
      expect(leftBlocked).toBe(false);
      
      // Move to right edge
      while (tetris.movePiece(1, 0)) {
        // Keep moving right until blocked
      }
      
      // Try to move beyond right boundary
      const rightBlocked = tetris.movePiece(1, 0);
      expect(rightBlocked).toBe(false);
    });

    test('should prevent overlap with placed pieces', () => {
      // Place some pieces on the board
      tetris.board[18][4] = 'X';
      tetris.board[18][5] = 'X';
      tetris.board[19][4] = 'X';
      tetris.board[19][5] = 'X';
      
      // Force O-piece at position that would overlap
      tetris.currentPiece = {
        type: 'O',
        shape: tetris.pieceDefinitions['O'][0],
        rotation: 0,
        x: 4,
        y: 17
      };
      
      // Try to move down into placed pieces
      const blocked = tetris.movePiece(0, 1);
      expect(blocked).toBe(false);
    });

    test('should validate moves correctly', () => {
      const validPiece = {
        type: 'T',
        shape: tetris.pieceDefinitions['T'][0],
        rotation: 0,
        x: 4,
        y: 10
      };
      expect(tetris.isValidMove(validPiece)).toBe(true);
      
      const invalidPiece = {
        type: 'T',
        shape: tetris.pieceDefinitions['T'][0],
        rotation: 0,
        x: -1, // Outside left boundary
        y: 10
      };
      expect(tetris.isValidMove(invalidPiece)).toBe(false);
    });
  });

  describe('Scenario 3: Line Clearing and Scoring System', () => {
    test('should clear single line and award correct points', () => {
      // Fill bottom line
      for (let x = 0; x < 10; x++) {
        tetris.board[19][x] = 'X';
      }
      
      const originalScore = tetris.score;
      const originalLines = tetris.lines;
      
      tetris.clearLines();
      
      expect(tetris.lines).toBe(originalLines + 1);
      expect(tetris.score).toBe(originalScore + 100);
      expect(tetris.board[19].every(cell => cell === ' ')).toBe(true);
    });

    test('should handle multiple line clears (Tetris)', () => {
      // Fill bottom 4 lines for Tetris
      for (let y = 16; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          tetris.board[y][x] = 'X';
        }
      }
      
      const originalScore = tetris.score;
      tetris.clearLines();
      
      expect(tetris.lines).toBe(4);
      expect(tetris.score).toBe(originalScore + 800);
      
      // Check all 4 lines were cleared
      for (let y = 16; y < 20; y++) {
        expect(tetris.board[y].every(cell => cell === ' ')).toBe(true);
      }
    });

    test('should update level based on lines cleared', () => {
      tetris.lines = 9;
      
      // Clear one more line to reach level 2
      for (let x = 0; x < 10; x++) {
        tetris.board[19][x] = 'X';
      }
      
      tetris.clearLines();
      
      expect(tetris.level).toBe(2);
      expect(tetris.lines).toBe(10);
    });

    test('should handle non-contiguous line clearing correctly', () => {
      // Fill lines 17 and 19 (skip 18)
      for (let x = 0; x < 10; x++) {
        tetris.board[17][x] = 'X';
        tetris.board[19][x] = 'X';
      }
      
      // Add partial line at 18
      for (let x = 0; x < 5; x++) {
        tetris.board[18][x] = 'X';
      }
      
      tetris.clearLines();
      
      expect(tetris.lines).toBe(2); // Only 2 complete lines cleared
      expect(tetris.board[17].every(cell => cell === ' ')).toBe(true);
      expect(tetris.board[19].every(cell => cell === ' ')).toBe(true);
      // Line 18 should still have partial blocks
      expect(tetris.board[18].slice(0, 5).every(cell => cell === 'X')).toBe(true);
    });
  });

  describe('Scenario 4: Rotation Mechanics', () => {
    test('should rotate T-piece through all states', () => {
      tetris.currentPiece = {
        type: 'T',
        shape: tetris.pieceDefinitions['T'][0],
        rotation: 0,
        x: 4,
        y: 5
      };
      
      const rotationSequence = [
        tetris.pieceDefinitions['T'][0], // 0°
        tetris.pieceDefinitions['T'][1], // 90°
        tetris.pieceDefinitions['T'][2], // 180°
        tetris.pieceDefinitions['T'][3]  // 270°
      ];
      
      for (let i = 0; i < 4; i++) {
        expect(tetris.currentPiece.shape).toEqual(rotationSequence[i]);
        expect(tetris.currentPiece.rotation).toBe(i);
        tetris.rotatePiece(true); // Clockwise
      }
      
      // After full rotation, should be back to original
      expect(tetris.currentPiece.rotation).toBe(0);
      expect(tetris.currentPiece.shape).toEqual(rotationSequence[0]);
    });

    test('should prevent invalid rotations', () => {
      // Place I-piece horizontally at bottom
      tetris.currentPiece = {
        type: 'I',
        shape: tetris.pieceDefinitions['I'][0],
        rotation: 0,
        x: 3,
        y: 19
      };
      
      const originalRotation = tetris.currentPiece.rotation;
      const originalShape = [...tetris.currentPiece.shape];
      
      tetris.rotatePiece();
      
      // Rotation should be blocked
      expect(tetris.currentPiece.rotation).toBe(originalRotation);
      expect(tetris.currentPiece.shape).toEqual(originalShape);
    });

    test('should handle counterclockwise rotation', () => {
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
  });

  describe('Scenario 5: Hard Drop and Soft Drop', () => {
    test('should execute hard drop correctly', () => {
      // Clear board for predictable drop distance
      tetris.board = tetris.createBoard(20, 10);
      
      tetris.currentPiece = {
        type: 'O',
        shape: tetris.pieceDefinitions['O'][0],
        rotation: 0,
        x: 4,
        y: 0
      };
      
      const originalScore = tetris.score;
      tetris.hardDrop();
      
      // O-piece should drop from y=0 to y=18 (2x2 piece)
      const expectedDropDistance = 18;
      expect(tetris.score).toBe(originalScore + expectedDropDistance * 2);
      
      // New piece should have spawned
      expect(tetris.currentPiece).toBeDefined();
      expect(tetris.currentPiece.y).toBe(0);
    });

    test('should award soft drop points', () => {
      tetris.currentPiece = {
        type: 'T',
        shape: tetris.pieceDefinitions['T'][0],
        rotation: 0,
        x: 4,
        y: 5
      };
      
      const originalScore = tetris.score;
      tetris.movePiece(0, 3, true); // Soft drop 3 cells
      
      expect(tetris.score).toBe(originalScore + 3);
    });
  });

  describe('Scenario 6: Game Over Conditions', () => {
    test('should detect game over when piece cannot spawn', () => {
      // Fill top rows to block spawning
      for (let y = 0; y < 4; y++) {
        for (let x = 3; x < 7; x++) {
          tetris.board[y][x] = 'X';
        }
      }
      
      tetris.spawnPiece();
      
      expect(tetris.gameOver).toBe(true);
    });

    test('should continue game when spawning is possible', () => {
      // Fill some top rows but leave spawn area clear
      for (let x = 0; x < 3; x++) {
        tetris.board[0][x] = 'X';
      }
      for (let x = 7; x < 10; x++) {
        tetris.board[0][x] = 'X';
      }
      
      tetris.spawnPiece();
      
      expect(tetris.gameOver).toBe(false);
      expect(tetris.currentPiece).toBeDefined();
    });
  });

  describe('Scenario 7: Complete Game Simulation', () => {
    test('should simulate complete game session', () => {
      let turnCount = 0;
      const maxTurns = 50; // Prevent infinite loops
      
      tetris.spawnPiece();
      
      while (!tetris.gameOver && turnCount < maxTurns) {
        turnCount++;
        
        // Simulate player actions
        if (tetris.currentPiece) {
          // Random movement
          const actions = [
            () => tetris.movePiece(-1, 0), // Left
            () => tetris.movePiece(1, 0),  // Right
            () => tetris.movePiece(0, 1, true), // Soft drop
            () => tetris.rotatePiece(),    // Rotate
            () => tetris.hardDrop()        // Hard drop (ends piece)
          ];
          
          const action = actions[Math.floor(Math.random() * actions.length)];
          action();
          
          // If piece is still falling, hard drop to speed up simulation
          if (tetris.currentPiece && turnCount % 5 === 0) {
            tetris.hardDrop();
          }
        }
      }
      
      expect(turnCount).toBeGreaterThan(0);
      expect(turnCount).toBeLessThanOrEqual(maxTurns);
      
      // Game should have progressed
      expect(tetris.score).toBeGreaterThanOrEqual(0);
    });

    test('should maintain consistent state throughout gameplay', () => {
      tetris.spawnPiece();
      
      for (let i = 0; i < 10; i++) {
        // Verify game state consistency
        expect(tetris.board).toHaveLength(20);
        expect(tetris.board[0]).toHaveLength(10);
        expect(tetris.score).toBeGreaterThanOrEqual(0);
        expect(tetris.level).toBeGreaterThanOrEqual(1);
        expect(tetris.lines).toBeGreaterThanOrEqual(0);
        
        if (!tetris.gameOver && tetris.currentPiece) {
          // Perform some action
          if (Math.random() < 0.5) {
            tetris.movePiece(0, 1, true); // Soft drop
          } else {
            tetris.hardDrop(); // Place piece and spawn new one
          }
        }
        
        if (tetris.gameOver) break;
      }
      
      // Final state should still be valid
      expect(tetris.board).toHaveLength(20);
      expect(tetris.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Scenario 8: Performance and Edge Cases', () => {
    test('should handle rapid input without errors', () => {
      tetris.spawnPiece();
      
      // Simulate rapid keypresses
      for (let i = 0; i < 100; i++) {
        if (tetris.currentPiece) {
          tetris.movePiece(Math.random() < 0.5 ? -1 : 1, 0);
          if (i % 10 === 0) {
            tetris.rotatePiece();
          }
        }
      }
      
      expect(tetris.currentPiece).toBeDefined();
      expect(tetris.board).toHaveLength(20);
    });

    test('should handle null piece operations gracefully', () => {
      tetris.currentPiece = null;
      
      expect(tetris.movePiece(1, 0)).toBe(false);
      expect(() => tetris.rotatePiece()).not.toThrow();
      expect(() => tetris.placePiece()).not.toThrow();
      expect(() => tetris.hardDrop()).not.toThrow();
    });

    test('should complete operations within performance thresholds', () => {
      tetris.spawnPiece();
      
      const operations = [
        () => tetris.movePiece(1, 0),
        () => tetris.rotatePiece(),
        () => tetris.isValidMove(tetris.currentPiece),
        () => tetris.clearLines(),
        () => tetris.update(16) // 60fps frame
      ];
      
      operations.forEach(operation => {
        const start = Date.now();
        operation();
        const end = Date.now();
        expect(end - start).toBeLessThan(10); // Should be very fast
      });
    });
  });
});