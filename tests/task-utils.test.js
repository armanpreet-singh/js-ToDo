import assert from "node:assert/strict";
import test from "node:test";

import {
  generateTaskId,
  MAX_TASK_LENGTH,
  normalizeTasks,
} from "../task-utils.js";

test("generateTaskId avoids timestamp collisions and consecutive used IDs", () => {
  const existingTasks = [{ id: 500 }, { id: 501 }, { id: 900 }];

  assert.equal(generateTaskId(existingTasks, 500), 502);
  assert.equal(generateTaskId([], 500), 500);
});

test("normalizeTasks repairs duplicate IDs without changing other valid IDs", () => {
  const tasks = normalizeTasks(
    [
      { id: 7, text: "first", completed: false },
      { id: 7, text: "duplicate", completed: true },
      { id: 100, text: "later valid ID", completed: false },
      { id: "invalid", text: "ignored", completed: false },
      null,
    ],
    100
  );

  assert.deepEqual(
    tasks.map(({ id }) => id),
    [7, 101, 100]
  );
  assert.equal(new Set(tasks.map(({ id }) => id)).size, tasks.length);
});

test("normalizeTasks caps text to the same limit used by the input and editor", () => {
  const longText = "x".repeat(MAX_TASK_LENGTH + 25);
  const [task] = normalizeTasks(
    [{ id: 1, text: longText, completed: false }],
    100
  );

  assert.equal(task.text.length, MAX_TASK_LENGTH);
});

test("normalizeTasks rejects non-array and malformed saved data", () => {
  assert.deepEqual(normalizeTasks({ id: 1 }), []);
  assert.deepEqual(normalizeTasks([{ id: 1, text: 3, completed: false }]), []);
});
