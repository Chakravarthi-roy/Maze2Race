const canvas = document.getElementById("canvas");
const boardPicker = document.getElementById("boardPicker");
const algoPicker = document.getElementById("algoPicker");
const runBtn = document.getElementById("runBtn");
const resetBtn = document.getElementById("resetBtn");

const resultsPanel = document.getElementById("results");
const collapseBtn = document.getElementById("collapseBtn");
const resultsHeadline = document.getElementById("results-headline");

const statPathNodes = document.getElementById("statPathNodes");
const statExtraNodes = document.getElementById("statExtraNodes");
const statCost = document.getElementById("statCost");
const statTime = document.getElementById("statTime");

const grid = new Grid(canvas);
grid.loadBoard(boardPicker.value);

function clearStats() {
  resultsHeadline.textContent = "Path found";
  resultsHeadline.classList.remove("no-path");
  statPathNodes.textContent = "—";
  statExtraNodes.textContent = "—";
  statCost.textContent = "—";
  statTime.textContent = "—";
}

function openResults() {
  resultsPanel.classList.add("open");
}

function closeResults() {
  resultsPanel.classList.remove("open");
}

collapseBtn.addEventListener("click", closeResults);

// --- board / algorithm pickers -----------------------------------------

boardPicker.addEventListener("change", () => {
  grid.loadBoard(boardPicker.value);
  clearStats();
  closeResults();
});

algoPicker.addEventListener("change", () => {
  grid.clearResult();
  clearStats();
  closeResults();
});

window.addEventListener("resize", () => grid.resize());

// --- reset / run ---------------------------------------------------------

resetBtn.addEventListener("click", () => {
  grid.clearResult();
  clearStats();
  closeResults();
});

runBtn.addEventListener("click", () => {
  const pathNodeGrid = grid.toPathNodeGrid();
  const startNode = pathNodeGrid[grid.start.row][grid.start.col];
  const finishNode = pathNodeGrid[grid.end.row][grid.end.col];

  const algoKey = algoPicker.value;
  const algoFn = Algo[algoKey];
  if (!algoFn) {
    clearStats();
    resultsHeadline.textContent = `"${algoKey}" not implemented yet`;
    resultsHeadline.classList.add("no-path");
    openResults();
    return;
  }

  const t0 = performance.now();
  const result = algoFn(startNode, finishNode);
  const elapsedMs = performance.now() - t0;

  grid.result = result;
  grid.draw();

  resultsHeadline.textContent = result.pathFound ? "Path found" : "Path not found";
  resultsHeadline.classList.toggle("no-path", !result.pathFound);

  const pathNodes = result.path.length;
  const exploredTotal = result.visitedNodesInOrder.length;
  const extraNodes = Math.max(0, exploredTotal - pathNodes);

  statPathNodes.textContent = result.pathFound ? pathNodes : "—";
  statExtraNodes.textContent = extraNodes;
  statCost.textContent = result.pathFound ? result.totalCost : "—";
  statTime.textContent = elapsedMs.toFixed(2) + " ms";

  openResults();
});

// --- dragging the start (red) / end (blue) dots -------------------------

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener("mousedown", (e) => {
  const { x, y } = getMousePos(e);
  if (grid.hitTestDot(x, y, grid.start.col, grid.start.row)) {
    grid.dragging = "start";
  } else if (grid.hitTestDot(x, y, grid.end.col, grid.end.row)) {
    grid.dragging = "end";
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!grid.dragging) return;
  const { x, y } = getMousePos(e);
  const { col, row } = grid.pixelToCell(x, y);
  if (col < 0 || col >= grid.cols || row < 0 || row >= grid.rows) return;
  if (grid.isWall(col, row)) return;

  const other = grid.dragging === "start" ? grid.end : grid.start;
  if (col === other.col && row === other.row) return;

  const moved = grid[grid.dragging].col !== col || grid[grid.dragging].row !== row;
  grid[grid.dragging] = { col, row };

  // auto-clear the previous run's colors and hide results the moment
  // start/end actually moves to a new cell
  if (moved && grid.result) {
    grid.result = null;
    clearStats();
    closeResults();
  }

  grid.draw();
});

window.addEventListener("mouseup", () => {
  grid.dragging = null;
});

canvas.addEventListener("mouseleave", () => {
  canvas.style.cursor = "default";
});

canvas.addEventListener("mousemove", (e) => {
  if (grid.dragging) {
    canvas.style.cursor = "grabbing";
    return;
  }
  const { x, y } = getMousePos(e);
  const onDot =
    grid.hitTestDot(x, y, grid.start.col, grid.start.row) ||
    grid.hitTestDot(x, y, grid.end.col, grid.end.row);
  canvas.style.cursor = onDot ? "grab" : "default";
});