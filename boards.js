// Each board is defined on a fixed logical grid of COLS x ROWS cells.
// 1 = wall, 0 = open.
// The renderer scales this logical grid up to fill whatever the actual
// viewport size turns out to be, so the *shape* of each maze stays
// identical across screen sizes.

const BOARD_COLS = 41;
const BOARD_ROWS = 25;

function emptyGrid(cols, rows, fill) {
  return Array.from({ length: rows }, () => Array(cols).fill(fill));
}

// Simple seeded PRNG so the generated maze is identical every load
// (no surprises between refreshes while we're testing it).
function makeRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---------------------------------------------------------------------
// Board 1: Open field — completely empty, no walls at all. This is the
// "freeform" board: the grid itself is the canvas, and walls (if any)
// get drawn in later by hand during freeform/draw mode. Gray grid
// lines are shown so individual cells are visible for drawing on.
// ---------------------------------------------------------------------
function buildOpenBoard() {
  const g = emptyGrid(BOARD_COLS, BOARD_ROWS, 0);
  return {
    grid: g,
    start: { col: 2, row: 12 },
    end: { col: BOARD_COLS - 3, row: 12 },
    showGridLines: true,
  };
}

// ---------------------------------------------------------------------
// Board 2: True maze — generated with a recursive-backtracker carve on
// a half-resolution cell lattice (so every corridor and wall is 2
// logical cells wide and reads cleanly at any screen size), which
// guarantees a single connected path between any two open cells with
// no isolated pockets. A few extra walls are knocked down afterward to
// create loops/alternate routes, which is what makes Dijkstra/A*/BFS/DFS
// visibly diverge instead of all being forced down one identical hallway.
// ---------------------------------------------------------------------
function buildMazeBoard() {
  const cellCols = Math.floor((BOARD_COLS - 1) / 2); // lattice of "rooms"
  const cellRows = Math.floor((BOARD_ROWS - 1) / 2);

  // start fully walled
  const g = emptyGrid(BOARD_COLS, BOARD_ROWS, 1);

  const rng = makeRng(20240613);
  const visited = Array.from({ length: cellRows }, () => Array(cellCols).fill(false));

  function carveAt(cr, cc) {
    g[cr * 2 + 1][cc * 2 + 1] = 0;
  }

  function knockWall(cr, cc, dr, dc) {
    const r1 = cr * 2 + 1, c1 = cc * 2 + 1;
    g[r1 + dr][c1 + dc] = 0;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function carvePassagesFrom(cr, cc) {
    visited[cr][cc] = true;
    carveAt(cr, cc);
    const dirs = shuffle([
      [-1, 0, -1, 0],
      [1, 0, 1, 0],
      [0, -1, 0, -1],
      [0, 1, 0, 1],
    ]);
    for (const [dCr, dCc, dr, dc] of dirs) {
      const nr = cr + dCr, nc = cc + dCc;
      if (nr < 0 || nr >= cellRows || nc < 0 || nc >= cellCols) continue;
      if (visited[nr][nc]) continue;
      knockWall(cr, cc, dr, dc);
      carvePassagesFrom(nr, nc);
    }
  }

  carvePassagesFrom(0, 0);

  // Knock down a handful of extra interior walls to create loops and
  // alternate routes — a pure spanning-tree maze has exactly one path
  // between any two points, which makes every algorithm trace the same
  // line. Loops let shortest-path algorithms actually pick a route.
  let extraOpenings = 26;
  let attempts = 0;
  while (extraOpenings > 0 && attempts < 4000) {
    attempts++;
    const r = 1 + Math.floor(rng() * (BOARD_ROWS - 2));
    const c = 1 + Math.floor(rng() * (BOARD_COLS - 2));
    if (g[r][c] !== 1) continue;
    // only knock walls that sit strictly between two open cells
    // horizontally or vertically (true connectors, not corners)
    const horizOpen = g[r][c - 1] === 0 && g[r][c + 1] === 0;
    const vertOpen = g[r - 1][c] === 0 && g[r + 1][c] === 0;
    if (horizOpen || vertOpen) {
      g[r][c] = 0;
      extraOpenings--;
    }
  }

  return {
    grid: g,
    start: { col: 1, row: 1 },
    end: { col: BOARD_COLS - 2, row: BOARD_ROWS - 2 },
    showGridLines: false,
  };
}

// ---------------------------------------------------------------------
// Board 3: Unreachable — a solid wall fully divides the board into two
// sealed halves. Start sits in the left half, end in the right half.
// Used to test correct "no path exists" termination.
// ---------------------------------------------------------------------
function buildUnreachableBoard() {
  const g = emptyGrid(BOARD_COLS, BOARD_ROWS, 0);
  const dividerCol = Math.floor(BOARD_COLS / 2);
  for (let r = 0; r < BOARD_ROWS; r++) {
    g[r][dividerCol] = 1;
  }
  // a few harmless decorative walls on each side so it isn't
  // a totally trivial empty-room search
  const segments = [
    [4, 4, 4, 10],
    [8, 14, 8, 20],
    [dividerCol + 4, 3, dividerCol + 4, 9],
    [dividerCol + 10, 12, dividerCol + 10, 19],
  ];
  for (const [c1, r1, c2, r2] of segments) {
    for (let r = r1; r <= r2; r++) g[r][c1] = 1;
  }
  return {
    grid: g,
    start: { col: 3, row: 12 },
    end: { col: BOARD_COLS - 4, row: 12 },
    showGridLines: true,
  };
}

const BOARDS = {
  open: buildOpenBoard,
  maze: buildMazeBoard,
  unreachable: buildUnreachableBoard,
};