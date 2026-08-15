# Functional & UI Requirements

## 1. Header
- Logo/wordmark dạng text hoặc tài sản demo hợp pháp.
- Menu: Trang chủ, Thực đơn, Ưu đãi, Liên hệ.
- Header sticky khi cuộn.
- Mobile có nút menu.

## 2. Hero
- Headline mạnh, ngắn.
- Subheadline tập trung vào trải nghiệm gà rán nóng giòn.
- CTA chính: `Đặt món ngay`.
- CTA phụ: `Xem thực đơn`.
- Có hình ảnh món ăn nổi bật.

## 3. USP
Hiển thị 3–4 lợi điểm:
- Gà nóng giòn.
- Nhiều lựa chọn combo.
- Phù hợp nhóm bạn/gia đình.
- Ưu đãi hấp dẫn.

## 4. Menu sản phẩm
- Đọc dữ liệu từ `data/products.csv`.
- Render card bằng JavaScript.
- Mỗi card có:
  - hình ảnh
  - tên sản phẩm
  - mô tả
  - giá
  - badge nếu có
  - nút `Đặt món`
- Có filter theo category nếu dữ liệu hỗ trợ.

## 5. Promotion
- Một khu vực ưu đãi nổi bật.
- Có mã khuyến mãi demo.
- CTA rõ ràng.

## 6. Social proof
- Có thể dùng 3 review mẫu dạng demo.
- Không được tạo review giả rồi trình bày như đánh giá thật của khách hàng.

## 7. CTA cuối trang
- Headline thúc đẩy hành động.
- Nút đặt món.
- Có thể dùng `tel:` hoặc liên kết đến trang đặt món thật nếu người dùng cung cấp URL.

## 8. Footer
- Thông tin demo.
- Điều hướng nhanh.
- Copyright.
- Ghi rõ đây là landing page demo nếu cần.

## 9. Responsive
Kiểm tra tối thiểu:
- 360px
- 768px
- 1024px
- 1440px

## 10. Accessibility
- Semantic HTML.
- Alt text cho ảnh.
- Contrast dễ đọc.
- Button có trạng thái hover/focus.
- Có thể điều hướng bằng bàn phím.

## 11. Performance
- Lazy-load ảnh ngoài hero.
- Không tải thư viện không cần thiết.
- CSS/JS có cấu trúc rõ ràng.
