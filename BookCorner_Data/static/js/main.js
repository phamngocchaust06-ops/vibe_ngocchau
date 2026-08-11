const DATA_URLS = ['/api/books', 'data/books.json', 'books.json'];
const state = { books: [], categories: [], category: 'all', search: '', sort: 'newest', cart: JSON.parse(localStorage.getItem('bookCornerCart') || '[]') };

const formatPrice = (price) => price ? new Intl.NumberFormat('vi-VN').format(price) + ' đ' : 'Liên hệ';
const cleanText = (value) => value || 'Đang cập nhật';

async function loadBooks() {
  let response;
  for (const url of DATA_URLS) {
    try { response = await fetch(url); if (response.ok) break; } catch (error) { /* Try the next path. */ }
  }
  if (!response || !response.ok) throw new Error('Không thể tải dữ liệu sách');
  const data = await response.json();
  state.books = data.books || [];
  state.categories = data.categories || [];
  renderPage();
}

function getCategoryName(id) {
  return state.categories.find((category) => category.id === id)?.name || 'Khác';
}

function bookCard(book) {
  const isNew = (book.year || book.publish_year) >= 2025;
  return `<article class="book-card" id="book-${book.id}"><a href="/products.html#book-${book.id}" aria-label="Xem ${cleanText(book.title)}"><div class="book-cover">${isNew ? '<span class="book-badge">MỚI</span>' : ''}<img src="/static/images/products/${encodeURI(book.image)}" alt="Bìa sách ${cleanText(book.title)}" loading="lazy" onerror="this.style.display='none'"></div><h3>${cleanText(book.title)}</h3><p class="book-author">${cleanText(book.author)}</p><div class="book-price">${formatPrice(book.price)}</div></a><button class="add-cart-button" type="button" data-add-cart="${book.id}">Thêm vào giỏ <span>+</span></button></article>`;
}

function renderCategories() {
  const tabs = document.querySelector('.category-tabs');
  if (!tabs) return;
  tabs.innerHTML = `<button class="filter-button ${state.category === 'all' ? 'active' : ''}" data-category="all">Tất cả</button>` + state.categories.map((category) => `<button class="filter-button ${state.category === String(category.id) ? 'active' : ''}" data-category="${category.id}">${category.name}</button>`).join('');
  tabs.querySelectorAll('.filter-button').forEach((button) => button.addEventListener('click', () => { state.category = button.dataset.category; renderCategories(); renderCatalog(); }));
}

function filteredBooks() {
  let books = state.books.filter((book) => (state.category === 'all' || String(book.categoryId ?? book.category_id) === state.category) && `${book.title} ${book.author}`.toLowerCase().includes(state.search.toLowerCase()));
  return books.sort((a, b) => state.sort === 'price-low' ? a.price - b.price : state.sort === 'price-high' ? b.price - a.price : state.sort === 'name' ? a.title.localeCompare(b.title) : (b.year || b.publish_year || 0) - (a.year || a.publish_year || 0));
}

function renderCatalog() {
  const grid = document.querySelector('.products-section [data-book-grid]');
  if (!grid) return;
  const books = filteredBooks();
  grid.innerHTML = books.map(bookCard).join('');
  const count = document.querySelector('[data-results-count]'); if (count) count.textContent = `${books.length} tựa sách`;
  const empty = document.querySelector('.empty-state'); if (empty) empty.hidden = books.length > 0;
}

function renderHome() {
  const grid = document.querySelector('.book-grid-home');
  if (!grid) return;
  grid.innerHTML = [...state.books].sort((a, b) => (b.year || b.publish_year || 0) - (a.year || a.publish_year || 0) || b.id - a.id).slice(0, 4).map(bookCard).join('');
}

function renderPage() { renderCategories(); renderCatalog(); renderHome(); }

function setupNavigation() {
  const page = document.body.dataset.page;
  document.querySelector(`[data-nav="${page}"]`)?.classList.add('active');
  const toggle = document.querySelector('.menu-toggle'); const nav = document.querySelector('.main-nav');
  toggle?.addEventListener('click', () => { const open = nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); });
}

function setupInteractions() {
  document.querySelector('#book-search')?.addEventListener('input', (event) => { state.search = event.target.value; renderCatalog(); });
  document.querySelector('#sort-books')?.addEventListener('change', (event) => { state.sort = event.target.value; renderCatalog(); });
  const form = document.querySelector('#feedback-form');
  form?.addEventListener('submit', (event) => { event.preventDefault(); if (!form.checkValidity()) { form.reportValidity(); return; } form.reset(); showToast('Cảm ơn bạn! Feedback đã được ghi nhận.'); });
}

function showToast(message) { const toast = document.querySelector('.toast'); if (!toast) return; toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 4000); }

function saveCart() { localStorage.setItem('bookCornerCart', JSON.stringify(state.cart)); }
function cartCount() { return state.cart.reduce((total, item) => total + item.quantity, 0); }
function cartTotal() { return state.cart.reduce((total, item) => total + item.price * item.quantity, 0); }
function renderCart() {
  const items = document.querySelector('[data-cart-items]'); const total = document.querySelector('[data-cart-total]'); const count = document.querySelector('[data-cart-count]');
  if (!items || !total || !count) return;
  count.textContent = cartCount(); count.hidden = cartCount() === 0; total.textContent = formatPrice(cartTotal());
  items.innerHTML = state.cart.length ? state.cart.map((item) => `<div class="cart-item"><img src="/static/images/products/${encodeURI(item.image)}" alt=""><div class="cart-item-info"><strong>${item.title}</strong><small>${formatPrice(item.price)}</small><div class="quantity-control"><button type="button" data-cart-minus="${item.id}">−</button><span>${item.quantity}</span><button type="button" data-cart-plus="${item.id}">+</button></div></div><button class="cart-remove" type="button" data-cart-remove="${item.id}" aria-label="Xóa ${item.title}">×</button></div>`).join('') : '<p class="cart-empty">Giỏ hàng đang trống.<br>Hãy chọn một cuốn sách bạn yêu thích.</p>';
}
function setupCart() {
  const nav = document.querySelector('.nav-wrap'); if (!nav) return;
  nav.insertAdjacentHTML('beforeend', '<button class="cart-trigger" type="button" data-cart-open aria-label="Mở giỏ hàng">Giỏ hàng <span class="cart-count" data-cart-count hidden>0</span></button><aside class="cart-drawer" data-cart-drawer aria-label="Giỏ hàng"><div class="cart-heading"><h2>Giỏ hàng</h2><button type="button" data-cart-close aria-label="Đóng giỏ hàng">×</button></div><div class="cart-items" data-cart-items></div><div class="cart-summary"><div><span>Tạm tính</span><strong data-cart-total>0 đ</strong></div><button class="button button-dark" type="button" data-cart-checkout>Tiến hành đặt hàng <span>→</span></button></div></aside><div class="cart-overlay" data-cart-close></div>');
  const drawer = document.querySelector('[data-cart-drawer]'); const openCart = () => { drawer.classList.add('open'); document.querySelector('.cart-overlay').classList.add('open'); }; const closeCart = () => { drawer.classList.remove('open'); document.querySelector('.cart-overlay').classList.remove('open'); };
  document.querySelector('[data-cart-open]').addEventListener('click', openCart); document.querySelectorAll('[data-cart-close]').forEach((button) => button.addEventListener('click', closeCart));
  document.body.addEventListener('click', (event) => {
    const add = event.target.closest('[data-add-cart]'); if (add) { const book = state.books.find((item) => String(item.id) === add.dataset.addCart); if (!book) return; const existing = state.cart.find((item) => item.id === book.id); if (existing) existing.quantity += 1; else state.cart.push({ id: book.id, title: book.title, price: book.price, image: book.image, quantity: 1 }); saveCart(); renderCart(); showToast('Đã thêm sách vào giỏ hàng.'); return; }
    const id = Number(event.target.dataset.cartPlus || event.target.dataset.cartMinus || event.target.dataset.cartRemove); if (!id) return; const item = state.cart.find((entry) => entry.id === id); if (event.target.dataset.cartPlus && item) item.quantity += 1; if (event.target.dataset.cartMinus && item) item.quantity -= 1; if (event.target.dataset.cartRemove || item?.quantity <= 0) state.cart = state.cart.filter((entry) => entry.id !== id); saveCart(); renderCart();
  });
  document.querySelector('[data-cart-checkout]').addEventListener('click', () => state.cart.length ? showToast('Giỏ hàng đã sẵn sàng. Tính năng đặt hàng sẽ được kết nối sau.') : showToast('Vui lòng thêm sách vào giỏ hàng trước.'));
  renderCart();
}

function setupCarousel() {
  const carousel = document.querySelector('[data-carousel]'); if (!carousel) return;
  const slides = [...carousel.querySelectorAll('.carousel-slide')]; const dots = carousel.querySelector('[data-carousel-dots]'); let index = 0;
  dots.innerHTML = slides.map((_, i) => `<i class="${i === 0 ? 'active' : ''}"></i>`).join('');
  const show = (next) => { index = (next + slides.length) % slides.length; slides.forEach((slide, i) => slide.classList.toggle('active', i === index)); dots.querySelectorAll('i').forEach((dot, i) => dot.classList.toggle('active', i === index)); };
  carousel.querySelector('[data-carousel-prev]').addEventListener('click', () => show(index - 1)); carousel.querySelector('[data-carousel-next]').addEventListener('click', () => show(index + 1));
  setInterval(() => show(index + 1), 5000);
}

setupNavigation(); setupInteractions(); setupCarousel(); setupCart(); loadBooks().catch(() => { document.querySelectorAll('[data-book-grid]').forEach((grid) => { grid.innerHTML = '<p class="empty-state">Dữ liệu sách chưa sẵn sàng. Vui lòng tải lại trang.</p>'; }); });
