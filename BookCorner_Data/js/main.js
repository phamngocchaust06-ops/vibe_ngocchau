const DATA_URLS = ['data/books.json', 'books.json'];
const state = { books: [], categories: [], category: 'all', search: '', sort: 'newest' };

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
  const isNew = book.year >= 2025;
  return `<article class="book-card"><a href="products.html#book-${book.id}" aria-label="Xem ${cleanText(book.title)}"><div class="book-cover">${isNew ? '<span class="book-badge">MỚI</span>' : ''}<img src="images/products/${encodeURI(book.image)}" alt="Bìa sách ${cleanText(book.title)}" loading="lazy" onerror="this.style.display='none'"></div><h3>${cleanText(book.title)}</h3><p class="book-author">${cleanText(book.author)}</p><div class="book-price">${formatPrice(book.price)}</div></a></article>`;
}

function renderCategories() {
  const tabs = document.querySelector('.category-tabs');
  if (!tabs) return;
  tabs.innerHTML = `<button class="filter-button ${state.category === 'all' ? 'active' : ''}" data-category="all">Tất cả</button>` + state.categories.map((category) => `<button class="filter-button ${state.category === String(category.id) ? 'active' : ''}" data-category="${category.id}">${category.name}</button>`).join('');
  tabs.querySelectorAll('.filter-button').forEach((button) => button.addEventListener('click', () => { state.category = button.dataset.category; renderCategories(); renderCatalog(); }));
}

function filteredBooks() {
  let books = state.books.filter((book) => (state.category === 'all' || String(book.categoryId) === state.category) && `${book.title} ${book.author}`.toLowerCase().includes(state.search.toLowerCase()));
  return books.sort((a, b) => state.sort === 'price-low' ? a.price - b.price : state.sort === 'price-high' ? b.price - a.price : state.sort === 'name' ? a.title.localeCompare(b.title) : b.year - a.year);
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
  grid.innerHTML = [...state.books].sort((a, b) => b.year - a.year || b.id - a.id).slice(0, 4).map(bookCard).join('');
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

function setupCarousel() {
  const carousel = document.querySelector('[data-carousel]'); if (!carousel) return;
  const slides = [...carousel.querySelectorAll('.carousel-slide')]; const dots = carousel.querySelector('[data-carousel-dots]'); let index = 0;
  dots.innerHTML = slides.map((_, i) => `<i class="${i === 0 ? 'active' : ''}"></i>`).join('');
  const show = (next) => { index = (next + slides.length) % slides.length; slides.forEach((slide, i) => slide.classList.toggle('active', i === index)); dots.querySelectorAll('i').forEach((dot, i) => dot.classList.toggle('active', i === index)); };
  carousel.querySelector('[data-carousel-prev]').addEventListener('click', () => show(index - 1)); carousel.querySelector('[data-carousel-next]').addEventListener('click', () => show(index + 1));
  setInterval(() => show(index + 1), 5000);
}

setupNavigation(); setupInteractions(); setupCarousel(); loadBooks().catch(() => { document.querySelectorAll('[data-book-grid]').forEach((grid) => { grid.innerHTML = '<p class="empty-state">Dữ liệu sách chưa sẵn sàng. Vui lòng tải lại trang.</p>'; }); });
