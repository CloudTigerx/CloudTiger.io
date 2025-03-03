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

// Fix initRenderer reference at the top of the file
(function() {
    // Create a backup initRenderer in case the renderer module fails to load
    if (typeof window.initRenderer !== 'function') {
        console.warn("initRenderer not found, creating backup");
        window.initRenderer = function(canvasId) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return null;
            
            const context = canvas.getContext('2d');
            
            return {
                clear: function() {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                },
                drawBlock: function(x, y, color, size) {
                    context.fillStyle = color || '#FF0000';
                    context.fillRect(x, y, size, size);
                },
                drawBoard: function(board, blockSize) {
                    if (!board) return;
                    for (let y = 0; y < board.length; y++) {
                        for (let x = 0; x < board[y].length; x++) {
                            if (board[y][x]) {
                                this.drawBlock(
                                    x * blockSize,
                                    y * blockSize,
                                    board[y][x],
                                    blockSize
                                );
                            }
                        }
                    }
                },
                context: context,
                canvas: canvas
            };
        };
    }
})();

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

// Add code to hide mobile controls on PC
document.addEventListener('DOMContentLoaded', function() {
    // Check if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Get the mobile controls container
    const mobileControls = document.querySelector('.mobile-controls');
    
    // Hide controls if not on mobile
    if (!isMobile && mobileControls) {
        mobileControls.style.display = 'none';
        console.log("PC detected - hiding mobile controls");
    } else if (mobileControls) {
        mobileControls.style.display = 'flex';
        console.log("Mobile detected - showing mobile controls");
    }
    
    // Wait for game to initialize fully
    setTimeout(function() {
        console.log("Installing error handlers and fixes");
        
        // 1. Fix potential undefined variable errors
        window.addEventListener('error', function(e) {
            console.log("Caught error:", e.message);
            // Prevent the game from crashing due to errors
            if (e.message.includes("undefined") || e.message.includes("null")) {
                e.preventDefault();
            }
        });
        
        // 2. Fix potential boundary checking issues
        const safeMoveCheck = function(fn) {
            return function() {
                try {
                    return fn.apply(this, arguments);
                } catch (e) {
                    console.log("Prevented move error:", e);
                    return false;
                }
            };
        };
        
        // Apply safe checks to common movement functions
        ['movePieceLeft', 'movePieceRight', 'movePieceDown', 'rotatePiece'].forEach(function(fnName) {
            if (typeof window[fnName] === 'function') {
                const originalFn = window[fnName];
                window[fnName] = safeMoveCheck(originalFn);
                console.log("Applied safety wrapper to:", fnName);
            }
        });
        
        // 3. Fix animation frame issues
        if (window.requestAnimationFrame) {
            const originalRAF = window.requestAnimationFrame;
            window.requestAnimationFrame = function(callback) {
                return originalRAF(function(timestamp) {
                    try {
                        return callback(timestamp);
                    } catch (e) {
                        console.log("Prevented animation error:", e);
                    }
                });
            };
        }
        
        // 4. Fix potential timer issues
        // Ensure game speed doesn't go below reasonable minimum
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = function(callback, delay) {
            // Enforce minimum delay of 10ms for stability
            const safeDelay = Math.max(10, delay);
            return originalSetTimeout(function() {
                try {
                    callback();
                } catch (e) {
                    console.log("Prevented timer callback error:", e);
                }
            }, safeDelay);
        };
        
        // 5. Add polyfill for older browsers
        if (!window.performance) {
            window.performance = {
                now: function() {
                    return Date.now();
                }
            };
        }
        
        // 6. Fix potential rendering issues
        if (typeof window.render === 'function' || typeof window.drawGame === 'function') {
            const renderFn = window.render || window.drawGame;
            const safeRender = function() {
                try {
                    renderFn();
                } catch (e) {
                    console.log("Prevented render error:", e);
                }
            };
            
            if (window.render) window.render = safeRender;
            if (window.drawGame) window.drawGame = safeRender;
        }
        
        // 7. Prevent rotation stack overflow
        if (typeof window.rotateAttachedBlock === 'function') {
            const originalRotate = window.rotateAttachedBlock;
            window.rotateAttachedBlock = function(block, center, direction) {
                if (!block || !center) return;
                
                // Add processing flag to prevent infinite recursion
                if (block._processing) return;
                block._processing = true;
                
                try {
                    originalRotate(block, center, direction);
                } catch (e) {
                    console.log("Prevented rotation error:", e);
                } finally {
                    // Always clean up the processing flag
                    delete block._processing;
                }
            };
        }
        
        console.log("Error handlers and fixes installed");
    }, 1500);
});

// Elementary mobile-specific controls implementation
document.addEventListener('DOMContentLoaded', function() {
    // Wait for game to initialize
    setTimeout(function() {
        console.log("Initializing simple mobile controls");
        
        // Add visual debug
        const debug = document.createElement('div');
        debug.style.position = 'fixed';
        debug.style.top = '10px';
        debug.style.right = '10px';
        debug.style.zIndex = '9999';
        debug.style.background = 'rgba(0,0,0,0.7)';
        debug.style.color = 'white';
        debug.style.padding = '5px';
        debug.style.fontSize = '12px';
        debug.textContent = 'Mobile Debug: loading...';
        document.body.appendChild(debug);
        
        function updateDebug(text) {
            debug.textContent = 'Mobile Debug: ' + text;
        }
        
        // Find the active element that receives keyboard events
        const gameCanvas = document.getElementById('gameCanvas');
        const gameContainer = document.getElementById('gameContainer');
        const body = document.body;
        
        // Find the game element that might handle keyboard events
        const activeElement = gameCanvas || gameContainer || body;
        
        updateDebug('Found active element: ' + (activeElement.id || activeElement.tagName));
        
        // Focus the active element to ensure it receives keyboard events
        try {
            activeElement.focus();
        } catch (e) {
            updateDebug('Focus error: ' + e.message);
        }
        
        // Create a map of keyCodes
        const KEYS = {
            LEFT: 37,
            RIGHT: 39,
            UP: 38,
            DOWN: 40,
            SPACE: 32
        };
        
        // Create a simple function to send keyboard events
        function sendKey(keyCode, type) {
            updateDebug('Sending ' + type + ' key: ' + keyCode);
            
            // Create a basic keyboard event
            const event = document.createEvent('KeyboardEvent');
            
            // Initialize the event with key code
            if (event.initKeyboardEvent) {
                // Modern browsers
                event.initKeyboardEvent(
                    type, // type: keydown, keyup
                    true, // bubbles
                    true, // cancelable
                    window, // view
                    false, // ctrlKey
                    false, // altKey
                    false, // shiftKey
                    false, // metaKey
                    keyCode, // keyCode
                    keyCode  // charCode
                );
            } else {
                // Fallback
                event.initKeyEvent(
                    type, // type: keydown, keyup
                    true, // bubbles
                    true, // cancelable
                    window, // view
                    false, // ctrlKey
                    false, // altKey
                    false, // shiftKey
                    false, // metaKey
                    keyCode, // keyCode
                    0      // charCode
                );
            }
            
            // Fix for Webkit browsers
            Object.defineProperty(event, 'keyCode', {
                get: function() { return keyCode; }
            });
            
            // Dispatch the event
            activeElement.dispatchEvent(event);
            
            // Also try document level dispatch for games that listen at that level
            document.dispatchEvent(event);
        }
        
        // Create an interval to repeatedly send a key
        let activeInterval = null;
        
        function startRepeatingKey(keyCode) {
            // Clear any existing interval
            if (activeInterval) {
                clearInterval(activeInterval);
            }
            
            // Send the initial key
            sendKey(keyCode, 'keydown');
            
            // Set up repeating
            activeInterval = setInterval(function() {
                sendKey(keyCode, 'keydown');
            }, 150);
        }
        
        function stopRepeatingKey(keyCode) {
            // Clear the interval
            if (activeInterval) {
                clearInterval(activeInterval);
                activeInterval = null;
            }
            
            // Send key up event
            sendKey(keyCode, 'keyup');
        }
        
        // Handle drop button (Space)
        const btnSpace = document.getElementById('btn-space');
        if (btnSpace) {
            // Create pure implementation for space
            btnSpace.addEventListener('touchstart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                btnSpace.classList.add('active');
                
                // Set window variable for drop speed
                window.SOFT_DROP_ACTIVE = true;
                
                // Press space key
                sendKey(KEYS.SPACE, 'keydown');
                
                updateDebug('Space DOWN');
            }, false);
            
            btnSpace.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                btnSpace.classList.remove('active');
                
                // Unset window variable
                window.SOFT_DROP_ACTIVE = false;
                
                // Release space key
                sendKey(KEYS.SPACE, 'keyup');
                
                updateDebug('Space UP');
            }, false);
        }
        
        // Handle directional buttons
        const dpadLeft = document.getElementById('dpad-left');
        if (dpadLeft) {
            dpadLeft.addEventListener('touchstart', function(e) {
                e.preventDefault();
                dpadLeft.classList.add('active');
                startRepeatingKey(KEYS.LEFT);
                updateDebug('Left DOWN');
            }, false);
            
            dpadLeft.addEventListener('touchend', function(e) {
                e.preventDefault();
                dpadLeft.classList.remove('active');
                stopRepeatingKey(KEYS.LEFT);
                updateDebug('Left UP');
            }, false);
        }
        
        const dpadRight = document.getElementById('dpad-right');
        if (dpadRight) {
            dpadRight.addEventListener('touchstart', function(e) {
                e.preventDefault();
                dpadRight.classList.add('active');
                startRepeatingKey(KEYS.RIGHT);
                updateDebug('Right DOWN');
            }, false);
            
            dpadRight.addEventListener('touchend', function(e) {
                e.preventDefault();
                dpadRight.classList.remove('active');
                stopRepeatingKey(KEYS.RIGHT);
                updateDebug('Right UP');
            }, false);
        }
        
        const dpadUp = document.getElementById('dpad-up');
        if (dpadUp) {
            dpadUp.addEventListener('touchstart', function(e) {
                e.preventDefault();
                dpadUp.classList.add('active');
                // Don't repeat rotation, just send once
                sendKey(KEYS.UP, 'keydown');
                setTimeout(function() {
                    sendKey(KEYS.UP, 'keyup');
                }, 100);
                updateDebug('Up (rotate)');
            }, false);
            
            dpadUp.addEventListener('touchend', function(e) {
                e.preventDefault();
                dpadUp.classList.remove('active');
            }, false);
        }
        
        const dpadDown = document.getElementById('dpad-down');
        if (dpadDown) {
            dpadDown.addEventListener('touchstart', function(e) {
                e.preventDefault();
                dpadDown.classList.add('active');
                startRepeatingKey(KEYS.DOWN);
                updateDebug('Down DOWN');
            }, false);
            
            dpadDown.addEventListener('touchend', function(e) {
                e.preventDefault();
                dpadDown.classList.remove('active');
                stopRepeatingKey(KEYS.DOWN);
                updateDebug('Down UP');
            }, false);
        }
        
        // Speed control for drop button
        if (!window.dropSpeedHooked) {
            window.dropSpeedHooked = true;
            window.SOFT_DROP_ACTIVE = false;
            
            const originalSetTimeout = window.setTimeout;
            window.setTimeout = function(callback, delay) {
                if (delay > 400 && delay < 2000 && window.SOFT_DROP_ACTIVE) {
                    updateDebug('Fast drop: ' + delay + ' -> ' + (delay/22));
                    return originalSetTimeout(callback, delay / 22);
                }
                return originalSetTimeout(callback, delay);
            };
        }
        
        updateDebug('Mobile controls ready');
    }, 1000);
});

// Fix the missing initRenderer reference
document.addEventListener('DOMContentLoaded', function() {
    // Wait for game to initialize
    setTimeout(function() {
        if (typeof initRenderer !== 'function') {
            // Define fallback if initRenderer is missing
            window.initRenderer = function(canvasId) {
                console.log("Using fallback renderer");
                const canvas = document.getElementById(canvasId);
                if (!canvas) return null;
                
                const context = canvas.getContext('2d');
                
                return {
                    clear: function() {
                        context.clearRect(0, 0, canvas.width, canvas.height);
                    },
                    drawBlock: function(x, y, color, size) {
                        context.fillStyle = color;
                        context.fillRect(x, y, size, size);
                    },
                    drawBoard: function(board, blockSize) {
                        if (!board) return;
                        for (let y = 0; y < board.length; y++) {
                            for (let x = 0; x < board[y].length; x++) {
                                if (board[y][x]) {
                                    this.drawBlock(
                                        x * blockSize,
                                        y * blockSize,
                                        board[y][x],
                                        blockSize
                                    );
                                }
                            }
                        }
                    },
                    context: context,
                    canvas: canvas
                };
            };
        }
        
        // Continue with the rest of your initialization code
        // ...
    }, 800);
});
