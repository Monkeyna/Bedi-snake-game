const board = document.querySelector("#game-board");
const context = board.getContext("2d");
const scoreElement = document.querySelector("#score");
const bestScoreElement = document.querySelector("#best-score");
const snakeLengthElement = document.querySelector("#snake-length");
const restartButton = document.querySelector("#restart-button");
const statusElement = document.querySelector("#status");
const statusCard = document.querySelector("#status-card");
const pauseButton = document.querySelector("#pause-button");
const controlButtons = document.querySelectorAll(".control-button[data-direction]");
const contrastToggle = document.querySelector("#contrast-toggle");

const tileCount = 15;
const tileSize = board.width / tileCount;
const gameSpeed = 230;
const enemyMoveInterval = 2;
const bestScoreKey = "snake-best-score";
const contrastModeKey = "snake-high-contrast";
const swipeThreshold = 18;

const directions = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const enemyTemplates = [
  {
    path: [
      { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
      { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 },
      { x: 7, y: 1 }, { x: 8, y: 1 }, { x: 9, y: 1 }, { x: 10, y: 1 },
      { x: 11, y: 1 }, { x: 12, y: 1 }, { x: 13, y: 1 }, { x: 14, y: 1 },
      { x: 15, y: 1 }, { x: 14, y: 1 }, { x: 13, y: 1 }, { x: 12, y: 1 },
      { x: 11, y: 1 }, { x: 10, y: 1 }, { x: 9, y: 1 }, { x: 8, y: 1 },
      { x: 7, y: 1 }, { x: 6, y: 1 }, { x: 5, y: 1 }, { x: 4, y: 1 },
      { x: 3, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 1 },
    ],
    length: 3,
    progress: 0,
  },
  {
    path: [
      { x: 15, y: 13 }, { x: 14, y: 13 }, { x: 13, y: 13 }, { x: 12, y: 13 },
      { x: 11, y: 13 }, { x: 10, y: 13 }, { x: 9, y: 13 }, { x: 8, y: 13 },
      { x: 7, y: 13 }, { x: 6, y: 13 }, { x: 5, y: 13 }, { x: 4, y: 13 },
      { x: 3, y: 13 }, { x: 2, y: 13 }, { x: 1, y: 13 }, { x: 0, y: 13 },
      { x: -1, y: 13 }, { x: 0, y: 13 }, { x: 1, y: 13 }, { x: 2, y: 13 },
      { x: 3, y: 13 }, { x: 4, y: 13 }, { x: 5, y: 13 }, { x: 6, y: 13 },
      { x: 7, y: 13 }, { x: 8, y: 13 }, { x: 9, y: 13 }, { x: 10, y: 13 },
      { x: 11, y: 13 }, { x: 12, y: 13 }, { x: 13, y: 13 }, { x: 14, y: 13 },
    ],
    length: 3,
    progress: 6,
  },
  {
    path: [
      { x: 13, y: -1 }, { x: 13, y: 0 }, { x: 13, y: 1 }, { x: 13, y: 2 },
      { x: 13, y: 3 }, { x: 13, y: 4 }, { x: 13, y: 5 }, { x: 13, y: 6 },
      { x: 13, y: 7 }, { x: 13, y: 8 }, { x: 13, y: 9 }, { x: 13, y: 10 },
      { x: 13, y: 11 }, { x: 13, y: 12 }, { x: 13, y: 13 }, { x: 13, y: 14 },
      { x: 13, y: 15 }, { x: 13, y: 14 }, { x: 13, y: 13 }, { x: 13, y: 12 },
      { x: 13, y: 11 }, { x: 13, y: 10 }, { x: 13, y: 9 }, { x: 13, y: 8 },
      { x: 13, y: 7 }, { x: 13, y: 6 }, { x: 13, y: 5 }, { x: 13, y: 4 },
      { x: 13, y: 3 }, { x: 13, y: 2 }, { x: 13, y: 1 }, { x: 13, y: 0 },
    ],
    length: 2,
    progress: 10,
  },
];

let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let score = 3;
let bestScore = 3;
let gameStarted = false;
let gameOver = false;
let gamePaused = false;
let loopId;
let tickCount = 0;
let enemySnakes = [];
let touchStart = null;

function getCssVariable(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function announce(message) {
  statusElement.textContent = "";
  statusCard.textContent = message;
  window.setTimeout(() => {
    statusElement.textContent = message;
  }, 10);
}

function getStoredBestScore() {
  const storedValue = window.localStorage.getItem(bestScoreKey);
  return storedValue ? Number(storedValue) : 3;
}

function setBestScore(value) {
  bestScore = value;
  window.localStorage.setItem(bestScoreKey, String(value));
}

function getStoredContrastMode() {
  return window.localStorage.getItem(contrastModeKey) === "true";
}

function setContrastMode(enabled) {
  document.body.classList.toggle("high-contrast", enabled);
  contrastToggle.setAttribute("aria-pressed", String(enabled));
  contrastToggle.textContent = enabled ? "Vysoký kontrast zapnutý" : "Vysoký kontrast vypnutý";
  window.localStorage.setItem(contrastModeKey, String(enabled));
}

function updatePauseButton() {
  pauseButton.textContent = gamePaused ? "Pokračovat" : "Pozastavit";
  pauseButton.setAttribute("aria-pressed", String(gamePaused));
}

function updateHud() {
  scoreElement.textContent = String(score);
  bestScoreElement.textContent = String(bestScore);
  snakeLengthElement.textContent = String(snake.length);
}

function updateBoardLabel() {
  let state = "hra čeká na spuštění";

  if (gameStarted) {
    state = "hra běží";
  }

  if (gamePaused) {
    state = "hra je pozastavena";
  }

  if (gameOver) {
    state = "hra skončila";
  }

  board.setAttribute(
    "aria-label",
    `Herní plocha Snake, ${state}. Skóre ${score}, délka hada ${snake.length}.`,
  );
}

function randomPosition() {
  return {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount),
  };
}

function isOccupied(position) {
  const onPlayer = snake.some((segment) => segment.x === position.x && segment.y === position.y);
  const onEnemy = enemySnakes.some((enemy) =>
    enemy.segments.some((segment) => segment.x === position.x && segment.y === position.y),
  );

  return onPlayer || onEnemy;
}

function placeFood() {
  let newFood = randomPosition();

  while (isOccupied(newFood)) {
    newFood = randomPosition();
  }

  food = newFood;
}

function getEnemySegments(path, progress, length) {
  const segments = [];

  for (let index = 0; index < length; index += 1) {
    const pathIndex = (progress - index + path.length) % path.length;
    segments.push({ ...path[pathIndex] });
  }

  return segments;
}

function createEnemySnakes() {
  return enemyTemplates.map((template) => ({
    ...template,
    colors: {
      body: getCssVariable("--enemy"),
      bodyShadow: getCssVariable("--enemy-dark"),
      eye: "#111111",
      tongue: "#6b2a21",
    },
    segments: getEnemySegments(template.path, template.progress, template.length),
  }));
}

function getCenter(position) {
  return {
    x: position.x * tileSize + tileSize / 2,
    y: position.y * tileSize + tileSize / 2,
  };
}

function resetGame(announceReset = true) {
  snake = [
    { x: 7, y: 7 },
    { x: 6, y: 7 },
    { x: 5, y: 7 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 3;
  tickCount = 0;
  gameStarted = false;
  gameOver = false;
  gamePaused = false;
  clearTimeout(loopId);
  enemySnakes = createEnemySnakes();
  placeFood();
  updateHud();
  updatePauseButton();
  updateBoardLabel();
  draw();
  statusCard.textContent = "Hra čeká na spuštění. Swipni prstem doprava, doleva, nahoru nebo dolů, aby sis zahrál(a), nebo použij šipky či tlačítka.";

  if (announceReset) {
    announce("Nová hra připravena. Swipni prstem doprava, doleva, nahoru nebo dolů, nebo použij šipky či tlačítka.");
  }
}

function drawBackground() {
  context.clearRect(0, 0, board.width, board.height);
  context.fillStyle = getCssVariable("--board-bg");
  context.fillRect(0, 0, board.width, board.height);

  for (let y = 0; y < tileCount; y += 1) {
    for (let x = 0; x < tileCount; x += 1) {
      context.fillStyle = (x + y) % 2 === 0
        ? getCssVariable("--board-tile-a")
        : getCssVariable("--board-tile-b");
      context.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }
}

function drawFood() {
  const center = getCenter(food);
  const appleRadius = tileSize * 0.22;

  context.fillStyle = getCssVariable("--food");
  context.beginPath();
  context.arc(center.x, center.y, appleRadius, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#5f3d1f";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(center.x, center.y - appleRadius * 0.7);
  context.lineTo(center.x + 1, center.y - appleRadius * 1.15);
  context.stroke();

  context.fillStyle = getCssVariable("--food-leaf");
  context.beginPath();
  context.ellipse(
    center.x + appleRadius * 0.25,
    center.y - appleRadius * 0.92,
    appleRadius * 0.18,
    appleRadius * 0.1,
    -0.3,
    0,
    Math.PI * 2,
  );
  context.fill();
}

function getHeadDirection(segments) {
  if (segments.length < 2) {
    return { x: direction.x, y: direction.y };
  }

  const head = segments[0];
  const neck = segments[1];
  const dx = head.x - neck.x;
  const dy = head.y - neck.y;

  if (dx === 0 && dy === 0) {
    return { x: 1, y: 0 };
  }

  return { x: dx, y: dy };
}

function drawSnakeHead(segments, colors, movementVector) {
  const head = getCenter(segments[0]);
  const angle = Math.atan2(movementVector.y, movementVector.x);
  const radius = tileSize * 0.42;

  context.fillStyle = colors.body;
  context.beginPath();
  context.arc(head.x, head.y, radius, 0, Math.PI * 2);
  context.fill();

  const sideOffsetX = Math.cos(angle + Math.PI / 2) * radius * 0.28;
  const sideOffsetY = Math.sin(angle + Math.PI / 2) * radius * 0.28;
  const forwardX = Math.cos(angle) * radius * 0.16;
  const forwardY = Math.sin(angle) * radius * 0.16;

  [
    { x: head.x + sideOffsetX - forwardX, y: head.y + sideOffsetY - forwardY },
    { x: head.x - sideOffsetX - forwardX, y: head.y - sideOffsetY - forwardY },
  ].forEach((eye) => {
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.ellipse(eye.x, eye.y, radius * 0.18, radius * 0.24, angle, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = colors.eye;
    context.beginPath();
    context.ellipse(
      eye.x + Math.cos(angle) * 4,
      eye.y + Math.sin(angle) * 4,
      radius * 0.08,
      radius * 0.12,
      angle,
      0,
      Math.PI * 2,
    );
    context.fill();
  });

  context.strokeStyle = colors.tongue;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(
    head.x + Math.cos(angle) * radius * 0.7,
    head.y + Math.sin(angle) * radius * 0.7,
  );
  context.lineTo(
    head.x + Math.cos(angle) * radius * 1,
    head.y + Math.sin(angle) * radius * 1,
  );
  context.lineTo(
    head.x + Math.cos(angle + 0.2) * radius * 1.12,
    head.y + Math.sin(angle + 0.2) * radius * 1.12,
  );
  context.moveTo(
    head.x + Math.cos(angle) * radius * 1,
    head.y + Math.sin(angle) * radius * 1,
  );
  context.lineTo(
    head.x + Math.cos(angle - 0.2) * radius * 1.12,
    head.y + Math.sin(angle - 0.2) * radius * 1.12,
  );
  context.stroke();
}

function drawSnakeBody(segments, colors, movementVector) {
  const visibleSegments = segments.filter(
    (segment) =>
      segment.x >= 0 &&
      segment.x < tileCount &&
      segment.y >= 0 &&
      segment.y < tileCount,
  );

  if (visibleSegments.length === 0) {
    return;
  }

  const points = visibleSegments.map((segment) => getCenter(segment));
  const width = tileSize * 0.62;

  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = colors.body;
  context.lineWidth = width;
  context.beginPath();
  context.moveTo(points[points.length - 1].x, points[points.length - 1].y);

  for (let index = points.length - 2; index >= 0; index -= 1) {
    context.lineTo(points[index].x, points[index].y);
  }

  context.stroke();

  for (let index = visibleSegments.length - 1; index > 0; index -= 1) {
    const center = points[index];
    context.fillStyle = colors.bodyShadow;
    context.beginPath();
    context.arc(center.x, center.y, width * 0.44, 0, Math.PI * 2);
    context.fill();
  }

  drawSnakeHead(visibleSegments, colors, movementVector);
}

function drawEnemies() {
  enemySnakes.forEach((enemy) => {
    drawSnakeBody(enemy.segments, enemy.colors, getHeadDirection(enemy.segments));
  });
}

function drawPlayer() {
  drawSnakeBody(
    snake,
    {
      body: getCssVariable("--player"),
      bodyShadow: getCssVariable("--player-dark"),
      eye: "#07101e",
      tongue: "#8b1e14",
    },
    direction,
  );
}

function draw() {
  drawBackground();
  drawEnemies();
  drawFood();
  drawPlayer();
}

function moveEnemySnakes() {
  enemySnakes = enemySnakes.map((enemy) => {
    const nextProgress = (enemy.progress + 1) % enemy.path.length;

    return {
      ...enemy,
      progress: nextProgress,
      segments: getEnemySegments(enemy.path, nextProgress, enemy.length),
    };
  });
}

function endGame() {
  gameOver = true;
  gamePaused = false;
  clearTimeout(loopId);

  if (score > bestScore) {
    setBestScore(score);
    announce(`Konec hry. Nový rekord ${score}.`);
  } else {
    announce(`Konec hry. Skóre ${score}.`);
  }

  updateHud();
  updatePauseButton();
  updateBoardLabel();
  statusCard.textContent = "Konec hry. Klikni na Restart, nebo swipni prstem doprava, doleva, nahoru či dolů pro novou hru.";
}

function tick() {
  if (gameOver || !gameStarted || gamePaused) {
    return;
  }

  direction = nextDirection;
  tickCount += 1;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  const hitWall =
    head.x < 0 ||
    head.x >= tileCount ||
    head.y < 0 ||
    head.y >= tileCount;

  const hitSelf = snake.some((segment) => segment.x === head.x && segment.y === head.y);
  const hitEnemyHead = enemySnakes.some(
    (enemy) => enemy.segments[0]?.x === head.x && enemy.segments[0]?.y === head.y,
  );

  if (hitWall || hitSelf || hitEnemyHead) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    placeFood();
    announce(`Jablko sebráno. Skóre ${snake.length}.`);
  } else {
    snake.pop();
  }

  score = Math.max(score, snake.length);

  if (tickCount % enemyMoveInterval === 0) {
    moveEnemySnakes();
  }

  const playerHitMovedEnemy = enemySnakes.some(
    (enemy) => enemy.segments[0]?.x === snake[0].x && enemy.segments[0]?.y === snake[0].y,
  );

  if (playerHitMovedEnemy) {
    endGame();
    return;
  }

  updateHud();
  updateBoardLabel();
  draw();
  loopId = window.setTimeout(tick, gameSpeed);
}

function startGame() {
  if (gameOver) {
    resetGame(false);
  }

  if (gameStarted && !gamePaused) {
    return;
  }

  gameStarted = true;
  gamePaused = false;
  updatePauseButton();
  updateBoardLabel();
  board.focus();
  announce("Hra spuštěna.");
  tick();
}

function pauseGame() {
  if (!gameStarted || gameOver) {
    return;
  }

  gamePaused = true;
  clearTimeout(loopId);
  updatePauseButton();
  updateBoardLabel();
  announce("Hra je pozastavena.");
}

function togglePause() {
  if (!gameStarted || gameOver) {
    return;
  }

  if (gamePaused) {
    gamePaused = false;
    updatePauseButton();
    updateBoardLabel();
    board.focus();
    announce("Hra pokračuje.");
    tick();
    return;
  }

  pauseGame();
}

function setDirection(newDirection) {
  const reversingHorizontally = newDirection.x !== 0 && newDirection.x === -direction.x;
  const reversingVertically = newDirection.y !== 0 && newDirection.y === -direction.y;

  if (gameStarted && !gamePaused && (reversingHorizontally || reversingVertically)) {
    return;
  }

  if (gameOver) {
    resetGame(false);
  }

  nextDirection = newDirection;

  if (!gameStarted || gamePaused) {
    startGame();
  }
}

function handleDirectionalInput(directionName) {
  const newDirection = directions[directionName];

  if (!newDirection) {
    return;
  }

  setDirection(newDirection);
}

function handleKeydown(event) {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (key === " " || key === "p") {
    event.preventDefault();
    togglePause();
    return;
  }

  if (!directions[key]) {
    return;
  }

  event.preventDefault();
  handleDirectionalInput(key);
}

function handleContrastToggle() {
  const enabled = !document.body.classList.contains("high-contrast");
  setContrastMode(enabled);
  draw();
  announce(enabled ? "Vysoký kontrast zapnutý." : "Vysoký kontrast vypnutý.");
}

function handleTouchStart(event) {
  const touch = event.changedTouches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
}

function handleTouchEnd(event) {
  if (!touchStart) {
    return;
  }

  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  touchStart = null;

  if (Math.abs(dx) < swipeThreshold && Math.abs(dy) < swipeThreshold) {
    return;
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    handleDirectionalInput(dx > 0 ? "right" : "left");
  } else {
    handleDirectionalInput(dy > 0 ? "down" : "up");
  }

  board.focus();
}

document.addEventListener("keydown", handleKeydown);
restartButton.addEventListener("click", () => {
  resetGame();
  board.focus();
});
pauseButton.addEventListener("click", togglePause);
contrastToggle.addEventListener("click", handleContrastToggle);

controlButtons.forEach((button) => {
  button.addEventListener("click", () => {
    handleDirectionalInput(button.dataset.direction);
    board.focus();
  });
});

board.addEventListener("touchstart", handleTouchStart, { passive: true });
board.addEventListener("touchend", handleTouchEnd, { passive: true });

bestScore = getStoredBestScore();
setContrastMode(getStoredContrastMode());
resetGame(false);
announce("Hra Snake je připravena.");
