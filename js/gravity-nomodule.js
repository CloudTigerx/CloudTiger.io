// Gravity System - Handles the falling of pieces and blocks

// Apply gravity to all blocks on the board
function applyGravity(gameBoard) {
    let blocksMoved = false;
    
    // Start from the bottom row and move up
    for (let y = ROWS - 2; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
            // Skip empty cells
            if (!gameBoard[y][x]) continue;
            
            // Skip blocks that cannot move (like black blocks)
            if (gameBoard[y][x].type === PIECE_TYPES.BLACK) continue;
            
            // Check if there's an empty space below
            if (!gameBoard[y + 1][x]) {
                // Move the block down
                gameBoard[y + 1][x] = gameBoard[y][x];
                gameBoard[y][x] = null;
                blocksMoved = true;
            }
        }
    }
    
    return blocksMoved;
}

// Find connected blocks for gravity (including breakers)
function findConnectedBlocksForGravity(gameBoard, x, y, color, visited = {}) {
    // Check if out of bounds or not the right color
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS || 
        !gameBoard[y][x] || gameBoard[y][x].color !== color || 
        visited[`${x},${y}`]) {
        return [];
    }
    
    // Mark as visited
    visited[`${x},${y}`] = true;
    
    // Add current block to connected blocks
    const connected = [{x, y}];
    
    // Check adjacent blocks (up, right, down, left)
    const directions = [
        { dx: 0, dy: -1 }, // up
        { dx: 1, dy: 0 },  // right
        { dx: 0, dy: 1 },  // down
        { dx: -1, dy: 0 }  // left
    ];
    
    // Explore each direction
    for (const dir of directions) {
        const newX = x + dir.dx;
        const newY = y + dir.dy;
        
        // Recursively find connected blocks
        const connectedInDirection = findConnectedBlocksForGravity(gameBoard, newX, newY, color, visited);
        connected.push(...connectedInDirection);
    }
    
    return connected;
}

// Apply gravity with cluster falling
function applyClusterGravity(gameBoard) {
    let somethingMoved = false;
    
    // First, apply simple gravity to individual blocks
    for (let y = ROWS - 2; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
            if (!gameBoard[y][x]) continue;
            
            // Skip blocks that cannot move
            if (gameBoard[y][x].type === PIECE_TYPES.BLACK) continue;
            
            // Check if space below is empty
            if (!gameBoard[y + 1][x]) {
                // Move the block down
                gameBoard[y + 1][x] = gameBoard[y][x];
                gameBoard[y][x] = null;
                
                // Mark as not settled since it just moved
                gameBoard[y + 1][x].settled = false;
                
                somethingMoved = true;
            } else if (gameBoard[y][x].settled === false) {
                // Block can't move down anymore, mark it as settled
                gameBoard[y][x].settled = true;
            }
        }
    }
    
    // If individual blocks moved, return early to let them settle first
    if (somethingMoved) {
        return true;
    }
    
    // Process connected clusters after individual blocks have settled
    let needsAnotherPass = true;
    
    while (needsAnotherPass) {
        needsAnotherPass = false;
        
        // Process falling clusters
        for (let y = ROWS - 2; y >= 0; y--) {
            for (let x = 0; x < COLS; x++) {
                if (!gameBoard[y][x]) continue;
                
                // Skip blocks that cannot move
                if (gameBoard[y][x].type === PIECE_TYPES.BLACK) continue;
                
                // Check if space below is empty
                if (!gameBoard[y + 1][x]) {
                    // Find connected blocks (cluster) using the gravity-specific function
                    const cluster = findConnectedBlocksForGravity(gameBoard, x, y, gameBoard[y][x].color);
                    
                    // Check if all blocks in the cluster can move down
                    let canMoveDown = true;
                    const blocksToMove = new Set();
                    
                    for (const block of cluster) {
                        blocksToMove.add(`${block.x},${block.y}`);
                        
                        // Skip if already at the bottom row
                        if (block.y === ROWS - 1) {
                            canMoveDown = false;
                            break;
                        }
                        
                        // Check if space below is empty or part of the same cluster
                        if (gameBoard[block.y + 1][block.x] && 
                            !blocksToMove.has(`${block.x},${block.y + 1}`)) {
                            canMoveDown = false;
                            break;
                        }
                    }
                    
                    // Move the entire cluster down if possible
                    if (canMoveDown) {
                        // Sort blocks by y-coordinate (bottom to top) to prevent overwriting
                        const sortedBlocks = [...cluster].sort((a, b) => b.y - a.y);
                        
                        for (const block of sortedBlocks) {
                            gameBoard[block.y + 1][block.x] = gameBoard[block.y][block.x];
                            gameBoard[block.y][block.x] = null;
                            
                            // Mark as not settled since it just moved
                            gameBoard[block.y + 1][block.x].settled = false;
                        }
                        
                        somethingMoved = true;
                        needsAnotherPass = true;
                    } else {
                        // Mark all blocks in the cluster as settled if they can't move down
                        for (const block of cluster) {
                            if (gameBoard[block.y][block.x].settled === false) {
                                gameBoard[block.y][block.x].settled = true;
                            }
                        }
                    }
                } else if (gameBoard[y][x].settled === false) {
                    // Block can't move down anymore, mark it as settled
                    gameBoard[y][x].settled = true;
                }
            }
        }
    }
    
    // Mark any remaining unsettled blocks as settled
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (gameBoard[y][x] && gameBoard[y][x].settled === false) {
                // If the block is at the bottom or has a block beneath it, mark as settled
                if (y === ROWS - 1 || gameBoard[y + 1][x]) {
                    gameBoard[y][x].settled = true;
                }
            }
        }
    }
    
    return somethingMoved;
}

// Lock a piece in place - converts the piece into individual blocks on the game board
function lockPiece(piece, gameBoard) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const boardX = piece.x + x;
                const boardY = piece.y + y;
                
                // Skip if the piece is above the top of the board
                if (boardY < 0) continue;
                
                // Get the color for this block from the piece's colors array
                const blockColor = piece.colors ? piece.colors[y][x] : piece.color;
                
                // Create a new block on the game board
                gameBoard[boardY][boardX] = {
                    type: piece.shape[y][x],
                    color: blockColor,
                    settled: false // Mark as not settled yet (to prevent immediate breaking)
                };
            }
        }
    }
}

// Check if a piece has landed on something
function hasLanded(piece, gameBoard) {
    if (!piece) return false;
    
    // Check if each block in the piece would collide if moved down
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const boardX = piece.x + x;
                const boardY = piece.y + y;
                
                // Check if the block is at the bottom of the board
                if (boardY + 1 >= ROWS) {
                    return true;
                }
                
                // Check if there's a block below
                if (boardY + 1 >= 0 && gameBoard[boardY + 1][boardX]) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

// Check if the game is over (piece spawns on top of existing blocks)
function checkGameOver(piece, gameBoard) {
    if (!piece) return false;
    
    // Check if the newly spawned piece overlaps with existing blocks
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const boardX = piece.x + x;
                const boardY = piece.y + y;
                
                // If the piece has any blocks above the board, it's not game over yet
                if (boardY < 0) continue;
                
                // Check if there's a collision with existing blocks
                if (gameBoard[boardY][boardX]) {
                    return true;
                }
            }
        }
    }
    
    return false;
}
