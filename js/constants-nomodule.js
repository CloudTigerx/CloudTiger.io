// Game Constants
const COLS = 6;
const ROWS = 13;
const BLOCK_SIZE = 40;
const CANVAS_WIDTH = COLS * BLOCK_SIZE; // Exact size of the grid, no extra space
const CANVAS_HEIGHT = ROWS * BLOCK_SIZE;

// Game speeds
const DROP_SPEED = 1000; // milliseconds between drops
const FAST_DROP_MULTIPLIER = 22.0; // Space bar makes pieces fall 22x faster (2200% speed)

// Piece types
const PIECE_TYPES = {
    BLOCK: 1,
    BREAKER: 2,
    ATTACK: 3,
    BLACK: 5,
    RUMJUG: 6
};

// Colors
const COLORS = [
    'red',
    'blue',
    'green',
    'yellow'
];
