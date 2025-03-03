// Renderer System - Handles drawing the game

// Canvas context
let ctx;

// Image objects for pieces
const images = {
    // Regular blocks
    red: new Image(),
    yellow: new Image(),
    green: new Image(),
    blue: new Image(),
    
    // Breaker blocks (sword blocks)
    red_breaker: new Image(),
    yellow_breaker: new Image(),
    green_breaker: new Image(),
    blue_breaker: new Image()
};

// Load images
function loadImages() {
    // Load regular block images
    images.red.src = 'images/piece__red.png';
    images.yellow.src = 'images/piece__yellow.png';
    images.green.src = 'images/piece__green.png';
    images.blue.src = 'images/piece__blue.png';
    
    // Load breaker block images
    images.red_breaker.src = 'images/piece_swords_red.png';
    images.yellow_breaker.src = 'images/piece_swords_yellow.png';
    images.green_breaker.src = 'images/piece_swords_green.png';
    images.blue_breaker.src = 'images/piece_swords_blue.png';
}

// Initialize the renderer
function initRenderer(canvas) {
    ctx = canvas.getContext('2d');
    loadImages();
}

// Draw the game board
function drawBoard(gameBoard, currentPiece, nextPiece) {
    // Clear the canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw the flame background
    drawFlameBackground();
    
    // Draw the board blocks
    drawBoardBlocks(gameBoard);
    
    // Draw the current piece
    if (currentPiece) {
        drawPiece(currentPiece);
    }
    
    // Draw the next piece preview
    if (nextPiece) {
        drawNextPiece(nextPiece);
    }
}

// Draw a flame-like background
function drawFlameBackground() {
    // Create a gradient from dark red to black
    const gradient = ctx.createLinearGradient(0, 0, 0, ROWS * BLOCK_SIZE);
    gradient.addColorStop(0, '#300');
    gradient.addColorStop(0.3, '#700');
    gradient.addColorStop(0.6, '#900');
    gradient.addColorStop(1, '#200');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);
    
    // Add some flame-like random shapes for effect
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * COLS * BLOCK_SIZE;
        const y = Math.random() * ROWS * BLOCK_SIZE;
        const size = Math.random() * 50 + 20;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = Math.random() > 0.5 ? '#f60' : '#f00';
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
}

// Draw the blocks on the board
function drawBoardBlocks(gameBoard) {
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const block = gameBoard[y][x];
            if (block) {
                drawBlock(x, y, block.color, block.type, block.inCluster);
            }
        }
    }
}

// Draw a single block
function drawBlock(x, y, color, type, inCluster = false) {
    const blockX = x * BLOCK_SIZE;
    const blockY = y * BLOCK_SIZE;
    
    // Draw the block based on its type
    switch (type) {
        case PIECE_TYPES.BLOCK:
            // Regular block - use images
            if (images[color] && images[color].complete) {
                ctx.drawImage(images[color], blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
            } else {
                // Fallback if image not loaded
                ctx.fillStyle = color;
                ctx.fillRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
            }
            
            // Add shading if the block is part of a cluster
            if (inCluster) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
            }
            break;
            
        case PIECE_TYPES.BREAKER:
            // Breaker block - use images
            const breakerImage = images[color + '_breaker'];
            if (breakerImage && breakerImage.complete) {
                ctx.drawImage(breakerImage, blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
            } else {
                // Fallback if image not loaded
                ctx.fillStyle = color;
                ctx.fillRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
                
                // Add a star pattern
                ctx.fillStyle = 'white';
                ctx.beginPath();
                const centerX = blockX + BLOCK_SIZE / 2;
                const centerY = blockY + BLOCK_SIZE / 2;
                const spikes = 5;
                const outerRadius = BLOCK_SIZE / 2;
                const innerRadius = BLOCK_SIZE / 4;
                
                for (let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = Math.PI / spikes * i;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = centerY + Math.sin(angle) * radius;
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                
                ctx.closePath();
                ctx.fill();
            }
            break;
            
        case PIECE_TYPES.ATTACK:
            // Attack block
            ctx.fillStyle = 'red';
            ctx.fillRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
            
            // Add a sword pattern
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.moveTo(blockX + BLOCK_SIZE / 2, blockY + BLOCK_SIZE / 8);
            ctx.lineTo(blockX + BLOCK_SIZE * 3 / 4, blockY + BLOCK_SIZE / 4);
            ctx.lineTo(blockX + BLOCK_SIZE / 2, blockY + BLOCK_SIZE * 7 / 8);
            ctx.lineTo(blockX + BLOCK_SIZE / 4, blockY + BLOCK_SIZE / 4);
            ctx.closePath();
            ctx.fill();
            break;
            
        case PIECE_TYPES.BLACK:
            // Black block (immovable)
            ctx.fillStyle = '#000';
            ctx.fillRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
            
            // Add a pattern
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(blockX, blockY);
            ctx.lineTo(blockX + BLOCK_SIZE, blockY + BLOCK_SIZE);
            ctx.moveTo(blockX + BLOCK_SIZE, blockY);
            ctx.lineTo(blockX, blockY + BLOCK_SIZE);
            ctx.stroke();
            break;
            
        case PIECE_TYPES.RUMJUG:
            // Rum jug block (special)
            ctx.fillStyle = 'brown';
            ctx.fillRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
            
            // Draw a jug shape
            ctx.fillStyle = '#a67c52';
            ctx.beginPath();
            ctx.ellipse(
                blockX + BLOCK_SIZE / 2,
                blockY + BLOCK_SIZE / 2,
                BLOCK_SIZE / 3,
                BLOCK_SIZE / 2.5,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
            break;
            
        default:
            // Default block - use color
            ctx.fillStyle = color || 'gray';
            ctx.fillRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
            
            // Add shading if the block is part of a cluster
            if (inCluster) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
            }
            break;
    }
    
    // Draw block border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(blockX, blockY, BLOCK_SIZE, BLOCK_SIZE);
}

// Draw the current piece
function drawPiece(piece) {
    if (!piece) return;
    
    // Default color for fallback
    const defaultColor = '#FF0000'; // Red as fallback
    
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const boardX = piece.x + x;
                const boardY = piece.y + y;
                
                // Only draw if the piece is within the visible board
                if (boardY >= 0) {
                    // Get the color for this specific block with robust fallbacks
                    let blockColor = defaultColor;
                    
                    if (piece.color) {
                        // If the piece has a single color property
                        blockColor = piece.color;
                    } else if (piece.colors) {
                        // Check if the specific color exists in the colors array
                        if (piece.colors[y] && piece.colors[y][x] !== undefined) {
                            blockColor = piece.colors[y][x];
                        } else if (y === 0 && piece.colors[0] && piece.colors[0][0]) {
                            // Fallback to base color
                            blockColor = piece.colors[0][0];
                        } else if (y === 1 && piece.colors[1] && piece.colors[1][0]) {
                            // Fallback to attached color
                            blockColor = piece.colors[1][0];
                        }
                    }
                    
                    // Draw the block with its specific color and type
                    drawBlock(boardX, boardY, blockColor, piece.shape[y][x]);
                }
            }
        }
    }
}

// Draw the next piece preview
function drawNextPiece(piece) {
    const nextCanvas = document.getElementById('nextPieceCanvas');
    if (!nextCanvas) return;
    
    const nextCtx = nextCanvas.getContext('2d');
    
    // Clear the next piece canvas
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    // Draw background
    const gradient = nextCtx.createLinearGradient(0, 0, 0, nextCanvas.height);
    gradient.addColorStop(0, '#300');
    gradient.addColorStop(0.3, '#700');
    gradient.addColorStop(0.6, '#900');
    gradient.addColorStop(1, '#200');
    
    nextCtx.fillStyle = gradient;
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    // Center the next piece
    const blockSize = 30; // Smaller blocks for the preview
    const offsetX = (nextCanvas.width - piece.shape[0].length * blockSize) / 2;
    const offsetY = (nextCanvas.height - piece.shape.length * blockSize) / 2;
    
    // Draw the next piece
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                // Draw the block
                const blockX = offsetX + x * blockSize;
                const blockY = offsetY + y * blockSize;
                
                if (images[piece.color] && images[piece.color].complete) {
                    nextCtx.drawImage(images[piece.color], blockX, blockY, blockSize, blockSize);
                } else {
                    nextCtx.fillStyle = piece.color;
                    nextCtx.fillRect(blockX, blockY, blockSize, blockSize);
                }
            }
        }
    }
}

// Draw game over screen
function drawGameOver(score) {
    // Create semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw game over text
    ctx.fillStyle = '#ff6600';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    
    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    // Draw restart instruction
    ctx.font = '18px Arial';
    ctx.fillText('Press SPACE to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

// Draw pause screen
function drawPauseScreen() {
    // Create semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw pause text
    ctx.fillStyle = '#ff6600';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    // Draw instruction
    ctx.fillStyle = 'white';
    ctx.font = '18px Arial';
    ctx.fillText('Press P to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

// Animate breaking blocks
function animateBreak(blocks, gameBoard, onComplete) {
    let frameCount = 0;
    const maxFrames = 20;
    
    function animate() {
        frameCount++;
        
        // Clear just the game canvas for this animation (not the next piece)
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Redraw the flame background
        drawFlameBackground();
        
        // Draw the board blocks
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const block = gameBoard[y][x];
                if (block) {
                    drawBlock(x, y, block.color, block.type, block.inCluster);
                }
            }
        }
        
        // Draw breaking blocks
        for (const block of blocks) {
            const blockX = block.x * BLOCK_SIZE;
            const blockY = block.y * BLOCK_SIZE;
            
            // Draw the breaking animation
            const scale = 1 - frameCount / maxFrames;
            const blockSize = BLOCK_SIZE * scale;
            
            ctx.fillStyle = block.color;
            ctx.fillRect(blockX + BLOCK_SIZE / 2 * (1 - scale), blockY + BLOCK_SIZE / 2 * (1 - scale), blockSize, blockSize);
            
            // Flash effect
            if (frameCount % 2 === 0) {
                ctx.fillStyle = 'white';
                ctx.fillRect(blockX + BLOCK_SIZE / 2 * (1 - scale), blockY + BLOCK_SIZE / 2 * (1 - scale), blockSize, blockSize);
            }
        }
        
        // End the animation
        if (frameCount >= maxFrames) {
            if (onComplete) {
                onComplete();
            }
        } else {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

// Draw chain text
function drawChainText(chainLevel) {
    // Draw the chain text
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Chain x${chainLevel}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    // Reset text alignment
    ctx.textAlign = 'left';
}

// Mobile optimization for renderer
function optimizeForMobile() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    // Handle device pixel ratio for sharper rendering on high-DPI screens
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Only adjust if needed
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        // Set display size
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        
        // Set actual size in memory (scaled to account for extra pixel density)
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
        
        // Normalize coordinate system to use CSS pixels
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
    }
}

// Call on window resize and orientation change
window.addEventListener('resize', optimizeForMobile);
window.addEventListener('orientationchange', optimizeForMobile);

// Run once on load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(optimizeForMobile, 300); // Slight delay to ensure everything is loaded
});

// Visual feedback for touch interaction
function addTouchFeedback() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    // Add touch feedback visual (optional)
    canvas.addEventListener('touchstart', function(e) {
        const ctx = canvas.getContext('2d');
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Draw a small circle at touch point
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Clear the touch indicator after a short delay
        setTimeout(function() {
            redrawGame(); // Assuming there's a function to redraw the game state
        }, 200);
    });
}

// You might need to add this function if it doesn't exist
function redrawGame() {
    // This function should redraw the current game state
    // Only add this if you need it and it doesn't already exist
    if (typeof drawGame === 'function') {
        drawGame();
    } else if (typeof renderGame === 'function') {
        renderGame();
    }
    // If neither exists, you might need to look for another redraw function in the code
}

// Add error handling to renderer
(function() {
    // Wait for page to load
    window.addEventListener('load', function() {
        console.log("Installing renderer error prevention");
        
        // Find the canvas and context
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        
        try {
            // Get the rendering context
            const ctx = canvas.getContext('2d');
            
            // Store original drawing functions
            const originalDrawFunctions = {
                fillRect: ctx.fillRect,
                clearRect: ctx.clearRect,
                drawImage: ctx.drawImage
            };
            
            // Replace with safe versions
            ctx.fillRect = function(x, y, width, height) {
                if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
                    console.log("Prevented invalid fillRect:", x, y, width, height);
                    return;
                }
                return originalDrawFunctions.fillRect.apply(ctx, arguments);
            };
            
            ctx.clearRect = function(x, y, width, height) {
                if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
                    console.log("Prevented invalid clearRect:", x, y, width, height);
                    return;
                }
                return originalDrawFunctions.clearRect.apply(ctx, arguments);
            };
            
            ctx.drawImage = function() {
                if (arguments[0] === null || arguments[0] === undefined) {
                    console.log("Prevented drawing null image");
                    return;
                }
                try {
                    return originalDrawFunctions.drawImage.apply(ctx, arguments);
                } catch (e) {
                    console.log("Prevented drawImage error:", e);
                }
            };
            
            console.log("Canvas rendering functions protected");
        } catch (e) {
            console.log("Could not protect canvas functions:", e);
        }
    });
})();
