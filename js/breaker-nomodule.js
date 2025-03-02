// Breaker System - Handles breaking blocks and generating attacks

// Process breaker blocks (break connected blocks of the same color)
function processBreakers(gameBoard) {
    const blocksToBreak = [];
    let hasBreakers = false;
    
    // Find all breaker blocks
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (gameBoard[y][x] && gameBoard[y][x].type === PIECE_TYPES.BREAKER) {
                hasBreakers = true;
                
                // Skip this breaker if it's part of a newly placed piece
                if (!gameBoard[y][x].settled) {
                    // Mark this breaker as settled for future breaking
                    gameBoard[y][x].settled = true;
                    continue;
                }
                
                // Get the color of the breaker
                const color = gameBoard[y][x].color;
                
                // Find only connected blocks of the same color
                // First, create a visited map to track blocks we've seen
                const visited = {};
                const connectedBlocks = findConnectedBlocks(gameBoard, x, y, color, visited);
                
                // Only break if the breaker is connected to at least one other block of the same color
                // This means there should be at least 2 blocks total (the breaker + 1 more)
                if (connectedBlocks.length > 1) {
                    // Add all connected blocks to the break list (excluding unsettled ones)
                    for (const block of connectedBlocks) {
                        if (gameBoard[block.y][block.x] && gameBoard[block.y][block.x].settled) {
                            blocksToBreak.push(block);
                        }
                    }
                }
            }
        }
    }
    
    // Remove duplicates
    const uniqueBlocks = [];
    const seen = new Set();
    
    for (const block of blocksToBreak) {
        const key = `${block.x},${block.y}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueBlocks.push(block);
        }
    }
    
    // Only break blocks if there are breakers and blocks to break
    if (hasBreakers && uniqueBlocks.length > 0) {
        // Break the blocks
        for (const block of uniqueBlocks) {
            gameBoard[block.y][block.x] = null;
        }
        
        // Return the blocks that were broken
        return uniqueBlocks;
    }
    
    // No breakers or no blocks to break
    return false;
}

// Find connected blocks (including breakers) of the same color
function findConnectedBlocks(gameBoard, x, y, color, visited = {}) {
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
        const connectedInDirection = findConnectedBlocks(gameBoard, newX, newY, color, visited);
        connected.push(...connectedInDirection);
    }
    
    return connected;
}

// Find connected blocks for clusters (excludes breakers)
function findConnectedBlocksForClusters(gameBoard, x, y, color) {
    const visited = {};
    const connected = [];
    
    // Helper function for DFS
    function dfs(x, y) {
        // Check if out of bounds or not the right color
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS || 
            !gameBoard[y][x] || gameBoard[y][x].color !== color || 
            visited[`${x},${y}`]) {
            return;
        }
        
        // Skip breaker blocks for regular clusters
        if (gameBoard[y][x].type === PIECE_TYPES.BREAKER) {
            return;
        }
        
        // Mark as visited
        visited[`${x},${y}`] = true;
        
        // Add current block to connected blocks
        connected.push({x, y});
        
        // Check adjacent blocks (up, right, down, left)
        dfs(x, y - 1); // up
        dfs(x + 1, y); // right
        dfs(x, y + 1); // down
        dfs(x - 1, y); // left
    }
    
    dfs(x, y);
    return connected;
}

// Process normal block clusters (4 or more connected blocks)
function processClusters(gameBoard, chainLevel = 1) {
    const clusters = [];
    const visited = {};
    
    // Find clusters
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (gameBoard[y][x] && gameBoard[y][x].type === PIECE_TYPES.BLOCK && !visited[`${x},${y}`]) {
                const cluster = findConnectedBlocksForClusters(gameBoard, x, y, gameBoard[y][x].color);
                
                // Add to visited
                for (const block of cluster) {
                    visited[`${block.x},${block.y}`] = true;
                }
                
                // If cluster is at least 4 blocks, add it
                if (cluster.length >= 4) {
                    clusters.push(cluster);
                }
            }
        }
    }
    
    // If we have clusters, process them
    if (clusters.length > 0) {
        // Calculate score for each cluster
        let totalScore = 0;
        for (const cluster of clusters) {
            totalScore += calculateClusterScore(cluster, chainLevel);
            
            // Highlight clusters for animation
            for (const block of cluster) {
                if (gameBoard[block.y][block.x]) {
                    gameBoard[block.y][block.x].inCluster = true;
                }
            }
        }
        
        // Return the clusters and score
        return {
            clusters,
            score: totalScore,
            chainLevel
        };
    }
    
    // No clusters found
    return {
        clusters: [],
        score: 0,
        chainLevel
    };
}

// Calculate the score for breaking a cluster
function calculateClusterScore(cluster, chainLevel) {
    // Base score is 10 points per block
    let baseScore = cluster.length * 10;
    
    // Add bonus points for larger clusters
    if (cluster.length >= 7) {
        baseScore *= 1.5;
    } else if (cluster.length >= 5) {
        baseScore *= 1.2;
    }
    
    // Multiply by chain level for combo bonus
    baseScore *= chainLevel;
    
    return Math.floor(baseScore);
}

// Generate attacks based on cluster shape
function generateAttacks(gameBoard, cluster) {
    // Determine if the cluster is rectangular or not
    const isRectangular = isRectangularCluster(cluster);
    
    // No actual attacks are created for single-player, just for scoring
    if (isRectangular) {
        return "strike";  // Sword attack (rectangular cluster)
    } else {
        return "sprinkle"; // Dagger attack (non-rectangular cluster)
    }
}

// Check if a cluster forms a rectangle
function isRectangularCluster(cluster) {
    if (cluster.length < 4) return false;
    
    // Find the minimum and maximum x and y coordinates
    let minX = COLS, minY = ROWS, maxX = 0, maxY = 0;
    
    for (const block of cluster) {
        minX = Math.min(minX, block.x);
        minY = Math.min(minY, block.y);
        maxX = Math.max(maxX, block.x);
        maxY = Math.max(maxY, block.y);
    }
    
    // Calculate the width and height of the bounding box
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    
    // Check if the number of blocks matches the area of the rectangle
    return cluster.length === width * height;
}

// Process a game tick for breaking chains
function processChains(gameBoard, chainLevel = 1, score = 0, onChainComplete = null) {
    // Process breakers first
    const brokenByBreakers = processBreakers(gameBoard);
    
    if (brokenByBreakers && brokenByBreakers.length > 0) {
        // Update score for breaker blocks (50 points per block broken)
        score += brokenByBreakers.length * 50 * chainLevel;
        
        return {
            brokenBlocks: brokenByBreakers,
            score: score,
            chainLevel: chainLevel + 1
        };
    }
    
    // Do NOT process normal clusters without a breaker
    // Only shade clusters for potential breaking, but don't break them
    // Return no broken blocks
    return {
        brokenBlocks: false,
        score: score,
        chainLevel: chainLevel
    };
}
