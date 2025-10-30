/**
 * Renderer Class
 *
 * Manages terminal-based rendering for the Tetris game including:
 * - ANSI color support with graceful degradation
 * - Game board rendering
 * - Piece visualization
 * - Statistics and UI panels
 * - Terminal size validation
 *
 * REQ-5: Visual Presentation - ANSI colors, playfield rendering, statistics
 * NFR-2: Terminal Compatibility - ANSI support with graceful degradation
 */

import chalk from 'chalk';

/**
 * Color mappings for tetromino pieces using chalk
 */
const PIECE_COLORS = {
  1: chalk.cyan,      // I-piece
  2: chalk.yellow,    // O-piece
  3: chalk.magenta,   // T-piece
  4: chalk.green,     // S-piece
  5: chalk.red,       // Z-piece
  6: chalk.blue,      // J-piece
  7: chalk.hex('#FFA500')  // L-piece (orange)
};

/**
 * Minimum terminal dimensions
 */
const MIN_TERMINAL_WIDTH = 40;
const MIN_TERMINAL_HEIGHT = 24;

/**
 * Renderer class for terminal output
 */
export class Renderer {
  /**
   * Create a new Renderer
   */
  constructor() {
    this.supportsColor = this._detectColorSupport();
    this.terminalWidth = process.stdout.columns || 80;
    this.terminalHeight = process.stdout.rows || 24;
    this.cursorVisible = true;
  }

  /**
   * Detect if terminal supports colors
   * @returns {boolean} True if colors are supported
   * @private
   */
  _detectColorSupport() {
    return chalk.level > 0;
  }

  /**
   * Clear the terminal screen
   */
  clear() {
    console.clear();
  }

  /**
   * Hide terminal cursor
   */
  hideCursor() {
    process.stdout.write('\x1b[?25l');
    this.cursorVisible = false;
  }

  /**
   * Show terminal cursor
   */
  showCursor() {
    process.stdout.write('\x1b[?25h');
    this.cursorVisible = true;
  }

  /**
   * Render the complete game screen
   * @param {Game} game - Game instance to render
   * @returns {string} Rendered output
   */
  render(game) {
    let output = '';

    if (game.isGameOver) {
      output += this.renderGameOver(game);
    } else if (game.isPaused) {
      output += this.renderBoard(game.board, game.currentPiece);
      output += '\n\n  ' + chalk.bold.yellow('PAUSED') + '\n';
      output += this.renderStats(game);
    } else {
      output += this.renderBoard(game.board, game.currentPiece);
      output += this.renderStats(game);
      output += this.renderNextPiece(game.nextPiece);
      output += this.renderControls();
    }

    return output;
  }

  /**
   * Render the game board with current piece
   * @param {Board} board - Game board
   * @param {Tetromino} currentPiece - Current piece (optional)
   * @returns {string} Rendered board
   */
  renderBoard(board, currentPiece = null) {
    let output = '\n  ┌' + '─'.repeat(20) + '┐\n';

    // Create a copy of the grid to render current piece on top
    const gridCopy = board.getGrid();

    // Overlay current piece if it exists
    if (currentPiece) {
      const cells = currentPiece.getFilledCells();
      cells.forEach(cell => {
        if (cell.y >= 0 && cell.y < gridCopy.length &&
            cell.x >= 0 && cell.x < gridCopy[0].length) {
          gridCopy[cell.y][cell.x] = board._getPieceCode(currentPiece.type);
        }
      });
    }

    // Render each row
    for (let row = 0; row < gridCopy.length; row++) {
      output += '  │';
      for (let col = 0; col < gridCopy[row].length; col++) {
        const cell = gridCopy[row][col];
        if (cell === 0) {
          output += '  ';
        } else {
          output += this._renderCell(cell);
        }
      }
      output += '│\n';
    }

    output += '  └' + '─'.repeat(20) + '┘\n';
    return output;
  }

  /**
   * Render a single cell with appropriate color
   * @param {number} cellValue - Cell value (piece code)
   * @returns {string} Rendered cell
   * @private
   */
  _renderCell(cellValue) {
    const block = '██';
    if (this.supportsColor && PIECE_COLORS[cellValue]) {
      return PIECE_COLORS[cellValue](block);
    }
    return block;
  }

  /**
   * Render game statistics panel
   * @param {Game} game - Game instance
   * @returns {string} Rendered stats
   */
  renderStats(game) {
    let output = '\n';
    output += `  Score: ${chalk.bold(game.score)}\n`;
    output += `  Level: ${chalk.bold(game.level)}\n`;
    output += `  Lines: ${chalk.bold(game.linesCleared)}\n`;
    return output;
  }

  /**
   * Render next piece preview
   * @param {Tetromino} nextPiece - Next piece
   * @returns {string} Rendered preview
   */
  renderNextPiece(nextPiece) {
    if (!nextPiece) return '';

    let output = '\n  Next:\n';
    const shape = nextPiece.shape;
    for (let row = 0; row < shape.length; row++) {
      output += '  ';
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] === 1) {
          const pieceCode = nextPiece.type.charCodeAt(0) % 7 + 1;
          output += this._renderCell(pieceCode);
        } else {
          output += '  ';
        }
      }
      output += '\n';
    }
    return output;
  }

  /**
   * Render control hints
   * @returns {string} Rendered controls
   */
  renderControls() {
    let output = '\n  Controls:\n';
    output += '  ←→ / AD: Move\n';
    output += '  ↓ / S: Soft Drop\n';
    output += '  ↑ / W: Rotate\n';
    output += '  SPACE: Hard Drop\n';
    output += '  P: Pause\n';
    output += '  Q/ESC: Quit\n';
    return output;
  }

  /**
   * Render game over screen
   * @param {Game} game - Game instance
   * @returns {string} Rendered game over screen
   */
  renderGameOver(game) {
    let output = '\n\n';
    output += '  ' + chalk.bold.red('GAME OVER') + '\n\n';
    output += `  Final Score: ${chalk.bold(game.score)}\n`;
    output += `  Final Level: ${chalk.bold(game.level)}\n`;
    output += `  Lines Cleared: ${chalk.bold(game.linesCleared)}\n`;
    output += '\n  Press R to restart or Q to quit\n';
    return output;
  }

  /**
   * Check if terminal meets minimum size requirements
   * @param {number} width - Terminal width
   * @param {number} height - Terminal height
   * @returns {boolean} True if terminal is large enough
   */
  checkTerminalSize(width = this.terminalWidth, height = this.terminalHeight) {
    return width >= MIN_TERMINAL_WIDTH && height >= MIN_TERMINAL_HEIGHT;
  }

  /**
   * Get terminal size warning message
   * @param {number} width - Current terminal width
   * @param {number} height - Current terminal height
   * @returns {string} Warning message
   */
  getTerminalSizeWarning(width = this.terminalWidth, height = this.terminalHeight) {
    return `Terminal too small! Minimum size: ${MIN_TERMINAL_WIDTH}×${MIN_TERMINAL_HEIGHT}, ` +
           `current: ${width}×${height}`;
  }

  /**
   * Display the current game state
   * @param {Game} game - Game instance
   */
  display(game) {
    this.clear();
    const output = this.render(game);
    console.log(output);
  }
}
