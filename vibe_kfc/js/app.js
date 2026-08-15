/**
 * KFC Landing Page - Vanilla JavaScript Application
 * Handles CSV Fetching, Robust Parsing, Dynamic Rendering, Filtering & UI Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    products: [],
    activeCategory: 'all',
    isLoading: true,
    error: null,
  };

  // DOM Elements
  const featuredGrid = document.getElementById('featured-grid');
  const menuGrid = document.getElementById('menu-grid');
  const filterTabs = document.getElementById('filter-tabs');
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  /**
   * Format number to Vietnamese Currency (e.g. 45000 -> 45.000 ₫)
   * @param {number|string} price 
   * @returns {string}
   */
  function formatPrice(price) {
    const numericPrice = Number(price) || 0;
    try {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(numericPrice);
    } catch (e) {
      return `${numericPrice.toLocaleString('vi-VN')} ₫`;
    }
  }

  /**
   * Robust CSV Parser that handles quoted values containing commas and linebreaks
   * @param {string} text 
   * @returns {Array<Object>}
   */
  function parseCSV(text) {
    if (!text || !text.trim()) return [];

    const lines = [];
    let currentRow = [];
    let currentCell = '';
    let insideQuotes = false;

    // Standardize newlines
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          currentCell += '"';
          i++;
        } else {
          // Toggle quote mode
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n' && !insideQuotes) {
        currentRow.push(currentCell.trim());
        if (currentRow.length > 0 && currentRow.some(cell => cell !== '')) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    // Push last cell & row if remaining
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.length > 0 && currentRow.some(cell => cell !== '')) {
        lines.push(currentRow);
      }
    }

    if (lines.length < 2) return [];

    const headers = lines[0].map(h => h.toLowerCase().trim());
    const dataRows = lines.slice(1);

    return dataRows.map(row => {
      const item = {};
      headers.forEach((header, index) => {
        let val = row[index] !== undefined ? row[index] : '';
        // Remove surrounding quotes if still present
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1).replace(/""/g, '"');
        }
        item[header] = val.trim();
      });
      return item;
    });
  }

  /**
   * Create a single Product Card DOM element
   * @param {Object} product 
   * @returns {HTMLElement}
   */
  function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.dataset.id = product.id;
    card.dataset.category = product.category;

    // Image container
    const imageWrap = document.createElement('div');
    imageWrap.className = 'product-card__image-wrap';

    const img = document.createElement('img');
    img.src = product.image || 'assets/images/chicken-crispy.svg';
    img.alt = product.name || 'Sản phẩm KFC';
    img.loading = 'lazy';
    img.onerror = () => {
      img.src = 'assets/images/chicken-crispy.svg'; // Fallback image
    };

    imageWrap.appendChild(img);

    if (product.featured === 'true') {
      const badge = document.createElement('span');
      badge.className = 'product-card__badge';
      badge.textContent = '★ Nổi bật';
      imageWrap.appendChild(badge);
    }

    // Content container
    const content = document.createElement('div');
    content.className = 'product-card__content';

    const categorySpan = document.createElement('span');
    categorySpan.className = 'product-card__category';
    categorySpan.textContent = product.category || 'Món KFC';

    const title = document.createElement('h3');
    title.className = 'product-card__title';
    title.textContent = product.name;

    const desc = document.createElement('p');
    desc.className = 'product-card__desc';
    desc.textContent = product.description || 'Thơm ngon chuẩn vị KFC hảo hạng.';

    const footer = document.createElement('div');
    footer.className = 'product-card__footer';

    const price = document.createElement('strong');
    price.className = 'product-card__price';
    price.textContent = formatPrice(product.price);

    footer.appendChild(price);

    // Assemble card
    content.appendChild(categorySpan);
    content.appendChild(title);
    content.appendChild(desc);
    content.appendChild(footer);

    card.appendChild(imageWrap);
    card.appendChild(content);

    return card;
  }

  /**
   * Render Featured products section
   */
  function renderFeatured() {
    if (!featuredGrid) return;
    featuredGrid.innerHTML = '';

    const featuredItems = state.products.filter(item => item.featured === 'true');

    if (featuredItems.length === 0) {
      // Fallback: pick first 4 if no explicit featured
      const fallbackItems = state.products.slice(0, 4);
      fallbackItems.forEach(item => {
        featuredGrid.appendChild(createProductCard(item));
      });
      return;
    }

    featuredItems.slice(0, 4).forEach(item => {
      featuredGrid.appendChild(createProductCard(item));
    });
  }

  /**
   * Render Menu products section with active category filter
   */
  function renderMenu() {
    if (!menuGrid) return;
    menuGrid.innerHTML = '';

    let filtered = state.products;
    if (state.activeCategory !== 'all') {
      filtered = state.products.filter(item => 
        item.category.trim().toLowerCase() === state.activeCategory.trim().toLowerCase()
      );
    }

    if (filtered.length === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'state-container';
      emptyBox.innerHTML = '<p>Không có sản phẩm nào thuộc danh mục này.</p>';
      menuGrid.appendChild(emptyBox);
      return;
    }

    filtered.forEach(item => {
      menuGrid.appendChild(createProductCard(item));
    });
  }

  /**
   * Display Loading State in grids
   */
  function showLoading() {
    const loadingHTML = `
      <div class="state-container">
        <div class="spinner"></div>
        <p>Đang tải danh sách món ngon KFC...</p>
      </div>
    `;
    if (featuredGrid) featuredGrid.innerHTML = loadingHTML;
    if (menuGrid) menuGrid.innerHTML = loadingHTML;
  }

  /**
   * Display Error State in grids
   */
  function showError(msg) {
    const errorHTML = `
      <div class="state-container state-error">
        <p>⚠️ Không thể tải menu. Vui lòng thử lại sau.</p>
      </div>
    `;
    if (featuredGrid) featuredGrid.innerHTML = errorHTML;
    if (menuGrid) menuGrid.innerHTML = errorHTML;
    console.error('[KFC App Error]:', msg);
  }

  /**
   * Fetch and Load products from CSV
   */
  async function loadProducts() {
    showLoading();
    try {
      const response = await fetch('data/menu.csv');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const csvText = await response.text();
      const parsedData = parseCSV(csvText);

      if (!parsedData || parsedData.length === 0) {
        throw new Error('Dữ liệu CSV rỗng hoặc không đúng định dạng');
      }

      state.products = parsedData;
      state.isLoading = false;

      renderFeatured();
      renderMenu();
    } catch (err) {
      state.isLoading = false;
      state.error = err.message;
      showError(err);
    }
  }

  /**
   * Handle Category Filter clicks
   */
  if (filterTabs) {
    filterTabs.addEventListener('click', (e) => {
      const button = e.target.closest('.filter-btn');
      if (!button) return;

      const category = button.dataset.category || 'all';
      state.activeCategory = category;

      // Update active class on buttons
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn === button);
      });

      renderMenu();
    });
  }

  /**
   * Mobile Navigation Toggle
   */
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('is-active');
      mobileToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when clicking nav links
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('is-active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
        navMenu.classList.remove('is-active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Active section indicator on scroll
  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY + 100;
    const sections = document.querySelectorAll('section[id]');

    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  });

  // Initialize application
  loadProducts();
});
