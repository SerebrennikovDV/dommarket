// ============================================
// ДомМаркет — каталог: фильтры и поиск
// ============================================

const CATALOG_STATE = {
  query: '',
  cats: new Set(),
  priceMin: null,
  priceMax: null,
  onlyDiscount: false
};

function initCatalog () {
  // q из URL (с шапки или из 404)
  const params = new URLSearchParams(location.search);
  CATALOG_STATE.query = params.get('q') || '';
  const catParam = params.get('cat');
  if (catParam) CATALOG_STATE.cats.add(catParam);

  const qInput = document.getElementById('catalog-search');
  if (qInput) {
    qInput.value = CATALOG_STATE.query;
    qInput.addEventListener('input', e => {
      CATALOG_STATE.query = e.target.value.trim().toLowerCase();
      renderProducts();
    });
  }

  // Чекбоксы категорий
  const catsBox = document.getElementById('filter-cats');
  if (catsBox) {
    catsBox.innerHTML = window.SITE_DATA.categories.map(c => `
      <label>
        <input type="checkbox" value="${c.id}" ${CATALOG_STATE.cats.has(c.id) ? 'checked' : ''}>
        <span>${c.icon} ${escapeHtml(c.name)} (${c.count})</span>
      </label>
    `).join('');
    catsBox.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('change', e => {
        if (e.target.checked) CATALOG_STATE.cats.add(e.target.value);
        else CATALOG_STATE.cats.delete(e.target.value);
        renderProducts();
      });
    });
  }

  // Цена
  const minEl = document.getElementById('filter-min');
  const maxEl = document.getElementById('filter-max');
  if (minEl && maxEl) {
    [minEl, maxEl].forEach(el => el.addEventListener('input', () => {
      CATALOG_STATE.priceMin = minEl.value ? Number(minEl.value) : null;
      CATALOG_STATE.priceMax = maxEl.value ? Number(maxEl.value) : null;
      renderProducts();
    }));
  }
  const sale = document.getElementById('filter-sale');
  if (sale) sale.addEventListener('change', e => {
    CATALOG_STATE.onlyDiscount = e.target.checked;
    renderProducts();
  });

  renderProducts();
}

function filterProducts () {
  const q = CATALOG_STATE.query.toLowerCase();
  return window.SITE_DATA.products.filter(p => {
    if (CATALOG_STATE.cats.size && !CATALOG_STATE.cats.has(p.cat)) return false;
    if (CATALOG_STATE.priceMin != null && p.price < CATALOG_STATE.priceMin) return false;
    if (CATALOG_STATE.priceMax != null && p.price > CATALOG_STATE.priceMax) return false;
    if (CATALOG_STATE.onlyDiscount && !(p.badge && p.badge.includes('кидк'))) return false;
    if (q) {
      const hay = (p.title + ' ' + p.description + ' ' + p.cat).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderProducts () {
  const grid = document.getElementById('products-grid');
  const counter = document.getElementById('products-count');
  if (!grid) return;

  const list = filterProducts();
  if (counter) counter.textContent = `Найдено товаров: ${list.length}`;

  if (list.length === 0) {
    grid.innerHTML = '<div class="alert alert--info" style="grid-column:1/-1;">По заданным условиям товары не найдены. Попробуйте сбросить фильтры или изменить запрос.</div>';
    return;
  }

  const cats = Object.fromEntries(window.SITE_DATA.categories.map(c => [c.id, c]));
  grid.innerHTML = list.map(p => `
    <article class="product-card">
      <div class="product-card__image" aria-hidden="true">${p.image}</div>
      <div class="product-card__body">
        ${p.badge ? `<span class="product-card__badge">${escapeHtml(p.badge)}</span>` : ''}
        <div class="product-card__cat">${escapeHtml(cats[p.cat]?.name || p.cat)}</div>
        <h3 class="product-card__title">${escapeHtml(p.title)}</h3>
        <p style="font-size:13px;color:var(--color-text-muted);margin:0 0 10px;">${escapeHtml(p.description.slice(0, 90))}${p.description.length > 90 ? '…' : ''}</p>
        <div class="product-card__price">${formatPrice(p.price)}</div>
        <button class="btn btn--block" onclick="addToCart(${p.id})">В корзину</button>
      </div>
    </article>
  `).join('');
}

function addToCart (id) {
  const cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) || '[]');
  cart.push({ id, ts: Date.now() });
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  const product = window.SITE_DATA.products.find(p => p.id === id);
  if (product) {
    alert(`«${product.title}» добавлен в корзину`);
  }
}
