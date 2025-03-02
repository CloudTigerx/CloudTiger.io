const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

let gameState = 'ready';
let startTime = 0;
let endTime = 0;
let playerReactionTime = 0;
let aiReactionTime = 0;
let countdownStep = 0;
let lastFrameTime = 0;
let countdownInterval = 800;
let falseStart = false;
let greenLightTime = 0;
let foulTime = 0;
let isMobile = false;
let scaleFactor = 1;

const launchBtn = document.getElementById('launchBtn');
const launchSideBtn = document.getElementById('launchSideBtn');
const opponentTimeInput = document.getElementById('opponentTime');
const playerTimeDisplay = document.getElementById('playerTime');
const aiTimeDisplay = document.getElementById('aiTime');
const resultDisplay = document.getElementById('result');

opponentTimeInput.addEventListener('change', validateOpponentTime);
opponentTimeInput.addEventListener('input', validateOpponentTime);

function validateOpponentTime() {
  const value = opponentTimeInput.value;
  
  if (value === '' || isNaN(parseFloat(value))) {
    opponentTimeInput.value = '1.0';
    return;
  }
  
  const numValue = parseFloat(value);
  if (numValue < 0) {
    opponentTimeInput.value = '0.000';
  } else if (numValue > 5.0) {
    opponentTimeInput.value = '5.0';
  }
}

function checkMobile() {
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    document.body.classList.add('mobile');
  } else {
    document.body.classList.remove('mobile');
  }
  
  return isMobile;
}

function setCanvasDimensions() {
  const container = document.querySelector('.canvas-container');
  const containerWidth = container.clientWidth;
  
  checkMobile();
  
  if (isMobile) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    canvas.width = windowWidth * 0.95;
    canvas.height = Math.min(windowHeight * 0.7, 800);
    
    scaleFactor = canvas.width / 1200;
  } else {
    canvas.width = Math.min(1200, containerWidth);
    canvas.height = 1000;
    scaleFactor = 1;
  }
}

function drawChristmasTree() {
  const treeWidth = canvas.width * 0.5;
  const treeHeight = canvas.height * 0.95;
  const treeX = (canvas.width - treeWidth) / 2;
  const treeY = canvas.height * 0.02;
  
  ctx.fillStyle = '#333';
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 4;
  ctx.fillRect(treeX, treeY, treeWidth, treeHeight);
  ctx.strokeRect(treeX, treeY, treeWidth, treeHeight);
  
  const totalLights = 7;
  const lightRadius = treeWidth * 0.1;
  const usableHeight = treeHeight - (lightRadius * 4);
  const lightSpacing = usableHeight / (totalLights - 1);
  const lightCenterX = treeX + treeWidth / 2;
  
  function drawLightPair(yPosition, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lightCenterX - lightRadius * 3, yPosition, lightRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(lightCenterX + lightRadius * 3, yPosition, lightRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  
  const preStageY = treeY + lightRadius * 2;
  const stageY = preStageY + lightSpacing;
  const amber1Y = stageY + lightSpacing;
  const amber2Y = amber1Y + lightSpacing;
  const amber3Y = amber2Y + lightSpacing;
  const greenY = amber3Y + lightSpacing;
  const redY = greenY + lightSpacing;
  
  drawLightPair(preStageY, '#ffff00');
  drawLightPair(stageY, '#ffff00');
  drawLightPair(amber1Y, (gameState === 'countdown' && countdownStep >= 1) ? '#ff7800' : '#444');
  drawLightPair(amber2Y, (gameState === 'countdown' && countdownStep >= 2) ? '#ff7800' : '#444');
  drawLightPair(amber3Y, (gameState === 'countdown' && countdownStep >= 3) ? '#ff7800' : '#444');
  drawLightPair(greenY, (gameState === 'racing' || gameState === 'finished') && !falseStart ? '#00ff00' : '#444');
  drawLightPair(redY, falseStart ? '#ff0000' : '#444');
  
  ctx.font = `bold ${Math.max(16, 24 * scaleFactor)}px Arial`;
  ctx.textAlign = 'right';
  
  function drawTextWithShadow(text, x, y) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.strokeText(text, x, y);
    
    ctx.fillStyle = 'white';
    ctx.fillText(text, x, y);
  }
  
  const labelX = treeX - 20;
  
  drawTextWithShadow('Pre-Stage', labelX, preStageY + 8);
  drawTextWithShadow('Stage', labelX, stageY + 8);
  drawTextWithShadow('Amber 1', labelX, amber1Y + 8);
  drawTextWithShadow('Amber 2', labelX, amber2Y + 8);
  drawTextWithShadow('Amber 3', labelX, amber3Y + 8);
  drawTextWithShadow('Green', labelX, greenY + 8);
  drawTextWithShadow('Red', labelX, redY + 8);
}

function startCountdown() {
  gameState = 'countdown';
  countdownStep = 0;
  falseStart = false;
  foulTime = 0;
  
  launchBtn.classList.add('faded');
  
  playerTimeDisplay.textContent = '0.000';
  aiTimeDisplay.textContent = '0.000';
  resultDisplay.textContent = 'Race in progress...';
  
  lastFrameTime = performance.now();
  
  greenLightTime = performance.now() + (countdownInterval * 4);
}

function handleLaunch() {
  if (gameState === 'ready') {
    validateOpponentTime();
    startCountdown();
  } else if (gameState === 'racing') {
    endTime = performance.now();
    playerReactionTime = (endTime - startTime) / 1000;
    playerTimeDisplay.textContent = playerReactionTime.toFixed(3);
    gameState = 'finished';
    
    if (playerReactionTime < aiReactionTime) {
      resultDisplay.textContent = 'You win!';
    } else {
      resultDisplay.textContent = 'AI wins!';
    }
    
    launchBtn.textContent = 'RACE AGAIN';
    launchSideBtn.textContent = 'RACE AGAIN';
    
    launchBtn.classList.remove('faded');
  } else if (gameState === 'finished') {
    gameState = 'ready';
    launchBtn.textContent = 'START RACE';
    launchSideBtn.textContent = 'LAUNCH!';
    resultDisplay.textContent = 'Ready to race!';
  } else if (gameState === 'countdown') {
    falseStart = true;
    gameState = 'finished';
    
    const currentTime = performance.now();
    foulTime = (greenLightTime - currentTime) / 1000;
    
    playerTimeDisplay.textContent = '-' + foulTime.toFixed(3);
    resultDisplay.textContent = 'False start! ' + foulTime.toFixed(3) + 's too early!';
    
    launchBtn.textContent = 'RACE AGAIN';
    launchSideBtn.textContent = 'RACE AGAIN';
    
    launchBtn.classList.remove('faded');
  }
}

function updateGame(timestamp) {
  if (gameState === 'countdown') {
    const elapsed = timestamp - lastFrameTime;
    
    if (elapsed > countdownInterval) {
      countdownStep++;
      lastFrameTime = timestamp;
      
      if (countdownStep > 3) {
        gameState = 'racing';
        startTime = performance.now();
        
        aiReactionTime = parseFloat(opponentTimeInput.value);
        aiTimeDisplay.textContent = aiReactionTime.toFixed(3);
      }
    }
  } else if (gameState === 'racing') {
    const currentTime = performance.now();
    const elapsed = currentTime - startTime;
    
    if (elapsed / 1000 >= aiReactionTime) {
      aiTimeDisplay.textContent = aiReactionTime.toFixed(3);
      resultDisplay.textContent = 'AI has finished! Press FINISH to see who won.';
      
      if (elapsed / 1000 >= aiReactionTime + 3) {
        gameState = 'finished';
        launchBtn.textContent = 'RACE AGAIN';
        launchSideBtn.textContent = 'RACE AGAIN';
        
        launchBtn.classList.remove('faded');
      }
    }
  }
}

function draw(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  drawChristmasTree();
  updateGame(timestamp);
  
  requestAnimationFrame(draw);
}

function handleTouchStart(event) {
  event.preventDefault();
  
  if (gameState === 'countdown') {
    falseStart = true;
    gameState = 'finished';
    
    const currentTime = performance.now();
    foulTime = (greenLightTime - currentTime) / 1000;
    
    playerTimeDisplay.textContent = '-' + foulTime.toFixed(3);
    resultDisplay.textContent = 'False start! ' + foulTime.toFixed(3) + 's too early!';
    
    launchBtn.textContent = 'RACE AGAIN';
    launchSideBtn.textContent = 'RACE AGAIN';
    
    launchBtn.classList.remove('faded');
  }
}

window.addEventListener('resize', function() {
  setCanvasDimensions();
});

window.addEventListener('orientationchange', function() {
  setTimeout(setCanvasDimensions, 200);
});

launchBtn.addEventListener('click', function() {
  if (gameState === 'ready' || gameState === 'finished') {
    handleLaunch();
  } else if (gameState === 'racing') {
    handleLaunch();
  } else if (gameState === 'countdown') {
    falseStart = true;
    gameState = 'finished';
    
    const currentTime = performance.now();
    foulTime = (greenLightTime - currentTime) / 1000;
    
    playerTimeDisplay.textContent = '-' + foulTime.toFixed(3);
    resultDisplay.textContent = 'False start! ' + foulTime.toFixed(3) + 's too early!';
    
    launchBtn.textContent = 'RACE AGAIN';
    launchSideBtn.textContent = 'RACE AGAIN';
    
    launchBtn.classList.remove('faded');
  }
});

launchSideBtn.addEventListener('click', function() {
  if (gameState === 'ready' || gameState === 'finished') {
    handleLaunch();
  } else if (gameState === 'racing') {
    handleLaunch();
  } else if (gameState === 'countdown') {
    falseStart = true;
    gameState = 'finished';
    
    const currentTime = performance.now();
    foulTime = (greenLightTime - currentTime) / 1000;
    
    playerTimeDisplay.textContent = '-' + foulTime.toFixed(3);
    resultDisplay.textContent = 'False start! ' + foulTime.toFixed(3) + 's too early!';
    
    launchBtn.textContent = 'RACE AGAIN';
    launchSideBtn.textContent = 'RACE AGAIN';
    
    launchBtn.classList.remove('faded');
  }
});

canvas.addEventListener('click', function() {
  if (gameState === 'countdown') {
    falseStart = true;
    gameState = 'finished';
    
    const currentTime = performance.now();
    foulTime = (greenLightTime - currentTime) / 1000;
    
    playerTimeDisplay.textContent = '-' + foulTime.toFixed(3);
    resultDisplay.textContent = 'False start! ' + foulTime.toFixed(3) + 's too early!';
    
    launchBtn.textContent = 'RACE AGAIN';
    launchSideBtn.textContent = 'RACE AGAIN';
    
    launchBtn.classList.remove('faded');
  }
});

canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchend', function(event) {
  event.preventDefault();
  
  if (gameState === 'racing') {
    endTime = performance.now();
    playerReactionTime = (endTime - startTime) / 1000;
    playerTimeDisplay.textContent = playerReactionTime.toFixed(3);
    gameState = 'finished';
    
    if (playerReactionTime < aiReactionTime) {
      resultDisplay.textContent = 'You win!';
    } else {
      resultDisplay.textContent = 'AI wins!';
    }
    
    launchBtn.textContent = 'RACE AGAIN';
    launchSideBtn.textContent = 'RACE AGAIN';
    
    launchBtn.classList.remove('faded');
  }
});

function init() {
  setCanvasDimensions();
  draw();
}

window.onload = init;
