# Implementation Guide for Antigravity / Vibe Coding

## Vai trò AI
Bạn là một frontend developer senior đang hỗ trợ người mới học Vibe Coding.

Hãy tạo code:
- đơn giản
- dễ đọc
- có comment ở phần quan trọng
- không over-engineer
- không tạo backend
- không thêm framework nếu không cần

## File cần tạo
1. `index.html`
2. `css/style.css`
3. `js/app.js`
4. `data/products.csv`

## HTML
- Dùng semantic HTML5.
- Link CSS và JavaScript đúng đường dẫn.
- Tạo sẵn các container/section cần thiết.
- Không hard-code product cards.

## JavaScript
Tạo các hàm có trách nhiệm rõ ràng, ví dụ:
- `loadProducts()`
- `parseCSV()`
- `renderProducts()`
- `formatPrice()`
- `setupFilters()`
- `showError()`

Luồng:
1. DOM ready.
2. Fetch `data/products.csv`.
3. Parse CSV.
4. Validate dữ liệu cơ bản.
5. Render product cards.
6. Gắn event cho filter/CTA.
7. Xử lý lỗi.

Không dùng `eval()`.

## CSV parsing
Nếu CSV chỉ chứa dữ liệu đơn giản, có thể viết parser nhỏ.
Nếu dữ liệu có dấu phẩy trong nội dung, hãy dùng thư viện CSV nhẹ từ CDN hoặc thiết kế dữ liệu tránh trường hợp đó. Ưu tiên giải pháp đơn giản cho project học tập.

## CSS
- Dùng CSS variables.
- Mobile-first.
- Flexbox/Grid.
- Không viết CSS inline nếu không cần.
- Có hover/focus.
- Có media queries.

## Interactions
Có thể triển khai:
- mobile navigation
- filter sản phẩm
- smooth scrolling
- nút xem menu
- nút đặt món
- feedback khi người dùng click

Không triển khai:
- thanh toán thật
- đăng nhập
- tài khoản
- quản trị
- API
- gửi đơn hàng lên server

## Vibe Coding rules
Khi sửa code:
1. Đọc các file `.md` trước.
2. Giữ đúng yêu cầu công nghệ.
3. Không tự ý thêm backend.
4. Không tự ý đổi cấu trúc CSV.
5. Nếu cần thay đổi kiến trúc, giải thích trước.
6. Sau mỗi thay đổi lớn, kiểm tra console error.
7. Kiểm tra responsive.
8. Không xóa tính năng đang hoạt động nếu không được yêu cầu.

## Acceptance checklist
- [ ] `index.html` mở được.
- [ ] CSS tải đúng.
- [ ] JS không có lỗi console.
- [ ] CSV được đọc thành công khi chạy qua static server.
- [ ] Product cards render từ CSV.
- [ ] Giá được format đúng.
- [ ] Filter hoạt động nếu có.
- [ ] Mobile menu hoạt động.
- [ ] CTA hoạt động ở mức demo.
- [ ] Ảnh có alt text.
- [ ] Không có backend.
- [ ] Không có API server.
- [ ] Không hard-code danh sách sản phẩm trong HTML.
