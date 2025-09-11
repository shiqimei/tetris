# UUID
6ba8ee36-6faa-4380-b3a7-e597bb2367bb

# Trigger
Node.js terminal game implementation with real-time controls

# Content
For implementing real-time terminal games in Node.js:

1. **Raw Mode Input**: Use `process.stdin.setRawMode(true)` and `readline.emitKeypressEvents()` for immediate keypress detection without Enter
2. **Game Loop Pattern**: Implement delta-time based game loop with `setTimeout` rather than `setInterval` for better control over timing
3. **Screen Management**: Use `console.clear()` for screen clearing and avoid complex terminal manipulation libraries for simple games
4. **Color Strategy**: Chalk library provides excellent cross-platform color support with fallback to monochrome
5. **State Management**: Keep game state in a separate class from UI rendering for better separation of concerns
6. **Error Handling**: Implement proper cleanup with `process.on('SIGINT')` to restore terminal state on exit
7. **Testing Strategy**: Separate game logic from terminal I/O to enable unit testing of core mechanics
8. **Performance**: Limit rendering frequency (30-60fps) to prevent terminal flooding and ensure smooth gameplay

This architecture provides responsive, professional-quality terminal games with good maintainability.