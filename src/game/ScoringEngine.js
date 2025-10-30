/**
 * ScoringEngine Class
 *
 * Manages all scoring calculations for the Tetris game including:
 * - Soft drop scoring (1 point per cell)
 * - Hard drop scoring (2 points per cell)
 * - Line clear scoring following classic Tetris formula
 * - Gravity drops (no scoring)
 *
 * REQ-3: Scoring System - Soft drop, hard drop, and line clear scoring
 * Design Spec: Classic Tetris scoring formula
 */

/**
 * Line clear scoring multipliers (base scores)
 * These are multiplied by the current level
 */
const LINE_CLEAR_SCORES = {
  1: 100,   // Single line
  2: 300,   // Double lines
  3: 500,   // Triple lines
  4: 800    // Tetris (4 lines)
};

/**
 * ScoringEngine class for calculating points
 */
export class ScoringEngine {
  /**
   * Calculate points for soft drop (manual down key press)
   * @param {number} cellsDropped - Number of cells descended
   * @returns {number} Points awarded (1 point per cell)
   */
  calculateSoftDrop(cellsDropped) {
    return cellsDropped * 1;
  }

  /**
   * Calculate points for hard drop (space bar instant placement)
   * @param {number} cellsDropped - Number of cells descended
   * @returns {number} Points awarded (2 points per cell)
   */
  calculateHardDrop(cellsDropped) {
    return cellsDropped * 2;
  }

  /**
   * Calculate points for gravity-based descent (automatic)
   * @param {number} cellsDropped - Number of cells descended
   * @returns {number} Points awarded (always 0 for gravity)
   */
  calculateGravityDrop(cellsDropped) {
    return 0; // No points for automatic gravity drops
  }

  /**
   * Calculate points for line clears
   * Uses classic Tetris scoring formula:
   * - Single (1 line): 100 × level
   * - Double (2 lines): 300 × level
   * - Triple (3 lines): 500 × level
   * - Tetris (4 lines): 800 × level
   *
   * @param {number} linesCleared - Number of lines cleared (1-4)
   * @param {number} level - Current game level
   * @returns {number} Points awarded
   */
  calculateLineClear(linesCleared, level) {
    const baseScore = LINE_CLEAR_SCORES[linesCleared] || 0;
    return baseScore * level;
  }
}
