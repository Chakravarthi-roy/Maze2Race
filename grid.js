// Grid: owns the canvas, the logical wall data, and rendering.
// Cell coordinates are always { col, row } in logical board space.
// Pixel coordinates are derived from cellSize, which is computed to
// make the logical grid fill the available canvas exactly, with no
// leftover scrollable margin.

class Grid {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.cols = BOARD_COLS;
    this.rows = BOARD_ROWS;
    this.cellSize = 0;

    this.walls = null;          // 2D array, 1 = wall, 0 = open
    this.showGridLines = true;

    this.start = { col: 0, row: 0 };
    this.end = { col: 0, row: 0 };

    this.dragging = null;       // "start" | "end" | null

    // Last run's result, set by main.js after calling an algorithm.
    // { visitedNodesInOrder: [{col,row}], path: [{col,row}], pathFound, totalCost }
    // Coordinates only - the Grid doesn't need to know algorithm internals.
    this.result = null;
  }

  loadBoard(boardKey) {
    const board = BOARDS[boardKey]();
    this.walls = board.grid;
    this.start = { ...board.start };
    this.end = { ...board.end };
    this.showGridLines = board.showGridLines;
    this.result = null;
    this.resize();
  }

  clearResult() {
    this.result = null;
    this.draw();
  }

  // Builds a fresh PathNode[][] grid (matching the shape algo-bundle.js
  // expects) from this Grid's current wall layout. A fresh grid is built
  // every run so previous isVisited/distance values never leak between runs.
  toPathNodeGrid() {
    const grid = [];
    for (let row = 0; row < this.rows; row++) {
      const r = [];
      for (let col = 0; col < this.cols; col++) {
        r.push({
          col: col,
          row: row,
          isWall: this.walls[row][col] === 1,
          isVisited: false,
          weight: 1,
          distance: Infinity,
          gScore: Infinity,
          hScore: 0,
          fScore: Infinity,
          previousNode: null,
          neighbours: [],
        });
      }
      grid.push(r);
    }
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const node = grid[row][col];
        if (row > 0) node.neighbours.push(grid[row - 1][col]);
        if (row < this.rows - 1) node.neighbours.push(grid[row + 1][col]);
        if (col > 0) node.neighbours.push(grid[row][col - 1]);
        if (col < this.cols - 1) node.neighbours.push(grid[row][col + 1]);
      }
    }
    return grid;
  }

  isWall(col, row) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return true;
    return this.walls[row][col] === 1;
  }

  isOpen(col, row) {
    return !this.isWall(col, row);
  }

  resize() {
    const wrap = this.canvas.parentElement;
    const availW = wrap.clientWidth;
    const availH = wrap.clientHeight;

    // Pick the largest cell size that fits both dimensions with no
    // overflow, then size the canvas exactly to the used cells —
    // this is what guarantees "fills the screen, never scrolls".
    const sizeByW = Math.floor(availW / this.cols);
    const sizeByH = Math.floor(availH / this.rows);
    this.cellSize = Math.max(4, Math.min(sizeByW, sizeByH));

    this.canvas.width = this.cellSize * this.cols;
    this.canvas.height = this.cellSize * this.rows;

    // center the canvas in the wrap if there's leftover space
    this.canvas.style.marginLeft = Math.floor((availW - this.canvas.width) / 2) + "px";
    this.canvas.style.marginTop = Math.floor((availH - this.canvas.height) / 2) + "px";

    this.draw();
  }

  pixelToCell(px, py) {
    const col = Math.floor(px / this.cellSize);
    const row = Math.floor(py / this.cellSize);
    return { col, row };
  }

  cellCenter(col, row) {
    return {
      x: col * this.cellSize + this.cellSize / 2,
      y: row * this.cellSize + this.cellSize / 2,
    };
  }

  hitTestDot(px, py, col, row) {
    const { x, y } = this.cellCenter(col, row);
    const r = Math.max(this.cellSize * 0.45, 6);
    const dx = px - x;
    const dy = py - y;
    return dx * dx + dy * dy <= r * r;
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    // walls
    ctx.fillStyle = "#000000";
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.walls[row][col] === 1) {
          ctx.fillRect(col * this.cellSize, row * this.cellSize, this.cellSize, this.cellSize);
        }
      }
    }

    // result coloring: explored cells first, then the final path drawn
    // on top of them (a path cell is always also an explored cell, so
    // draw order matters - path color must win).
    if (this.result) {
      ctx.fillStyle = "#b9aef7";
      for (const node of this.result.visitedNodesInOrder) {
        ctx.fillRect(node.col * this.cellSize, node.row * this.cellSize, this.cellSize, this.cellSize);
      }
      ctx.fillStyle = "#f9c64a";
      for (const node of this.result.path) {
        ctx.fillRect(node.col * this.cellSize, node.row * this.cellSize, this.cellSize, this.cellSize);
      }
    }

    // grid lines (board 1 only)
    if (this.showGridLines) {
      ctx.strokeStyle = "#dddddd";
      ctx.lineWidth = 1;
      for (let col = 0; col <= this.cols; col++) {
        ctx.beginPath();
        ctx.moveTo(col * this.cellSize + 0.5, 0);
        ctx.lineTo(col * this.cellSize + 0.5, h);
        ctx.stroke();
      }
      for (let row = 0; row <= this.rows; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * this.cellSize + 0.5);
        ctx.lineTo(w, row * this.cellSize + 0.5);
        ctx.stroke();
      }
    }

    this.drawDot(this.start.col, this.start.row, "#e23b3b");
    this.drawDot(this.end.col, this.end.row, "#2284e6");
  }

  drawDot(col, row, color) {
    const { x, y } = this.cellCenter(col, row);
    const r = Math.max(this.cellSize * 0.32, 5);
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = Math.max(this.cellSize * 0.06, 1);
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
  }
}