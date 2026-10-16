# TEAM360 — Bản triển khai đầu tiên

Ứng dụng riêng tư trên Sites, dùng xác thực ChatGPT, D1 lưu bản ghi và R2 lưu tệp. Mỗi tài khoản có vùng dữ liệu riêng theo ID đã xác thực. Chưa phải không gian dùng chung đa tài khoản.

## Đã có

- 3 nhiệm vụ, 5 phòng ban, 34 tên nhân sự và 1 mục kế hoạch cần xác minh được trích từ Excel nguồn.
- CRUD công việc và danh mục, lưu trữ/khôi phục, checklist, ngày hạn, tiến độ, kết quả, trạng thái chờ duyệt/hoàn thành.
- Kanban, lịch theo hạn, tìm kiếm, bộ lọc, dashboard, CSV, JSON công việc có xem trước và chống trùng ID.
- Bình luận, kênh trao đổi riêng tư, tải/tải xuống tệp tối đa 10 MB.
- Nhật ký cùng giao dịch lưu, kiểm tra phiên bản để chống ghi đè đồng thời, lọc owner phía máy chủ.
- Nhắc hạn trong ứng dụng khi đang mở, tự làm mới mỗi 30 giây.

## Chưa có

Quyền theo phòng đa tài khoản, chat thời gian thực đa người, email/push khi đóng ứng dụng, quy trình duyệt nhiều người, Gantt/phụ thuộc, định kỳ/tự động hóa, AI, nhập Excel tùy ý, backup phục hồi tự động. Xuất JSON không bao gồm bytes tệp.

Không tự sửa năm 20226 hoặc năm 2025 trong nguồn. Mọi công việc gốc đều có nhãn cần xác minh. Người phụ trách chỉ được nhập nơi có trong nguồn; không tự suy ra phòng ban cho 34 người.

## Kiểm tra

`node node_modules/typescript/bin/tsc --noEmit`

`node scripts/test-domain.mjs`

Build và xuất bản qua Sites helper. Không có browser-control skill trong phiên xây dựng nên chưa thực hiện kiểm tra giao diện bằng trình duyệt hoặc kiểm thử đăng nhập đầu cuối.

## Thiết kế vận hành

Schema migration trong drizzle/; không tạo bảng lúc nhận yêu cầu. Seed idempotent trên lần tải đầu của chủ không gian. Ghi sửa dùng version điều kiện và audit được ghi trong batch nguyên tử có operation ID. Tệp được phục vụ như download, không render HTML thực thi. Giới hạn phần mở rộng không thay thế quét mã độc; chưa cấu hình scanner trong bản này.

Khi mở rộng nhiều người, cần chuyển sang workspace membership và kiểm tra role/scope trước khi thay đổi audience. Không mở public để phục vụ dữ liệu nội bộ.
"# qu-n-l-c-ng-vi-c" 
