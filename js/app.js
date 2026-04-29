// ============================================
// ДомМаркет — общая логика
// ============================================

const STORAGE_KEYS = {
  USERS: 'dm_users',
  CURRENT_USER: 'dm_current_user',
  MESSAGES: 'dm_messages',
  THEME: 'dm_theme',
  CART: 'dm_cart'
};

// ===== Инициализация хранилища =====
(function initStorage () {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(window.SITE_DATA.defaultUsers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
    const seed = [
      { id: 1, from: 'user',    to: 'admin', text: 'Здравствуйте! Подскажите, есть ли в наличии набор кастрюль (артикул 1) в магазине на Войковской?', ts: '2025-12-18T10:14:00' },
      { id: 2, from: 'admin',   to: 'user',  text: 'Добрый день! Да, в магазине на Войковской есть 4 шт. Можем зарезервировать на ваше имя на 24 часа.', ts: '2025-12-18T10:21:00' },
      { id: 3, from: 'user',    to: 'admin', text: 'Отлично, забронируйте на имя Иван Петров. Подъеду сегодня вечером.', ts: '2025-12-18T10:23:00' },
      { id: 4, from: 'admin',   to: 'user',  text: 'Готово, бронь до 19:00 завтра. Номер брони: BR-7821.', ts: '2025-12-18T10:25:00' }
    ];
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(seed));
  }
})();

// ===== Тема (стандартная / для слабовидящих) =====
function applyTheme () {
  const theme = localStorage.getItem(STORAGE_KEYS.THEME) || 'default';
  document.body.classList.toggle('theme-accessible', theme === 'accessible');
  const link = document.getElementById('theme-accessible-css');
  if (link) link.disabled = theme !== 'accessible';
  const btn = document.getElementById('a11y-toggle');
  if (btn) {
    btn.innerHTML = theme === 'accessible'
      ? '<span class="a11y-toggle__icon">👁</span>Обычная версия'
      : '<span class="a11y-toggle__icon">👁</span>Версия для слабовидящих';
  }
}
function toggleTheme () {
  const cur = localStorage.getItem(STORAGE_KEYS.THEME) || 'default';
  localStorage.setItem(STORAGE_KEYS.THEME, cur === 'default' ? 'accessible' : 'default');
  applyTheme();
}

// ===== Текущий пользователь =====
function getCurrentUser () {
  const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return raw ? JSON.parse(raw) : null;
}
function logout () {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  window.location.href = 'index.html';
}

// ===== Шапка / навигация =====
function renderHeader () {
  const user = getCurrentUser();
  const headerInner = `
    <div class="site-header__inner">
      <a href="index.html" class="logo">
        <span class="logo__icon">🏠</span>ДомМаркет
      </a>
      <form class="site-search" onsubmit="goSearch(event)">
        <input type="search" name="q" placeholder="Поиск по каталогу — например, «сковорода»" aria-label="Поиск по сайту">
        <button type="submit">Найти</button>
      </form>
      <div class="header-actions">
        <button id="a11y-toggle" type="button" class="a11y-toggle" onclick="toggleTheme()"></button>
        ${user
          ? `<a href="account.html">👤 ${escapeHtml(user.name)}</a> <a href="#" onclick="logout();return false;" class="btn btn--sm btn--ghost">Выйти</a>`
          : `<a href="account.html" class="btn btn--sm">Войти</a>`}
      </div>
    </div>
    <nav class="main-nav" aria-label="Основная навигация">
      <ul>
        <li><a href="index.html" data-nav="index">Главная</a></li>
        <li><a href="catalog.html" data-nav="catalog">Каталог</a></li>
        <li><a href="news.html" data-nav="news">Новости</a></li>
        <li><a href="stores.html" data-nav="stores">Магазины</a></li>
        <li><a href="about.html" data-nav="about">О компании</a></li>
        <li><a href="contacts.html" data-nav="contacts">Контакты</a></li>
        <li><a href="account.html" data-nav="account">Личный кабинет</a></li>
        <li><a href="sitemap.html" data-nav="sitemap">Карта сайта</a></li>
      </ul>
    </nav>
  `;
  const el = document.getElementById('site-header');
  if (el) el.innerHTML = headerInner;
  // активный пункт
  const active = document.body.dataset.page;
  document.querySelectorAll('.main-nav a').forEach(a => {
    if (a.dataset.nav === active) a.classList.add('active');
  });
}

function renderFooter () {
  const c = window.SITE_DATA.company;
  const el = document.getElementById('site-footer');
  if (!el) return;
  el.innerHTML = `
    <div class="footer-grid">
      <div>
        <h4>${c.name}</h4>
        <p style="font-size:14px;color:#cfc2af;margin:0 0 10px;">${c.tagline}</p>
        <p style="font-size:13px;color:#8a7960;margin:0;">${c.workHours}</p>
      </div>
      <div>
        <h4>Покупателям</h4>
        <ul>
          <li><a href="catalog.html">Каталог</a></li>
          <li><a href="news.html">Акции и новости</a></li>
          <li><a href="stores.html">Где купить</a></li>
          <li><a href="account.html">Личный кабинет</a></li>
        </ul>
      </div>
      <div>
        <h4>О компании</h4>
        <ul>
          <li><a href="about.html">О ДомМаркете</a></li>
          <li><a href="contacts.html">Контакты</a></li>
          <li><a href="sitemap.html">Карта сайта</a></li>
        </ul>
      </div>
      <div>
        <h4>Контакты</h4>
        <ul>
          <li>📞 ${c.phone}</li>
          <li>✉️ <a href="mailto:${c.email}">${c.email}</a></li>
          <li>📍 ${c.address}</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      © 2014–${new Date().getFullYear()} ${c.name}. Все права защищены. ИНН ${c.inn} · ОГРН ${c.ogrn}
    </div>
  `;
}

// ===== Поиск =====
function goSearch (e) {
  e.preventDefault();
  const q = e.target.q.value.trim();
  if (!q) return;
  window.location.href = 'catalog.html?q=' + encodeURIComponent(q);
}

// ===== Утилиты =====
function escapeHtml (s) {
  return String(s).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
}
function formatPrice (n) {
  return n.toLocaleString('ru-RU') + ' ₽';
}
function formatDate (iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}
function formatDateTime (iso) {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ===== Запуск =====
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  applyTheme();
});
