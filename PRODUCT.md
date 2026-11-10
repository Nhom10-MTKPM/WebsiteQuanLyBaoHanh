# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Master Admin (Quản trị viên):** Chủ cơ sở hoặc quản lý vận hành trung tâm; quản lý toàn bộ nhân sự, danh mục dịch vụ, kho vật tư, thống kê tài chính và điều phối quy trình tiếp nhận/sửa chữa.
- **Kỹ thuật viên (KTV):** Thợ sửa chữa phần cứng/phần mềm PC & Laptop tại bàn kỹ thuật; chẩn đoán bệnh, cập nhật trạng thái sửa chữa, đề xuất linh kiện thay thế, theo dõi lịch trực ca.
- **Nhân viên Tiếp nhận & Bán hàng (Sale / CSKH):** Nhân sự quầy tiếp tân; tiếp nhận thiết bị, tạo biên nhận, tra cứu nhanh tình trạng kho để tư vấn báo giá tức thì và hỗ trợ khách hàng.
- **Quản lý kho (Thủ kho):** Quản lý tồn kho linh kiện thực tế, xuất/nhập kho tự động trừ tồn, xử lý cảnh báo tồn kho tối thiểu, duyệt yêu cầu vật tư đặc thù từ KTV.
- **Khách hàng (User Portal & Khách vãng lai):** Người sở hữu thiết bị cần sửa chữa/bảo hành; tra cứu tiến độ thời gian thực qua mã phiếu (Ticket ID) hoặc QR code, duyệt/từ chối báo giá sửa chữa từ xa, đặt lịch mang máy tới cửa hàng và đánh giá chất lượng phục vụ.

## Product Purpose

Cung cấp giải pháp phần mềm quản lý toàn trình cho trung tâm dịch vụ và cửa hàng sửa chữa, bảo hành máy tính để bàn (PC) và Laptop: minh bạch hóa tiến độ sửa chữa cho khách hàng, tối ưu hóa năng suất phối hợp giữa Tiếp nhận - Kỹ thuật - Kho, và quản lý doanh thu dịch vụ chặt chẽ. Mục tiêu vận hành là quy trình tiếp nhận không sai sót, thời gian xử lý phiếu nhanh chóng, khách hàng an tâm hài lòng và nhân viên thao tác mượt mà không nhầm lẫn vai trò.

## Positioning

Hệ thống quản lý dịch vụ bảo hành PC & Laptop thời gian thực (realtime) tích hợp cơ chế bảo vệ phân quyền 2 tầng độc lập (Zero-Flash Session Caching + Page Authorization Guard), liên kết liền mạch từ tiếp nhận quầy, bàn làm việc KTV, xuất kho tự động cho đến cổng theo dõi trực tiếp và duyệt báo giá dành riêng cho khách hàng mà không phụ thuộc vào hạ tầng backend cồng kềnh.

## Operating Context

- **Môi trường sử dụng:** Quầy lễ tân tiếp nhận máy khách hàng, bàn kỹ thuật sửa chữa phần cứng PC/Laptop, kho linh kiện và thiết bị di động/máy tính của khách hàng.
- **Quy trình hoạt động:** Khách mang máy / Đặt lịch hẹn -> Tiếp nhận tạo phiếu (in mã phiếu & QR code) -> KTV chẩn đoán & đề xuất linh kiện -> Báo giá gửi khách duyệt online qua cổng cá nhân -> KTV nhận linh kiện từ kho & sửa chữa -> Kiểm thử & hoàn tất -> Khách nhận máy, thanh toán và đánh giá.
- **Công nghệ nền tảng:** Kiến trúc Web ứng dụng client-side HTML5/CSS3/JavaScript ES6+, Firebase Firestore (realtime database), Firebase Authentication, Chart.js, SheetJS, Html5-QRCode.

## Capabilities and Constraints

- **Chức năng chính đã xác nhận:**
  - Phân quyền 5 vai trò độc lập: Admin, KTV, CSKH/Sale, Thủ kho, Khách hàng.
  - Quản lý phiếu tiếp nhận (Tickets), tra cứu lịch sử Serial/IMEI, check-in, phân công KTV.
  - Tra cứu tiến độ công khai bằng Mã phiếu + SĐT hoặc quét QR code (`tracking.html`).
  - Quản lý danh mục dịch vụ & linh kiện thay thế kèm bảng giá (`admin/services.html`, `services.html`).
  - Quản lý kho, nhập/xuất tự động trừ tồn kho, cảnh báo mức tồn tối thiểu (`admin/inventory.html`).
  - Lịch làm việc theo ca Sáng/Chiều/Tối cho KTV (`admin/schedules.html`).
  - Thống kê doanh thu, tỷ lệ tiếp nhận PC/Laptop, báo cáo KPI hoàn thành (`admin/reports.html`).
  - Cổng người dùng: theo dõi tiến độ, duyệt/từ chối báo giá, xem lịch sử bảo hành, đánh giá sao.
- **Ràng buộc kỹ thuật:**
  - Bảo mật phiên làm việc: Zero-Flash Session Caching và Page Authorization Guard ngăn ngừa nhảy vai trò (Anti-Role Jumping).
  - Khách hàng đăng ký công khai chỉ được cấp vai trò `khachhang`.
  - Cơ sở dữ liệu và xác thực chạy trên Firebase Client SDK.

## Brand Commitments

- **Tên thương hiệu:** TechCare Pro (Website Quản Lý Bảo Hành & Hỗ Trợ Kỹ Thuật PC & Laptop).
- **Tông giọng & Tính cách:** Đáng tin cậy, chuyên nghiệp, minh bạch, hiện đại, hướng tới dịch vụ kỹ thuật tiêu chuẩn cao.
- **Ngôn ngữ:** Tiếng Việt (chuẩn thuật ngữ chuyên ngành công nghệ thông tin và dịch vụ bảo hành máy tính).

## Evidence on Hand

- Tài liệu hướng dẫn sử dụng và kiến trúc hệ thống chi tiết tại `HUONG_DAN_SU_DUNG.md`.
- Toàn bộ giao diện các phân hệ hoàn chỉnh:
  - Cổng đăng nhập & tra cứu: `index.html`, `register.html`, `forgot-password.html`, `services.html`, `tracking.html`.
  - Phân hệ Quản trị: `admin/dashboard.html`, `admin/ktv-workspace.html`, `admin/sale-workspace.html`, `admin/warehouse.html`, `admin/tickets.html`, `admin/services.html`, `admin/employees.html`, `admin/schedules.html`, `admin/inventory.html`, `admin/reports.html`.
  - Phân hệ Khách hàng: `user/dashboard.html`, `user/profile.html`, `user/new-request.html`, `user/my-tickets.html`, `user/history.html`, `user/notifications.html`, `user/reviews.html`.
- Script khởi chạy web nội bộ: `chay-website.bat`, `server.js`.

## Product Principles

1. **Minh bạch tuyệt đối với khách hàng:** Mọi trạng thái phiếu, chi phí linh kiện và kết quả chẩn đoán đều hiển thị rõ ràng, khách hàng có quyền chủ động duyệt hoặc từ chối báo giá trước khi can thiệp phần cứng.
2. **Liền mạch giữa các bộ phận:** Thông tin truyền tải tức thì giữa Tiếp nhận - Kỹ thuật - Kho; giảm tối đa thời gian chờ đợi và sai lệch thông tin vật tư.
3. **Phân quyền chặt chẽ, an toàn:** Đảm bảo dữ liệu kinh doanh và chức năng quản trị chỉ dành cho đúng đối tượng được phân công, ngăn chặn hoàn toàn việc can thiệp trái vai trò.
4. **Trực quan & Tinh gọn (Anti-Slop):** Ưu tiên độ tương phản cao, typography rõ ràng dễ đọc trên cả màn hình máy tính bàn kỹ thuật lẫn điện thoại khách hàng; loại bỏ các thành phần trang trí thừa thãi làm chậm quy trình thao tác.
