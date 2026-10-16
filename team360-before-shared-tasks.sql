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
CREATE TABLE workspaces (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
INSERT INTO "workspaces" VALUES('08ec4ccb-bc43-4a98-b8c1-4acd650fe682','test','local_seedy','2026-10-16T01:44:48.435Z','2026-10-16T01:44:48.435Z');
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
CREATE INDEX `owner_kind_idx` ON `records` (`owner`,`kind`);
CREATE INDEX memberships_user_idx
ON memberships(user_id);
CREATE INDEX memberships_role_idx
ON memberships(workspace_id, role);