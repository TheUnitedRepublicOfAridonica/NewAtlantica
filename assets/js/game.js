const config = {
  playerSpeed: 7.1,
  aiSpeed: 5.5,
  puckSpeed: 6.2,
  maxPuckSpeed: 12.5,
  paddleHeight: 116,
  paddleWidth: 18,
  goalDelay: 1.0,
  maxPoints: 7
};

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreLeftEl = document.getElementById('scoreLeft');
const scoreRightEl = document.getElementById('scoreRight');

const keys = {
  w: false,
  s: false,
  ArrowUp: false,
  ArrowDown: false
};

const state = {
  leftScore: 0,
  rightScore: 0,
  roundDelay: 0,
  winner: null
};

const leftPaddle = {
  x: 42,
  y: canvas.height / 2 - config.paddleHeight / 2,
  width: config.paddleWidth,
  height: config.paddleHeight,
  speed: config.playerSpeed,
  color: '#ff6b6b'
};

const rightPaddle = {
  x: canvas.width - 42 - config.paddleWidth,
  y: canvas.height / 2 - config.paddleHeight / 2,
  width: config.paddleWidth,
  height: config.paddleHeight,
  speed: config.playerSpeed,
  color: '#5dd5ff'
};

const puck = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 12,
  vx: 0,
  vy: 0,
  color: '#f5f7fb'
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function resetPuck(direction = Math.random() < 0.5 ? -1 : 1) {
  puck.x = canvas.width / 2;
  puck.y = canvas.height / 2;
  const angle = randomBetween(-0.8, 0.8);
  const speed = config.puckSpeed;
  puck.vx = Math.cos(angle) * speed * direction;
  puck.vy = Math.sin(angle) * speed;
}

function resetRound(delay = config.goalDelay) {
  state.roundDelay = delay;
  puck.vx = 0;
  puck.vy = 0;
  puck.x = canvas.width / 2;
  puck.y = canvas.height / 2;

  leftPaddle.y = canvas.height / 2 - leftPaddle.height / 2;
  rightPaddle.y = canvas.height / 2 - rightPaddle.height / 2;
}

function scoreGoal(side) {
  if (state.winner) return;

  if (side === 'left') state.leftScore += 1;
  else state.rightScore += 1;

  scoreLeftEl.textContent = state.leftScore;
  scoreRightEl.textContent = state.rightScore;

  if (state.leftScore >= config.maxPoints || state.rightScore >= config.maxPoints) {
    state.winner = state.leftScore >= config.maxPoints ? 'Left Player' : 'Right Player';
    state.roundDelay = 2.5;
    return;
  }

  resetRound();
}

function handleInput() {
  if (keys.w) leftPaddle.y -= leftPaddle.speed;
  if (keys.s) leftPaddle.y += leftPaddle.speed;
  if (keys.ArrowUp) rightPaddle.y -= rightPaddle.speed;
  if (keys.ArrowDown) rightPaddle.y += rightPaddle.speed;

  leftPaddle.y = clamp(leftPaddle.y, 16, canvas.height - leftPaddle.height - 16);
  rightPaddle.y = clamp(rightPaddle.y, 16, canvas.height - rightPaddle.height - 16);
}

function updatePuck(dt) {
  if (state.roundDelay > 0) {
    state.roundDelay -= dt;
    if (state.roundDelay <= 0 && !state.winner) {
      const direction = Math.random() < 0.5 ? -1 : 1;
      resetPuck(direction);
    }
    return;
  }

  puck.x += puck.vx * dt * 60;
  puck.y += puck.vy * dt * 60;

  if (puck.y - puck.radius <= 12) {
    puck.y = 12 + puck.radius;
    puck.vy *= -1;
  }

  if (puck.y + puck.radius >= canvas.height - 12) {
    puck.y = canvas.height - 12 - puck.radius;
    puck.vy *= -1;
  }

  if (
    puck.x - puck.radius <= leftPaddle.x + leftPaddle.width &&
    puck.x + puck.radius >= leftPaddle.x &&
    puck.y + puck.radius >= leftPaddle.y &&
    puck.y - puck.radius <= leftPaddle.y + leftPaddle.height &&
    puck.vx < 0
  ) {
    const relativeIntersect = (puck.y - (leftPaddle.y + leftPaddle.height / 2)) / (leftPaddle.height / 2);
    const bounceAngle = relativeIntersect * (Math.PI / 3);
    const currentSpeed = Math.hypot(puck.vx, puck.vy);
    const newSpeed = Math.min(currentSpeed * 1.08, config.maxPuckSpeed);

    puck.x = leftPaddle.x + leftPaddle.width + puck.radius + 1;
    puck.vx = Math.cos(bounceAngle) * newSpeed;
    puck.vy = Math.sin(bounceAngle) * newSpeed;
  }

  if (
    puck.x + puck.radius >= rightPaddle.x &&
    puck.x - puck.radius <= rightPaddle.x + rightPaddle.width &&
    puck.y + puck.radius >= rightPaddle.y &&
    puck.y - puck.radius <= rightPaddle.y + rightPaddle.height &&
    puck.vx > 0
  ) {
    const relativeIntersect = (puck.y - (rightPaddle.y + rightPaddle.height / 2)) / (rightPaddle.height / 2);
    const bounceAngle = relativeIntersect * (Math.PI / 3);
    const currentSpeed = Math.hypot(puck.vx, puck.vy);
    const newSpeed = Math.min(currentSpeed * 1.08, config.maxPuckSpeed);

    puck.x = rightPaddle.x - puck.radius - 1;
    puck.vx = -Math.cos(bounceAngle) * newSpeed;
    puck.vy = Math.sin(bounceAngle) * newSpeed;
  }

  if (puck.x + puck.radius < 0) scoreGoal('right');
  else if (puck.x - puck.radius > canvas.width) scoreGoal('left');
}

function update(dt) {
  handleInput();

  if (state.winner) {
    if (state.roundDelay > 0) state.roundDelay -= dt;
    return;
  }

  updatePuck(dt);
}

function drawIceRink() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#9ecff0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < canvas.width; i += 14) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(120,170,220,0.04)';
    ctx.fillRect(i, 0, 7, canvas.height);
  }

  ctx.fillStyle = '#0d2b3a';
  ctx.fillRect(0, 0, canvas.width, 12);
  ctx.fillRect(0, canvas.height - 12, canvas.width, 12);
  ctx.fillRect(0, 12, 12, canvas.height - 24);
  ctx.fillRect(canvas.width - 12, 12, 12, canvas.height - 24);

  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 14]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 12);
  ctx.lineTo(canvas.width / 2, canvas.height - 12);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 78, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, canvas.height / 2 - 130, 64, 260);
  ctx.strokeRect(canvas.width - 64, canvas.height / 2 - 130, 64, 260);

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, canvas.height / 2 - 130, 24, 260);
  ctx.fillRect(canvas.width - 24, canvas.height / 2 - 130, 24, 260);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, 0, canvas.width, 5);
}

function drawPaddle(paddle) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = paddle.color;
  roundRect(ctx, paddle.x, paddle.y, paddle.width, paddle.height, 12);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  roundRect(ctx, paddle.x + 4, paddle.y + 8, paddle.width - 8, 18, 8);
  ctx.fill();
  ctx.restore();
}

function drawPuck() {
  ctx.beginPath();
  ctx.arc(puck.x, puck.y, puck.radius, 0, Math.PI * 2);
  ctx.fillStyle = puck.color;
  ctx.shadowColor = 'rgba(0,0,0,0.24)';
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(puck.x - 3, puck.y - 3, puck.radius * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fill();
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawWinnerText() {
  if (!state.winner) return;

  ctx.fillStyle = 'rgba(8, 25, 34, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f8fcff';
  ctx.font = 'bold 46px Arial';
  ctx.fillText(`${state.winner} Wins!`, canvas.width / 2, canvas.height / 2 - 16);
  ctx.font = '24px Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.fillText('Refresh the page to play again', canvas.width / 2, canvas.height / 2 + 36);
}

function render() {
  drawIceRink();
  drawPaddle(leftPaddle);
  drawPaddle(rightPaddle);
  drawPuck();

  if (state.winner) drawWinnerText();
}

function loop() {
  const dt = 1 / 60;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'w' || event.key === 'W') keys.w = true;
  if (event.key === 's' || event.key === 'S') keys.s = true;
  if (event.key === 'ArrowUp') keys.ArrowUp = true;
  if (event.key === 'ArrowDown') keys.ArrowDown = true;
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'w' || event.key === 'W') keys.w = false;
  if (event.key === 's' || event.key === 'S') keys.s = false;
  if (event.key === 'ArrowUp') keys.ArrowUp = false;
  if (event.key === 'ArrowDown') keys.ArrowDown = false;
});

resetPuck();
requestAnimationFrame(loop);
