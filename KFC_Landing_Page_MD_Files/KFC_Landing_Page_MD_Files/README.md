# KFC Fried Chicken Landing Page — Vibe Coding Demo

Trang Landing Page quảng cáo gà rán phong cách KFC được xây dựng theo chuẩn **Vibe Coding & Antigravity** bằng công nghệ **HTML5, CSS3 và JavaScript thuần (ES6+)**, tải dữ liệu thực đơn động từ file **CSV** mà không cần bất kỳ backend hay framework nào.

---

## Cấu trúc Thư mục

```text
KFC_Landing_Page_MD_Files/
├── index.html              # Cấu trúc HTML5 ngữ nghĩa, SEO & Accessibility
├── css/
│   └── style.css           # Design tokens, CSS variables, mobile-first responsive
├── js/
│   └── app.js              # CSV parser, product dynamic render, modal & interactions
├── data/
│   └── products.csv        # Nguồn dữ liệu sản phẩm (id, name, category, price,...)
├── assets/
│   └── images/             # Hình ảnh món ăn gà rán, combo, burger chất lượng cao
├── docs/                   # Tài liệu đặc tả dự án
│   ├── 01_PROJECT_BRIEF.md
│   ├── 02_REQUIREMENTS.md
│   ├── 03_DESIGN_SYSTEM.md
│   ├── 04_CONTENT.md
│   ├── 05_DATA_SCHEMA.md
│   └── 06_IMPLEMENTATION.md
└── README.md
```

---

## Các Tính Năng Nổi Bật

1. **Hiển thị & Lọc thực đơn động**:
   - Tự động đọc và phân tích file `data/products.csv`.
   - Bộ lọc danh mục tức thì: *Tất cả*, *Combo*, *Gà Rán*, *Burger*, *Món Kèm*, *Đồ Uống*.
   - Định dạng tiền tệ VND (`159.000 ₫`) chuẩn chỉnh.
   - Tự động xử lý ảnh fallback nếu liên kết ảnh bị lỗi.

2. **Giao diện Năng động & Hiện đại**:
   - Tone màu đỏ đậm thương hiệu fast-food kết hợp vàng ánh kim và nền kem hiện đại.
   - Header cố định (Sticky) với hiệu ứng làm mờ nền kính mờ (Backdrop blur).
   - Mobile Navigation Drawer mượt mà cho màn hình điện thoại.

3. **Tương tác Demo Trực Quan**:
   - Hộp thoại xem chi tiết & điều chỉnh số lượng món ăn (`Order Demo Modal`).
   - Sao chép mã ưu đãi 1-click (`GIONRUM2026`) có thông báo Toast phản hồi.
   - Hiệu ứng cuộn mượt (Smooth Scrolling) giữa các phân đoạn.

---

## Hướng dẫn Chạy Thử (Run Locally)

Vì trình duyệt có chính sách bảo mật CORS chặn hàm `fetch()` đọc file `data/products.csv` khi mở file trực tiếp qua giao thức `file:///`, bạn nên chạy dự án bằng một **Static Server** cục bộ:

### Cách 1: Sử dụng Python (có sẵn trên máy)
```bash
# Python 3
python -m http.server 8000
```
Sau đó mở trình duyệt và truy cập: `http://localhost:8000`

### Cách 2: Sử dụng VS Code Live Server
1. Mở thư mục dự án trong **VS Code**.
2. Nhấp chuột phải vào file `index.html` và chọn **"Open with Live Server"**.

### Cách 3: Sử dụng Node.js `npx serve`
```bash
npx serve .
```

> **Lưu ý**: Nếu bạn mở trực tiếp bằng cách double click `index.html` (`file:///`), mã JavaScript đã được tích hợp sẵn cơ chế **Fallback Dataset** dự phòng để trang web vẫn hiển thị đầy đủ và mượt mà!
