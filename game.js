const board = document.querySelector("#game-board");
const context = board.getContext("2d");
const scoreElement = document.querySelector("#score");
const bestScoreElement = document.querySelector("#best-score");
const snakeLengthElement = document.querySelector("#snake-length");
const restartButton = document.querySelector("#restart-button");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlay-title");
const overlayText = document.querySelector("#overlay-text");
const overlayButton = document.querySelector("#overlay-button");

const tileCount = 15;
const tileSize = board.width / tileCount;
const gameSpeed = 230;
const bestScoreKey = "snake-romantic-best-score";
const enemyMoveInterval = 2;

const enemyTemplates = [
  {
    colors: {
      body: "rgba(96, 102, 116, 0.72)",
      bodyShadow: "rgba(54, 58, 69, 0.76)",
      highlight: "rgba(180, 189, 208, 0.18)",
      eye: "rgba(10, 12, 18, 0.82)",
      tongue: "rgba(133, 77, 77, 0.42)",
    },
    path: [
      { x: -1, y: 2 }, { x: 1, y: 2 }, { x: 3, y: 3 }, { x: 5, y: 4 },
      { x: 7, y: 4 }, { x: 9, y: 3 }, { x: 11, y: 2 }, { x: 13, y: 2 },
      { x: 15, y: 2 }, { x: 13, y: 2 }, { x: 11, y: 3 }, { x: 9, y: 4 },
      { x: 7, y: 5 }, { x: 5, y: 5 }, { x: 3, y: 4 }, { x: 1, y: 3 },
    ],
    length: 3,
    progress: 0,
  },
  {
    colors: {
      body: "rgba(86, 92, 106, 0.74)",
      bodyShadow: "rgba(42, 46, 58, 0.78)",
      highlight: "rgba(170, 178, 196, 0.16)",
      eye: "rgba(10, 12, 18, 0.82)",
      tongue: "rgba(133, 77, 77, 0.42)",
    },
    path: [
      { x: 15, y: 7 }, { x: 13, y: 7 }, { x: 11, y: 8 }, { x: 9, y: 9 },
      { x: 7, y: 10 }, { x: 5, y: 10 }, { x: 3, y: 9 }, { x: 1, y: 8 },
      { x: -1, y: 7 }, { x: 1, y: 7 }, { x: 3, y: 8 }, { x: 5, y: 9 },
      { x: 7, y: 9 }, { x: 9, y: 8 }, { x: 11, y: 7 }, { x: 13, y: 6 },
    ],
    length: 3,
    progress: 5,
  },
  {
    colors: {
      body: "rgba(76, 81, 95, 0.76)",
      bodyShadow: "rgba(34, 38, 48, 0.8)",
      highlight: "rgba(162, 170, 188, 0.15)",
      eye: "rgba(10, 12, 18, 0.84)",
      tongue: "rgba(133, 77, 77, 0.4)",
    },
    path: [
      { x: 3, y: 15 }, { x: 3, y: 13 }, { x: 4, y: 11 }, { x: 5, y: 9 },
      { x: 6, y: 7 }, { x: 7, y: 5 }, { x: 8, y: 3 }, { x: 9, y: 1 },
      { x: 10, y: -1 }, { x: 10, y: 1 }, { x: 9, y: 3 }, { x: 8, y: 5 },
      { x: 7, y: 7 }, { x: 6, y: 9 }, { x: 5, y: 11 }, { x: 4, y: 13 },
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
let applesEaten = 0;
let gameStarted = false;
let gameOver = false;
let loopId;
let enemySnakes = [];
let tickCount = 0;

function getStoredBestScore() {
  const storedValue = window.localStorage.getItem(bestScoreKey);
  return storedValue ? Number(storedValue) : 3;
}

function setBestScore(value) {
  bestScore = value;
  window.localStorage.setItem(bestScoreKey, String(value));
}

function updateHud() {
  scoreElement.textContent = String(score);
  bestScoreElement.textContent = String(bestScore);
  snakeLengthElement.textContent = String(snake.length);
}

function randomPosition() {
  return {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount),
  };
}

function placeFood() {
  let newFood = randomPosition();

  while (
    snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y) ||
    enemySnakes.some((enemy) =>
      enemy.segments.some((segment) => segment.x === newFood.x && segment.y === newFood.y),
    )
  ) {
    newFood = randomPosition();
  }

  food = newFood;
}

function showOverlay(title, text, buttonLabel) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayButton.textContent = buttonLabel;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function resetGame() {
  snake = [
    { x: 7, y: 7 },
    { x: 6, y: 7 },
    { x: 5, y: 7 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 3;
  applesEaten = 0;
  tickCount = 0;
  gameStarted = false;
  gameOver = false;
  clearTimeout(loopId);
  enemySnakes = createEnemySnakes();
  placeFood();
  updateHud();
  showOverlay(
    "Stiskni šipku pro start",
    "Ovládání: šipky nebo W, A, S, D. Dojeď k jablku, vyhni se zdi a pozor na střet hlava na hlavu s cizími hady.",
    "Začít",
  );
  draw();
}

function createEnemySnakes() {
  return enemyTemplates.map((template) => ({
    ...template,
    segments: getEnemySegments(template.path, template.progress, template.length),
  }));
}

function getEnemySegments(path, progress, length) {
  const segments = [];

  for (let index = 0; index < length; index += 1) {
    const pathIndex = (progress - index + path.length) % path.length;
    segments.push({ ...path[pathIndex] });
  }

  return segments;
}

function drawBackground() {
  context.clearRect(0, 0, board.width, board.height);
  context.fillStyle = "#3a8d55";
  context.fillRect(0, 0, board.width, board.height);

  for (let y = 0; y < tileCount; y += 1) {
    for (let x = 0; x < tileCount; x += 1) {
      const left = x * tileSize;
      const top = y * tileSize;
      const midX = left + tileSize / 2;
      const tint = (x + y) % 2 === 0 ? "#b9e058" : "#5caf63";

      context.fillStyle = tint;
      context.beginPath();
      context.moveTo(midX, top + 2);
      context.lineTo(left + tileSize - 2, top + tileSize * 0.25);
      context.lineTo(left + tileSize - 2, top + tileSize * 0.75);
      context.lineTo(midX, top + tileSize - 2);
      context.lineTo(left + 2, top + tileSize * 0.75);
      context.lineTo(left + 2, top + tileSize * 0.25);
      context.closePath();
      context.fill();

      context.strokeStyle = "rgba(58, 120, 70, 0.2)";
      context.lineWidth = 2;
      context.stroke();
    }
  }

  const streaks = [
    { x: 38, y: 82, width: 118, angle: -0.52 },
    { x: 218, y: 112, width: 106, angle: -0.6 },
    { x: 412, y: 56, width: 130, angle: -0.42 },
    { x: 456, y: 318, width: 122, angle: -0.58 },
    { x: 88, y: 448, width: 112, angle: -0.38 },
  ];

  streaks.forEach((streak) => {
    context.save();
    context.translate(streak.x, streak.y);
    context.rotate(streak.angle);
    const gradient = context.createLinearGradient(0, 0, streak.width, 0);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(0.5, "rgba(206, 244, 255, 0.78)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, streak.width, 10);
    context.restore();
  });

  drawHoles();
}

function drawHoles() {
  const holes = [
    { x: -0.2, y: 2.1 },
    { x: 15.2, y: 2.1 },
    { x: -0.25, y: 7.1 },
    { x: 15.2, y: 7.1 },
    { x: 3.1, y: 15.15 },
    { x: 10.15, y: -0.15 },
  ];

  holes.forEach((hole) => {
    const px = hole.x * tileSize;
    const py = hole.y * tileSize;
    const gradient = context.createRadialGradient(px, py, 6, px, py, tileSize * 0.45);
    gradient.addColorStop(0, "#102c1a");
    gradient.addColorStop(1, "rgba(12, 28, 18, 0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(px, py, tileSize * 0.42, 0, Math.PI * 2);
    context.fill();
  });
}

function getCenter(position) {
  return {
    x: position.x * tileSize + tileSize / 2,
    y: position.y * tileSize + tileSize / 2,
  };
}

function drawFood() {
  const center = getCenter(food);
  const appleRadius = tileSize * 0.26;
  const gradient = context.createRadialGradient(
    center.x - appleRadius * 0.35,
    center.y - appleRadius * 0.45,
    appleRadius * 0.12,
    center.x,
    center.y,
    appleRadius * 1.25,
  );

  gradient.addColorStop(0, "#ff8a73");
  gradient.addColorStop(0.55, "#f04624");
  gradient.addColorStop(1, "#b41d11");

  context.shadowColor = "rgba(229, 48, 23, 0.42)";
  context.shadowBlur = 24;
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(center.x, center.y, appleRadius, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;

  context.fillStyle = "rgba(255, 255, 255, 0.5)";
  context.beginPath();
  context.ellipse(
    center.x - appleRadius * 0.38,
    center.y - appleRadius * 0.32,
    appleRadius * 0.2,
    appleRadius * 0.14,
    -0.6,
    0,
    Math.PI * 2,
  );
  context.fill();

  context.fillStyle = "rgba(117, 48, 131, 0.18)";
  context.beginPath();
  context.ellipse(
    center.x - appleRadius * 0.1,
    center.y + appleRadius * 0.68,
    appleRadius * 0.38,
    appleRadius * 0.16,
    -0.2,
    0,
    Math.PI * 2,
  );
  context.fill();

  context.strokeStyle = "#6f3519";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(center.x + 2, center.y - appleRadius * 0.72);
  context.lineTo(center.x + appleRadius * 0.14, center.y - appleRadius * 1.2);
  context.stroke();

  context.fillStyle = "#1ea55f";
  context.beginPath();
  context.ellipse(
    center.x + appleRadius * 0.28,
    center.y - appleRadius * 0.92,
    appleRadius * 0.24,
    appleRadius * 0.12,
    -0.45,
    0,
    Math.PI * 2,
  );
  context.fill();
}

function drawEnemySnakes() {
  enemySnakes.forEach((enemy) => {
    drawSnakeBody(enemy.segments, enemy.colors, true);
  });
}

function drawSnakeBody(segments, colors, isEnemy = false) {
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
  const width = tileSize * 0.64;
  const highlightWidth = tileSize * 0.14;

  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = isEnemy ? "rgba(0, 0, 0, 0.08)" : "rgba(48, 113, 255, 0.42)";
  context.shadowBlur = isEnemy ? 4 : 26;

  context.strokeStyle = colors.body;
  context.lineWidth = width;
  context.beginPath();
  context.moveTo(points[points.length - 1].x, points[points.length - 1].y);
  for (let index = points.length - 2; index >= 0; index -= 1) {
    context.lineTo(points[index].x, points[index].y);
  }
  context.stroke();

  context.shadowBlur = 0;
  context.strokeStyle = colors.highlight;
  context.lineWidth = highlightWidth;
  context.beginPath();
  context.moveTo(points[points.length - 1].x - 5, points[points.length - 1].y - 5);
  for (let index = points.length - 2; index >= 0; index -= 1) {
    context.lineTo(points[index].x - 5, points[index].y - 5);
  }
  context.stroke();

  for (let index = visibleSegments.length - 1; index > 0; index -= 1) {
    const center = points[index];
    context.fillStyle = colors.bodyShadow;
    context.beginPath();
    context.arc(center.x, center.y, width * 0.48, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = colors.highlight;
    context.beginPath();
    context.arc(center.x - 6, center.y - 6, width * 0.12, 0, Math.PI * 2);
    context.fill();
  }

  drawSnakeHead(visibleSegments, colors, isEnemy);
}

function drawSnake() {
  drawSnakeBody(
    snake,
    {
      body: "#3a63ff",
      bodyShadow: "rgba(42, 76, 221, 0.98)",
      highlight: "rgba(205, 236, 255, 0.86)",
      eye: "#070d1d",
      tongue: "#d64a24",
    },
    false,
  );
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

function drawSnakeHead(segments, colors, isEnemy = false) {
  const head = getCenter(segments[0]);
  const vector = isEnemy ? getHeadDirection(segments) : direction;
  const angle = Math.atan2(vector.y, vector.x);
  const radius = tileSize * 0.48;
  const headGradient = context.createRadialGradient(
    head.x - radius * 0.28,
    head.y - radius * 0.28,
    radius * 0.18,
    head.x,
    head.y,
    radius,
  );
  const headHighlight = isEnemy
    ? colors.highlight.replace("0.18", "0.34").replace("0.16", "0.3").replace("0.15", "0.28")
    : "rgba(225, 244, 255, 0.98)";
  headGradient.addColorStop(0, headHighlight);
  headGradient.addColorStop(1, colors.body);
  context.fillStyle = headGradient;
  context.beginPath();
  context.arc(head.x, head.y, radius, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = isEnemy ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.26)";
  context.beginPath();
  context.arc(head.x - radius * 0.24, head.y - radius * 0.28, radius * 0.16, 0, Math.PI * 2);
  context.fill();

  const sideOffsetX = Math.cos(angle + Math.PI / 2) * radius * 0.28;
  const sideOffsetY = Math.sin(angle + Math.PI / 2) * radius * 0.28;
  const forwardX = Math.cos(angle) * radius * 0.16;
  const forwardY = Math.sin(angle) * radius * 0.16;

  [
    { x: head.x + sideOffsetX - forwardX, y: head.y + sideOffsetY - forwardY },
    { x: head.x - sideOffsetX - forwardX, y: head.y - sideOffsetY - forwardY },
  ].forEach((eye) => {
    context.fillStyle = "#fffef9";
    context.beginPath();
    context.ellipse(
      eye.x,
      eye.y,
      radius * (isEnemy ? 0.18 : 0.22),
      radius * (isEnemy ? 0.24 : 0.3),
      angle,
      0,
      Math.PI * 2,
    );
    context.fill();

    context.fillStyle = colors.eye;
    context.beginPath();
    context.ellipse(
      eye.x + Math.cos(angle) * 5,
      eye.y + Math.sin(angle) * 5,
      radius * (isEnemy ? 0.09 : 0.11),
      radius * (isEnemy ? 0.13 : 0.16),
      angle,
      0,
      Math.PI * 2,
    );
    context.fill();

    context.fillStyle = "rgba(255, 255, 255, 0.86)";
    context.beginPath();
    context.arc(
      eye.x + Math.cos(angle) * 8 - 1,
      eye.y + Math.sin(angle) * 8 - 4,
      radius * 0.04,
      0,
      Math.PI * 2,
    );
    context.fill();
  });

  context.strokeStyle = colors.tongue;
  context.lineWidth = isEnemy ? 3 : 4;
  context.beginPath();
  context.moveTo(
    head.x + Math.cos(angle) * radius * 0.72,
    head.y + Math.sin(angle) * radius * 0.72,
  );
  context.lineTo(
    head.x + Math.cos(angle) * radius * 1.05,
    head.y + Math.sin(angle) * radius * 1.05,
  );
  context.lineTo(
    head.x + Math.cos(angle + 0.22) * radius * 1.2,
    head.y + Math.sin(angle + 0.22) * radius * 1.2,
  );
  context.moveTo(
    head.x + Math.cos(angle) * radius * 1.05,
    head.y + Math.sin(angle) * radius * 1.05,
  );
  context.lineTo(
    head.x + Math.cos(angle - 0.22) * radius * 1.2,
    head.y + Math.sin(angle - 0.22) * radius * 1.2,
  );
  context.stroke();
}

function draw() {
  drawBackground();
  drawEnemySnakes();
  drawFood();
  drawSnake();
}

function endGame() {
  gameOver = true;
  clearTimeout(loopId);

  if (score > bestScore) {
    setBestScore(score);
  }

  updateHud();
  showOverlay(
    "Konec hry",
    "Cizí had tě zastavil. Klikni na Restart nebo stiskni šipku pro novou hru.",
    "Hrát znovu",
  );
}

function tick() {
  if (gameOver || !gameStarted) {
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
    applesEaten += 1;
    placeFood();
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
  draw();
  loopId = window.setTimeout(tick, gameSpeed);
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

function setDirection(newDirection) {
  const reversingHorizontally = newDirection.x !== 0 && newDirection.x === -direction.x;
  const reversingVertically = newDirection.y !== 0 && newDirection.y === -direction.y;

  if (gameStarted && (reversingHorizontally || reversingVertically)) {
    return;
  }

  if (gameOver) {
    resetGame();
  }

  nextDirection = newDirection;

  if (!gameStarted) {
    gameStarted = true;
    hideOverlay();
    tick();
  }
}

function handleKeydown(event) {
  const directions = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    w: { x: 0, y: -1 },
    s: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    d: { x: 1, y: 0 },
  };

  const newDirection = directions[event.key];

  if (!newDirection) {
    return;
  }

  event.preventDefault();
  setDirection(newDirection);
}

function handleOverlayButton() {
  if (gameOver) {
    resetGame();
    return;
  }

  hideOverlay();
  gameStarted = true;
  tick();
}

document.addEventListener("keydown", handleKeydown);
restartButton.addEventListener("click", resetGame);
overlayButton.addEventListener("click", handleOverlayButton);

bestScore = getStoredBestScore();
resetGame();
