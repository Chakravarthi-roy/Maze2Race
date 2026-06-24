const canvas = document.getElementById("canvas");
const boardPicker = document.getElementById("boardPicker");
const statusEl = document.getElementById("status");

const grid = new Grid(canvas);
grid.loadBoard(boardPicker.value);

function setStatus(msg) {
  statusEl.textContent = msg;
}

boardPicker.addEventListener("change", () => {
  grid.loadBoard(boardPicker.value);
  setStatus("drag the red or blue dot");
});

window.addEventListener("resize", () => grid.resize());

// --- dragging the start (red) / end (blue) dots ---

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

  grid[grid.dragging] = { col, row };
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