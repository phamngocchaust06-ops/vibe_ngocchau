/**
 * KFC Fried Chicken Landing Page — Module 2: Thanh Toán (Checkout & Payment Module)
 * Handles Payment Method Selection (COD, VietQR, MoMo), Form Validation, SQLite Persistence & Receipt View
 */

const CheckoutModule = {
  // State
  state: {
    paymentMethod: 'COD', // Default payment method
    lastSavedOrder: null
  },

  // Payment method definitions & display labels
  paymentMethodsInfo: {
    'COD': {
      title: 'Tiền mặt khi nhận hàng (COD)',
      badge: 'Thanh toán trực tiếp',
      icon: '💵',
      desc: 'Thanh toán bằng tiền mặt cho shipper khi nhận được gà rán nóng hổi.'
    },
    'BANK_TRANSFER': {
      title: 'Chuyển khoản Ngân hàng / VietQR',
      badge: 'Quét mã QR tự động',
      icon: '💳',
      desc: 'Sử dụng app ngân hàng (MB, VCB, Techcombank...) quét mã VietQR để thanh toán.'
    },
    'MOMO': {
      title: 'Ví điện tử MoMo / ZaloPay',
      badge: 'Thanh toán 1-Touch',
      icon: '📱',
      desc: 'Mở ứng dụng MoMo hoặc ZaloPay để quét mã thanh toán tức thì.'
    }
  },

  // Initialization
  init() {
    this.bindEvents();
  },

  // Bind Event Listeners
  bindEvents() {
    // Payment Method Card Selection
    document.querySelectorAll('.js-payment-card').forEach(card => {
      card.addEventListener('click', () => {
        const method = card.dataset.method;
        this.selectPaymentMethod(method);
      });
    });

    // Form Submission (Checkout Submit)
    const checkoutForm = document.getElementById('checkoutForm');
    checkoutForm?.addEventListener('submit', (e) => this.processCheckout(e));

    // Cancel Button
    const cancelBtn = document.getElementById('checkoutCancelBtn');
    cancelBtn?.addEventListener('click', () => this.closeCheckoutModal());

    const closeBtn = document.getElementById('checkoutCloseBtn');
    closeBtn?.addEventListener('click', () => this.closeCheckoutModal());

    // Print Receipt Button
    document.getElementById('receiptPrintBtn')?.addEventListener('click', () => {
      window.print();
    });

    // Download DB Button
    document.getElementById('receiptDownloadDbBtn')?.addEventListener('click', () => {
      if (typeof SQLiteService !== 'undefined') {
        SQLiteService.exportDatabaseFile();
      }
    });

    // Close Receipt Button
    document.getElementById('receiptCloseBtn')?.addEventListener('click', () => {
      this.closeCheckoutModal();
    });
  },

  // 1. Open Checkout Modal
  openCheckoutModal() {
    if (typeof CartModule === 'undefined') return;

    const totals = CartModule.calculateTotals();
    if (totals.totalCount === 0) {
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('Giỏ hàng đang trống! Vui lòng chọn món trước khi thanh toán.');
      }
      CartModule.openDrawer();
      return;
    }

    // Reset Views: Show Form, Hide Receipt
    const formView = document.getElementById('checkoutFormView');
    const receiptView = document.getElementById('receiptView');

    if (formView) formView.style.display = 'block';
    if (receiptView) receiptView.style.display = 'none';

    // Render Summary Items in Checkout Modal
    this.renderSummaryItems();
    this.selectPaymentMethod(this.state.paymentMethod);

    const modal = document.getElementById('checkoutModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  // 2. Close Checkout Modal
  closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  // 3. Select Payment Method
  selectPaymentMethod(method) {
    if (!this.paymentMethodsInfo[method]) method = 'COD';
    this.state.paymentMethod = method;

    // Update Card Active Classes
    document.querySelectorAll('.js-payment-card').forEach(card => {
      if (card.dataset.method === method) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Show/Hide Dynamic QR Box
    const vietqrBox = document.getElementById('vietqrBox');
    const paymentNoteEl = document.getElementById('paymentMethodNote');

    if (paymentNoteEl) {
      paymentNoteEl.textContent = this.paymentMethodsInfo[method].desc;
    }

    if (vietqrBox) {
      if (method === 'BANK_TRANSFER' || method === 'MOMO') {
        vietqrBox.style.display = 'block';
        this.updateQRDetails(method);
      } else {
        vietqrBox.style.display = 'none';
      }
    }
  },

  // 4. Update QR Code Box Details
  updateQRDetails(method) {
    const totals = CartModule.calculateTotals();
    const qrTitle = document.getElementById('qrTitle');
    const qrBankName = document.getElementById('qrBankName');
    const qrAccNum = document.getElementById('qrAccNum');
    const qrAccHolder = document.getElementById('qrAccHolder');
    const qrAmount = document.getElementById('qrAmount');
    const qrNote = document.getElementById('qrTransferNote');
    const qrImage = document.getElementById('qrImage');

    const demoTransferCode = `KFC${Math.floor(1000 + Math.random() * 9000)}`;

    if (method === 'BANK_TRANSFER') {
      if (qrTitle) qrTitle.textContent = 'Mã VietQR Ngân Hàng';
      if (qrBankName) qrBankName.textContent = 'Vietcombank (VCB)';
      if (qrAccNum) qrAccNum.textContent = '1900 6886 99';
      if (qrAccHolder) qrAccHolder.textContent = 'KFC VIETNAM DEMO';
    } else {
      if (qrTitle) qrTitle.textContent = 'Mã Thanh Toán Ví MoMo';
      if (qrBankName) qrBankName.textContent = 'Ví điện tử MoMo';
      if (qrAccNum) qrAccNum.textContent = '0901 234 567';
      if (qrAccHolder) qrAccHolder.textContent = 'KFC VIETNAM OFFICIAL';
    }

    if (qrAmount) qrAmount.textContent = CartModule.formatPrice(totals.finalTotal);
    if (qrNote) qrNote.textContent = demoTransferCode;

    // Generate quick QR image URL via public QR API
    if (qrImage) {
      qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=KFC_ORDER_${totals.finalTotal}_${demoTransferCode}`;
    }
  },

  // 5. Render Order Summary inside Checkout
  renderSummaryItems() {
    const listEl = document.getElementById('checkoutSummaryList');
    const totals = CartModule.calculateTotals();

    if (!listEl) return;

    listEl.innerHTML = CartModule.state.items.map(item => `
      <div class="checkout-item-mini">
        <div>
          <div class="checkout-item-name">${this.escapeHtml(item.name)}</div>
          <div style="font-size: 0.76rem; color: var(--color-text-muted);">Số lượng: ${item.quantity}</div>
        </div>
        <div class="checkout-item-price">${CartModule.formatPrice(item.price * item.quantity)}</div>
      </div>
    `).join('');

    // Update Totals
    const subtotalEl = document.getElementById('chkSubtotal');
    const discountEl = document.getElementById('chkDiscount');
    const totalEl = document.getElementById('chkTotal');

    if (subtotalEl) subtotalEl.textContent = CartModule.formatPrice(totals.subtotal);
    if (discountEl) discountEl.textContent = `-${CartModule.formatPrice(totals.discountAmount)}`;
    if (totalEl) totalEl.textContent = CartModule.formatPrice(totals.finalTotal);
    
    const checkoutFinalTotal = document.getElementById('checkoutFinalTotal');
    if (checkoutFinalTotal) checkoutFinalTotal.textContent = CartModule.formatPrice(totals.finalTotal);
  },

  // 6. Strict Form Validation
  validateCustomerInfo(data) {
    const errors = {};

    // Validate Name
    if (!data.name || data.name.trim().length < 2) {
      errors.name = 'Vui lòng nhập họ và tên nhận hàng (tối thiểu 2 ký tự).';
    }

    // Validate Phone (Vietnamese Mobile Regex: 10 digits starting with 03, 05, 07, 08, 09)
    const phoneRegex = /^(03|05|07|08|09)[0-9]{8}$/;
    const cleanPhone = (data.phone || '').replace(/\s+/g, '');
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      errors.phone = 'Số điện thoại không hợp lệ (ví dụ: 0901234567 hoặc 0389998888).';
    }

    // Validate Address
    if (!data.address || data.address.trim().length < 5) {
      errors.address = 'Vui lòng nhập địa chỉ giao hàng cụ thể (tối thiểu 5 ký tự).';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // 7. Process Checkout & Save to SQLite
  async processCheckout(e) {
    e.preventDefault();

    const nameInput = document.getElementById('checkoutName');
    const phoneInput = document.getElementById('checkoutPhone');
    const addressInput = document.getElementById('checkoutAddress');
    const noteInput = document.getElementById('checkoutNote');

    const customerData = {
      name: nameInput?.value || '',
      phone: phoneInput?.value || '',
      address: addressInput?.value || '',
      note: noteInput?.value || '',
      paymentMethod: this.state.paymentMethod,
      promoCode: CartModule.state.promoCode
    };

    // Clear Previous Errors
    this.clearValidationErrors();

    // Run Strict Validation
    const validation = this.validateCustomerInfo(customerData);
    if (!validation.isValid) {
      this.displayValidationErrors(validation.errors);
      return;
    }

    const totals = CartModule.calculateTotals();
    if (totals.totalCount === 0) return;

    try {
      // 1. Save into SQLite database orders.db
      const orderResult = await SQLiteService.saveOrder(customerData, totals, CartModule.state.items);
      this.state.lastSavedOrder = orderResult;

      // 2. Clear Cart
      CartModule.clearCart();

      // 3. Render Receipt View
      this.renderReceipt(orderResult);

      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast(`🎉 Thanh toán thành công! Mã đơn: ${orderResult.orderCode}`, 'success');
      }

    } catch (error) {
      console.error('❌ Checkout Error:', error);
      alert('Có lỗi xảy ra khi xử lý thanh toán: ' + error.message);
    }
  },

  // 8. Render Receipt View
  renderReceipt(orderResult) {
    const formView = document.getElementById('checkoutFormView');
    const receiptView = document.getElementById('receiptView');

    if (formView) formView.style.display = 'none';
    if (!receiptView) return;

    const info = orderResult.customerInfo;
    const totals = orderResult.cartSummary;
    const methodLabel = this.paymentMethodsInfo[orderResult.paymentMethod]?.title || orderResult.paymentMethod;

    receiptView.innerHTML = `
      <div class="receipt-container">
        <div class="receipt-success-icon">✓</div>
        <h3 style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 800; margin-bottom: 4px;">Đặt Hàng & Thanh Toán Thành Công!</h3>
        <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 14px;">Cảm ơn bạn đã thưởng thức gà rán KFC. Đơn hàng đã được tự động lưu vào file <strong>data/orders.db</strong> trên máy tính.</p>

        <span class="receipt-code-badge">${orderResult.orderCode}</span>

        <div style="background: var(--color-bg); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--color-border); text-align: left; margin-bottom: 20px; font-size: 0.88rem;">
          <div style="margin-bottom: 6px;"><strong>Người nhận:</strong> ${this.escapeHtml(info.name)} (${this.escapeHtml(info.phone)})</div>
          <div style="margin-bottom: 6px;"><strong>Địa chỉ giao:</strong> ${this.escapeHtml(info.address)}</div>
          <div style="margin-bottom: 6px;"><strong>Phương thức thanh toán:</strong> ${this.escapeHtml(methodLabel)}</div>
          <div><strong>Trạng thái SQLite:</strong> <span style="color: #059669; font-weight: 700;">✓ Tự động ghi vào file data/orders.db (`orders` & `order_items`)</span></div>
        </div>

        <!-- Receipt Items Table -->
        <table class="receipt-table">
          <thead>
            <tr>
              <th>Món Ăn</th>
              <th style="text-align: center;">SL</th>
              <th style="text-align: right;">Đơn Giá</th>
              <th style="text-align: right;">Thành Tiền</th>
            </tr>
          </thead>
          <tbody>
            ${orderResult.cartItems.map(item => `
              <tr>
                <td><strong>${this.escapeHtml(item.name)}</strong></td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${CartModule.formatPrice(item.price)}</td>
                <td style="text-align: right; font-weight: 700; color: var(--color-primary);">${CartModule.formatPrice(item.price * item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align: right; font-weight: 700;">Tạm tính:</td>
              <td style="text-align: right; font-weight: 700;">${CartModule.formatPrice(totals.subtotal)}</td>
            </tr>
            ${totals.discountAmount > 0 ? `
              <tr>
                <td colspan="3" style="text-align: right; font-weight: 700; color: #059669;">Giảm giá voucher:</td>
                <td style="text-align: right; font-weight: 700; color: #059669;">-${CartModule.formatPrice(totals.discountAmount)}</td>
              </tr>
            ` : ''}
            <tr>
              <td colspan="3" style="text-align: right; font-weight: 800; font-size: 1.05rem;">Tổng thanh toán:</td>
              <td style="text-align: right; font-weight: 900; font-size: 1.15rem; color: var(--color-primary);">${CartModule.formatPrice(totals.finalTotal)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="receipt-actions">
          <button type="button" class="btn btn-primary" id="btnCloseReceiptView">
            <span>Hoàn tất & Quay về trang chủ</span>
          </button>
          <button type="button" class="btn btn-secondary" onclick="window.print()">
            <span>🖨️ In Hóa Đơn</span>
          </button>
        </div>
      </div>
    `;

    receiptView.style.display = 'block';

    // Bind action buttons on receipt view
    document.getElementById('btnCloseReceiptView')?.addEventListener('click', () => {
      this.closeCheckoutModal();
    });
  },

  // 9. Validation Error Display Helpers
  displayValidationErrors(errors) {
    if (errors.name) {
      const nameInput = document.getElementById('checkoutName');
      nameInput?.classList.add('form-input-error');
      this.showInputErrorMsg(nameInput, errors.name);
    }
    if (errors.phone) {
      const phoneInput = document.getElementById('checkoutPhone');
      phoneInput?.classList.add('form-input-error');
      this.showInputErrorMsg(phoneInput, errors.phone);
    }
    if (errors.address) {
      const addressInput = document.getElementById('checkoutAddress');
      addressInput?.classList.add('form-input-error');
      this.showInputErrorMsg(addressInput, errors.address);
    }
  },

  showInputErrorMsg(inputEl, msg) {
    if (!inputEl) return;
    let errSpan = inputEl.parentElement.querySelector('.form-error-msg');
    if (!errSpan) {
      errSpan = document.createElement('span');
      errSpan.className = 'form-error-msg';
      inputEl.parentElement.appendChild(errSpan);
    }
    errSpan.textContent = msg;
  },

  clearValidationErrors() {
    document.querySelectorAll('.form-input-error').forEach(el => el.classList.remove('form-input-error'));
    document.querySelectorAll('.form-error-msg').forEach(el => el.remove());
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

// Initialize Checkout Module on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  CheckoutModule.init();
});
