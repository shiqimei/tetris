const Tetris = require('../src/tetris');

describe('Tetris Game Logic', () => {
  let tetris;

  beforeEach(() => {
    tetris = new Tetris();
  });

  describe('Board Creation', () => {
    test('should create a 20x10 game board', () => {
      expect(tetris.board).toHaveLength(20);
      expect(tetris.board[0]).toHaveLength(10);
      expect(tetris.board[19]).toHaveLength(10);
    });

    test('should initialize empty board with spaces', () => {
      for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 10; x++) {
          expect(tetris.board[y][x]).toBe(' ');
        }
      }
    });
  });

  describe('Game Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(tetris.score).toBe(0);
      expect(tetris.level).toBe(1);
      expect(tetris.lines).toBe(0);
      expect(tetris.gameOver).toBe(false);
    });

    test('should have all 7 standard Tetris pieces defined', () => {
      expect(tetris.pieces).toHaveLength(7);
    });
  });

  describe('Piece Movement', () => {
    beforeEach(() => {
      tetris.spawnPiece();
    });

    test('should move piece left when valid', () => {
      const originalX = tetris.currentPiece.x;
      const moved = tetris.movePiece(-1, 0);
      expect(moved).toBe(true);
      expect(tetris.currentPiece.x).toBe(originalX - 1);
    });

    test('should move piece right when valid', () => {
      const originalX = tetris.currentPiece.x;
      const moved = tetris.movePiece(1, 0);
      expect(moved).toBe(true);
      expect(tetris.currentPiece.x).toBe(originalX + 1);
    });

    test('should not move piece beyond left boundary', () => {
      // Move piece to left edge
      tetris.currentPiece.x = 0;
      const moved = tetris.movePiece(-1, 0);
      expect(moved).toBe(false);
      expect(tetris.currentPiece.x).toBe(0);
    });

    test('should not move piece beyond right boundary', () => {
      // Move piece to right edge  
      tetris.currentPiece.x = 9;
      const moved = tetris.movePiece(1, 0);
      expect(moved).toBe(false);
      expect(tetris.currentPiece.x).toBe(9);
    });
  });

  describe('Collision Detection', () => {
    beforeEach(() => {
      tetris.spawnPiece();
    });

    test('should detect valid moves correctly', () => {
      const validPiece = {
        ...tetris.currentPiece,
        x: 3,
        y: 5
      };
      expect(tetris.isValidMove(validPiece)).toBe(true);
    });

    test('should prevent movement into occupied cells', () => {
      // Place a piece on the board
      tetris.board[19][5] = 'X';
      
      const invalidPiece = {
        ...tetris.currentPiece,
        x: 5,
        y: 18
      };
      expect(tetris.isValidMove(invalidPiece)).toBe(false);
    });
  });

  describe('Line Clearing', () => {
    test('should clear completed lines', () => {
      // Fill a line completely
      for (let x = 0; x < 10; x++) {
        tetris.board[19][x] = 'X';
      }

      const originalLines = tetris.lines;
      const originalScore = tetris.score;
      
      tetris.clearLines();
      
      expect(tetris.lines).toBe(originalLines + 1);
      expect(tetris.score).toBeGreaterThan(originalScore);
      
      // Check that the line was cleared
      expect(tetris.board[19].every(cell => cell === ' ')).toBe(true);
    });

    test('should not clear incomplete lines', () => {
      // Fill line except one cell
      for (let x = 0; x < 9; x++) {
        tetris.board[19][x] = 'X';
      }

      const originalLines = tetris.lines;
      tetris.clearLines();
      
      expect(tetris.lines).toBe(originalLines);
    });
  });

  describe('Scoring System', () => {
    test('should calculate score based on lines cleared and level', () => {
      tetris.level = 2;
      
      // Fill a line completely
      for (let x = 0; x < 10; x++) {
        tetris.board[19][x] = 'X';
      }

      const originalScore = tetris.score;
      tetris.clearLines();
      
      expect(tetris.score).toBe(originalScore + (1 * 100 * 2));
    });

    test('should increase level based on lines cleared', () => {
      tetris.lines = 9;
      
      // Clear one more line to trigger level increase
      for (let x = 0; x < 10; x++) {
        tetris.board[19][x] = 'X';
      }

      tetris.clearLines();
      
      expect(tetris.level).toBe(2);
    });
  });
});