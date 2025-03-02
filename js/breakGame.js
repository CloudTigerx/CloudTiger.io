const DragRacingSimulator = (function() {
    // Drag Racing Christmas Tree Simulator
    const christmasTreeCanvas = document.getElementById('christmasTreeCanvas');
    const christmasTreeCtx = christmasTreeCanvas ? christmasTreeCanvas.getContext('2d') : null;

    // Game state variables
    let gameState = 'ready'; // ready, countdown, racing, finished
    let startTime = 0;
    let endTime = 0;
    let playerReactionTime = 0;
    let aiReactionTime = 0;
    let countdownStep = 0;
    let lastFrameTime = 0;
    let countdownInterval = 500; // 0.5 seconds between amber lights (standard/sportsman tree)
    let falseStart = false;
    let greenLightTime = 0;
    let foulTime = 0;

    // UI Elements
    const startBtn = document.getElementById('startBtn');
    const launchSideBtn = document.getElementById('launchSideBtn');
    const resetBtn = document.getElementById('resetBtn');
    const opponentTimeInput = document.getElementById('opponentTime');
    const playerTimeDisplay = document.getElementById('playerTime');
    const aiTimeDisplay = document.getElementById('aiTime');
    const resultDisplay = document.getElementById('result');

    // Tree dimensions and positions
    const treeWidth = 300;
    const treeHeight = 600;
    const lightRadius = 15;
    const lightSpacing = 60;
    const laneWidth = 150;

    // Get colors from CSS custom properties
    function getComputedColor(propertyName) {
        return getComputedStyle(document.documentElement).getPropertyValue(propertyName).trim();
    }

    // Colors
    const offColor = getComputedColor('--off-color');
    const dimPreStageColor = getComputedColor('--dim-pre-stage-color');
    const dimStageColor = getComputedColor('--dim-stage-color');
    const dimAmberColor = getComputedColor('--dim-amber-color');
    const dimGreenColor = getComputedColor('--dim-green-color');
    const dimRedColor = getComputedColor('--dim-red-color');

    const preStageColor = getComputedColor('--pre-stage-color');
    const stageColor = getComputedColor('--stage-color');
    const amberColor = getComputedColor('--amber-color');
    const greenColor = getComputedColor('--green-color');
    const redColor = getComputedColor('--red-color');

    const poleColor = getComputedColor('--pole-color');
    const labelBgColor = getComputedColor('--label-bg-color');

    // Glow opacities
    const innerGlowOpacity = parseFloat(getComputedColor('--inner-glow-opacity'));
    const outerGlowOpacity = parseFloat(getComputedColor('--outer-glow-opacity'));
    const bulbGlowOpacity = parseFloat(getComputedColor('--bulb-glow-opacity'));

    // Initialize
    function init() {
        console.log("Initializing simulator");
        
        // Set canvas dimensions
        if (christmasTreeCanvas) {
            console.log("Canvas found, setting dimensions");
            // Set both the canvas element size and the drawing surface size
            christmasTreeCanvas.style.width = '100%';
            christmasTreeCanvas.style.height = 'auto';
            christmasTreeCanvas.width = 800;
            christmasTreeCanvas.height = 600;
            
            // Set up event listeners
            if (startBtn) startBtn.addEventListener('click', startCountdown);
            if (launchSideBtn) launchSideBtn.addEventListener('click', handleLaunch);
            if (resetBtn) resetBtn.addEventListener('click', resetRace);
            if (opponentTimeInput) {
                console.log("Opponent time input found");
                opponentTimeInput.addEventListener('change', validateOpponentTime);
            }
            
            // Handle keyboard controls
            document.addEventListener('keydown', function(event) {
                if (event.code === 'Space') {
                    if (gameState === 'ready') {
                        startCountdown();
                    } else if (gameState === 'countdown' || gameState === 'racing') {
                        handleLaunch();
                    }
                } else if (event.code === 'KeyR') {
                    resetRace();
                }
            });
            
            // Mobile detection
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                document.body.classList.add('mobile');
            }
            
            // Initial draw
            resetRace();
        } else {
            console.error("Canvas element not found!");
        }
    }

    // Reset the race
    function resetRace() {
        console.log("Resetting race");
        
        // Reset game state
        gameState = 'ready';
        startTime = 0;
        endTime = 0;
        playerReactionTime = 0;
        aiReactionTime = 0;
        countdownStep = 0;
        falseStart = false;
        greenLightTime = 0;
        
        // Reset displays
        if (playerTimeDisplay) playerTimeDisplay.textContent = '0.000';
        if (aiTimeDisplay) aiTimeDisplay.textContent = '0.000';
        if (resultDisplay) resultDisplay.textContent = 'Ready to race!';
        
        // Redraw
        drawChristmasTree();
    }

    // Validate opponent time input
    function validateOpponentTime() {
        const value = parseFloat(opponentTimeInput.value);
        if (isNaN(value) || value < 0 || value > 5) {
            opponentTimeInput.value = 0.050;
        }
    }

    // Draw the Christmas tree
    function drawChristmasTree() {
        if (!christmasTreeCanvas || !christmasTreeCtx) {
            console.error("Canvas or context not available for drawing");
            return;
        }
        
        console.log("Drawing Christmas tree");
        christmasTreeCtx.clearRect(0, 0, christmasTreeCanvas.width, christmasTreeCanvas.height);
        
        // Draw background (dark gray)
        christmasTreeCtx.fillStyle = '#333';
        christmasTreeCtx.fillRect(0, 0, christmasTreeCanvas.width, christmasTreeCanvas.height);
        
        // Draw the central tree structure
        drawTreeStructure();
        
        // Draw instructions
        christmasTreeCtx.fillStyle = '#fff';
        christmasTreeCtx.font = '16px Arial';
        christmasTreeCtx.textAlign = 'center';
        
        if (gameState === 'ready') {
            christmasTreeCtx.fillText('Click START RACE to begin', christmasTreeCanvas.width/2, 30);
        } else if (gameState === 'countdown') {
            christmasTreeCtx.fillText('Get ready to launch!', christmasTreeCanvas.width/2, 30);
        } else if (gameState === 'racing') {
            christmasTreeCtx.fillText('LAUNCH!', christmasTreeCanvas.width/2, 30);
        } else if (gameState === 'finished') {
            if (falseStart) {
                christmasTreeCtx.fillStyle = '#ff0000';
                // Display how early the player was
                const earlyBy = playerTimeDisplay ? playerTimeDisplay.textContent : '0.000';
                christmasTreeCtx.fillText(`RED LIGHT! Early by ${earlyBy.replace('-', '')}s`, christmasTreeCanvas.width/2, 30);
            }
        }
    }

    // Draw the main tree structure
    function drawTreeStructure() {
        const centerX = christmasTreeCanvas.width / 2;
        const topY = 80;
        
        // Draw the central pole
        christmasTreeCtx.fillStyle = poleColor;
        christmasTreeCtx.fillRect(centerX - 20, topY, 40, treeHeight);
        
        // Draw "DRAG" text vertically on the pole
        christmasTreeCtx.save();
        christmasTreeCtx.fillStyle = '#fff';
        christmasTreeCtx.font = 'bold 28px Arial';
        christmasTreeCtx.textAlign = 'center';
        
        // D
        christmasTreeCtx.fillText('D', centerX, topY + 250);
        // R
        christmasTreeCtx.fillText('R', centerX, topY + 290);
        // A
        christmasTreeCtx.fillText('A', centerX, topY + 330);
        // G
        christmasTreeCtx.fillText('G', centerX, topY + 370);
        christmasTreeCtx.restore();
        
        // Draw pre-stage light bar
        const preStageActive = gameState !== 'ready';
        drawLightBar(centerX, topY, "PRE", preStageActive ? preStageColor : dimPreStageColor, preStageActive);
        
        // Draw stage light bar
        const stageActive = gameState !== 'ready';
        drawLightBar(centerX, topY + 60, "STAGE", stageActive ? stageColor : dimStageColor, stageActive);
        
        // Draw the three amber lights
        for (let i = 0; i < 3; i++) {
            // Only light up the current amber light in the sequence
            const isLit = gameState === 'countdown' && countdownStep === i;
            
            // Always show the amber lights, but dim when not active
            const currentAmberColor = isLit ? amberColor : dimAmberColor;
            drawLight(centerX - 50, topY + 150 + (i * 60), currentAmberColor, isLit);
            drawLight(centerX + 50, topY + 150 + (i * 60), currentAmberColor, isLit);
        }
        
        // Draw green light
        const isGreenLit = gameState === 'racing' || (gameState === 'finished' && !falseStart);
        const currentGreenColor = isGreenLit ? greenColor : dimGreenColor;
        drawLight(centerX - 50, topY + 330, currentGreenColor, isGreenLit);
        drawLight(centerX + 50, topY + 330, currentGreenColor, isGreenLit);
        
        // Draw red light
        const isRedLit = gameState === 'finished' && falseStart;
        const currentRedColor = isRedLit ? redColor : dimRedColor;
        drawLight(centerX - 50, topY + 390, currentRedColor, isRedLit);
        drawLight(centerX + 50, topY + 390, currentRedColor, isRedLit);
    }

    // Draw a light bar with label (for pre-stage and stage)
    function drawLightBar(centerX, y, label, color, isLit) {
        // Draw the bar
        christmasTreeCtx.fillStyle = '#111';
        christmasTreeCtx.fillRect(centerX - 100, y, 200, 40);
        
        // Draw the label
        christmasTreeCtx.fillStyle = '#fff';
        christmasTreeCtx.font = 'bold 14px Arial';
        christmasTreeCtx.textAlign = 'center';
        christmasTreeCtx.fillText(label, centerX, y + 25);
        
        // Draw the lights on both sides
        if (isLit) {
            // Left side lights
            drawBulb(centerX - 70, y + 20, color, true);
            drawBulb(centerX - 50, y + 20, color, true);
            
            // Right side lights
            drawBulb(centerX + 50, y + 20, color, true);
            drawBulb(centerX + 70, y + 20, color, true);
        } else {
            // Draw dim lights
            drawBulb(centerX - 70, y + 20, color, false);
            drawBulb(centerX - 50, y + 20, color, false);
            drawBulb(centerX + 50, y + 20, color, false);
            drawBulb(centerX + 70, y + 20, color, false);
        }
    }

    // Draw a bulb-shaped light (teardrop shape)
    function drawBulb(x, y, color, isLit) {
        // Draw bulb base (circle)
        christmasTreeCtx.beginPath();
        christmasTreeCtx.arc(x, y, lightRadius, 0, Math.PI * 2);
        christmasTreeCtx.fillStyle = color;
        christmasTreeCtx.fill();
        
        // Draw teardrop point
        christmasTreeCtx.beginPath();
        christmasTreeCtx.moveTo(x - lightRadius, y);
        christmasTreeCtx.lineTo(x, y - lightRadius * 1.5);
        christmasTreeCtx.lineTo(x + lightRadius, y);
        christmasTreeCtx.fillStyle = color;
        christmasTreeCtx.fill();
        
        // Add highlight
        christmasTreeCtx.beginPath();
        christmasTreeCtx.arc(x - lightRadius/3, y - lightRadius/3, lightRadius/4, 0, Math.PI * 2);
        christmasTreeCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        christmasTreeCtx.fill();
        
        // Add extra glow for lit bulbs
        if (isLit) {
            // Outer glow
            christmasTreeCtx.beginPath();
            christmasTreeCtx.arc(x, y, lightRadius * 1.8, 0, Math.PI * 2);
            christmasTreeCtx.fillStyle = `rgba(${color === preStageColor || color === stageColor ? '255, 255, 0' : 
                                            color === amberColor ? '255, 165, 0' : 
                                            color === greenColor ? '0, 255, 0' : 
                                            '255, 0, 0'}, ${bulbGlowOpacity})`;
            christmasTreeCtx.fill();
        }
    }

    // Draw a circular light with 3D effect
    function drawLight(x, y, color, isLit) {
        // Draw light housing (black circle)
        christmasTreeCtx.beginPath();
        christmasTreeCtx.arc(x, y, lightRadius + 5, 0, Math.PI * 2);
        christmasTreeCtx.fillStyle = '#000';
        christmasTreeCtx.fill();
        
        // Draw main light
        christmasTreeCtx.beginPath();
        christmasTreeCtx.arc(x, y, lightRadius, 0, Math.PI * 2);
        christmasTreeCtx.fillStyle = color;
        christmasTreeCtx.fill();
        
        // Add 3D effect with gradient
        const gradient = christmasTreeCtx.createRadialGradient(
            x - lightRadius/3, y - lightRadius/3, 0,
            x, y, lightRadius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        
        christmasTreeCtx.beginPath();
        christmasTreeCtx.arc(x, y, lightRadius, 0, Math.PI * 2);
        christmasTreeCtx.fillStyle = gradient;
        christmasTreeCtx.fill();
        
        // Add outer glow for lit lights
        if (isLit) {
            // Inner intense glow
            christmasTreeCtx.beginPath();
            christmasTreeCtx.arc(x, y, lightRadius * 1.2, 0, Math.PI * 2);
            christmasTreeCtx.fillStyle = `rgba(${color === preStageColor || color === stageColor ? '255, 255, 0' : 
                                                color === amberColor ? '255, 165, 0' : 
                                                color === greenColor ? '0, 255, 0' : 
                                                '255, 0, 0'}, ${innerGlowOpacity})`;
            christmasTreeCtx.fill();
            
            // Outer subtle glow
            christmasTreeCtx.beginPath();
            christmasTreeCtx.arc(x, y, lightRadius * 2.2, 0, Math.PI * 2);
            christmasTreeCtx.fillStyle = `rgba(${color === preStageColor || color === stageColor ? '255, 255, 0' : 
                                                color === amberColor ? '255, 165, 0' : 
                                                color === greenColor ? '0, 255, 0' : 
                                                '255, 0, 0'}, ${outerGlowOpacity})`;
            christmasTreeCtx.fill();
        }
    }

    // Start the countdown sequence
    function startCountdown() {
        console.log("Starting countdown");
        if (gameState !== 'ready') return;
        
        gameState = 'countdown';
        countdownStep = 0;
        lastFrameTime = Date.now();
        falseStart = false;
        
        // Reset displays
        if (playerTimeDisplay) playerTimeDisplay.textContent = '0.000';
        if (aiTimeDisplay) aiTimeDisplay.textContent = '0.000';
        if (resultDisplay) resultDisplay.textContent = 'Racing...';

        // Draw immediately to show first amber light
        drawChristmasTree();
        
        // Start animation
        requestAnimationFrame(updateGame);
    }

    // Handle player launch
    function handleLaunch() {
        console.log("Player launched, game state:", gameState);
        if (gameState === 'ready' || gameState === 'finished') {
            return;
        }
        
        // Capture the exact time when the player launches
        endTime = Date.now();
        console.log("Launch time:", endTime);
        
        if (gameState === 'countdown') {
            // False start
            console.log("False start detected");
            falseStart = true;
            
            // Calculate the precise time when the green light would have appeared
            // The green light appears after all amber lights flash (3 steps in total)
            const timeToGreen = (countdownInterval * (3 - countdownStep)) + 
                                (Date.now() - lastFrameTime); // Add the partial time elapsed in current step
            
            // Calculate how early the player jumped the green light in seconds
            // This is the precise time between when they launched and when the green light would have appeared
            foulTime = timeToGreen / 1000;
            playerReactionTime = -foulTime;
            
            // Format the early time with 3 decimal places
            const earlyBy = foulTime.toFixed(3);
            
            if (playerTimeDisplay) playerTimeDisplay.textContent = `-${earlyBy}`;
            
            // AI still races
            const aiTime = parseFloat(opponentTimeInput.value);
            aiReactionTime = aiTime;
            if (aiTimeDisplay) aiTimeDisplay.textContent = aiTime.toFixed(3);
            
            if (resultDisplay) resultDisplay.textContent = `Red light!\nEarly by ${earlyBy}s`;
            gameState = 'finished';
        } else if (gameState === 'racing') {
            // Successful launch
            console.log("Successful launch");
            console.log("Green light time:", greenLightTime);
            
            // Ensure we have a valid green light time
            if (greenLightTime <= 0) {
                console.error("Invalid green light time!");
                return;
            }
            
            // Calculate reaction time in seconds with 3 decimal precision
            const reactionTimeMs = endTime - greenLightTime;
            playerReactionTime = reactionTimeMs / 1000;
            
            console.log("Reaction time (ms):", reactionTimeMs);
            console.log("Reaction time (s):", playerReactionTime);
            
            // Format with 3 decimal places for display
            const formattedTime = playerReactionTime.toFixed(3);
            if (playerTimeDisplay) playerTimeDisplay.textContent = formattedTime;
            
            // AI reaction
            const aiTime = parseFloat(opponentTimeInput.value);
            aiReactionTime = aiTime;
            if (aiTimeDisplay) aiTimeDisplay.textContent = aiTime.toFixed(3);
            
            // Determine winner based on reaction times
            if (playerReactionTime < aiReactionTime) {
                if (resultDisplay) resultDisplay.textContent = `You win!\n\nYour time: ${formattedTime}s\nAI time: ${aiTime.toFixed(3)}s`;
            } else {
                if (resultDisplay) resultDisplay.textContent = `AI wins!\n\nAI time: ${aiTime.toFixed(3)}s\nYour time: ${formattedTime}s`;
            }
            
            gameState = 'finished';
        }
        
        // Redraw
        drawChristmasTree();
    }

    // Update game state
    function updateGame(timestamp) {
        if (gameState === 'countdown') {
            const currentTime = Date.now();
            const elapsed = currentTime - lastFrameTime;
            
            if (elapsed >= countdownInterval) {
                console.log("Countdown step:", countdownStep);
                countdownStep++;
                lastFrameTime = currentTime;
                
                // Draw the current state immediately to avoid blinking
                drawChristmasTree();
                
                if (countdownStep > 2) { // Changed from 3 to 2 since we're 0-indexed
                    // Countdown complete, start race
                    console.log("Countdown complete, starting race");
                    gameState = 'racing';
                    
                    // Record the exact time when the green light appears
                    // The green light appears after all amber lights flash (3 steps in total)
                    greenLightTime = Date.now(); // Use Date.now() to get the most accurate current time
                    startTime = greenLightTime;
                    console.log("Green light set at:", greenLightTime);
                    
                    // Immediately redraw to show the green light
                    drawChristmasTree();
                    
                    // Set AI reaction time
                    const aiTime = parseFloat(opponentTimeInput.value);
                    
                    // AI launches after its reaction time
                    setTimeout(() => {
                        if (gameState === 'racing') {
                            console.log("AI launching");
                            if (aiTimeDisplay) aiTimeDisplay.textContent = aiTime.toFixed(3);
                            
                            // IMPORTANT: Don't end the game here, just show that AI has launched
                            // This allows the player to still get their reaction time
                            if (resultDisplay) resultDisplay.textContent = 'AI has launched!';
                            
                            // Only end the game if player hasn't reacted after a reasonable time (e.g., 3 seconds)
                            setTimeout(() => {
                                if (gameState === 'racing' && playerTimeDisplay && playerTimeDisplay.textContent === '0.000') {
                                    console.log("Player didn't react in time, AI wins");
                                    if (resultDisplay) resultDisplay.textContent = 'AI wins!\n(No reaction from player)';
                                    gameState = 'finished';
                                    drawChristmasTree();
                                }
                            }, 3000); // Give player 3 seconds to react after AI launches
                        }
                    }, aiTime * 1000);
                }
            }
            
            // Request next frame
            requestAnimationFrame(updateGame);
        } else if (gameState === 'racing') {
            // Continue to update while in racing state
            drawChristmasTree();
            requestAnimationFrame(updateGame);
        }
    }

    // Make sure DOM is fully loaded before initializing
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM fully loaded");
        DragRacingSimulator.init();
    });

    // Run initialization when page loads (backup)
    window.onload = function() {
        console.log("Window loaded");
        DragRacingSimulator.init();
    };

    // Expose public API
    return {
        init: init
        // Other functions can be exposed here if needed
    };
})();
