/**
 * KFC Fried Chicken Landing Page — Module 1: Giỏ Hàng (Cart Module)
 * Standalone State Management, LocalStorage Sync, Slide-over Drawer UI, Promo System & SQLite Persistence
 */

const CartModule = {
  STORAGE_KEY: 'kfc_fried_chicken_cart_v1',

  // State
  state: {
    items: [],
    promoCode: '',
    discountPercent: 0,
    shippingFee: 0
  },

  // Promo Code Dictionary
  promoCodes: {
    'GIONRUM2026': { discount: 0.30, label: 'Giảm 30% Combo Tiệc Tùng' },
    'KFCVIBE': { discount: 0.20, label: 'Giảm 20% Vibe Coding' },
    'FREESHIP': { discount: 0.10, label: 'Giảm 10% & Miễn Phí Giao Hàng' }
  },

  // Initialize Module
  init() {
    this.loadFromStorage();
    this.bindEvents();
    this.render();
  },

  // Event Listeners Binding
  bindEvents() {
    // Open Cart Triggers (Header button & Floating button)
    document.querySelectorAll('.js-cart-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openDrawer();
      });
    });

    // Close Drawer Trigger
    const closeBtn = document.getElementById('cartCloseBtn');
    const overlay = document.getElementById('cartOverlay');

    closeBtn?.addEventListener('click', () => this.closeDrawer());
    
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeDrawer();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay?.classList.contains('active')) {
        this.closeDrawer();
      }
    });

    // Clear Cart Button
    const clearBtn = document.getElementById('cartClearBtn');
    clearBtn?.addEventListener('click', () => {
      if (this.state.items.length > 0 && confirm('Bạn có chắc chắn muốn xoá toàn bộ món trong giỏ hàng?')) {
        this.clearCart();
      }
    });

    // Checkout Button Trigger
    const checkoutBtn = document.getElementById('cartCheckoutBtn');
    checkoutBtn?.addEventListener('click', () => this.handleCheckout());

    // Checkout Modal Event Listeners
    const checkoutModal = document.getElementById('checkoutModal');
    const checkoutCloseBtn = document.getElementById('checkoutCloseBtn');
    const checkoutCancelBtn = document.getElementById('checkoutCancelBtn');
    const checkoutForm = document.getElementById('checkoutForm');

    const closeCheckoutModal = () => {
      checkoutModal?.classList.remove('active');
      document.body.style.overflow = '';
    };

    checkoutCloseBtn?.addEventListener('click', closeCheckoutModal);
    checkoutCancelBtn?.addEventListener('click', closeCheckoutModal);

    // Checkout form submission is fully handled by CheckoutModule.processCheckout (js/checkout.js)
    // This ensures payment method, strict validation, and server-side SQLite save all work correctly.
  },

  // 1. Add Item to Cart
  addItem(product, quantity = 1) {
    const qty = parseInt(quantity, 10) || 1;
    const existingIndex = this.state.items.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
      this.state.items[existingIndex].quantity += qty;
    } else {
      this.state.items.push({
        id: product.id,
        name: product.name,
        price: parseInt(product.price, 10),
        image: product.image || 'assets/images/placeholder.jpg',
        category: product.category || 'ga-ran',
        quantity: qty
      });
    }

    this.saveToStorage();
    this.render();
    this.triggerBadgeAnimation();

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(`🍗 Đã thêm "${product.name}" (${qty}) vào giỏ hàng!`, 'success');
    }
  },

  // 2. Update Quantity
  updateQuantity(productId, newQty) {
    const qty = parseInt(newQty, 10);
    const index = this.state.items.findIndex(item => item.id === productId);

    if (index === -1) return;

    if (qty <= 0) {
      this.state.items.splice(index, 1);
    } else {
      this.state.items[index].quantity = qty;
    }

    this.saveToStorage();
    this.render();
  },

  // 3. Remove Item
  removeItem(productId) {
    this.state.items = this.state.items.filter(item => item.id !== productId);
    this.saveToStorage();
    this.render();

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('Đã xoá món khỏi giỏ hàng.');
    }
  },

  // 4. Clear Entire Cart
  clearCart() {
    this.state.items = [];
    this.saveToStorage();
    this.render();

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('Đã làm trống giỏ hàng.');
    }
  },

  // 5. Apply Promo Code
  applyPromo(code) {
    if (!code) {
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('Vui lòng nhập mã ưu đãi.');
      }
      return;
    }

    const promo = this.promoCodes[code];
    if (promo) {
      this.state.promoCode = code;
      this.state.discountPercent = promo.discount;
      this.saveToStorage();
      this.render();

      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast(`🎉 Áp dụng thành công mã "${code}": ${promo.label}!`, 'success');
      }
    } else {
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('Mã khuyến mãi không tồn tại hoặc đã hết hạn.');
      }
    }
  },

  // 6. Remove Promo Code
  removePromo() {
    this.state.promoCode = '';
    this.state.discountPercent = 0;
    this.saveToStorage();
    this.render();

    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('Đã huỷ áp dụng mã khuyến mãi.');
    }
  },

  // 7. Calculate Order Totals
  calculateTotals() {
    const subtotal = this.state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = Math.round(subtotal * this.state.discountPercent);
    const shipping = subtotal > 0 ? this.state.shippingFee : 0;
    const finalTotal = Math.max(0, subtotal - discountAmount + shipping);
    const totalCount = this.state.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotal,
      discountAmount,
      shipping,
      finalTotal,
      totalCount
    };
  },

  // 8. Format Currency (VND)
  formatPrice(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  },

  // 9. Drawer Controls
  openDrawer() {
    const overlay = document.getElementById('cartOverlay');
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeDrawer() {
    const overlay = document.getElementById('cartOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  // 10. Badge Animation
  triggerBadgeAnimation() {
    document.querySelectorAll('.cart-badge, .floating-cart-badge').forEach(badge => {
      badge.classList.remove('bump');
      void badge.offsetWidth; // trigger reflow
      badge.classList.add('bump');
    });
  },

  // 11. Render UI
  render() {
    const { subtotal, discountAmount, shipping, finalTotal, totalCount } = this.calculateTotals();

    // Update Badges
    document.querySelectorAll('.cart-badge').forEach(el => {
      el.textContent = totalCount;
      el.style.display = totalCount > 0 ? 'flex' : 'none';
    });

    const floatingBtn = document.getElementById('floatingCartBtn');
    const floatingBadge = document.getElementById('floatingCartBadge');
    if (floatingBtn && floatingBadge) {
      floatingBadge.textContent = totalCount;
      floatingBtn.style.display = totalCount > 0 ? 'flex' : 'none';
    }

    const headerCount = document.getElementById('cartHeaderCount');
    if (headerCount) {
      headerCount.textContent = `${totalCount} món`;
    }

    // Render Cart Body Items / Empty State
    const cartBody = document.getElementById('cartBody');
    const cartFooter = document.getElementById('cartFooter');

    if (!cartBody) return;

    if (this.state.items.length === 0) {
      cartBody.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">🛒</div>
          <h3 class="cart-empty-title">Giỏ hàng đang trống</h3>
          <p class="cart-empty-desc">Chưa có món ngon nào được chọn. Hãy khám phá thực đơn gà rán hấp dẫn ngay thôi!</p>
          <a href="#menu" class="btn btn-primary btn-sm" id="cartExploreMenuBtn">
            <span>Khám phá thực đơn</span>
          </a>
        </div>
      `;
      if (cartFooter) cartFooter.style.display = 'none';

      document.getElementById('cartExploreMenuBtn')?.addEventListener('click', () => {
        this.closeDrawer();
      });
      return;
    }

    if (cartFooter) cartFooter.style.display = 'flex';

    // Render Items
    cartBody.innerHTML = `
      <div class="cart-items-list">
        ${this.state.items.map(item => `
          <div class="cart-item" data-id="${this.escapeHtml(item.id)}">
            <img 
              src="${this.escapeHtml(item.image)}" 
              alt="${this.escapeHtml(item.name)}" 
              class="cart-item-img"
              onerror="this.onerror=null; this.src='assets/images/placeholder.jpg';"
            />
            <div class="cart-item-info">
              <h4 class="cart-item-name">${this.escapeHtml(item.name)}</h4>
              <div class="cart-item-price">${this.formatPrice(item.price * item.quantity)}</div>
              <div class="cart-item-actions">
                <div class="cart-qty-wrapper">
                  <button type="button" class="cart-qty-btn js-cart-minus" data-id="${this.escapeHtml(item.id)}" aria-label="Giảm">-</button>
                  <span class="cart-qty-val">${item.quantity}</span>
                  <button type="button" class="cart-qty-btn js-cart-plus" data-id="${this.escapeHtml(item.id)}" aria-label="Tăng">+</button>
                </div>
                <button type="button" class="cart-remove-btn js-cart-remove" data-id="${this.escapeHtml(item.id)}" aria-label="Xoá món">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  <span>Xoá</span>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Voucher Promo Box -->
      <div class="cart-promo-box">
        <form class="promo-form" id="cartPromoForm">
          <input 
            type="text" 
            id="cartPromoInput"
            class="promo-input" 
            placeholder="Nhập mã ưu đãi (vd: GIONRUM2026)" 
            value="${this.escapeHtml(this.state.promoCode)}"
            ${this.state.promoCode ? 'disabled' : ''}
          />
          ${!this.state.promoCode ? `
            <button type="submit" class="promo-apply-btn">Áp dụng</button>
          ` : ''}
        </form>

        ${this.state.promoCode ? `
          <div class="promo-applied-badge">
            <span>✨ Đã áp dụng mã <strong>${this.escapeHtml(this.state.promoCode)}</strong> (-${Math.round(this.state.discountPercent * 100)}%)</span>
            <span class="promo-remove-link" id="cartRemovePromoBtn">Gỡ bỏ</span>
          </div>
        ` : ''}
      </div>
    `;

    // Attach Item Action Listeners
    cartBody.querySelectorAll('.js-cart-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const currentItem = this.state.items.find(i => i.id === id);
        if (currentItem) {
          this.updateQuantity(id, currentItem.quantity - 1);
        }
      });
    });

    cartBody.querySelectorAll('.js-cart-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const currentItem = this.state.items.find(i => i.id === id);
        if (currentItem) {
          this.updateQuantity(id, currentItem.quantity + 1);
        }
      });
    });

    cartBody.querySelectorAll('.js-cart-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeItem(btn.dataset.id);
      });
    });

    document.getElementById('cartRemovePromoBtn')?.addEventListener('click', () => {
      this.removePromo();
    });

    // Re-bind Promo form since it was re-rendered
    const newPromoForm = document.getElementById('cartPromoForm');
    newPromoForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('cartPromoInput');
      if (input) {
        this.applyPromo(input.value.trim().toUpperCase());
      }
    });

    // Update Summary in Footer
    const subtotalEl = document.getElementById('cartSubtotal');
    const discountEl = document.getElementById('cartDiscount');
    const discountRow = document.getElementById('cartDiscountRow');
    const totalEl = document.getElementById('cartTotal');

    if (subtotalEl) subtotalEl.textContent = this.formatPrice(subtotal);
    if (totalEl) totalEl.textContent = this.formatPrice(finalTotal);

    if (discountRow && discountEl) {
      if (discountAmount > 0) {
        discountRow.style.display = 'flex';
        discountEl.textContent = `-${this.formatPrice(discountAmount)}`;
      } else {
        discountRow.style.display = 'none';
      }
    }
  },

  // 12. Checkout Modal Trigger
  handleCheckout() {
    const totals = this.calculateTotals();
    if (totals.totalCount === 0) return;

    const modal = document.getElementById('checkoutModal');
    const finalTotalEl = document.getElementById('checkoutFinalTotal');

    if (finalTotalEl) {
      finalTotalEl.textContent = this.formatPrice(totals.finalTotal);
    }

    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  // 13. Persistence (LocalStorage)
  saveToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  },

  loadFromStorage() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state.items = Array.isArray(parsed.items) ? parsed.items : [];
        this.state.promoCode = parsed.promoCode || '';
        this.state.discountPercent = parsed.discountPercent || 0;
      }
    } catch (e) {
      console.warn('Could not load cart from LocalStorage:', e);
      this.state.items = [];
    }
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

// Initialize Cart Module on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  CartModule.init();
});
