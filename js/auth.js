// ============================================
// ДомМаркет — регистрация, вход, управление пользователями
// ============================================

function getUsers () {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
}
function saveUsers (users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

// === Вход ===
function loginHandler (e) {
  e.preventDefault();
  const login = e.target.login.value.trim();
  const password = e.target.password.value;
  const users = getUsers();
  const user = users.find(u => u.login === login && u.password === password);
  const msg = document.getElementById('auth-msg');
  if (!user) {
    msg.className = 'alert alert--error';
    msg.textContent = 'Неверный логин или пароль';
    return;
  }
  // Сохраняем без пароля
  const { password: _, ...safe } = user;
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safe));
  window.location.reload();
}

// === Регистрация ===
function registerHandler (e) {
  e.preventDefault();
  const f = e.target;
  const login = f.login.value.trim();
  const password = f.password.value;
  const passwordRepeat = f.password_repeat.value;
  const name = f.name.value.trim();
  const email = f.email.value.trim();
  const phone = f.phone.value.trim();
  const msg = document.getElementById('auth-msg');

  if (login.length < 3) return showMsg(msg, 'error', 'Логин — минимум 3 символа');
  if (!/^[a-zA-Z0-9_.-]+$/.test(login)) return showMsg(msg, 'error', 'Логин — только латиница, цифры, символы _.-');
  if (password.length < 6) return showMsg(msg, 'error', 'Пароль — минимум 6 символов');
  if (password !== passwordRepeat) return showMsg(msg, 'error', 'Пароли не совпадают');
  if (!name) return showMsg(msg, 'error', 'Укажите имя');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showMsg(msg, 'error', 'Некорректный email');

  const users = getUsers();
  if (users.some(u => u.login === login)) return showMsg(msg, 'error', 'Логин уже занят');
  if (users.some(u => u.email === email)) return showMsg(msg, 'error', 'Email уже зарегистрирован');

  const newUser = {
    id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1,
    login,
    password,
    role: 'user',
    name,
    email,
    phone,
    registered: new Date().toISOString().slice(0, 10)
  };
  users.push(newUser);
  saveUsers(users);

  // Авто-вход
  const { password: _, ...safe } = newUser;
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safe));
  showMsg(msg, 'success', 'Регистрация выполнена. Перенаправляем…');
  setTimeout(() => window.location.reload(), 800);
}

// === Создание пользователя из админки (сценарий «сотрудник создаёт») ===
function adminCreateUserHandler (e) {
  e.preventDefault();
  const f = e.target;
  const users = getUsers();
  const login = f.login.value.trim();
  const email = f.email.value.trim();
  const msg = document.getElementById('admin-create-msg');

  if (users.some(u => u.login === login)) return showMsg(msg, 'error', 'Логин уже занят');
  if (users.some(u => u.email === email)) return showMsg(msg, 'error', 'Email уже зарегистрирован');

  const newUser = {
    id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1,
    login,
    password: f.password.value,
    role: f.role.value,
    name: f.name.value.trim(),
    email,
    phone: f.phone.value.trim(),
    registered: new Date().toISOString().slice(0, 10)
  };
  users.push(newUser);
  saveUsers(users);
  showMsg(msg, 'success', `Пользователь «${newUser.name}» создан с ролью ${newUser.role}`);
  f.reset();
  renderUsersTable();
}

function adminDeleteUser (id) {
  if (!confirm('Удалить пользователя?')) return;
  const cur = getCurrentUser();
  if (cur && cur.id === id) return alert('Нельзя удалить самого себя');
  const users = getUsers().filter(u => u.id !== id);
  saveUsers(users);
  renderUsersTable();
}

function showMsg (el, type, text) {
  if (!el) return;
  el.className = 'alert alert--' + type;
  el.textContent = text;
}

function renderUsersTable () {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  const users = getUsers();
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.id}</td>
      <td><strong>${escapeHtml(u.login)}</strong></td>
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.phone || '')}</td>
      <td><span class="role-badge role-badge--${u.role}">${
        u.role === 'admin' ? 'Администратор' : u.role === 'manager' ? 'Менеджер' : 'Клиент'
      }</span></td>
      <td>${u.registered}</td>
      <td><button class="btn btn--sm btn--ghost" onclick="adminDeleteUser(${u.id})">Удалить</button></td>
    </tr>
  `).join('');
}
