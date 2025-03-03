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

// Mobile D-pad Controls - Add this after your keyboard event handlers
document.addEventListener('DOMContentLoaded', function() {
    // D-pad direction buttons
    const dpadLeft = document.getElementById('dpad-left');
    const dpadRight = document.getElementById('dpad-right');
    const dpadUp = document.getElementById('dpad-up');
    const dpadDown = document.getElementById('dpad-down');
    
    // Action buttons
    const btnSpace = document.getElementById('btn-space');
    const btnPause = document.getElementById('btn-pause');
    
    // Helper function to simulate keydown events
    function simulateKeyEvent(keyCode) {
        const event = new KeyboardEvent('keydown', {
            key: keyCode,
            code: keyCode,
            keyCode: keyCode.charCodeAt(0),
            which: keyCode.charCodeAt(0),
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }
    
    // Add touch/click events for mobile controls
    
    // D-pad button handlers
    dpadLeft.addEventListener('touchstart', function(e) {
        e.preventDefault();
        dpadLeft.classList.add('active');
        // Move piece left
        if (currentPiece && gameState === 'playing') {
            movePiece(currentPiece, gameBoard, 'left');
        }
    });
    
    dpadRight.addEventListener('touchstart', function(e) {
        e.preventDefault();
        dpadRight.classList.add('active');
        // Move piece right
        if (currentPiece && gameState === 'playing') {
            movePiece(currentPiece, gameBoard, 'right');
        }
    });
    
    dpadUp.addEventListener('touchstart', function(e) {
        e.preventDefault();
        dpadUp.classList.add('active');
        // Rotate clockwise
        if (currentPiece && gameState === 'playing') {
            rotatePiece(currentPiece, gameBoard, 1);
        }
    });
    
    dpadDown.addEventListener('touchstart', function(e) {
        e.preventDefault();
        dpadDown.classList.add('active');
        // Rotate counter-clockwise
        if (currentPiece && gameState === 'playing') {
            rotatePiece(currentPiece, gameBoard, -1);
        }
    });
    
    // Action button handlers
    btnSpace.addEventListener('touchstart', function(e) {
        e.preventDefault();
        btnSpace.classList.add('active');
        // Fast drop
        if (currentPiece && gameState === 'playing') {
            hardDrop(currentPiece, gameBoard);
        }
    });
    
    btnPause.addEventListener('touchstart', function(e) {
        e.preventDefault();
        btnPause.classList.add('active');
        // Toggle pause
        togglePause();
    });
    
    // Start Game button in mobile controls
    const btnStart = document.getElementById('btn-start');
    
    btnStart.addEventListener('touchstart', function(e) {
        e.preventDefault();
        btnStart.classList.add('active');
        
        // Get the main start button and trigger its click
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.click();
        }
    });
    
    btnStart.addEventListener('touchend', function(e) {
        e.preventDefault();
        btnStart.classList.remove('active');
    });
    
    // Add mouse events for desktop testing
    btnStart.addEventListener('mousedown', function(e) {
        e.preventDefault();
        btnStart.classList.add('active');
        
        // Get the main start button and trigger its click
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.click();
        }
    });
    
    btnStart.addEventListener('mouseup', function(e) {
        e.preventDefault();
        btnStart.classList.remove('active');
    });
    
    // Include btnStart in the allButtons array
    const allButtons = [dpadLeft, dpadRight, dpadUp, dpadDown, btnSpace, btnPause, btnStart];
    
    // Add toggle controls functionality
    const toggleControlsBtn = document.getElementById('toggle-controls');
    const mobileControls = document.querySelector('.mobile-controls');
    
    // Initialize controls as hidden on desktop
    if (window.innerWidth > 768) {
        mobileControls.classList.add('hide-controls');
    }
    
    toggleControlsBtn.addEventListener('click', function() {
        mobileControls.classList.toggle('hide-controls');
    });
});
