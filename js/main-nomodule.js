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

// Mobile-specific controls implementation
document.addEventListener('DOMContentLoaded', function() {
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) {
        console.log("Not a mobile device, using standard controls");
        return; // Exit early if not mobile
    }
    
    console.log("Mobile device detected, applying mobile-specific controls");
    
    // Wait for game to fully initialize
    setTimeout(function() {
        // Find the game's internal objects and functions
        let gameBoard, currentPiece, gameState;
        
        // Try to find game objects
        for (const key in window) {
            // Look for game board
            if (typeof window[key] === 'object' && window[key] !== null && 
                Array.isArray(window[key]) && window[key].length > 0 && 
                Array.isArray(window[key][0])) {
                gameBoard = window[key];
                console.log("Possible game board found:", key);
            }
            
            // Look for current piece
            if (typeof window[key] === 'object' && window[key] !== null && 
                typeof window[key].shape === 'string' && 
                typeof window[key].x === 'number' && 
                typeof window[key].y === 'number') {
                currentPiece = window[key];
                console.log("Possible current piece found:", key);
            }
            
            // Look for game state
            if (typeof window[key] === 'string' && 
                (window[key] === 'playing' || window[key] === 'paused' || window[key] === 'over')) {
                gameState = window[key];
                console.log("Possible game state found:", key);
            }
        }
        
        // Find game functions
        let movePieceLeftFn, movePieceRightFn, movePieceDownFn, rotatePieceFn, hardDropFn;
        
        for (const key in window) {
            if (typeof window[key] === 'function') {
                // Try to identify functions by name
                if (key.includes('left') || key.includes('Left')) {
                    movePieceLeftFn = window[key];
                    console.log("Move left function found:", key);
                }
                else if (key.includes('right') || key.includes('Right')) {
                    movePieceRightFn = window[key];
                    console.log("Move right function found:", key);
                }
                else if (key.includes('down') || key.includes('Down')) {
                    movePieceDownFn = window[key];
                    console.log("Move down function found:", key);
                }
                else if (key.includes('rotate') || key.includes('Rotate')) {
                    rotatePieceFn = window[key];
                    console.log("Rotate function found:", key);
                }
                else if (key.includes('drop') || key.includes('Drop')) {
                    hardDropFn = window[key];
                    console.log("Drop function found:", key);
                }
            }
        }
        
        // Get control buttons
        const dpadLeft = document.getElementById('dpad-left');
        const dpadRight = document.getElementById('dpad-right');
        const dpadUp = document.getElementById('dpad-up');
        const dpadDown = document.getElementById('dpad-down');
        const btnSpace = document.getElementById('btn-space');
        
        // Generic function to set up a mobile control button
        function setupButton(button, actionFn) {
            if (!button || !actionFn) return;
            
            // Remove existing listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Add new mobile-optimized listeners
            newButton.addEventListener('touchstart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                newButton.classList.add('active');
                
                // Call the action function
                try {
                    actionFn();
                } catch (err) {
                    console.error("Error calling action function:", err);
                }
            }, { passive: false });
            
            newButton.addEventListener('touchend', function(e) {
                e.preventDefault();
                newButton.classList.remove('active');
            }, { passive: false });
        }
        
        // Add repeating action support for directional buttons
        function setupRepeatingButton(button, actionFn, delay) {
            if (!button || !actionFn) return;
            
            // Remove existing listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            let interval;
            
            // Add touch listeners with repeating action
            newButton.addEventListener('touchstart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                newButton.classList.add('active');
                
                // Call immediately
                try {
                    actionFn();
                } catch (err) {
                    console.error("Error in action function:", err);
                }
                
                // Set up repeating interval
                interval = setInterval(function() {
                    try {
                        actionFn();
                    } catch (err) {
                        console.error("Error in interval action:", err);
                    }
                }, delay || 150);
            }, { passive: false });
            
            newButton.addEventListener('touchend', function(e) {
                e.preventDefault();
                newButton.classList.remove('active');
                if (interval) {
                    clearInterval(interval);
                    interval = null;
                }
            }, { passive: false });
            
            newButton.addEventListener('touchcancel', function(e) {
                e.preventDefault();
                newButton.classList.remove('active');
                if (interval) {
                    clearInterval(interval);
                    interval = null;
                }
            }, { passive: false });
        }
        
        // Try multiple approaches for moving left
        const moveLeft = function() {
            if (movePieceLeftFn) {
                movePieceLeftFn();
            } else {
                // Try generic movement with the piece and board
                if (currentPiece && gameBoard) {
                    currentPiece.x -= 1;
                }
                // Dispatch keyboard event as fallback
                document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowLeft', keyCode: 37}));
            }
        };
        
        // Try multiple approaches for moving right
        const moveRight = function() {
            if (movePieceRightFn) {
                movePieceRightFn();
            } else {
                // Try generic movement
                if (currentPiece && gameBoard) {
                    currentPiece.x += 1;
                }
                // Dispatch keyboard event as fallback
                document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', keyCode: 39}));
            }
        };
        
        // Try multiple approaches for rotating
        const rotate = function() {
            if (rotatePieceFn) {
                rotatePieceFn();
            } else {
                // Dispatch keyboard event as fallback
                document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', keyCode: 38}));
            }
        };
        
        // Try multiple approaches for moving down
        const moveDown = function() {
            if (movePieceDownFn) {
                movePieceDownFn();
            } else {
                // Try generic movement
                if (currentPiece && gameBoard) {
                    currentPiece.y += 1;
                }
                // Dispatch keyboard event as fallback
                document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', keyCode: 40}));
            }
        };
        
        // Set up directional buttons with repeating actions
        setupRepeatingButton(dpadLeft, moveLeft, 150);
        setupRepeatingButton(dpadRight, moveRight, 150);
        setupRepeatingButton(dpadDown, moveDown, 150);
        setupButton(dpadUp, rotate); // Rotation doesn't need to repeat
        
        // Special handling for drop button (space)
        if (btnSpace) {
            const newBtnSpace = btnSpace.cloneNode(true);
            btnSpace.parentNode.replaceChild(newBtnSpace, btnSpace);
            
            // Touch event handlers for drop button
            newBtnSpace.addEventListener('touchstart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                newBtnSpace.classList.add('active');
                
                // Enable soft drop
                window.SOFT_DROP_ACTIVE = true;
                
                // Try direct function if available
                if (hardDropFn) {
                    hardDropFn();
                } else {
                    // Fallback to keyboard event
                    document.dispatchEvent(new KeyboardEvent('keydown', {
                        key: ' ',
                        code: 'Space',
                        keyCode: 32
                    }));
                }
            }, { passive: false });
            
            newBtnSpace.addEventListener('touchend', function(e) {
                e.preventDefault();
                newBtnSpace.classList.remove('active');
                
                // Disable soft drop
                window.SOFT_DROP_ACTIVE = false;
                
                // Dispatch key up event
                document.dispatchEvent(new KeyboardEvent('keyup', {
                    key: ' ',
                    code: 'Space',
                    keyCode: 32
                }));
            }, { passive: false });
        }
        
        // Mobile-specific style adjustments
        document.querySelectorAll('.dpad button, #btn-space, #btn-start').forEach(button => {
            button.style.padding = '20px';
            button.style.margin = '10px';
            button.style.touchAction = 'manipulation';
        });
        
        // Add debug overlay
        const debugOverlay = document.createElement('div');
        debugOverlay.style.position = 'fixed';
        debugOverlay.style.top = '10px';
        debugOverlay.style.left = '10px';
        debugOverlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
        debugOverlay.style.color = 'white';
        debugOverlay.style.padding = '10px';
        debugOverlay.style.borderRadius = '5px';
        debugOverlay.style.fontSize = '12px';
        debugOverlay.style.zIndex = '9999';
        debugOverlay.textContent = 'Mobile controls active';
        document.body.appendChild(debugOverlay);
        
    }, 1500); // Longer delay to ensure game is fully initialized
});

// Keep the drop speed control function
(function() {
    window.SOFT_DROP_ACTIVE = false;
    
    const originalSetTimeout = window.setTimeout;
    
    window.setTimeout = function(callback, delay) {
        if (delay > 400 && delay < 2000 && window.SOFT_DROP_ACTIVE) {
            return originalSetTimeout(callback, delay / 22);
        }
        return originalSetTimeout(callback, delay);
    };
})();
