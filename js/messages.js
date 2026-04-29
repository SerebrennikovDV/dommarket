// ============================================
// ДомМаркет — обмен сообщениями (клиент ↔ администратор)
// ============================================

function getMessages () {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
}
function saveMessages (msgs) {
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(msgs));
}

// Сообщения, в которых участвует пользователь
function getThreadFor (currentLogin, otherLogin) {
  return getMessages()
    .filter(m =>
      (m.from === currentLogin && m.to === otherLogin) ||
      (m.from === otherLogin && m.to === currentLogin)
    )
    .sort((a, b) => new Date(a.ts) - new Date(b.ts));
}

// Список собеседников для админа: все логины, кто писал админу или кому писал админ
function getInterlocutorsForAdmin () {
  const msgs = getMessages();
  const set = new Set();
  msgs.forEach(m => {
    if (m.from === 'admin') set.add(m.to);
    if (m.to === 'admin') set.add(m.from);
  });
  return Array.from(set);
}

function sendMessage (from, to, text) {
  const msgs = getMessages();
  const id = msgs.length ? Math.max(...msgs.map(m => m.id)) + 1 : 1;
  msgs.push({ id, from, to, text, ts: new Date().toISOString() });
  saveMessages(msgs);
}

// === Рендер чата для клиента (общается с админом) ===
function renderUserChat () {
  const user = getCurrentUser();
  if (!user) return;
  const list = document.getElementById('chat-thread');
  if (!list) return;
  const thread = getThreadFor(user.login, 'admin');
  list.innerHTML = thread.length
    ? thread.map(m => `
        <div class="message-bubble message-bubble--${m.from === user.login ? 'out' : 'in'}">
          ${escapeHtml(m.text)}
          <span class="message-bubble__time">${formatDateTime(m.ts)}</span>
        </div>
      `).join('')
    : '<p style="color:var(--color-text-muted);text-align:center;padding:30px;">Здесь пока нет сообщений. Напишите администратору — мы отвечаем в течение 30 минут.</p>';
  list.scrollTop = list.scrollHeight;
}

function userSendHandler (e) {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) return;
  const text = e.target.text.value.trim();
  if (!text) return;
  sendMessage(user.login, 'admin', text);
  e.target.reset();
  renderUserChat();
}

// === Рендер чатов для админа (список собеседников + поток) ===
let _adminCurrentInterlocutor = null;

function renderAdminChats () {
  const listEl = document.getElementById('admin-chat-list');
  const threadEl = document.getElementById('admin-chat-thread');
  if (!listEl || !threadEl) return;
  const interlocutors = getInterlocutorsForAdmin();
  const users = getUsers();

  if (interlocutors.length === 0) {
    listEl.innerHTML = '<p style="padding:18px;color:var(--color-text-muted);">Нет диалогов</p>';
    threadEl.innerHTML = '';
    return;
  }
  if (!_adminCurrentInterlocutor || !interlocutors.includes(_adminCurrentInterlocutor)) {
    _adminCurrentInterlocutor = interlocutors[0];
  }

  listEl.innerHTML = interlocutors.map(login => {
    const u = users.find(x => x.login === login);
    const lastMsg = getThreadFor('admin', login).slice(-1)[0];
    return `
      <div class="messages-list__item ${login === _adminCurrentInterlocutor ? 'active' : ''}" onclick="adminSelectChat('${login}')">
        <div class="messages-list__name">${escapeHtml(u ? u.name : login)}</div>
        <div class="messages-list__preview">${lastMsg ? escapeHtml(lastMsg.text.slice(0, 50)) : '—'}</div>
      </div>
    `;
  }).join('');

  const thread = getThreadFor('admin', _adminCurrentInterlocutor);
  const otherUser = users.find(x => x.login === _adminCurrentInterlocutor);
  threadEl.innerHTML = `
    <div class="messages-thread__list" id="admin-chat-msgs">
      ${thread.map(m => `
        <div class="message-bubble message-bubble--${m.from === 'admin' ? 'out' : 'in'}">
          ${escapeHtml(m.text)}
          <span class="message-bubble__time">${formatDateTime(m.ts)}</span>
        </div>
      `).join('')}
    </div>
    <form class="messages-compose" onsubmit="adminSendHandler(event)">
      <input type="text" name="text" placeholder="Ответить ${otherUser ? otherUser.name : _adminCurrentInterlocutor}…" required>
      <button type="submit" class="btn">Отправить</button>
    </form>
  `;
  const msgs = document.getElementById('admin-chat-msgs');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

function adminSelectChat (login) {
  _adminCurrentInterlocutor = login;
  renderAdminChats();
}

function adminSendHandler (e) {
  e.preventDefault();
  const text = e.target.text.value.trim();
  if (!text || !_adminCurrentInterlocutor) return;
  sendMessage('admin', _adminCurrentInterlocutor, text);
  e.target.reset();
  renderAdminChats();
}
