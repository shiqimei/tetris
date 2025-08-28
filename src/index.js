#!/usr/bin/env node

const Tetris = require('./tetris');
const readline = require('readline');

class TetrisGame {
  constructor() {
    this.tetris = new Tetris();
    this.isRunning = false;
    this.lastTime = Date.now();
    this.setupInput();
  }

  setupInput() {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    process.stdin.on('keypress', (str, key) => {
      if (key && key.ctrl && key.name === 'c') {
        this.quit();
        return;
      }

      if (key && key.name === 'q') {
        this.quit();
        return;
      }

      if (this.tetris.gameOver) {
        if (key.name === 'r') {
          this.restart();
        } else if (key.name === 'q') {
          this.quit();
        }
        return;
      }

      if (key) {
        switch (key.name) {
          case 'left':
            this.tetris.movePiece(-1, 0);
            break;
          case 'right':
            this.tetris.movePiece(1, 0);
            break;
          case 'down':
            this.tetris.drop();
            break;
          case 'up':
            this.tetris.rotatePiece();
            break;
          case 'space':
            this.tetris.hardDrop();
            break;
          case 'p':
            this.togglePause();
            break;
        }
      }
    });
  }

  togglePause() {
    this.isRunning = !this.isRunning;
  }

  restart() {
    this.tetris.reset();
    this.tetris.spawnPiece();
    this.isRunning = true;
    this.lastTime = Date.now();
  }

  quit() {
    console.clear();
    console.log('Thanks for playing Tetris!');
    process.exit(0);
  }

  render() {
    console.clear();
    
    console.log('='.repeat(22));
    console.log('       TETRIS');
    console.log('='.repeat(22));
    
    const display = this.tetris.getDisplay();
    
    for (let row of display) {
      console.log('|' + row.map(cell => cell === ' ' ? '·' : '█').join('') + '|');
    }
    
    console.log('=' + '='.repeat(20) + '=');
    console.log(`Score: ${this.tetris.score.toString().padStart(8, '0')}`);
    console.log(`Level: ${this.tetris.level.toString().padStart(8, '0')}`);
    console.log(`Lines: ${this.tetris.lines.toString().padStart(8, '0')}`);
    console.log();
    
    if (this.tetris.gameOver) {
      console.log('GAME OVER!');
      console.log('Press R to restart or Q to quit');
    } else if (!this.isRunning) {
      console.log('PAUSED');
      console.log('Press P to resume');
    } else {
      console.log('Controls:');
      console.log('← → ↓ ↑ : Move/Rotate');
      console.log('Space   : Hard Drop');
      console.log('P       : Pause');
      console.log('Q       : Quit');
    }
  }

  gameLoop() {
    const now = Date.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    if (this.isRunning && !this.tetris.gameOver) {
      this.tetris.update(deltaTime);
    }

    this.render();

    if (!this.tetris.gameOver || this.isRunning) {
      setTimeout(() => this.gameLoop(), 50);
    } else {
      setTimeout(() => this.gameLoop(), 100);
    }
  }

  start() {
    console.log('Starting Tetris...');
    console.log('Use arrow keys to play, Q to quit');
    
    this.isRunning = true;
    this.lastTime = Date.now();
    this.tetris.spawnPiece();
    
    setTimeout(() => this.gameLoop(), 100);
  }
}

if (require.main === module) {
  const game = new TetrisGame();
  game.start();
}

module.exports = TetrisGame;