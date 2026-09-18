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

// TODO (Fitur #4 - Simpan ke localStorage):
// Saat aplikasi pertama kali dibuka, load "tasks" dari localStorage
// (kalau ada) sebelum renderTasks() dipanggil pertama kali di bawah.
// Hint: gunakan JSON.parse(localStorage.getItem("tasks")) dan cek
// null-nya sebelum dipakai.

function renderTasks() {
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
  tasks.forEach((task) => {
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

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "✕";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });

  // TODO (Fitur #5 - Counter):
  // Update elemen #task-counter di sini setiap kali renderTasks() dipanggil,
  // isinya jumlah task yang belum selesai. Contoh: "3 task tersisa".

  // TODO (Fitur #4 - Simpan ke localStorage):
  // Setiap kali renderTasks() dipanggil, data "tasks" sudah berubah,
  // jadi ini tempat yang pas untuk menyimpan ulang ke localStorage.
  // Hint: localStorage.setItem("tasks", JSON.stringify(tasks));
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

// TODO (Fitur #6 - Clear Completed):
// Buat function clearCompleted() yang menghapus semua task dengan
// completed === true dari array "tasks", lalu panggil renderTasks().
// Jangan lupa tambahkan event listener untuk tombol #clear-completed.

// TODO (Fitur #3 - Filter Task):
// Simpan filter yang sedang aktif di sebuah variabel, misalnya
// `let currentFilter = "all";`, lalu tambahkan event listener untuk
// setiap .filter-btn yang mengubah currentFilter dan memanggil
// renderTasks() ulang.

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask(taskInput.value);
  taskInput.value = "";
  taskInput.focus();
});

renderTasks();
