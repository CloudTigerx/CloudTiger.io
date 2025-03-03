// Main Game Logic

// Get the canvas elements
const gameCanvas = document.getElementById('gameCanvas');
const nextPieceCanvas = document.getElementById('nextPieceCanvas');

// Get the UI elements
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const startButton = document.getElementById('startButton');

// Speed control buttons
const speedSlow = document.getElementById('speedSlow');
const speedMedium = document.getElementById('speedMedium');
const speedFast = document.getElementById('speedFast');
const normalSpeedValue = document.getElementById('normalSpeedValue');

// Drop effect buttons
const dropWeak = document.getElementById('dropWeak');
const dropMedium = document.getElementById('dropMedium');
const dropNormal = document.getElementById('dropNormal');
const dropStrong = document.getElementById('dropStrong');
const fastDropValue = document.getElementById('fastDropValue');

// Custom speed inputs
const customSpeedInput = document.getElementById('customSpeedInput');
const applyCustomSpeed = document.getElementById('applyCustomSpeed');
const customDropInput = document.getElementById('customDropInput');
const applyCustomDrop = document.getElementById('applyCustomDrop');

// Game state
let gameBoard;
let currentPiece;
let nextPiece;
let score = 0;
let level = 1;
let gameOver = false;
let gamePaused = false;
let gameStarted = false;
let dropSpeed = 1600; // Fixed at 1600ms
let lastDropTime = 0;
let fastDropActive = false; // Flag for when space bar is held
let fastDropMultiplier = 22.0; // Using the constant value of 22.0 (2200%)
let chainCounter = 1;
let animatingBreak = false;
let gravitySettled = true;

// Speed presets - Not used anymore but kept for reference
const SPEED_PRESETS = {
    slow: 1600,    // 1.6 seconds
    medium: 1000,  // 1 second
    fast: 600      // 0.6 seconds
};

// Drop effect presets - Not used anymore but kept for reference
const DROP_PRESETS = {
    weak: 1.5,     // 150% speed
    medium: 2.0,   // 200% speed (double)
    normal: 3.0,   // 300% speed (triple)
    strong: 10.0   // 1000% speed (ten times faster)
};

// Initialize the game
function initGame() {
    console.log("Initializing game...");
    
    // Create an empty game board
    gameBoard = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    
    // Initialize the renderer
    initRenderer(gameCanvas);
    
    // Generate the first pieces
    currentPiece = generatePiece();
    nextPiece = generatePiece();
    
    // Reset game state
    score = 0;
    level = 1;
    gameOver = false;
    gamePaused = false;
    
    // Update the UI
    updateUI();
    
    // No longer setting up event listeners for speed and drop effect buttons
    // as they're locked to fixed values
    
    // Start the game loop
    gameStarted = true;
    lastDropTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Game loop
function gameLoop(timestamp) {
    if (!gameStarted) return;
    if (gameOver) return;
    if (gamePaused) {
        // Draw pause screen
        drawPauseScreen();
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Calculate delta time
    const deltaTime = timestamp - lastDropTime;
    
    // Calculate current drop speed based on fastDrop state
    // We want the space bar to make the piece drop faster
    const currentDropSpeed = fastDropActive ? dropSpeed / fastDropMultiplier : dropSpeed;
    
    // Log values for debugging (this runs every frame, so uncomment only when testing)
    if (fastDropActive) {
        console.log(`Fast drop active: Speed=${dropSpeed}, Multiplier=${fastDropMultiplier}, Current=${currentDropSpeed}`);
    }
    
    // Move the piece down if enough time has passed
    if (deltaTime > currentDropSpeed) {
        // Only try to move the piece if we have one
        if (currentPiece) {
            // Try to move the piece down
            if (!movePiece(currentPiece, gameBoard, 'down')) {
                // If the piece can't move down, lock it in place
                // This adds each block of the piece to the game board individually
                lockPiece(currentPiece, gameBoard);
                
                // Apply gravity until all blocks have settled
                gravitySettled = false;
                
                // Mark clusters for shading
                markClustersForShading(gameBoard);
                
                // Process gravity first
                processGravity();
                
                // Check for game over
                if (checkGameOver(nextPiece, gameBoard)) {
                    gameOver = true;
                    drawGameOver(score);
                    return;
                }
                
                // We'll set the next piece later, after breaking is complete
                currentPiece = null;
            }
        }
        
        lastDropTime = timestamp;
    }
    
    // Draw the game
    drawBoard(gameBoard, currentPiece, nextPiece);
    
    // Continue the game loop
    requestAnimationFrame(gameLoop);
}

// Process gravity until all blocks have settled
function processGravity() {
    // Keep applying gravity until no more blocks move
    const gravityResult = applyClusterGravity(gameBoard);
    
    if (gravityResult) {
        // If blocks are still falling, delay breaking checks
        setTimeout(() => {
            processGravity();
        }, 200); 
    } else {
        // Gravity has settled, now check for breakers
        gravitySettled = true;
        
        // Allow a brief pause after gravity settles before processing breakers
        setTimeout(() => {
            // Process chains (breakers)
            processGameChains();
        }, 100);
    }
}

// Process breaking chains !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! MARKING FOR SELF PUPOSES. LETS GET THE CHAINS TO DIPLAY THE TEXT AND CREATE THE PROPER SCORE SYSTEM
function processGameChains() {
    if (animatingBreak) return;
    
    // Only process chains if gravity has settled
    if (!gravitySettled) return;
    
    // Process chains (only breakers will actually break blocks)
    const result = processChains(gameBoard, chainCounter, 0);
    
    if (result.brokenBlocks) {
        animatingBreak = true;
        
        // Update the chain counter
        chainCounter = result.chainLevel;
        
        // Update the score
        score += result.score;
        
        // Draw chain text
        if (chainCounter > 1) {
            drawChainText(chainCounter - 1);
        }
        
        // Animate the breaking blocks
        animateBreak(result.brokenBlocks, gameBoard, () => {
            animatingBreak = false;
            
            // Reset gravity settled flag
            gravitySettled = false;
            
            // Process gravity again
            processGravity();
        });
    } else {
        // Reset chain counter
        chainCounter = 1;
        
        // Mark clusters for shading again
        markClustersForShading(gameBoard);
        
        // If there's no current piece, now is the time to set the next one
        if (!currentPiece) {
            currentPiece = nextPiece;
            nextPiece = generatePiece();
            
            // Reset the last drop time to give player a moment to react to the new piece
            lastDropTime = performance.now();
        }
    }
    
    // Update the UI
    updateUI();
}

// Update the UI elements
function updateUI() {
    // Update the score and level display
    // NOTE: Level display will be hidden in HTML
    if (scoreElement) {
        scoreElement.textContent = score;
    }
}

// Handle keyboard input
function handleKeyDown(event) {
    if (gameOver) {
        if (event.key === 'r' || event.key === 'R') {
            // Reset the game
            initGame();
        }
        return;
    }
    
    // Check if game is paused
    if (gamePaused) {
        if (event.code === 'KeyP') {
            togglePause();
        }
        return;
    }
    
    switch (event.key) {
        case 'ArrowLeft':
            // Move the piece left
            movePiece(currentPiece, gameBoard, 'left');
            break;
        case 'ArrowRight':
            // Move the piece right
            movePiece(currentPiece, gameBoard, 'right');
            break;
        case 'ArrowDown':
            // Rotate the attached block counter-clockwise
            rotateAttachedBlock(currentPiece, gameBoard, 'counterclockwise');
            break;
        case 'ArrowUp':
            // Rotate the attached block clockwise
            rotateAttachedBlock(currentPiece, gameBoard, 'clockwise');
            break;
        case ' ':
        case 'Spacebar': // For some older browsers
            // Activate fast drop
            fastDropActive = true;
            break;
    }
    
    // Handle KeyP separately since it uses event.code instead of event.key
    if (event.code === 'KeyP') {
        togglePause();
    }
    
    // Redraw the game board
    drawBoard(gameBoard, currentPiece, nextPiece);
    
    // Prevent default actions for game controls
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'Spacebar'].includes(event.key) || 
        ['KeyP'].includes(event.code)) {
        event.preventDefault();
    }
}

// Handle key up events
function handleKeyUp(event) {
    if (event.key === ' ' || event.key === 'Spacebar') {
        // Deactivate fast drop
        fastDropActive = false;
    }
}

// Toggle pause state
function togglePause() {
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        drawPauseScreen();
    }
}

// Handle start button click
function handleStartButtonClick() {
    if (!gameStarted || gameOver) {
        initGame();
        startButton.textContent = 'Reset Game';
    } else {
        // Reset the game
        initGame();
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    // Draw an empty board initially
    initRenderer(gameCanvas);
    drawBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(null)), null, null);
    
    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    startButton.addEventListener('click', handleStartButtonClick);
});

// Direct approach for all mobile controls
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        // Get all control buttons
        const dpadLeft = document.getElementById('dpad-left');
        const dpadRight = document.getElementById('dpad-right');
        const dpadUp = document.getElementById('dpad-up');
        const dpadDown = document.getElementById('dpad-down');
        const btnSpace = document.getElementById('btn-space');
        
        // Setup for arrow buttons
        if (dpadLeft && dpadRight && dpadUp && dpadDown) {
            // Left arrow
            setupDirectControl(dpadLeft, 'LEFT');
            
            // Right arrow
            setupDirectControl(dpadRight, 'RIGHT');
            
            // Up arrow (rotation)
            setupDirectControl(dpadUp, 'UP');
            
            // Down arrow
            setupDirectControl(dpadDown, 'DOWN');
        }
        
        // Drop button setup (keep existing code)
        if (btnSpace) {
            // Remove any existing listeners
            const newBtnSpace = btnSpace.cloneNode(true);
            btnSpace.parentNode.replaceChild(newBtnSpace, btnSpace);
            
            // Direct hook into the game's speed
            newBtnSpace.addEventListener('touchstart', function(e) {
                e.preventDefault();
                newBtnSpace.classList.add('active');
                
                // Force the speed change directly
                window.SOFT_DROP_ACTIVE = true;
                
                // Also try key simulation as backup
                document.dispatchEvent(new KeyboardEvent('keydown', {
                    key: ' ',
                    code: 'Space',
                    keyCode: 32
                }));
            });
            
            newBtnSpace.addEventListener('touchend', function(e) {
                e.preventDefault();
                newBtnSpace.classList.remove('active');
                
                // Force the speed change off
                window.SOFT_DROP_ACTIVE = false;
                
                // Also try key simulation as backup
                document.dispatchEvent(new KeyboardEvent('keyup', {
                    key: ' ',
                    code: 'Space',
                    keyCode: 32
                }));
            });
            
            // Add the same for mouse events
            newBtnSpace.addEventListener('mousedown', function(e) {
                e.preventDefault();
                newBtnSpace.classList.add('active');
                window.SOFT_DROP_ACTIVE = true;
                document.dispatchEvent(new KeyboardEvent('keydown', {key: ' '}));
            });
            
            newBtnSpace.addEventListener('mouseup', function(e) {
                e.preventDefault();
                newBtnSpace.classList.remove('active');
                window.SOFT_DROP_ACTIVE = false;
                document.dispatchEvent(new KeyboardEvent('keyup', {key: ' '}));
            });
        }
    }, 800);
    
    // Helper function to set up direct control for arrows
    function setupDirectControl(button, direction) {
        // Create a fresh button without existing listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Set up the key mapping
        const keyMap = {
            'LEFT': 'ArrowLeft',
            'RIGHT': 'ArrowRight',
            'UP': 'ArrowUp',
            'DOWN': 'ArrowDown'
        };
        
        // Set up event listeners
        newButton.addEventListener('touchstart', function(e) {
            e.preventDefault();
            newButton.classList.add('active');
            
            // Set the global flag
            window['DIRECTION_' + direction + '_ACTIVE'] = true;
            
            // Also dispatch key event as backup
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: keyMap[direction],
                code: keyMap[direction],
                keyCode: direction === 'LEFT' ? 37 : 
                         direction === 'RIGHT' ? 39 : 
                         direction === 'UP' ? 38 : 40
            }));
        });
        
        newButton.addEventListener('touchend', function(e) {
            e.preventDefault();
            newButton.classList.remove('active');
            
            // Clear the global flag
            window['DIRECTION_' + direction + '_ACTIVE'] = false;
            
            // Dispatch key up event
            document.dispatchEvent(new KeyboardEvent('keyup', {
                key: keyMap[direction],
                code: keyMap[direction]
            }));
        });
        
        // Also handle mouse events for desktop testing
        newButton.addEventListener('mousedown', function(e) {
            e.preventDefault();
            newButton.classList.add('active');
            window['DIRECTION_' + direction + '_ACTIVE'] = true;
            document.dispatchEvent(new KeyboardEvent('keydown', {key: keyMap[direction]}));
        });
        
        newButton.addEventListener('mouseup', function(e) {
            e.preventDefault();
            newButton.classList.remove('active');
            window['DIRECTION_' + direction + '_ACTIVE'] = false;
            document.dispatchEvent(new KeyboardEvent('keyup', {key: keyMap[direction]}));
        });
    }
});

// Add this code at the end of the file - global approach for all controls
(function() {
    // Create global flags for all controls
    window.SOFT_DROP_ACTIVE = false;
    window.DIRECTION_LEFT_ACTIVE = false;
    window.DIRECTION_RIGHT_ACTIVE = false;
    window.DIRECTION_UP_ACTIVE = false;
    window.DIRECTION_DOWN_ACTIVE = false;
    
    // Store the original timing functions
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    
    // Last movement timestamps to prevent too-frequent movements
    const lastMove = {
        left: 0,
        right: 0,
        up: 0,
        down: 0
    };
    
    // Override setTimeout for soft drop
    window.setTimeout = function(callback, delay) {
        // If this is likely the piece drop timer and soft drop is active
        if (delay > 400 && delay < 2000 && window.SOFT_DROP_ACTIVE) {
            // Use much faster speed when drop button is active
            return originalSetTimeout(callback, delay / 22);
        }
        return originalSetTimeout(callback, delay);
    };
    
    // Override requestAnimationFrame to inject our movement checks
    window.requestAnimationFrame = function(callback) {
        return originalRequestAnimationFrame(function(timestamp) {
            // Check for active direction buttons and execute movements
            const now = Date.now();
            
            // Enforce a minimum delay between movements (150ms feels natural)
            const moveDelay = 150;
            
            // Left movement
            if (window.DIRECTION_LEFT_ACTIVE && now - lastMove.left > moveDelay) {
                // Try to simulate arrow key
                document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowLeft'}));
                lastMove.left = now;
            }
            
            // Right movement
            if (window.DIRECTION_RIGHT_ACTIVE && now - lastMove.right > moveDelay) {
                document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight'}));
                lastMove.right = now;
            }
            
            // Up movement (rotation)
            if (window.DIRECTION_UP_ACTIVE && now - lastMove.up > moveDelay) {
                document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp'}));
                lastMove.up = now;
            }
            
            // Down movement
            if (window.DIRECTION_DOWN_ACTIVE && now - lastMove.down > moveDelay) {
                document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown'}));
                lastMove.down = now;
            }
            
            // Call the original callback
            callback(timestamp);
        });
    };
})();
