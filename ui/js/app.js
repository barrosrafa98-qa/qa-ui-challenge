const apiUrl = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      try {
        const res = await fetch(`${apiUrl}/users/1`);
        const user = await res.json();
        if(user.email === email && user.password === password){
          window.location = 'dashboard.html';
        } else {
          document.getElementById('message').innerText='Invalid credentials';
        }
      } catch(err){
        document.getElementById('message').innerText='Error connecting API';
      }
    });
  }

  // Dashboard
  const tasksTable = document.getElementById('tasksTable');
  if(tasksTable){
    fetch(`${apiUrl}/tasks/1`)
      .then(res=>res.json())
      .then(tasks=>{
        const tbody = tasksTable.querySelector('tbody');
        tasks.forEach(t=>{
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${t.title}</td><td>${t.description}</td><td>${t.status}</td>
          <td><button onclick="editTask(${t.id})">Edit</button>
              <button onclick="deleteTask(${t.id})">Delete</button></td>`;
          tbody.appendChild(tr);
        });
      });
  }
});

function editTask(id){
  window.location = `task_form.html?id=${id}`;
}

function deleteTask(id){
  fetch(`${apiUrl}/tasks/${id}`, {method:'DELETE'})
    .then(()=> window.location.reload());
}
function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

document.addEventListener('DOMContentLoaded', () => {
  const taskForm = document.getElementById('taskForm');
  if (!taskForm) return; 

  const msgEl = document.getElementById('message');
  const titleEl = document.getElementById('title');
  const descEl = document.getElementById('description');
  const statusEl = document.getElementById('status');

  const taskId = getQueryParam('id');

  if (taskId) {
    fetch(`${apiUrl}/tasks/1`)
      .then(res => res.json())
      .then(tasks => {
        const existing = tasks.find(t => String(t.id) === String(taskId));
        if (existing) {
          titleEl.value = existing.title || '';
          descEl.value = existing.description || '';
          statusEl.value = existing.status || 'pending';
        }
      })
      .catch(err => console.error('Prefill failed:', err));
  }

  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      title: titleEl.value.trim(),
      description: descEl.value.trim(),
      status: statusEl.value,
    };

    if (!payload.title) {
      msgEl.innerText = 'Title is required';
      return;
    }

    try {
      if (taskId) {
        const res = await fetch(`${apiUrl}/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`PUT failed: ${res.status}`);
      } else {
        const res = await fetch(`${apiUrl}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: 1, ...payload }), 
        });
        if (!res.ok) throw new Error(`POST failed: ${res.status}`);
      }

      window.location = 'dashboard.html';
    } catch (err) {
      console.error(err);
      msgEl.innerText = 'Failed to save task';
    }
  });
});
