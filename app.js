const STORAGE_KEY = "tasks";

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentFilter = "all";

const elements = {
  taskInput: document.getElementById("task-input"),
  addBtn: document.getElementById("add-btn"),
  taskList: document.getElementById("task-list"),
  taskCount: document.getElementById("task-count"),
  footerStats: document.getElementById("footer-stats"),
  clearCompletedBtn: document.getElementById("clear-completed-btn"),
  filterButtons: document.querySelectorAll(".filter-btn"),
};

const saveTasks = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

const updateState = () => {
  saveTasks();
  render();
};

const generateId = () => Date.now();

const findTask = (id) => tasks.find((task) => task.id === id);

function getFilteredTasks() {
  switch (currentFilter) {
    case "active":
      return tasks.filter((task) => !task.completed);
    case "completed":
      return tasks.filter((task) => task.completed);
    default:
      return tasks;
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function addTask() {
  const text = elements.taskInput.value.trim();
  if (!text) {
    elements.taskInput.focus();
    return;
  }

  tasks.push({ id: generateId(), text, completed: false });

  elements.taskInput.value = "";
  elements.taskInput.focus();
  updateState();
}

function deleteTask(id) {
  const li = elements.taskList.querySelector(`[data-id="${id}"]`);

  const removeTask = () => {
    tasks = tasks.filter((task) => task.id !== id);
    updateState();
  };

  if (!li) {
    removeTask();
    return;
  }

  li.classList.add("removing");
  setTimeout(removeTask, 220);
}

function toggleTask(id) {
  const task = findTask(id);
  if (!task) return;

  task.completed = !task.completed;
  updateState();
}

function saveEdit(id, newText) {
  const trimmed = newText.trim();

  if (!trimmed) {
    deleteTask(id);
    return;
  }

  const task = findTask(id);
  if (!task) return;

  task.text = trimmed;
  updateState();
}

function clearCompleted() {
  tasks = tasks.filter((task) => !task.completed);
  updateState();
}

function startEditing(li, task) {
  const span = li.querySelector(".task-text");
  const editBtn = li.querySelector(".edit-btn");

  span.contentEditable = "true";
  span.classList.add("editing");

  const range = document.createRange();
  const selection = window.getSelection();

  range.selectNodeContents(span);
  range.collapse(false);

  selection.removeAllRanges();
  selection.addRange(range);

  span.focus();

  editBtn.textContent = "💾";
  editBtn.title = "Save edit";

  const onKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      span.blur();
    }

    if (event.key === "Escape") {
      span.textContent = task.text;
      span.blur();
    }
  };

  const onBlur = () => {
    span.contentEditable = "false";
    span.classList.remove("editing");

    span.removeEventListener("keydown", onKeyDown);
    span.removeEventListener("blur", onBlur);

    saveEdit(task.id, span.textContent);
  };

  span.addEventListener("keydown", onKeyDown);
  span.addEventListener("blur", onBlur);
}

function render() {
  const visibleTasks = getFilteredTasks();

  elements.taskList.innerHTML = "";

  if (visibleTasks.length === 0) {
    let message = "No tasks yet. Add one above!";

    if (currentFilter === "active") {
      message = "No active tasks — great job!";
    } else if (currentFilter === "completed") {
      message = "No completed tasks yet.";
    }

    elements.taskList.innerHTML = `<li class="empty-msg">${message}</li>`;
  } else {
    visibleTasks.forEach((task) => {
      const li = document.createElement("li");

      li.className = `task-item${task.completed ? " completed" : ""}`;
      li.dataset.id = task.id;

      li.innerHTML = `
        <input type="checkbox" class="task-checkbox" id="cb-${task.id}" ${task.completed ? "checked" : ""} aria-label="Toggle complete" />
        <label class="checkbox-label" for="cb-${task.id}">
          <span class="checkbox-visual"></span>
        </label>
        <span class="task-text">${escapeHtml(task.text)}</span>
        <div class="task-actions">
          <button class="action-btn edit-btn" title="Edit task">&#9998;</button>
          <button class="action-btn delete-btn" title="Delete task">&#128465;</button>
        </div>
      `;

      elements.taskList.appendChild(li);
    });
  }

  const activeCount = tasks.filter((task) => !task.completed).length;
  const completedCount = tasks.filter((task) => task.completed).length;

  elements.taskCount.textContent = `${activeCount} task${activeCount !== 1 ? "s" : ""} left`;
  elements.footerStats.textContent = `${tasks.length} total · ${completedCount} done`;

  elements.clearCompletedBtn.toggleAttribute("hidden", completedCount === 0);
}

elements.addBtn.addEventListener("click", addTask);

elements.taskInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addTask();
});

elements.clearCompletedBtn.addEventListener("click", clearCompleted);

elements.filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    elements.filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    render();
  });
});

elements.taskList.addEventListener("click", (event) => {
  const li = event.target.closest(".task-item");
  if (!li) return;

  const id = Number(li.dataset.id);
  const task = findTask(id);

  if (!task) return;

  if (event.target.closest(".delete-btn")) {
    deleteTask(id);
  } else if (event.target.closest(".edit-btn")) {
    startEditing(li, task);
  } else if (event.target.classList.contains("task-checkbox")) {
    toggleTask(id);
  }
});

elements.taskList.addEventListener("dblclick", (event) => {
  const span = event.target.closest(".task-text");
  if (!span) return;

  const li = span.closest(".task-item");
  const task = findTask(Number(li.dataset.id));

  if (task && span.contentEditable !== "true") {
    startEditing(li, task);
  }
});

render();
