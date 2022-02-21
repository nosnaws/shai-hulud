import { createQueue } from "../../src/utils/queue";

describe("utils/queue", () => {
  describe("createQueue", () => {
    it("has enqueue function", () => {
      const q = createQueue();
      expect(q).toHaveProperty("enqueue");
    });

    it("has dequeue function", () => {
      const q = createQueue();
      expect(q).toHaveProperty("dequeue");
    });

    it("has contents", () => {
      const q = createQueue();
      expect(q).toHaveProperty("contents");
    });

    it("has size", () => {
      const q = createQueue();
      expect(q).toHaveProperty("size");
    });

    it("initializes with default values", () => {
      const q = createQueue();
      expect(q.size()).toBe(0);
    });

    it("initializes with values", () => {
      const q = createQueue([1]);
      expect(q.size()).toBe(1);
      expect(q.contents()).toEqual([1]);
    });
    it("mutating array returned by contents() should not mutate the queue", () => {
      const q = createQueue([1, 2]);
      let contents = q.contents();
      contents[1] = 0;
      expect(q.contents()).toEqual([1, 2]);
    });
  });

  describe("enqueue", () => {
    it("adds item to queue", () => {
      const q = createQueue([1, 2]);
      q.enqueue(3);
      expect(q.size()).toBe(3);
    });

    it("adds item to back of queue", () => {
      const q = createQueue([1, 2]);
      q.enqueue(3);
      expect(q.contents()[2]).toBe(3);
    });

    it("adds item to empty queue", () => {
      const q = createQueue();
      q.enqueue(3);
      expect(q.contents()[0]).toBe(3);
    });
  });
  describe("dequeue", () => {
    it("returns undefined for empty queue", () => {
      const q = createQueue();
      expect(q.dequeue()).toBeUndefined();
    });

    it("returns first item in queue", () => {
      const q = createQueue([1, 2]);
      expect(q.dequeue()).toBe(1);
    });

    it("removes item from queue", () => {
      const q = createQueue([1, 2]);
      q.dequeue();
      expect(q.size()).toBe(1);
      expect(q.contents()).toEqual([2]);
    });
  });
});
