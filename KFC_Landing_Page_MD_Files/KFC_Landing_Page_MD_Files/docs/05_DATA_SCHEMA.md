# CSV Data Schema

## File
`data/products.csv`

CSV là nguồn dữ liệu sản phẩm cho frontend. JavaScript đọc file CSV và render giao diện.

## Schema
| Field | Required | Example | Description |
|---|---|---|---|
| id | Yes | P001 | ID duy nhất |
| name | Yes | Combo Gà Giòn | Tên sản phẩm |
| category | Yes | combo | Nhóm sản phẩm |
| description | Yes | Gà giòn kèm khoai | Mô tả ngắn |
| price | Yes | 99000 | Giá dạng số, không có dấu phân cách |
| image | Yes | assets/images/combo-01.jpg | Đường dẫn ảnh |
| badge | No | Best Seller | Nhãn nổi bật |
| featured | No | true | Có hiển thị ở nhóm nổi bật không |

## Ví dụ
```csv
id,name,category,description,price,image,badge,featured
P001,Combo Gà Giòn,combo,Gà giòn kèm khoai và nước,99000,assets/images/combo-01.jpg,Best Seller,true
P002,Miếng Gà Giòn,ga-ran,Miếng gà giòn nóng hổi,45000,assets/images/chicken-01.jpg,,true
P003,Khoai Tây Chiên,side,Khoai tây chiên giòn,30000,assets/images/fries-01.jpg,,false
P004,Burger Gà,burger,Burger gà với rau và sốt,65000,assets/images/burger-01.jpg,,true
```

## Quy tắc xử lý
- `price` phải parse thành Number.
- `featured` chuyển thành Boolean.
- Nếu image lỗi, JavaScript phải hiển thị ảnh fallback.
- Nếu CSV không tải được, UI phải hiển thị thông báo dễ hiểu.
- Không lưu dữ liệu nhạy cảm trong CSV.
- CSV chỉ là dữ liệu tĩnh, không phải database server.

## Lưu ý khi chạy local
Trình duyệt có thể chặn `fetch()` CSV nếu mở `index.html` trực tiếp bằng `file://`.

Ưu tiên chạy bằng một static server, ví dụ:
- VS Code Live Server.
- Một static server của môi trường học tập.
- Hosting tĩnh.

Không cần backend.
