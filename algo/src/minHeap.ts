// MinHeap<T>: a binary min-heap backed by a flat array.
//
// Stored as a complete binary tree in array form:
//   parent of index i  -> Math.floor((i - 1) / 2)
//   left child of i    -> 2 * i + 1
//   right child of i   -> 2 * i + 2
//
// Each element is paired with a numeric priority. extractMin() always
// returns the element with the smallest priority.
//
// NOTE on duplicates / stale entries: we are using the "lazy deletion"
// approach discussed earlier. If a node's priority improves after it's
// already in the heap, we'll just push a new (item, betterPriority) pair
// rather than searching for and updating the old one. The algorithm code
// (Dijkstra/A*) will be responsible for ignoring an item if it's pulled
// out of the heap after that item has already been finalized/visited.
// That means this heap does NOT need a decreaseKey() method - just
// insert() and extractMin().

interface HeapEntry<T> {
  item: T;
  priority: number;
}

export class MinHeap<T> {
  private entries: HeapEntry<T>[] = [];

  // How many elements are currently in the heap.
  size(): number {
    // TODO: return the number of entries currently stored.
    return this.entries.length;
  }

  isEmpty(): boolean {
    // TODO: true if there are zero entries.
    return this.size() === 0;
  }

  // --- index helpers -------------------------------------------------
  // These are pure arithmetic, no heap logic - a good warm-up.

  private parentIndex(i: number): number {
    // TODO
    return Math.floor((i - 1) / 2);
  }

  private leftChildIndex(i: number): number {
    // TODO
    return 2*i + 1;
  }

  private rightChildIndex(i: number): number {
    // TODO
    return 2*i + 2;
  }

  // --- core operations -------------------------------------------------

  // Add a new (item, priority) pair to the heap.
  // Steps (from what you described earlier):
  //   1. Push the new entry onto the end of `entries` (this is the
  //      "next open slot, filling left to right" position).
  //   2. Bubble it up: while it has a parent AND its priority is
  //      smaller than its parent's priority, swap with the parent.
  //   3. Stop when it's not smaller than its parent, or it reaches index 0.
  insert(item: T, priority: number): void {
    // TODO
    this.entries.push({ item: item, priority: priority });
    this.bubbleUp(this.entries.length - 1);
  }

  // Remove and return the item with the smallest priority (the root).
  // Steps (from what you described earlier):
  //   1. If the heap is empty, return undefined (nothing to extract).
  //   2. Remember the root entry (index 0) - this is what you'll return.
  //   3. Move the LAST entry in the array into index 0.
  //   4. Remove the now-duplicate last slot (pop it off the end).
  //   5. Bubble the new root down: repeatedly compare with its
  //      children, find the SMALLER of the two children (if both
  //      exist), and swap with that child if it's smaller than the
  //      current node. Stop when neither child is smaller, or there
  //      are no children left.
  //   6. Return the remembered root entry's item.
  extractMin(): T | undefined {
    // TODO
    if(this.isEmpty()) return undefined;
    let root = this.entries[0].item;
    let lastEntry = this.entries.pop()!;

    if (this.entries.length > 0) {
      this.entries[0] = lastEntry;
      this.bubbleDown(0);
    }
    return root;
  }

  // --- small private helpers you may find useful ----------------------

  private swap(i: number, j: number): void {
    // TODO: swap entries[i] and entries[j] in place.
    let temp = this.entries[i];
    this.entries[i] = this.entries[j];
    this.entries[j] = temp;
  }

  // Optional helper if you want to break bubbleUp/bubbleDown into their
  // own named methods rather than writing the loops inline inside
  // insert()/extractMin(). Totally your call how you structure this -
  // these two are just suggestions, delete them if you don't want them.
  private bubbleUp(startIndex: number): void {
    // TODO (optional)
    let ci = startIndex;
    while(ci > 0) {
      let pi = this.parentIndex(ci);
      if(this.entries[pi].priority > this.entries[ci].priority) {
        this.swap(pi, ci);
        ci = pi;
      } else { break; }
    }
  }

  private bubbleDown(startIndex: number): void {
    // TODO (optional)
    let ci = startIndex;
    while (true) {
      let li = this.leftChildIndex(ci);
      let ri = this.rightChildIndex(ci);
      let smallest = ci;

      if (li < this.entries.length && this.entries[li].priority < this.entries[smallest].priority) { smallest = li; }
      if (ri < this.entries.length && this.entries[ri].priority < this.entries[smallest].priority) { smallest = ri; }
      if (smallest === ci) break;

      this.swap(ci, smallest);
      ci = smallest;
    }
  }
}