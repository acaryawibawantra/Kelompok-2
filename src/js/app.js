// ============================================================
// To Do List - Starter
// Baca README.md untuk daftar lengkap fitur yang harus dibuat
// dan hint pengerjaannya sebelum mulai coding.
// ============================================================

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskDueDateInput = document.getElementById("task-due-date");
const taskList = document.getElementById("task-list");
const clearCompletedBtn = document.getElementById("clear-completed");
const themeToggleBtn = document.getElementById("theme-toggle");

// Struktur satu task: { id, text, completed }
// NOTE: "completed" sudah disiapkan di data model, tapi belum
// dipakai di mana pun. Itu tugas kamu di Fitur #1.
let tasks = [];
let nextId = 1;
let currentFilter = "all";
let searchQuery = "";

let boardFilter = "all";

// Bonus: id task yang baru ditambahkan (untuk animasi masuk)
// dan id task yang sedang di-drag (untuk reorder).
let lastAddedTaskId = null;
let dragTaskId = null;

// Key penyimpanan data task di localStorage (Fitur #4)
const STORAGE_KEY = "tasks";

const DATA_KEY = "taskcanvas";


let projects = [];

// Halaman yang sedang terbuka: "space" | "project" | "subject"
let currentPage = { view: "space", projectId: null, subjectId: null };

// Ambil project yang sedang aktif (atau null).
function getActiveProject() {
  return projects.find((p) => p.id === currentPage.projectId) || null;
}

// Ambil subject yang sedang aktif (atau null).
function getActiveSubject() {
  const project = getActiveProject();
  if (!project) return null;
  return project.subjects.find((s) => s.id === currentPage.subjectId) || null;
}

// Semua task dari semua subject, untuk menghitung nextId global.
function getAllTasks() {
  return projects.flatMap((p) => p.subjects.flatMap((s) => s.tasks));
}

// Simpan seluruh struktur project ke localStorage
function saveProjects() {
  localStorage.setItem(DATA_KEY, JSON.stringify({ projects }));
}


function migrateLegacyTasks() {
  let legacyTasks = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(parsed)) legacyTasks = parsed;
  } catch {
  }

  projects = [
    {
      id: "p-" + Date.now(),
      name: "PERSONAL",
      icon: "🏠",
      subjects: [
        {
          id: "s-" + Date.now(),
          name: "Task Saya",
          icon: "📝",
          tasks: legacyTasks,
        },
      ],
    },
  ];
  saveProjects();
}

// Fitur #4 (disesuaikan struktur baru): muat data saat aplikasi dibuka.
// Kalau struktur baru belum ada, migrasi dari key lama "tasks".
function loadTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem(DATA_KEY));
    if (stored && Array.isArray(stored.projects)) {
      projects = stored.projects;
    } else {
      migrateLegacyTasks();
    }
  } catch {
    migrateLegacyTasks();
  }

  // nextId dihitung global (semua subject) agar id tidak bertabrakan
  nextId = Math.max(0, ...getAllTasks().map((task) => task.id)) + 1;
}

// Fitur #4 (disesuaikan struktur baru): simpan setiap kali data berubah.
// "tasks" disinkronkan dulu ke subject aktif karena deleteTask/clearCompleted
// mengganti array lama dengan array baru hasil filter.
function saveTasks() {
  const subject = getActiveSubject();
  if (subject) subject.tasks = tasks;
  saveProjects();
}

// Bonus: tanggal hari ini dalam format YYYY-MM-DD (tanpa timezone UTC).
function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Streak: tanggal kemarin dalam format YYYY-MM-DD.
function getYesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
// Bonus: format due date menjadi "20 Sep".
function formatDueDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

// Bonus: task lewat deadline tapi belum selesai → ditandai merah.
function isOverdue(task) {
  return task.completed === false && !!task.dueDate && task.dueDate < getTodayStr();
}

function renderTasks() {
  // Fitur #4: simpan ke localStorage paling awal, supaya tetap
  // tereksekusi meskipun masuk cabang list kosong (early return).
  saveTasks();

  taskList.innerHTML = "";

  // Fitur #5 & #6: counter dan state tombol selalu di-update, termasuk
  // saat daftar kosong (dipindah sebelum early return supaya tidak
  // stagnan ketika subject yang dibuka tidak punya task).
  const taskCounter = document.getElementById("task-counter");

  if (taskCounter) {
    const remainingTasks = tasks.filter(
      (task) => task.completed === false
    ).length;

    taskCounter.textContent = `${remainingTasks} task tersisa`;
  }

  if (clearCompletedBtn) {
    clearCompletedBtn.disabled = !tasks.some((task) => task.completed);
  }

  if (tasks.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty-state";
    emptyState.textContent = "Belum ada task. Tambahkan satu di atas!";
    taskList.appendChild(emptyState);
    return;
  }

  // TODO (Fitur #3 - Filter Task):
  // Sebelum di-loop, filter dulu "tasks" sesuai filter aktif
  // (semua / aktif / selesai). Sekarang semua task selalu ditampilkan.
  let filteredTasks = tasks;

  if (currentFilter === "active") {
    filteredTasks = tasks.filter((task) => task.completed === false);
  } else if (currentFilter === "completed") {
    filteredTasks = tasks.filter((task) => task.completed === true);
  }

  filteredTasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.dataset.id = task.id;

    // Bonus: animasi masuk khusus untuk task yang baru ditambahkan
    if (task.id === lastAddedTaskId) {
      li.classList.add("added");
      lastAddedTaskId = null;
    }

    // TODO (Fitur #1 - Tandai Selesai):
    // Tambahkan <input type="checkbox"> di sini yang mencerminkan
    // task.completed, dan tambahkan class "completed" pada `li`
    // kalau task.completed === true.
    if(task.completed) {
      li.classList.add("completed");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("click", () => toggleComplete(task.id));

    const span = document.createElement("span");
    span.textContent = task.text;

    let dueChip = null;
    if (task.dueDate) {
      dueChip = document.createElement("span");
      dueChip.className = "task-due" + (isOverdue(task) ? " overdue" : "");
      dueChip.textContent = "📅 " + formatDueDate(task.dueDate);
    }

    //drag-and-drop untuk mengurutkan ulang task.
    li.draggable = currentFilter === "all";
    li.addEventListener("dragstart", () => {
      dragTaskId = task.id;
      li.classList.add("dragging");
    });
    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      li.classList.remove("drag-over");
      dragTaskId = null;
    });
    li.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (dragTaskId !== null && dragTaskId !== task.id) {
        li.classList.add("drag-over");
      }
    });
    li.addEventListener("dragleave", () => li.classList.remove("drag-over"));
    li.addEventListener("drop", (event) => {
      event.preventDefault();
      li.classList.remove("drag-over");
      if (dragTaskId === null || dragTaskId === task.id) return;
      reorderTasks(dragTaskId, task.id);
    });

    // TODO (Fitur #2 - Edit Task):
    // Tambahkan tombol "Edit" di sini. Saat diklik, ganti `span`
    // menjadi <input> berisi teks task supaya bisa diubah,
    // lalu simpan perubahannya saat user menekan Enter / klik Save.

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      // Matikan drag sementara supaya input edit nyaman dipakai
      li.draggable = false;

      const input = document.createElement("input");
      input.type = "text";
      input.className = "edit-input";
      input.value = task.text;

     let isHandled = false;
      const saveEdit = () => {
        if (isHandled) return;
        isHandled = true;
        editTask(task.id, input.value);
      };

     const cancelEdit = () => {
        if (isHandled) return;
        isHandled = true;
        renderTasks();
      };
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          saveEdit();
        } else if (event.key === "Escape") {
          cancelEdit();
        }
      });
      input.addEventListener("blur", saveEdit);

      li.replaceChild(input, span);
      input.focus();
      input.select();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "✕";
    deleteBtn.addEventListener("click", () => {
      // Micro-interaction: task memudar sebentar sebelum benar-benar dihapus
      li.classList.add("removing");
      setTimeout(() => deleteTask(task.id), 150);
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    if (dueChip) li.appendChild(dueChip);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}

function addTask(text, dueDate) {
  const trimmed = text.trim();
  if (trimmed === "") return;

  tasks.push({
    id: nextId++,
    text: trimmed,
    completed: false,
    dueDate: dueDate || null,
  });

  // Bonus: tandai task ini agar dianimasikan saat render
  lastAddedTaskId = tasks[tasks.length - 1].id;

  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  renderTasks();
}

// Bonus: pindahkan task yang di-drag ke posisi task target.
function reorderTasks(draggedId, targetId) {
  const fromIndex = tasks.findIndex((task) => task.id === draggedId);
  const toIndex = tasks.findIndex((task) => task.id === targetId);
  if (fromIndex === -1 || toIndex === -1) return;

  const [moved] = tasks.splice(fromIndex, 1);
  tasks.splice(toIndex, 0, moved);
  renderTasks();
}

// TODO (Fitur #1 - Tandai Selesai):
// Buat function toggleComplete(id) yang membalik nilai task.completed
// untuk task dengan id yang cocok, lalu panggil renderTasks().
function toggleComplete(id) {
  const task = tasks.find((task) => task.id === id);
  if (task) {
    task.completed = !task.completed;
    // Streak: task yang baru dicentang menyalakan api hari ini
    if (task.completed) recordStreakCompletion();
    // Aktivitas: hitung task selesai hari ini untuk heatmap
    recordActivity(task.completed ? 1 : -1);
    renderTasks();
  }
}

// TODO (Fitur #2 - Edit Task):
// Buat function editTask(id, newText) yang mengubah task.text
// untuk task dengan id yang cocok, lalu panggil renderTasks().
  
  function editTask(id, newText) {
  const trimmed = newText.trim();

  if (trimmed === "") {
    renderTasks();
    return;
  }

  const task = tasks.find((task) => task.id === id);
  if (!task) return;

  task.text = trimmed;
  renderTasks();
}


// Fitur #6: hapus semua task dengan completed === true.
// Task yang masih aktif (completed === false) tidak ikut terhapus.
function clearCompleted() {
  tasks = tasks.filter((task) => task.completed === false);
  renderTasks();
}

if (clearCompletedBtn) {
  clearCompletedBtn.addEventListener("click", clearCompleted);
}

// TODO (Fitur #3 - Filter Task):
// Simpan filter yang sedang aktif di sebuah variabel, misalnya
// `let currentFilter = "all";`, lalu tambahkan event listener untuk
// setiap .filter-btn yang mengubah currentFilter dan memanggil
// renderTasks() ulang.
const filterButtons = document.querySelectorAll(".filter-btn");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    filterButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    renderTasks();
  });
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask(taskInput.value, taskDueDateInput ? taskDueDateInput.value : "");
  taskInput.value = "";
  if (taskDueDateInput) taskDueDateInput.value = "";
  taskInput.focus();
});

// ============================================================
// Navigasi & render halaman (redesign UI)
// Struktur: My Space → Project → Subject → Tasks
// ============================================================

function goToSpace() {
  currentPage = { view: "space", projectId: null, subjectId: null };
  closeSidebar();
  render();
}

function goToArchive() {
  currentPage = { view: "archive", projectId: null, subjectId: null };
  closeSidebar();
  render();
}

function openProject(projectId) {
  currentPage = { view: "project", projectId, subjectId: null };
  closeSidebar();
  render();
}

function openSubject(projectId, subjectId) {
  currentPage = { view: "subject", projectId, subjectId };
  const subject = getActiveSubject();
  tasks = subject ? subject.tasks : [];
  currentFilter = "all";
  filterButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === "all");
  });
  closeSidebar();
  render();
}

// Router kecil: tampilkan halaman sesuai currentPage.
function render() {
  renderSidebar();

  // Active state di top navigation
  document.getElementById("nav-link-space").classList.toggle("active", currentPage.view === "space");
  document.getElementById("nav-link-projects").classList.toggle(
    "active",
    currentPage.view === "project" || currentPage.view === "subject"
  );

  document.getElementById("page-space").classList.toggle("hidden", currentPage.view !== "space");
  document.getElementById("page-project").classList.toggle("hidden", currentPage.view !== "project");
  document.getElementById("page-subject").classList.toggle("hidden", currentPage.view !== "subject");

  if (currentPage.view === "space") {
    renderSpace();
  } else if (currentPage.view === "project") {
    renderProjectPage();
  } else if (currentPage.view === "archive") {                                                          // ← DAN INI
    renderArchive();
  } else {
    renderSubjectPage();
    renderTasks();
  }
}

function renderSidebar() {
  document.getElementById("nav-space").classList.toggle("active", currentPage.view === "space");

  const container = document.getElementById("sidebar-projects");
  container.innerHTML = "";

  projects.forEach((project) => {
    const item = document.createElement("button");
    item.className = "sidebar-item" + (currentPage.projectId === project.id ? " active" : "");
    item.textContent = `${project.icon} ${project.name}`;
    item.addEventListener("click", () => openProject(project.id));
    container.appendChild(item);

    // Subject hanya ditampilkan untuk project yang sedang aktif
    if (currentPage.projectId === project.id) {
      project.subjects.forEach((subject) => {
        const subItem = document.createElement("button");
        subItem.className =
          "sidebar-item sidebar-subject" +
          (currentPage.subjectId === subject.id ? " active" : "");
        subItem.textContent = `${subject.icon} ${subject.name}`;
        subItem.addEventListener("click", () => openSubject(project.id, subject.id));
        container.appendChild(subItem);
      });

      const addSubjectBtn = document.createElement("button");
      addSubjectBtn.className = "sidebar-add";
      addSubjectBtn.textContent = "+ New Subject";
      addSubjectBtn.addEventListener("click", () => {
        openModal("New Subject", "Nama subject…", addSubject);
      });
      container.appendChild(addSubjectBtn);
    }
  });
}

// Tombol aksi kecil (favorit / edit / hapus) untuk kartu project & subject.
function makeCardActionBtn(label, title, onClick, extraClass) {
  const btn = document.createElement("button");
  btn.className = "card-action-btn" + (extraClass ? " " + extraClass : "");
  btn.textContent = label;
  btn.title = title;
  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
  return btn;
}

function renderSpace() {
  // Heatmap aktivitas selalu disegarkan saat membuka My Space
  renderActivityHeatmap();

  const grid = document.getElementById("project-grid");
  grid.innerHTML = "";

  // Favorit mencakup project DAN subject yang di-heart
  const favoriteSubjects = projects.flatMap((project) =>
    project.subjects
      .filter((subject) => subject.favorite === true)
      .map((subject) => ({ project, subject }))
  );
  const favoriteCount =
    projects.filter((p) => p.favorite).length + favoriteSubjects.length;

  // Sinkronkan label, jumlah, dan active state pada tab board filter
  const boardFilterAll = document.getElementById("board-filter-all");
  if (boardFilterAll) {
    boardFilterAll.textContent = `All Boards (${projects.length})`;
    boardFilterAll.classList.toggle("active", boardFilter === "all");
  }
  const boardFilterFav = document.getElementById("board-filter-fav");
  if (boardFilterFav) {
    boardFilterFav.textContent = `Favorites (${favoriteCount})`;
    boardFilterFav.classList.toggle("active", boardFilter === "favorites");
  }

  // Filter berdasarkan tab board + kotak search di top navigation
  const visibleProjects = projects.filter(
    (project) =>
      !project.archived && 
      project.name.toLowerCase().includes(searchQuery) &&
      (boardFilter !== "favorites" || project.favorite === true)
  );

  if (visibleProjects.length === 0) {
    const hint = document.createElement("p");
    hint.className = "empty-hint";
    if (boardFilter === "favorites") {
      hint.textContent = "Belum ada project favorit. Klik ikon ❤️ pada kartu project.";
    } else if (searchQuery !== "") {
      hint.textContent = `Tidak ada project yang cocok dengan "${searchQuery}".`;
    } else {
      hint.textContent = "Belum ada project. Buat satu untuk mulai!";
    }
    grid.appendChild(hint);
  }

  visibleProjects.forEach((project) => {
    const totalTasks = project.subjects.reduce(
      (sum, subject) => sum + subject.tasks.length,
      0
    );

    // Kartu pakai div (bukan button) supaya bisa memuat tombol aksi di dalamnya
    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("role", "button");
    card.tabIndex = 0;

    const actions = document.createElement("div");
    actions.className = "card-actions";
    actions.appendChild(
      makeCardActionBtn(
        project.favorite ? "❤️" : "🤍",
        project.favorite ? "Hapus dari favorit" : "Tambah ke favorit",
        () => toggleFavorite(project.id),
        project.favorite ? "fav-active" : ""
      )
    );
    actions.appendChild(
      makeCardActionBtn("✎", "Edit project", () => editProject(project.id))
    );
    actions.appendChild(
      makeCardActionBtn("🗑", "Hapus project", () => deleteProject(project.id))
    );
  actions.appendChild(
    makeCardActionBtn("🗄", "Arsipkan project", () => archiveProject(project.id))
    );
    const icon = document.createElement("div");
    icon.className = "card-icon";
    icon.textContent = project.icon;

    const name = document.createElement("div");
    name.className = "card-name";
    name.textContent = project.name;

    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = `${project.subjects.length} subjects · ${totalTasks} tasks`;

    const open = document.createElement("div");
    open.className = "card-open";
    open.textContent = "Open Project →";

    card.appendChild(actions);
    card.appendChild(icon);
    card.appendChild(name);
    card.appendChild(meta);
    card.appendChild(open);
    card.addEventListener("click", () => openProject(project.id));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter") openProject(project.id);
    });
    grid.appendChild(card);
  });

  // Subject favorit ikut tampil sebagai kartu saat tab Favorites aktif
  if (boardFilter === "favorites") {
    favoriteSubjects.forEach(({ project, subject }) => {
      const card = document.createElement("div");
      card.className = "card";
      card.setAttribute("role", "button");
      card.tabIndex = 0;

      const actions = document.createElement("div");
      actions.className = "card-actions";
      actions.appendChild(
        makeCardActionBtn(
          "❤️",
          "Hapus dari favorit",
          () => toggleFavoriteSubject(project.id, subject.id),
          "fav-active"
        )
      );

      const icon = document.createElement("div");
      icon.className = "card-icon";
      icon.textContent = subject.icon;

      const name = document.createElement("div");
      name.className = "card-name";
      name.textContent = subject.name;

      const meta = document.createElement("div");
      meta.className = "card-meta";
      meta.textContent = `${project.icon} ${project.name} · ${subject.tasks.length} tasks`;

      const open = document.createElement("div");
      open.className = "card-open";
      open.textContent = "Open →";

      card.appendChild(actions);
      card.appendChild(icon);
      card.appendChild(name);
      card.appendChild(meta);
      card.appendChild(open);
      card.addEventListener("click", () => openSubject(project.id, subject.id));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter") openSubject(project.id, subject.id);
      });
      grid.appendChild(card);
    });
  }

  // Kartu "+ New Project" — dashed, selalu jadi bagian terakhir grid
  const newCard = document.createElement("button");
  newCard.className = "card card-new";

  const plus = document.createElement("div");
  plus.className = "card-new-plus";
  plus.textContent = "+";

  const label = document.createElement("div");
  label.className = "card-new-label";
  label.textContent = "New Project";

  const hint = document.createElement("div");
  hint.className = "card-new-hint";
  hint.textContent = "Create another project";

  newCard.appendChild(plus);
  newCard.appendChild(label);
  newCard.appendChild(hint);
  newCard.addEventListener("click", () => {
    openModal("New Project", "Nama project…", addProject);
  });
  grid.appendChild(newCard);
}

function renderArchive() {
  const container = document.getElementById("page-archive");
  const list = container.querySelector(".card-grid") || document.createElement("div");
  
  const archivedProjects = projects.filter((p) => p.archived === true);
  
  // Hapus placeholder lama & grid lama kalau ada
  const oldHint = container.querySelector(".empty-hint");
  if (oldHint) oldHint.remove();
  const oldGrid = container.querySelector(".card-grid");
  if (oldGrid) oldGrid.remove();

  if (archivedProjects.length === 0) {
    const hint = document.createElement("p");
    hint.className = "empty-hint";
    hint.textContent = "Belum ada yang diarsipkan.";
    container.appendChild(hint);
    return;
  }

  const grid = document.createElement("div");
  grid.className = "card-grid";

  archivedProjects.forEach((project) => {
    const card = document.createElement("div");
    card.className = "card";

    const icon = document.createElement("div");
    icon.className = "card-icon";
    icon.textContent = project.icon;

    const name = document.createElement("div");
    name.className = "card-name";
    name.textContent = project.name;

    const restoreBtn = document.createElement("button");
    restoreBtn.className = "btn-ghost";
    restoreBtn.textContent = "↩ Kembalikan";
    restoreBtn.addEventListener("click", () => {
      project.archived = false;
      saveProjects();
      render();
    });

    card.appendChild(icon);
    card.appendChild(name);
    card.appendChild(restoreBtn);
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

function renderProjectPage() {
  const project = getActiveProject();
  if (!project) {
    goToSpace();
    return;
  }

  renderBreadcrumb("project-breadcrumb", [
    { label: "My Space", onClick: goToSpace },
    { label: project.name },
  ]);

  const totalTasks = project.subjects.reduce(
    (sum, subject) => sum + subject.tasks.length,
    0
  );

  document.getElementById("project-title").textContent = `${project.icon} ${project.name}`;
  document.getElementById("project-subtitle").textContent =
    `${project.subjects.length} subjects · ${totalTasks} tasks`;

  const grid = document.getElementById("subject-grid");
  grid.innerHTML = "";

  if (project.subjects.length === 0) {
    const hint = document.createElement("p");
    hint.className = "empty-hint";
    hint.textContent = "Belum ada subject. Buat satu untuk mulai!";
    grid.appendChild(hint);
    return;
  }

  project.subjects.forEach((subject) => {
    // Kartu pakai div (bukan button) supaya bisa memuat tombol aksi di dalamnya
    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("role", "button");
    card.tabIndex = 0;

    const actions = document.createElement("div");
    actions.className = "card-actions";
    actions.appendChild(
      makeCardActionBtn(
        subject.favorite ? "❤️" : "🤍",
        subject.favorite ? "Hapus dari favorit" : "Tambah ke favorit",
        () => toggleFavoriteSubject(project.id, subject.id),
        subject.favorite ? "fav-active" : ""
      )
    );
    actions.appendChild(
      makeCardActionBtn("✎", "Edit subject", () =>
        editSubject(project.id, subject.id)
      )
    );
    actions.appendChild(
      makeCardActionBtn("🗑", "Hapus subject", () =>
        deleteSubject(project.id, subject.id)
      )
    );

    const icon = document.createElement("div");
    icon.className = "card-icon";
    icon.textContent = subject.icon;

    const name = document.createElement("div");
    name.className = "card-name";
    name.textContent = subject.name;

    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = `${subject.tasks.length} tasks`;

    const open = document.createElement("div");
    open.className = "card-open";
    open.textContent = "Open →";

    card.appendChild(actions);
    card.appendChild(icon);
    card.appendChild(name);
    card.appendChild(meta);
    card.appendChild(open);
    card.addEventListener("click", () => openSubject(project.id, subject.id));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter") openSubject(project.id, subject.id);
    });
    grid.appendChild(card);
  });
}

function renderSubjectPage() {
  const project = getActiveProject();
  const subject = getActiveSubject();
  if (!project || !subject) {
    goToSpace();
    return;
  }

  renderBreadcrumb("subject-breadcrumb", [
    { label: "My Space", onClick: goToSpace },
    { label: project.name, onClick: () => openProject(project.id) },
    { label: subject.name },
  ]);

  document.getElementById("subject-title").textContent = `${subject.icon} ${subject.name}`;

  const remainingTasks = subject.tasks.filter((task) => task.completed === false).length;
  document.getElementById("subject-subtitle").textContent =
    `${subject.tasks.length} tasks · ${remainingTasks} belum selesai`;
}

// Breadcrumb: item terakhir = posisi sekarang (tidak bisa diklik).
function renderBreadcrumb(elementId, items) {
  const container = document.getElementById(elementId);
  container.innerHTML = "";

  items.forEach((item, index) => {
    if (index > 0) {
      const sep = document.createElement("span");
      sep.className = "sep";
      sep.textContent = "/";
      container.appendChild(sep);
    }

    if (item.onClick) {
      const btn = document.createElement("button");
      btn.textContent = item.label;
      btn.addEventListener("click", item.onClick);
      container.appendChild(btn);
    } else {
      const span = document.createElement("span");
      span.className = "current";
      span.textContent = item.label;
      container.appendChild(span);
    }
  });
}

// ============================================================
// Modal New Project / New Subject
// ============================================================

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalInput = document.getElementById("modal-input");
const modalMessage = document.getElementById("modal-message");
let modalSubmit = null;
// Mode modal: "input" (isi nama) | "confirm" (konfirmasi hapus)
let modalMode = "input";

function openModal(title, placeholder, onSubmit) {
  modalMode = "input";
  modalTitle.textContent = title;
  modalMessage.classList.add("hidden");
  modalInput.classList.remove("hidden");
  modalInput.value = "";
  modalInput.placeholder = placeholder;
  modalSubmit = onSubmit;
  modal.classList.remove("hidden");
  document.getElementById("modal-save").textContent = "Simpan";
  modalInput.focus();
}

// Modal konfirmasi (tanpa input) untuk aksi berbahaya seperti hapus.
function openConfirm(title, message, onConfirm) {
  modalMode = "confirm";
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modalMessage.classList.remove("hidden");
  modalInput.classList.add("hidden");
  modalSubmit = onConfirm;
  modal.classList.remove("hidden");
  document.getElementById("modal-save").textContent = "Hapus";
}

function closeModal() {
  modal.classList.add("hidden");
  modalSubmit = null;
  modalMode = "input";
  modalMessage.classList.add("hidden");
  modalInput.classList.remove("hidden");
}

document.getElementById("modal-save").addEventListener("click", () => {
  if (!modalSubmit) return;
  const handler = modalSubmit;

  if (modalMode === "confirm") {
    closeModal();
    handler();
    return;
  }

  const name = modalInput.value.trim();
  if (name === "") return;
  closeModal();
  handler(name);
});

document.getElementById("modal-cancel").addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

modalInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") document.getElementById("modal-save").click();
  if (event.key === "Escape") closeModal();
});

// Ikon bergilir agar tiap project/subject baru punya ikon berbeda
const PROJECT_ICONS = ["📚", "💼", "🎯", "🎨", "🌱", "🧪"];
const SUBJECT_ICONS = ["🌐", "🤖", "🗄", "📝", "📌", "✏️"];

function addProject(name) {
  const project = {
    id: "p-" + Date.now(),
    name: name.toUpperCase(),
    icon: PROJECT_ICONS[projects.length % PROJECT_ICONS.length],
    favorite: false,
    subjects: [],
  };
  projects.push(project);
  saveProjects();
  openProject(project.id);
}

function addSubject(name) {
  const project = getActiveProject();
  if (!project) return;

  const subject = {
    id: "s-" + Date.now(),
    name: name,
    icon: SUBJECT_ICONS[project.subjects.length % SUBJECT_ICONS.length],
    favorite: false,
    tasks: [],
  };
  project.subjects.push(subject);
  saveProjects();
  openSubject(project.id, subject.id);
}

// Edit / hapus / favorit project & subject

// Tandai/hapus project dari kategori favorit.
function toggleFavorite(projectId) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;
  project.favorite = !project.favorite;
  saveProjects();
  render();
}

// Tandai/hapus subject dari kategori favorit.
function toggleFavoriteSubject(projectId, subjectId) {
  const project = projects.find((p) => p.id === projectId);
  const subject = project && project.subjects.find((s) => s.id === subjectId);
  if (!project || !subject) return;
  subject.favorite = !subject.favorite;
  saveProjects();
  render();
}

function editProject(projectId) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;

  openModal("Edit Project", "Nama project…", (name) => {
    project.name = name.toUpperCase();
    saveProjects();
    render();
  });
  // Prefill dengan nama saat ini (openModal mengosongkan input)
  modalInput.value = project.name;
}

function editSubject(projectId, subjectId) {
  const project = projects.find((p) => p.id === projectId);
  const subject = project && project.subjects.find((s) => s.id === subjectId);
  if (!project || !subject) return;

  openModal("Edit Subject", "Nama subject…", (name) => {
    subject.name = name;
    saveProjects();
    render();
  });
  modalInput.value = subject.name;
}

function deleteProject(projectId) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;

  openConfirm(
    "Hapus Project",
    `Hapus project "${project.name}" beserta semua subject dan task di dalamnya? Tindakan ini tidak bisa dibatalkan.`,
    () => {
      projects = projects.filter((p) => p.id !== projectId);
      saveProjects();
      if (currentPage.projectId === projectId) {
        goToSpace();
      } else {
        render();
      }
    }
  );
}

function archiveProject(projectId) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;
  
  project.archived = true;
  saveProjects();
  render();
}

function deleteSubject(projectId, subjectId) {
  const project = projects.find((p) => p.id === projectId);
  const subject = project && project.subjects.find((s) => s.id === subjectId);
  if (!project || !subject) return;

  openConfirm(
    "Hapus Subject",
    `Hapus subject "${subject.name}" beserta semua task di dalamnya? Tindakan ini tidak bisa dibatalkan.`,
    () => {
      project.subjects = project.subjects.filter((s) => s.id !== subjectId);
      saveProjects();
      if (currentPage.subjectId === subjectId) {
        openProject(projectId);
      } else {
        render();
      }
    }
  );
}

function openNewProjectModal() {
  openModal("New Project", "Nama project…", addProject);
}

document.getElementById("new-project-btn").addEventListener("click", openNewProjectModal);
document.getElementById("topnav-new-project").addEventListener("click", openNewProjectModal);

document.getElementById("new-subject-btn").addEventListener("click", () => {
  if (!getActiveProject()) return;
  openModal("New Subject", "Nama subject…", addSubject);
});

// Navigasi top bar
document.getElementById("nav-link-space").addEventListener("click", goToSpace);
document.getElementById("nav-link-projects").addEventListener("click", goToSpace);
document.getElementById("nav-link-archive").addEventListener("click", goToArchive);

// Search sederhana: filter kartu project di My Space
document.getElementById("project-search").addEventListener("input", (event) => {
  searchQuery = event.target.value.trim().toLowerCase();
  if (currentPage.view === "space") renderSpace();
});

// Tab board filter di My Space: All Boards / Favorites
document.getElementById("board-filter-all").addEventListener("click", () => {
  boardFilter = "all";
  if (currentPage.view === "space") renderSpace();
});

document.getElementById("board-filter-fav").addEventListener("click", () => {
  boardFilter = "favorites";
  if (currentPage.view === "space") renderSpace();
});

// Sidebar mobile (drawer)

const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("backdrop");
const sidebarCloseBtn = document.getElementById("sidebar-close");

function closeSidebar() {
  sidebar.classList.remove("open");
  backdrop.classList.remove("show");
  document.body.classList.remove("drawer-open");
}

document.getElementById("menu-toggle").addEventListener("click", () => {
  sidebar.classList.toggle("open");
  const isOpen = sidebar.classList.contains("open");
  backdrop.classList.toggle("show", isOpen);
  // Kunci scroll halaman saat drawer terbuka
  document.body.classList.toggle("drawer-open", isOpen);
});

backdrop.addEventListener("click", closeSidebar);

if (sidebarCloseBtn) {
  sidebarCloseBtn.addEventListener("click", closeSidebar);
}

// Escape menutup drawer di mobile
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sidebar.classList.contains("open")) {
    closeSidebar();
  }
});

document.getElementById("nav-space").addEventListener("click", goToSpace);

// ============================================================
// Bonus: dark mode (tersimpan di localStorage)
// ============================================================

const THEME_KEY = "taskcanvas-theme";

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  if (themeToggleBtn) {
    themeToggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";
  }
}

function toggleTheme() {
  const next = document.body.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", toggleTheme);
}

// ============================================================
// Streak: selesaikan minimal 1 task per hari agar api menyala
// ============================================================

const STREAK_KEY = "taskcanvas-streak";
let streak = { count: 0, lastDate: null };

// Muat streak tersimpan; kalau terakhir selesai sebelum kemarin,
// streak dianggap putus (api padam).
function loadStreak() {
  try {
    const stored = JSON.parse(localStorage.getItem(STREAK_KEY));
    if (stored && typeof stored.count === "number") {
      streak = stored;
    }
  } catch {
    streak = { count: 0, lastDate: null };
  }

  if (streak.lastDate && streak.lastDate < getYesterdayStr()) {
    streak = { count: 0, lastDate: streak.lastDate };
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  }

  renderStreak();
}

// Dipanggil setiap kali sebuah task diselesaikan (dicentang).
function recordStreakCompletion() {
  const today = getTodayStr();
  if (streak.lastDate === today) return; // hari ini sudah tercatat

  streak.count = streak.lastDate === getYesterdayStr() ? streak.count + 1 : 1;
  streak.lastDate = today;
  localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  renderStreak();
}

// Tampilkan badge: api merah bila task hari ini sudah selesai.
function renderStreak() {
  const badge = document.getElementById("streak-badge");
  const flame = document.getElementById("streak-flame");
  const count = document.getElementById("streak-count");
  if (!badge || !flame || !count) return;

  const active = streak.count > 0 && streak.lastDate === getTodayStr();

  flame.src = active ? "icons/flame-active.svg" : "icons/flame.svg";
  count.textContent = streak.count;
  badge.classList.toggle("active", active);
  badge.title = active
    ? `Streak ${streak.count} hari menyala! Tetap lanjutkan besok.`
    : streak.count > 0
      ? `Streak ${streak.count} hari — selesaikan 1 task hari ini agar api tetap menyala.`
      : "Selesaikan minimal 1 task setiap hari agar api menyala.";
}

// ============================================================
// Aktivitas: heatmap konsistensi ala GitHub contributions
// ============================================================

const ACTIVITY_KEY = "taskcanvas-activity";
// Bentuk: { "2026-09-20": 3, ... } — jumlah task selesai per hari
let activityLog = {};

function loadActivity() {
  try {
    const stored = JSON.parse(localStorage.getItem(ACTIVITY_KEY));
    if (stored && typeof stored === "object") activityLog = stored;
  } catch {
    activityLog = {};
  }
}

function saveActivity() {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activityLog));
}

// Catat penyelesaian task hari ini (+1 saat dicentang, -1 saat dibatalkan).
function recordActivity(delta) {
  const today = getTodayStr();
  const next = Math.max(0, (activityLog[today] || 0) + delta);
  if (next === 0) {
    delete activityLog[today];
  } else {
    activityLog[today] = next;
  }
  saveActivity();
  renderActivityHeatmap();
}

// Level intensitas hijau (0-4) dari jumlah task selesai hari itu.
function getActivityLevel(count) {
  if (!count || count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

// Render heatmap 26 minggu berakhir hari ini: kolom = minggu,
// baris = hari mulai Minggu + label bulan di bawahnya.
// Tanggal masa depan dirender sebagai sel kosong agar grid tetap rapi.
function renderActivityHeatmap() {
  const grid = document.getElementById("activity-heatmap");
  if (!grid) return;

  grid.innerHTML = "";

  const WEEKS = 26;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yearTitle = document.getElementById("activity-year");
  if (yearTitle) yearTitle.textContent = today.getFullYear();

  // Mundur ke hari Minggu di minggu (WEEKS-1) sebelum minggu ini
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay() - (WEEKS - 1) * 7);

  const todayStr = getTodayStr();
  let total = 0;

  for (let week = 0; week < WEEKS; week++) {
    let monthLabel = "";

    for (let day = 0; day < 7; day++) {
      const date = new Date(start);
      date.setDate(start.getDate() + week * 7 + day);

      if (date > today) {
        const spacer = document.createElement("div");
        spacer.className = "heat empty";
        grid.appendChild(spacer);
        continue;
      }

      // Kolom yang memuat tanggal 1 diberi label bulan
      if (date.getDate() === 1 && !monthLabel) {
        monthLabel = date.toLocaleDateString("id-ID", { month: "short" });
      }

      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const count = activityLog[dateStr] || 0;
      total += count;

      const cell = document.createElement("div");
      cell.className = "heat lvl-" + getActivityLevel(count);
      if (dateStr === todayStr) cell.classList.add("today");
      cell.title =
        `${date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} — ${count} task diselesaikan`;
      grid.appendChild(cell);
    }

    const label = document.createElement("span");
    label.className = "heat-month";
    label.textContent = monthLabel;
    grid.appendChild(label);
  }

  const summary = document.getElementById("activity-summary");
  if (summary) {
    summary.textContent =
      total > 0
        ? `${total} task diselesaikan`
        : "Belum ada aktivitas — centang task untuk mulai mengisi heatmap";
  }
}

// ============================================================
// Settings: ganti gaya font judul + tombol install aplikasi
// ============================================================

const settingsBtn = document.getElementById("settings-btn");
const settingsModal = document.getElementById("settings-modal");
const installBtn = document.getElementById("install-btn");
const installHint = document.getElementById("install-hint");
const FONT_KEY = "taskcanvas-font";

// Prompt install yang ditunda oleh browser (Chrome/Edge/Android)
let deferredInstallPrompt = null;

// Terapkan tema font: "default" | "clean" | "serif"
function applyFont(font) {
  document.body.dataset.font = font;
  localStorage.setItem(FONT_KEY, font);

  document.querySelectorAll(".font-option").forEach((option) => {
    option.classList.toggle("active", option.dataset.font === font);
  });
}

function openSettings() {
  updateInstallSection();
  settingsModal.classList.remove("hidden");
}

function closeSettings() {
  settingsModal.classList.add("hidden");
}

// Atur tampilan bagian install sesuai kemampuan browser
function updateInstallSection() {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  if (isStandalone) {
    installBtn.classList.add("hidden");
    installHint.textContent = "Aplikasi sudah terinstall di perangkat ini ✓";
    return;
  }

  if (deferredInstallPrompt) {
    installBtn.classList.remove("hidden");
    installHint.textContent = "";
    return;
  }

  // iOS Safari tidak mendukung prompt install otomatis
  installBtn.classList.add("hidden");
  installHint.textContent =
    "Di iPhone/iPad: buka lewat Safari, tekan tombol Share, lalu pilih Add to Home Screen.";
}

if (settingsBtn) {
  settingsBtn.addEventListener("click", () => {
    closeSidebar();
    openSettings();
  });
}

document.getElementById("settings-close").addEventListener("click", closeSettings);

settingsModal.addEventListener("click", (event) => {
  if (event.target === settingsModal) closeSettings();
});

document.querySelectorAll(".font-option").forEach((option) => {
  option.addEventListener("click", () => applyFont(option.dataset.font));
});

// Browser menahan event ini sampai kita siap menampilkan prompt sendiri
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    if (outcome === "accepted") {
      closeSettings();
    } else {
      updateInstallSection();
    }
  });
}

// ============================================================
// Inisialisasi aplikasi
// ============================================================

applyTheme(localStorage.getItem(THEME_KEY) || "light");

// Settings: terapkan tema font tersimpan (default handwritten)
applyFont(localStorage.getItem(FONT_KEY) || "default");

// Streak: muat status api sebelum render pertama
loadStreak();

// Aktivitas: muat log heatmap tersimpan sebelum render pertama
loadActivity();

// Fitur #4: muat data tersimpan dulu sebelum render pertama,
// supaya data lama muncul saat halaman dibuka/refresh.
loadTasks();
render();

// PWA shortcuts: app dibuka lewat tekan-lama ikon → jalankan aksi
// sesuai hash (#space / #new-project / #toggle-theme), lalu bersihkan
// hash agar aksi tidak terulang saat refresh.
function handleAppShortcut() {
  const hash = window.location.hash;

  if (hash === "#new-project") {
    openNewProjectModal();
  } else if (hash === "#toggle-theme") {
    toggleTheme();
  }
  // "#space" dan tanpa hash → biarkan aplikasi terbuka normal

  if (hash) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}

handleAppShortcut();

// PWA: daftarkan service worker agar aplikasi bisa di-install
// ke homescreen & dibuka offline. Tidak berjalan pada file:// —
// aplikasi harus diakses lewat http (localhost / GitHub Pages).
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js").catch(() => {
    // Gagal registrasi (mis. belum HTTPS) — aplikasi tetap jalan normal
  });
}
