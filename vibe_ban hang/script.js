/* 
  ElectroTech Landing Page - Interactive JavaScript
  Author: Antigravity AI
*/

document.addEventListener('DOMContentLoaded', () => {
  // State variables
  let cartCount = 0;
  const cartBadge = document.getElementById('cartBadge');
  const toastElement = document.getElementById('techToast');
  const toastMsg = document.getElementById('toastMessage');
  const bsToast = toastElement ? new bootstrap.Toast(toastElement) : null;

  // Show toast utility
  function showNotification(message) {
    if (toastMsg && bsToast) {
      toastMsg.textContent = message;
      bsToast.show();
    }
  }

  // 1. Add to Cart Handler
  const addToCartBtns = document.querySelectorAll('.btn-add-cart');
  addToCartBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const productName = btn.getAttribute('data-name') || 'Sản phẩm linh kiện';
      cartCount++;
      if (cartBadge) {
        cartBadge.textContent = cartCount;
        cartBadge.classList.add('bg-danger');
        cartBadge.classList.remove('bg-secondary');
      }
      showNotification(`Đã thêm "${productName}" vào giỏ hàng thành công!`);
    });
  });

  // 2. Product Category Filter
  const filterBtns = document.querySelectorAll('.product-filter-btn');
  const productItems = document.querySelectorAll('.product-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      productItems.forEach(item => {
        if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
          item.style.display = 'block';
          item.classList.add('animate__animated', 'animate__fadeIn');
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // 3. Quick Quote Form Submission
  const quoteForm = document.getElementById('quickQuoteForm');
  if (quoteForm) {
    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const modalEl = document.getElementById('quoteModal');
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      
      if (bsModal) {
        bsModal.hide();
      }

      quoteForm.reset();
      showNotification('🚀 Yêu cầu báo giá của bạn đã được gửi! Kỹ sư ElectroTech sẽ liên hệ trong 15 phút.');
    });
  }

  // 4. Smooth Scrolling for Navigation Links
  const navLinks = document.querySelectorAll('a[href^="#"]');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

          // Close mobile menu if open
          const navbarCollapse = document.getElementById('navbarContent');
          if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            const bsCollapse = new bootstrap.Collapse(navbarCollapse);
            bsCollapse.hide();
          }
        }
      }
    });
  });

  // 5. Back to Top Button
  const backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.style.display = 'flex';
      } else {
        backToTopBtn.style.display = 'none';
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 6. Active Nav Link on Scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    let current = '';
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      const sectionId = section.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        current = sectionId;
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
});
