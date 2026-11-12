const pb = new PocketBase('http://127.0.0.1:8090');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginCard = document.getElementById('login-card');
const registerCard = document.getElementById('register-card');
const logoutBtn = document.getElementById('logout-btn');
const userDisplayName = document.getElementById('user-display-name');

let currentUserId = null;

function updateAuthState() {
    const isValid = pb.authStore.isValid && pb.authStore.model;
    currentUserId = isValid ? pb.authStore.model.id : null;

    if (userDisplayName) {
        userDisplayName.textContent = isValid ? (pb.authStore.model.name || pb.authStore.model.email) : '';
    }

    const path = window.location.pathname;
    const isLoginPage = path.endsWith('index.html') || path.endsWith('/');
    const isTasksPage = path.endsWith('tasks.html');

    if (isValid && isLoginPage) {
        window.location.href = 'tasks.html';
    } else if (!isValid && isTasksPage) {
        window.location.href = 'index.html';
    }
}

pb.authStore.onChange(updateAuthState);
updateAuthState();

if (document.getElementById('show-register')) {
    document.getElementById('show-register').addEventListener('click', () => {
        loginCard.style.display = 'none';
        registerCard.style.display = 'block';
        clearAlerts();
    });
}

if (document.getElementById('show-login')) {
    document.getElementById('show-login').addEventListener('click', () => {
        registerCard.style.display = 'none';
        loginCard.style.display = 'block';
        clearAlerts();
    });
}

function showAlert(elementId, message, type) {
    const alert = document.getElementById(elementId);
    if (alert) {
        alert.textContent = message;
        alert.className = `alert ${type}`;
        alert.style.display = 'block';
    }
}

function clearAlerts() {
    document.querySelectorAll('.alert').forEach(a => a.style.display = 'none');
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            await pb.collection('users').authWithPassword(email, password);
            window.location.href = 'tasks.html';
        } catch (err) {
            showAlert('login-alert', 'Invalid email or password.', 'error');
        }
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const passwordConfirm = document.getElementById('reg-passwordConfirm').value;

        if (password !== passwordConfirm) {
            showAlert('register-alert', 'Passwords do not match.', 'error');
            return;
        }

        try {
            const data = {
                "username": `user_${Math.random().toString(36).substr(2, 9)}`,
                "email": email,
                "emailVisibility": true,
                "password": password,
                "passwordConfirm": passwordConfirm,
                "name": name
            };

            await pb.collection('users').create(data);
            await pb.collection('users').authWithPassword(email, password);
            window.location.href = 'tasks.html';

        } catch (err) {
            let msg = 'Registration failed.';
            if (err.data && err.data.data) {
                const firstKey = Object.keys(err.data.data)[0];
                if (firstKey) msg = `${firstKey}: ${err.data.data[firstKey].message}`;
            }
            showAlert('register-alert', msg, 'error');
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        pb.authStore.clear();
        window.location.href = 'index.html';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.endsWith('tasks.html')) return;

    if (userDisplayName && currentUserId) {
        userDisplayName.textContent = pb.authStore.model.name || pb.authStore.model.email;
    }

    const taskList = document.getElementById('task-list');
    const modal = document.getElementById('task-modal');
    const taskForm = document.getElementById('task-form');

    let isSubmitting = false;

    async function loadTasks() {
        if (!taskList) return;
        taskList.innerHTML = '<p style="text-align: center;">Loading...</p>';

        try {
            const records = await pb.collection('tasks').getFullList();
            renderTasks(records);
        } catch (err) {
            taskList.innerHTML = '<p style="text-align: center; color: red;">Failed to load tasks.</p>';
        }
    }

    function openModal(task = null) {
        if (!modal) return;
        modal.style.display = 'flex';

        const modalTitle = document.getElementById('modal-title');
        const editActions = document.getElementById('edit-actions');

        if (task) {
            modalTitle.textContent = 'Task Details';
            document.getElementById('task-id').value = task.id;
            document.getElementById('t-title').value = task.title;
            document.getElementById('t-type').value = task.type || 'Assignment';
            document.getElementById('t-priority').value = task.priority || 'Medium';
            document.getElementById('t-date').value = task.due_date ? task.due_date.split(' ')[0] : '';
            document.getElementById('t-desc').value = task.description || '';

            editActions.style.display = 'flex';
            editActions.innerHTML = `
                <button type="button" class="btn-primary" id="modal-toggle-btn">
                    ${task.is_completed ? 'Mark Incomplete' : 'Mark Complete'}
                </button>
                <button type="button" class="btn-secondary" id="modal-delete-btn" style="color: red; border-color: red;">
                    Delete
                </button>
            `;

            document.getElementById('modal-toggle-btn').onclick = () => toggleTask(task.id, !task.is_completed);
            document.getElementById('modal-delete-btn').onclick = () => deleteTaskInModal(task.id);

        } else {
            modalTitle.textContent = 'Add New Task';
            taskForm.reset();
            document.getElementById('task-id').value = '';
            document.getElementById('edit-actions').style.display = 'none';
        }
    }

    function closeModal() {
        if (modal) modal.style.display = 'none';
        isSubmitting = false;
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('add-task-btn').addEventListener('click', () => openModal());

    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        isSubmitting = true;

        try {
            const data = {
                title: document.getElementById('t-title').value,
                type: document.getElementById('t-type').value,
                priority: document.getElementById('t-priority').value,
                due_date: document.getElementById('t-date').value,
                description: document.getElementById('t-desc').value,
                user: currentUserId
            };

            const id = document.getElementById('task-id').value;

            if (id) {
                await pb.collection('tasks').update(id, data);
            } else {
                await pb.collection('tasks').create(data);
            }

            closeModal();
            loadTasks();
        } catch (err) {
            alert('Error saving task');
        } finally {
            isSubmitting = false;
        }
    });

    window.deleteTaskInModal = async (id) => {
        if (!confirm('Delete this task?')) return;
        try {
            await pb.collection('tasks').delete(id);
            closeModal();
            loadTasks();
        } catch (err) {
            alert('Error deleting task');
        }
    };

    taskList.addEventListener('click', (e) => {
        const content = e.target.closest('.task-content');
        if (content) {
            fetchAndOpenTask(content.dataset.id);
            return;
        }

        const toggleBtn = e.target.closest('[data-action="toggle"]');
        if (toggleBtn) {
            toggleTask(toggleBtn.dataset.id, toggleBtn.dataset.status === 'true');
        }

        const deleteBtn = e.target.closest('[data-action="delete"]');
        if (deleteBtn) {
            deleteTask(deleteBtn.dataset.id);
        }
    });

    async function fetchAndOpenTask(id) {
        try {
            const task = await pb.collection('tasks').getOne(id);
            openModal(task);
        } catch (err) {
            console.error(err);
        }
    }

    async function toggleTask(id, status) {
        try {
            await pb.collection('tasks').update(id, { is_completed: status });
            if (status === true && typeof confetti !== 'undefined') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
            closeModal();
            loadTasks();
        } catch (err) {
            alert('Error updating task');
        }
    }

    async function deleteTask(id) {
        if (!confirm('Are you sure?')) return;
        try {
            await pb.collection('tasks').delete(id);
            loadTasks();
        } catch (err) {
            alert('Error deleting task');
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function renderTasks(tasks) {
        if (tasks.length === 0) {
            taskList.innerHTML = '<p style="text-align: center;">No tasks yet.</p>';
            return;
        }

        taskList.innerHTML = '';
        tasks.forEach(task => {
            const div = document.createElement('div');
            const priorityClass = task.priority ? `priority-${task.priority.toLowerCase()}` : 'priority-medium';
            const completedClass = task.is_completed ? 'completed' : '';
            div.className = `task-item ${completedClass} ${priorityClass}`;

            let dateBadge = '';
            if (task.due_date) {
                dateBadge = `<span class="badge date-badge">📅 ${task.due_date.split(' ')[0]}</span>`;
            }

            let typeBadge = '';
            if (task.type) {
                const typeClass = `type-${task.type.toLowerCase()}`;
                typeBadge = `<span class="badge ${typeClass}">${task.type}</span>`;
            }

            div.innerHTML = `
                <div class="task-content" data-id="${task.id}">
                    <div class="task-header">
                         <h3>${escapeHtml(task.title || "Untitled")}</h3>
                         <div class="task-badges">${typeBadge}</div>
                    </div>
                    <p class="task-desc">${escapeHtml(task.description || "No details")}</p>
                    <div class="task-meta">${dateBadge}</div>
                </div>
                <div class="task-actions-col">
                    <button class="icon-btn ${task.is_completed ? 'is-completed' : ''}" 
                        data-action="toggle" data-id="${task.id}" data-status="${!task.is_completed}">
                        ${task.is_completed ? '↩️' : '✓'}
                    </button>
                    <button class="icon-btn action-delete" data-action="delete" data-id="${task.id}">✕</button>
                </div>
            `;
            taskList.appendChild(div);
        });
    }

    loadTasks();
});