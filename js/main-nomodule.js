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

// Enhanced mobile controls implementation
document.addEventListener('DOMContentLoaded', function() {
    // Allow time for game initialization
    setTimeout(function() {
        // Game control elements
        const btnSpace = document.getElementById('btn-space');
        const btnStart = document.getElementById('btn-start');
        const mainStartButton = document.getElementById('startButton');
        
        // Fix for DROP button - proper key press and release
        if (btnSpace) {
            // Clear any existing listeners
            const newBtnSpace = btnSpace.cloneNode(true);
            btnSpace.parentNode.replaceChild(newBtnSpace, btnSpace);
            
            // Handle touch start - begins acceleration
            newBtnSpace.addEventListener('touchstart', function(e) {
                e.preventDefault();
                newBtnSpace.classList.add('active');
                
                console.log("Drop button pressed - accelerating");
                
                // Simulate space key down to trigger acceleration
                const keyDownEvent = new KeyboardEvent('keydown', {
                    key: ' ',
                    code: 'Space',
                    keyCode: 32,
                    which: 32,
                    bubbles: true,
                    cancelable: true
                });
                document.dispatchEvent(keyDownEvent);
                
                // Alternative direct approach if key simulation doesn't work
                if (typeof setDropSpeed === 'function') {
                    setDropSpeed(2200); // Set to 2200% speed
                } else if (typeof currentDropSpeed !== 'undefined') {
                    currentDropSpeed = 2200; // Directly modify speed variable if it exists
                }
            });
            
            // Handle touch end - returns to normal speed
            newBtnSpace.addEventListener('touchend', function(e) {
                e.preventDefault();
                newBtnSpace.classList.remove('active');
                
                console.log("Drop button released - returning to normal speed");
                
                // Simulate space key up to return to normal speed
                const keyUpEvent = new KeyboardEvent('keyup', {
                    key: ' ',
                    code: 'Space',
                    keyCode: 32,
                    which: 32,
                    bubbles: true,
                    cancelable: true
                });
                document.dispatchEvent(keyUpEvent);
                
                // Alternative direct approach if key simulation doesn't work
                if (typeof setDropSpeed === 'function') {
                    setDropSpeed(100); // Set back to normal speed (100%)
                } else if (typeof currentDropSpeed !== 'undefined') {
                    currentDropSpeed = 100; // Return to normal speed
                }
            });
            
            // Also handle touchcancel to ensure speed returns to normal if touch is interrupted
            newBtnSpace.addEventListener('touchcancel', function(e) {
                e.preventDefault();
                newBtnSpace.classList.remove('active');
                
                const keyUpEvent = new KeyboardEvent('keyup', {
                    key: ' ',
                    code: 'Space',
                    keyCode: 32,
                    which: 32,
                    bubbles: true,
                    cancelable: true
                });
                document.dispatchEvent(keyUpEvent);
                
                // Try to reset speed directly as well
                if (typeof setDropSpeed === 'function') {
                    setDropSpeed(100);
                } else if (typeof currentDropSpeed !== 'undefined') {
                    currentDropSpeed = 100;
                }
            });
            
            // Also handle mouse events for testing
            newBtnSpace.addEventListener('mousedown', function(e) {
                e.preventDefault();
                newBtnSpace.classList.add('active');
                
                const keyDownEvent = new KeyboardEvent('keydown', {
                    key: ' ',
                    code: 'Space',
                    keyCode: 32,
                    which: 32,
                    bubbles: true,
                    cancelable: true
                });
                document.dispatchEvent(keyDownEvent);
            });
            
            newBtnSpace.addEventListener('mouseup', function(e) {
                e.preventDefault();
                newBtnSpace.classList.remove('active');
                
                const keyUpEvent = new KeyboardEvent('keyup', {
                    key: ' ',
                    code: 'Space',
                    keyCode: 32,
                    which: 32,
                    bubbles: true,
                    cancelable: true
                });
                document.dispatchEvent(keyUpEvent);
            });
            
            // In case mouse leaves button while pressed
            newBtnSpace.addEventListener('mouseleave', function(e) {
                if (newBtnSpace.classList.contains('active')) {
                    e.preventDefault();
                    newBtnSpace.classList.remove('active');
                    
                    const keyUpEvent = new KeyboardEvent('keyup', {
                        key: ' ',
                        code: 'Space',
                        keyCode: 32,
                        which: 32,
                        bubbles: true,
                        cancelable: true
                    });
                    document.dispatchEvent(keyUpEvent);
                }
            });
        }
        
        // Fix for START button - using multiple approaches
        if (btnStart && mainStartButton) {
            // Clear any existing listeners
            const newBtnStart = btnStart.cloneNode(true);
            btnStart.parentNode.replaceChild(newBtnStart, btnStart);
            
            // Direct approach to starting the game
            newBtnStart.addEventListener('touchstart', function(e) {
                e.preventDefault();
                newBtnStart.classList.add('active');
                
                console.log("Mobile Start button pressed"); // Debugging
                
                // Try multiple methods to start the game
                // 1. Direct click on the main start button
                mainStartButton.click();
                
                // 2. Look for game start functions
                setTimeout(function() {
                    // Check if game started after clicking the button
                    if (gameState !== 'playing') {
                        console.log("Trying direct game functions"); // Debugging
                        
                        // Try to find and call the game start function directly
                        // These names are guesses based on common patterns
                        if (typeof window.startGame === 'function') window.startGame();
                        else if (typeof startGame === 'function') startGame();
                        else if (typeof initGame === 'function') initGame();
                        else if (typeof startNewGame === 'function') startNewGame();
                        else if (typeof newGame === 'function') newGame();
                        
                        // If main button has an onclick attribute, try to call that function
                        if (mainStartButton.onclick) mainStartButton.onclick();
                        
                        // Try to trigger a click event programmatically
                        const clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        mainStartButton.dispatchEvent(clickEvent);
                    }
                }, 100);
            });
            
            newBtnStart.addEventListener('touchend', function(e) {
                e.preventDefault();
                newBtnStart.classList.remove('active');
            });
            
            // Also handle mouse events for testing
            newBtnStart.addEventListener('mousedown', function(e) {
                e.preventDefault();
                newBtnStart.classList.add('active');
                mainStartButton.click();
            });
            
            newBtnStart.addEventListener('mouseup', function(e) {
                e.preventDefault();
                newBtnStart.classList.remove('active');
            });
        }
    }, 800); // Allow more time for game initialization
});
