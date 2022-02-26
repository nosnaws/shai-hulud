export interface Queue<T> {
  contents: () => T[];
  size: () => number;
  enqueue: (item: T) => number;
  dequeue: () => T;
  front: () => T;
}

export const createQueue = <T>(initial: T[] = []): Queue<T> => {
  let queue = [...initial];

  const enqueue = (item: T): number => queue.push(item);

  const dequeue = (): T => {
    const [head, ...rest] = queue;
    queue = rest;
    return head;
  };

  return {
    enqueue,
    dequeue,
    front: () => queue[0],
    contents: () => [...queue],
    size: () => queue.length,
  };
};
