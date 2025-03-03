// Piece System - Handles piece generation, movement, and collision

// Generate a new piece
function generatePiece() {
    // Create a basic 2-block piece with random colors
    const baseColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const attachedColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    // Create a piece with a base and an attached block
    const piece = {
        // Base piece is at [0][0], attached piece starts at [1][0] (below the base)
        shape: [
            [PIECE_TYPES.BLOCK], // Base block
            [PIECE_TYPES.BLOCK]  // Attached block
        ],
        x: 3, // Start in the 4th column (index 3)
        y: 0,
        // Store colors for each position - initialize as 2D array to match shape structure
        colors: [
            [baseColor],     // Base block color
            [attachedColor]  // Attached block color
        ],
        // Track the position of the attached block relative to the base (0: below, 1: right, 2: above, 3: left)
        attachedPosition: 0,
        // Remember the base is always at [0][0] in the shape array
        baseX: 0,
        baseY: 0
    };
    
    // 25% chance to spawn a breaker block (for each block in the piece)
    if (Math.random() < 0.25) {
        piece.shape[0][0] = PIECE_TYPES.BREAKER; // Base block
    }
    
    if (Math.random() < 0.25) {
        piece.shape[1][0] = PIECE_TYPES.BREAKER; // Attached block
    }
    
    return piece;
}

// Check if a piece can move to the specified position
function canMovePiece(piece, gameBoard, direction) {
    if (!piece) return false;
    
    // Calculate the new position
    let newX = piece.x;
    let newY = piece.y;
    
    switch (direction) {
        case 'left':
            newX--;
            break;
        case 'right':
            newX++;
            break;
        case 'down':
            newY++;
            break;
    }
    
    // Check if the new position is valid
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const boardX = newX + x;
                const boardY = newY + y;
                
                // Check if out of bounds
                if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                    return false;
                }
                
                // Check if the position is already occupied (but only if the piece is within the board)
                if (boardY >= 0 && gameBoard[boardY][boardX]) {
                    return false;
                }
            }
        }
    }
    
    return true;
}

// Move a piece in the specified direction
function movePiece(piece, gameBoard, direction) {
    if (!piece) return false;
    
    // Check if the piece can move in the specified direction
    if (canMovePiece(piece, gameBoard, direction)) {
        // Apply the movement
        switch (direction) {
            case 'left':
                piece.x -= 1;
                break;
            case 'right':
                piece.x += 1;
                break;
            case 'down':
                piece.y += 1;
                break;
        }
        return true;
    }
    
    return false;
}

// Rotate the attached block around the base block
function rotateAttachedBlock(piece, gameBoard, direction) {
    if (!piece) return false;
    
    // Save original configuration in case we need to revert
    const originalAttachedPosition = piece.attachedPosition;
    const originalShape = JSON.parse(JSON.stringify(piece.shape));
    const originalColors = JSON.parse(JSON.stringify(piece.colors));
    const originalX = piece.x;
    const originalY = piece.y;
    const originalBaseX = piece.baseX;
    const originalBaseY = piece.baseY;
    
    // Calculate the new attached position (0: below, 1: right, 2: above, 3: left)
    let newAttachedPosition;
    
    if (direction === 'clockwise') {
        // Clockwise: 0->1->2->3->0
        newAttachedPosition = (piece.attachedPosition + 1) % 4;
    } else {
        // Counter-clockwise: 0->3->2->1->0
        newAttachedPosition = (piece.attachedPosition + 3) % 4;
    }
    
    // Get the base block coordinates on the board
    const baseBlockBoardX = piece.x + piece.baseX;
    const baseBlockBoardY = piece.y + piece.baseY;
    
    // Get the block types and colors
    const baseBlockType = piece.shape[piece.baseY][piece.baseX];
    const baseColor = (piece.colors && piece.colors[piece.baseY] && piece.colors[piece.baseY][piece.baseX])
        ? piece.colors[piece.baseY][piece.baseX]
        : (piece.color || COLORS[0]);
        
    // Find the attached block's type and color
    let attachedBlockType = PIECE_TYPES.BLOCK;
    let attachedColor = piece.color || COLORS[1];
    let attachedX = -1, attachedY = -1;
    
    // Locate the attached block in the current shape
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x] && !(y === piece.baseY && x === piece.baseX)) {
                attachedBlockType = piece.shape[y][x];
                attachedX = x;
                attachedY = y;
                
                // Get the color if available
                if (piece.colors && piece.colors[y] && piece.colors[y][x] !== undefined) {
                    attachedColor = piece.colors[y][x];
                }
                
                break;
            }
        }
        if (attachedX !== -1) break;
    }
    
    // Calculate the new attached block position relative to the base block
    let newAttachedRelX, newAttachedRelY;
    
    switch (newAttachedPosition) {
        case 0: // Below
            newAttachedRelX = 0;
            newAttachedRelY = 1;
            break;
        case 1: // Right
            newAttachedRelX = 1;
            newAttachedRelY = 0;
            break;
        case 2: // Above
            newAttachedRelX = 0;
            newAttachedRelY = -1;
            break;
        case 3: // Left
            newAttachedRelX = -1;
            newAttachedRelY = 0;
            break;
    }
    
    // Calculate the new attached block position on the board
    const newAttachedBoardX = baseBlockBoardX + newAttachedRelX;
    const newAttachedBoardY = baseBlockBoardY + newAttachedRelY;
    
    // Check if the new position is valid
    let isValid = true;
    let needLeftWallKick = false;
    let needRightWallKick = false;
    
    // Check base block (always valid since it doesn't move)
    
    // Check attached block
    if (newAttachedBoardX < 0) {
        // Left wall collision
        needLeftWallKick = true;
        isValid = false;
    } else if (newAttachedBoardX >= COLS) {
        // Right wall collision
        needRightWallKick = true;
        isValid = false;
    } else if (newAttachedBoardY >= ROWS) {
        // Bottom boundary collision
        isValid = false;
    } else if (newAttachedBoardY >= 0 && gameBoard[newAttachedBoardY][newAttachedBoardX]) {
        // Collision with existing blocks
        isValid = false;
    }
    
    // Handle wall kicks if needed
    let xAdjustment = 0;
    if (needLeftWallKick) {
        xAdjustment = 1; // Move right to kick off left wall
    } else if (needRightWallKick) {
        xAdjustment = -1; // Move left to kick off right wall
    }
    
    // Apply wall kick and re-check validity
    if (!isValid && (needLeftWallKick || needRightWallKick)) {
        isValid = true; // Reset and re-check
        
        // Check base block after wall kick
        if ((baseBlockBoardX + xAdjustment) < 0 || 
            (baseBlockBoardX + xAdjustment) >= COLS || 
            gameBoard[baseBlockBoardY][baseBlockBoardX + xAdjustment]) {
            isValid = false;
        }
        
        // Check attached block after wall kick
        if (isValid) {
            const adjustedAttachedX = newAttachedBoardX + xAdjustment;
            
            if (adjustedAttachedX < 0 || 
                adjustedAttachedX >= COLS || 
                newAttachedBoardY >= ROWS || 
                (newAttachedBoardY >= 0 && gameBoard[newAttachedBoardY][adjustedAttachedX])) {
                isValid = false;
            }
        }
    }
    
    // If valid (either originally or after wall kick), update the piece
    if (isValid) {
        // Create a new shape based on new positions
        let newShape = [];
        let newColors = [];
        
        // Find the min/max coordinates to determine shape dimensions
        const minY = Math.min(0, newAttachedRelY);
        const maxY = Math.max(0, newAttachedRelY);
        const minX = Math.min(0, newAttachedRelX);
        const maxX = Math.max(0, newAttachedRelX);
        
        // Create the shape with proper dimensions
        for (let y = 0; y <= maxY - minY; y++) {
            newShape[y] = [];
            newColors[y] = [];
            for (let x = 0; x <= maxX - minX; x++) {
                newShape[y][x] = PIECE_TYPES.NONE;
                newColors[y][x] = null;
            }
        }
        
        // Place the base block in the shape
        const baseShapeY = 0 - minY;
        const baseShapeX = 0 - minX;
        newShape[baseShapeY][baseShapeX] = baseBlockType;
        newColors[baseShapeY][baseShapeX] = baseColor;
        
        // Place the attached block in the shape
        const attachedShapeY = newAttachedRelY - minY;
        const attachedShapeX = newAttachedRelX - minX;
        newShape[attachedShapeY][attachedShapeX] = attachedBlockType;
        newColors[attachedShapeY][attachedShapeX] = attachedColor;
        
        // Update the piece
        piece.shape = newShape;
        piece.colors = newColors;
        piece.x = baseBlockBoardX - baseShapeX + xAdjustment;
        piece.y = baseBlockBoardY - baseShapeY;
        piece.baseX = baseShapeX;
        piece.baseY = baseShapeY;
        piece.attachedPosition = newAttachedPosition;
        
        return true;
    } else {
        // If rotation isn't valid, try the opposite direction if we haven't already
        const oppositeDirection = direction === 'clockwise' ? 'counterclockwise' : 'clockwise';
        
        // Restore original configuration
        piece.shape = originalShape;
        piece.colors = originalColors;
        piece.x = originalX;
        piece.y = originalY;
        piece.baseX = originalBaseX;
        piece.baseY = originalBaseY;
        piece.attachedPosition = originalAttachedPosition;
        
        // Try the opposite direction
        return rotateAttachedBlock(piece, gameBoard, oppositeDirection);
    }
}

// Check if a move is valid
function isValidMove(piece, gameBoard) {
    if (!piece) return false;
    
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const boardX = piece.x + x;
                const boardY = piece.y + y;
                
                // Check if out of bounds
                if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                    return false;
                }
                
                // Check if the position is already occupied (but only if the piece is within the board)
                if (boardY >= 0 && gameBoard[boardY][boardX]) {
                    return false;
                }
            }
        }
    }
    
    return true;
}

// Find rectangular clusters of the same color
function findRectangularClusters(gameBoard) {
    const clusters = [];
    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    
    // Check each position on the board
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            // Skip if already visited or empty
            if (visited[y][x] || !gameBoard[y][x]) continue;
            
            // Get the color of the current block
            const color = gameBoard[y][x].color;
            
            // Find the maximum width and height of the potential rectangle
            let maxWidth = 1;
            let maxHeight = 1;
            
            // Expand width
            while (x + maxWidth < COLS && 
                   gameBoard[y][x + maxWidth] && 
                   gameBoard[y][x + maxWidth].color === color) {
                maxWidth++;
            }
            
            // Expand height
            while (y + maxHeight < ROWS && 
                   gameBoard[y + maxHeight][x] && 
                   gameBoard[y + maxHeight][x].color === color) {
                maxHeight++;
            }
            
            // Check if we have at least a 2x2 rectangle
            if (maxWidth >= 2 && maxHeight >= 2) {
                // Verify that the entire rectangle is filled with blocks of the same color
                let isRectangle = true;
                
                for (let dy = 0; dy < maxHeight; dy++) {
                    for (let dx = 0; dx < maxWidth; dx++) {
                        if (!gameBoard[y + dy][x + dx] || 
                            gameBoard[y + dy][x + dx].color !== color) {
                            isRectangle = false;
                            break;
                        }
                    }
                    if (!isRectangle) break;
                }
                
                // If it's a valid rectangle, add it to clusters
                if (isRectangle) {
                    clusters.push({
                        x: x,
                        y: y,
                        width: maxWidth,
                        height: maxHeight,
                        color: color
                    });
                    
                    // Mark all blocks in this rectangle as visited
                    for (let dy = 0; dy < maxHeight; dy++) {
                        for (let dx = 0; dx < maxWidth; dx++) {
                            visited[y + dy][x + dx] = true;
                        }
                    }
                }
            }
        }
    }
    
    return clusters;
}

// Mark clusters for shading (2x2 or larger)
function markClustersForShading(gameBoard) {
    // First reset any existing cluster markings
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (gameBoard[y][x]) {
                gameBoard[y][x].inCluster = false;
            }
        }
    }
    
    // Find all rectangular clusters
    const clusters = findRectangularClusters(gameBoard);
    
    // Mark all blocks in clusters
    clusters.forEach(cluster => {
        for (let y = 0; y < cluster.height; y++) {
            for (let x = 0; x < cluster.width; x++) {
                const boardY = cluster.y + y;
                const boardX = cluster.x + x;
                
                if (gameBoard[boardY][boardX]) {
                    gameBoard[boardY][boardX].inCluster = true;
                }
            }
        }
    });
    
    return clusters;
}

// Check if blocks are connected (same color and adjacent)
function findConnectedBlocks(gameBoard, x, y, color, visited = {}) {
    // Check if out of bounds or not the right color
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS || 
        !gameBoard[y][x] || gameBoard[y][x].color !== color || 
        gameBoard[y][x].type === PIECE_TYPES.BREAKER || 
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
        const connectedInDirection = findConnectedBlocks(gameBoard, newX, newY, color, visited);
        connected.push(...connectedInDirection);
    }
    
    return connected;
}
