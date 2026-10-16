# Hướng dẫn mã nguồn TEAM360

Đây là mã nguồn ứng dụng web, không phải bộ cài Windows .exe.
Bản online: https://team360-dieu-hanh.minhducand.chatgpt.site

## Nội dung
- Mã nguồn React / Vinext, API, schema và migration D1, tích hợp R2.
- Dữ liệu mẫu trích từ Excel trong lib/seed.json; các mục chưa rõ giữ nhãn cần xác minh.
- README.md mô tả tính năng và giới hạn; scripts/test-domain.mjs kiểm tra logic.
- Không chứa node_modules, khóa bí mật, lịch sử Git hoặc dữ liệu runtime của bản online.

## Chạy thử trên máy cá nhân (dành cho kỹ thuật)
Cần Node.js >=22.13.0 và pnpm đúng phiên bản packageManager trong package.json (11.25.0), cùng Internet để tải thư viện. Giải nén, mở terminal trong thư mục TEAM360.

```sh
npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm exec wrangler d1 execute DB --local --config wrangler.local.json --file drizzle/0000_condemned_spiral.sql
pnpm dev --host 127.0.0.1
```

Mở http://localhost:5173. Cấu hình phát triển portable dùng danh tính giả lập, D1 và R2 cục bộ; chỉ dùng trên máy phát triển. Không đưa chế độ này ra Internet. Dữ liệu local tách biệt hoàn toàn với dữ liệu trên bản online.

Nếu cài đặt thư viện thất bại, kiểm tra phiên bản Node/pnpm và khả năng truy cập registry. Không tự nâng hàng loạt dependency khi chưa kiểm tra tương thích.

## Kiểm tra mã nguồn
```sh
pnpm exec tsc --noEmit
node scripts/test-domain.mjs
pnpm build
```

Build và kiểm tra logic đã đạt trong môi trường xây dựng ban đầu. Hướng dẫn chạy trên Windows và đăng nhập đầu cuối chưa được kiểm thử trên máy của người nhận.

## Triển khai
Bản gốc dùng Sites/Cloudflare Workers, D1 và R2, đăng nhập ChatGPT do nền tảng cung cấp. .openai/hosting.json giữ ID của Site gốc để truy nguyên. Khi tạo một Site mới phải đăng ký ID mới bằng quy trình Sites.
Nếu tự host ngoài Sites, cần cấu hình D1/R2, chạy migration và thay tích hợp xác thực bằng cơ chế đáng tin cậy; không tin các header danh tính do khách tự gửi. Đây chưa phải bản Django/PostgreSQL hay bộ cài máy chủ độc lập.

## Dữ liệu đang sử dụng
Gói chỉ có seed ban đầu, không phải bản sao lưu dữ liệu online. Xuất CSV/JSON từ ứng dụng để lấy dữ liệu công việc hiện tại; JSON không chứa nội dung tệp đính kèm, cần tải tệp riêng.
