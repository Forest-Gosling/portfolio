let snakeGame = {
  animationId: null,
};

function startSnakeGame() {
  const canvas = document.getElementById("snake-canvas");
  const ctx = canvas?.getContext("2d");
  const scoreDisplay = document.getElementById("score");

  if (!canvas || !ctx || !scoreDisplay) {
    console.error("Snake game failed to initialize. Missing DOM elements.");
    return;
  }

  const gridSize = 20;
  const maxCols = canvas.width / gridSize;
  const maxRows = canvas.height / gridSize;

  let snake = [{ x: 5, y: 5 }];
  let dx = 1, dy = 0;
  let food = { x: 10, y: 10 };
  let score = 0;
  let running = true;
  let delay = 400;
  let lastTime = 0;

  const soundBoot = document.getElementById("snake-boot");
  const soundEat = document.getElementById("snake-eat");
  const soundMove = document.getElementById("snake-move");
  const soundDeath = document.getElementById("snake-death");

  function updateScore() {
    scoreDisplay.textContent = `Score: ${score}`;
  }

  function bootScreen() {
    ctx.fillStyle = "#7ac143";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#333";
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Nintendo", canvas.width / 2, canvas.height / 2 - 20);

    soundBoot?.play();

    setTimeout(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#7ac143";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.font = "20px monospace";
      ctx.fillText("Snake v1", canvas.width / 2, canvas.height / 2 - 10);

      setTimeout(() => {
        draw();
        updateScore();
        requestAnimationFrame(loop);
      }, 700);
    }, 1000);
  }

  function draw() {
    ctx.fillStyle = "#7ac143";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "black";
    snake.forEach((part) => {
      ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize);
    });

    ctx.fillStyle = "red";
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
  }

  function move() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    const collision =
      head.x < 0 || head.y < 0 ||
      head.x >= maxCols || head.y >= maxRows ||
      snake.some((p) => p.x === head.x && p.y === head.y);

    if (collision) {
      running = false;
      soundDeath?.play();
      return closeGameboyModal();
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      food = {
        x: Math.floor(Math.random() * maxCols),
        y: Math.floor(Math.random() * maxRows),
      };
      score += 10;
      updateScore();
      delay = Math.max(60, delay - 20);
      soundEat?.play();
    } else {
      snake.pop();
    }
  }

  function loop(timestamp) {
    if (!running) return;
    if (timestamp - lastTime > delay) {
      move();
      draw();
      lastTime = timestamp;
    }
    snakeGame.animationId = requestAnimationFrame(loop);
  }

  function setDirection(newDx, newDy) {
    if (newDx !== -dx && newDy !== -dy) {
      dx = newDx;
      dy = newDy;
      soundMove?.play();
    }
  }

  document.onkeydown = (e) => {
    switch (e.key) {
      case "ArrowUp": setDirection(0, -1); break;
      case "ArrowDown": setDirection(0, 1); break;
      case "ArrowLeft": setDirection(-1, 0); break;
      case "ArrowRight": setDirection(1, 0); break;
    }
  };

  document.querySelectorAll(".d-btn").forEach(btn => {
    btn.onclick = () => {
      const dir = btn.dataset.dir;
      if (dir === "up") setDirection(0, -1);
      if (dir === "down") setDirection(0, 1);
      if (dir === "left") setDirection(-1, 0);
      if (dir === "right") setDirection(1, 0);
    };
  });

  bootScreen();
}

function closeGameboyModal() {
  document.getElementById("gameboy-modal").style.display = "none";
  cancelAnimationFrame(snakeGame.animationId);
  document.onkeydown = null;
}
