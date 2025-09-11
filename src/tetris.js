class Tetris {
  constructor() {
    this.board = this.createBoard(20, 10);
    this.currentPiece = null;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.dropTime = 0;
    this.dropInterval = 1000;
    
    this.pieces = [
      // I-piece
      [
        ['X', 'X', 'X', 'X']
      ],
      // O-piece  
      [
        ['X', 'X'],
        ['X', 'X']
      ],
      // T-piece
      [
        [' ', 'X', ' '],
        ['X', 'X', 'X']
      ],
      // S-piece
      [
        [' ', 'X', 'X'],
        ['X', 'X', ' ']
      ],
      // Z-piece
      [
        ['X', 'X', ' '],
        [' ', 'X', 'X']
      ],
      // J-piece
      [
        ['X', ' ', ' '],
        ['X', 'X', 'X']
      ],
      // L-piece
      [
        [' ', ' ', 'X'],
        ['X', 'X', 'X']
      ]
    ];
  }

  createBoard(height, width) {
    return Array.from({ length: height }, () => 
      Array.from({ length: width }, () => ' ')
    );
  }

  spawnPiece() {
    if (this.gameOver) return; // Don't spawn if game is over
    
    const pieceIndex = Math.floor(Math.random() * this.pieces.length);
    this.currentPiece = {
      shape: this.pieces[pieceIndex],
      x: Math.floor((10 - this.pieces[pieceIndex][0].length) / 2),
      y: 0
    };
    
    if (!this.isValidMove(this.currentPiece)) {
      this.gameOver = true;
    }
  }

  isValidMove(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] === 'X') {
          const newX = piece.x + x;
          const newY = piece.y + y;
          
          if (newX < 0 || newX >= 10 || newY >= 20) {
            return false;
          }
          
          if (newY >= 0 && this.board[newY][newX] !== ' ') {
            return false;
          }
        }
      }
    }
    return true;
  }

  movePiece(dx, dy, isSoftDrop = false) {
    if (!this.currentPiece) return false;
    
    const newPiece = {
      ...this.currentPiece,
      x: this.currentPiece.x + dx,
      y: this.currentPiece.y + dy
    };
    
    if (this.isValidMove(newPiece)) {
      this.currentPiece = newPiece;
      
      // Add soft drop scoring according to Tech Design
      if (isSoftDrop && dy > 0) {
        this.score += dy; // 1 point per cell for soft drop
      }
      
      return true;
    }
    return false;
  }

  rotatePiece() {
    if (!this.currentPiece || !this.currentPiece.shape || !this.currentPiece.shape[0]) return;
    
    // Don't rotate O-piece (square) as it looks the same
    if (this.currentPiece.shape.length === 2 && this.currentPiece.shape[0].length === 2 &&
        this.currentPiece.shape[0][0] === 'X' && this.currentPiece.shape[0][1] === 'X' &&
        this.currentPiece.shape[1][0] === 'X' && this.currentPiece.shape[1][1] === 'X') {
      return; // O-piece doesn't need rotation
    }
    
    const rotated = this.currentPiece.shape[0].map((_, index) =>
      this.currentPiece.shape.map(row => row[index]).reverse()
    );
    
    const rotatedPiece = {
      ...this.currentPiece,
      shape: rotated
    };
    
    if (this.isValidMove(rotatedPiece)) {
      this.currentPiece = rotatedPiece;
    }
  }

  placePiece() {
    if (!this.currentPiece || !this.currentPiece.shape) return;
    
    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        if (this.currentPiece.shape[y][x] === 'X') {
          const boardX = this.currentPiece.x + x;
          const boardY = this.currentPiece.y + y;
          if (boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
            this.board[boardY][boardX] = 'X';
          }
        }
      }
    }
    
    this.clearLines();
    this.currentPiece = null;
  }

  clearLines() {
    let linesCleared = 0;
    
    for (let y = this.board.length - 1; y >= 0; y--) {
      if (this.board[y].every(cell => cell === 'X')) {
        this.board.splice(y, 1);
        this.board.unshift(Array(10).fill(' '));
        linesCleared++;
        y++;
      }
    }
    
    if (linesCleared > 0) {
      this.lines += linesCleared;
      
      // Implement proper Tetris scoring system according to Tech Design
      let scoreMultiplier;
      switch (linesCleared) {
      case 1:
        scoreMultiplier = 100; // Single line
        break;
      case 2:
        scoreMultiplier = 300; // Double lines
        break;
      case 3:
        scoreMultiplier = 500; // Triple lines
        break;
      case 4:
        scoreMultiplier = 800; // Tetris (4 lines)
        break;
      default:
        scoreMultiplier = 100; // Fallback
      }
      
      this.score += scoreMultiplier * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
    } else {
      // Recalculate level even if no lines were cleared (for tests that manually set lines)
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
    }
  }

  drop() {
    if (!this.currentPiece) return;
    
    if (!this.movePiece(0, 1, true)) { // Pass true for soft drop scoring
      this.placePiece();
      this.spawnPiece();
    }
  }

  hardDrop() {
    if (!this.currentPiece) return;
    
    let dropDistance = 0;
    
    // Find the lowest valid position
    while (this.movePiece(0, 1)) {
      dropDistance++;
    }
    
    // Add hard drop scoring according to Tech Design: 2 points per cell
    this.score += dropDistance * 2;
    
    this.placePiece();
    this.spawnPiece();
  }

  update(deltaTime) {
    if (this.gameOver) return;
    
    this.dropTime += deltaTime;
    if (this.dropTime >= this.dropInterval) {
      this.drop();
      this.dropTime = 0;
    }
  }

  getDisplay() {
    const display = this.board.map(row => [...row]);
    
    if (this.currentPiece && this.currentPiece.shape) {
      for (let y = 0; y < this.currentPiece.shape.length; y++) {
        for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
          if (this.currentPiece.shape[y][x] === 'X') {
            const boardX = this.currentPiece.x + x;
            const boardY = this.currentPiece.y + y;
            if (boardX >= 0 && boardX < 10 && boardY >= 0 && boardY < 20) {
              display[boardY][boardX] = 'X';
            }
          }
        }
      }
    }
    
    return display;
  }

  reset() {
    this.board = this.createBoard(20, 10);
    this.currentPiece = null;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.dropTime = 0;
    this.dropInterval = 1000;
  }
}

module.exports = Tetris;