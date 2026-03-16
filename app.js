const STORAGE_KEY = 'studyhub-data';

let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

if (!data.topics) data.topics = {};
if (!data.notes) data.notes = {};
if (!data.blog) data.blog = '';
if (!data.calendar) data.calendar = {};

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Tabs
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + tab).classList.add('active');
    });
  });

  // Blog
  const blogEntry = document.getElementById('blog-entry');
  if (blogEntry) {
    blogEntry.value = data.blog || '';
    blogEntry.addEventListener('input', () => {
      data.blog = blogEntry.value;
      save();
    });
  }

  // Themen-Checkboxen
  document.querySelectorAll('.topic-checkbox').forEach(cb => {
    const id = cb.dataset.id;
    cb.checked = !!data.topics[id];
    cb.addEventListener('change', () => {
      data.topics[id] = cb.checked;
      save();
    });
  });

  // Notizen zu Themen
  document.querySelectorAll('.topic-note').forEach(area => {
    const id = area.dataset.id;
    area.value = data.notes[id] || '';
    area.addEventListener('input', () => {
      data.notes[id] = area.value;
      save();
    });
  });

  // Kalender
  initCalendar();
});

// Kalenderlogik
let currentDate = new Date();

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function initCalendar() {
  const calendarGrid = document.getElementById('calendar-grid');
  const currentMonthLabel = document.getElementById('current-month');
  const dayTitle = document.getElementById('day-title');
  const dayNotes = document.getElementById('day-notes');

  if (!calendarGrid || !currentMonthLabel || !dayTitle || !dayNotes) return;

  function renderCalendar() {
    calendarGrid.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7; // Montag = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    currentMonthLabel.textContent = firstDay.toLocaleDateString('de-DE', {
      month: 'long',
      year: 'numeric'
    });

    for (let i = 0; i < startWeekday; i++) {
      const empty = document.createElement('div');
      empty.className = 'day-cell empty';
      calendarGrid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const key = formatDateKey(cellDate);
      const cell = document.createElement('div');
      cell.className = 'day-cell';
      cell.dataset.date = key;

      const label = document.createElement('div');
      label.className = 'day-number';
      label.textContent = day;

      const dot = document.createElement('div');
      dot.className = 'day-dot';
      if (data.calendar[key]) {
        dot.classList.add('has-notes');
      }

      cell.appendChild(label);
      cell.appendChild(dot);

      cell.addEventListener('click', () => selectDay(cellDate));
      calendarGrid.appendChild(cell);
    }
  }

  function selectDay(date) {
    const key = formatDateKey(date);
    dayTitle.textContent = date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    dayNotes.dataset.date = key;
    dayNotes.value = data.calendar[key] || '';
  }

  dayNotes.addEventListener('input', () => {
    const key = dayNotes.dataset.date;
    if (!key) return;
    data.calendar[key] = dayNotes.value;
    save();
    renderCalendar();
  });

  document.getElementById('prev-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('next-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  renderCalendar();
  selectDay(new Date());
}
