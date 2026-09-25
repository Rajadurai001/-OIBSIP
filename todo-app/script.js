/* ══════════════════════════════════════════════
   TASKFLOW — Application Logic
   ══════════════════════════════════════════════ */

(() => {
  'use strict';

  // ── Constants ──────────────────────────────
  const STORAGE_KEY = 'taskflow_tasks';

  // ── SVG icon templates ─────────────────────
  const ICONS = {
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    delete: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
    save: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    cancel: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  };

  // ── DOM refs ───────────────────────────────
  const addForm          = document.getElementById('addForm');
  const taskInput        = document.getElementById('taskInput');
  const charCount        = document.getElementById('charCount');
  const pendingList      = document.getElementById('pendingList');
  const completedList    = document.getElementById('completedList');
  const pendingEmpty     = document.getElementById('pendingEmpty');
  const completedEmpty   = document.getElementById('completedEmpty');
  const pendingCountEl   = document.getElementById('pendingCount');
  const completedCountEl = document.getElementById('completedCount');
  const clearCompletedBtn = document.getElementById('clearCompletedBtn');

  // ── State ──────────────────────────────────
  let tasks = loadTasks();

  // ── LocalStorage helpers ───────────────────
  function loadTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  // ── Timestamp formatting ───────────────────
  function formatTime(iso) {
    const d = new Date(iso);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Today at ${time}`;

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return `Yesterday at ${time}`;

    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) + ` at ${time}`;
  }

  // ── Generate unique ID ─────────────────────
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ── Bump animation on stat count ───────────
  function bumpCount(el) {
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }

  // ── Update counts & empty states ───────────
  function updateUI() {
    const pending   = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);

    pendingCountEl.textContent   = pending.length;
    completedCountEl.textContent = completed.length;

    pendingEmpty.hidden   = pending.length > 0;
    completedEmpty.hidden = completed.length > 0;

    clearCompletedBtn.hidden = completed.length === 0;
  }

  // ── Create a task DOM element ──────────────
  function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.id = task.id;

    // Checkbox
    const check = document.createElement('button');
    check.className = 'task-check' + (task.completed ? ' is-checked' : '');
    check.setAttribute('aria-label', task.completed ? 'Mark as pending' : 'Mark as complete');
    check.innerHTML = ICONS.check;
    check.addEventListener('click', () => toggleComplete(task.id));

    // Body
    const body = document.createElement('div');
    body.className = 'task-body';

    const text = document.createElement('p');
    text.className = 'task-text' + (task.completed ? ' is-done' : '');
    text.textContent = task.text;

    const timeAdded = document.createElement('span');
    timeAdded.className = 'task-time';
    timeAdded.textContent = `Added: ${formatTime(task.createdAt)}`;

    body.appendChild(text);
    body.appendChild(timeAdded);

    if (task.completed && task.completedAt) {
      const timeDone = document.createElement('span');
      timeDone.className = 'task-time task-time--completed';
      timeDone.textContent = `✓ Completed: ${formatTime(task.completedAt)}`;
      body.appendChild(timeDone);
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'task-btn task-btn--edit';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.innerHTML = ICONS.edit;
    editBtn.addEventListener('click', () => startEdit(task.id, li));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-btn task-btn--delete';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.innerHTML = ICONS.delete;
    deleteBtn.addEventListener('click', () => deleteTask(task.id, li));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(check);
    li.appendChild(body);
    li.appendChild(actions);

    return li;
  }

  // ── Full render ────────────────────────────
  function renderAll() {
    pendingList.innerHTML = '';
    completedList.innerHTML = '';

    const pending   = tasks.filter(t => !t.completed).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const completed = tasks.filter(t => t.completed).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    pending.forEach(t => pendingList.appendChild(createTaskElement(t)));
    completed.forEach(t => completedList.appendChild(createTaskElement(t)));

    updateUI();
  }

  // ── Add task ───────────────────────────────
  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const task = {
      id: uid(),
      text: trimmed,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    tasks.unshift(task);
    saveTasks();

    // Prepend to pending list
    const el = createTaskElement(task);
    pendingList.prepend(el);
    updateUI();
    bumpCount(pendingCountEl);
  }

  // ── Toggle complete ────────────────────────
  function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const li = document.querySelector(`.task-item[data-id="${id}"]`);

    // Animate out
    if (li) {
      li.classList.add('removing');
      li.addEventListener('animationend', () => {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        saveTasks();
        renderAll();
        bumpCount(task.completed ? completedCountEl : pendingCountEl);
      }, { once: true });
    } else {
      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date().toISOString() : null;
      saveTasks();
      renderAll();
    }
  }

  // ── Delete task ────────────────────────────
  function deleteTask(id, li) {
    li.classList.add('removing');
    li.addEventListener('animationend', () => {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      li.remove();
      updateUI();
    }, { once: true });
  }

  // ── Inline edit ────────────────────────────
  function startEdit(id, li) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const body = li.querySelector('.task-body');
    const textEl = body.querySelector('.task-text');
    const actions = li.querySelector('.task-actions');

    // Already editing?
    if (body.querySelector('.task-edit-input')) return;

    // Replace text with input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = task.text;
    input.maxLength = 200;
    textEl.replaceWith(input);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    // Replace action buttons
    const oldActions = actions.innerHTML;
    actions.innerHTML = '';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'task-btn task-btn--save';
    saveBtn.setAttribute('aria-label', 'Save edit');
    saveBtn.innerHTML = ICONS.save;

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'task-btn task-btn--cancel';
    cancelBtn.setAttribute('aria-label', 'Cancel edit');
    cancelBtn.innerHTML = ICONS.cancel;

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);

    function saveEdit() {
      const newText = input.value.trim();
      if (newText && newText !== task.text) {
        task.text = newText;
        saveTasks();
      }
      renderAll();
    }

    function cancelEdit() {
      renderAll();
    }

    saveBtn.addEventListener('click', saveEdit);
    cancelBtn.addEventListener('click', cancelEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
      if (e.key === 'Escape') { cancelEdit(); }
    });
  }

  // ── Clear completed ────────────────────────
  function clearCompleted() {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderAll();
  }

  // ── Event listeners ────────────────────────
  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(taskInput.value);
    taskInput.value = '';
    charCount.textContent = '0 / 200';
    taskInput.focus();
  });

  taskInput.addEventListener('input', () => {
    charCount.textContent = `${taskInput.value.length} / 200`;
  });

  clearCompletedBtn.addEventListener('click', clearCompleted);

  // ── Initial render ─────────────────────────
  renderAll();
})();
