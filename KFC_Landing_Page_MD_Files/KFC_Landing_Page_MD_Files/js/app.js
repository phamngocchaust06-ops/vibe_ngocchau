/**
 * KFC Fried Chicken Landing Page — Core Application Logic
 * Pure JavaScript (ES6+) - CSV Data Pipeline & Dynamic UI Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  // Global State
  state: {
    products: [],
    activeCategory: 'all',
    currentOrderProduct: null,
    currentQuantity: 1
  },

  // Fallback data in case of file:// CORS limitation or network issues
  fallbackProducts: [
    {
      id: 'P001',
      name: 'Combo Gà Giòn Tiệc Tùng',
      category: 'combo',
      description: '4 miếng gà giòn kèm 1 khoai lớn và 2 ly nước ngọt',
      price: 159000,
      image: 'assets/images/combo-01.jpg',
      badge: 'Best Seller',
      featured: true
    },
    {
      id: 'P002',
      name: 'Gà Rán Giòn Cay Đặc Biệt',
      category: 'ga-ran',
      description: 'Miếng gà tẩm ướp cay nồng chiên giòn rụm nóng hổi',
      price: 45000,
      image: 'assets/images/chicken-spicy.jpg',
      badge: 'Đậm Vị Cay',
      featured: true
    },
    {
      id: 'P003',
      name: 'Burger Gà Giòn Phô Mai',
      category: 'burger',
      description: 'Burger gà chiên xù phô mai cheddar tan chảy cùng sốt sốt kem',
      price: 69000,
      image: 'assets/images/burger-01.jpg',
      badge: 'Yêu Thích',
      featured: true
    },
    {
      id: 'P004',
      name: 'Gà Rán Truyền Thống',
      category: 'ga-ran',
      description: 'Gà tẩm 11 loại thảo mộc và gia vị công thức bí truyền giòn tan',
      price: 42000,
      image: 'assets/images/chicken-01.jpg',
      badge: 'Truyền Thống',
      featured: false
    },
    {
      id: 'P005',
      name: 'Combo Đôi Bạn Thân',
      category: 'combo',
      description: '2 miếng gà giòn rụm 1 burger gà 1 khoai và 2 nước ngọt',
      price: 129000,
      image: 'assets/images/combo-02.jpg',
      badge: 'Tiết Kiệm 25%',
      featured: true
    },
    {
      id: 'P006',
      name: 'Burger Tôm Hoàng Gia',
      category: 'burger',
      description: 'Thịt tôm tươi giòn ngọt cùng sốt tartar béo ngậy thanh mát',
      price: 65000,
      image: 'assets/images/burger-02.jpg',
      badge: 'Món Mới',
      featured: false
    },
    {
      id: 'P007',
      name: 'Khoai Tây Chiên Lắc Phô Mai',
      category: 'side',
      description: 'Khoai tây chiên vàng giòn phủ lớp bột phô mai thơm lừng',
      price: 39000,
      image: 'assets/images/fries-01.jpg',
      badge: 'Ăn Vặt Hot',
      featured: false
    },
    {
      id: 'P008',
      name: 'Gà Popcorn Lắc Bột Ớt',
      category: 'side',
      description: 'Gà viên không xương giòn rụm vừa ăn thơm nồng cuốn hút',
      price: 49000,
      image: 'assets/images/popcorn-01.jpg',
      badge: 'Best Seller',
      featured: false
    },
    {
      id: 'P009',
      name: 'Combo Solo Giòn Rụm',
      category: 'combo',
      description: '1 miếng gà giòn nóng 1 khoai vừa và 1 ly nước mát lạnh',
      price: 69000,
      image: 'assets/images/combo-01.jpg',
      badge: 'Bữa Trưa Nhanh',
      featured: false
    },
    {
      id: 'P010',
      name: 'Trà Đào Hạt Chia Mát Lạnh',
      category: 'drink',
      description: 'Trà đào thanh mát giải nhiệt cùng hạt chia giòn sần sật',
      price: 29000,
      image: 'assets/images/drink-01.jpg',
      badge: 'Thanh Mát',
      featured: false
    }
  ],

  // Initialization
  async init() {
    this.setupHeaderScroll();
    this.setupMobileMenu();
    this.setupSmoothScroll();
    this.setupFilters();
    this.setupOrderModal();
    this.setupPromoCopy();

    await this.loadProducts();
  },

  // 1. Load Data from CSV
  async loadProducts() {
    const gridEl = document.getElementById('productsGrid');
    if (!gridEl) return;

    // Show loading spinner
    gridEl.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Đang tải danh sách món ngon nóng giòn...</p>
      </div>
    `;

    try {
      const response = await fetch('data/products.csv');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const csvText = await response.text();
      this.state.products = this.parseCSV(csvText);

      if (this.state.products.length === 0) {
        throw new Error('Dữ liệu CSV rỗng hoặc không đúng định dạng');
      }

      this.renderProducts();
    } catch (error) {
      console.warn('Lỗi khi tải CSV (có thể do mở file:// trực tiếp mà không qua static server):', error);
      // Use fallback dataset for offline/direct file opening resilience
      this.state.products = this.fallbackProducts;
      this.renderProducts();

      this.showToast('Dữ liệu thực đơn đã được tải thành công!', 'success');
    }
  },

  // 2. CSV Parser
  parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const products = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle simple CSV splitting
      const values = line.split(',').map(val => val.trim());
      const row = {};

      headers.forEach((header, index) => {
        row[header] = values[index] !== undefined ? values[index] : '';
      });

      // Parse & Validate types as required by schema
      const item = {
        id: row.id || `P${String(i).padStart(3, '0')}`,
        name: row.name || 'Món Gà Rán',
        category: (row.category || 'ga-ran').toLowerCase(),
        description: row.description || 'Thơm ngon giòn rụm',
        price: parseInt(row.price, 10) || 0,
        image: row.image || 'assets/images/placeholder.jpg',
        badge: row.badge || '',
        featured: String(row.featured).toLowerCase() === 'true'
      };

      products.push(item);
    }

    return products;
  },

  // 3. Render Product Cards to DOM
  renderProducts() {
    const gridEl = document.getElementById('productsGrid');
    if (!gridEl) return;

    const filtered = this.state.activeCategory === 'all'
      ? this.state.products
      : this.state.products.filter(p => p.category === this.state.activeCategory);

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="empty-state">
          <h3>Không tìm thấy món ăn phù hợp</h3>
          <p>Vui lòng chọn danh mục khác để khám phá thực đơn hấp dẫn.</p>
        </div>
      `;
      return;
    }

    const categoryNames = {
      'ga-ran': 'Gà Rán',
      'combo': 'Combo',
      'burger': 'Burger',
      'side': 'Món Kèm',
      'drink': 'Đồ Uống'
    };

    gridEl.innerHTML = filtered.map(product => {
      const formattedPrice = this.formatPrice(product.price);
      const categoryLabel = categoryNames[product.category] || product.category;

      return `
        <article class="product-card" data-id="${this.escapeHtml(product.id)}">
          <div class="product-thumb-wrap">
            ${product.badge ? `<span class="product-badge">${this.escapeHtml(product.badge)}</span>` : ''}
            <span class="product-category-tag">${this.escapeHtml(categoryLabel)}</span>
            <img 
              src="${this.escapeHtml(product.image)}" 
              alt="${this.escapeHtml(product.name)}"
              class="product-img"
              loading="lazy"
              onerror="this.onerror=null; this.src='assets/images/placeholder.jpg';"
            />
          </div>
          <div class="product-body">
            <h3 class="product-title">${this.escapeHtml(product.name)}</h3>
            <p class="product-desc">${this.escapeHtml(product.description)}</p>
            <div class="product-footer">
              <div class="product-price">${formattedPrice}</div>
              <button 
                type="button" 
                class="btn-order-card js-btn-order"
                data-id="${this.escapeHtml(product.id)}"
                data-name="${this.escapeHtml(product.name)}"
                data-price="${product.price}"
                data-image="${this.escapeHtml(product.image)}"
                data-desc="${this.escapeHtml(product.description)}"
                aria-label="Đặt món ${this.escapeHtml(product.name)}"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <span>Đặt món</span>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach order button listeners
    gridEl.querySelectorAll('.js-btn-order').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dataset = e.currentTarget.dataset;
        this.openOrderModal({
          id: dataset.id,
          name: dataset.name,
          price: parseInt(dataset.price, 10),
          image: dataset.image,
          desc: dataset.desc
        });
      });
    });
  },

  // 4. Format VND Price
  formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  },

  // 5. Category Filtering
  setupFilters() {
    const filterButtons = document.querySelectorAll('.js-filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.activeCategory = btn.dataset.category;
        this.renderProducts();
      });
    });
  },

  // 6. Header Scroll Shadow
  setupHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  },

  // 7. Mobile Menu Drawer
  setupMobileMenu() {
    const toggleBtn = document.getElementById('mobileToggle');
    const drawer = document.getElementById('mobileDrawer');
    const links = document.querySelectorAll('.mobile-nav-link');

    if (!toggleBtn || !drawer) return;

    toggleBtn.addEventListener('click', () => {
      const isOpen = drawer.classList.contains('open');
      if (isOpen) {
        drawer.classList.remove('open');
        toggleBtn.classList.remove('active');
        toggleBtn.setAttribute('aria-expanded', 'false');
      } else {
        drawer.classList.add('open');
        toggleBtn.classList.add('active');
        toggleBtn.setAttribute('aria-expanded', 'true');
      }
    });

    links.forEach(link => {
      link.addEventListener('click', () => {
        drawer.classList.remove('open');
        toggleBtn.classList.remove('active');
        toggleBtn.setAttribute('aria-expanded', 'false');
      });
    });
  },

  // 8. Smooth Scrolling
  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#' || targetId.length <= 1) return;

        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          const headerHeight = 72;
          const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  },

  // 9. Order Demo Modal
  setupOrderModal() {
    const modalOverlay = document.getElementById('orderModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    const minusBtn = document.getElementById('qtyMinus');
    const plusBtn = document.getElementById('qtyPlus');
    const submitBtn = document.getElementById('modalConfirmBtn');

    if (!modalOverlay) return;

    closeBtn?.addEventListener('click', () => this.closeOrderModal());
    
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        this.closeOrderModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        this.closeOrderModal();
      }
    });

    minusBtn?.addEventListener('click', () => {
      if (this.state.currentQuantity > 1) {
        this.state.currentQuantity--;
        this.updateModalValues();
      }
    });

    plusBtn?.addEventListener('click', () => {
      if (this.state.currentQuantity < 20) {
        this.state.currentQuantity++;
        this.updateModalValues();
      }
    });

    submitBtn?.addEventListener('click', () => {
      const item = this.state.currentOrderProduct;
      const qty = this.state.currentQuantity;

      if (item && typeof CartModule !== 'undefined') {
        CartModule.addItem(item, qty);
      }

      this.closeOrderModal();
    });
  },

  openOrderModal(product) {
    this.state.currentOrderProduct = product;
    this.state.currentQuantity = 1;

    const modal = document.getElementById('orderModal');
    const imgEl = document.getElementById('modalImg');
    const titleEl = document.getElementById('modalTitle');
    const descEl = document.getElementById('modalDesc');

    if (imgEl) imgEl.src = product.image;
    if (titleEl) titleEl.textContent = product.name;
    if (descEl) descEl.textContent = product.desc;

    this.updateModalValues();

    modal?.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeOrderModal() {
    const modal = document.getElementById('orderModal');
    modal?.classList.remove('active');
    document.body.style.overflow = '';
  },

  updateModalValues() {
    const qtyNumberEl = document.getElementById('qtyNumber');
    const priceEl = document.getElementById('modalPrice');

    if (qtyNumberEl) qtyNumberEl.textContent = this.state.currentQuantity;
    if (priceEl && this.state.currentOrderProduct) {
      const totalPrice = this.state.currentOrderProduct.price * this.state.currentQuantity;
      priceEl.textContent = this.formatPrice(totalPrice);
    }
  },

  // 10. Promo Code Copy
  setupPromoCopy() {
    const copyBtn = document.getElementById('btnCopyCoupon');
    const couponCode = document.getElementById('promoCodeText');

    if (!copyBtn || !couponCode) return;

    copyBtn.addEventListener('click', () => {
      const code = couponCode.textContent.trim();
      navigator.clipboard.writeText(code).then(() => {
        copyBtn.textContent = 'Đã chép!';
        this.showToast(`✨ Đã sao chép mã "${code}" giảm 30%!`, 'success');
        setTimeout(() => {
          copyBtn.textContent = 'Sao chép';
        }, 2500);
      }).catch(() => {
        this.showToast(`Mã ưu đãi của bạn: ${code}`);
      });
    });
  },

  // 11. Toast System
  showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : ''}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  // Utility: HTML Escaping
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
