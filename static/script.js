// Helper to render tasks
function renderTasks(tasks) {
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = '';
  if (!tasks || tasks.length === 0) {
    // Leave blank if no tasks
    return;
  }
  tasks.forEach((task, idx) => {
    const li = document.createElement('li');
    // Checkbox for completion
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!task.done;
    checkbox.addEventListener('change', function () {
      fetch(`/toggle-task/${idx}`, { method: 'PATCH' })
        .then(res => res.json())
        .then(() => loadTasks());
    });
    li.appendChild(checkbox);
    // Task description
    const span = document.createElement('span');
    span.textContent = `${task.description} (Due: ${task.due || 'N/A'})`;
    if (task.done) {
      span.style.textDecoration = 'line-through';
    }
    li.appendChild(span);
    // Delete button
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.style.marginLeft = '10px';
    delBtn.addEventListener('click', function () {
      fetch(`/delete-task/${idx}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(() => loadTasks());
    });
    li.appendChild(delBtn);
    taskList.appendChild(li);
  });
}

// Load tasks from backend
function loadTasks() {
  fetch('/tasks')
    .then(res => res.json())
    .then(data => {
      renderTasks(data.tasks);
    })
    .catch(err => {
      renderTasks([]);
    });
}

document.addEventListener('DOMContentLoaded', function () {
  loadTasks();

  const taskForm = document.getElementById('taskForm');
  taskForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const taskInput = document.getElementById('taskInput');
    const dueDate = document.getElementById('dueDate');
    const task = {
      description: taskInput.value,
      due: dueDate.value
    };
    fetch('/add-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(task)
    })
    .then(res => res.json())
    .then(data => {
      loadTasks();
      taskInput.value = '';
      dueDate.value = '';
    })
    .catch(err => console.error('Error:', err));
  });

  // Show Courses button logic
  const showCoursesBtn = document.getElementById('showCoursesBtn');
  const coursesSection = document.getElementById('coursesSection');
  const coursesList = document.getElementById('coursesList');

  showCoursesBtn.addEventListener('click', function () {
    showCoursesBtn.disabled = true;
    showCoursesBtn.textContent = 'Loading...';
    fetch('/suggest-courses')
      .then(res => res.json())
      .then(data => {
        coursesList.innerHTML = '';
        if (data.error) {
          coursesList.textContent = 'Error: ' + data.error;
        } else if (Array.isArray(data)) {
          data.forEach(item => {
            const taskTitle = document.createElement('h4');
            taskTitle.textContent = 'Task: ' + item.task;
            coursesList.appendChild(taskTitle);
            if (Array.isArray(item.courses)) {
              const ul = document.createElement('ul');
              item.courses.forEach(course => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${course.title}</strong>: ${course.description}`;
                ul.appendChild(li);
              });
              coursesList.appendChild(ul);
            }
          });
        } else if (Array.isArray(data.courses)) {
          data.courses.forEach(item => {
            const taskTitle = document.createElement('h4');
            taskTitle.textContent = 'Task: ' + item.task;
            coursesList.appendChild(taskTitle);
            if (Array.isArray(item.courses)) {
              const ul = document.createElement('ul');
              item.courses.forEach(course => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${course.title}</strong>: ${course.description}`;
                ul.appendChild(li);
              });
              coursesList.appendChild(ul);
            }
          });
        } else {
          coursesList.textContent = 'No courses found.';
        }
        coursesSection.style.display = 'block';
        showCoursesBtn.disabled = false;
        showCoursesBtn.textContent = 'Show Courses';
      })
      .catch(err => {
        coursesList.textContent = 'Error fetching courses.';
        coursesSection.style.display = 'block';
        showCoursesBtn.disabled = false;
        showCoursesBtn.textContent = 'Show Courses';
      });
  });
});
