# Sun Saphia Residence · Cloudflare Content Studio

Landing page HTML/CSS/JS cùng dashboard quản trị, Cloudflare Worker, D1 và R2. Mã nguồn giao diện và animation được giữ riêng với nội dung biên tập. Không cần Vercel hoặc WordPress.

## Địa chỉ triển khai

- Website: https://sun-saphia-residence.kemdinh43.workers.dev
- Quản trị: https://sun-saphia-residence.kemdinh43.workers.dev/admin/
- Chưa chọn tên miền riêng; bản workers.dev được đặt noindex.
- Chưa kích hoạt R2. Sửa nội dung, viết bài, xuất bản và quản lý yêu cầu tư vấn dùng D1; tải ảnh mới đang tạm tắt.
- Thông tin đăng nhập được bàn giao riêng, không nằm trong repository hoặc gói source.

## Hero TVC và chuyên viên tư vấn

Hero phát bản teaser 30 giây do người dùng cung cấp, mặc định không tiếng. Hai MP4 H.264/AAC được host cùng Static Assets: desktop 1600px khoảng 8,5 MB, mobile 960px khoảng 2,9 MB; không cần R2. Chỉ giữ tên, mô tả và vị trí căn giữa trên hero; TVC luôn tắt tiếng, có ảnh dự phòng và điều khiển tạm dừng chỉ hiện khi focus bằng bàn phím; không tự tải khi bật giảm chuyển động, tiết kiệm dữ liệu hoặc mạng 2G. Video dừng khi ra khỏi khung nhìn/ẩn tab. Video hero hiện được cập nhật cùng mã nguồn, không phải qua upload của dashboard.

Trong mục Chuyên viên & đăng ký tư vấn, quản trị được tên, vai trò, một ảnh/alt, số điện thoại/Zalo, email và địa chỉ văn phòng tư vấn của Phạm Thanh Hiếu. Liên kết gọi/Zalo được render từ số hợp lệ ở máy chủ.

## Những gì đã có

- Đăng nhập một tài khoản quản trị; mật khẩu băm PBKDF2 có salt, cookie HttpOnly, phiên 8 giờ và giới hạn thử đăng nhập.
- Biên tập 204 trường nội dung của landing page: tiêu đề, đoạn văn, ảnh/alt, loại căn hiện có, thẻ dấu ấn/tiện ích, thư viện, video YouTube, tiến độ và SEO.
- Chọn theo 17 section thực tế trên trang (16 section cũ + mục tin tức bổ sung), gom tiêu đề, nội dung, ảnh, thẻ và thư viện vào đúng khu vực. SEO chung và popup căn hộ là thiết lập riêng.
- Lưu bản nháp riêng, xem trước có xác thực/noindex, xuất bản một phiên bản hoàn chỉnh.
- Module Bài viết: trình soạn trực quan tự host bằng Tiptap, H2/H3, đậm/nghiêng/gạch chân, danh sách, căn lề, trích dẫn, liên kết, ảnh/chú thích, bảng, hoàn tác/làm lại.
- Mỗi bài có ảnh bìa/alt, slug, tác giả, danh mục, mô tả ngắn, SEO riêng, nháp/xem trước/xuất bản/gỡ bài và lịch sử khôi phục. Bản sửa không làm thay đổi bài công khai.
- Bài đã đăng có trang riêng tại `/bai-viet/:slug`, trang danh sách `/bai-viet`, xuất hiện trong mục tin tức landing page và sitemap. Không có bài công khai thì mục tin tức trên landing page được ẩn.
- Lịch sử tối đa 60 phiên bản gần nhất trên giao diện; khôi phục tạo bản nháp mới, không tự xuất bản.
- Kiểm tra phiên bản khi lưu và xuất bản để tránh ghi đè giữa các cửa sổ.
- Ảnh upload lưu trong R2, PNG/JPEG/WebP tối đa 8 MB; kiểm tra chữ ký file, không nhận SVG/HTML tải lên.
- Form tư vấn lưu trong D1; dashboard xem 200 yêu cầu gần nhất và cập nhật trạng thái. Chưa có gửi email tự động.
- HTML và SEO được render từ cùng bản công khai ở server; ảnh R2 dùng URL bất biến. Bản công khai dự phòng được cache ở từng edge đã phục vụ trang.
- Không cần deploy lại code khi lưu nội dung hoặc xuất bản.

## Chạy cục bộ

Cần Node.js 22 trở lên.

```sh
npm ci
npm run setup:local
npm run db:local
npm run dev
```

- Website: `http://127.0.0.1:8787/`
- Dashboard: `http://127.0.0.1:8787/admin/`
- Xem trước bản nháp: `http://127.0.0.1:8787/preview` (cần đăng nhập).

`setup:local` tạo mật khẩu ngẫu nhiên dành riêng cho máy. Xem thông tin đăng nhập trong `.local-login.json`. Băm mật khẩu và email nằm trong `.dev.vars`; hai file không được commit hoặc đóng gói. Chạy lại setup không ghi đè tài khoản đang có. Không dùng tài khoản này cho production.

D1/R2 cục bộ lưu tại `.wrangler/state`; chưa đồng bộ lên tài khoản Cloudflare. Bản nội dung gốc nằm trong `server/content-schema.json`, được dùng làm phiên bản khởi đầu được duyệt của website. Khi đã có bản xuất bản, lỗi nguồn không được thay bằng dữ liệu mẫu.

## Cách sử dụng

1. Đăng nhập Studio, chọn phần nội dung và chỉnh các trường.
2. Bấm **Lưu nháp**. Trường chưa lưu sẽ giữ trạng thái riêng trong cửa sổ đang mở.
3. Bấm **Xem trước** để mở bản đã lưu, chỉ quản trị viên đăng nhập mới đọc được.
4. Bấm **Xuất bản** để chọn bản nháp hiện tại làm nội dung công khai. Chỉ báo thành công sau khi D1 xác nhận thay đổi phiên bản.
5. Trong **Lịch sử phiên bản**, khôi phục một phiên bản thành bản nháp rồi xem trước/xuất bản lại nếu cần.

Ảnh mới có thể được chọn từ thư viện hoặc tải trực tiếp trong trường ảnh. Tải ảnh lên không tự xuất bản ảnh vào nội dung. Chữ trên landing page là plain text để giữ thiết kế; phần Bài viết dùng trình soạn trực quan và lưu cấu trúc JSON. Backend kiểm tra các khối/định dạng được hỗ trợ, rồi tạo HTML đã escape để tránh cho HTML tùy ý đi vào bài công khai.

Trong mục Bài viết, bấm **Viết bài mới**, nhập tiêu đề (slug được gợi ý), ảnh bìa/alt và nội dung. Lưu nháp trước khi xem trước/xuất bản. Trước khi xuất bản cần đủ tiêu đề, mô tả, ảnh bìa/alt và nội dung. Slug cố định sau lần xuất bản đầu để giữ URL. **Gỡ khỏi website** giữ bài và lịch sử, chỉ ngừng công khai. Khôi phục phiên bản cũ tạo nháp mới; cần xuất bản lại nếu muốn thay bài công khai.

Nội dung bài viết và nội dung landing page có luồng xuất bản riêng. Không cần xuất bản lại landing page để một bài mới xuất hiện trong mục tin tức. Trình soạn bài chỉ được tải khi mở mục Bài viết; landing page không tải thư viện editor.

## Chuẩn bị Cloudflare thật

Cấu hình hiện trỏ tới D1 `sun-saphia-cms` của tài khoản triển khai. Tên miền riêng chưa được chọn. Khi dùng lại dự án ở tài khoản khác, tạo D1/R2 riêng và thay ID/email trong `wrangler.jsonc`; không dùng tài nguyên của tài khoản cũ.

1. Đăng nhập Wrangler đúng tài khoản và kiểm tra bằng `npx wrangler whoami`.
2. Tạo D1: `npx wrangler d1 create sun-saphia-cms`.
3. Điền ID thật vào `d1_databases[0].database_id` trong `wrangler.jsonc`.
4. Hiện R2 được hoãn: cấu hình không có `r2_buckets`, tải ảnh mới tạm tắt; ảnh có sẵn và đường dẫn HTTPS vẫn dùng được. Khi muốn bật, kích hoạt R2 trên tài khoản, chạy `npx wrangler r2 bucket create sun-saphia-media`, thêm `"r2_buckets": [{ "binding": "MEDIA", "bucket_name": "sun-saphia-media" }]` vào `wrangler.jsonc` rồi triển khai lại. Không cần chuyển dữ liệu bài viết/D1.
5. Điền `ADMIN_EMAIL` cho người quản trị và `SITE_ORIGIN` cho tên miền HTTPS đã chọn. Cloudflare account email và website admin email không bắt buộc giống nhau.
6. Chạy migration production: `npm run db:remote`.
7. Đặt secret `ADMIN_PASSWORD_HASH` riêng cho production, theo bước bên dưới.
8. Chạy `npm run check`, `npm test`, `npm run deploy:check`, sau đó `npm run deploy`.
9. Thêm Custom Domain cho Worker trên Cloudflare. Tên miền cần ở một Cloudflare zone hoạt động. Đối chiếu DNS hiện có trước khi thay đổi.

Khi chưa chọn tên miền, dùng `npm run deploy -- --preview` và để `SITE_ORIGIN` trống. Website dùng địa chỉ `workers.dev` với `noindex`; dashboard và backend vẫn hoạt động. Sau khi chọn tên miền, điền `SITE_ORIGIN`, thêm Custom Domain và chạy lại `npm run deploy`.

Đặt mật khẩu trong zsh, không ghi mật khẩu vào code hoặc đối số dòng lệnh:

```sh
read -s "saphia_admin_password?Mật khẩu mới (ít nhất 14 ký tự): "
printf '%s' "$saphia_admin_password" | node scripts/password.mjs | npx wrangler secret put ADMIN_PASSWORD_HASH
unset saphia_admin_password
```

Nếu Worker chưa tồn tại, Wrangler có thể hỏi tạo Worker khi đặt secret. Không đưa `.dev.vars` lên production. Chưa có secret/email hợp lệ thì đăng nhập bị từ chối; không có tài khoản mặc định công khai.

Tên miền chưa cấu hình hoặc hostname không phải `SITE_ORIGIN` sẽ nhận noindex. Sau khi gắn domain, kiểm tra HTML ban đầu, canonical, `/robots.txt`, `/sitemap.xml` và HTTPS. Preview/admin/API luôn có no-store và noindex.

## Cấu trúc

```text
public/                  Giao diện, tài nguyên và Studio
server/worker.js         Router, API quản trị, upload, form tư vấn
server/auth.js           Mật khẩu, phiên, giới hạn request
server/content.js        Phiên bản nội dung, xuất bản và render HTML
server/sections.json     Bản đồ section và vị trí trên trang
server/posts.js          Bài viết, revision và render rich text an toàn
admin/posts-editor.js    Mã nguồn trình soạn bài
scripts/build-admin.mjs  Bundle editor tự host bằng esbuild
server/content-schema.json Các trường được phép biên tập và nội dung gốc
migrations/              Schema D1
tests/                  Kiểm thử validation, XSS và tích hợp Worker/D1/R2
wrangler.jsonc           Cấu hình Cloudflare
```

## Kiểm tra

```sh
npm run check
npm test
npm run deploy:check
```

Integration test chạy Worker riêng ở port 8790, D1/R2 riêng dưới `.wrangler/integration`, tự dừng server test sau khi xong. Không gửi dữ liệu/email hoặc tạo tài nguyên production. `.wrangler/` chứa dữ liệu máy, không được đưa vào Git/ZIP.

## Giới hạn hiện tại

- Một quản trị viên, chưa có nhiều vai trò, MFA riêng, đặt lại mật khẩu qua email hoặc lịch xuất bản. Có thể bổ sung Cloudflare Access trước khi mở quản trị cho nhiều người.
- Quản lý các trường/nhóm thẻ hiện có; chưa có thêm/xóa/sắp xếp khối tùy ý hay page builder.
- Chưa có lịch đăng tự động, đa ngôn ngữ hoặc page builder.
- Danh sách quản trị hiện lấy 200 bài gần nhất, danh sách công khai 100 bài, landing page 3 bài mới nhất; có thể bổ sung phân trang khi nội dung tăng.
- Trình soạn hỗ trợ định dạng đã liệt kê, không có chế độ nhập HTML tùy ý hoặc font/cỡ chữ tùy ý để giữ nhất quán thiết kế.
- Không có thông báo email tự động. Nhân viên kiểm tra yêu cầu trong dashboard.
- Giới hạn form theo IP và honeypot đã có; chưa tích hợp Turnstile. Cần theo dõi spam thực tế trước khi chạy chiến dịch lớn.
- Cache dự phòng là best effort tại edge, không thay thế backup D1. Nếu edge chưa có snapshot và D1 không đọc được, trang trả lỗi thay vì thông tin mẫu.
- Các key dữ liệu cũ được giữ nguyên khi sắp xếp lại section. Hai trường tiêu đề tin tức mới nhận mặc định từ code nếu đọc revision cũ. Các thay đổi schema khác vẫn cần kế hoạch nâng cấp; không đổi/xóa key tùy tiện.
- Các ảnh tham khảo cũ còn trên landing page chưa được thay hết bằng bộ ảnh dự án. Xem `ASSET-SOURCES.json` trước khi xuất bản chính thức.

Tài liệu Cloudflare: https://developers.cloudflare.com/workers/static-assets/ · https://developers.cloudflare.com/d1/ · https://developers.cloudflare.com/r2/

Bộ ảnh Sun Saphia do người dùng cung cấp gồm 15 phối cảnh tòa nhà, nội thất, tầm nhìn và tiện ích; đã tối ưu WebP (~3,3 MB tổng), thay ảnh mẫu tại các section tương ứng và vẫn chỉnh được qua CMS.
