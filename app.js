// ---------- LocalStorage Helper ----------
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function load(key, fallback) {
  const v = localStorage.getItem(key);
  return v ? JSON.parse(v) : fallback;
}

// =====================================================
// MONATS- UND TAGESPLAN
// =====================================================
const calendarGrid = document.getElementById('calendar-grid');
const monthLabel = document.getElementById('month-label');
const dayTitle = document.getElementById('day-title');
const dayTodoList = document.getElementById('day-todo-list');
const newDayTodo = document.getElementById('new-day-todo');
const addDayTodo = document.getElementById('add-day-todo');

let currentDate = new Date();
let selectedDate = new Date();
let dayTodos = load('dayTodos', {}); // key: 'YYYY-MM-DD' -> [ {text, done} ]

function formatDateKey(d) {
  return d.toISOString().slice(0, 10);
}

function renderCalendar() {
  calendarGrid.innerHTML = '';
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  monthLabel.textContent = firstDay.toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric'
  });

  const startWeekday = (firstDay.getDay() + 6) % 7; // Montag = 0
  for (let i = 0; i < startWeekday; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'day-cell empty';
    calendarGrid.appendChild(emptyCell);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    const date = new Date(year, month, day);
    const key = formatDateKey(date);

    cell.textContent = day;

    if (formatDateKey(date) === formatDateKey(selectedDate)) {
      cell.classList.add('selected');
    }
    if (dayTodos[key] && dayTodos[key].some(t => !t.done)) {
      cell.classList.add('has-todos');
    }

    cell.addEventListener('click', () => {
      selectedDate = date;
      renderCalendar();
      renderDayDetail();
    });

    calendarGrid.appendChild(cell);
  }
}

function renderDayDetail() {
  const key = formatDateKey(selectedDate);
  dayTitle.textContent =
    'Tagesplan für ' + selectedDate.toLocaleDateString('de-DE');
  dayTodoList.innerHTML = '';
  const todos = dayTodos[key] || [];

  todos.forEach((todo, index) => {
    const li = document.createElement('li');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = todo.done;
    cb.addEventListener('change', () => {
      todo.done = cb.checked;
      save('dayTodos', dayTodos);
      renderCalendar();
    });
    const span = document.createElement('span');
    span.textContent = todo.text;

    li.appendChild(cb);
    li.appendChild(span);
    dayTodoList.appendChild(li);
  });
}

document.getElementById('prev-month').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});
document.getElementById('next-month').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});
addDayTodo.addEventListener('click', () => {
  const text = newDayTodo.value.trim();
  if (!text) return;
  const key = formatDateKey(selectedDate);
  if (!dayTodos[key]) dayTodos[key] = [];
  dayTodos[key].push({ text, done: false });
  save('dayTodos', dayTodos);
  newDayTodo.value = '';
  renderCalendar();
  renderDayDetail();
});
newDayTodo.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addDayTodo.click();
  }
});

// Initial
renderCalendar();
renderDayDetail();

// =====================================================
// STOFFPLAN (§ 3 JAO) – Checkboxen + Notizen
// =====================================================
const topicElements = document.querySelectorAll('.topic');
let topicState = load('topicState', {}); // { topicId: { done: bool, subtopics: [bool], notes: "" } }

function initTopics() {
  topicElements.forEach(topicEl => {
    const topicId = topicEl.dataset.topicId;
    if (!topicState[topicId]) {
      topicState[topicId] = { done: false, subtopics: [], notes: '' };
    }

    const doneCheckbox = topicEl.querySelector('.topic-done');
    const subtopicCheckboxes = topicEl.querySelectorAll('.subtopic-checkbox');
    const notesArea = topicEl.querySelector('.topic-notes');

    // Laden
    doneCheckbox.checked = topicState[topicId].done;
    subtopicCheckboxes.forEach((cb, index) => {
      if (topicState[topicId].subtopics[index]) cb.checked = true;
    });
    notesArea.value = topicState[topicId].notes || '';

    // Events
    doneCheckbox.addEventListener('change', () => {
      topicState[topicId].done = doneCheckbox.checked;
      save('topicState', topicState);
    });
    subtopicCheckboxes.forEach((cb, index) => {
      cb.addEventListener('change', () => {
        topicState[topicId].subtopics[index] = cb.checked;
        save('topicState', topicState);
      });
    });
    notesArea.addEventListener('input', () => {
      topicState[topicId].notes = notesArea.value;
      save('topicState', topicState);
    });
  });
}

initTopics();

// =====================================================
// STUDY BLOG – persönliche Einträge
// =====================================================
const blogForm = document.getElementById('blog-form');
const blogTitle = document.getElementById('blog-title');
const blogContent = document.getElementById('blog-content');
const blogEntriesContainer = document.getElementById('blog-entries');

let blogEntries = load('blogEntries', []); // [{id, date, title, content}]

function renderBlog() {
  blogEntriesContainer.innerHTML = '';
  blogEntries
    .slice()
    .reverse()
    .forEach(entry => {
      const div = document.createElement('article');
      div.className = 'blog-entry';
      div.innerHTML = `
        <header>
          <h3>${entry.title}</h3>
          <span class="blog-date">${new Date(entry.date).toLocaleString(
            'de-DE'
          )}</span>
        </header>
        <p>${entry.content.replace(/\n/g, '<br>')}</p>
      `;
      blogEntriesContainer.appendChild(div);
    });
}

blogForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = blogTitle.value.trim();
  const content = blogContent.value.trim();
  if (!title || !content) return;
  blogEntries.push({
    id: Date.now(),
    date: new Date().toISOString(),
    title,
    content
  });
  save('blogEntries', blogEntries);
  blogTitle.value = '';
  blogContent.value = '';
  renderBlog();
});

renderBlog();
