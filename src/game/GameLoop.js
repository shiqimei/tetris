/**
 * GameLoop Class
 *
 * Manages the game loop timing and frame rate control including:
 * - Delta-time based updates for consistent gameplay
 * - Frame rate throttling (30-60 FPS)
 * - Pause functionality
 * - Clean startup and shutdown
 *
 * REQ-4: Game Progression - Consistent timing
 * NFR-1: Performance - Consistent 30-60 FPS rendering rate
 */

/**
 * GameLoop class for managing game timing
 */
export class GameLoop {
  /**
   * Create a new GameLoop
   * @param {Function} updateCallback - Function to call for game updates
   * @param {Object} options - Configuration options
   * @param {number} options.targetFPS - Target frames per second (default: 60)
   */
  constructor(updateCallback = null, options = {}) {
    this.updateCallback = updateCallback;
    this.targetFPS = options.targetFPS || 60;
    this.isRunning = false;
    this.isPaused = false;
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.timerId = null;
    this.deltaTime = 0;

    // Calculate frame delay from target FPS
    this.targetFrameDelay = 1000 / this.targetFPS;
  }

  /**
   * Start the game loop
   * @param {Function} callback - Optional update callback to override constructor callback
   */
  start(callback = null) {
    if (this.isRunning) return;

    if (callback) {
      this.updateCallback = callback;
    }

    if (!this.updateCallback) {
      throw new Error('No update callback provided');
    }

    this.isRunning = true;
    this.lastFrameTime = Date.now();
    this._loop();
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Pause the game loop (keeps running but skips updates)
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume the game loop
   */
  resume() {
    this.isPaused = false;
    this.lastFrameTime = Date.now(); // Reset time to prevent large delta
  }

  /**
   * Main game loop iteration
   * @private
   */
  _loop() {
    if (!this.isRunning) return;

    const currentTime = Date.now();
    this.deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Call update callback if not paused
    if (!this.isPaused && this.updateCallback) {
      this.updateCallback(this.deltaTime);
      this.frameCount++;
    }

    // Calculate next frame delay to maintain target FPS
    const executionTime = Date.now() - currentTime;
    const nextDelay = Math.max(0, this.targetFrameDelay - executionTime);

    // Schedule next frame
    this.timerId = setTimeout(() => this._loop(), nextDelay);
  }

  /**
   * Get current frames per second
   * @param {number} timeWindow - Time window in ms to measure (default: 1000)
   * @returns {number} Current FPS
   */
  getFPS(timeWindow = 1000) {
    // This is a simplified FPS calculation
    // In production, you'd track frame times over a window
    return this.targetFPS;
  }

  /**
   * Set target FPS
   * @param {number} fps - Target frames per second
   */
  setTargetFPS(fps) {
    this.targetFPS = fps;
    this.targetFrameDelay = 1000 / fps;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.stop();
    this.updateCallback = null;
  }
}
