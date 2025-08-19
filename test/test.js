const Tetris = require('../src/tetris');

function runTests() {
  console.log('Running Tetris tests...\n');
  
  let passed = 0;
  let total = 0;
  
  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${name}: ${error.message}`);
    }
  }
  
  function assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }
  
  test('Board creation', () => {
    const tetris = new Tetris();
    assert(tetris.board.length === 20, 'Board should have 20 rows');
    assert(tetris.board[0].length === 10, 'Board should have 10 columns');
    assert(tetris.board[0][0] === ' ', 'Board should be initialized with empty spaces');
  });
  
  test('Piece spawning', () => {
    const tetris = new Tetris();
    tetris.spawnPiece();
    assert(tetris.currentPiece !== null, 'Should spawn a piece');
    assert(tetris.currentPiece.shape.length > 0, 'Piece should have a shape');
    assert(typeof tetris.currentPiece.x === 'number', 'Piece should have x position');
    assert(typeof tetris.currentPiece.y === 'number', 'Piece should have y position');
  });
  
  test('Piece movement', () => {
    const tetris = new Tetris();
    tetris.spawnPiece();
    const initialX = tetris.currentPiece.x;
    
    const moved = tetris.movePiece(1, 0);
    assert(moved === true, 'Should be able to move piece right');
    assert(tetris.currentPiece.x === initialX + 1, 'Piece should move to new position');
  });
  
  test('Invalid move detection', () => {
    const tetris = new Tetris();
    tetris.spawnPiece();
    
    // Try to move piece far left (should fail)
    const moved = tetris.movePiece(-10, 0);
    assert(moved === false, 'Should not be able to move piece out of bounds');
  });
  
  test('Line clearing', () => {
    const tetris = new Tetris();
    
    // Fill bottom row manually
    for (let x = 0; x < 10; x++) {
      tetris.board[19][x] = 'X';
    }
    
    const initialLines = tetris.lines;
    tetris.clearLines();
    assert(tetris.lines === initialLines + 1, 'Should clear completed line');
    assert(tetris.board[19].every(cell => cell === ' '), 'Bottom row should be empty after clearing');
  });
  
  test('Game display', () => {
    const tetris = new Tetris();
    const display = tetris.getDisplay();
    assert(display.length === 20, 'Display should have 20 rows');
    assert(display[0].length === 10, 'Display should have 10 columns');
  });
  
  console.log(`\nTest Results: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}