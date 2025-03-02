// Canvas setup
let canvas, ctx;
let gameRunning = false;
let score = 0;
let lives = 3;

// Game objects
let ball, paddle;

// Brick properties
const brickRowCount = 5;
const brickColumnCount = 9;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 60;
const brickOffsetLeft = 30;

// Create bricks
const bricks = [];

// Keyboard controls
let rightPressed = false;
let leftPressed = false;

// Initialize game
function init() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  
  // Initialize game objects
  ball = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    dx: 4,
    dy: -4,
    radius: 10
  };
  
  paddle = {
    width: 100,
    height: 10,
    x: (canvas.width - 100) / 2,
    speed: 8
  };
  
  // Create brick grid
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
  }
  
  // Event listeners
  document.addEventListener('keydown', keyDownHandler);
  document.addEventListener('keyup', keyUpHandler);
  document.addEventListener('mousemove', mouseMoveHandler);
  document.addEventListener('touchmove', touchMoveHandler, { passive: false });
  
  // Resize canvas initially
  resizeCanvas();
  
  // Handle window resize
  window.addEventListener('resize', resizeCanvas);
  
  // Start and reset buttons
  document.getElementById('startBtn').addEventListener('click', () => {
    if (!gameRunning) {
      gameRunning = true;
      draw();
    }
  });
  
  document.getElementById('resetBtn').addEventListener('click', resetGame);
}

// Mobile touch controls
function touchMoveHandler(e) {
  e.preventDefault();
  const relativeX = e.touches[0].clientX - canvas.offsetLeft;
  if (relativeX > 0 && relativeX < canvas.width) {
    paddle.x = relativeX - paddle.width / 2;
  }
}

// Mouse controls
function mouseMoveHandler(e) {
  const relativeX = e.clientX - canvas.offsetLeft;
  if (relativeX > 0 && relativeX < canvas.width) {
    paddle.x = relativeX - paddle.width / 2;
  }
}

// Keyboard controls
function keyDownHandler(e) {
  if (e.key === 'Right' || e.key === 'ArrowRight') {
    rightPressed = true;
  } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
    leftPressed = true;
  }
}

function keyUpHandler(e) {
  if (e.key === 'Right' || e.key === 'ArrowRight') {
    rightPressed = false;
  } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
    leftPressed = false;
  }
}

// Collision detection
function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        if (
          ball.x > b.x &&
          ball.x < b.x + brickWidth &&
          ball.y > b.y &&
          ball.y < b.y + brickHeight
        ) {
          ball.dy = -ball.dy;
          b.status = 0;
          score++;
          document.getElementById('score').textContent = score;
          
          // Check if all bricks are destroyed
          if (score === brickRowCount * brickColumnCount) {
            alert('Congratulations! You won!');
            document.location.reload();
          }
        }
      }
    }
  }
}

// Draw ball
function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#FF7800';
  ctx.fill();
  ctx.closePath();
}

// Draw paddle
function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddle.x, canvas.height - paddle.height, paddle.width, paddle.height);
  ctx.fillStyle = '#0095DD';
  ctx.fill();
  ctx.closePath();
}

// Draw bricks
function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = getRowColor(r);
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

// Get different colors for each row
function getRowColor(row) {
  const colors = ['#FF5252', '#FF9800', '#FFEB3B', '#4CAF50', '#2196F3'];
  return colors[row];
}

// Main draw function
function draw() {
  if (!gameRunning) return;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw game elements
  drawBricks();
  drawBall();
  drawPaddle();
  collisionDetection();
  
  // Ball movement and collision logic
  if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
    ball.dx = -ball.dx;
  }
  
  if (ball.y + ball.dy < ball.radius) {
    ball.dy = -ball.dy;
  } else if (ball.y + ball.dy > canvas.height - ball.radius) {
    if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
      // Calculate angle based on where the ball hits the paddle
      const hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      const angle = hitPoint * (Math.PI / 3); // Max 60 degrees
      
      ball.dx = 4 * Math.sin(angle);
      ball.dy = -4 * Math.cos(angle);
    } else {
      lives--;
      document.getElementById('lives').textContent = lives;
      
      if (lives === 0) {
        alert('Game Over! Your score: ' + score);
        gameRunning = false;
        return;
      } else {
        // Reset ball and paddle
        ball.x = canvas.width / 2;
        ball.y = canvas.height - 30;
        ball.dx = 4;
        ball.dy = -4;
        paddle.x = (canvas.width - paddle.width) / 2;
      }
    }
  }
  
  // Paddle movement
  if (rightPressed && paddle.x < canvas.width - paddle.width) {
    paddle.x += paddle.speed;
  } else if (leftPressed && paddle.x > 0) {
    paddle.x -= paddle.speed;
  }
  
  // Move ball
  ball.x += ball.dx;
  ball.y += ball.dy;
  
  requestAnimationFrame(draw);
}

// Resize canvas to be responsive
function resizeCanvas() {
  const container = document.querySelector('.game-container');
  const containerWidth = container.clientWidth - 40; // Account for margins
  
  // Maintain aspect ratio
  const aspectRatio = canvas.height / canvas.width;
  const newWidth = Math.min(800, containerWidth);
  const newHeight = newWidth * aspectRatio;
  
  // Set canvas display size (CSS)
  canvas.style.width = newWidth + 'px';
  canvas.style.height = newHeight + 'px';
  
  // Adjust paddle and ball positions based on scale
  if (gameRunning) {
    paddle.x = Math.min(paddle.x, canvas.width - paddle.width);
  }
}

// Reset game
function resetGame() {
  // Reset game state
  score = 0;
  lives = 3;
  document.getElementById('score').textContent = score;
  document.getElementById('lives').textContent = lives;
  
  // Reset ball and paddle
  ball.x = canvas.width / 2;
  ball.y = canvas.height - 30;
  ball.dx = 4;
  ball.dy = -4;
  paddle.x = (canvas.width - paddle.width) / 2;
  
  // Reset bricks
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r].status = 1;
    }
  }
  
  // Start game if not running
  if (!gameRunning) {
    gameRunning = true;
    draw();
  }
}

// Run initialization when page loads
window.onload = init;
