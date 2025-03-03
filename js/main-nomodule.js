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
let dropSpeed = 1600; // Fixed at 1600ms as requested
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

// Process breaking chains
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

// Simple mobile controls - only loads on mobile devices
document.addEventListener('DOMContentLoaded', function() {
  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const mobileControls = document.querySelector('.mobile-controls');
  
  // Toggle visibility based on device type
  if (mobileControls) {
    mobileControls.style.display = isMobile ? 'flex' : 'none';
    console.log(isMobile ? "Mobile detected - showing controls" : "PC detected - hiding mobile controls");
  } else if (isMobile) {
    // Mobile controls don't exist yet, create them
    console.log("Creating mobile controls");
    createMobileControls();
  }
  
  // Only proceed with mobile control setup if on a mobile device
  if (!isMobile) return;
  
  console.log("Setting up simplified mobile controls");
  
  // Simple key simulation
  function simulateKey(keyCode) {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      keyCode: keyCode
    }));
  }
  
  // Setup for each button
  function setupButton(id, keyCode, repeating = false) {
    const button = document.getElementById(id);
    if (!button) return;
    
    button.addEventListener('touchstart', function(e) {
      e.preventDefault();
      button.classList.add('active');
      
      // Initial keypress
      simulateKey(keyCode);
      
      // Setup repeating if needed
      if (repeating) {
        button.repeatTimer = setInterval(function() {
          simulateKey(keyCode);
        }, 150);
      }
    }, { passive: false });
    
    button.addEventListener('touchend', function(e) {
      e.preventDefault();
      button.classList.remove('active');
      
      // Clear repeating timer if exists
      if (button.repeatTimer) {
        clearInterval(button.repeatTimer);
        button.repeatTimer = null;
      }
    }, { passive: false });
  }
  
  // Create mobile controls if they don't exist
  function createMobileControls() {
    const controls = document.createElement('div');
    controls.className = 'mobile-controls';
    controls.style.display = 'flex';
    controls.style.position = 'fixed';
    controls.style.bottom = '10px';
    controls.style.left = '0';
    controls.style.right = '0';
    controls.style.zIndex = '1000';
    controls.style.justifyContent = 'space-between';
    controls.style.padding = '10px';
    
    // Create d-pad container (left side)
    const dpad = document.createElement('div');
    dpad.className = 'dpad';
    dpad.style.display = 'grid';
    dpad.style.gridTemplateColumns = 'repeat(3, 1fr)';
    dpad.style.gridTemplateRows = 'repeat(3, 1fr)';
    dpad.style.gap = '5px';
    dpad.style.width = '150px';
    dpad.style.height = '150px';
    
    // Create dpad buttons
    const createDpadButton = (id, text, row, col) => {
      const btn = document.createElement('button');
      btn.id = id;
      btn.textContent = text;
      btn.style.gridRow = row;
      btn.style.gridColumn = col;
      btn.style.background = 'rgba(255,255,255,0.3)';
      btn.style.border = '1px solid white';
      btn.style.borderRadius = '5px';
      btn.style.color = 'white';
      btn.style.fontSize = '20px';
      btn.style.touchAction = 'none';
      dpad.appendChild(btn);
      return btn;
    };
    
    createDpadButton('dpad-up', '↑', 1, 2);
    createDpadButton('dpad-left', '←', 2, 1);
    createDpadButton('dpad-right', '→', 2, 3);
    createDpadButton('dpad-down', '↓', 3, 2);
    
    // Create action button (right side)
    const actionBtn = document.createElement('button');
    actionBtn.id = 'btn-space';
    actionBtn.textContent = 'DROP';
    actionBtn.style.width = '120px';
    actionBtn.style.height = '120px';
    actionBtn.style.background = 'rgba(255,0,0,0.3)';
    actionBtn.style.border = '1px solid white';
    actionBtn.style.borderRadius = '50%';
    actionBtn.style.color = 'white';
    actionBtn.style.fontSize = '20px';
    actionBtn.style.touchAction = 'none';
    
    // Add to DOM
    controls.appendChild(dpad);
    controls.appendChild(actionBtn);
    document.body.appendChild(controls);
  }
  
  // Set up directional controls
  setupButton('dpad-left', 37, true);   // Left arrow (repeating)
  setupButton('dpad-right', 39, true);  // Right arrow (repeating)
  setupButton('dpad-up', 38, false);    // Up arrow (single press)
  setupButton('dpad-down', 40, true);   // Down arrow (repeating)
  
  // Special setup for space/drop button
  const spaceButton = document.getElementById('btn-space');
  if (spaceButton) {
    spaceButton.addEventListener('touchstart', function(e) {
      e.preventDefault();
      spaceButton.classList.add('active');
      simulateKey(32); // Space bar
      
      // Enable fast drop
      window.SOFT_DROP_ACTIVE = true;
    }, { passive: false });
    
    spaceButton.addEventListener('touchend', function(e) {
      e.preventDefault();
      spaceButton.classList.remove('active');
      window.SOFT_DROP_ACTIVE = false;
    }, { passive: false });
  }
  
  // Add CSS for :active state
  const style = document.createElement('style');
  style.textContent = `
    .mobile-controls button.active {
      background-color: rgba(255,255,255,0.6) !important;
      transform: scale(0.95);
    }
    .mobile-controls #btn-space.active {
      background-color: rgba(255,0,0,0.6) !important;
    }
  `;
  document.head.appendChild(style);
  
  // Drop speed control
  if (!window.dropSpeedHooked) {
    window.dropSpeedHooked = true;
    window.SOFT_DROP_ACTIVE = false;
    
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function(callback, delay) {
      if (delay > 400 && delay < 2000 && window.SOFT_DROP_ACTIVE) {
        return originalSetTimeout(callback, delay / 22);
      }
      return originalSetTimeout(callback, delay);
    };
  }
  
  console.log("Mobile controls initialized");
});
