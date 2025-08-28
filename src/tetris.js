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

  movePiece(dx, dy) {
    if (!this.currentPiece) return false;
    
    const newPiece = {
      ...this.currentPiece,
      x: this.currentPiece.x + dx,
      y: this.currentPiece.y + dy
    };
    
    if (this.isValidMove(newPiece)) {
      this.currentPiece = newPiece;
      return true;
    }
    return false;
  }

  rotatePiece() {
    if (!this.currentPiece) return;
    
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
    if (!this.currentPiece) return;
    
    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        if (this.currentPiece.shape[y][x] === 'X') {
          const boardX = this.currentPiece.x + x;
          const boardY = this.currentPiece.y + y;
          if (boardY >= 0) {
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
      this.score += linesCleared * 100 * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
    }
  }

  drop() {
    if (!this.movePiece(0, 1)) {
      this.placePiece();
      this.spawnPiece();
    }
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
    
    if (this.currentPiece) {
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