import { MinHeap } from "./minHeap";

// PathNode: the TypeScript shape of a single grid cell, as used by the
// pathfinding algorithms (Dijkstra, A*, BFS). This mirrors the fields
// the original Node.js had (column, row, isWall, etc.) but adds the
// extra fields A* needs (gScore/hScore) and types everything properly.

export interface PathNode {
  col: number;
  row: number;

  isWall: boolean;
  isVisited: boolean;

  // Cost to enter this cell. 1 for a normal open cell; can be raised
  // for "weighted terrain" later (e.g. mud = 5).
  weight: number;

  // Dijkstra uses `distance` as the running "best known cost from start".
  distance: number;

  // A* keeps g/h/f separate from `distance` (see astar.ts when you write it).
  gScore: number;
  hScore: number;
  fScore: number;

  previousNode: PathNode | null;

  neighbours: PathNode[];
}

// Result returned by every algorithm, so the UI layer can treat
// Dijkstra/A*/BFS interchangeably when displaying analysis.
export interface PathResult {
  visitedNodesInOrder: PathNode[];
  path: PathNode[];       // empty if no path was found
  pathFound: boolean;
  totalCost: number;      // sum of weights along the path (0 if no path)
}

// Reconstructs the path by walking backwards from the finish node
// through `previousNode` links, then reversing it into start->finish order.
function buildPath(finishNode: PathNode): PathNode[] {
  const path: PathNode[] = [];
  let current: PathNode | null = finishNode;
  while (current !== null) {
    path.unshift(current);
    current = current.previousNode;
  }
  return path;
}

function totalPathCost(path: PathNode[]): number {
  // The start node itself costs nothing to "enter" (you're already there),
  // so we sum the weight of every node AFTER the first one.
  let cost = 0;
  for (let i = 1; i < path.length; i++) {
    cost += path[i].weight;
  }
  return cost;
}

export function dijkstra(start: PathNode, finish: PathNode): PathResult {
  const visitedNodesInOrder: PathNode[] = [];

  // Step 1: start node's distance is 0 - it costs nothing to reach itself.
  start.distance = 0;

  // Step 2: the heap holds "candidates to look at next", ordered by
  // current best-known distance. We seed it with just the start node.
  const heap = new MinHeap<PathNode>();
  heap.insert(start, start.distance);

  while (!heap.isEmpty()) {
    // Step 3a: pull out whichever candidate currently has the smallest
    // known distance. This is the node we commit to processing now.
    const current = heap.extractMin();
    if (current === undefined) break; // heap was empty, nothing to do

    // Step 3b: lazy deletion - this node might be sitting in the heap
    // multiple times (we push a new entry every time we find a better
    // distance, without removing the old stale entry). If we already
    // finalized this node earlier, this pop is just a stale leftover -
    // skip it and move to the next heap entry.
    if (current.isVisited) continue;

    // Step 3c: officially finalize this node - we now know its
    // shortest distance from start is correct and will never improve.
    current.isVisited = true;
    visitedNodesInOrder.push(current);

    // Step 3d: if we just finalized the finish node, we're done - the
    // shortest path has been found.
    if (current === finish) {
      return {
        visitedNodesInOrder,
        path: buildPath(finish),
        pathFound: true,
        totalCost: totalPathCost(buildPath(finish)),
      };
    }

    // Step 3e: look at every neighbor and see if we can offer it a
    // better (smaller) distance via the current node.
    for (const neighbour of current.neighbours) {
      if (neighbour.isWall || neighbour.isVisited) continue;

      const candidateDistance = current.distance + neighbour.weight;

      if (candidateDistance < neighbour.distance) {
        neighbour.distance = candidateDistance;
        neighbour.previousNode = current;
        // push the improved candidate - the OLD entry for this
        // neighbour (if any) is left stale in the heap and will be
        // ignored later via the isVisited check above.
        heap.insert(neighbour, neighbour.distance);
      }
    }
  }

  // Step 4: heap emptied out and we never finalized the finish node -
  // no path exists between start and finish.
  return {
    visitedNodesInOrder,
    path: [],
    pathFound: false,
    totalCost: 0,
  };
}