"use strict";
var Algo = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/dijkstra.ts
  var dijkstra_exports = {};
  __export(dijkstra_exports, {
    dijkstra: () => dijkstra
  });

  // src/minHeap.ts
  var MinHeap = class {
    constructor() {
      this.entries = [];
    }
    size() {
      return this.entries.length;
    }
    isEmpty() {
      return this.size() === 0;
    }
    parentIndex(i) {
      return Math.floor((i - 1) / 2);
    }
    leftChildIndex(i) {
      return 2 * i + 1;
    }
    rightChildIndex(i) {
      return 2 * i + 2;
    }
    insert(item, priority) {
      this.entries.push({ item, priority });
      this.bubbleUp(this.entries.length - 1);
    }
    extractMin() {
      if (this.isEmpty()) return void 0;
      let root = this.entries[0].item;
      let lastEntry = this.entries.pop();
      if (this.entries.length > 0) {
        this.entries[0] = lastEntry;
        this.bubbleDown(0);
      }
      return root;
    }
    swap(i, j) {
      let temp = this.entries[i];
      this.entries[i] = this.entries[j];
      this.entries[j] = temp;
    }
    bubbleUp(startIndex) {
      let ci = startIndex;
      while (ci > 0) {
        let pi = this.parentIndex(ci);
        if (this.entries[pi].priority > this.entries[ci].priority) {
          this.swap(pi, ci);
          ci = pi;
        } else {
          break;
        }
      }
    }
    bubbleDown(startIndex) {
      let ci = startIndex;
      while (true) {
        let li = this.leftChildIndex(ci);
        let ri = this.rightChildIndex(ci);
        let smallest = ci;
        if (li < this.entries.length && this.entries[li].priority < this.entries[smallest].priority) {
          smallest = li;
        }
        if (ri < this.entries.length && this.entries[ri].priority < this.entries[smallest].priority) {
          smallest = ri;
        }
        if (smallest === ci) break;
        this.swap(ci, smallest);
        ci = smallest;
      }
    }
  };

  // src/dijkstra.ts
  function buildPath(finishNode) {
    const path = [];
    let current = finishNode;
    while (current !== null) {
      path.unshift(current);
      current = current.previousNode;
    }
    return path;
  }
  function totalPathCost(path) {
    let cost = 0;
    for (let i = 1; i < path.length; i++) {
      cost += path[i].weight;
    }
    return cost;
  }
  function dijkstra(start, finish) {
    const visitedNodesInOrder = [];
    start.distance = 0;
    const heap = new MinHeap();
    heap.insert(start, start.distance);
    while (!heap.isEmpty()) {
      const current = heap.extractMin();
      if (current === void 0) break;
      if (current.isVisited) continue;
      current.isVisited = true;
      visitedNodesInOrder.push(current);
      if (current === finish) {
        return {
          visitedNodesInOrder,
          path: buildPath(finish),
          pathFound: true,
          totalCost: totalPathCost(buildPath(finish))
        };
      }
      for (const neighbour of current.neighbours) {
        if (neighbour.isWall || neighbour.isVisited) continue;
        const candidateDistance = current.distance + neighbour.weight;
        if (candidateDistance < neighbour.distance) {
          neighbour.distance = candidateDistance;
          neighbour.previousNode = current;
          heap.insert(neighbour, neighbour.distance);
        }
      }
    }
    return {
      visitedNodesInOrder,
      path: [],
      pathFound: false,
      totalCost: 0
    };
  }
  return __toCommonJS(dijkstra_exports);
})();