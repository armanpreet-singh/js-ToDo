export const MAX_TASK_LENGTH = 200;

const isValidTask = (task) =>
  task &&
  typeof task === "object" &&
  !Array.isArray(task) &&
  Number.isSafeInteger(task.id) &&
  typeof task.text === "string" &&
  typeof task.completed === "boolean";

const nextId = (id) => (id === Number.MAX_SAFE_INTEGER ? 0 : id + 1);

const findAvailableId = (usedIds, startAt) => {
  let candidate = startAt;

  while (usedIds.has(candidate)) {
    candidate = nextId(candidate);
  }

  return candidate;
};

export function generateTaskId(existingTasks, now = Date.now()) {
  const usedIds = new Set(existingTasks.map((task) => task.id));
  const startAt = Number.isSafeInteger(now) ? now : Date.now();

  return findAvailableId(usedIds, startAt);
}

export function normalizeTasks(value, now = Date.now()) {
  if (!Array.isArray(value)) return [];

  const validTasks = value.filter(isValidTask);
  const reservedIds = new Set(validTasks.map((task) => task.id));
  const seenIds = new Set();
  const normalizedTasks = [];
  let candidate = Number.isSafeInteger(now) ? now : Date.now();

  for (const task of validTasks) {
    let id = task.id;

    if (seenIds.has(id)) {
      id = findAvailableId(reservedIds, candidate);
      reservedIds.add(id);
      candidate = nextId(id);
    }

    seenIds.add(id);
    normalizedTasks.push({
      id,
      text: task.text.slice(0, MAX_TASK_LENGTH),
      completed: task.completed,
    });
  }

  return normalizedTasks;
}
