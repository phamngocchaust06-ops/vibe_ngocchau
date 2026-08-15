# KFC Landing Page

Dự án Landing Page quảng cáo thương hiệu và sản phẩm gà rán KFC được xây dựng theo phong cách **Modern Minimalist**, tuân thủ nghiêm ngặt chuẩn Responsive, Accessibility và Frontend thuần (HTML5, CSS3, Vanilla JavaScript, CSV data).

## 🚀 Công nghệ sử dụng

- **HTML5**: Thẻ Semantic (header, nav, main, section, article, footer).
- **CSS3**: CSS Custom Properties, Flexbox, Grid Layout, Responsive design, Micro-interactions.
- **Vanilla JavaScript**: Fetch API, Async/Await, Robust CSV Parser, Dynamic DOM rendering, Event delegation.
- **Dữ liệu**: CSV file (`data/menu.csv`).
- **Không backend, không database server, không framework JS**.

## 📁 Cấu trúc dự án

```text
landingpage_kfc/
├── index.html          # Trang HTML chính với cấu trúc Semantic
├── README.md           # Hướng dẫn dự án
├── css/
│   └── style.css       # Design System & Responsive Stylesheet
├── js/
│   └── app.js          # Logic tải CSV, render DOM, filter category, formatting
├── data/
│   └── menu.csv        # Nguồn dữ liệu sản phẩm động
└── assets/
    └── images/         # Thư mục chứa tài nguyên hình ảnh
        └── hero-bucket.jpg
```

## 📊 Cấu trúc Dữ liệu Menu (CSV)

File `data/menu.csv` chứa danh sách sản phẩm với các cột:
- `id`: ID duy nhất của sản phẩm.
- `name`: Tên sản phẩm.
- `category`: Danh mục (`Gà rán`, `Combo`, `Burger`, `Món ăn kèm`, `Đồ uống`).
- `description`: Mô tả ngắn gọn sản phẩm.
- `price`: Giá tiền (số nguyên, ví dụ `45000`).
- `image`: Đường dẫn hình ảnh (ví dụ `assets/images/chicken-1.jpg`).
- `featured`: Trạng thái nổi bật (`true` hoặc `false`).

## 💡 Chức năng chính

1. **Đọc & Parse CSV Động**: Tự động tải và parse dữ liệu từ `data/menu.csv` khi trang được nạp. Hỗ trợ parse cả các trường dữ liệu có dấu phẩy nằm trong ngoặc kép `"..."`.
2. **Hiển thị Sản phẩm Nổi bật (Featured Products)**: Lọc và hiển thị các món best-seller (`featured = true`).
3. **Bộ lọc Danh mục (Category Filter)**: Lọc sản phẩm tức thì theo từng danh mục mà không cần reload trang.
4. **Định dạng Giá tiền (Price Format)**: Định dạng số tiền tự động sang định dạng VND (ví dụ `45.000 ₫`).
5. **Mobile Navigation**: Menu responsive dạng hamburger toggle linh hoạt trên điện thoại và máy tính bảng.
6. **Xử lý Lỗi & Loading State**: Hiển thị trạng thái "Đang tải menu..." và thông báo lỗi thân thiện nếu không tải được CSV.

## 💻 Cách chạy dự án

1. Clone hoặc tải thư mục dự án về máy.
2. Mở file `index.html` trực tiếp bằng trình duyệt web (hoặc sử dụng Live Server trong VS Code / IDE).
3. Thưởng thức giao diện KFC Landing Page mượt mà và hiện đại!
