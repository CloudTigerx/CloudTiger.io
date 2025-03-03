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

// Improved Mobile Controls Implementation
document.addEventListener('DOMContentLoaded', function() {
    // Wait for the game to be fully initialized
    setTimeout(() => {
        // D-pad controls
        const dpadLeft = document.getElementById('dpad-left');
        const dpadRight = document.getElementById('dpad-right');
        const dpadUp = document.getElementById('dpad-up');
        const dpadDown = document.getElementById('dpad-down');
        const btnSpace = document.getElementById('btn-space');
        
        // More reliable key simulation function
        function simulateKeyboardEvent(key) {
            const keyEvent = new KeyboardEvent('keydown', {
                bubbles: true,
                cancelable: true,
                key: key,
                code: key === 'ArrowLeft' ? 'ArrowLeft' : 
                      key === 'ArrowRight' ? 'ArrowRight' : 
                      key === 'ArrowUp' ? 'ArrowUp' : 
                      key === 'ArrowDown' ? 'ArrowDown' : 
                      key === ' ' ? 'Space' : key
            });
            document.dispatchEvent(keyEvent);
        }
        
        // Left arrow
        dpadLeft.addEventListener('touchstart', function(e) {
            e.preventDefault();
            dpadLeft.classList.add('active');
            simulateKeyboardEvent('ArrowLeft');
        });
        
        dpadLeft.addEventListener('mousedown', function(e) {
            e.preventDefault();
            dpadLeft.classList.add('active');
            simulateKeyboardEvent('ArrowLeft');
        });
        
        // Right arrow
        dpadRight.addEventListener('touchstart', function(e) {
            e.preventDefault();
            dpadRight.classList.add('active');
            simulateKeyboardEvent('ArrowRight');
        });
        
        dpadRight.addEventListener('mousedown', function(e) {
            e.preventDefault();
            dpadRight.classList.add('active');
            simulateKeyboardEvent('ArrowRight');
        });
        
        // Up arrow
        dpadUp.addEventListener('touchstart', function(e) {
            e.preventDefault();
            dpadUp.classList.add('active');
            simulateKeyboardEvent('ArrowUp');
        });
        
        dpadUp.addEventListener('mousedown', function(e) {
            e.preventDefault();
            dpadUp.classList.add('active');
            simulateKeyboardEvent('ArrowUp');
        });
        
        // Down arrow
        dpadDown.addEventListener('touchstart', function(e) {
            e.preventDefault();
            dpadDown.classList.add('active');
            simulateKeyboardEvent('ArrowDown');
        });
        
        dpadDown.addEventListener('mousedown', function(e) {
            e.preventDefault();
            dpadDown.classList.add('active');
            simulateKeyboardEvent('ArrowDown');
        });
        
        // Drop button (Space)
        btnSpace.addEventListener('touchstart', function(e) {
            e.preventDefault();
            btnSpace.classList.add('active');
            simulateKeyboardEvent(' '); // Space character
        });
        
        btnSpace.addEventListener('mousedown', function(e) {
            e.preventDefault();
            btnSpace.classList.add('active');
            simulateKeyboardEvent(' '); // Space character
        });
        
        // Remove active class when touch/click ends
        const controlButtons = [dpadLeft, dpadRight, dpadUp, dpadDown, btnSpace];
        
        controlButtons.forEach(button => {
            button.addEventListener('touchend', function(e) {
                e.preventDefault();
                button.classList.remove('active');
            });
            
            button.addEventListener('touchcancel', function(e) {
                e.preventDefault();
                button.classList.remove('active');
            });
            
            button.addEventListener('mouseup', function(e) {
                e.preventDefault();
                button.classList.remove('active');
            });
            
            button.addEventListener('mouseleave', function(e) {
                e.preventDefault();
                button.classList.remove('active');
            });
        });
    }, 500); // Short delay to ensure game is initialized
});

// Fix for Start button - more direct approach
document.addEventListener('DOMContentLoaded', function() {
    // Get reference to Start button in mobile controls
    const mobileStartButton = document.getElementById('btn-start');
    const mainStartButton = document.getElementById('startButton');
    
    if (mobileStartButton && mainStartButton) {
        // Chrome-specific direct click handler
        const handleStartGame = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Apply active visual state
            mobileStartButton.classList.add('active');
            
            // Try multiple approaches to start the game
            
            // 1. Direct click on main button
            mainStartButton.click();
            
            // 2. If that doesn't work, try to find and call the start function
            setTimeout(function() {
                // Look for possible start game functions in the global scope
                if (typeof window.startGame === 'function') {
                    window.startGame();
                } else if (typeof startGame === 'function') {
                    startGame();
                } else if (typeof initGame === 'function') {
                    initGame();
                }
                
                // Remove active state after a delay
                setTimeout(function() {
                    mobileStartButton.classList.remove('active');
                }, 300);
            }, 100);
        };
        
        // Remove any existing event listeners to prevent duplicates
        mobileStartButton.replaceWith(mobileStartButton.cloneNode(true));
        
        // Get fresh reference after replacement
        const freshStartBtn = document.getElementById('btn-start');
        
        // Add both touch and mouse event handlers
        freshStartBtn.addEventListener('touchstart', handleStartGame, { passive: false });
        freshStartBtn.addEventListener('mousedown', handleStartGame);
        
        // Prevent double-tap zoom on mobile
        freshStartBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            freshStartBtn.classList.remove('active');
        }, { passive: false });
    }
});
