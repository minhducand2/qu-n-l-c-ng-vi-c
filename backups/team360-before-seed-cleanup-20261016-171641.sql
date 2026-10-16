PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE `records` (
	`key` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`kind` text NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL
);
INSERT INTO "records" VALUES('local_seedy:d0','local_seedy','department','{"id":"d0","name":"Phòng TCHC","fullName":"Tổ chức Hành chính","color":"#7960d8","active":true,"kind":"department"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:d1','local_seedy','department','{"id":"d1","name":"Phòng QLKT TTHCTL","fullName":"Quản lý và Khai thác Trung tâm Hội chợ triển lãm","color":"#389ab0","active":true,"kind":"department"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:d2','local_seedy','department','{"id":"d2","name":"Phòng KC TVPTCN","fullName":"Khuyến công và Tư vấn PTCN","color":"#d69435","active":true,"kind":"department"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:d3','local_seedy','department','{"id":"d3","name":"Phòng XTTM","fullName":"Xúc tiến thương mại","color":"#427bdf","active":true,"kind":"department"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:d4','local_seedy','department','{"id":"d4","name":"Phòng QLCCN","fullName":"Quản lý Cụm công nghiệp","color":"#49a47c","active":true,"kind":"department"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p5','local_seedy','person','{"id":"p5","name":"Đỗ Việt Hồng","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p6','local_seedy','person','{"id":"p6","name":"Đinh Văn Phúc","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p7','local_seedy','person','{"id":"p7","name":"Lê Vĩnh An","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p9','local_seedy','person','{"id":"p9","name":"Nguyễn Thị Phượng","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p10','local_seedy','person','{"id":"p10","name":"Nguyễn Thị Hồng Thảo","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p11','local_seedy','person','{"id":"p11","name":"Nguyễn Duy Đại","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p12','local_seedy','person','{"id":"p12","name":"Huỳnh Thị Thu Trang","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p13','local_seedy','person','{"id":"p13","name":"Trần Thị Tưởng","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p14','local_seedy','person','{"id":"p14","name":"Nguyễn Thị Thanh Phương","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p15','local_seedy','person','{"id":"p15","name":"Nguyễn Đăng Phụng","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p17','local_seedy','person','{"id":"p17","name":"Hồ Lộc Bình","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p18','local_seedy','person','{"id":"p18","name":"Doãn Thị Mỹ Ngọc","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p19','local_seedy','person','{"id":"p19","name":"Trịnh Văn Dư","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p20','local_seedy','person','{"id":"p20","name":"Nguyễn Thị Quỳnh Châu","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p21','local_seedy','person','{"id":"p21","name":"Lê Thị Thanh Trang","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p22','local_seedy','person','{"id":"p22","name":"Lương Ngọc Sáng","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p23','local_seedy','person','{"id":"p23","name":"Nguyễn Thanh Quang","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p25','local_seedy','person','{"id":"p25","name":"Nguyễn Thị Thanh Xuân","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p26','local_seedy','person','{"id":"p26","name":"Huỳnh Thị Hoài Trang","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p27','local_seedy','person','{"id":"p27","name":"Phan Thanh Tùng","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p28','local_seedy','person','{"id":"p28","name":"Trần Thị Phương Thảo","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p29','local_seedy','person','{"id":"p29","name":"Lê Đăng Tùng","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p30','local_seedy','person','{"id":"p30","name":"Nguyễn Thị Lệ","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p31','local_seedy','person','{"id":"p31","name":"Nguyễn Phước Ái Chi","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p33','local_seedy','person','{"id":"p33","name":"Trương Quang Trung","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p34','local_seedy','person','{"id":"p34","name":"Nguyễn Thanh Xuân","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p35','local_seedy','person','{"id":"p35","name":"Lê Đình Đức","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p36','local_seedy','person','{"id":"p36","name":"Trần Thị Trang","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p37','local_seedy','person','{"id":"p37","name":"Võ Thuỳ Lan","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p39','local_seedy','person','{"id":"p39","name":"Phan Xuân Hoàng","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p40','local_seedy','person','{"id":"p40","name":"Võ Thị Thu Trâm","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p41','local_seedy','person','{"id":"p41","name":"Hồ Thị Mỹ Hạnh","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p42','local_seedy','person','{"id":"p42","name":"Phạm Thị Như Hương","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:p43','local_seedy','person','{"id":"p43","name":"Phan Văn Thiện","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:source-6','local_seedy','task','{"description":"","start":"2025-10-13","due":"2025-10-15","owner":"p25","progress":0,"result":"","checklist":[],"archived":false,"priority":"Cao","status":"Xem xét","review":true,"id":"source-6","kind":"task","code":"CV-0001","title":"Đề xuất kinh phí XTTM 20226 (Phiếu trình P.QLTM)","department":"d3","type":"Phối hợp điều hành TĐNB","source":"Bảng phân công · dòng 6","reviewNote":"Cần xác nhận chuỗi năm “20226”, ngày năm 2025 và ý nghĩa trạng thái Xem xét."}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:source-7','local_seedy','task','{"description":"Kc A Phúc PGĐ chỉ đạo rà soát, xử lý sớm để đảm bảo kết quả thực hiện KHKPKCĐP năm 2026; PKCTV tham mưu xử lý, tổng hợp các trường hợp xin dừng báo cáo về Sở và đề xuất xử lý trước 20/10/2026./.","start":"","due":"2026-10-20","owner":"","progress":0,"result":"","checklist":[],"archived":false,"priority":"Cao","status":"Chưa bắt đầu","review":true,"id":"source-7","kind":"task","code":"CV-0002","title":"Đơn xin dừng thực hiện đề án khuyến công địa phương năm 2026 (HTX Nông nghiệp, Sản xuât và thương mại Mộc Khánh Phong)","department":"d2","type":"Bút phê xử lý VB đến","source":"Bảng phân công · dòng 7","reviewNote":"Cần chọn người phụ trách và xác minh người chỉ đạo; làm rõ mốc “trước 20/10”."}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:source-8','local_seedy','task','{"description":"TTKC bổ sung dự kiến kinh phí, hoàn thiện KH, trình lại trước 20/10.","start":"","due":"","owner":"","progress":0,"result":"","checklist":[],"archived":false,"priority":"Chưa xác định","status":"Chưa xác định","review":true,"id":"source-8","kind":"task","code":"CV-0003","title":"Dự thảo KH Made in Đà Nẵng (Tờ trình 46/TTr-TTKCXT - 06/10/2026)","department":"d3","type":"Phối hợp điều hành TĐNB","source":"Bảng phân công · dòng 8","reviewNote":"Hạn chỉ xuất hiện trong chỉ đạo, chưa có năm xác nhận. Thiếu người phụ trách, trạng thái và ưu tiên."}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:source-5','local_seedy','plan','{"id":"source-5","kind":"plan","name":"Danh mục công việc QIII, QIV","department":"d0","description":"Nguồn: Bảng phân công dòng 5. Cần xác nhận đây là tên kế hoạch hay nhiệm vụ và năm áp dụng.","review":true}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:prefs','local_seedy','settings','{"id":"prefs","kind":"settings","name":"TEAM360","remindDays":3}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:initialized','local_seedy','internal','{}',1,'2026-10-15T10:13:50.678Z');
INSERT INTO "records" VALUES('local_seedy:005036ac-6a85-4ca7-836c-e8093722feda','local_seedy','department','{"id":"005036ac-6a85-4ca7-836c-e8093722feda","kind":"department","name":"test phòng ban","fullName":"test phòng ban","color":"#16846b","active":true,"_operation":"ba2886b0-a043-4c12-8c05-1dbdfc54b943"}',1,'2026-10-16T04:44:53.719Z');
INSERT INTO "records" VALUES('local_seedy:257a3a5a-6ec6-430b-8c09-a6f7702248bb','local_seedy','audit','{"id":"257a3a5a-6ec6-430b-8c09-a6f7702248bb","kind":"audit","entityId":"005036ac-6a85-4ca7-836c-e8093722feda","title":"test phòng ban","action":"Tạo mới","author":"Seedy","reason":"","before":null,"after":{"id":"005036ac-6a85-4ca7-836c-e8093722feda","kind":"department","name":"test phòng ban","fullName":"test phòng ban","color":"#16846b","active":true,"_operation":"ba2886b0-a043-4c12-8c05-1dbdfc54b943"}}',1,'2026-10-16T04:44:53.719Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:d0','usr_a2529442a197439cbdf3f25960b8739d','department','{"id":"d0","name":"Phòng TCHC","fullName":"Tổ chức Hành chính","color":"#7960d8","active":true,"kind":"department"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:d1','usr_a2529442a197439cbdf3f25960b8739d','department','{"id":"d1","name":"Phòng QLKT TTHCTL","fullName":"Quản lý và Khai thác Trung tâm Hội chợ triển lãm","color":"#389ab0","active":true,"kind":"department"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:d2','usr_a2529442a197439cbdf3f25960b8739d','department','{"id":"d2","name":"Phòng KC TVPTCN","fullName":"Khuyến công và Tư vấn PTCN","color":"#d69435","active":true,"kind":"department"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:d3','usr_a2529442a197439cbdf3f25960b8739d','department','{"id":"d3","name":"Phòng XTTM","fullName":"Xúc tiến thương mại","color":"#427bdf","active":true,"kind":"department"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:d4','usr_a2529442a197439cbdf3f25960b8739d','department','{"id":"d4","name":"Phòng QLCCN","fullName":"Quản lý Cụm công nghiệp","color":"#49a47c","active":true,"kind":"department"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p5','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p5","name":"Đỗ Việt Hồng","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p6','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p6","name":"Đinh Văn Phúc","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p7','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p7","name":"Lê Vĩnh An","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p9','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p9","name":"Nguyễn Thị Phượng","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p10','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p10","name":"Nguyễn Thị Hồng Thảo","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p11','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p11","name":"Nguyễn Duy Đại","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p12','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p12","name":"Huỳnh Thị Thu Trang","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p13','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p13","name":"Trần Thị Tưởng","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p14','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p14","name":"Nguyễn Thị Thanh Phương","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p15','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p15","name":"Nguyễn Đăng Phụng","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p17','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p17","name":"Hồ Lộc Bình","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p18','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p18","name":"Doãn Thị Mỹ Ngọc","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p19','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p19","name":"Trịnh Văn Dư","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p20','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p20","name":"Nguyễn Thị Quỳnh Châu","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p21','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p21","name":"Lê Thị Thanh Trang","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p22','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p22","name":"Lương Ngọc Sáng","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p23','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p23","name":"Nguyễn Thanh Quang","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p25','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p25","name":"Nguyễn Thị Thanh Xuân","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p26','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p26","name":"Huỳnh Thị Hoài Trang","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p27','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p27","name":"Phan Thanh Tùng","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p28','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p28","name":"Trần Thị Phương Thảo","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p29','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p29","name":"Lê Đăng Tùng","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p30','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p30","name":"Nguyễn Thị Lệ","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p31','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p31","name":"Nguyễn Phước Ái Chi","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p33','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p33","name":"Trương Quang Trung","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p34','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p34","name":"Nguyễn Thanh Xuân","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p35','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p35","name":"Lê Đình Đức","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p36','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p36","name":"Trần Thị Trang","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p37','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p37","name":"Võ Thuỳ Lan","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p39','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p39","name":"Phan Xuân Hoàng","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p40','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p40","name":"Võ Thị Thu Trâm","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p41','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p41","name":"Hồ Thị Mỹ Hạnh","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p42','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p42","name":"Phạm Thị Như Hương","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:p43','usr_a2529442a197439cbdf3f25960b8739d','person','{"id":"p43","name":"Phan Văn Thiện","department":"","position":"","email":"","active":true,"kind":"person"}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:source-6','usr_a2529442a197439cbdf3f25960b8739d','task','{"description":"","start":"2025-10-13","due":"2025-10-15","owner":"p25","progress":0,"result":"","checklist":[],"archived":false,"priority":"Cao","status":"Xem xét","review":true,"id":"source-6","kind":"task","code":"CV-0001","title":"Đề xuất kinh phí XTTM 20226 (Phiếu trình P.QLTM)","department":"d3","type":"Phối hợp điều hành TĐNB","source":"Bảng phân công · dòng 6","reviewNote":"Cần xác nhận chuỗi năm “20226”, ngày năm 2025 và ý nghĩa trạng thái Xem xét."}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:source-7','usr_a2529442a197439cbdf3f25960b8739d','task','{"description":"Kc A Phúc PGĐ chỉ đạo rà soát, xử lý sớm để đảm bảo kết quả thực hiện KHKPKCĐP năm 2026; PKCTV tham mưu xử lý, tổng hợp các trường hợp xin dừng báo cáo về Sở và đề xuất xử lý trước 20/10/2026./.","start":"","due":"2026-10-20","owner":"","progress":0,"result":"","checklist":[],"archived":false,"priority":"Cao","status":"Chưa bắt đầu","review":true,"id":"source-7","kind":"task","code":"CV-0002","title":"Đơn xin dừng thực hiện đề án khuyến công địa phương năm 2026 (HTX Nông nghiệp, Sản xuât và thương mại Mộc Khánh Phong)","department":"d2","type":"Bút phê xử lý VB đến","source":"Bảng phân công · dòng 7","reviewNote":"Cần chọn người phụ trách và xác minh người chỉ đạo; làm rõ mốc “trước 20/10”."}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:source-8','usr_a2529442a197439cbdf3f25960b8739d','task','{"description":"TTKC bổ sung dự kiến kinh phí, hoàn thiện KH, trình lại trước 20/10.","start":"","due":"","owner":"","progress":0,"result":"","checklist":[],"archived":false,"priority":"Chưa xác định","status":"Chưa xác định","review":true,"id":"source-8","kind":"task","code":"CV-0003","title":"Dự thảo KH Made in Đà Nẵng (Tờ trình 46/TTr-TTKCXT - 06/10/2026)","department":"d3","type":"Phối hợp điều hành TĐNB","source":"Bảng phân công · dòng 8","reviewNote":"Hạn chỉ xuất hiện trong chỉ đạo, chưa có năm xác nhận. Thiếu người phụ trách, trạng thái và ưu tiên."}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:source-5','usr_a2529442a197439cbdf3f25960b8739d','plan','{"id":"source-5","kind":"plan","name":"Danh mục công việc QIII, QIV","department":"d0","description":"Nguồn: Bảng phân công dòng 5. Cần xác nhận đây là tên kế hoạch hay nhiệm vụ và năm áp dụng.","review":true}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:prefs','usr_a2529442a197439cbdf3f25960b8739d','settings','{"id":"prefs","kind":"settings","name":"TEAM360","remindDays":3}',1,'2026-10-16T09:34:15.615Z');
INSERT INTO "records" VALUES('usr_a2529442a197439cbdf3f25960b8739d:initialized','usr_a2529442a197439cbdf3f25960b8739d','internal','{}',1,'2026-10-16T09:34:15.615Z');
CREATE TABLE workspaces (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
INSERT INTO "workspaces" VALUES('08ec4ccb-bc43-4a98-b8c1-4acd650fe682','test','local_seedy','2026-10-16T01:44:48.435Z','2026-10-16T01:44:48.435Z');
INSERT INTO "workspaces" VALUES('ws_b1fc9237a2c642beb5e4a79f90c99f15','admin1','usr_a2529442a197439cbdf3f25960b8739d','2026-10-16T08:32:23.354Z','2026-10-16T08:32:23.354Z');
CREATE TABLE memberships (
    workspace_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL
        CHECK (role IN (
            'admin',
            'leader',
            'manager',
            'member',
            'viewer'
        )),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended')),
    joined_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, user_id),
    FOREIGN KEY (workspace_id)
        REFERENCES workspaces(id)
);
INSERT INTO "memberships" VALUES('08ec4ccb-bc43-4a98-b8c1-4acd650fe682','local_seedy','admin','active','2026-10-16T01:44:48.435Z');
INSERT INTO "memberships" VALUES('ws_b1fc9237a2c642beb5e4a79f90c99f15','usr_a2529442a197439cbdf3f25960b8739d','admin','active','2026-10-16T08:32:23.354Z');
CREATE TABLE shared_tasks (
 id TEXT PRIMARY KEY NOT NULL,
 workspace_id TEXT NOT NULL REFERENCES workspaces(id),
 title TEXT NOT NULL,
 data TEXT NOT NULL,
 assigned_to TEXT,
 created_by TEXT NOT NULL,
 version INTEGER NOT NULL DEFAULT 1,
 archived INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 FOREIGN KEY (workspace_id, assigned_to) REFERENCES memberships(workspace_id, user_id)
);
INSERT INTO "shared_tasks" VALUES('d6d8177e-0d84-48ca-a34c-3e0dd8684fb8','08ec4ccb-bc43-4a98-b8c1-4acd650fe682','test','{"kind":"task","title":"test","description":"test","status":"Hoàn thành","priority":"Trung bình","start":"2026-10-14","due":"2026-10-28","progress":100,"result":"test","cancelReason":"","assignedTo":null,"submittedAt":null,"completedAt":"2026-10-16T04:01:32.095Z","reviewedAt":"2026-10-16T04:01:32.095Z","reviewedBy":"local_seedy","reviewAction":"approve","reviewReason":""}',NULL,'local_seedy',4,0,'2026-10-16T02:55:06.715Z','2026-10-16T04:01:32.095Z');
INSERT INTO "shared_tasks" VALUES('c2eb718d-d21c-4182-829a-adbc524398f4','08ec4ccb-bc43-4a98-b8c1-4acd650fe682','Kiểm tra giao việc theo danh bạ','{"kind":"task","title":"Kiểm tra giao việc theo danh bạ","description":"test 1","status":"Chưa bắt đầu","priority":"Trung bình","start":"","due":"","progress":0,"result":"","cancelReason":"","assignedTo":"local_seedy"}','local_seedy','local_seedy',1,0,'2026-10-16T06:49:58.006Z','2026-10-16T06:49:58.006Z');
CREATE TABLE shared_task_audit (
 id TEXT PRIMARY KEY NOT NULL,
 workspace_id TEXT NOT NULL REFERENCES workspaces(id),
 task_id TEXT NOT NULL REFERENCES shared_tasks(id),
 actor_id TEXT NOT NULL,
 action TEXT NOT NULL,
 before_data TEXT,
 after_data TEXT NOT NULL,
 created_at TEXT NOT NULL
);
INSERT INTO "shared_task_audit" VALUES('619cc0ba-f92b-4f5e-9e1e-132eba798b85','08ec4ccb-bc43-4a98-b8c1-4acd650fe682','d6d8177e-0d84-48ca-a34c-3e0dd8684fb8','local_seedy','create',NULL,'{"kind":"task","title":"test","description":"test","status":"Đang thực hiện","priority":"Trung bình","start":"2026-10-14","due":"2026-10-28","progress":2,"result":"test","cancelReason":"","assignedTo":null}','2026-10-16T02:55:06.715Z');
INSERT INTO "shared_task_audit" VALUES('82af1ff3-1694-4fa9-8e34-8fa4a6d11bfa','08ec4ccb-bc43-4a98-b8c1-4acd650fe682','d6d8177e-0d84-48ca-a34c-3e0dd8684fb8','local_seedy','update','{"kind":"task","title":"test","description":"test","status":"Đang thực hiện","priority":"Trung bình","start":"2026-10-14","due":"2026-10-28","progress":2,"result":"test","cancelReason":"","assignedTo":null}','{"kind":"task","title":"test","description":"test","status":"Đang thực hiện","priority":"Trung bình","start":"2026-10-14","due":"2026-10-28","progress":10,"result":"test","cancelReason":"","assignedTo":null}','2026-10-16T03:18:43.762Z');
INSERT INTO "shared_task_audit" VALUES('1136dbec-2123-4e3a-8dea-2acae2fbe1e7','08ec4ccb-bc43-4a98-b8c1-4acd650fe682','d6d8177e-0d84-48ca-a34c-3e0dd8684fb8','local_seedy','submit','{"kind":"task","title":"test","description":"test","status":"Đang thực hiện","priority":"Trung bình","start":"2026-10-14","due":"2026-10-28","progress":10,"result":"test","cancelReason":"","assignedTo":null}','{"kind":"task","title":"test","description":"test","status":"Chờ duyệt","priority":"Trung bình","start":"2026-10-14","due":"2026-10-28","progress":10,"result":"test","cancelReason":"","assignedTo":null,"submittedAt":"2026-10-16T04:00:38.512Z"}','2026-10-16T04:00:38.512Z');
INSERT INTO "shared_task_audit" VALUES('21ea8e2b-5f00-4b70-a5bc-811cfd65a6cd','08ec4ccb-bc43-4a98-b8c1-4acd650fe682','d6d8177e-0d84-48ca-a34c-3e0dd8684fb8','local_seedy','approve','{"kind":"task","title":"test","description":"test","status":"Chờ duyệt","priority":"Trung bình","start":"2026-10-14","due":"2026-10-28","progress":10,"result":"test","cancelReason":"","assignedTo":null,"submittedAt":"2026-10-16T04:00:38.512Z"}','{"kind":"task","title":"test","description":"test","status":"Hoàn thành","priority":"Trung bình","start":"2026-10-14","due":"2026-10-28","progress":100,"result":"test","cancelReason":"","assignedTo":null,"submittedAt":null,"completedAt":"2026-10-16T04:01:32.095Z","reviewedAt":"2026-10-16T04:01:32.095Z","reviewedBy":"local_seedy","reviewAction":"approve","reviewReason":""}','2026-10-16T04:01:32.095Z');
INSERT INTO "shared_task_audit" VALUES('55a7b096-14fb-43b0-ab8d-e2c27101d828','08ec4ccb-bc43-4a98-b8c1-4acd650fe682','c2eb718d-d21c-4182-829a-adbc524398f4','local_seedy','create',NULL,'{"kind":"task","title":"Kiểm tra giao việc theo danh bạ","description":"test 1","status":"Chưa bắt đầu","priority":"Trung bình","start":"","due":"","progress":0,"result":"","cancelReason":"","assignedTo":"local_seedy"}','2026-10-16T06:49:58.006Z');
CREATE TABLE workspace_member_profiles (
 workspace_id TEXT NOT NULL,
 user_id TEXT NOT NULL,
 display_name TEXT NOT NULL,
 department_name TEXT NOT NULL DEFAULT '',
 account_claimed_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 updated_by TEXT NOT NULL,
 PRIMARY KEY (workspace_id, user_id),
 FOREIGN KEY (workspace_id, user_id) REFERENCES memberships(workspace_id, user_id) ON DELETE CASCADE
);
INSERT INTO "workspace_member_profiles" VALUES('08ec4ccb-bc43-4a98-b8c1-4acd650fe682','local_seedy','test Quản trị viên','','2026-10-16T04:41:43.848Z','2026-10-16T04:41:43.848Z','local_seedy');
CREATE TABLE auth_users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    password_changed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
INSERT INTO "auth_users" VALUES('usr_a2529442a197439cbdf3f25960b8739d','minhducpvm@gmail.com','pbkdf2-sha256$600000$34e37020533b80f48edf3b4467ade400$2ec460790934fcf2539eeeafbb5d89d8858c2b9e98c0fea97349f8a3b8758a6b','minhduc','active','2026-10-16T08:32:23.354Z','2026-10-16T08:32:23.354Z','2026-10-16T08:32:23.354Z');
CREATE TABLE auth_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    CHECK (expires_at > created_at)
);
INSERT INTO "auth_sessions" VALUES('2d303295-99c0-4613-9957-fd20f9b32b88','usr_a2529442a197439cbdf3f25960b8739d','19a795f190b475fd2d4f9fdb466060a993db500d9a09950f79aa73fafc1012f0','2026-10-16T08:48:56.775Z','2026-10-16T20:48:56.775Z','2026-10-16T08:48:56.878Z');
INSERT INTO "auth_sessions" VALUES('a0aa14c7-4e2d-46eb-902c-9a12a808b119','usr_a2529442a197439cbdf3f25960b8739d','31ac55294f91bc5616da73791badbff80b0efbbdf3ec2d958eb5e89933cfb70e','2026-10-16T08:57:28.183Z','2026-10-16T20:57:28.183Z','2026-10-16T08:57:58.575Z');
INSERT INTO "auth_sessions" VALUES('0cdcee3a-0a7f-4155-9efa-4e543c8aa251','usr_a2529442a197439cbdf3f25960b8739d','867d4af47da5c6154fbd17d125bccc83f1d227da94611017bd67ca4b7c6c3ccb','2026-10-16T09:00:06.424Z','2026-10-16T21:00:06.424Z','2026-10-16T09:00:27.187Z');
INSERT INTO "auth_sessions" VALUES('b6f7d451-a77a-4e3f-933a-780267a32f64','usr_a2529442a197439cbdf3f25960b8739d','38ff5f7e17e91c806303311d965d97420c4bf987903de73fc67f1ae4843dc302','2026-10-16T09:03:52.536Z','2026-10-16T21:03:52.536Z','2026-10-16T09:47:12.642Z');
INSERT INTO "auth_sessions" VALUES('5d38c5a2-2fc5-40f4-9728-213a434a00a6','usr_a2529442a197439cbdf3f25960b8739d','09983cdfed052688b066fcde54d304fba40eb67299f1d16a584d463db7dc6d8c','2026-10-16T09:47:14.748Z','2026-10-16T21:47:14.748Z',NULL);
CREATE TABLE auth_login_limits (
  account_key TEXT PRIMARY KEY NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  window_started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
INSERT INTO "auth_login_limits" VALUES('ddf52ae3afc5d8b07f57607ea47d323e98605972ddc0f6fe2afaea9441a2e79b',1,'2026-10-16T09:47:14.316Z','2026-10-16T09:47:14.316Z');
INSERT INTO "auth_login_limits" VALUES('ea0432e3a971f4f0c3e86115c6b84139ecda1f2ae8e713007294bae818764cad',1,'2026-10-16T08:56:59.402Z','2026-10-16T08:56:59.402Z');
CREATE INDEX `owner_kind_idx` ON `records` (`owner`,`kind`);
CREATE INDEX memberships_user_idx
ON memberships(user_id);
CREATE INDEX memberships_role_idx
ON memberships(workspace_id, role);
CREATE INDEX shared_tasks_workspace_idx ON shared_tasks(workspace_id, archived, updated_at);
CREATE INDEX shared_tasks_assignee_idx ON shared_tasks(workspace_id, assigned_to);
CREATE INDEX shared_task_audit_task_idx ON shared_task_audit(workspace_id, task_id, created_at);
CREATE INDEX member_profiles_department_idx ON workspace_member_profiles(workspace_id,department_name);
CREATE INDEX auth_sessions_user_idx
ON auth_sessions(user_id);
CREATE INDEX auth_sessions_expires_idx
ON auth_sessions(expires_at);
CREATE INDEX auth_login_limits_updated_idx ON auth_login_limits(updated_at);