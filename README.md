# Sun Saphia Residence

Website tĩnh. Vercel phục vụ thư mục `public/` theo cấu hình trong `vercel.json`.

1. Đưa toàn bộ nội dung gói ZIP vào thư mục gốc repo GitHub.
2. Trên Vercel chọn **Add New → Project**, rồi import repo.
3. Giữ **Root Directory** ở thư mục gốc và dùng preset **Other**. Nếu màn hình yêu cầu điền cấu hình, để **Build Command** trống và chọn **Output Directory** là `public`.
4. Chọn **Deploy**. Trang chủ nằm ở `/`.

Để xem cục bộ, chạy `python3 -m http.server 8765 --bind 127.0.0.1 --directory public`.

Biểu mẫu chưa kết nối nơi nhận. Video YouTube vẫn cần Internet.

## Nội dung

- Trang chủ: hero lá, giới thiệu, kiến trúc, dấu ấn dự án, video, vị trí, phong cách sống, giá trị sở hữu, tiện ích, tiến độ, thông tin dự án, liên hệ và footer.
- Bố cục thích ứng màn hình; menu điện thoại, 3 carousel, hiệu ứng xuất hiện ảnh và nội dung khi cuộn, chuyển động lá hero.
- Hỗ trợ bàn phím, reduced motion, cookie lưu lựa chọn trên trình duyệt.
- `index.html`: cấu trúc và phần lớn nội dung.
- `styles.css`: bảng màu, font và các quy tắc nền.
- `layout-refinement.css`: bố cục đã hiệu chỉnh theo số đo bản tham khảo; cần giữ file này khi triển khai.
- `app.js`: dữ liệu carousel, menu, hộp thoại, hiệu ứng và xử lý form.
- `assets/sources.json`: nguồn các tài nguyên hình ảnh được quan sát trong bản xem trước.

## Giới hạn cần biết

1. Bản này tái tạo trang chủ. Các liên kết Vị trí/Tiện ích/Dự án/Tiến độ dẫn đến các section trên trang. Chưa tái tạo các trang con `/location`, `/about-us`, `/news`, `/apartments-layout` của bản tham khảo. Nút Căn hộ mở hộp thoại mới với danh mục cơ bản; đây là phần bổ sung, không phải bản sao trang căn hộ gốc.
2. Chuyển động hero và hiệu ứng cuộn được viết lại, chưa đối chiếu được mọi trạng thái với bản gốc. Không có mã nguồn animation gốc.
3. Form chỉ kiểm tra dữ liệu và hiển thị rõ chưa gửi. Không lưu họ tên, email hoặc số điện thoại và không có backend/CRM. Cần kết nối hệ thống tiếp nhận trước khi dùng chính thức.
4. Chính sách quyền riêng tư là nội dung dành cho bản cục bộ này, không phải chính sách gốc của dự án.
5. Video dùng iframe YouTube và cần Internet; không đóng gói nội dung video YouTube.
6. Logo, ảnh và video Dukley được giữ để bám giao diện tham khảo, không phải ảnh minh họa đã xác minh của Sun Saphia. Quyền sử dụng các tài nguyên bên thứ ba thuộc chủ sở hữu tương ứng; thay bằng tài nguyên được cấp quyền khi triển khai.
7. Nội dung và các số liệu dự án được chép theo bản xem trước, chưa xác minh độc lập; không có cập nhật giá tự động.

## Font

Cormorant Garamond và Be Vietnam Pro được lưu cục bộ từ Google Fonts. `assets/fonts.css` khai báo font; `font-*.ttf` chứa font chữ. Lá hero dùng ảnh Unsplash đã hiển thị trong bản tham khảo.

## Bản hiệu chỉnh bố cục

Đã sửa ảnh kiến trúc thành ba lớp chồng nhau (80% / 90% / 100%, cách nhau 48px trên máy tính), thu hẹp tiêu đề và nội dung, bổ sung video sóng biển nhỏ, xếp dọc phần vị trí, đưa ba ô sở hữu lên trên khối ảnh, sửa ảnh nền toàn chiều ngang và vị trí ảnh nhỏ cuối phần dự án. Đã cập nhật gallery với ảnh được chọn phóng lớn.

## Tối ưu mobile

`mobile.css` được tải cuối cùng và chỉ áp dụng dưới 801px. Bản điện thoại dùng header gọn, ảnh giữ tỷ lệ, nội dung một cột dưới 601px, gallery vuốt với nhãn xuống dòng, font nhập liệu tối thiểu 16px, nút thao tác tối thiểu 44px và khoảng cách hỗ trợ safe area. Đã kiểm tra tràn ngang và tràn chữ tại 320, 360, 390, 430, 768px.

## Hệ thống chữ thống nhất

`typography.css` quản lý toàn bộ font, cỡ chữ, độ đậm và khoảng cách dòng; đã loại bỏ các khai báo chữ trùng lặp khỏi ba file bố cục. Giữ file này cuối danh sách CSS.

| Vai trò | Desktop | Tablet | Điện thoại |
| --- | --- | --- | --- |
| Tiêu đề section | 56px | 40px | 32px |
| Đoạn dẫn | 28px | 24px | 20px |
| Tiêu đề thẻ | 28px | 26px | 24px |
| Nội dung | 16px | 16px | 16px |
| Nhãn/chú thích | 14px | 14px | 14px |
| Chữ nút | 13px | 13px | 13px |

Tiêu đề dùng Cormorant Garamond; nội dung và điều khiển dùng Be Vietnam Pro. Chỉ hero và tiêu đề trên ảnh nền có cỡ riêng. Gallery desktop phóng ảnh, không phóng chữ.

## Chuyển động khi cuộn

- `motion.js` và `motion.css` quản lý chuyển động, được tải sau phần giao diện.
- Phần ảnh kiến trúc dùng một khung sticky. Ảnh trước và ảnh giữa trượt xuống theo vị trí cuộn, để lộ ảnh phía sau; cuộn lên đảo ngược chuyển động. Khung được thả khi kết thúc đoạn cuộn.
- Tiêu đề xuất hiện theo từ, nội dung xuất hiện nhẹ một lần khi đi vào màn hình, ảnh mở dần và các ảnh lớn có parallax nhẹ.
- Cuộn bánh xe và cảm ứng giữ hành vi trình duyệt. Link điều hướng chuyển êm đến section.
- Chế độ giảm chuyển động của thiết bị hiển thị bản tĩnh, không giấu nội dung hoặc kéo dài đoạn cuộn. Khi JavaScript không chạy, toàn bộ nội dung vẫn đọc được.
- Cuộn từ phần “Ý tưởng kiến trúc” xuống hết ba lớp ảnh để xem hiệu ứng.
