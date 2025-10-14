# UUID
e2d73ed1-adfa-45f7-b8f8-2f5f97cec069

# Trigger
Tetris CLI game implementation patterns, terminal game development with scoring systems

# Content
When implementing a Tetris CLI game in Node.js, use these patterns:

1. **Dual Control Systems**: Implement both Arrow keys and WASD simultaneously using switch case fallthrough for maximum accessibility
2. **Scoring Differentiation**: Distinguish between automatic gravity drops (no scoring) and manual soft drops (1 point per cell) for proper game mechanics
3. **Hard Drop Implementation**: Award 2 points per cell for hard drops and immediately place the piece for responsive gameplay
4. **Line Clearing Scoring**: Use classic Tetris scoring (Single: 100, Double: 300, Triple: 500, Tetris: 800) multiplied by level for progression
5. **Collision Detection**: Test piece validity by checking each occupied cell against board boundaries and existing pieces
6. **Test Architecture**: Separate game logic tests from UI integration tests, using proper mocking for terminal I/O operations
7. **Piece Rotation**: Implement 90-degree clockwise rotation with collision validation to prevent invalid states
8. **Game State Management**: Use clear state flags (gameOver, isRunning) with proper transitions between game states

This approach ensures responsive gameplay, proper scoring mechanics, and maintainable code architecture.