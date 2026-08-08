/* 
  The Brew Lab - Dynamic Web App JavaScript Interactivity
*/

document.addEventListener('DOMContentLoaded', () => {
  // State management
  let currentCategory = 'all';
  let currentSearch = '';
  let currentSort = 'default';
  let selectedTimeSlot = '08:30';
  let selectedRating = 5;

  // DOM Elements
  const navbar = document.getElementById('navbar');
  const productsGrid = document.getElementById('productsGrid');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const categoryTabs = document.querySelectorAll('.category-btn');

  // Modals
  const authModal = document.getElementById('authModal');
  const quickViewModal = document.getElementById('quickViewModal');
  const historyModal = document.getElementById('historyModal');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const reservationForm = document.getElementById('reservationForm');
  const feedbackForm = document.getElementById('feedbackForm');

  // 1. Sticky Navbar background on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // 2. Toast Notification System
  window.showToast = function (message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  // 3. Dynamic Products Filtering & Fetching
  async function fetchProducts() {
    if (!productsGrid) return;
    
    // Show skeleton / loader state
    productsGrid.style.opacity = '0.5';

    try {
      const url = `/api/products?category=${currentCategory}&search=${encodeURIComponent(currentSearch)}&sort=${currentSort}`;
      const res = await fetch(url);
      const data = await res.json();

      productsGrid.style.opacity = '1';

      if (data.success && data.products.length > 0) {
        renderProducts(data.products);
      } else {
        productsGrid.innerHTML = `
          <div class="empty-menu-notice">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D4A373" stroke-width="1.5" style="margin:0 auto 16px auto; display:block;">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <h4 style="font-size:1.2rem; color:var(--primary-dark); margin-bottom:8px;">Không tìm thấy sản phẩm phù hợp</h4>
            <p style="color:var(--text-muted); font-size:0.9rem;">Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác bạn nhé!</p>
          </div>
        `;
      }
    } catch (err) {
      console.error('Error loading products:', err);
      productsGrid.style.opacity = '1';
    }
  }

  function renderProducts(products) {
    productsGrid.innerHTML = products.map(p => {
      const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price);
      // Format image path correctly
      let imgSrc = p.image;
      if (!imgSrc.startsWith('/')) {
        imgSrc = '/' + imgSrc;
      }
      
      const cleanDesc = p.description ? p.description.replace(/<[^>]*>/g, '').trim() : 'Cà phê & thức uống đặc sản của The Brew Lab.';

      return `
        <div class="product-card" data-id="${p.id}">
          <div class="product-img-wrapper">
            <img src="${imgSrc}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80'">
            <span class="product-cat-tag">${p.category_name || 'Thực đơn'}</span>
            ${p.is_featured ? '<span class="product-featured-badge">★ Nổi bật</span>' : ''}
          </div>
          <div class="product-body">
            <h3 class="product-title">${p.name}</h3>
            <p class="product-desc">${cleanDesc}</p>
            <div class="product-footer">
              <span class="product-price">${formattedPrice}</span>
              <button class="product-view-btn" onclick="openQuickView(${p.id}, '${escapeHtml(p.name)}', ${p.price}, '${imgSrc}', '${escapeHtml(cleanDesc)}', '${escapeHtml(p.category_name)}')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  // Category Tab Click
  categoryTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      fetchProducts();
    });
  });

  // Search Input Debounce
  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentSearch = e.target.value;
        fetchProducts();
      }, 300);
    });
  }

  // Sort Select Change
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      fetchProducts();
    });
  }

  // 4. Quick View Modal Functionality
  window.openQuickView = function (id, name, price, img, desc, category) {
    const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    
    document.getElementById('qvTitle').innerText = name;
    document.getElementById('qvCategory').innerText = category || 'Thực đơn';
    document.getElementById('qvPrice').innerText = formattedPrice;
    document.getElementById('qvDesc').innerText = desc || 'Hương vị cà phê đặc sản đậm đà, được pha chế thủ công từ những hạt cà phê hảo hạng.';
    document.getElementById('qvImage').src = img;

    quickViewModal.classList.add('active');
  };

  // Close Modals
  document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el || el.classList.contains('modal-close')) {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      }
    });
  });

  // 5. Auth Modal & Tab Switching
  window.openAuthModal = function (tab = 'login') {
    authModal.classList.add('active');
    switchAuthTab(tab);
  };

  window.switchAuthTab = function (tab) {
    const loginTab = document.getElementById('loginTabBtn');
    const regTab = document.getElementById('registerTabBtn');
    
    if (tab === 'login') {
      loginTab.classList.add('active');
      regTab.classList.remove('active');
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
    } else {
      regTab.classList.add('active');
      loginTab.classList.remove('active');
      registerForm.style.display = 'block';
      loginForm.style.display = 'none';
    }
  };

  // Handle Login Form Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success) {
          showToast(data.message, 'success');
          authModal.classList.remove('active');
          setTimeout(() => window.location.reload(), 800);
        } else {
          showToast(data.message, 'error');
        }
      } catch (err) {
        showToast('Đã có lỗi xảy ra. Vui lòng thử lại!', 'error');
      }
    });
  }

  // Handle Register Form Submit
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const full_name = document.getElementById('regName').value;
      const email = document.getElementById('regEmail').value;
      const phone = document.getElementById('regPhone').value;
      const password = document.getElementById('regPassword').value;

      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name, email, phone, password })
        });
        const data = await res.json();

        if (data.success) {
          showToast(data.message, 'success');
          authModal.classList.remove('active');
          setTimeout(() => window.location.reload(), 800);
        } else {
          showToast(data.message, 'error');
        }
      } catch (err) {
        showToast('Đã có lỗi xảy ra. Vui lòng thử lại!', 'error');
      }
    });
  }

  // Handle Logout
  window.handleLogout = async function () {
    const res = await fetch('/api/logout');
    const data = await res.json();
    if (data.success) {
      showToast('Đã đăng xuất thành công!', 'info');
      setTimeout(() => window.location.reload(), 600);
    }
  };

  // 6. Reservation Time Slot Selector & Form
  const slotBtns = document.querySelectorAll('.slot-btn');
  slotBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      slotBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTimeSlot = btn.dataset.time;
    });
  });

  // Set min date for booking date input to today
  const bookingDateInput = document.getElementById('bookingDate');
  if (bookingDateInput) {
    const today = new Date().toISOString().split('T')[0];
    bookingDateInput.min = today;
    bookingDateInput.value = today;
  }

  if (reservationForm) {
    reservationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const booking_date = bookingDateInput.value;
      const guests_count = document.getElementById('guestsCount').value;
      const seating_area = document.getElementById('seatingArea').value;
      const note = document.getElementById('bookingNote').value;

      try {
        const res = await fetch('/api/reserve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_date,
            time_slot: selectedTimeSlot,
            guests_count,
            seating_area,
            note
          })
        });
        const data = await res.json();

        if (res.status === 401) {
          showToast(data.message, 'error');
          openAuthModal('login');
          return;
        }

        if (data.success) {
          showToast(data.message, 'success');
          reservationForm.reset();
          if (bookingDateInput) {
            const today = new Date().toISOString().split('T')[0];
            bookingDateInput.value = today;
          }
        } else {
          showToast(data.message, 'error');
        }
      } catch (err) {
        showToast('Không thể kết nối máy chủ. Vui lòng thử lại!', 'error');
      }
    });
  }

  // 7. My Reservations Modal History
  window.openMyReservations = async function () {
    try {
      const res = await fetch('/api/my-reservations');
      const data = await res.json();

      if (data.success) {
        const listEl = document.getElementById('historyList');
        if (data.reservations.length === 0) {
          listEl.innerHTML = `
            <div style="text-align:center; padding:30px; color:var(--text-muted);">
              <p>Bạn chưa có lịch đặt bàn nào tại The Brew Lab.</p>
            </div>
          `;
        } else {
          listEl.innerHTML = data.reservations.map(r => `
            <div style="background:var(--bg-cream); padding:16px; border-radius:var(--radius-md); margin-bottom:12px; border-left:4px solid var(--primary-brown);">
              <div style="display:flex; justify-between; align-items:center; margin-bottom:6px;">
                <span style="font-weight:700; color:var(--primary-dark);">📅 ${r.booking_date} | ⏰ ${r.time_slot}</span>
                <span style="background:rgba(107,58,42,0.1); color:var(--primary-brown); padding:3px 10px; border-radius:12px; font-size:0.8rem; font-weight:700;">${r.status}</span>
              </div>
              <p style="font-size:0.9rem; color:var(--text-dark); margin:4px 0;">👥 Số khách: <strong>${r.guests_count} người</strong> - 📍 ${r.seating_area}</p>
              ${r.note ? `<p style="font-size:0.85rem; color:var(--text-muted); italic;">"Ghi chú: ${r.note}"</p>` : ''}
            </div>
          `).join('');
        }
        historyModal.classList.add('active');
      } else {
        showToast('Vui lòng đăng nhập để xem lịch sử đặt bàn.', 'error');
        openAuthModal('login');
      }
    } catch (err) {
      showToast('Đã xảy ra lỗi khi tải lịch sử đặt bàn.', 'error');
    }
  };

  // 8. Star Rating Selector & Feedback Submission
  const stars = document.querySelectorAll('.star-rating .star');
  stars.forEach((star, index) => {
    star.addEventListener('click', () => {
      selectedRating = index + 1;
      stars.forEach((s, i) => {
        if (i <= index) s.classList.add('selected');
        else s.classList.remove('selected');
      });
    });
  });

  if (feedbackForm) {
    feedbackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('fbName').value;
      const email = document.getElementById('fbEmail').value;
      const message = document.getElementById('fbMessage').value;

      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, rating: selectedRating, message })
        });
        const data = await res.json();

        if (data.success) {
          showToast(data.message, 'success');
          feedbackForm.reset();
          stars.forEach(s => s.classList.add('selected'));
          selectedRating = 5;
        } else {
          showToast(data.message, 'error');
        }
      } catch (err) {
        showToast('Đã có lỗi xảy ra. Vui lòng gửi lại phản hồi!', 'error');
      }
    });
  }
});
