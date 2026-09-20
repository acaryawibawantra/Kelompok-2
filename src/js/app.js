// ============================================================
// To Do List - Starter
// Baca README.md untuk daftar lengkap fitur yang harus dibuat
// dan hint pengerjaannya sebelum mulai coding.
// ============================================================

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");

// Struktur satu task: { id, text, completed }
// NOTE: "completed" sudah disiapkan di data model, tapi belum
// dipakai di mana pun. Itu tugas kamu di Fitur #1.
let tasks = [];
let nextId = 1;
let currentFilter = "all";

// Key penyimpanan data task di localStorage (Fitur #4)
const STORAGE_KEY = "tasks";

// Fitur #4: muat data task tersimpan dari localStorage saat aplikasi dibuka.
// Kalau belum ada data (null) atau datanya korup, mulai dengan list kosong.
function loadTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(stored)) {
      tasks = stored;
    }
  } catch {
    // Data korup diabaikan, mulai dengan list kosong
  }

  // Hitung ulang nextId agar id task baru tidak bertabrakan dengan task lama
  nextId = Math.max(0, ...tasks.map((task) => task.id)) + 1;
}

// Fitur #4: simpan seluruh data task ke localStorage.
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function renderTasks() {
  // Fitur #4: simpan ke localStorage paling awal, supaya tetap
  // tereksekusi meskipun masuk cabang list kosong (early return).
  saveTasks();

  taskList.innerHTML = "";

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

    // TODO (Fitur #2 - Edit Task):
    // Tambahkan tombol "Edit" di sini. Saat diklik, ganti `span`
    // menjadi <input> berisi teks task supaya bisa diubah,
    // lalu simpan perubahannya saat user menekan Enter / klik Save.

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
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
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });

    const taskCounter = document.getElementById("task-counter");

    if (taskCounter) {
        const remainingTasks = tasks.filter(
            (task) => task.completed === false
        ).length;

        taskCounter.textContent = `${remainingTasks} task tersisa`;
    }
}

function addTask(text) {
  const trimmed = text.trim();
  if (trimmed === "") return;

  tasks.push({
    id: nextId++,
    text: trimmed,
    completed: false,
  });

  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  renderTasks();
}

// TODO (Fitur #1 - Tandai Selesai):
// Buat function toggleComplete(id) yang membalik nilai task.completed
// untuk task dengan id yang cocok, lalu panggil renderTasks().
function toggleComplete(id) {
  const task = tasks.find((task) => task.id === id);
  if (task) {
    task.completed = !task.completed;
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


// TODO (Fitur #6 - Clear Completed):
// Buat function clearCompleted() yang menghapus semua task dengan
// completed === true dari array "tasks", lalu panggil renderTasks().
// Jangan lupa tambahkan event listener untuk tombol #clear-completed.

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
  addTask(taskInput.value);
  taskInput.value = "";
  taskInput.focus();
});

// Fitur #4: muat data tersimpan dulu sebelum render pertama,
// supaya task lama muncul saat halaman dibuka/refresh.
loadTasks();
renderTasks();
